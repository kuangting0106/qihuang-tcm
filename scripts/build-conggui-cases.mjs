import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = 'F:/中医/丛桂草堂医案/%E4%B8%9B%E6%A1%82%E8%8D%89%E5%A0%82%E5%8C%BB%E6%A1%88'
const outFile = path.join(root, 'src', 'data', 'cases', 'conggui.json')

const BOOK_TITLE = '丛桂草堂医案'
const BOOK_NOTE =
  '据整理稿录入，源文首页题“丛桂草堂医案 清 袁焯”。按原书卷一至卷四编次，每案保留患者、脉证、辨证、处方与复诊记录，原文照录，未删节。源文为 OCR 整理本，个别字有缺误，以原书为准。方药剂量仅供文献学习。'

const VOLUME_RE = /^卷[一二三四五六七八九十]+$/
const CONTINUATION_RE =
  /^(?:亦|则|予|脉|神|惟|按|大|加|拟|原|乃|遂|急|又|越|饮|舌|而|至|此|其|复|但|随|嘱|闻|今|迄|精|手|头|服|后|两|半|即|翌|次|一|二|三|四|五|六|七|八|九|十|食|面|身|心|胸|腹|口|鼻|耳|目|小|大|便|溲|痰|咳|喘|热|寒|汗|血|经|胎|产|病|症|盖|夫|凡|若|如|因|以|用|与|为|不|未|已|既|将|方|药|再|连|进|稍|略|渐|始|终|竟|遂|乃|适|值|时|当|每|各|诸|凡|所|有|无|多|少|甚|极|殊|颇|稍|先是|由)/

const PATIENT_RE =
  /[\u4e00-\u9fa5]{1,3}(?:君|某|姓|妇|女|翁|夫人|先生|大令|令堂|令阃|令媳|令爱|令郎|室人|家慈|老妇|少年|幼子|孀妇)/
const CHILD_RE = /(?:姓|某|氏)(?:子|女)|[\u4e00-\u9fa5]{2,3}(?:子|女)(?=年|甫|生|病|患|发|秋|春|夏|冬)/
const AGE_RE = /年(?:约|近|逾|方|已|将)?[一二三四五六七八九十百0-9]+(?:岁|旬|余)/
const DATE_RE =
  /^(?:[庚辛壬癸甲乙丙丁戊己][戌亥子丑寅卯辰巳午未申酉]|(?:今年|明年|去年|是年|本年)|[\u4e00-\u9fa5]{0,4}(?:春|夏|秋|冬)(?:间|月|日)?|\d{1,2}月)/

const CATEGORY_RULES = [
  ['妇科', /崩|小产|产后|胎前|怀孕|妊娠|经水|月经|带下|乳|阴|产/],
  ['儿科', /幼子|小儿|孩|童|岁|痘|疹|惊风|疳/],
  ['肺系', /咳嗽|咳|喘|痰|肺|失音|音嗄/],
  ['脾胃', /呕吐|呕|泻|泄|痢|腹痛|腹胀|饮食|脾胃|大便|便秘|霍乱/],
  ['肝胆', /胁|黄|疸|肝/],
  ['肾与水病', /小便|溲|淋|水肿|肿|腰痛|遗/],
  ['神经', /头痛|头晕|眩晕|悸|怔忡|不寐|失眠|狂|谵语|神昏|中风|痹|关节|抽搐|痉/],
  ['五官', /目|眼|耳|鼻|口|齿|咽喉|舌/],
  ['心胸', /心悸|怔忡|心痛|胸|吐血|衄血|血/],
  ['外科皮肤', /痈|疽|疮|疔|瘰|瘤|癣|痔|损伤|折/],
  ['外感时病', /温病|伤寒|感冒|发热|寒热|暑|湿|霍乱|疟|疫/],
]

function categoryFor(text) {
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

if (files.length !== 8) throw new Error(`expected 8 pages, got ${files.length}`)

const blocks = []
for (const file of files) {
  const text = fs.readFileSync(path.join(sourceDir, file), 'utf8').replace(/\r\n/g, '\n')
  for (const raw of text.split('\n')) {
    const line = cleanLine(raw)
    if (line) blocks.push(line)
  }
}

function isCaseStart(text) {
  if (VOLUME_RE.test(text)) return false
  if (/^(?:序|自序|跋)$/.test(text)) return false
  if (/(?:书于|识于|谨序|拜序|序于|题于|记于)/.test(text)) return false
  if (CONTINUATION_RE.test(text) && !PATIENT_RE.test(text.slice(0, 12))) return false
  const head = text.slice(0, 40)
  const patient = head.match(PATIENT_RE)?.[0]
  if (patient && !/^(?:家君|诸君|众君|此君|其君|先君|府君|其子|其女)/.test(patient)) return true
  if (CHILD_RE.test(head)) return true
  if (AGE_RE.test(head)) return true
  if (DATE_RE.test(text)) return true
  return false
}

const entries = []
const rendered = []
let volume = '卷前'
let current = null

function openEntry(title, mode = 'case') {
  current = {
    title,
    volume,
    category: '其他',
    mode,
    content: [],
  }
}

function closeEntry() {
  if (!current) return
  if (!current.content.length) throw new Error(`empty entry: ${current.title}`)
  current.id = `conggui-${String(entries.length + 1).padStart(3, '0')}`
  entries.push(current)
  rendered.push(...current.content)
  current = null
}

for (let index = 0; index < blocks.length; index += 1) {
  const line = blocks[index]

  if (index === 0 && /丛桂草堂医案/.test(line)) continue

  if (VOLUME_RE.test(line)) {
    closeEntry()
    volume = line
    continue
  }

  if (index === 1 && line === '序') {
    closeEntry()
    openEntry('序', 'thought')
    continue
  }

  if (line === '自序') {
    closeEntry()
    openEntry('自序', 'thought')
    continue
  }

  if (line === '跋') {
    closeEntry()
    openEntry('跋', 'thought')
    continue
  }

  if (isCaseStart(line)) {
    closeEntry()
    const match = line.slice(0, 40).match(PATIENT_RE)
    const firstSentence = line.split('。')[0].slice(0, 28)
    openEntry(match ? match[0] : firstSentence)
    current.content.push(line)
    continue
  }

  if (!current) throw new Error(`body before first case: ${line.slice(0, 50)}`)
  current.content.push(line)
}

closeEntry()

const normalize = (text) => text.replace(/\s+/g, '')
const expected = normalize(
  blocks
    .filter((line, index) => !(index === 0 && /丛桂草堂医案/.test(line)))
    .filter((line) => !VOLUME_RE.test(line))
    .filter((line) => !/^(?:序|自序|跋)$/.test(line))
    .join(''),
)
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
    id: 'conggui',
    title: BOOK_TITLE,
    author: '袁焯',
    era: 'ancient',
    note: BOOK_NOTE,
    caseCount: entries.length,
  },
  cases: entries.map((entry) => ({
    id: entry.id,
    bookId: 'conggui',
    title: entry.title,
    category:
      entry.mode === 'case'
        ? categoryFor(`${entry.title} ${(entry.content[0] ?? '').slice(0, 400)}`)
        : '其他',
    doctor: '袁焯',
    mode: entry.mode,
    era: 'ancient',
    subcategory: entry.volume,
    summary: (entry.content[0] ?? entry.title).replace(/\s+/g, ' ').slice(0, 90),
    source: {
      work: `《${BOOK_TITLE}》`,
      locator: entry.volume,
      note: BOOK_NOTE,
    },
    content: entry.content.map((text) => ({ type: 'paragraph', text })),
  })),
}

fs.writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

const modes = new Map()
const categories = new Map()
for (const entry of payload.cases) {
  modes.set(entry.mode, (modes.get(entry.mode) ?? 0) + 1)
  categories.set(entry.category, (categories.get(entry.category) ?? 0) + 1)
}

console.log(`Wrote ${path.relative(root, outFile)}`)
console.log(`blocks=${blocks.length} entries=${entries.length}`)
console.log('modes', Object.fromEntries(modes))
console.log('categories', Object.fromEntries(categories))
for (const entry of payload.cases) {
  console.log(`${entry.id}\t${entry.mode}\t${entry.subcategory}\t${entry.title}`)
}
