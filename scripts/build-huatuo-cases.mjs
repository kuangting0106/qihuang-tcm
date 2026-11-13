import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = 'F:/中医/华佗神方/%E5%8D%8E%E4%BD%97%E7%A5%9E%E6%96%B9'
const outFile = path.join(root, 'src', 'data', 'cases', 'huatuo.json')

const BOOK_TITLE = '华佗神方'
const BOOK_AUTHOR = '华佗'
const BOOK_NOTE =
  '据整理稿录入。旧题汉·华佗撰，孙思邈编次，清乾隆间徐大椿、民国沈骧序。原书按病理、临症、秘方及内、外、妇、儿、五官、伤科等分卷，逐条编号；条文与方药依原文照录，未删节。源文为 OCR 整理本，个别字有缺误，以原书为准。方药剂量仅供文献学习。'

const SECTION_CATEGORY = {
  华佗妇科神方: '妇科',
  华佗产科神方: '妇科',
  华佗儿科神方: '儿科',
  华佗眼科神方: '五官',
  华佗耳科神方: '五官',
  华佗鼻科神方: '五官',
  华佗齿科神方: '五官',
  华佗喉科神方: '五官',
  华佗外科神方: '外科皮肤',
  华佗皮肤科神方: '外科皮肤',
  华佗伤科神方: '外科皮肤',
  华佗结毒科神方: '外科皮肤',
}

const INNER_RULES = [
  ['肺系', /咳嗽|喘|肺|痰/],
  ['脾胃', /呕吐|呕|泻|泄|痢|腹痛|腹胀|脾胃|呃|噎|食/],
  ['肝胆', /肝|胁|黄疸|胆/],
  ['肾与水病', /肾|淋|小便|水肿|腰痛|遗精|尿/],
  ['心胸', /心|血|怔忡|惊悸|胸/],
  ['神经', /中风|风|癫|狂|痫|头痛|眩晕|痉|痹|痛/],
  ['外感时病', /伤寒|温|疟|热|暑|湿|瘟疫/],
]

function categoryFor(section, title) {
  if (SECTION_CATEGORY[section]) return SECTION_CATEGORY[section]
  if (section === '华佗内科神方') {
    for (const [category, pattern] of INNER_RULES) {
      if (pattern.test(title)) return category
    }
  }
  return '其他'
}

function modeFor(section, title) {
  if (section === '卷前' || /病理|养性服饵/.test(section)) return 'thought'
  if (/治奇症|临症/.test(section) && /论/.test(title)) return 'thought'
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

if (files.length !== 39) throw new Error(`expected 39 pages, got ${files.length}`)

const blocks = []
for (const file of files) {
  const text = fs.readFileSync(path.join(sourceDir, file), 'utf8').replace(/\r\n/g, '\n')
  for (const raw of text.split('\n')) {
    const line = cleanLine(raw)
    if (line) blocks.push(line)
  }
}

const ENTRY_RE = /^([一二三四五六七八九十百○〇零0-9]{3,6})[·．]\s*(.+)$/
const SECTION_RE = /^(?:卷[一二三四五六七八九十]+[·．])?(华佗.*神方.*)$/
const VOLUME_RE = /^卷[一二三四五六七八九十]+(?:[·．].*)?$/
const PREFACE_RE = /^(孙序|徐序|沈序)$/

const entries = []
const bodyLines = []
const rendered = []
let section = '卷前'
let current = null

function closeEntry() {
  if (!current) return
  if (!current.content.length) {
    throw new Error(`empty entry: ${current.section} ${current.title}`)
  }
  current.id = `huatuo-${String(entries.length + 1).padStart(3, '0')}`
  entries.push(current)
  rendered.push(...current.content)
  current = null
}

function startEntry(title) {
  closeEntry()
  current = { title: title.trim(), section, content: [] }
}

for (const line of blocks) {
  if (line === '华佗神方 汉 华佗') continue

  if (PREFACE_RE.test(line)) {
    startEntry(line)
    continue
  }

  const sectionMatch = line.match(SECTION_RE)
  if (sectionMatch) {
    closeEntry()
    section = sectionMatch[1]
    continue
  }

  if (VOLUME_RE.test(line)) {
    continue
  }

  const entry = line.match(ENTRY_RE)
  if (entry) {
    startEntry(entry[2])
    continue
  }

  bodyLines.push(line)

  if (!current) startEntry(section === '卷前' ? '序' : section)

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
    id: 'huatuo',
    title: BOOK_TITLE,
    author: BOOK_AUTHOR,
    era: 'ancient',
    note: BOOK_NOTE,
    caseCount: entries.length,
  },
  cases: entries.map((entry) => ({
    id: entry.id,
    bookId: 'huatuo',
    title: entry.title,
    category: categoryFor(entry.section, entry.title),
    doctor: BOOK_AUTHOR,
    mode: modeFor(entry.section, entry.title),
    era: 'ancient',
    subcategory: entry.section,
    summary: (entry.content[0] ?? entry.title).replace(/\s+/g, ' ').slice(0, 90),
    source: {
      work: `《${BOOK_TITLE}》`,
      locator: `${entry.section}·${entry.title}`,
      note: BOOK_NOTE,
    },
    content: entry.content.map((text) => ({ type: 'paragraph', text })),
  })),
}

fs.writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

const categories = new Map()
const modes = new Map()
const sections = new Map()
for (const entry of payload.cases) {
  categories.set(entry.category, (categories.get(entry.category) ?? 0) + 1)
  modes.set(entry.mode, (modes.get(entry.mode) ?? 0) + 1)
  sections.set(entry.subcategory, (sections.get(entry.subcategory) ?? 0) + 1)
}

console.log(`Wrote ${path.relative(root, outFile)}`)
console.log(`blocks=${blocks.length} entries=${entries.length}`)
console.log('categories', Object.fromEntries(categories))
console.log('modes', Object.fromEntries(modes))
console.log('sections', Object.fromEntries(sections))
for (const entry of payload.cases.slice(0, 8)) {
  console.log(`${entry.id}\t${entry.mode}\t${entry.category}\t${entry.subcategory}\t${entry.title}`)
}
