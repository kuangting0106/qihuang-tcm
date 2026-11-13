import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = 'F:/中医/丁甘仁 曹颖甫弟子/%E4%B8%81%E7%94%98%E4%BB%81%E5%8C%BB%E6%A1%88'
const outFile = path.join(root, 'src', 'data', 'cases', 'ding.json')

const CATEGORY_RULES = [
  ['调经', '妇科'],
  ['崩漏', '妇科'],
  ['带下', '妇科'],
  ['胎前', '妇科'],
  ['产后', '妇科'],
  ['乳岩', '妇科'],
  ['白喉', '儿科'],
  ['痧后', '儿科'],
  ['喉痧', '五官'],
  ['牙疳', '五官'],
  ['牙岩', '五官'],
  ['鼻痔', '五官'],
  ['鼻疳', '五官'],
  ['外科', '外科皮肤'],
  ['疽', '外科皮肤'],
  ['痈', '外科皮肤'],
  ['疔', '外科皮肤'],
  ['疮', '外科皮肤'],
  ['瘰', '外科皮肤'],
  ['瘤', '外科皮肤'],
  ['瘿', '外科皮肤'],
  ['痔', '外科皮肤'],
  ['痰核', '外科皮肤'],
  ['痰毒', '外科皮肤'],
  ['发背', '外科皮肤'],
  ['骨槽风', '外科皮肤'],
  ['时毒', '外科皮肤'],
  ['缩脚阴痰', '外科皮肤'],
  ['调经', '妇科'],
  ['崩漏', '妇科'],
  ['带下', '妇科'],
  ['胎前', '妇科'],
  ['产后', '妇科'],
  ['乳岩', '妇科'],
  ['白喉', '儿科'],
  ['痧后', '儿科'],
  ['脑疽', '外科皮肤'],
  ['夭疽', '外科皮肤'],
  ['骨槽风', '外科皮肤'],
  ['时毒', '外科皮肤'],
  ['瘰', '外科皮肤'],
  ['痰核', '外科皮肤'],
  ['痰毒', '外科皮肤'],
  ['痰瘤', '外科皮肤'],
  ['血瘤', '外科皮肤'],
  ['气瘿', '外科皮肤'],
  ['发背', '外科皮肤'],
  ['肝疽', '外科皮肤'],
  ['肺疽', '肺系'],
  ['疔疮', '外科皮肤'],
  ['湿疮', '外科皮肤'],
  ['痔疮', '外科皮肤'],
  ['缩脚阴痰', '外科皮肤'],
  ['牙疳', '五官'],
  ['牙岩', '五官'],
  ['鼻痔', '五官'],
  ['鼻疳', '五官'],
  ['喉痧', '五官'],
  ['咳嗽', '肺系'],
  ['肺痈', '肺系'],
  ['吐血', '肺系'],
  ['哮喘', '肺系'],
  ['痰饮', '肺系'],
  ['霍乱', '脾胃'],
  ['泄泻', '脾胃'],
  ['痢疾', '脾胃'],
  ['疟疾', '脾胃'],
  ['呃嗳', '脾胃'],
  ['肿胀', '脾胃'],
  ['黄胆', '脾胃'],
  ['便血', '脾胃'],
  ['溲血', '脾胃'],
  ['衄血', '脾胃'],
  ['肝气肝阳', '肝胆'],
  ['心悸', '心胸'],
  ['中风', '神经'],
  ['类中', '神经'],
  ['神志', '神经'],
  ['头痛眩晕', '神经'],
  ['伤寒', '外感时病'],
  ['风温', '外感时病'],
  ['暑温', '外感时病'],
  ['湿温', '外感时病'],
  ['痉症', '外感时病'],
  ['大头瘟', '外感时病'],
  ['癃闭', '肾与水病'],
  ['淋浊', '肾与水病'],
  ['遗精', '肾与水病'],
]

function categoryFor(section) {
  for (const [keyword, category] of CATEGORY_RULES) {
    if (section.includes(keyword)) return category
  }
  return '其他'
}

function readBlocks() {
  const blocks = []
  for (let page = 1; page <= 37; page += 1) {
    const raw = fs.readFileSync(path.join(sourceDir, `p${page}.md`), 'utf8').replace(/^\uFEFF/, '')
    for (const line of raw.split(/\r?\n/)) {
      const text = line.replace(/^[\s\u3000]+/, '').replace(/\s+$/, '')
      if (!text || text.startsWith('<!--')) continue
      blocks.push(text)
    }
  }
  return blocks
}

function clean(text) {
  return text.replace(/^[。—\-、，；：\s\u3000]+/, '').trim()
}

function firstClause(text) {
  return clean(text).split(/[，。；：！？]/)[0]?.slice(0, 18).trim() ?? ''
}

function build() {
  const blocks = readBlocks()
  const start = blocks.findIndex((text) => /^卷[一二三四五六七八九十]+/.test(text.trim()))
  if (start < 0) throw new Error('body start not found')

  const body = blocks.slice(start)
  const cases = []
  const tokens = []
  let volume = ''
  let section = ''
  let current = null
  let headingCount = 0
  let paragraphCount = 0

  const PATIENT_RE =
    /^[\u4e00-\u9fa5]{1,2}(?:[左右]|幼|童|妪|叟|翁|君|先生|夫人|女士|公子|女|妇|男)(?=$|[\s\u3000，,])/

  const newCase = (text, mode = 'case') => {
    const patient = text.match(PATIENT_RE)?.[0] ?? firstClause(text)
    const title = section ? `${section}·${patient}` : patient
    const item = {
      id: '',
      bookId: 'ding',
      title,
      category: categoryFor(section),
      doctor: '丁甘仁',
      mode,
      era: 'ancient',
      subcategory: section || volume,
      summary: clean(text).slice(0, 90),
      source: {
        work: '《丁甘仁医案》',
        locator: `${volume}·${section}`,
        note: '据整理稿录入；曹颖甫为本书作序。方药剂量仅供文献学习。',
      },
      content: [{ type: 'paragraph', text: clean(text) }],
    }
    cases.push(item)
    current = item
    paragraphCount += 1
    return item
  }

  for (const raw of body) {
    const text = raw.trim()
    if (!text) continue
    tokens.push(text)

    const parts = text.split(/[\s\u3000]+/).filter(Boolean)
    const compact = text.replace(/[\s\u3000]+/g, '')

    if (/^卷[一二三四五六七八九十]+$/.test(parts[0] ?? '')) {
      const nextVolume = parts[0]
      const nextSection = parts[1] ?? ''
      headingCount += 1
      if (nextVolume === volume && (!nextSection || nextSection === section)) continue
      if (nextVolume !== volume) {
        volume = nextVolume
        section = nextSection
      } else {
        section = nextSection || section
      }
      current = null
      continue
    }

    if (parts.length === 1 && (compact.endsWith('案') || compact === '膏方')) {
      headingCount += 1
      if (compact === section) continue
      section = compact
      current = null
      continue
    }

    if (/^[一二三四五六七八九十]{1,2}诊/.test(compact) || /^(复诊|再诊)/.test(compact)) {
      const target = current ?? cases[cases.length - 1]
      if (target) {
        target.content.push({ type: 'paragraph', text: clean(text) })
        paragraphCount += 1
      } else {
        newCase(text, 'thought')
      }
      continue
    }

    const appendix = text.match(/^[（(]附[：:]\s*(.+?)[）)]\s*(.*)$/)
    if (appendix) {
      const label = appendix[1].replace(/[\s\u3000]+/g, '')
      const rest = appendix[2].trim()
      if (/案.*案/.test(label)) {
        headingCount += 1
        current = null
        continue
      }
      section = label.replace(/^附[：:]/, '')
      current = null
      if (rest && PATIENT_RE.test(rest)) {
        newCase(rest, 'case')
      } else {
        headingCount += 1
      }
      continue
    }

    const plainAppendix = text.match(/^附[：:]\s*(.+)$/)
    if (plainAppendix) {
      section = plainAppendix[1].replace(/[\s\u3000]+/g, '')
      headingCount += 1
      current = null
      continue
    }

    if (
      compact.length <= 6 &&
      !/[。，！？：；、（）()0-9]/.test(compact) &&
      /(病|症|证|风|寒|暑|湿|温|痛|咳|喘|痰|血|痢|疟|疽|痈|疮|瘤|瘿|痔|疳|岩|毒|闭|浊|精|带|漏|经|胎|产|痉|厥|胀|满|渴|痹|痿|疝|瘕|癥|痧|痘|疹|疔|瘰|饮|呃|嗳|黄|疸|肿|淋|遗|便|溲|衄|瘟|核|背)$/.test(compact) &&
      !PATIENT_RE.test(text)
    ) {
      headingCount += 1
      section = compact
      current = null
      continue
    }

    if (PATIENT_RE.test(text)) {
      newCase(text, 'case')
      continue
    }

    if (current) {
      current.content.push({ type: 'paragraph', text: clean(text) })
      paragraphCount += 1
    } else {
      const previous = cases[cases.length - 1]
      if (previous && !/(概论|总论|论)$/.test(section || '')) {
        previous.content.push({ type: 'paragraph', text: clean(text) })
        paragraphCount += 1
      } else {
        newCase(text, 'thought')
        current.title = `${section || volume}·总论`
      }
    }
  }

  if (headingCount + paragraphCount !== body.length) {
    throw new Error(
      `block mismatch: headings=${headingCount} paragraphs=${paragraphCount} body=${body.length}`,
    )
  }

  cases.forEach((item, index) => {
    item.id = `ding-${String(index + 1).padStart(3, '0')}`
  })

  const sourceText = body.join('').replace(/[\s\u3000]/g, '')
  const outputText = tokens.join('').replace(/[\s\u3000]/g, '')
  if (sourceText !== outputText) throw new Error('text mismatch')

  return {
    generatedAt: new Date().toISOString(),
    book: {
      id: 'ding',
      title: '丁甘仁医案',
      author: '丁甘仁',
      era: 'ancient',
      note: '据整理稿录入；曹颖甫为本书作序。方药剂量仅供文献学习。',
      caseCount: cases.length,
    },
    cases,
  }
}

const payload = build()
fs.mkdirSync(path.dirname(outFile), { recursive: true })
fs.writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

const byMode = payload.cases.reduce((map, item) => {
  map[item.mode] = (map[item.mode] ?? 0) + 1
  return map
}, {})
console.log(`wrote ${path.relative(root, outFile)}`)
console.log(`cases=${payload.cases.length} modes=${JSON.stringify(byMode)}`)
console.log(
  payload.cases
    .slice(0, 12)
    .map((item) => `${item.id}\t${item.subcategory}\t${item.mode}\t${item.title}`)
    .join('\n'),
)
