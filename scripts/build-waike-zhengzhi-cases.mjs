import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = 'F:/中医/外科症治方/%E5%A4%96%E7%A7%91%E8%AF%81%E6%B2%BB%E5%85%A8%E4%B9%A6'
const outFile = path.join(root, 'src', 'data', 'cases', 'waike-zhengzhi.json')

const BOOK_TITLE = '外科证治全书'
const BOOK_NOTE =
  '据整理稿录入，源文首页题“外科证治全书”，卷前有重刻弁言。按原书卷一至卷五及头面、五官、躯干、四肢、发无定处等证治门类整理；每门所含证候、方论、方药与剂量依原文照录，未删节。底本为 OCR 整理本，个别字有缺误，以原书为准。方药剂量仅供文献学习。'

const TREATISES = new Set([
  '痈疽证治统论',
  '胃气论',
  '论肿',
  '论溃',
  '论敛',
  '论痛',
  '论痒',
  '饮食宜忌论',
  '阳痈证治则例',
  '阴疽证治则例',
  '烂溃不敛治法',
  '翻花起肛治法',
  '患孔毒根治法',
  '漏管治法',
  '多骨治法',
  '毒瓦斯攻心治法',
  '破伤风治法',
  '发痉治法',
  '疮口误入毒水治法',
  '疮中生蛆虫治法',
])

function cleanLine(raw) {
  return raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^[\s\u3000]+|[\s\u3000]+$/g, '')
}

function titleFromHeading(text) {
  const match = text.match(/^卷([一二三四五六七八九十]+)(.+)$/)
  if (!match) return null
  const rest = match[2].replace(/^[\s\u3000]+/, '')
  if (!/证治|误吞类|通用法|备用法|附中毒类/.test(rest)) return null
  return { volume: `卷${match[1]}`, title: rest }
}

function categoryFor(title, volume) {
  if (/疮|毒|伤|痈|疽|瘤|瘿|疥|癣/.test(title)) return '外科皮肤'
  if (/眼|目/.test(title)) return '五官'
  if (/鼻|耳|口|唇|齿|舌|喉|误吞/.test(title)) return '五官'
  if (/乳部/.test(title)) return '妇科'
  if (/前阴|后阴/.test(title)) return '肾与水病'
  if (/内景/.test(title)) return '脾胃'
  if (/中毒/.test(title)) return '其他'
  if (/头部|面部|项部|胸博|腋胁肋|肩部|膊臂手|背部|腰部|腹部|股部|膝部|胫部|足部|发无定处|恶疮|奇疾|怪虫|外因杂伤/.test(title)) {
    return '外科皮肤'
  }
  return volume === '卷前' ? '其他' : '外科皮肤'
}

const files = fs
  .readdirSync(sourceDir)
  .filter((name) => /^p\d+\.md$/.test(name))
  .sort((a, b) => Number(a.slice(1, -3)) - Number(b.slice(1, -3)))

if (files.length !== 30) throw new Error(`expected 30 pages, got ${files.length}`)

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
const expected = ['序跋']
let volume = ''
let current = {
  title: '序跋',
  volume: '卷前',
  category: '其他',
  mode: 'thought',
  content: [],
}

function closeEntry() {
  if (!current) return
  entries.push(current)
  rendered.push(current.title, ...current.content)
  current = null
}

for (const raw of blocks) {
  const text = raw.trim()

  if (/^外科证治全书/.test(text)) continue

  if (/^卷[一二三四五六七八九十]+$/.test(text)) {
    volume = text
    continue
  }

  const heading = titleFromHeading(text)
  if (heading || TREATISES.has(text)) {
    const title = heading ? heading.title : text
    const entryVolume = heading ? heading.volume : volume || '卷前'

    // Page headers repeat the same section many times; keep one entry.
    if (current && current.title === title && current.volume === entryVolume) {
      continue
    }

    closeEntry()
    current = {
      title,
      volume: entryVolume,
      category: categoryFor(title, entryVolume),
      mode: 'formula',
      content: [],
    }
    expected.push(title)
    continue
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
    id: 'waike-zhengzhi',
    title: BOOK_TITLE,
    author: '许克昌',
    era: 'ancient',
    note: BOOK_NOTE,
    caseCount: entries.length,
  },
  cases: entries.map((entry, index) => ({
    id: `waike-zhengzhi-${String(index + 1).padStart(3, '0')}`,
    bookId: 'waike-zhengzhi',
    title: entry.title,
    category: entry.category,
    doctor: '许克昌',
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
  console.log(`${entry.id}\t${entry.category}\t${entry.subcategory}\t${entry.content.length}`)
}
