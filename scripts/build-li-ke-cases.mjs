import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SOURCE_DIR = 'F:/中医/李可医案集/lk'
const OUT = path.join(__dirname, '..', 'src', 'data', 'li-ke-cases.json')

const BOOK = '李可老中医急危重症疑难病经验专辑'
const DOCTOR = '李可'

const RULES = [
  ['妇科', /妇科|崩漏|月经|带下|乳|胎|产|子宫|不孕|乳腺/],
  ['儿科', /小儿|幼儿|新生儿|婴儿/],
  ['癌症', /癌|肿瘤|瘤/],
  ['免疫', /红斑狼疮|类风湿|硬皮病|免疫/],
  ['五官', /目|眼|耳|鼻|口|舌|齿|牙|咽喉|喉/],
  ['肺系', /肺|咳|喘|胸膜|肺结核/],
  ['心胸', /心|胸|脉|悸|高血压|心衰/],
  ['肝胆', /肝|胆|胁/],
  ['脾胃', /胃|肠|痢|泻|腹|便秘|痔|呃逆/],
  ['肾与水病', /肾|尿|水肿|淋|癃|泌尿/],
  ['神经', /中风|脑|精神|癫痫|震颤|头痛|眩晕|神经|失眠|奔豚/],
  ['外科皮肤', /外科|疮|疡|皮|疹|脉管炎|关节|骨|肩|腰|膝|足跟/],
  ['外感时病', /发热|感冒|温|疫|疟|感染/],
]

function clean(value) {
  return value
    .replace(/\r/g, '')
    .replace(/^\uFEFF/, '')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

function paragraphsOf(lines) {
  const text = lines.join('\n').trim()
  if (!text) return []
  return text
    .split(/\n{2,}/)
    .map((part) => clean(part))
    .filter(Boolean)
}

function classify(text) {
  for (const [name, pattern] of RULES) {
    if (pattern.test(text)) return name
  }
  return '其他'
}

function sourceOf(locator) {
  return {
    work: BOOK,
    locator,
    note: '据李可医案集整理；原文照录，未逐字校勘，剂量与煎服法依原文。',
  }
}

function isCaseLike(text) {
  return /(患者|某某|某[，,]|[男女][，,]|[0-9０-９]{1,3}\s*岁|处方|方用|药用)/.test(text)
}

function splitNumbered(lines) {
  const indexes = []
  lines.forEach((line, index) => {
    if (/^[（(][一二三四五六七八九十]+[）)]/.test(line.trim())) indexes.push(index)
  })
  if (indexes.length < 2) return []
  return indexes.map((start, i) => ({
    title: lines[start].trim().replace(/^[（(]|[）)]$/g, ''),
    lines: lines.slice(start, indexes[i + 1] ?? lines.length),
  }))
}

function splitHeadings(lines, chapterTitle) {
  const sections = []
  let h2 = ''
  let h3 = ''
  let buffer = []

  const flush = () => {
    const text = buffer.join('\n').trim()
    buffer = []
    if (text.length < 80) return
    const title = h3 || h2 || chapterTitle
    if (!title) return
    if (!isCaseLike(text)) return
    sections.push({ title, lines: text.split('\n') })
  }

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)$/)
    const h3Match = line.match(/^###\s+(.+)$/)
    if (h2Match) {
      flush()
      h2 = clean(h2Match[1])
      h3 = ''
      continue
    }
    if (h3Match) {
      flush()
      h3 = clean(h3Match[1])
      continue
    }
    buffer.push(line)
  }
  flush()
  return sections
}

const CHAPTER_CATEGORY = {
  1: '心胸',
  2: '肺系',
  3: '心胸',
  4: '肺系',
  5: '肺系',
  6: '神经',
  7: '肺系',
  8: '心胸',
  9: '外感时病',
  10: '脾胃',
  11: '脾胃',
  12: '脾胃',
  13: '肝胆',
  14: '外科皮肤',
  15: '儿科',
  16: '妇科',
  17: '外科皮肤',
  18: '脾胃',
  19: '肾与水病',
  20: '肝胆',
  21: '外感时病',
  22: '外感时病',
  23: '外感时病',
  24: '外感时病',
  25: '神经',
  26: '神经',
  27: '神经',
  28: '神经',
  29: '脾胃',
  30: '外感时病',
  31: '外感时病',
  32: '免疫',
  33: '外科皮肤',
  34: '免疫',
  35: '脾胃',
  36: '外科皮肤',
  37: '外科皮肤',
  38: '外科皮肤',
  39: '外科皮肤',
  40: '其他',
  41: '神经',
  42: '神经',
  43: '其他',
  44: '神经',
  45: '外科皮肤',
  46: '妇科',
  47: '五官',
  48: '五官',
  49: '五官',
  50: '五官',
  51: '肺系',
  52: '外科皮肤',
  53: '癌症',
  54: '神经',
  55: '其他',
  56: '其他',
}

function parseFile(file) {
  const raw = fs.readFileSync(path.join(SOURCE_DIR, file), 'utf8')
  const lines = raw.replace(/\r/g, '').split('\n')
  const titleIndex = lines.findIndex((line) => /^#\s+/.test(line))
  const chapterTitle =
    titleIndex >= 0 ? clean(lines[titleIndex].replace(/^#\s+/, '')) : file.replace(/\.md$/, '')
  const body = lines.slice(titleIndex >= 0 ? titleIndex + 1 : 0)

  let sections = []
  if (body.some((line) => /^#{2,3}\s+/.test(line))) {
    sections = splitHeadings(body, chapterTitle)
  }
  if (!sections.length) {
    const numbered = splitNumbered(body)
    if (numbered.length >= 2) sections = numbered
  }
  if (!sections.length) {
    const text = body.join('\n').trim()
    if (text.length >= 80) sections = [{ title: chapterTitle, lines: text.split('\n') }]
  }

  return { file, chapterTitle, sections }
}

const files = fs
  .readdirSync(SOURCE_DIR)
  .filter((name) => /^lk\d+\.md$/i.test(name))
  .sort((a, b) => a.localeCompare(b, 'en'))

const cases = []
for (const file of files) {
  const number = Number(file.match(/^lk(\d+)\.md$/i)?.[1] ?? -1)
  if (number <= 0) continue

  const parsed = parseFile(file)
  const thought = ['lk55.md', 'lk56.md'].includes(file)
  parsed.sections.forEach((section, sectionIndex) => {
    const paragraphs = paragraphsOf(section.lines)
    if (!paragraphs.length) return
    const text = paragraphs.join('\n')
    const index = cases.length + 1
    cases.push({
      id: `like-${String(index).padStart(3, '0')}`,
      title: section.title,
      category: CHAPTER_CATEGORY[number] ?? classify(parsed.chapterTitle),
      subcategory: parsed.chapterTitle,
      doctor: DOCTOR,
      era: 'modern',
      mode: thought ? 'thought' : 'case',
      summary: text.replace(/\s+/g, ' ').slice(0, 90) + (text.length > 90 ? '…' : ''),
      source: sourceOf(`${parsed.chapterTitle} · ${section.title}`),
      content: paragraphs.map((part) => ({ type: 'paragraph', text: part })),
    })
  })
}

fs.writeFileSync(OUT, `${JSON.stringify({ generatedAt: new Date().toISOString(), cases }, null, 2)}\n`)

const byMode = cases.reduce((acc, item) => {
  acc[item.mode] = (acc[item.mode] ?? 0) + 1
  return acc
}, {})
const byCategory = cases.reduce((acc, item) => {
  acc[item.category] = (acc[item.category] ?? 0) + 1
  return acc
}, {})
const longest = cases.reduce((max, item) => {
  const length = item.content.map((block) => block.text).join('').length
  return length > max.length ? { id: item.id, title: item.title, length } : max
}, { length: 0 })

console.log(`Wrote ${path.relative(process.cwd(), OUT)}: ${cases.length} entries`, byMode)
console.log('categories', byCategory)
console.log('longest', longest)
