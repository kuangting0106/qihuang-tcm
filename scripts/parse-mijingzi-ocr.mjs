#!/usr/bin/env node
/**
 * 把《米晶子济世良方》扫描本的 OCR JSONL 整理为方剂 JSON。
 *
 * 输入：mijingzi-ocr.jsonl（每行 { page, lines:[{text,score}] }）
 * 输出：scripts/content/mijingzi-formulas.json
 *
 * OCR 只作转录依据，不逐字校勘；生成的条文注明来源与 PDF 页码。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const input = process.argv[2] ?? 'C:/Users/16922/AppData/Local/Temp/mijingzi-ocr.jsonl'
const output = path.join(root, 'scripts', 'content', 'mijingzi-formulas.json')

const SECTION_TITLES = new Set([
  '头面部',
  '头部',
  '面部',
  '眼眉部',
  '鼻部',
  '耳部',
  '口舌部',
  '牙部',
  '胸腹颈项部',
  '喉部',
  '项部',
  '胸部',
  '胁部',
  '胃腹食部',
  '少腹部',
  '小便部',
  '大便部',
  '全身部',
  '手足部',
  '腰背部',
  '内外妇儿',
  '内科',
  '外科',
  '妇科',
  '儿科',
  '癫疯部',
  '虫咬部',
  '其他',
  '经典效方',
  '单附单方',
  '脉诊',
  '附录',
])

const IGNORE_LINES = new Set(['米晶子济世良方', '米晶子济世良方.pdf', '校', '校正', '注'])

function normalizeLine(text) {
  return String(text ?? '')
    .replace(/\s+/g, '')
    .replace(/[，,。；;：:]+$/g, '')
    .trim()
}

function isNoise(text) {
  const value = normalizeLine(text)
  if (!value) return true
  if (IGNORE_LINES.has(value)) return true
  if (/^\d{1,4}$/.test(value)) return true
  if (/^第?\d+页$/.test(value)) return true
  if (/^[一二三四五六七八九十]$/.test(value)) return true
  if (/^炫癖[：:]/.test(value)) return true
  return false
}

function pickSection(line) {
  const value = normalizeLine(line)
  if (SECTION_TITLES.has(value)) return value
  return null
}

const raw = []
for (const line of fs.readFileSync(input, 'utf8').split(/\r?\n/)) {
  if (!line.trim()) continue
  try {
    raw.push(JSON.parse(line))
  } catch {
    // OCR 仍在写入时，最后一行可能不完整，跳过即可。
  }
}

const formulas = []
const sources = []
let section = ''
let condition = ''
let current = null
let variant = 0
const conditionCounts = new Map()
let serial = 0

const CN_NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']

function cnNum(n) {
  if (n <= 9) return CN_NUM[n]
  if (n < 20) return `十${n % 10 ? CN_NUM[n % 10] : ''}`
  if (n < 100) return `${CN_NUM[Math.floor(n / 10)]}十${n % 10 ? CN_NUM[n % 10] : ''}`
  return String(n)
}

function finish() {
  if (!current) return
  const record = current
  current = null
  const body = record.text.join('').trim()
  if (!body || body.length < 4) return

  serial += 1
  const n = record.variant
  const label = `方${cnNum(n)}`
  const locator = `${record.section || section || '未分部'}·${record.condition || condition || '未列病名'}·${label}`
  const sourceId = `src-mijingzi-${serial}`
  const pageText = record.page ? ` · PDF 第 ${record.page} 页` : ''
  const nameBase = record.condition || condition || '未列病名'
  const name = n === 1 ? `${nameBase}方` : `${nameBase}方${cnNum(n)}`

  sources.push({
    id: sourceId,
    type: 'textbook',
    work: '米晶子济世良方',
    locator: `${locator}${pageText}`,
    edition: '深圳报业集团出版社，2013年11月第1版',
    isbn: '978-7-80709-545-3',
    note: '据扫描本 OCR 整理，未逐字校勘；方药、剂量与用法以原书为准。',
  })

  formulas.push({
    id: `mijingzi-${String(serial).padStart(4, '0')}`,
    name,
    pinyin: '',
    sourceCitationId: sourceId,
    originalText: {
      text: body,
      kind: 'paraphrase',
      citationIds: [sourceId],
      locator: `${locator}${pageText}`,
    },
    effects: {
      text: `主治：${nameBase}。`,
      kind: 'paraphrase',
      citationIds: [sourceId],
      locator,
    },
    symptoms: [{ text: nameBase, kind: 'paraphrase', citationIds: [sourceId], locator }],
    originalAnnotations: [],
    composition: [],
    modifications: [],
    modificationsNote: '',
    symptomTags: [nameBase],
    sourceSection: record.section || section || '',
    sourcePage: record.page ?? null,
  })
}

function startFormula(marker, rest, page) {
  finish()
  if (!condition) return
  const count = (conditionCounts.get(condition) ?? 0) + 1
  conditionCounts.set(condition, count)
  variant = count
  current = {
    text: rest ? [rest] : [],
    condition,
    section,
    page,
    variant: count,
  }
}

const entries = []
for (const page of raw) {
  for (const line of page.lines ?? []) {
    const text = String(line.text ?? '').trim()
    if (text) entries.push({ text, page: page.page })
  }
}

for (let i = 0; i < entries.length; i += 1) {
  const { text, page } = entries[i]
  const nextText = entries[i + 1]?.text ?? ''
  const sectionTitle = pickSection(text)
  if (sectionTitle) {
    finish()
    section = sectionTitle
    condition = ''
    variant = 0
    continue
  }
  if (isNoise(text)) continue

  // 《经典效方》中的方名是普通标题行（如“通窍活血汤”“冷水金丹”），
  // 下一行才是“处方/主治/辨症”，需要单独识别，否则会沿用上一病名。
  const value = normalizeLine(text)
  const next = normalizeLine(nextText)
  if (
    section === '经典效方' &&
    value.length >= 2 &&
    value.length <= 20 &&
    !/[【】[\]：:，,。；;]/.test(value) &&
    /^(处方|又方|辨症|辨证|治法|主治)/.test(next)
  ) {
    finish()
    condition = value
    variant = 0
    continue
  }

  const heading = text.match(/^[【\[]\s*([^】\]]+?)\s*[】\]]\s*(.*)$/)
    if (heading) {
      finish()
      condition = normalizeLine(heading[1])
      variant = 0
      const rest = heading[2]?.trim()
      if (rest) {
        const marker = rest.match(/^(处方|又方|辨症|辨证)\s*[：:]?\s*(.*)$/)
        if (marker) {
          const body = marker[1] === '辨症' || marker[1] === '辨证'
            ? `${marker[1]}：${marker[2]}`
            : marker[2]
          startFormula(marker[1], body, page)
        } else if (current) current.text.push(rest)
      }
      continue
    }

    // 一行中可能同时出现“处方：…又方：…”，拆成多段。
    const pieces = text.split(/(?=(?:处方|又方)\s*[：:])/)
    for (const piece of pieces) {
      const marker = piece.match(/^(处方|又方|辨症|辨证)\s*[：:]?\s*(.*)$/)
      if (marker) {
        const body = marker[1] === '辨症' || marker[1] === '辨证'
          ? `${marker[1]}：${marker[2]}`
          : marker[2]
        startFormula(marker[1], body, page)
        continue
      }
      if (!current) continue
      if (isNoise(piece)) continue
      current.text.push(piece)
    }
}
finish()

const result = {
  generatedAt: new Date().toISOString(),
  source: {
    title: '米晶子济世良方',
    file: '米晶子济世良方.pdf',
    note: '扫描本 OCR 整理，未逐字校勘；条文只作阅读检索，方药与剂量以原书为准。',
  },
  stats: {
    pages: raw.length,
    formulas: formulas.length,
    sources: sources.length,
  },
  sources,
  formulas,
}

fs.mkdirSync(path.dirname(output), { recursive: true })
fs.writeFileSync(output, JSON.stringify(result, null, 2))
console.log(
  `已生成 ${path.relative(root, output)}：${formulas.length} 首方，${sources.length} 条出处，读取 ${raw.length} 页`,
)
