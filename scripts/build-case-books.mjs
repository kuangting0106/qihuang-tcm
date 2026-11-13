import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'src', 'data', 'cases')

const BOOKS = [
  {
    id: 'huixi',
    title: '洄溪医案',
    author: '徐灵胎',
    era: 'ancient',
    note: '清·徐灵胎撰，王士雄评注。',
    dir: 'F:/中医/洄溪医案徐灵胎/%E6%B4%84%E6%BA%AA%E5%8C%BB%E6%A1%88',
    pages: 8,
    prefix: 'huixi',
  },
]

const CATEGORY_MAP = {
  崩: '妇科',
  胎中毒火: '妇科',
  子利: '妇科',
  试胎: '妇科',
  产后风热: '妇科',
  产后血臌: '妇科',
  产后肠痈: '妇科',
  恶痘: '儿科',
  流注: '外科皮肤',
  肠痈: '外科皮肤',
  腿痈: '外科皮肤',
  臂疽: '外科皮肤',
  项疽: '外科皮肤',
  对口: '外科皮肤',
  发背: '外科皮肤',
  对心发: '外科皮肤',
  肺痈: '外科皮肤',
  乳疖: '外科皮肤',
  下疳: '外科皮肤',
  筋瘤: '外科皮肤',
  痰: '肺系',
  痰喘: '肺系',
  痰喘亡阴: '肺系',
  痢: '脾胃',
  疟痢: '脾胃',
  翻胃: '脾胃',
  呃: '脾胃',
  饮癖: '脾胃',
  消: '脾胃',
  虫痛: '脾胃',
  肠红: '脾胃',
  血痢: '脾胃',
  癃: '肾与水病',
  水肿: '肾与水病',
  怔忡: '心胸',
  亢阳: '心胸',
  吐血: '心胸',
  瘀留经络: '心胸',
  瘀血冲厥: '心胸',
  中风: '外感时病',
  恶风: '外感时病',
  周痹: '外感时病',
  痱: '外感时病',
  伤寒: '外感时病',
  刖足伤寒: '外感时病',
  外感停食: '外感时病',
  时证: '外感时病',
  游魂: '外感时病',
  失魂: '外感时病',
  祟病: '外感时病',
  瘟疫: '外感时病',
  暑: '外感时病',
  暑邪热呃: '外感时病',
  疟: '外感时病',
  畏寒: '外感时病',
  畏风: '外感时病',
}

function readBook(book) {
  const blocks = []
  for (let page = 1; page <= book.pages; page += 1) {
    const file = path.join(book.dir, `p${page}.md`)
    const raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')
    for (const line of raw.split(/\r?\n/)) {
      const text = line.replace(/^[\s\u3000]+/, '').replace(/\s+$/, '')
      if (!text || text.startsWith('<!--')) continue
      blocks.push(text)
    }
  }
  return blocks
}

function isHeading(text) {
  const normalized = text.replace(/[\s\u3000]/g, '')
  if (!normalized) return false
  if (normalized.length > 6) return false
  if (/[。，！？：；、]/.test(normalized)) return false
  if (/^(雄按|又按|附)/.test(normalized)) return false
  return true
}

function isCommentary(text) {
  return /^(雄按|又按)/.test(text.replace(/^[\s\u3000]+/, ''))
}

function isContinuation(text) {
  const value = text.replace(/^[\s\u3000]+/, '')
  if (value.startsWith('附')) return true
  if (/^(用|上为末|每服|日进|研|捣|煎|调|敷|掺|洗|吹|点|含|噙|化)/.test(value)) return true
  if (value.includes('，')) return false
  return /钱|分|两|升|合|枚|个|片|条|日进|每服|上为末|研末/.test(value)
}

function cleanStart(text) {
  return text.replace(/^[。—\-、，；：\s\u3000]+/, '').trim()
}

function patientPart(text) {
  const cleaned = cleanStart(text)
  const clause = cleaned.split(/[，。；：！？]/)[0] ?? ''
  return clause.slice(0, 18).trim()
}

function buildBook(book) {
  const blocks = readBook(book)
  if (blocks.length < 8) throw new Error(`${book.id}: too few blocks (${blocks.length})`)

  const frontMatter = blocks.slice(0, 4)
  const body = blocks.slice(4)
  const cases = []
  const tokens = []
  let section = ''
  let current = null

  for (const raw of body) {
    const text = raw.trim()
    if (!text) continue

    if (isHeading(text)) {
      section = text.replace(/[\s\u3000]/g, '')
      tokens.push(section)
      current = null
      continue
    }

    if (isCommentary(text) || isContinuation(text)) {
      if (current) {
        current.content.push({ type: 'paragraph', text })
        tokens.push(text)
      }
      continue
    }

    const start = cleanStart(text)
    tokens.push(text)
    current = {
      id: '',
      bookId: book.id,
      title: '',
      category: CATEGORY_MAP[section] ?? '其他',
      doctor: book.author,
      mode: 'case',
      era: book.era,
      subcategory: section,
      summary: start.slice(0, 90),
      source: {
        work: `《${book.title}》`,
        locator: section,
        note: book.note,
      },
      content: [{ type: 'paragraph', text: start }],
    }
    current.title = `${section}·${patientPart(start)}`
    cases.push(current)
  }

  cases.forEach((item, index) => {
    item.id = `${book.prefix}-${String(index + 1).padStart(3, '0')}`
  })

  return {
    generatedAt: new Date().toISOString(),
    book: {
      id: book.id,
      title: book.title,
      author: book.author,
      era: book.era,
      note: book.note,
      caseCount: cases.length,
    },
    frontMatter,
    cases,
    tokens,
  }
}

function normalize(value) {
  return value.replace(/[\s\u3000]/g, '')
}

fs.mkdirSync(outDir, { recursive: true })

for (const book of BOOKS) {
  const { tokens, ...payload } = buildBook(book)
  const file = path.join(outDir, `${book.id}.json`)
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

  const sourceBlocks = readBook(book).slice(4)
  const sourceText = normalize(sourceBlocks.join(''))
  const outputText = normalize(tokens.join(''))

  if (sourceText !== outputText) {
    let index = 0
    while (index < sourceText.length && sourceText[index] === outputText[index]) index += 1
    throw new Error(
      `${book.id}: text mismatch at ${index}\nsource: ${sourceText.slice(index, index + 60)}\noutput: ${outputText.slice(index, index + 60)}`,
    )
  }

  console.log(
    `${book.title}: ${payload.cases.length} cases, blocks=${readBook(book).length}, chars=${sourceText.length}`,
  )
  console.log(`wrote ${path.relative(root, file)}`)
}
