import { createServer } from 'node:http'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { mkdir, readFile, rename, writeFile, readdir, unlink, stat } from 'node:fs/promises'
import path from 'node:path'

const PORT = Number(process.env.QIHUANG_API_PORT ?? 8787)
const DATA_FILE =
  process.env.QIHUANG_DATA_FILE ?? path.join(process.cwd(), 'data', 'notes.json')
const DB_FILE =
  process.env.QIHUANG_DB_FILE ?? path.join(process.cwd(), 'data', 'qihuang.db')
const LIBRARY_DB_FILE =
  process.env.QIHUANG_LIBRARY_DB_FILE ??
  path.join(process.cwd(), 'data', 'classic-library.db')
const EDIT_KEY = process.env.QIHUANG_EDIT_KEY ?? 'dev-key'
const MAX_BODY = 256 * 1024
const BACKUP_DIR = path.join(path.dirname(DATA_FILE), 'backups')
const MAX_BACKUPS = 50
const ROLES = new Set(['君', '臣', '佐', '使', '佐使', '未标注'])

const EMPTY = () => ({
  symptomAnnotations: {},
  herbNotes: {},
  herbRoles: {},
  herbDoses: {},
  modernNotes: {},
  updatedAt: null,
})

let cache = null

let sqliteModule = null
let dbHandle = null
let libraryDbHandle = null

/**
 * 按需打开只读 SQLite。打开失败时只让数据接口返回 503，不影响 notes 写接口。
 */
function getDb() {
  if (dbHandle) return dbHandle
  try {
    if (!sqliteModule) {
      const require = createRequire(import.meta.url)
      sqliteModule = require('node:sqlite')
    }
    dbHandle = new sqliteModule.DatabaseSync(DB_FILE, { readOnly: true })
    return dbHandle
  } catch {
    return null
  }
}

/**
 * 医藏古籍独立库。体积较大，与主库分开打开、按需读取。
 */
function getLibraryDb() {
  if (libraryDbHandle) return libraryDbHandle
  try {
    if (!sqliteModule) {
      const require = createRequire(import.meta.url)
      sqliteModule = require('node:sqlite')
    }
    libraryDbHandle = new sqliteModule.DatabaseSync(LIBRARY_DB_FILE, { readOnly: true })
    return libraryDbHandle
  } catch {
    return null
  }
}

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
      herbDoses: parsed.herbDoses ?? {},
      modernNotes: parsed.modernNotes ?? {},
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

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-qihuang-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

function send(res, status, body) {
  res.writeHead(status, { ...JSON_HEADERS, 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(body))
}

/**
 * 只读数据接口：短缓存 + ETag。命中 If-None-Match 时返回 304。
 */
function sendCached(req, res, status, body) {
  const payload = JSON.stringify(body)
  const etag = `"${createHash('sha1').update(payload).digest('base64url')}"`
  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, {
      ...JSON_HEADERS,
      ETag: etag,
      'Cache-Control': 'public, max-age=60',
    })
    res.end()
    return
  }
  res.writeHead(status, {
    ...JSON_HEADERS,
    'Cache-Control': 'public, max-age=60',
    ETag: etag,
  })
  res.end(payload)
}

function sendDbUnavailable(res) {
  send(res, 503, { error: 'db-unavailable' })
}

function jsonParse(value, fallback = null) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function decodeParam(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function flatPinyin(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, '')
}

function compactCitation(source) {
  if (!source) return null
  return {
    id: source.id,
    type: source.type,
    work: source.work,
    ...(source.parentWork ? { parentWork: source.parentWork } : {}),
    ...(source.author ? { author: source.author } : {}),
    locator: source.locator,
  }
}

function collectCitationIds(formula) {
  const ids = new Set()
  if (formula?.sourceCitationId) ids.add(formula.sourceCitationId)
  const walk = (node) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }
    for (const [key, value] of Object.entries(node)) {
      if (key.endsWith('citationIds') && Array.isArray(value)) {
        value.forEach((id) => {
          if (typeof id === 'string' && id) ids.add(id)
        })
      } else {
        walk(value)
      }
    }
  }
  walk(formula)
  return [...ids]
}

function readMeta(db, key, fallback = null) {
  const row = db.prepare('SELECT value_json FROM app_meta WHERE key = ?').get(key)
  return row ? jsonParse(row.value_json, fallback) : fallback
}

function mapHerbSummary(row) {
  const herb = jsonParse(row.data_json, {})
  return {
    id: row.id,
    name: row.name,
    pinyin: row.pinyin,
    aliases: herb.aliases ?? [],
    ancientName: herb.names?.ancient?.text ?? '',
    flavorTags: herb.flavorTags ?? [],
    meridianIds: herb.meridianIds ?? [],
    classicRankId: row.classic_rank_id ?? herb.classicRankId ?? null,
    therapyCategoryIds: herb.therapyCategoryIds ?? [],
    effectsText: row.effects_text ?? '',
    indicationsText: herb.properties?.indications?.text ?? '',
    cover: herb.images?.[0]?.url,
    coverAlt: herb.images?.[0]?.alt,
  }
}

function mapLectureSearch(row) {
  const item = jsonParse(row.data_json, {})
  return {
    key: item.key,
    name: item.name,
    pinyin: item.pinyin ?? '',
    aliases: item.aliases ?? [],
    ancientName: item.ancientName ?? '',
    alsoKnownAs: item.alsoKnownAs ?? [],
    groupId: item.groupId,
    entryId: item.entryId,
    rankId: item.rankId,
    therapyCategoryIds: item.therapyCategoryIds ?? [],
    curatedId: item.curatedId,
  }
}

function buildHerbMeta(db) {
  const baseTaxonomy = readMeta(db, 'herb_taxonomy', {
    ranks: [],
    categories: [],
    assignments: {},
    note: '',
  })
  const catalogMeta = readMeta(db, 'bencao_catalog_meta', { ranks: [] })
  const principles = readMeta(db, 'herb_principles', null)
  const herbs = db
    .prepare('SELECT id, name, pinyin, classic_rank_id, effects_text, data_json FROM herbs ORDER BY rowid')
    .all()
    .map(mapHerbSummary)
  const lectures = db
    .prepare('SELECT data_json FROM herb_lecture_index ORDER BY rowid')
    .all()
    .map((row) => jsonParse(row.data_json, {}))
    .filter((item) => !item.curatedId)

  const rankDefs = [...(baseTaxonomy.ranks ?? [])]
  for (const rank of catalogMeta.ranks ?? []) {
    if (!rankDefs.some((item) => item.id === rank.id)) rankDefs.push(rank)
  }
  const ranks = rankDefs.map((rank) => {
    const names = [
      ...herbs.filter((herb) => herb.classicRankId === rank.id).map((herb) => herb.name),
      ...lectures.filter((item) => item.rankId === rank.id).map((item) => item.name),
    ]
    return { ...rank, count: names.length, preview: names.slice(0, 6) }
  })
  const categories = (baseTaxonomy.categories ?? []).map((category) => {
    const names = [
      ...herbs
        .filter((herb) => herb.therapyCategoryIds.includes(category.id))
        .map((herb) => herb.name),
      ...lectures
        .filter((item) => (item.therapyCategoryIds ?? []).includes(category.id))
        .map((item) => item.name),
    ]
    return { ...category, count: names.length, preview: names.slice(0, 6) }
  })

  const groupTotals = db
    .prepare(
      'SELECT COALESCE(SUM(entry_count), 0) AS entries, COALESCE(SUM(char_count), 0) AS chars FROM bencao_groups',
    )
    .get()
  const formulaRow = db.prepare('SELECT COUNT(*) AS n FROM formulas').get()
  const meridianNames = readMeta(db, 'meridian_names', {})

  return {
    taxonomy: { ...baseTaxonomy, ranks, categories },
    principles,
    meridians: Object.entries(meridianNames).map(([id, name]) => ({ id, name })),
    counts: {
      herbs: herbs.length,
      lectureItems: lectures.length,
      lectureEntries: groupTotals.entries,
      lectureChars: groupTotals.chars,
      formulas: formulaRow.n,
    },
  }
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

function setHerbDose(store, body) {
  const formulaId = cleanId(body.formulaId)
  const herbId = cleanId(body.herbId)
  if (!formulaId || !herbId) throw new Error('invalid-herb')
  const dose = cleanText(body.dose, 80)
  const book = { ...(store.herbDoses[formulaId] ?? {}) }
  if (dose) book[herbId] = dose
  else delete book[herbId]
  if (Object.keys(book).length) store.herbDoses[formulaId] = book
  else delete store.herbDoses[formulaId]
}

function setModernNote(store, body) {
  const formulaId = cleanId(body.formulaId)
  if (!formulaId) throw new Error('invalid-formula')
  const text = cleanText(body.text, 12000)
  if (text) store.modernNotes[formulaId] = text
  else delete store.modernNotes[formulaId]
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

  // ---- 只读数据接口（SQLite） ----
  if (url.pathname === '/api/sources' && req.method === 'GET') {
    const db = getDb()
    if (!db) {
      sendDbUnavailable(res)
      return
    }
    try {
      const ids = [
        ...new Set(
          (url.searchParams.get('ids') ?? '')
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean)
            .slice(0, 100),
        ),
      ]
      if (!ids.length) {
        sendCached(req, res, 200, [])
        return
      }
      const placeholders = ids.map(() => '?').join(',')
      const rows = db
        .prepare(`SELECT id, data_json FROM sources WHERE id IN (${placeholders})`)
        .all(...ids)
      const byId = new Map(rows.map((row) => [row.id, jsonParse(row.data_json)]))
      sendCached(
        req,
        res,
        200,
        ids.map((id) => byId.get(id)).filter(Boolean),
      )
    } catch {
      send(res, 500, { error: 'db-query-failed' })
    }
    return
  }

  if (url.pathname === '/api/formulas' && req.method === 'GET') {
    const db = getDb()
    if (!db) {
      sendDbUnavailable(res)
      return
    }
    try {
      const q = (url.searchParams.get('q') ?? '').trim()
      const like = `%${q}%`
      const pinyinLike = `%${flatPinyin(q)}%`
      const formulaRows = q
        ? db
            .prepare(
              `SELECT id, name, pinyin, source_id, effects_text, symptom_tags_json
               FROM formulas
               WHERE name LIKE ?
                  OR pinyin LIKE ?
                  OR pinyin_flat LIKE ?
                  OR effects_text LIKE ?
                  OR EXISTS (
                    SELECT 1 FROM formula_composition c
                    WHERE c.formula_id = formulas.id
                      AND (c.herb_name LIKE ? OR c.herb_id LIKE ?)
                  )
               ORDER BY rowid`,
            )
            .all(like, like, pinyinLike, like, like, like)
        : db
            .prepare(
              `SELECT id, name, pinyin, source_id, effects_text, symptom_tags_json
               FROM formulas ORDER BY rowid`,
            )
            .all()

      const compositionByFormula = new Map()
      if (formulaRows.length) {
        const placeholders = formulaRows.map(() => '?').join(',')
        const compositionRows = db
          .prepare(
            `SELECT c.formula_id, c.herb_id,
                    COALESCE(c.herb_name, h.name, c.herb_id) AS herb_name,
                    c.role
             FROM formula_composition c
             LEFT JOIN herbs h ON h.id = c.herb_id
             WHERE c.formula_id IN (${placeholders})
             ORDER BY c.formula_id, c.sort_order`,
          )
          .all(...formulaRows.map((row) => row.id))
        for (const item of compositionRows) {
          const list = compositionByFormula.get(item.formula_id) ?? []
          list.push({
            herbId: item.herb_id,
            herbName: item.herb_name,
            role: item.role ?? '未标注',
          })
          compositionByFormula.set(item.formula_id, list)
        }
      }

      const sourceIds = [...new Set(formulaRows.map((row) => row.source_id).filter(Boolean))]
      const sourceById = new Map()
      if (sourceIds.length) {
        const placeholders = sourceIds.map(() => '?').join(',')
        const sourceRows = db
          .prepare(`SELECT id, data_json FROM sources WHERE id IN (${placeholders})`)
          .all(...sourceIds)
        for (const row of sourceRows) sourceById.set(row.id, compactCitation(jsonParse(row.data_json)))
      }

      const formulas = formulaRows.map((row) => {
        const composition = compositionByFormula.get(row.id) ?? []
        return {
          id: row.id,
          name: row.name,
          pinyin: row.pinyin,
          sourceCitationId: row.source_id,
          effectsText: row.effects_text,
          composition,
          herbCount: composition.length,
          symptomTags: jsonParse(row.symptom_tags_json, []),
          sourceCitation: sourceById.get(row.source_id) ?? null,
        }
      })
      sendCached(req, res, 200, formulas)
    } catch {
      send(res, 500, { error: 'db-query-failed' })
    }
    return
  }

  const formulaMatch = url.pathname.match(/^\/api\/formulas\/([^/]+)$/)
  if (formulaMatch && req.method === 'GET') {
    const db = getDb()
    if (!db) {
      sendDbUnavailable(res)
      return
    }
    try {
      const id = decodeParam(formulaMatch[1])
      const row = db.prepare('SELECT data_json FROM formulas WHERE id = ?').get(id)
      if (!row) {
        send(res, 404, { error: 'not-found' })
        return
      }
      const formula = jsonParse(row.data_json)
      const citationIds = collectCitationIds(formula)
      const citations = []
      if (citationIds.length) {
        const placeholders = citationIds.map(() => '?').join(',')
        const sourceRows = db
          .prepare(`SELECT id, data_json FROM sources WHERE id IN (${placeholders})`)
          .all(...citationIds)
        const byId = new Map(sourceRows.map((item) => [item.id, jsonParse(item.data_json)]))
        for (const citationId of citationIds) {
          const citation = byId.get(citationId)
          if (citation) citations.push(citation)
        }
      }

      const herbIds = [
        ...new Set((formula.composition ?? []).map((item) => item.herbId).filter(Boolean)),
      ]
      const herbs = {}
      if (herbIds.length) {
        const placeholders = herbIds.map(() => '?').join(',')
        const herbRows = db
          .prepare(`SELECT id, data_json FROM herbs WHERE id IN (${placeholders})`)
          .all(...herbIds)
        for (const item of herbRows) herbs[item.id] = jsonParse(item.data_json)
      }

      sendCached(req, res, 200, { ...formula, citations, herbs })
    } catch {
      send(res, 500, { error: 'db-query-failed' })
    }
    return
  }

  if (url.pathname === '/api/herbs' && req.method === 'GET') {
    const db = getDb()
    if (!db) {
      sendDbUnavailable(res)
      return
    }
    try {
      const q = (url.searchParams.get('q') ?? '').trim().toLowerCase()
      const rows = db
        .prepare(
          `SELECT id, name, pinyin, classic_rank_id, effects_text, data_json
           FROM herbs ORDER BY rowid`,
        )
        .all()
      const herbs = rows
        .map(mapHerbSummary)
        .filter((herb) => {
          if (!q) return true
          const haystack = [
            herb.name,
            herb.pinyin,
            herb.id,
            herb.effectsText,
            herb.indicationsText,
            herb.ancientName,
            ...herb.aliases,
          ]
            .join(' ')
            .toLowerCase()
          return haystack.includes(q) || flatPinyin(herb.pinyin).includes(flatPinyin(q))
        })
      sendCached(req, res, 200, herbs)
    } catch {
      send(res, 500, { error: 'db-query-failed' })
    }
    return
  }

  if (url.pathname === '/api/herbs/meta' && req.method === 'GET') {
    const db = getDb()
    if (!db) {
      sendDbUnavailable(res)
      return
    }
    try {
      sendCached(req, res, 200, buildHerbMeta(db))
    } catch {
      send(res, 500, { error: 'db-query-failed' })
    }
    return
  }

  if (url.pathname === '/api/herbs/search-index' && req.method === 'GET') {
    const db = getDb()
    if (!db) {
      sendDbUnavailable(res)
      return
    }
    try {
      const herbs = db
        .prepare('SELECT data_json FROM herbs ORDER BY rowid')
        .all()
        .map((row) => jsonParse(row.data_json))
      const lectures = db
        .prepare('SELECT data_json FROM herb_lecture_index ORDER BY rowid')
        .all()
        .map((row) => jsonParse(row.data_json))
      sendCached(req, res, 200, { herbs, lectures })
    } catch {
      send(res, 500, { error: 'db-query-failed' })
    }
    return
  }

  const herbCollectionMatch = url.pathname.match(
    /^\/api\/herbs\/collection\/(rank|category)\/([^/]+)$/,
  )
  if (herbCollectionMatch && req.method === 'GET') {
    const db = getDb()
    if (!db) {
      sendDbUnavailable(res)
      return
    }
    try {
      const kind = herbCollectionMatch[1]
      const key = decodeParam(herbCollectionMatch[2])
      const meta = buildHerbMeta(db)
      const definition =
        kind === 'rank'
          ? meta.taxonomy.ranks.find((rank) => rank.id === key)
          : meta.taxonomy.categories.find((category) => category.id === key)
      if (!definition) {
        send(res, 404, { error: 'not-found' })
        return
      }

      const meridianNames = readMeta(db, 'meridian_names', {})
      const items = []

      for (const row of db
        .prepare('SELECT id, name, pinyin, classic_rank_id, effects_text, data_json FROM herbs ORDER BY rowid')
        .all()) {
        const herb = jsonParse(row.data_json, {})
        const matched =
          kind === 'rank'
            ? herb.classicRankId === key
            : (herb.therapyCategoryIds ?? []).includes(key)
        if (!matched) continue
        items.push({
          id: `herb-${herb.id}`,
          name: herb.name,
          pinyin: herb.pinyin ?? '',
          flavors: herb.flavorTags ?? [],
          meridians: (herb.meridianIds ?? []).map((id) => meridianNames[id] ?? id),
          effects: herb.properties?.effects?.text ?? row.effects_text ?? '',
          href: `/herbs/${herb.id}`,
          cover: herb.images?.[0]?.url,
          coverAlt: herb.images?.[0]?.alt,
          seal: herb.name.slice(0, 1),
          badge: '药典依据',
          source: `中华人民共和国药典 · ${herb.name}`,
        })
      }

      for (const row of db
        .prepare('SELECT data_json FROM herb_lecture_index ORDER BY rowid')
        .all()) {
        const item = jsonParse(row.data_json, {})
        if (item.curatedId) continue
        const matched =
          kind === 'rank'
            ? item.rankId === key
            : (item.therapyCategoryIds ?? []).includes(key)
        if (!matched) continue
        items.push({
          id: item.key,
          name: item.name,
          pinyin: item.pinyin ?? '',
          flavors: [...(item.flavorTags ?? []), item.nature].filter(Boolean),
          meridians: item.meridianNames ?? [],
          effects: item.summary ?? '',
          href: `/bencao/${item.groupId}/${item.entryId}`,
          cover: item.image?.url,
          coverAlt: item.image?.alt,
          seal: item.name.slice(0, 1),
          badge:
            item.rankId === 'nishi'
              ? '经方补列'
              : item.rankId === 'editor'
                ? '整理者增补'
                : '讲义整理',
          source: '倪海厦《神农本草经》讲义',
        })
      }

      sendCached(req, res, 200, {
        kind,
        key,
        title: definition.title,
        subtitle: definition.subtitle ?? '',
        description:
          definition.description ??
          (kind === 'category'
            ? '功效分类是本站导航标签，不是经典原文；同一味药可以同时出现在多个分类中。'
            : ''),
        count: items.length,
        items,
      })
    } catch {
      send(res, 500, { error: 'db-query-failed' })
    }
    return
  }

  const herbMatch = url.pathname.match(/^\/api\/herbs\/([^/]+)$/)
  if (herbMatch && req.method === 'GET') {
    const db = getDb()
    if (!db) {
      sendDbUnavailable(res)
      return
    }
    try {
      const id = decodeParam(herbMatch[1])
      const row = db.prepare('SELECT data_json FROM herbs WHERE id = ?').get(id)
      if (!row) {
        send(res, 404, { error: 'not-found' })
        return
      }
      const herb = jsonParse(row.data_json)
      const taxonomy = readMeta(db, 'herb_taxonomy', null)
      const meridianNames = readMeta(db, 'meridian_names', {})
      const lectureRow = db
        .prepare('SELECT data_json FROM herb_lecture_index WHERE name = ? LIMIT 1')
        .get(herb.name)
      const lecture = lectureRow ? jsonParse(lectureRow.data_json) : null

      const pairingHerbs = {}
      for (const pairing of herb.pairings ?? []) {
        if (!pairing?.herbId || pairingHerbs[pairing.herbId]) continue
        const related = db
          .prepare('SELECT id, name FROM herbs WHERE id = ?')
          .get(pairing.herbId)
        if (related) pairingHerbs[related.id] = { id: related.id, name: related.name }
      }

      const citationIds = collectCitationIds(herb)
      const citations = []
      if (citationIds.length) {
        const placeholders = citationIds.map(() => '?').join(',')
        for (const sourceRow of db
          .prepare(`SELECT id, data_json FROM sources WHERE id IN (${placeholders})`)
          .all(...citationIds)) {
          citations.push(jsonParse(sourceRow.data_json))
        }
      }

      sendCached(req, res, 200, {
        ...herb,
        taxonomy,
        meridians: (herb.meridianIds ?? []).map((id) => ({
          id,
          name: meridianNames[id] ?? id,
        })),
        lecture,
        pairingHerbs,
        citations,
      })
    } catch {
      send(res, 500, { error: 'db-query-failed' })
    }
    return
  }

  if (url.pathname === '/api/meridians' && req.method === 'GET') {
    const db = getDb()
    if (!db) {
      sendDbUnavailable(res)
      return
    }
    try {
      const meridians = db
        .prepare('SELECT data_json FROM meridians ORDER BY rowid')
        .all()
        .map((row) => jsonParse(row.data_json))
      const acupoints = db
        .prepare('SELECT data_json FROM acupoints ORDER BY rowid')
        .all()
        .map((row) => jsonParse(row.data_json))
      const citationIds = [
        ...new Set([...meridians, ...acupoints].flatMap((item) => collectCitationIds(item))),
      ]
      const citations = []
      if (citationIds.length) {
        const placeholders = citationIds.map(() => '?').join(',')
        for (const row of db
          .prepare(`SELECT id, data_json FROM sources WHERE id IN (${placeholders})`)
          .all(...citationIds)) {
          citations.push(jsonParse(row.data_json))
        }
      }
      sendCached(req, res, 200, { meridians, acupoints, citations })
    } catch {
      send(res, 500, { error: 'db-query-failed' })
    }
    return
  }

  if (url.pathname === '/api/classics' && req.method === 'GET') {
    const db = getDb()
    if (!db) {
      sendDbUnavailable(res)
      return
    }
    try {
      const index = readMeta(db, 'classic_index', { books: [] })
      const works = db
        .prepare("SELECT data_json FROM sources WHERE type = 'classic' ORDER BY rowid")
        .all()
        .map((row) => jsonParse(row.data_json))
      sendCached(req, res, 200, { index, works })
    } catch {
      send(res, 500, { error: 'db-query-failed' })
    }
    return
  }

  const classicSectionMatch = url.pathname.match(
    /^\/api\/classics\/([^/]+)\/sections\/([^/]+)$/,
  )
  if (classicSectionMatch && req.method === 'GET') {
    const db = getDb()
    if (!db) {
      sendDbUnavailable(res)
      return
    }
    try {
      const bookId = decodeParam(classicSectionMatch[1])
      const sectionId = decodeParam(classicSectionMatch[2])
      const bookRow = db
        .prepare('SELECT id, title, author, data_json FROM classic_books WHERE id = ?')
        .get(bookId)
      if (!bookRow) {
        send(res, 404, { error: 'not-found' })
        return
      }
      const sectionRow = db
        .prepare(
          `SELECT id, title, kind, volume_title, char_count, paragraphs_json
           FROM classic_sections WHERE book_id = ? AND id = ?`,
        )
        .get(bookId, sectionId)
      if (!sectionRow) {
        send(res, 404, { error: 'not-found' })
        return
      }
      const book = jsonParse(bookRow.data_json, {})
      const sections = db
        .prepare(
          'SELECT id, title FROM classic_sections WHERE book_id = ? ORDER BY sort_order',
        )
        .all(bookId)
      sendCached(req, res, 200, {
        book: {
          id: bookRow.id,
          title: bookRow.title,
          author: bookRow.author,
          source: book.source,
          stats: book.stats,
        },
        section: {
          id: sectionRow.id,
          title: sectionRow.title,
          kind: sectionRow.kind,
          volume: sectionRow.volume_title,
          charCount: sectionRow.char_count,
          paragraphs: jsonParse(sectionRow.paragraphs_json, []),
        },
        sections,
      })
    } catch {
      send(res, 500, { error: 'db-query-failed' })
    }
    return
  }

  const classicBookMatch = url.pathname.match(/^\/api\/classics\/([^/]+)$/)
  if (classicBookMatch && req.method === 'GET') {
    const db = getDb()
    if (!db) {
      sendDbUnavailable(res)
      return
    }
    try {
      const bookId = decodeParam(classicBookMatch[1])
      const row = db.prepare('SELECT data_json FROM classic_books WHERE id = ?').get(bookId)
      if (!row) {
        send(res, 404, { error: 'not-found' })
        return
      }
      sendCached(req, res, 200, jsonParse(row.data_json))
    } catch {
      send(res, 500, { error: 'db-query-failed' })
    }
    return
  }

  if (url.pathname === '/api/library' && req.method === 'GET') {
    const db = getLibraryDb()
    if (!db) {
      send(res, 503, { error: 'library-unavailable' })
      return
    }
    try {
      const meta = readMeta(db, 'library_index', { categories: [], source: {} })
      const total = db.prepare('SELECT COUNT(*) AS n FROM library_books').get().n
      sendCached(req, res, 200, { ...meta, total })
    } catch {
      send(res, 500, { error: 'db-query-failed' })
    }
    return
  }

  if (url.pathname === '/api/library/books' && req.method === 'GET') {
    const db = getLibraryDb()
    if (!db) {
      send(res, 503, { error: 'library-unavailable' })
      return
    }
    try {
      const category = (url.searchParams.get('category') ?? '').trim()
      const subcategory = (url.searchParams.get('subcategory') ?? '').trim()
      const q = (url.searchParams.get('q') ?? '').trim()
      const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1)
      const limit = Math.min(120, Math.max(1, Number(url.searchParams.get('limit') ?? 48) || 48))
      const conditions = ['1 = 1']
      const params = []
      if (category) {
        conditions.push('category = ?')
        params.push(category)
      }
      if (subcategory) {
        conditions.push('subcategory = ?')
        params.push(subcategory)
      }
      if (q) {
        conditions.push('(title LIKE ? OR author LIKE ? OR dynasty LIKE ?)')
        params.push(`%${q}%`, `%${q}%`, `%${q}%`)
      }
      const where = conditions.join(' AND ')
      const total = db
        .prepare(`SELECT COUNT(*) AS n FROM library_books WHERE ${where}`)
        .get(...params).n
      const rows = db
        .prepare(
          `SELECT id, title, author, dynasty, category, subcategory, char_count,
                  section_count, duplicate_of, version_note
           FROM library_books WHERE ${where}
           ORDER BY title LIMIT ? OFFSET ?`,
        )
        .all(...params, limit, (page - 1) * limit)
      sendCached(req, res, 200, {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        books: rows.map((row) => ({
          id: row.id,
          title: row.title,
          author: row.author,
          dynasty: row.dynasty,
          category: row.category,
          subcategory: row.subcategory,
          charCount: row.char_count,
          sectionCount: row.section_count,
          duplicateOf: row.duplicate_of,
          versionNote: row.version_note,
        })),
      })
    } catch {
      send(res, 500, { error: 'db-query-failed' })
    }
    return
  }

  const librarySectionMatch = url.pathname.match(
    /^\/api\/library\/books\/([^/]+)\/sections\/([^/]+)$/,
  )
  if (librarySectionMatch && req.method === 'GET') {
    const db = getLibraryDb()
    if (!db) {
      send(res, 503, { error: 'library-unavailable' })
      return
    }
    try {
      const bookId = decodeParam(librarySectionMatch[1])
      const sectionId = decodeParam(librarySectionMatch[2])
      const bookRow = db
        .prepare('SELECT id, title, author, data_json FROM library_books WHERE id = ?')
        .get(bookId)
      if (!bookRow) {
        send(res, 404, { error: 'not-found' })
        return
      }
      const row = db
        .prepare(
          `SELECT id, title, kind, char_count, sort_order, paragraphs_json
           FROM library_sections WHERE book_id = ? AND id = ?`,
        )
        .get(bookId, sectionId)
      if (!row) {
        send(res, 404, { error: 'not-found' })
        return
      }
      const prev = db
        .prepare(
          `SELECT id, title, sort_order FROM library_sections
           WHERE book_id = ? AND sort_order < ? ORDER BY sort_order DESC LIMIT 1`,
        )
        .get(bookId, row.sort_order)
      const next = db
        .prepare(
          `SELECT id, title, sort_order FROM library_sections
           WHERE book_id = ? AND sort_order > ? ORDER BY sort_order ASC LIMIT 1`,
        )
        .get(bookId, row.sort_order)
      const meta = jsonParse(bookRow.data_json, {})
      sendCached(req, res, 200, {
        book: {
          id: bookRow.id,
          title: bookRow.title,
          author: bookRow.author,
          source: meta.source,
          duplicateOf: meta.duplicateOf,
          versionNote: meta.versionNote,
        },
        section: {
          id: row.id,
          title: row.title,
          kind: row.kind,
          charCount: row.char_count,
          paragraphs: jsonParse(row.paragraphs_json, []),
        },
        prev: prev ?? null,
        next: next ?? null,
      })
    } catch {
      send(res, 500, { error: 'db-query-failed' })
    }
    return
  }

  const libraryBookMatch = url.pathname.match(/^\/api\/library\/books\/([^/]+)$/)
  if (libraryBookMatch && req.method === 'GET') {
    const db = getLibraryDb()
    if (!db) {
      send(res, 503, { error: 'library-unavailable' })
      return
    }
    try {
      const bookId = decodeParam(libraryBookMatch[1])
      const row = db
        .prepare(
          `SELECT id, title, author, dynasty, category, subcategory, char_count,
                  section_count, duplicate_of, version_note, data_json
           FROM library_books WHERE id = ?`,
        )
        .get(bookId)
      if (!row) {
        send(res, 404, { error: 'not-found' })
        return
      }
      const meta = jsonParse(row.data_json, {})
      const sections = db
        .prepare(
          `SELECT id, title, kind, char_count FROM library_sections
           WHERE book_id = ? ORDER BY sort_order`,
        )
        .all(bookId)
      sendCached(req, res, 200, {
        ...meta,
        id: row.id,
        title: row.title,
        author: row.author,
        dynasty: row.dynasty,
        category: row.category,
        subcategory: row.subcategory,
        charCount: row.char_count,
        sectionCount: row.section_count,
        duplicateOf: row.duplicate_of,
        versionNote: row.version_note,
        sections: sections.map((section) => ({
          id: section.id,
          title: section.title,
          kind: section.kind,
          charCount: section.char_count,
        })),
      })
    } catch {
      send(res, 500, { error: 'db-query-failed' })
    }
    return
  }

  if (url.pathname === '/api/cases' && req.method === 'GET') {
    const db = getDb()
    if (!db) {
      sendDbUnavailable(res)
      return
    }
    try {
      const cases = db
        .prepare(
          `SELECT id, title, category, summary, source_work, source_locator, data_json
           FROM cases ORDER BY sort_order`,
        )
        .all()
        .map((row) => {
          const item = jsonParse(row.data_json, {})
          return {
            id: row.id,
            title: row.title,
            category: row.category,
            subcategory: item.subcategory ?? '',
            doctor: item.doctor ?? '',
            mode: item.mode ?? 'case',
            summary: row.summary,
            source: {
              work: row.source_work,
              locator: row.source_locator,
              note: item.source?.note ?? '',
            },
            prescriptionCount: (item.content ?? []).filter(
              (block) => block.type === 'prescription',
            ).length,
          }
        })
      sendCached(req, res, 200, cases)
    } catch {
      send(res, 500, { error: 'db-query-failed' })
    }
    return
  }

  const caseMatch = url.pathname.match(/^\/api\/cases\/([^/]+)$/)
  if (caseMatch && req.method === 'GET') {
    const db = getDb()
    if (!db) {
      sendDbUnavailable(res)
      return
    }
    try {
      const caseId = decodeParam(caseMatch[1])
      const row = db.prepare('SELECT data_json FROM cases WHERE id = ?').get(caseId)
      if (!row) {
        send(res, 404, { error: 'not-found' })
        return
      }
      sendCached(req, res, 200, jsonParse(row.data_json))
    } catch {
      send(res, 500, { error: 'db-query-failed' })
    }
    return
  }

  if (url.pathname === '/api/bencao' && req.method === 'GET') {
    const db = getDb()
    if (!db) {
      sendDbUnavailable(res)
      return
    }
    try {
      const indexRow = db
        .prepare("SELECT value_json FROM app_meta WHERE key = 'bencao_index'")
        .get()
      const taxonomyRow = db
        .prepare("SELECT value_json FROM app_meta WHERE key = 'herb_taxonomy'")
        .get()
      const index = indexRow ? jsonParse(indexRow.value_json, {}) : {}
      const groups = db
        .prepare(
          `SELECT id, title, subtitle, description, entry_count, char_count, data_json
           FROM bencao_groups ORDER BY sort_order`,
        )
        .all()
        .map((row) => ({
          id: row.id,
          title: row.title,
          subtitle: row.subtitle,
          description: row.description,
          count: row.entry_count,
          charCount: row.char_count,
        }))
      sendCached(req, res, 200, {
        ...index,
        groups,
        taxonomy: taxonomyRow ? jsonParse(taxonomyRow.value_json) : null,
      })
    } catch {
      send(res, 500, { error: 'db-query-failed' })
    }
    return
  }

  const bencaoEntryMatch = url.pathname.match(/^\/api\/bencao\/entry\/([^/]+)$/)
  if (bencaoEntryMatch && req.method === 'GET') {
    const db = getDb()
    if (!db) {
      sendDbUnavailable(res)
      return
    }
    try {
      const id = decodeParam(bencaoEntryMatch[1])
      const row = db.prepare('SELECT data_json FROM bencao_entries WHERE id = ?').get(id)
      if (!row) {
        send(res, 404, { error: 'not-found' })
        return
      }
      sendCached(req, res, 200, jsonParse(row.data_json))
    } catch {
      send(res, 500, { error: 'db-query-failed' })
    }
    return
  }

  const bencaoGroupMatch = url.pathname.match(/^\/api\/bencao\/([^/]+)$/)
  if (bencaoGroupMatch && req.method === 'GET') {
    const db = getDb()
    if (!db) {
      sendDbUnavailable(res)
      return
    }
    try {
      const id = decodeParam(bencaoGroupMatch[1])
      const group = db
        .prepare(
          `SELECT id, title, subtitle, description, entry_count, char_count
           FROM bencao_groups WHERE id = ?`,
        )
        .get(id)
      if (!group) {
        send(res, 404, { error: 'not-found' })
        return
      }
      const entries = db
        .prepare(
          `SELECT id, group_id, number, title, subtitle, pinyin, summary, note,
                  aliases_json, char_count, section_count
           FROM bencao_entries WHERE group_id = ? ORDER BY sort_order`,
        )
        .all(id)
        .map((row) => ({
          id: row.id,
          groupId: row.group_id,
          number: row.number,
          title: row.title,
          subtitle: row.subtitle,
          pinyin: row.pinyin,
          summary: row.summary,
          note: row.note,
          alsoKnownAs: jsonParse(row.aliases_json, []),
          charCount: row.char_count,
          sectionCount: row.section_count,
        }))
      sendCached(req, res, 200, {
        id: group.id,
        title: group.title,
        subtitle: group.subtitle,
        description: group.description,
        entries,
      })
    } catch {
      send(res, 500, { error: 'db-query-failed' })
    }
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
      case 'herb-dose':
        setHerbDose(store, body)
        break
      case 'modern-note':
        setModernNote(store, body)
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
  console.log(`db file: ${DB_FILE}`)
})
