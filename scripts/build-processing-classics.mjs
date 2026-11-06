import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '..', 'src', 'data', 'processing-classics.json')

const BOOKS = [
  {
    id: 'leigong',
    title: '雷公炮制药性解',
    author: '李中梓（李士材）',
    dynasty: '明',
    sourceId: 'src-leigong-paozhi',
    file: 'F:/中医/B-027-雷公炮制药性解.txt',
  },
  {
    id: 'paozhi',
    title: '炮炙大法',
    author: '缪希雍',
    dynasty: '明',
    sourceId: 'src-paozhi-dafa',
    file: 'F:/中医/B-029-炮炙大法.txt',
  },
]

const EXCLUDED_NAMES = new Set([
  '序',
  '用药凡例',
  '服药序次',
  '妊娠禁忌前歌所列药品未尽特为拈附',
])

function clean(text) {
  return text
    .replace(/\r/g, '')
    .replace(/\\x[\s\S]*?\\x/g, '')
    .replace(/\n?HT\s*/g, '')
    .replace(/\u3000/g, ' ')
    .replace(/\s+/g, '')
    .trim()
}

function splitEntries(raw) {
  const normalized = raw.replace(/\r/g, '')
  const parts = normalized.split(/<篇名>/).slice(1)
  const entries = []
  for (const part of parts) {
    const newline = part.indexOf('\n')
    const name = (newline >= 0 ? part.slice(0, newline) : part).trim()
    if (!name || EXCLUDED_NAMES.has(name)) continue
    const body = newline >= 0 ? part.slice(newline + 1) : ''
    const directoryMatch = body.match(/<目录>([^\n<]*)/)
    const section = directoryMatch ? directoryMatch[1].trim() : ''
    const contentMatch = body.match(/内容：([\s\S]*?)(?=<目录>|$)/)
    const content = contentMatch ? contentMatch[1] : body
    const cleaned = clean(content)
    if (!cleaned) continue
    entries.push({ name, section, content: cleaned })
  }
  return entries
}

function parseLeigong(entry) {
  const body = entry.content.replace(/^内容：/, '')
  const index = body.indexOf('雷公云∶')
  if (index < 0) {
    return { nature: body, processing: '' }
  }
  return {
    nature: body.slice(0, index).trim(),
    processing: body.slice(index).trim(),
  }
}

function parsePaozhi(entry) {
  let body = entry.content.replace(/^内容：/, '')
  const wrapped = body.match(/^（([\s\S]*)）$/)
  if (wrapped) body = wrapped[1]
  return { nature: '', processing: body.trim() }
}

const CLASSIC_CATEGORY_TITLES = {
  plants: '草木类',
  animals: '蛇虫类',
  minerals: '金石类',
  other: '其他类',
}

const NAME_CATEGORY_OVERRIDES = new Map([
  ['硫黄', 'minerals'],
  ['石硫黄', 'minerals'],
  ['雄黄', 'minerals'],
  ['朱砂', 'minerals'],
  ['丹砂', 'minerals'],
  ['水银', 'minerals'],
  ['轻粉', 'minerals'],
  ['石膏', 'minerals'],
  ['滑石', 'minerals'],
  ['寒水石', 'minerals'],
  ['自然铜', 'minerals'],
  ['磁石', 'minerals'],
  ['代赭石', 'minerals'],
  ['赤石脂', 'minerals'],
  ['炉甘石', 'minerals'],
  ['硼砂', 'minerals'],
  ['硝石', 'minerals'],
  ['芒硝', 'minerals'],
  ['矾石', 'minerals'],
])

function classicCategory(section, name = '') {
  const overridden = NAME_CATEGORY_OVERRIDES.get(name)
  if (overridden) return overridden
  const text = section ?? ''
  if (/虫鱼|兽|禽/.test(text)) return 'animals'
  if (/金石|金部|石部|石|土/.test(text)) return 'minerals'
  if (/草|木|果|米谷|谷|菜/.test(text)) return 'plants'
  return 'other'
}

const books = []
const entries = []

for (const book of BOOKS) {
  if (!fs.existsSync(book.file)) throw new Error(`缺少源文件：${book.file}`)
  const raw = fs.readFileSync(book.file, 'utf8').replace(/^\uFEFF/, '')
  const parsed = splitEntries(raw).filter(
    (entry) => entry.name !== book.title && !/^书名：|^作者：/.test(entry.content),
  )
  parsed.forEach((entry, index) => {
    const parts = book.id === 'leigong' ? parseLeigong(entry) : parsePaozhi(entry)
    if (!parts.processing) return
    const category = classicCategory(entry.section, entry.name)
    entries.push({
      id: `${book.id}-${String(index + 1).padStart(3, '0')}`,
      book: book.title,
      bookId: book.id,
      author: book.author,
      dynasty: book.dynasty,
      section: entry.section,
      name: entry.name,
      nature: parts.nature,
      processing: parts.processing,
      category,
      categoryTitle: CLASSIC_CATEGORY_TITLES[category],
      sourceId: book.sourceId,
    })
  })
  books.push({
    id: book.id,
    title: book.title,
    author: book.author,
    dynasty: book.dynasty,
    sourceId: book.sourceId,
    count: entries.filter((item) => item.bookId === book.id).length,
  })
  console.log(`${book.title}: ${parsed.length} entries`)
}

fs.writeFileSync(
  OUT,
  `${JSON.stringify({ generatedAt: new Date().toISOString(), books, entries }, null, 2)}\n`,
)
console.log(`Wrote ${path.relative(process.cwd(), OUT)}: ${entries.length} entries`)
