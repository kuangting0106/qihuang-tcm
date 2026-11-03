import { createServer } from 'node:http'
import { mkdir, readFile, rename, writeFile, readdir, unlink, stat } from 'node:fs/promises'
import path from 'node:path'

const PORT = Number(process.env.QIHUANG_API_PORT ?? 8787)
const DATA_FILE =
  process.env.QIHUANG_DATA_FILE ?? path.join(process.cwd(), 'data', 'notes.json')
const EDIT_KEY = process.env.QIHUANG_EDIT_KEY ?? 'dev-key'
const MAX_BODY = 256 * 1024
const BACKUP_DIR = path.join(path.dirname(DATA_FILE), 'backups')
const MAX_BACKUPS = 50
const ROLES = new Set(['君', '臣', '佐', '使', '佐使', '未标注'])

const EMPTY = () => ({
  symptomAnnotations: {},
  herbNotes: {},
  herbRoles: {},
  updatedAt: null,
})

let cache = null

async function readStore() {
  if (cache) return cache
  try {
    const raw = await readFile(DATA_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    cache = {
      ...EMPTY(),
      ...parsed,
      symptomAnnotations: parsed.symptomAnnotations ?? {},
      herbNotes: parsed.herbNotes ?? {},
      herbRoles: parsed.herbRoles ?? {},
    }
  } catch {
    cache = EMPTY()
  }
  return cache
}

async function backupCurrent() {
  try {
    const raw = await readFile(DATA_FILE, 'utf8')
    await mkdir(BACKUP_DIR, { recursive: true })
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    await writeFile(path.join(BACKUP_DIR, `notes-${stamp}.json`), raw)
    const names = (await readdir(BACKUP_DIR))
      .filter((name) => /^notes-.*\.json$/.test(name))
      .sort()
    while (names.length > MAX_BACKUPS) {
      await unlink(path.join(BACKUP_DIR, names.shift())).catch(() => {})
    }
  } catch {
    // 首次写入或备份不可用时，不阻断正常保存。
  }
}

async function writeStore(next) {
  await backupCurrent()
  await mkdir(path.dirname(DATA_FILE), { recursive: true })
  const temp = `${DATA_FILE}.tmp`
  await writeFile(temp, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
  await rename(temp, DATA_FILE)
  cache = next
}

function send(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type, x-qihuang-key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  })
  res.end(payload)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY) {
        reject(new Error('body-too-large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function cleanText(value, max) {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim().slice(0, max)
}

function cleanId(value) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, 120)
}

function upsertSymptom(store, body) {
  const scopeKey = cleanId(body.scopeKey)
  const phrase = cleanText(body.annotation?.phrase, 40)
  const note = cleanText(body.annotation?.note, 240)
  if (!scopeKey || !phrase || !note) throw new Error('invalid-annotation')
  const start =
    Number.isInteger(body.annotation?.start) && body.annotation.start >= 0
      ? body.annotation.start
      : undefined
  const list = Array.isArray(store.symptomAnnotations[scopeKey])
    ? [...store.symptomAnnotations[scopeKey]]
    : []
  const index = list.findIndex(
    (item) => item.phrase === phrase && item.start === start,
  )
  const entry = {
    id:
      index >= 0
        ? list[index].id
        : `public-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    phrase,
    note,
    start,
    updatedAt: new Date().toISOString(),
  }
  if (index >= 0) list[index] = entry
  else list.push(entry)
  store.symptomAnnotations[scopeKey] = list
}

function deleteSymptom(store, body) {
  const scopeKey = cleanId(body.scopeKey)
  const phrase = cleanText(body.phrase, 40)
  if (!scopeKey || !phrase) throw new Error('invalid-annotation')
  const start = Number.isInteger(body.start) && body.start >= 0 ? body.start : undefined
  const list = (store.symptomAnnotations[scopeKey] ?? []).filter(
    (item) => !(item.phrase === phrase && item.start === start),
  )
  if (list.length) store.symptomAnnotations[scopeKey] = list
  else delete store.symptomAnnotations[scopeKey]
}

function setHerbNote(store, body) {
  const formulaId = cleanId(body.formulaId)
  const herbId = cleanId(body.herbId)
  if (!formulaId || !herbId) throw new Error('invalid-herb')
  const note = cleanText(body.note, 240)
  const book = { ...(store.herbNotes[formulaId] ?? {}) }
  if (note) book[herbId] = note
  else delete book[herbId]
  if (Object.keys(book).length) store.herbNotes[formulaId] = book
  else delete store.herbNotes[formulaId]
}

function setHerbRole(store, body) {
  const formulaId = cleanId(body.formulaId)
  const herbId = cleanId(body.herbId)
  const role = cleanText(body.role, 8)
  if (!formulaId || !herbId) throw new Error('invalid-herb')
  if (!ROLES.has(role)) throw new Error('invalid-role')
  const book = { ...(store.herbRoles[formulaId] ?? {}) }
  if (role === '未标注') delete book[herbId]
  else book[herbId] = role
  if (Object.keys(book).length) store.herbRoles[formulaId] = book
  else delete store.herbRoles[formulaId]
}

function resetHerb(store, body) {
  const formulaId = cleanId(body.formulaId)
  const herbId = cleanId(body.herbId)
  if (!formulaId || !herbId) throw new Error('invalid-herb')
  for (const key of ['herbNotes', 'herbRoles']) {
    const book = { ...(store[key][formulaId] ?? {}) }
    delete book[herbId]
    if (Object.keys(book).length) store[key][formulaId] = book
    else delete store[key][formulaId]
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)

  if (req.method === 'OPTIONS') {
    send(res, 204, {})
    return
  }

  if (url.pathname === '/api/health') {
    send(res, 200, { ok: true })
    return
  }

  if (url.pathname === '/api/notes/backups' && req.method === 'GET') {
    try {
      const entries = await readdir(BACKUP_DIR).catch(() => [])
      const backups = await Promise.all(
        entries
          .filter((name) => name.endsWith('.json'))
          .map(async (name) => {
            const info = await stat(path.join(BACKUP_DIR, name))
            return { name, size: info.size, updatedAt: info.mtime.toISOString() }
          }),
      )
      backups.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      send(res, 200, { backups })
    } catch {
      send(res, 500, { error: 'backup-list-failed' })
    }
    return
  }

  if (url.pathname === '/api/notes/restore') {
    if (req.method !== 'POST') {
      send(res, 405, { error: 'method-not-allowed' })
      return
    }
    if ((req.headers['x-qihuang-key'] ?? '') !== EDIT_KEY) {
      send(res, 401, { error: 'invalid-edit-key' })
      return
    }
    try {
      const body = JSON.parse(await readBody(req))
      const backup = path.basename(cleanText(body.backup, 120))
      if (!backup || backup !== body.backup) throw new Error('invalid-backup')
      const parsed = JSON.parse(await readFile(path.join(BACKUP_DIR, backup), 'utf8'))
      const next = { ...EMPTY(), ...parsed, updatedAt: new Date().toISOString() }
      await writeStore(next)
      send(res, 200, next)
    } catch {
      send(res, 400, { error: 'restore-failed' })
    }
    return
  }

  if (url.pathname !== '/api/notes') {
    send(res, 404, { error: 'not-found' })
    return
  }

  if (req.method === 'GET') {
    send(res, 200, await readStore())
    return
  }

  if (req.method !== 'POST') {
    send(res, 405, { error: 'method-not-allowed' })
    return
  }

  if ((req.headers['x-qihuang-key'] ?? '') !== EDIT_KEY) {
    send(res, 401, { error: 'invalid-edit-key' })
    return
  }

  let body
  try {
    body = JSON.parse(await readBody(req))
  } catch {
    send(res, 400, { error: 'invalid-json' })
    return
  }

  const store = await readStore()
  try {
    switch (body?.op) {
      case 'symptom-upsert':
        upsertSymptom(store, body)
        break
      case 'symptom-delete':
        deleteSymptom(store, body)
        break
      case 'herb-note':
        setHerbNote(store, body)
        break
      case 'herb-role':
        setHerbRole(store, body)
        break
      case 'herb-reset':
        resetHerb(store, body)
        break
      default:
        send(res, 400, { error: 'invalid-op' })
        return
    }
    const next = { ...store, updatedAt: new Date().toISOString() }
    await writeStore(next)
    send(res, 200, next)
  } catch (error) {
    send(res, 400, { error: error instanceof Error ? error.message : 'invalid' })
  }
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`notes api listening on http://0.0.0.0:${PORT}`)
  console.log(`data file: ${DATA_FILE}`)
})
