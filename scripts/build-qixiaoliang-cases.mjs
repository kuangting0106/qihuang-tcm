import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = 'F:/中医/奇效良方/%E5%A5%87%E6%95%88%E8%89%AF%E6%96%B9'
const outFile = path.join(root, 'src', 'data', 'cases', 'qixiaoliang.json')

const BOOK_TITLE = '奇效良方'
const BOOK_NOTE =
  '据整理稿录入，源文首页题“奇效良方 明 董宿”。按原书卷次与门类编次；每一门收录该门通治方及随证诸方，原文、药味与剂量照录，未删节。源文为 OCR 整理本，个别字有缺误，以原书为准。方药剂量仅供文献学习。'

const HEADER_RE = /^卷之?([一二三四五六七八九十百]+)[\s\u3000]+(.+)$/
const BARE_VOLUME_RE = /^卷之?([一二三四五六七八九十百]+)$/

const CATEGORY_RULES = [
  ['妇科', /妇人|调经|胎前|产后|产後|崩漏|带下|乳/],
  ['儿科', /小儿|痘|疹|惊风|疳/],
  ['五官', /眼目|耳|鼻|口舌|咽喉|牙齿/],
  ['外科皮肤', /疮疡|正骨|金镞|腋臭|痔|脱肛|瘰|疥|癣|痈|疽|疔|疮/],
  ['肺系', /咳嗽|痰饮|喘|咳逆|肺/],
  ['脾胃', /脾胃|呕吐|哕|翻胃|膈噎|泄泻|痢|霍乱|宿食|秘结|胀满|积聚|诸虫/],
  ['肝胆', /胁痛|五疸|黄/],
  ['肾与水病', /腰痛|诸淋|遗溺|遗精|水肿|消渴|香港脚|脚气/],
  ['神经', /头痛|头风|眩晕|中风|痿|痹|怔忡|健忘|动悸|疝/],
  ['心胸', /心痛|诸血|自汗|盗汗/],
  ['外感时病', /风门|寒门|暑门|湿门|燥门|火门|伤寒|疟|中恶|诸毒|积热|痼冷/],
]

function categoryFor(men) {
  for (const [category, pattern] of CATEGORY_RULES) {
    if (pattern.test(men)) return category
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

if (files.length !== 238) throw new Error(`expected 238 pages, got ${files.length}`)

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
let current = null
let currentKey = ''
let currentSection = ''
let currentVolume = ''
let afterBareVolume = false
const sectionSeen = new Set()

function closeEntry() {
  if (!current) return
  entries.push(current)
  current = null
}

for (let index = 0; index < blocks.length; index += 1) {
  const line = blocks[index]

  if (index === 0 && /奇效良方/.test(line)) continue
  if (BARE_VOLUME_RE.test(line)) {
    const volume = line.trim()
    if (volume !== currentVolume) {
      currentVolume = volume
      sectionSeen.clear()
    }
    afterBareVolume = true
    continue
  }

  const header = line.match(HEADER_RE)
  if (header) {
    afterBareVolume = false
    const name = header[2].trim()
    const isMen = /门/.test(name)
    const key = isMen ? name : currentKey || name
    if (!isMen && !current) {
      // A bare subsection before any men: keep it as its own section.
    }
    if (key !== currentKey) {
      closeEntry()
      currentKey = key
      currentSection = isMen ? '' : name
      sectionSeen.clear()
      current = {
        title: key.replace(/（附论）|\(附论\)/g, '').trim(),
        men: key,
        category: categoryFor(key),
        mode: 'formula',
        content: [],
      }
    }
    if (!isMen && name) {
      if (!sectionSeen.has(`section:${currentVolume}:${name}`)) {
        sectionSeen.add(`section:${currentVolume}:${name}`)
        current.content.push(name)
        rendered.push(name)
      }
      currentSection = name
    }
    continue
  }

  if (afterBareVolume) {
    if (!current) {
      current = {
        title: '卷前',
        men: '卷前',
        category: '其他',
        mode: 'thought',
        content: [],
      }
      currentKey = '卷前'
    }
    currentSection = line
    afterBareVolume = false
    sectionSeen.add(`section:${currentVolume}:${line}`)
    current.content.push(line)
    rendered.push(line)
    continue
  }

  if (!current) {
    // Preface or stray text before the first section.
    current = {
      title: '卷前',
      men: '卷前',
      category: '其他',
      mode: 'thought',
      content: [],
    }
    currentKey = '卷前'
  }

  current.content.push(line)
  rendered.push(line)
}

closeEntry()

const normalize = (text) => text.replace(/\s+/g, '')

// Source text without volume headers and repeated section labels.
const expectedBlocks = []
for (let index = 0; index < blocks.length; index += 1) {
  const line = blocks[index]
  if (index === 0 && /奇效良方/.test(line)) continue
  if (BARE_VOLUME_RE.test(line)) continue
  if (HEADER_RE.test(line)) continue
  expectedBlocks.push(line)
}

// Repeated section labels (通治方 etc.) appear many times in the source and are
// part of the original text; only bare-volume section headings are stored once.
const expected = expectedBlocks

const expectedText = normalize(expected.join(''))
const actualText = normalize(rendered.join(''))

if (expectedText !== actualText) {
  let index = 0
  while (index < expectedText.length && expectedText[index] === actualText[index]) index += 1
  throw new Error(
    `text mismatch at normalized index ${index}\nexpected: ${expectedText.slice(index, index + 80)}\nactual: ${actualText.slice(index, index + 80)}`,
  )
}

const payload = {
  generatedAt: new Date().toISOString(),
  book: {
    id: 'qixiaoliang',
    title: BOOK_TITLE,
    author: '董宿',
    era: 'ancient',
    note: BOOK_NOTE,
    caseCount: entries.length,
  },
  cases: entries.map((entry, index) => ({
    id: `qixiaoliang-${String(index + 1).padStart(3, '0')}`,
    bookId: 'qixiaoliang',
    title: entry.title,
    category: entry.category,
    doctor: '董宿',
    mode: entry.mode,
    era: 'ancient',
    subcategory: entry.men,
    summary: (entry.content[0] ?? entry.title).replace(/\s+/g, ' ').slice(0, 90),
    source: {
      work: `《${BOOK_TITLE}》`,
      locator: entry.men,
      note: BOOK_NOTE,
    },
    content: entry.content.map((text) => ({ type: 'paragraph', text })),
  })),
}

fs.writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

const categories = new Map()
for (const entry of payload.cases) {
  categories.set(entry.category, (categories.get(entry.category) ?? 0) + 1)
}

console.log(`Wrote ${path.relative(root, outFile)}`)
console.log(`blocks=${blocks.length} entries=${entries.length}`)
console.log('categories', Object.fromEntries(categories))
console.log('--- entries ---')
for (const entry of payload.cases) {
  console.log(`${entry.id}\t${entry.category}\t${entry.subcategory}\t${entry.content.length}\t${entry.title}`)
}
