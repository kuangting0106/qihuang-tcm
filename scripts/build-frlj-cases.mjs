import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = 'F:/中医/妇人良方集要/%E5%A6%87%E4%BA%BA%E8%89%AF%E6%96%B9%E9%9B%86%E8%A6%81'
const outFile = path.join(root, 'src', 'data', 'cases', 'frlj.json')

const NUM = '[一二三四五六七八九十百零〇两0-9。]{1,10}'
const MEN_RE = new RegExp(`^第${NUM}门[，,]?\\s*(.+)$`)
const ZHANG_RE = new RegExp(`^第${NUM}章[，,]?\\s*(.+)$`)

const BOOK_TITLE = '妇人良方集要'
const BOOK_NOTE =
  '据整理稿录入，源文首页题“妇人良方 宋 陈自明”。按原书九门编次；源文第241、242章标题重复，前章内容为后章的前半，已合并为一章；原文为 OCR 整理本，个别字有缺误，以原书为准。方药剂量仅供文献学习。'

const RITUAL_RE =
  /催生灵符|禁草法|禁水法|体玄子借地法|月空方位例|推妇人行年法|转女为男法|推支干旺相日法|推每月宿日|逐月.*藏衣忌向方位|交会禁忌/
const THEORY_RE =
  /^产宝方周序$|^脉例$|^诊妇人有妊歌$|^验胎法$|^食忌论$|^孕妇药忌歌$|^妊娠经论$|^受形论$|^受形篇$|^论胎教$|^孕元立本章$|^凝形殊禀章$|^气质生成章$/

const CATEGORY_RULES = [
  [
    '妇科',
    /月经|月水|经闭|经行|崩|带下|血枯|室女|求子|求嗣|无子|胎教|妊娠|孕妇|胎动|漏胎|堕胎|断产|产难|产後|产后|坐月|胞衣|恶露|儿枕|蓐劳|乳少|乳出|吹乳|妒乳|阴挺|阴肿|阴痒|阴冷|交接|小户嫁痛|转脬|子淋|子烦|子肿|脏燥|交骨|血室|疝瘕|八瘕|症痞|食症|皿症|瘀血|倂癖|心腹|小腹痛|鬼交|阴蚀|如乳/,
  ],
  ['肺系', /咳嗽|喘|痰|肺痈|劳嗽/],
  ['外科皮肤', /瘰|疬|结核|流注|痈|疽|疔|疮|疣|瘤|瘿|鹤膝|足跟|赤白游风|瘾疹|搔痒|瘙痒|茧唇|痔/],
  ['脾胃', /呕吐|呕逆|翻胃|吐食|血膈|泄泻|泄痢|痢|秘结|便秘|大便|脱肛|腹胀|嘈杂|伤食|不食|哕|滞下|霍乱|脚气/],
  ['肝胆', /胁|黄疸|黄胆|肝/],
  ['肾与水病', /小便|淋|遗尿|遗粪|水肿|肿满|腰痛|腰脚|腰胀/],
  ['神经', /中风|风痹|角弓|口噤|不语|筋脉|颤振|偏枯|偏风|癫狂|狂言|谵语|恍惚|眩晕|头痛|瘛|痉|惊胎|颈项|臂痛|骨节|历节|血厥|飞尸|肢体/],
  ['五官', /耳|鼻|口|齿|咽喉|目|眼/],
  ['心胸', /心痛|怔忡|惊悸|心胸|烦闷|吐血|衄血|失血|心神/],
  ['外感时病', /伤寒|伤风|时气|热病|疟|寒热|恶寒|客热|发热/],
]

function categoryFor(title) {
  for (const [category, pattern] of CATEGORY_RULES) {
    if (pattern.test(title)) return category
  }
  return '其他'
}

function modeFor(title) {
  if (RITUAL_RE.test(title) || THEORY_RE.test(title)) return 'thought'
  return 'formula'
}

function sourceNoteFor(title) {
  if (RITUAL_RE.test(title)) {
    return `${BOOK_NOTE} 本章为原书所载古代胎产禁忌或术数内容，属文献资料，不作诊疗依据。`
  }
  if (THEORY_RE.test(title)) {
    return `${BOOK_NOTE} 本章为原书理论论述，保留原文，不作诊疗依据。`
  }
  return BOOK_NOTE
}

function menNameFromLine(line) {
  let rest = line.replace(MEN_RE, '$1').replace(/[（(].*$/, '').trim()
  const cut = rest.indexOf('门')
  if (cut >= 0) rest = rest.slice(0, cut + 1)
  return rest.replace(/[\s\u3000]+/g, '')
}

function splitChapter(line) {
  let rest = line.replace(ZHANG_RE, '$1').trim()
  let body = ''

  // A few headings run directly into the first paragraph, e.g.
  // “……方论初虞世云：……” or “……方论新附窃谓……”. Split only when a
  // clear body opener follows the title.
  const embedded = rest.match(
    /^(.*?方论)((?:新附)?(?:初虞世云|窃谓|黄帝曰|论曰|经云|夫|凡|治)[\s\S]*)$/,
  )
  if (embedded) {
    rest = embedded[1]
    body = embedded[2]
  }

  return {
    title: rest.replace(/[\s\u3000]+/g, '').trim(),
    body,
  }
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

if (files.length !== 56) throw new Error(`expected 56 pages, got ${files.length}`)

const blocks = []
for (const file of files) {
  const text = fs.readFileSync(path.join(sourceDir, file), 'utf8').replace(/\r\n/g, '\n')
  for (const raw of text.split('\n')) {
    const line = cleanLine(raw)
    if (line) blocks.push(line)
  }
}

const entries = []
const duplicates = []
const rendered = []
const removedChunks = []
const expectedBody = []
let men = ''
let current = null

function closeEntry() {
  if (!current) return
  const previous = entries[entries.length - 1]
  if (previous && previous.title === current.title) {
    const same = JSON.stringify(previous.content) === JSON.stringify(current.content)
    const currentExtends =
      current.content.length > previous.content.length &&
      previous.content.every((text, index) => text === current.content[index])
    const previousExtends =
      previous.content.length > current.content.length &&
      current.content.every((text, index) => text === previous.content[index])

    if (same || previousExtends) {
      duplicates.push(current)
      rendered.push(current.title, ...current.content)
      current = null
      return
    }

    if (currentExtends) {
      duplicates.push(previous)
      removedChunks.push(`${previous.title}${previous.content.join('')}`)
      entries.pop()
      current.id = previous.id
      entries.push(current)
      rendered.push(...current.content.slice(previous.content.length))
      current = null
      return
    }
  }
  current.id = `frlj-${String(entries.length + 1).padStart(3, '0')}`
  entries.push(current)
  rendered.push(current.title, ...current.content)
  current = null
}

for (let index = 0; index < blocks.length; index += 1) {
  const line = blocks[index]

  if (index === 0 && /妇人良方/.test(line)) continue

  if (MEN_RE.test(line)) {
    closeEntry()
    men = menNameFromLine(line)
    if (!men) throw new Error(`empty men name: ${line}`)
    continue
  }

  if (ZHANG_RE.test(line)) {
    closeEntry()
    const rawRest = line.replace(ZHANG_RE, '$1').trim()
    const { title, body } = splitChapter(line)
    if (!title) throw new Error(`empty chapter title: ${line}`)
    expectedBody.push(rawRest)
    current = {
      title,
      men,
      category: categoryFor(title),
      mode: modeFor(title),
      content: body ? [body] : [],
    }
    continue
  }

  if (!current) throw new Error(`body before first chapter: ${line}`)
  current.content.push(line)
  expectedBody.push(line)
}

closeEntry()

const normalize = (text) => text.replace(/\s+/g, '')
let expected = normalize(expectedBody.join(''))

for (const chunk of removedChunks) {
  const normalized = normalize(chunk)
  const at = expected.indexOf(normalized)
  if (at < 0) throw new Error(`merged duplicate chunk not found: ${chunk.slice(0, 40)}`)
  expected = expected.slice(0, at) + expected.slice(at + normalized.length)
}

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
    id: 'frlj',
    title: BOOK_TITLE,
    author: '陈自明',
    era: 'ancient',
    note: BOOK_NOTE,
    caseCount: entries.length,
  },
  cases: entries.map((entry) => ({
    id: entry.id,
    bookId: 'frlj',
    title: entry.title,
    category: entry.category,
    doctor: '陈自明',
    mode: entry.mode,
    era: 'ancient',
    subcategory: entry.men,
    summary: (entry.content[0] ?? entry.title).replace(/\s+/g, ' ').slice(0, 90),
    source: {
      work: `《${BOOK_TITLE}》`,
      locator: `${entry.men}·${entry.title}`,
      note: sourceNoteFor(entry.title),
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
console.log(`blocks=${blocks.length} chapters=${entries.length} duplicates=${duplicates.length}`)
console.log('categories', Object.fromEntries(categories))
console.log('modes', Object.fromEntries(modes))
console.log('--- entries ---')
for (const entry of payload.cases) {
  console.log(`${entry.id}\t${entry.mode}\t${entry.category}\t${entry.subcategory}\t${entry.title}`)
}
