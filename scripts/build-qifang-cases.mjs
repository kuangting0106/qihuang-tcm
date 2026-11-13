import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = 'F:/中医/奇方类编/%E5%A5%87%E6%96%B9%E7%B1%BB%E7%BC%96'
const outFile = path.join(root, 'src', 'data', 'cases', 'qifang.json')

const BOOK_TITLE = '奇方类编'
const BOOK_AUTHOR = '吴世昌'
const BOOK_NOTE =
  '据整理稿录入。清·吴世昌辑，康熙五十八年（1719）钱塘孙元龙序。原书分上下卷，按头面、须发、耳目、口鼻、牙齿、咽喉、心胃、妇人、小儿、疮毒等门类汇集方剂；方名、主治、药味与剂量依原文照录，未删节。源文为 OCR 整理本，个别字有缺误，以原书为准。方药剂量仅供文献学习。'

const MEN_CATEGORY = {
  头面门: '五官',
  须发门: '五官',
  耳目门: '五官',
  口鼻门: '五官',
  牙齿门: '五官',
  咽喉门: '五官',
  妇人门: '妇科',
  小儿门: '儿科',
  疮毒门: '外科皮肤',
  痔漏门: '外科皮肤',
  损伤门: '外科皮肤',
  心胃门: '脾胃',
  噎膈门: '脾胃',
  脾胃门: '脾胃',
  痢泻门: '脾胃',
  鼓胀水肿门: '脾胃',
  痰嗽门: '肺系',
  伤寒门: '外感时病',
  伤暑门: '外感时病',
  疟疾门: '外感时病',
  风瘫门: '神经',
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

if (files.length !== 20) throw new Error(`expected 20 pages, got ${files.length}`)

const blocks = []
for (const file of files) {
  const text = fs.readFileSync(path.join(sourceDir, file), 'utf8').replace(/\r\n/g, '\n')
  for (const raw of text.split('\n')) {
    const line = cleanLine(raw)
    if (line) blocks.push(line)
  }
}

const MEN_RE = /^卷([上下])[　\s]+(.+门)$/
const entries = []
const bodyLines = []
const rendered = []
let men = ''
let current = null
let skipTitleOnce = false

function closeEntry() {
  if (!current) return
  if (!current.content.length) {
    current = null
    return
  }
  current.id = `qifang-${String(entries.length + 1).padStart(3, '0')}`
  entries.push(current)
  rendered.push(...current.content)
  current = null
}

function startEntry(title) {
  closeEntry()
  current = { title: title.trim(), men, content: [] }
}

for (let index = 0; index < blocks.length; index += 1) {
  const line = blocks[index]
  const next = blocks[index + 1] ?? ''

  if (/^奇方类编\s+清\s+吴世昌$/.test(line)) continue

  if (line === '奇方类编序') {
    startEntry(line)
    continue
  }

  const menMatch = line.match(MEN_RE)
  if (menMatch) {
    closeEntry()
    men = menMatch[2]
    skipTitleOnce = false
    continue
  }

  if (line.length <= 8 && /门$/.test(line) && !/^治/.test(line)) {
    closeEntry()
    men = line
    skipTitleOnce = false
    continue
  }

  if (skipTitleOnce) {
    skipTitleOnce = false
    bodyLines.push(line)
    if (!current) {
      if (line.length <= 14 && !/[。，！？：；（）()]/.test(line)) {
        bodyLines.pop()
        startEntry(line)
        continue
      }
      startEntry(men ? `${men}·正文` : '正文')
    }
    current.content.push(line)
    continue
  }

  const namedFormula =
    line.length <= 14 &&
    !/[。，！？：；（）()]/.test(line) &&
    /^(治|专治|主)/.test(next)
  const formulaByIndication =
    /^治/.test(line) && line.length <= 40 && !/[。]$/.test(line)

  if (namedFormula) {
    startEntry(line)
    skipTitleOnce = true
    continue
  }

  if (formulaByIndication) {
    startEntry(line)
    continue
  }

  bodyLines.push(line)
  if (!current) {
    if (line.length <= 14 && !/[。，！？：；（）()]/.test(line)) {
      bodyLines.pop()
      startEntry(line)
      continue
    }
    startEntry(men ? `${men}·正文` : '正文')
  }
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
    id: 'qifang',
    title: BOOK_TITLE,
    author: BOOK_AUTHOR,
    era: 'ancient',
    note: BOOK_NOTE,
    caseCount: entries.length,
  },
  cases: entries.map((entry) => ({
    id: entry.id,
    bookId: 'qifang',
    title: entry.title,
    category: MEN_CATEGORY[entry.men] ?? '其他',
    doctor: BOOK_AUTHOR,
    mode: entry.men ? 'formula' : 'thought',
    era: 'ancient',
    subcategory: entry.men || '卷前',
    summary: (entry.content[0] ?? entry.title).replace(/\s+/g, ' ').slice(0, 90),
    source: {
      work: `《${BOOK_TITLE}》`,
      locator: entry.men ? `${entry.men}·${entry.title}` : entry.title,
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
for (const entry of payload.cases.slice(0, 10)) {
  console.log(`${entry.id}\t${entry.subcategory}\t${entry.title}`)
}
