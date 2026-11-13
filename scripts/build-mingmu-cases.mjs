import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = 'F:/中医/明目方/%E6%98%8E%E7%9B%AE%E8%87%B3%E5%AE%9D'
const outFile = path.join(root, 'src', 'data', 'cases', 'mingmu.json')

const BOOK_TITLE = '明目至宝'
const BOOK_NOTE =
  '据整理稿录入。原书四卷，撰人不详，书中引孙真人谕眼论、太玄真人五轮八廓说及眼科七十二证方治；按原书卷次与篇目照录，未删节。源文为 OCR 整理本，个别字有缺误，以原书为准。方药剂量仅供文献学习。'

const HEAD_RE = /^卷([一二三四五六七八九十]+)[　\s]+(.+)$/
const VOLUME_RE = /^卷[一二三四五六七八九十]+$/

function modeFor(title) {
  if (/赋|论|表|五轮|八廓|五行|受疾之因|用药/.test(title)) return 'thought'
  return 'formula'
}

function cleanLine(raw) {
  return raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^[\s\u3000]+|[\s\u3000]+$/g, '')
}

const files = fs
  .readdirSync(sourceDir)
  .filter((name) => /^p\d+\.md$/.test(name))
  .sort((a, b) => Number(a.slice(1, -3)) - Number(b.slice(1, -3)))

if (files.length !== 15) throw new Error(`expected 15 pages, got ${files.length}`)

const blocks = []
for (const file of files) {
  const text = fs.readFileSync(path.join(sourceDir, file), 'utf8').replace(/\r\n/g, '\n')
  for (const raw of text.split('\n')) {
    const line = cleanLine(raw)
    if (line) blocks.push(line)
  }
}

const entries = []
const bodyLines = []
const rendered = []
let volume = ''
let current = null
let expectTitle = false

function closeEntry() {
  if (!current) return
  if (!current.content.length) {
    // Repeated page headers can leave an empty entry when a title changes
    // before any body; drop it rather than emit an empty card.
    current = null
    return
  }
  current.id = `mingmu-${String(entries.length + 1).padStart(3, '0')}`
  entries.push(current)
  rendered.push(...current.content)
  current = null
}

function startEntry(title) {
  closeEntry()
  current = { title: title.trim(), volume, content: [] }
}

for (const line of blocks) {
  if (VOLUME_RE.test(line)) {
    volume = line
    expectTitle = true
    continue
  }

  const head = line.match(HEAD_RE)
  if (head) {
    volume = `卷${head[1]}`
    expectTitle = false
    const title = head[2].trim()
    if (current && current.title === title && current.volume === volume) continue
    startEntry(title)
    continue
  }

  if (expectTitle) {
    expectTitle = false
    if (line.length <= 16 && !/[。，！？：；]/.test(line)) {
      startEntry(line)
      continue
    }
  }

  if (line === BOOK_TITLE) continue

  bodyLines.push(line)

  if (!current) startEntry(volume ? `${volume}·正文` : '正文')
  current.content.push(line)
}

closeEntry()

const normalize = (text) => text.replace(/\s+/g, '')
const expected = normalize(bodyLines.join(''))
const actual = normalize(rendered.join(''))

if (expected !== actual) {
  let index = 0
  while (index < expected.length && expected[index] === actual[index]) index += 1
  throw new Error(
    `text mismatch at normalized index ${index}\nexpected: ${expected.slice(index, index + 80)}\nactual: ${actual.slice(index, index + 80)}`,
  )
}

const payload = {
  generatedAt: new Date().toISOString(),
  book: {
    id: 'mingmu',
    title: BOOK_TITLE,
    author: '佚名',
    era: 'ancient',
    note: BOOK_NOTE,
    caseCount: entries.length,
  },
  cases: entries.map((entry) => ({
    id: entry.id,
    bookId: 'mingmu',
    title: entry.title,
    category: '五官',
    doctor: '佚名',
    mode: modeFor(entry.title),
    era: 'ancient',
    subcategory: entry.volume,
    summary: (entry.content[0] ?? entry.title).replace(/\s+/g, ' ').slice(0, 90),
    source: {
      work: `《${BOOK_TITLE}》`,
      locator: `${entry.volume}·${entry.title}`,
      note: BOOK_NOTE,
    },
    content: entry.content.map((text) => ({ type: 'paragraph', text })),
  })),
}

fs.writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

console.log(`Wrote ${path.relative(root, outFile)}`)
console.log(`blocks=${blocks.length} entries=${entries.length}`)
for (const entry of payload.cases) {
  console.log(`${entry.id}\t${entry.mode}\t${entry.subcategory}\t${entry.title}\t${entry.content.length}`)
}
