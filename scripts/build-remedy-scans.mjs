import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'

const ROOT = path.resolve(import.meta.dirname, '..')
const OCR_DIR = process.env.OCR_DIR ?? 'C:/Users/16922/AppData/Local/Temp/opencode'
const OCR_FILE = path.join(OCR_DIR, 'ocr-QZ01.json')
const REMEDIES = path.join(ROOT, 'data/remedies.jsonl')
const OUT_DIR = path.join(ROOT, 'public/data/remedy-scans')
const IMAGE_DIR = '/images/remedy-scans/QZ01'

const OTHER_BOOKS = [
  { id: 'CJ_HN1970', title: '赤脚医生手册（湖南 1970）', note: '扫描页 OCR，机器识别·待校；原图尚未入库。' },
  { id: 'CJ_JL1970', title: '赤脚医生手册（吉林 1970）', note: '扫描页 OCR，机器识别·待校；原图尚未入库。' },
  { id: 'CJ_SH1969', title: '赤脚医生手册（上海 1969）', note: '扫描页 OCR，机器识别·待校；原图尚未入库。' },
  { id: 'CQ1960', title: '重庆草药（1960）', note: '扫描页 OCR，机器识别·待校；原图尚未入库。' },
  { id: 'TYDXF', title: 'TYDXF 扫描本（书名待核）', note: '扫描页 OCR，机器识别·待校；原图尚未入库。' },
]

const norm = (s) => String(s ?? '').replace(/[^\u4e00-\u9fff0-9A-Za-z]/g, '')

function bigrams(text) {
  const set = new Set()
  for (let i = 0; i < text.length - 1; i += 1) set.add(text.slice(i, i + 2))
  return set
}

function overlapScore(querySet, pageSet) {
  let hits = 0
  for (const gram of querySet) if (pageSet.has(gram)) hits += 1
  return querySet.size ? hits / querySet.size : 0
}

const ocr = JSON.parse(fs.readFileSync(OCR_FILE, 'utf8').replace(/^\uFEFF/, ''))
  .map((item) => {
    const page = Number(item.page)
    const text = norm(item.text)
    return { page, text, grams: bigrams(text) }
  })
  .filter((item) => item.page >= 1)
  .sort((a, b) => a.page - b.page)

const records = []
const rl = readline.createInterface({ input: fs.createReadStream(REMEDIES, 'utf8'), crlfDelay: Infinity })
for await (const line of rl) {
  if (!line.includes('"qz-')) continue
  const record = JSON.parse(line)
  if (record.id.startsWith('qz-')) records.push(record)
}
records.sort((a, b) => a.id.localeCompare(b.id))

const sectionOrder = []
for (const record of records) {
  if (!sectionOrder.includes(record.section)) sectionOrder.push(record.section)
}

// QZ01 前 9 页为封面、目录等；正文从第 10 页开始。
const sectionStart = new Map()
let cursor = 10
for (const section of sectionOrder) {
  const needle = norm(section)
  let found = 0
  if (needle.length >= 2) {
    for (const page of ocr) {
      if (page.page < cursor) continue
      if (page.text.includes(needle)) {
        found = page.page
        break
      }
    }
  }
  if (found) cursor = found
  sectionStart.set(section, cursor)
}

const orderedStarts = sectionOrder.map((section) => sectionStart.get(section))
const nextStart = (section) => {
  const index = sectionOrder.indexOf(section)
  for (let i = index + 1; i < orderedStarts.length; i += 1) {
    if (orderedStarts[i] > orderedStarts[index]) return orderedStarts[i]
  }
  return 279
}

const remedyPages = {}
const modeCount = { text: 0, section: 0 }
for (const record of records) {
  const start = sectionStart.get(record.section) ?? 10
  const end = Math.min(279, Math.max(start, nextStart(record.section) + 1))
  const query = norm(`${record.formula ?? ''}${record.indications ?? ''}${record.title ?? ''}`).slice(0, 240)
  const querySet = bigrams(query)
  let bestPage = start
  let bestScore = 0
  for (const page of ocr) {
    if (page.page < start || page.page > end) continue
    let score = overlapScore(querySet, page.grams)
    if (query.length >= 8) {
      for (let i = 0; i + 8 <= query.length; i += 6) {
        if (page.text.includes(query.slice(i, i + 8))) score += 0.35
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestPage = page.page
    }
  }
  const matched = bestScore >= 0.12
  remedyPages[record.id] = {
    page: matched ? bestPage : start,
    mode: matched ? 'text' : 'section',
    score: Number(bestScore.toFixed(3)),
  }
  modeCount[matched ? 'text' : 'section'] += 1
}

fs.mkdirSync(OUT_DIR, { recursive: true })
const book = {
  id: 'QZ01',
  title: '泉州民间偏方验方选辑',
  totalPages: ocr.length,
  imageDir: IMAGE_DIR,
  hasImages: true,
  note: '扫描页 OCR 为 Windows.Media.Ocr 机器识别，未逐字校对；页码为扫描图片顺序，页内印刷页码可能不同。',
}
fs.writeFileSync(
  path.join(OUT_DIR, 'QZ01.json'),
  `${JSON.stringify({ book, pages: ocr.map(({ page, text }) => ({ page, text })), remedyPages }, null, 0)}\n`,
)

const books = [book]
for (const meta of OTHER_BOOKS) {
  const file = path.join(OCR_DIR, `ocr-${meta.id}.json`)
  if (!fs.existsSync(file)) {
    console.warn('missing OCR:', meta.id)
    continue
  }
  const pages = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''))
    .map((item) => ({ page: Number(item.page), text: norm(item.text) }))
    .filter((item) => item.page >= 1)
    .sort((a, b) => a.page - b.page)
  const other = {
    id: meta.id,
    title: meta.title,
    totalPages: pages.length,
    imageDir: '',
    hasImages: false,
    note: meta.note,
  }
  books.push(other)
  fs.writeFileSync(
    path.join(OUT_DIR, `${meta.id}.json`),
    `${JSON.stringify({ book: other, pages, remedyPages: {} }, null, 0)}\n`,
  )
}

fs.writeFileSync(
  path.join(OUT_DIR, 'index.json'),
  `${JSON.stringify({ books, remedyPages }, null, 2)}\n`,
)
console.log('QZ01 pages:', ocr.length, 'remedies:', records.length, 'matches:', modeCount)
console.log('scan books:', books.map((item) => `${item.id}:${item.totalPages}`).join(' '))
console.log('written:', OUT_DIR)
