import fs from 'node:fs'
import readline from 'node:readline'
import { DatabaseSync } from 'node:sqlite'

/**
 * 从民间偏方数据中剔除经络、腧穴、针灸类书目与章节。
 *
 * 背景：部分古籍（如《子午流注说难》《西方子明堂灸经》）整本是经络腧穴内容，
 * 被切成“偏方”后挤在列表最前；另有一些方书夹带「某经分寸歌」「奇经八脉」等
 * 经络章节。这些内容已迁入经络页，不再作为偏方展示。
 *
 * 用法：
 *   node scripts/clean-remedies.mjs          # 只统计，不改文件
 *   node scripts/clean-remedies.mjs --apply  # 备份并清理 jsonl 与 SQLite
 */

const JSONL = 'data/remedies.jsonl'
const STATS = 'data/remedies-stats.json'
const DB_FILE = 'data/qihuang.db'
const apply = process.argv.includes('--apply')

// 整本为经络/腧穴/灸法目录，整本剔除。
const BLOCKED_BOOKS = new Set([
  '子午流注说难',
  '西方子明堂灸经',
  '奇经八脉考',
  '经穴汇解',
  '经络全书',
  '经络考',
  '经络汇编',
  '凌门传授铜人指穴',
])

// 其他方书中的经络章节标题。
const TITLE_RE =
  /^(手|足)?(太阴|少阴|厥阴|太阳|阳明|少阳)?[^，。；]{0,6}经([五六七八九十]+穴|穴分寸|穴歌|分寸歌|步穴歌|诸穴歌|穴$)|^(任|督|冲|带|阴维|阳维|阴跷|阳跷)脉|^奇经八脉$|^十二别络|^经正六合|^卧针迎随|^催气手法|分寸歌$/

// 方名保护：避免把「冲脉饮子」「带脉丸」这类方剂误删。
const FORMULA_RE = /(饮子|汤|丸|散|膏|丹|煎|方)$/

function normalizeTitle(value) {
  return String(value ?? '')
    .replace(/\s*·\s*方[一二三四五六七八九十百\d]+$/, '')
    .trim()
}

function removable(title, book) {
  if (BLOCKED_BOOKS.has(String(book ?? '').trim())) return true
  const clean = normalizeTitle(title)
  if (!clean) return false
  if (FORMULA_RE.test(clean)) return false
  return TITLE_RE.test(clean)
}

function bump(map, key, delta) {
  map.set(key, (map.get(key) ?? 0) + delta)
}

const removedIds = new Set()
const removedByBook = new Map()
const removedByCategory = new Map()
const removedBySubcategory = new Map()
const removedByEra = new Map()
const removedBySafety = new Map()
let removedQz = 0
let removedAncient = 0
let removedWithIndications = 0
let removedWithFormula = 0
let removedWithUsage = 0
let total = 0

const rl = readline.createInterface({
  input: fs.createReadStream(JSONL, { encoding: 'utf8' }),
  crlfDelay: Infinity,
})
for await (const line of rl) {
  if (!line.trim()) continue
  const rec = JSON.parse(line)
  total += 1
  if (!removable(rec.title, rec.book)) continue
  removedIds.add(rec.id)
  bump(removedByBook, rec.book, 1)
  bump(removedByCategory, rec.category, 1)
  bump(removedBySubcategory, rec.subcategory, 1)
  bump(removedByEra, rec.era, 1)
  bump(removedBySafety, rec.safetyLevel, 1)
  if (rec.origin === '泉州民间偏方验方选辑') removedQz += 1
  else removedAncient += 1
  if (rec.indications) removedWithIndications += 1
  if (rec.formula && rec.formula.length > 8) removedWithFormula += 1
  if (rec.usage) removedWithUsage += 1
}

console.log(`jsonl 总数 ${total}，待剔除 ${removedIds.size}，保留 ${total - removedIds.size}`)
console.log(
  '按书名：\n' +
    [...removedByBook.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([book, count]) => `  ${book} ${count}`)
      .join('\n'),
)

if (!apply) {
  console.log('\n未加 --apply，仅统计，未修改任何文件。')
  process.exit(0)
}

if (!fs.existsSync(`${JSONL}.bak`)) {
  fs.copyFileSync(JSONL, `${JSONL}.bak`)
  console.log(`\n已备份 ${JSONL}.bak`)
}

const tmp = `${JSONL}.tmp`
const readStream = fs.createReadStream(JSONL, { encoding: 'utf8' })
const writeStream = fs.createWriteStream(tmp, { encoding: 'utf8' })
const source = readline.createInterface({ input: readStream, crlfDelay: Infinity })
for await (const line of source) {
  if (!line.trim()) continue
  const rec = JSON.parse(line)
  if (!removedIds.has(rec.id)) writeStream.write(`${line}\n`)
}
await new Promise((resolve, reject) => {
  writeStream.end((err) => (err ? reject(err) : resolve()))
})
fs.renameSync(tmp, JSONL)
console.log(`已重写 ${JSONL}`)

// 同步清理 SQLite，避免重建整库。
const db = new DatabaseSync(DB_FILE)
const dbRows = db.prepare('SELECT id,title,book FROM remedies').all()
const dbIds = dbRows.filter((row) => removable(row.title, row.book)).map((row) => row.id)
const del = db.prepare('DELETE FROM remedies WHERE id = ?')
db.exec('BEGIN')
for (let i = 0; i < dbIds.length; i += 500) {
  for (const id of dbIds.slice(i, i + 500)) del.run(id)
}
db.exec('COMMIT')
const remain = db.prepare('SELECT COUNT(*) AS n FROM remedies').get().n
console.log(`数据库删除 ${dbIds.length} 行，剩余 ${remain} 行`)
db.close()

// 同步统计报告，保持数字与数据一致。
const stats = JSON.parse(fs.readFileSync(STATS, 'utf8'))
stats.total = total - removedIds.size
stats.qz -= removedQz
stats.ancient -= removedAncient
stats.withIndications -= removedWithIndications
stats.withFormula -= removedWithFormula
stats.withUsage -= removedWithUsage
for (const [key, count] of removedByCategory) {
  stats.byCategory[key] = (stats.byCategory[key] ?? 0) - count
  if (stats.byCategory[key] <= 0) delete stats.byCategory[key]
}
for (const [key, count] of removedByEra) {
  stats.byEra[key] = (stats.byEra[key] ?? 0) - count
  if (stats.byEra[key] <= 0) delete stats.byEra[key]
}
for (const [key, count] of removedBySafety) {
  stats.bySafety[key] = (stats.bySafety[key] ?? 0) - count
  if (stats.bySafety[key] <= 0) delete stats.bySafety[key]
}
stats.topBooks = stats.topBooks
  .map(([book, count]) => [book, count - (removedByBook.get(book) ?? 0)])
  .filter(([, count]) => count > 0)
  .sort((a, b) => b[1] - a[1])
stats.topSubcategories = stats.topSubcategories
  .map(([sub, count]) => [sub, count - (removedBySubcategory.get(sub) ?? 0)])
  .filter(([, count]) => count > 0)
  .sort((a, b) => b[1] - a[1])
stats.books -= [...removedByBook.keys()].filter((book) =>
  BLOCKED_BOOKS.has(book),
).length
stats.formulasInBooks = stats.ancient
stats.perBook = stats.perBook
  .map((book) => ({
    ...book,
    formulas: book.formulas - (removedByBook.get(book.title) ?? 0),
  }))
  .filter((book) => book.formulas > 0)
  .sort((a, b) => b.formulas - a.formulas)
stats.removed = removedIds.size
stats.removedByBook = [...removedByBook.entries()]
  .sort((a, b) => b[1] - a[1])
  .map(([book, count]) => ({ book, count }))
stats.cleanedAt = new Date().toISOString()
fs.writeFileSync(STATS, `${JSON.stringify(stats, null, 2)}\n`)
console.log(`已更新 ${STATS}`)
