import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = 'F:/中医/叶天士三人病症论治法/%E4%B8%89%E5%9B%A0%E6%9E%81%E4%B8%80%E7%97%85%E8%AF%81%E6%96%B9%E8%AE%BA'
const outFile = path.join(root, 'src', 'data', 'cases', 'sanyin.json')

const BOOK_TITLE = '三因极一病证方论'
const BOOK_NOTE =
  '据整理稿录入，源文首页题“三因极一病证方论 宋 陈言”。按原书卷次与病证门编次，每门汇录原书叙论、证治与方药，原文照录，未删节。源文为 OCR 整理本，个别字有缺误，以原书为准。方药剂量仅供文献学习。'

const VOLUME_RE = /^卷之[一二三四五六七八九十]+$/

const CATEGORY_RULES = [
  ['妇科', /妇人|求子|恶阻|养胎|胎水|滑胎|产难|产科|蓐劳|阴脱|下乳|恶露|调补|众病/],
  ['儿科', /小儿|变蒸|夜啼|惊风|疳病|魃病/],
  ['五官', /眼|鼻|唇|口病|齿|舌|咽喉|耳病|头痛/],
  ['外科皮肤', /痈疽|疮漏|瘰|瘿瘤|附骨疽|疔肿|肠痈|五痔|肠风|疮疡|癣|妒精疮|大风|斑疮|丹毒|瘾疹|胡臭|漏腋/],
  ['肺系', /咳嗽|痰饮|喘|肺痿|肺痈/],
  ['脾胃', /胀满|霍乱|呕吐|哕逆|醋咽|泄泻|滞下|秘结|脱肛|九虫|伤胃|食呕/],
  ['肝胆', /黄胆|黄汗|谷疸|酒疸|女劳疸|杂劳疸|五疸/],
  ['肾与水病', /淋|遗尿|水肿|腰痛|香港脚|脚气|阴证|阴叙论|消渴|三消/],
  ['神经', /中风|中寒|中暑|中湿|痹|厥|眩晕|痉|破伤风|癫痫|狂证|惊悸|健忘|虚烦|七气|五痿|疝/],
  ['心胸', /心痛|九痛|失血|衄血|吐血|瘀血|汗血|便血|尿血|自汗|五噎|五膈|胸痞/],
  ['外感时病', /伤风|伤寒|伤暑|伤湿|寒湿|风湿|温|君火|五运|六气|疫|疟|四气/],
]

function categoryFor(title) {
  for (const [category, pattern] of CATEGORY_RULES) {
    if (pattern.test(title)) return category
  }
  return '其他'
}

function modeFor(title) {
  return /叙论|叙|论$|序|例$|凡例|脉体|脉式|脉证|脉例|辨正|备论|总论|治法$|说$/.test(title)
    ? 'thought'
    : 'formula'
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

if (files.length !== 55) throw new Error(`expected 55 pages, got ${files.length}`)

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

function closeEntry() {
  if (!current) return
  if (!current.content.length) throw new Error(`empty entry: ${current.volume} ${current.title}`)
  current.id = `sanyin-${String(entries.length + 1).padStart(3, '0')}`
  entries.push(current)
  current = null
}

for (let index = 0; index < blocks.length; index += 1) {
  const line = blocks[index]

  if (index === 0 && /三因极一病证方论/.test(line)) continue

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
      mode: modeFor(line),
      content: [],
    }
    expectTitle = false
    continue
  }

  if (!current) {
    if (line === '序') {
      current = {
        title: '序',
        volume: '卷前',
        category: '其他',
        mode: 'thought',
        content: [],
      }
      continue
    }
    throw new Error(`body before first section: ${line.slice(0, 40)}`)
  }

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

const titleCounts = new Map()
for (const entry of entries) {
  titleCounts.set(entry.title, (titleCounts.get(entry.title) ?? 0) + 1)
}
for (const entry of entries) {
  if ((titleCounts.get(entry.title) ?? 0) > 1) {
    entry.title = `${entry.title}（${entry.volume}）`
  }
}

const payload = {
  generatedAt: new Date().toISOString(),
  book: {
    id: 'sanyin',
    title: BOOK_TITLE,
    author: '陈言',
    era: 'ancient',
    note: BOOK_NOTE,
    caseCount: entries.length,
  },
  cases: entries.map((entry) => ({
    id: entry.id,
    bookId: 'sanyin',
    title: entry.title,
    category: entry.category,
    doctor: '陈言',
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
