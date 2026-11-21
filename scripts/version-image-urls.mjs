import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const root = path.resolve(import.meta.dirname, '..')
const dataDirs = [
  path.join(root, 'public', 'data', 'bencao-lectures'),
  path.join(root, 'public', 'data', 'bencao-dacheng'),
]

const hashCache = new Map()

function versionFor(urlPath) {
  if (hashCache.has(urlPath)) return hashCache.get(urlPath)
  const filePath = path.join(root, 'public', urlPath.replace(/^\//, ''))
  let version = null
  try {
    const buffer = fs.readFileSync(filePath)
    version = crypto.createHash('md5').update(buffer).digest('hex').slice(0, 8)
  } catch {
    version = null
  }
  hashCache.set(urlPath, version)
  return version
}

function collectJsonFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) collectJsonFiles(full, acc)
    else if (entry.isFile() && entry.name.endsWith('.json')) acc.push(full)
  }
  return acc
}

let filesChanged = 0
let urlsVersioned = 0
const missing = new Set()

for (const dir of dataDirs) {
  if (!fs.existsSync(dir)) continue
  for (const file of collectJsonFiles(dir)) {
    const raw = fs.readFileSync(file, 'utf8')
    let count = 0
    const next = raw.replace(/"(\/images\/[^"\\?]+)"/g, (match, urlPath) => {
      const version = versionFor(urlPath)
      if (!version) {
        missing.add(urlPath)
        return match
      }
      count += 1
      return `"${urlPath}?v=${version}"`
    })
    if (count > 0) {
      fs.writeFileSync(file, next)
      filesChanged += 1
      urlsVersioned += count
    }
  }
}

console.log(`versioned ${urlsVersioned} image urls in ${filesChanged} files`)
if (missing.size) {
  console.log(`missing files: ${missing.size}`)
  for (const url of [...missing].slice(0, 20)) console.log(`  ${url}`)
  process.exitCode = 1
}
