import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = 'F:/中医/一得集/%E4%B8%80%E5%BE%97%E9%9B%86'
const outFile = path.join(root, 'src', 'data', 'cases', 'yide.json')

const BOOK_TITLE = '一得集'
const BOOK_NOTE =
  '据整理稿录入，源文首页题“一得集 清 心禅（释）”。卷上诸论、卷中医案、卷下医案依原书顺序编排，原文照录，未删节。源文为 OCR 整理本，个别字有缺误，以原书为准。方药剂量仅供文献学习。'

const VOLUME_RE = /^卷[上中下](诸论|医案)$/

const CATEGORY_RULES = [
  ['妇科', /妇人|妇|产后|半产|血崩|怪胎|转胞|血风|室人/],
  ['儿科', /小儿|姓子|儿/],
  ['外科皮肤', /疮|发背|瘰|肠痈|结毒|颐/],
  ['五官', /喉|头风|头痛|目|耳|鼻|齿/],
  ['肺系', /喘|咳|哮|痰/],
  ['脾胃', /泻|痢|霍乱|胸痛|虫|胀|呕|便闭|食/],
  ['神经', /中风|痫|厥|偏枯|痉|惊悸|不寐|头风抽掣/],
  ['心胸', /真心痛|胸痹|吐血|血结|贲豚|狐疝|寒疝/],
  ['肾与水病', /香港脚|脚气|转胞|淋|水肿|腰痛|阳越|亢阳/],
  ['外感时病', /暑|温|伤寒|湿|疟|风热|发热|冬温|感/],
]

function categoryFor(title) {
  for (const [category, pattern] of CATEGORY_RULES) {
    if (pattern.test(title)) return category
  }
  return '其他'
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

if (files.length !== 12) throw new Error(`expected 12 pages, got ${files.length}`)

const blocks = []
for (const file of files) {
  const text = fs.readFileSync(path.join(sourceDir, file), 'utf8').replace(/\r\n/g, '\n')
  for (const raw of text.split('\n')) {
    const line = cleanLine(raw)
    if (line) blocks.push(line)
  }
}

const entries = []
const contentBlocks = []
let volume = '卷前'
let expectTitle = false
let current = null
let xuCount = 0

function closeEntry() {
  if (!current) return
  if (!current.content.length) throw new Error(`empty entry: ${current.title}`)
  current.id = `yide-${String(entries.length + 1).padStart(3, '0')}`
  entries.push(current)
  current = null
}

for (let index = 0; index < blocks.length; index += 1) {
  const line = blocks[index]

  if (index === 0 && /一得集/.test(line)) continue

  if (VOLUME_RE.test(line)) {
    closeEntry()
    volume = line
    expectTitle = true
    continue
  }

  if (expectTitle) {
    closeEntry()
    current = {
      title: line,
      volume,
      category: categoryFor(line),
      mode: volume.includes('诸论') ? 'thought' : 'case',
      content: [],
    }
    expectTitle = false
    continue
  }

  if (volume === '卷前') {
    if (line === '叙' || line === '自叙') {
      closeEntry()
      if (line === '叙') {
        xuCount += 1
        current = {
          title: `叙（${xuCount}）`,
          volume,
          category: '其他',
          mode: 'thought',
          content: [],
        }
      } else {
        current = { title: line, volume, category: '其他', mode: 'thought', content: [] }
      }
      continue
    }
    if (!current) throw new Error(`preface body before title: ${line.slice(0, 40)}`)
    current.content.push(line)
    contentBlocks.push(line)
    continue
  }

  if (line === '跋') {
    closeEntry()
    if (!current) {
      current = { title: '跋', volume: '卷末', category: '其他', mode: 'thought', content: [] }
    }
    continue
  }

  if (!current) throw new Error(`body before first section: ${line.slice(0, 40)}`)
  current.content.push(line)
  contentBlocks.push(line)
}

closeEntry()

const normalize = (text) => text.replace(/\s+/g, '')
const expected = normalize(contentBlocks.join(''))
const actual = normalize(entries.flatMap((entry) => entry.content).join(''))

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
    id: 'yide',
    title: BOOK_TITLE,
    author: '心禅（释）',
    era: 'ancient',
    note: BOOK_NOTE,
    caseCount: entries.length,
  },
  cases: entries.map((entry) => ({
    id: entry.id,
    bookId: 'yide',
    title: entry.title,
    category: entry.category,
    doctor: '心禅',
    mode: entry.mode,
    era: 'ancient',
    subcategory: entry.volume,
    summary: (entry.content[0] ?? entry.title).replace(/\s+/g, ' ').slice(0, 90),
    source: {
      work: `《${BOOK_TITLE}》`,
      locator: entry.volume === '卷前' ? entry.title : `${entry.volume}·${entry.title}`,
      note: BOOK_NOTE,
    },
    content: entry.content.map((text) => ({ type: 'paragraph', text })),
  })),
}

fs.writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

const categories = new Map()
const modes = new Map()
for (const entry of payload.cases) {
  categories.set(entry.category, (categories.get(entry.category) ?? 0) + 1)
  modes.set(entry.mode, (modes.get(entry.mode) ?? 0) + 1)
}

console.log(`Wrote ${path.relative(root, outFile)}`)
console.log(`blocks=${blocks.length} entries=${entries.length}`)
console.log('categories', Object.fromEntries(categories))
console.log('modes', Object.fromEntries(modes))
