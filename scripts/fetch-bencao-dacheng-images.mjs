import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const INDEX_FILE = path.join(ROOT, 'public', 'data', 'bencao-dacheng', 'index.json')
const ENTRY_DIR = path.join(ROOT, 'public', 'data', 'bencao-dacheng', 'entries')
const CACHE_FILE = path.join(ROOT, 'scripts', 'content', 'bencao-dacheng-images.json')
const DELAY_MS = 180
const CONCURRENCY = 4

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function loadCache() {
  if (!fs.existsSync(CACHE_FILE)) return {}
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'))
  } catch {
    return {}
  }
}

function saveCache(cache) {
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true })
  fs.writeFileSync(CACHE_FILE, `${JSON.stringify(cache, null, 2)}\n`)
}

function latinFromSource(text) {
  const match = String(text ?? '').match(/([A-Z][a-z]{2,}\s+[a-z]{2,})/)
  return match ? match[1] : ''
}

async function queryInaturalist(latin) {
  const url = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(latin)}&rank=species&per_page=1`
  const response = await fetch(url)
  if (!response.ok) return null
  const data = await response.json()
  const taxon = data.results?.[0]
  const photo = taxon?.default_photo
  if (!taxon || !photo?.medium_url || !photo?.license_code) return null
  const license = String(photo.license_code).toLowerCase()
  if (!license.startsWith('cc') && license !== 'pd') return null
  return {
    url: photo.medium_url,
    alt: `${taxon.preferred_common_name ?? taxon.name}（${taxon.name}）`,
    credit: photo.attribution ?? '',
    license: license.toUpperCase(),
    sourceUrl: `https://www.inaturalist.org/taxa/${taxon.id}`,
    latin: taxon.name,
    kind: '原植物',
  }
}

async function main() {
  if (!fs.existsSync(INDEX_FILE)) throw new Error('请先运行 node scripts/build-bencao-dacheng.mjs')
  const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'))
  const cache = loadCache()
  const pending = index.items.filter((item) => !item.image && !cache[item.name])
  console.log(`待补图片 ${pending.length} 味，已有缓存 ${Object.keys(cache).length} 味`)

  let cursor = 0
  let done = 0
  async function worker() {
    while (cursor < pending.length) {
      const item = pending[cursor]
      cursor += 1
      const entryFile = path.join(ENTRY_DIR, `${item.id}.json`)
      if (!fs.existsSync(entryFile)) continue
      const entry = JSON.parse(fs.readFileSync(entryFile, 'utf8'))
      const latin = latinFromSource(entry.sourceText)
      if (latin) {
        try {
          const image = await queryInaturalist(latin)
          if (image) cache[item.name] = image
        } catch {
          // 网络失败或限流时跳过，下次再补。
        }
      }
      done += 1
      if (done % 20 === 0) {
        saveCache(cache)
        console.log(`已处理 ${done}/${pending.length}，新增 ${Object.keys(cache).length} 张`)
      }
      await sleep(DELAY_MS)
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))
  saveCache(cache)
  console.log(`完成：缓存 ${Object.keys(cache).length} 张图片，写入 ${path.relative(ROOT, CACHE_FILE)}`)
}

main()
