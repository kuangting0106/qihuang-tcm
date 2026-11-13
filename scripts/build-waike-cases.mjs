import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = 'F:/中医/外科集验方/%E5%A4%96%E7%A7%91%E9%9B%86%E9%AA%8C%E6%96%B9'
const outFile = path.join(root, 'src', 'data', 'cases', 'waike.json')

const BOOK_TITLE = '外科集验方'
const BOOK_NOTE =
  '据整理稿录入，源文首页题“外科集验方 明 赵宜真”，序署“弘治戊午岁秋九月吉日，良医副臣周文采稽首顿首谨序”。按卷上、卷下及原书节次整理，方论、方药与剂量照录，未删节；底本为 OCR 整理本，个别字有缺误，以原书为准。方药剂量仅供文献学习。'

const SECTIONS = new Set([
  '疮科总论',
  '五发痈疽论',
  '五发痈疽通治方',
  '疔疮论',
  '瘰论',
  '肠痈痔论',
  '乳痈论',
  '肺痈论',
  '诸疳疮论',
  '附骨疽论',
  '诸疮论',
  '疥癣论',
  '瘿瘤论',
  '疮论',
  '便毒论',
])

function categoryFor(title) {
  if (/肺痈/.test(title)) return '肺系'
  return '外科皮肤'
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

if (files.length !== 13) throw new Error(`expected 13 pages, got ${files.length}`)

const blocks = []
for (const file of files) {
  const text = fs.readFileSync(path.join(sourceDir, file), 'utf8').replace(/\r\n/g, '\n')
  for (const raw of text.split('\n')) {
    const line = cleanLine(raw)
    if (line) blocks.push(line)
  }
}

const entries = []
const rendered = []
const expected = []
let volume = ''
let current = null

function closeEntry() {
  if (!current) return
  entries.push(current)
  rendered.push(current.title, ...current.content)
  current = null
}

for (const raw of blocks) {
  const text = raw.trim()

  if (/^外科集验方/.test(text)) continue

  if (/^卷[上下]$/.test(text)) {
    volume = text
    continue
  }

  // Page headers sometimes run the volume and section together, e.g.
  // “卷上五发痈疽论”. Strip the volume prefix before matching a section.
  const stripped = text.replace(/^卷[上下]/, '')
  if (SECTIONS.has(stripped)) {
    closeEntry()
    volume = text.startsWith('卷下') ? '卷下' : volume || '卷上'
    current = {
      title: stripped,
      volume,
      category: categoryFor(stripped),
      mode: 'formula',
      content: [],
    }
    expected.push(text)
    continue
  }

  if (text === '序') {
    closeEntry()
    current = {
      title: '序',
      volume: '卷前',
      category: '其他',
      mode: 'thought',
      content: [],
    }
    expected.push(text)
    continue
  }

  if (!current) {
    // Any residual front matter before 序 belongs to the preface.
    current = {
      title: '卷前',
      volume: '卷前',
      category: '其他',
      mode: 'thought',
      content: [],
    }
  }

  current.content.push(text)
  expected.push(text)
}

closeEntry()

const normalize = (text) => text.replace(/\s+/g, '')
const expectedText = normalize(expected.join(''))
const actualText = normalize(rendered.join(''))
if (expectedText !== actualText) {
  let index = 0
  while (index < expectedText.length && expectedText[index] === actualText[index]) index += 1
  throw new Error(
    `text mismatch at ${index}\nexpected: ${expectedText.slice(index, index + 80)}\nactual: ${actualText.slice(index, index + 80)}`,
  )
}

const payload = {
  generatedAt: new Date().toISOString(),
  book: {
    id: 'waike',
    title: BOOK_TITLE,
    author: '赵宜真',
    era: 'ancient',
    note: BOOK_NOTE,
    caseCount: entries.length,
  },
  cases: entries.map((entry, index) => ({
    id: `waike-${String(index + 1).padStart(3, '0')}`,
    bookId: 'waike',
    title: entry.title,
    category: entry.category,
    doctor: '赵宜真',
    mode: entry.mode,
    era: 'ancient',
    subcategory: `${entry.volume}·${entry.title}`,
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
  console.log(`${entry.id}\t${entry.mode}\t${entry.category}\t${entry.subcategory}\t${entry.content.length}`)
}
