import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const CACHE_FILE = path.join(ROOT, 'scripts', 'content', 'bencao-dacheng-images.json')
const OUT_DIR = path.join(ROOT, 'public', 'images', 'herbs', 'dacheng')

const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'))

async function downloadOne(name, image) {
  if (!/^https?:\/\//i.test(image.url ?? '')) return { name, skipped: true }
  const hash = crypto.createHash('sha1').update(image.url).digest('hex').slice(0, 10)
  const destName = `inat-${hash}.jpg`
  const dest = path.join(OUT_DIR, destName)
  if (!fs.existsSync(dest)) {
    const response = await fetch(image.url, {
      headers: { 'User-Agent': 'qihuang-tcm/1.0 herb image localizer' },
    })
    if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`)
    const type = response.headers.get('content-type') ?? ''
    if (!type.startsWith('image/')) throw new Error(`${name}: not image (${type})`)
    const buffer = Buffer.from(await response.arrayBuffer())
    fs.writeFileSync(dest, buffer)
  }
  return {
    name,
    image: {
      ...image,
      url: `/images/herbs/dacheng/${destName}`,
    },
    bytes: fs.statSync(dest).size,
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const entries = Object.entries(cache)
  const remote = entries.filter(([, image]) => /^https?:\/\//i.test(image.url ?? ''))
  const results = []
  let cursor = 0

  async function worker() {
    while (cursor < remote.length) {
      const index = cursor
      cursor += 1
      const [name, image] = remote[index]
      try {
        results.push(await downloadOne(name, image))
      } catch (error) {
        results.push({ name, error: error instanceof Error ? error.message : String(error) })
      }
    }
  }

  await Promise.all(Array.from({ length: 4 }, worker))

  let updated = 0
  let failed = 0
  let totalBytes = 0
  for (const result of results) {
    if (result.error) {
      failed += 1
      console.error('FAILED', result.name, result.error)
      continue
    }
    if (result.skipped) continue
    cache[result.name] = result.image
    updated += 1
    totalBytes += result.bytes ?? 0
  }

  fs.writeFileSync(CACHE_FILE, `${JSON.stringify(cache, null, 2)}\n`)
  console.log(`Remote images: ${remote.length}`)
  console.log(`Localized: ${updated}`)
  console.log(`Failed: ${failed}`)
  console.log(`Downloaded size: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
