import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = 'F:/中医/痘疹麻痧/%E4%B8%93%E6%B2%BB%E9%BA%BB%E7%97%A7%E5%88%9D%E7%BC%96'
const outFile = path.join(root, 'src', 'data', 'cases', 'mazhen.json')

const BOOK_TITLE = '专治麻疹初编'
const BOOK_AUTHOR = '凌德'
const BOOK_NOTE =
  '据整理稿录入。清光绪十六年（1890）凌德（字蛰庵）汇录古今麻痧证治，厘为崇正、述古、征今、方论四编六卷；保留原书所引各家和原方，未删节。源文为 OCR 整理本，个别字有缺误，以原书为准。方药剂量仅供文献学习。'

const CATEGORY_RULES = [
  ['妇科', /妊娠|孕妇|胎产|妇人/],
  ['五官', /喉|咽|失音|唇|口疮|目|鼻/],
  ['肺系', /咳嗽|喘|肺/],
  ['脾胃', /呕吐|泻泄|泄泻|痢疾|腹痛|饮食|饮水|不食/],
]

const THEORY_RE =
  /序$|^自序$|^后序$|总论|述原|名义|辨疑赋|脉法|^疹证$|^疹期$|疹形色|疹涕|疹吉凶|禁忌|饮食|饮水|附司天掌诀歌|^论$|论（|^麻疹要略$|^麻后余义$|^麻证续言$|^万氏痘麻$|^麻疹论$|^妊娠麻疹论$|^麻疹述原$|^麻疹辩疑赋$|^麻疹轻重不治要诀$|^痧疹总论$|^看三关法$|^吴医汇讲$|^丹痧斑疹辨$|^论白$|^论痘疹三不宜$|^论痘疹出不快$|^许白沙先生论小儿病脉$|^五脏虚实寒热$|^面部证$|^目部证$|^小儿脉法$|^五脏疮疹证治$/

function categoryFor(title) {
  for (const [category, pattern] of CATEGORY_RULES) {
    if (pattern.test(title)) return category
  }
  return '儿科'
}

function modeFor(title) {
  if (title === '引言') return 'thought'
  if (/治验|附案|案$/.test(title)) return 'case'
  if (THEORY_RE.test(title) || /论痘疹三不宜|论痘疹出不快|论白|吴医汇讲/.test(title)) return 'thought'
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

if (files.length !== 22) throw new Error(`expected 22 pages, got ${files.length}`)

const blocks = []
for (const file of files) {
  const text = fs.readFileSync(path.join(sourceDir, file), 'utf8').replace(/\r\n/g, '\n')
  for (const raw of text.split('\n')) {
    const line = cleanLine(raw)
    if (line) blocks.push(line)
  }
}

const HEAD_RE = /^\[(卷[一二三四五六七八九十]+)(?:\s*[:：]\s*([^\]]*))?\]\s*(.*)$/

const entries = []
const bodyLines = []
const rendered = []
let volume = '卷前'
let book = '卷前'
let current = null
let pendingBook = null
let pendingBuffer = []

function flushPending() {
  if (!pendingBook) return
  if (pendingBuffer.length) {
    startEntry(pendingBook.title, pendingBook.book, pendingBook.volume)
    current.content.push(...pendingBuffer)
    closeEntry()
  }
  pendingBook = null
  pendingBuffer = []
}

function closeEntry() {
  if (!current) return
  if (!current.content.length) {
    throw new Error(`empty entry: ${current.volume} ${current.book} ${current.title}`)
  }
  current.id = `mazhen-${String(entries.length + 1).padStart(3, '0')}`
  entries.push(current)
  rendered.push(...current.content)
  current = null
}

function startEntry(title, entryBook = book, entryVolume = volume) {
  closeEntry()
  current = {
    title: title.replace(/[\s\u3000]+/g, '').trim(),
    book: entryBook,
    volume: entryVolume,
    content: [],
  }
}

for (const line of blocks) {
  const head = line.match(HEAD_RE)
  if (head) {
    volume = head[1]
    const hasColon = head[2] !== undefined
    const headBook = (head[2] ?? '').trim()
    const rest = (head[3] ?? '').trim()

    if (hasColon) {
      if (!rest) {
        closeEntry()
        pendingBook = null
        pendingBuffer = []
        continue
      }
      if (headBook) book = headBook
      if (pendingBook) {
        if (pendingBook.book === headBook) {
          startEntry(rest)
          current.content.push(...pendingBuffer)
          pendingBook = null
          pendingBuffer = []
        } else {
          flushPending()
          startEntry(rest)
        }
      } else {
        startEntry(rest)
      }
      continue
    }

    // A bracket without a colon either introduces a source book, e.g.
    // “[卷二] 董氏《小儿斑疹备急方论》”, or a chapter such as
    // “[卷一] 附司天掌诀歌”. Book titles always carry 《》.
    if (rest.includes('《') || !rest.startsWith('附')) {
      if (pendingBook && pendingBook.book !== rest) flushPending()
      closeEntry()
      book = rest
      pendingBook = { title: rest, book: rest, volume }
      pendingBuffer = []
      continue
    }

    if (!rest) continue
    if (pendingBook) {
      startEntry(rest)
      current.content.push(...pendingBuffer)
      pendingBook = null
      pendingBuffer = []
    } else {
      startEntry(rest)
    }
    continue
  }

  if (line === '引言') {
    flushPending()
    startEntry('引言', '卷前', '卷前')
    continue
  }

  bodyLines.push(line)

  if (pendingBook && !current) {
    pendingBuffer.push(line)
    continue
  }

  if (!current) {
    if (pendingBook) {
      startEntry(pendingBook.title, pendingBook.book, pendingBook.volume)
      pendingBook = null
      pendingBuffer = []
    } else if (volume === '卷前') {
      startEntry('引言', '卷前', '卷前')
    } else {
      throw new Error(`body before first entry: ${line.slice(0, 60)}`)
    }
  }

  current.content.push(line)
}

closeEntry()
flushPending()

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
    id: 'mazhen',
    title: BOOK_TITLE,
    author: BOOK_AUTHOR,
    era: 'ancient',
    note: BOOK_NOTE,
    caseCount: entries.length,
  },
  cases: entries.map((entry) => {
    const locator =
      entry.book && entry.book !== entry.title
        ? `${entry.volume}·${entry.book}·${entry.title}`
        : `${entry.volume}·${entry.title}`
    return {
      id: entry.id,
      bookId: 'mazhen',
      title: entry.title,
      category: categoryFor(entry.title),
      doctor: BOOK_AUTHOR,
      mode: modeFor(entry.title),
      era: 'ancient',
      subcategory: entry.book,
      summary: (entry.content[0] ?? entry.title).replace(/\s+/g, ' ').slice(0, 90),
      source: {
        work: `《${BOOK_TITLE}》`,
        locator,
        note: BOOK_NOTE,
      },
      content: entry.content.map((text) => ({ type: 'paragraph', text })),
    }
  }),
}

fs.writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

const categories = new Map()
const modes = new Map()
const books = new Map()
for (const entry of payload.cases) {
  categories.set(entry.category, (categories.get(entry.category) ?? 0) + 1)
  modes.set(entry.mode, (modes.get(entry.mode) ?? 0) + 1)
  books.set(entry.subcategory, (books.get(entry.subcategory) ?? 0) + 1)
}

console.log(`Wrote ${path.relative(root, outFile)}`)
console.log(`blocks=${blocks.length} entries=${entries.length}`)
console.log('categories', Object.fromEntries(categories))
console.log('modes', Object.fromEntries(modes))
console.log('books', Object.fromEntries(books))
console.log('--- entries ---')
for (const entry of payload.cases) {
  console.log(`${entry.id}\t${entry.mode}\t${entry.category}\t${entry.subcategory}\t${entry.title}`)
}
