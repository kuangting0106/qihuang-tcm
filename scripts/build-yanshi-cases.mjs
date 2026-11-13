import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = 'F:/中医/严用和医案/%E4%B8%A5%E6%B0%8F%E6%B5%8E%E7%94%9F%E6%96%B9'
const outFile = path.join(root, 'src', 'data', 'cases', 'yanshi.json')

const BOOK_TITLE = '严氏济生方'
const BOOK_NOTE =
  '据整理稿录入，源文首页题“严氏济生方 宋 严用和”。按原书诸门编次，门下设论治、评治等节；每节汇录原书方论、方药与炮制用法，原文照录，未删节。源文为 OCR 整理本，个别字有缺误，以原书为准。方药剂量仅供文献学习。'

const BARE_MEN_RE = /^([\u4e00-\u9fa5]{1,8}门)$/
const SECTION_RE = /^([\u4e00-\u9fa5]{1,8}门)[\u3000\s]+(.+)$/
const SECTION_TITLE_RE = /^[\u4e00-\u9fa5]{0,14}(?:论治|评治|方)$/
const PREFACE_RE = /^原序[一二三四五六七八九十]*$/

const CATEGORY_RULES = [
  ['妇科', /妇人|胎前|产后|产後|崩漏|带下|恶阻|子烦|滑胎|求子|血瘕|妇室/],
  ['儿科', /小儿|痘|疹|惊风|疳/],
  ['五官', /眼|咽喉|口齿|口论|齿论|唇论|舌论|耳|鼻|头面|头痛/],
  ['外科皮肤', /痈疽|肺痈|丁肿|疔肿|疮疥|癣|瘿瘤|瘰|五痔|肠风|脏毒|金疮/],
  ['肺系', /咳喘|咳嗽|喘论|痰饮|肺/],
  ['脾胃', /脾胃|宿食|胀满|霍乱|呕吐|翻胃|噎膈|咳逆|大便|泄泻|痢疾|秘结|积聚/],
  ['肝胆', /黄疸|五疸|胁痛|肝胆/],
  ['肾与水病', /水肿|小便|淋利|白浊|赤浊|遗精|脚气|香港脚|腰痛|消渴|肾膀胱|阴论治/],
  ['神经', /诸风|中风|白虎历节|眩晕|癫痫|惊悸|怔忡|健忘|虚烦|诸痹|五痹/],
  ['心胸', /心腹痛|心痛|血病|失血|便血|诸汗|自汗|心小肠/],
  ['外感时病', /诸寒|中寒|诸暑|中暑|诸湿|中湿|痼冷积热|诸疟/],
]

function categoryFor(volume, title) {
  const text = `${volume}${title}`
  for (const [category, pattern] of CATEGORY_RULES) {
    if (pattern.test(text)) return category
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

if (files.length !== 25) throw new Error(`expected 25 pages, got ${files.length}`)

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
let volume = ''
let current = null

function closeEntry() {
  if (!current) return
  if (!current.content.length) throw new Error(`empty entry: ${current.volume} ${current.title}`)
  current.id = `yanshi-${String(entries.length + 1).padStart(3, '0')}`
  entries.push(current)
  current = null
}

for (let index = 0; index < blocks.length; index += 1) {
  const line = blocks[index]

  if (index === 0 && /严氏济生方/.test(line)) continue
  if (/^（附[:：].+）$/.test(line)) continue

  if (PREFACE_RE.test(line)) {
    closeEntry()
    current = {
      title: line,
      volume: '卷前',
      category: '其他',
      mode: 'thought',
      content: [],
    }
    continue
  }

  const bare = line.match(BARE_MEN_RE)
  if (bare) {
    closeEntry()
    volume = bare[1]
    continue
  }

  if (!current && volume && SECTION_TITLE_RE.test(line)) {
    current = {
      title: line,
      volume,
      category: categoryFor(volume, line),
      mode: 'formula',
      content: [],
    }
    continue
  }

  const section = line.match(SECTION_RE)
  if (section) {
    const sectionVolume = section[1]
    const title = section[2].replace(/[\s\u3000]+/g, '').trim()
    if (!current || current.volume !== sectionVolume || current.title !== title) {
      closeEntry()
      volume = sectionVolume
      current = {
        title,
        volume: sectionVolume,
        category: categoryFor(sectionVolume, title),
        mode: 'formula',
        content: [],
      }
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
    id: 'yanshi',
    title: BOOK_TITLE,
    author: '严用和',
    era: 'ancient',
    note: BOOK_NOTE,
    caseCount: entries.length,
  },
  cases: entries.map((entry) => ({
    id: entry.id,
    bookId: 'yanshi',
    title: entry.title,
    category: entry.category,
    doctor: '严用和',
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
const volumes = new Map()
for (const entry of payload.cases) {
  categories.set(entry.category, (categories.get(entry.category) ?? 0) + 1)
  volumes.set(entry.subcategory, (volumes.get(entry.subcategory) ?? 0) + 1)
}

console.log(`Wrote ${path.relative(root, outFile)}`)
console.log(`blocks=${blocks.length} entries=${entries.length}`)
console.log('categories', Object.fromEntries(categories))
console.log('volumes', Object.fromEntries(volumes))
console.log('--- entries ---')
for (const entry of payload.cases) {
  console.log(`${entry.id}\t${entry.category}\t${entry.subcategory}\t${entry.title}\t${entry.content.length}`)
}
