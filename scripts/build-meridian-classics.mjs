import fs from 'node:fs'
import { DatabaseSync } from 'node:sqlite'

/**
 * 从 data/classic-library.db 抽取经络古籍原文，生成 src/data/meridian-classics.ts。
 *
 * - 《子午流注说难》上卷「本输穴说难（一）～（十二）」对应十二正经，
 *   逐章保留原文，并附篇末「本输穴即景诗」。
 * - 《奇经八脉考》按「任脉 / 督脉 / 冲脉 / 带脉 / 二维 / 二蹻」标题切分，
 *   归入对应奇经页面。
 */

const DB = 'data/classic-library.db'
const OUT = 'src/data/meridian-classics.ts'

const REGULAR = [
  ['lung', '上卷 本输穴说难（一）'],
  ['large-intestine', '上卷 本输穴说难（二）'],
  ['stomach', '上卷 本输穴说难（三）'],
  ['spleen', '上卷 本输穴说难（四）'],
  ['heart', '上卷 本输穴说难（五）'],
  ['small-intestine', '上卷 本输穴说难（六）'],
  ['bladder', '上卷 本输穴说难（七）'],
  ['kidney', '上卷 本输穴说难（八）'],
  ['pericardium', '上卷 本输穴说难（九）'],
  ['triple-burner', '上卷 本输穴说难（十）'],
  ['gallbladder', '上卷 本输穴说难（十一）'],
  ['liver', '上卷 本输穴说难（十二）'],
]

const EXTRAORDINARY = [
  ['ren', ['任脉', '任脉为病']],
  ['du', ['督脉', '督脉为病']],
  ['chong', ['冲脉', '冲脉为病']],
  ['dai', ['带脉', '带脉为病']],
  ['yinwei', ['阴维脉', '二维为病']],
  ['yangwei', ['阳维脉', '二维为病']],
  ['yinqiao', ['阴蹻脉', '二蹻为病']],
  ['yangqiao', ['阳蹻脉', '二蹻为病']],
]

const VESSEL_HEADINGS = new Set([
  '阴维脉',
  '阳维脉',
  '二维为病',
  '阴蹻脉',
  '阳蹻脉',
  '二蹻为病',
  '冲脉',
  '冲脉为病',
  '任脉',
  '任脉为病',
  '督脉',
  '督脉为病',
  '带脉',
  '带脉为病',
])

const db = new DatabaseSync(DB, { readOnly: true })
const books = new Map(
  db
    .prepare('SELECT id,title,author,dynasty FROM library_books')
    .all()
    .map((row) => [row.id, row]),
)

function sections(bookId) {
  return db
    .prepare(
      'SELECT title,paragraphs_json FROM library_sections WHERE book_id = ? ORDER BY sort_order',
    )
    .all(bookId)
    .map((row) => ({
      title: row.title,
      paragraphs: JSON.parse(row.paragraphs_json),
    }))
}

function parsePoems(paragraphs) {
  const poems = []
  for (let i = 0; i < paragraphs.length; i++) {
    const text = String(paragraphs[i]).trim()
    if (!text.includes('（咏') || !text.endsWith('）')) continue
    const match = text.match(/^(.+?)\s*（(.+?)）$/)
    const body = String(paragraphs[i + 1] ?? '').trim()
    if (!match || !body) continue
    poems.push({
      title: match[1].trim(),
      note: match[2].replace(/\s+/g, ''),
      lines: body
        .split('。')
        .map((line) => line.trim())
        .filter(Boolean),
    })
    i += 1
  }
  return poems
}

const ziwuBook = books.get('lib-5ab5805e13')
const qijingBook = books.get('lib-9ec658fb73')
if (!ziwuBook || !qijingBook) throw new Error('缺少古籍记录')

const ziwuSections = sections(ziwuBook.id)
// 书库中《子午流注说难》作者记为佚名，卷前原文作「子午流注说难 吴棹仙 近代」，据此补全。
const ziwuMeta = (() => {
  const author = String(ziwuBook.author ?? '').trim()
  const dynasty = String(ziwuBook.dynasty ?? '').trim()
  if (author && author !== '佚名' && dynasty) return { author, dynasty }
  const front = String(ziwuSections[0]?.paragraphs?.[0] ?? '').trim()
  const match = front.match(/^(\S+)\s+(\S+)\s+(\S+)$/)
  return match
    ? { author: match[2], dynasty: match[3] }
    : { author: author || '佚名', dynasty }
})()
const poems = parsePoems(ziwuSections[ziwuSections.length - 1].paragraphs)
const poemsById = new Map()
REGULAR.forEach(([id], index) => {
  const poem = poems[index]
  if (poem) poemsById.set(id, poem)
})

const data = {}

for (const [meridianId, chapterTitle] of REGULAR) {
  const section = ziwuSections.find((item) => item.title === chapterTitle)
  if (!section) throw new Error(`找不到章节 ${chapterTitle}`)
  const [heading, ...passages] = section.paragraphs.map((p) => String(p).trim())
  data[meridianId] = [
    {
      book: ziwuBook.title,
      author: ziwuMeta.author,
      dynasty: ziwuMeta.dynasty,
      chapter: chapterTitle,
      heading,
      passages,
      ...(poemsById.has(meridianId) ? { poem: poemsById.get(meridianId) } : {}),
    },
  ]
}

const qijingParagraphs = sections(qijingBook.id).flatMap((section) => section.paragraphs)
const vesselText = new Map()
let current = null
for (const raw of qijingParagraphs) {
  const text = String(raw).trim()
  if (!text) continue
  if (VESSEL_HEADINGS.has(text)) {
    current = text
    if (!vesselText.has(current)) vesselText.set(current, [])
    continue
  }
  if (!current) continue
  vesselText.get(current).push(text)
}

for (const [meridianId, headings] of EXTRAORDINARY) {
  const excerpts = []
  for (const heading of headings) {
    const passages = vesselText.get(heading)
    if (!passages?.length) continue
    excerpts.push({
      book: qijingBook.title,
      author: qijingBook.author,
      dynasty: qijingBook.dynasty,
      chapter: heading,
      heading,
      passages,
    })
  }
  if (excerpts.length) data[meridianId] = excerpts
}

db.close()

const header = `// 由 scripts/build-meridian-classics.mjs 从 data/classic-library.db 生成，请勿手改。\n\n`
const types = `export interface MeridianClassicPoem {\n  title: string\n  note: string\n  lines: string[]\n}\n\nexport interface MeridianClassicExcerpt {\n  book: string\n  author: string\n  dynasty: string\n  chapter: string\n  heading: string\n  passages: string[]\n  poem?: MeridianClassicPoem\n}\n\n`
const body = `export const MERIDIAN_CLASSICS: Record<string, MeridianClassicExcerpt[]> = ${JSON.stringify(
  data,
  null,
  2,
)}\n`
fs.writeFileSync(OUT, header + types + body)
console.log(
  `已生成 ${OUT}：${Object.keys(data).length} 条经络，${Object.values(data).flat().length} 段古籍`,
)
