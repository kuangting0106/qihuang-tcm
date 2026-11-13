import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = 'F:/中医/奇效简便良方/%E5%A5%87%E6%95%88%E7%AE%80%E4%BE%BF%E8%89%AF%E6%96%B9'
const outFile = path.join(root, 'src', 'data', 'cases', 'qixiao.json')

const BOOK_TITLE = '奇效简便良方'
const BOOK_NOTE =
  '据整理稿录入，清光绪六年（1880）黄诒谷序、丁尧臣原序，民国十三年（1924）跋；按原书四卷、各门与条目顺序照录。原文为 OCR 整理本，个别字有缺误，以原书为准。方药剂量仅供文献学习。'

const HEADER_RE = /^卷([一二三四五六七八九十]+)[\u3000\s]+(.+)$/

const MEN_CATEGORY = {
  头面: '五官',
  耳目: '五官',
  口鼻: '五官',
  喉舌齿牙: '五官',
  身体: '其他',
  四肢: '外科皮肤',
  胸胃心腹: '脾胃',
  杂症: '其他',
  妇女: '妇科',
  胎产: '妇科',
  小儿: '儿科',
  痘疹: '儿科',
  痧症霍乱: '外感时病',
  便淋泻痢: '脾胃',
  痔漏脱肛: '外科皮肤',
  损伤: '外科皮肤',
  痈疽疮毒: '外科皮肤',
  中毒急救: '其他',
}

const TITLE_RULES = [
  ['妇科', /经|带下|崩|胎|产|孕|乳|子淋|子肿|阴挺|阴痒|月水|月经|难产|小产|催生|胞衣|恶露/],
  ['儿科', /小儿|婴|孩|痘|疹|痧|惊风|疳|囟|脐风/],
  ['肺系', /咳嗽|喘|痰|肺|劳嗽|咯血/],
  ['外科皮肤', /疮|痈|疽|疔|癣|疥|癞|瘰|疬|瘤|瘿|痔|漏|脱肛|跌打|损伤|金疮|汤火|蛇|虫咬|疯狗|狗咬/],
  ['脾胃', /泻|痢|霍乱|呕吐|呕|反胃|呃逆|嗳|腹胀|腹痛|胃|脾|食积|不食|便秘|大便|脱肛/],
  ['肝胆', /胁|黄疸|黄胆|肝/],
  ['肾与水病', /小便|淋|遗尿|遗精|水肿|水臌|臌|腰痛|腰|疝|阴囊|阴肿/],
  ['神经', /中风|半身不遂|瘫痪|癫|痫|痉|抽搐|麻木|头风|头痛|眩晕|不寐|怔忡|惊悸/],
  ['五官', /耳|鼻|口|齿|牙|咽喉|喉|目|眼|舌|唇/],
  ['心胸', /心|胸|吐血|衄血|失血/],
  ['外感时病', /伤寒|伤风|时疫|瘟疫|瘟|疟|寒热|发热|中暑|霍乱|痧/],
]

const BROAD_MEN = new Set(['杂症', '身体', '四肢', '胸胃心腹', '便淋泻痢', '中毒急救'])

function categoryFor(title, men) {
  if (!BROAD_MEN.has(men) && MEN_CATEGORY[men]) return MEN_CATEGORY[men]
  for (const [category, pattern] of TITLE_RULES) {
    if (pattern.test(title)) return category
  }
  return MEN_CATEGORY[men] ?? '其他'
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

const firstHeader = blocks.findIndex((line) => HEADER_RE.test(line))
if (firstHeader < 0) throw new Error('no section header found')

const front = blocks.slice(0, firstHeader)
const entries = []

function pushEntry(title, content, men, mode = 'formula') {
  entries.push({
    title,
    men,
    mode,
    category: categoryFor(title, men),
    content,
  })
}

// 卷前：序、原序、凡例
const frontStart = front[0] === BOOK_TITLE ? 1 : 0
const idxXu = front.findIndex((line, index) => index >= frontStart && line === '序')
const idxYuan = front.findIndex((line) => line === '原序')
const idxFan = front.findIndex((line) => line === '凡例')

if (idxXu < 0 || idxYuan < 0 || idxFan < 0) {
  throw new Error(`front matter headings not found: xu=${idxXu} yuan=${idxYuan} fan=${idxFan}`)
}

pushEntry('序', front.slice(idxXu + 1, idxYuan), '卷前', 'thought')
pushEntry('原序', front.slice(idxYuan + 1, idxFan), '卷前', 'thought')
pushEntry('凡例', front.slice(idxFan + 1), '卷前', 'thought')

let volume = ''
let men = ''
let current = null
let pendingTitle = false

for (let index = firstHeader; index < blocks.length; index += 1) {
  const line = blocks[index]
  const header = line.match(HEADER_RE)

  if (header) {
    volume = `卷${header[1]}`
    men = header[2].trim()
    pendingTitle = true
    current = null
    continue
  }

  if (line === '跋' && !pendingTitle) {
    pushEntry('跋', [], men || '卷前', 'thought')
    current = entries[entries.length - 1]
    pendingTitle = false
    continue
  }

  if (pendingTitle) {
    pushEntry(line, [], men, 'formula')
    current = entries[entries.length - 1]
    pendingTitle = false
    continue
  }

  if (!current) {
    throw new Error(`body before entry: ${line.slice(0, 40)}`)
  }
  current.content.push(line)
}

const entriesWithIds = entries.map((entry, index) => ({
  ...entry,
  id: `qixiao-${String(index + 1).padStart(4, '0')}`,
  volume,
}))

// Recompute volume per entry from its position is not stored; use men for locator.
// Every entry already carries men; volume is derived from men map below.
const VOLUME_BY_MEN = {}
for (let index = firstHeader; index < blocks.length; index += 1) {
  const header = blocks[index].match(HEADER_RE)
  if (header) VOLUME_BY_MEN[header[2].trim()] = `卷${header[1]}`
}

const payload = {
  generatedAt: new Date().toISOString(),
  book: {
    id: 'qixiao',
    title: BOOK_TITLE,
    author: '丁尧臣',
    era: 'ancient',
    note: BOOK_NOTE,
    caseCount: entriesWithIds.length,
  },
  cases: entriesWithIds.map((entry) => {
    const volumeLabel = VOLUME_BY_MEN[entry.men] ?? ''
    const locator = [volumeLabel, entry.men, entry.title].filter(Boolean).join('·')
    return {
      id: entry.id,
      bookId: 'qixiao',
      title: entry.title,
      category: entry.category,
      doctor: '丁尧臣',
      mode: entry.mode,
      era: 'ancient',
      subcategory: [volumeLabel, entry.men].filter(Boolean).join('·'),
      summary: (entry.content[0] ?? entry.title).replace(/\s+/g, ' ').slice(0, 90),
      source: {
        work: `《${BOOK_TITLE}》`,
        locator,
        note:
          entry.mode === 'thought'
            ? `${BOOK_NOTE} 本篇为原书序跋或凡例，属文献资料，不作诊疗依据。`
            : BOOK_NOTE,
      },
      content: entry.content.map((text) => ({ type: 'paragraph', text })),
    }
  }),
}

const normalize = (text) => text.replace(/\s+/g, '')
const expected = normalize(
  blocks.filter((line) => !HEADER_RE.test(line) && line !== BOOK_TITLE).join(''),
)
const actual = normalize(
  entries.flatMap((entry) => [entry.title, ...entry.content]).join(''),
)

if (expected !== actual) {
  let index = 0
  while (index < expected.length && expected[index] === actual[index]) index += 1
  throw new Error(
    `text mismatch at normalized index ${index}\nexpected: ${expected.slice(index, index + 80)}\nactual: ${actual.slice(index, index + 80)}`,
  )
}

fs.writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

const categories = new Map()
const modes = new Map()
for (const entry of payload.cases) {
  categories.set(entry.category, (categories.get(entry.category) ?? 0) + 1)
  modes.set(entry.mode, (modes.get(entry.mode) ?? 0) + 1)
}

console.log(`Wrote ${path.relative(root, outFile)}`)
console.log(`blocks=${blocks.length} entries=${payload.cases.length}`)
console.log('categories', Object.fromEntries(categories))
console.log('modes', Object.fromEntries(modes))
console.log('--- first 12 ---')
for (const entry of payload.cases.slice(0, 12)) {
  console.log(`${entry.id}\t${entry.mode}\t${entry.category}\t${entry.subcategory}\t${entry.title}`)
}
console.log('--- last 12 ---')
for (const entry of payload.cases.slice(-12)) {
  console.log(`${entry.id}\t${entry.mode}\t${entry.category}\t${entry.subcategory}\t${entry.title}`)
}
