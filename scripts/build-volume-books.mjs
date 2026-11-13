import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const BOOKS = [
  {
    id: 'shiyi',
    title: '世医得效方',
    author: '危亦林',
    doctor: '危亦林',
    dir: 'F:/中医/达斋危一脉行医集/%E4%B8%96%E5%8C%BB%E5%BE%97%E6%95%88%E6%96%B9',
    pages: 93,
    note: '据整理稿录入，源文题“世医得效方 元 危亦林”。按原书卷次与十三科门类整理，每卷汇录原书病证、方药与治验，原文照录，未删节。源文为 OCR 整理本，个别字有缺误，以原书为准。方药剂量仅供文献学习。',
  },
  {
    id: 'frdq',
    title: '妇人大全良方',
    author: '陈自明',
    doctor: '陈自明',
    dir: 'F:/中医/妇人大全良方/%E5%A6%87%E4%BA%BA%E5%A4%A7%E5%85%A8%E8%89%AF%E6%96%B9',
    pages: 70,
    note: '据整理稿录入，源文题“妇人大全良方 宋 陈自明”。按原书卷次与调经、众疾、求嗣、胎教、妊娠、坐月、产难、产后等门类整理，原文照录，未删节。本书与《妇人良方集要》内容有重叠，本页保留本书自身的卷次与文字。源文为 OCR 整理本，个别字有缺误，以原书为准。方药剂量仅供文献学习。',
  },
  {
    id: 'qjyf',
    title: '千金翼方',
    author: '孙思邈',
    doctor: '孙思邈',
    dir: 'F:/中医/孙思邈千金翼方zip/%E5%8D%83%E9%87%91%E7%BF%BC%E6%96%B9',
    pages: 113,
    note: '据整理稿录入，源文题“千金翼方 唐 孙思邈”。按原书三十卷整理，含药录纂要、本草、妇人、伤寒、小儿、养性、辟谷、退居、补益、中风、杂病、万病、飞炼、疮痈、色脉、针灸、禁经等，原文照录，未删节。源文为 OCR 整理本，个别字有缺误，以原书为准。方药剂量仅供文献学习。',
  },
  {
    id: 'tphm',
    title: '太平惠民和剂局方',
    author: '太平惠民和剂局',
    doctor: '',
    dir: 'F:/中医/太平盛惠方合局方/%E5%A4%AA%E5%B9%B3%E6%83%A0%E6%B0%91%E5%92%8C%E5%89%82%E5%B1%80%E6%96%B9',
    pages: 48,
    note: '据整理稿录入，源文题“太平惠民和剂局方 宋”。按原书十卷、诸风、伤寒、一切气、痰饮、诸虚、痼冷、积热、泻痢、眼目、咽喉、疮肿、伤折、妇人、小儿等门类整理，原文照录，未删节。源文为 OCR 整理本，个别字有缺误，以原书为准。方药剂量仅供文献学习。',
  },
  {
    id: 'wtmyf',
    title: '外台秘要方',
    author: '王焘',
    doctor: '王焘',
    dir: 'F:/中医/外台秘要方/%E5%A4%96%E5%8F%B0%E7%A7%98%E8%A6%81%E6%96%B9',
    pages: 204,
    note: '据四库本整理稿录入，源文题“外台秘要方 唐 王焘”。按原书四十卷、卷下诸门整理，每卷汇录原书病证、方药与灸法，原文照录，未删节。本书与《外台秘要》为同书异本，本页保留四库本自身的卷次与文字。源文为 OCR 整理本，个别字有缺误，以原书为准。方药剂量仅供文献学习。',
  },
  {
    id: 'bjqj',
    title: '备急千金要方',
    author: '孙思邈',
    doctor: '孙思邈',
    dir: 'F:/中医/备急千金要方/%E5%A4%87%E6%80%A5%E5%8D%83%E9%87%91%E8%A6%81%E6%96%B9',
    pages: 148,
    note: '据整理稿录入，源文题“备急千金要方 唐 孙思邈”。按原书三十卷整理，含诸论、妇人、少小、七窍、风毒脚气、诸风、伤寒、肝脏、胆腑、心脏、小肠腑、脾脏、胃腑、肺脏、大肠腑、肾脏、膀胱腑、消渴、针灸等，原文照录，未删节。源文为 OCR 整理本，个别字有缺误，以原书为准。方药剂量仅供文献学习。',
  },
  {
    id: 'pijifang',
    title: '普济方',
    author: '朱橚',
    doctor: '朱橚',
    dir: 'F:/中医/普济方/%E6%99%AE%E6%B5%8E%E6%96%B9',
    pages: 999,
    note: '据整理稿录入，源文题“普济方 明 朱橚”。按原书卷次与病证门整理，每卷汇录原书论治、方药与灸法，原文照录，未删节。源文为 OCR 整理本，个别字有缺误，以原书为准。方药剂量仅供文献学习。',
  },
  {
    id: 'tpss',
    title: '太平圣惠方',
    author: '王怀隐等',
    doctor: '王怀隐',
    dir: 'F:/中医/太平圣惠方/%E5%A4%AA%E5%B9%B3%E5%9C%A3%E6%83%A0%E6%96%B9',
    pages: 461,
    note: '据整理稿录入，源文题“太平圣惠方 宋 王怀隐等”。按原书一百卷整理，每卷汇录原书病证、方药与灸法，原文照录，未删节。源文为 OCR 整理本，个别字有缺误，以原书为准。方药剂量仅供文献学习。',
  },
]

const CATEGORY_RULES = [
  ['妇科', /妇人|产|胎|乳|经|崩|带下|求子|嗣/],
  ['儿科', /小儿|婴|痘|疹|麻|疳/],
  ['五官', /眼|目|耳|鼻|口|齿|舌|喉|咽喉|牙/],
  ['外科皮肤', /疮|痈|疽|疔|瘰|瘤|瘿|痔|伤|折|金疮|癣|疥|毒蛇|犬咬/],
  ['肺系', /肺|咳|喘|痰|痨|骨蒸/],
  ['脾胃', /脾|胃|呕|吐|泻|痢|霍乱|胀|积|噎|膈|宿食/],
  ['肝胆', /肝|胆|黄|胁/],
  ['肾与水病', /肾|膀胱|淋|小便|水肿|腰|脚气|消渴|遗/],
  ['神经', /风|癫|痫|痉|眩|头痛|惊|痴|神|尸|鬼|邪/],
  ['心胸', /心|胸|血|汗|悸|烦/],
  ['外感时病', /伤寒|温|暑|湿|疟|疫|时气|天行|霍乱/],
]

function categoryFor(text) {
  for (const [category, pattern] of CATEGORY_RULES) {
    if (pattern.test(text)) return category
  }
  return '其他'
}

function modeFor(text) {
  return /总论|序|叙|凡例|药录|本草|养性|禁经|针灸|脉经|脉法|脉论|脉诀|诊脉|脉学|脉例|脉体|脉证|论$|说$/.test(text) ? 'thought' : 'formula'
}

const VOLUME_RE = /^卷(?:第|之)?[一二三四五六七八九十百千零〇0-9]+/

function cleanLine(raw) {
  return raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^[\s\u3000]+|[\s\u3000]+$/g, '')
}

function normalize(text) {
  return text.replace(/\s+/g, '')
}

function buildBook(book) {
  const files = fs
    .readdirSync(book.dir)
    .filter((name) => /^p\d+\.md$/.test(name))
    .sort((a, b) => Number(a.slice(1, -3)) - Number(b.slice(1, -3)))

  if (files.length < book.pages) {
    throw new Error(`${book.id}: expected ${book.pages} pages, got ${files.length}`)
  }

  const blocks = []
  for (const file of files) {
    const text = fs.readFileSync(path.join(book.dir, file), 'utf8').replace(/\r\n/g, '\n')
    for (const raw of text.split('\n')) {
      const line = cleanLine(raw)
      if (line) blocks.push(line)
    }
  }

  const entries = []
  const expectedBlocks = []
  let current = null
  let volumeTitle = ''
  let volumeKey = ''
  let peekTitle = false

  function closeEntry() {
    if (!current) return
    if (!current.content.length) {
      // A volume header with no body is kept as an empty entry rather than
      // silently dropped; this only happens at the very end of a source file.
      current.content.push(current.title)
    }
    current.id = `${book.id}-${String(entries.length + 1).padStart(4, '0')}`
    entries.push(current)
    current = null
  }

  for (let index = 0; index < blocks.length; index += 1) {
    const line = blocks[index]

    if (index === 0 && new RegExp(book.title).test(line)) continue

    if (VOLUME_RE.test(line)) {
      const keyMatch = line.match(/^卷(?:第|之)?([一二三四五六七八九十百千零〇0-9]+)/)
      const key = `卷${keyMatch ? keyMatch[1] : ''}`
      if (key === volumeKey) {
        if (current && !current.content.length && line.length > volumeTitle.length) {
          volumeTitle = line
          current.title = line
          current.category = categoryFor(line)
          current.mode = modeFor(line)
        }
        continue
      }
      closeEntry()
      volumeKey = key
      volumeTitle = line
      peekTitle = /^卷(?:第|之)?[一二三四五六七八九十百千零〇0-9]+$/.test(line)
      current = {
        title: line,
        volume: line,
        category: categoryFor(line),
        mode: modeFor(line),
        content: [],
      }
      continue
    }

    if (!current) {
      current = {
        title: '卷前',
        volume: '卷前',
        category: '其他',
        mode: 'thought',
        content: [],
      }
      volumeKey = '卷前'
    }

    if (peekTitle && line.length <= 18 && !/[。，！？：；、]/.test(line)) {
      current.title = `${volumeTitle}·${line}`
      current.category = categoryFor(current.title)
      current.mode = modeFor(current.title)
      peekTitle = false
      continue
    }
    peekTitle = false

    current.content.push(line)
    expectedBlocks.push(line)
  }

  closeEntry()

  const expected = normalize(expectedBlocks.join(''))
  const actual = normalize(entries.flatMap((entry) => entry.content).join(''))
  if (expected !== actual) {
    let index = 0
    while (index < expected.length && expected[index] === actual[index]) index += 1
    throw new Error(
      `${book.id}: text mismatch at ${index}\nexpected: ${expected.slice(index, index + 60)}\nactual: ${actual.slice(index, index + 60)}`,
    )
  }

  return {
    generatedAt: new Date().toISOString(),
    book: {
      id: book.id,
      title: book.title,
      author: book.author,
      era: 'ancient',
      note: book.note,
      caseCount: entries.length,
    },
    cases: entries.map((entry) => ({
      id: entry.id,
      bookId: book.id,
      title: entry.title,
      category: entry.category,
      doctor: book.doctor || undefined,
      mode: entry.mode,
      era: 'ancient',
      subcategory: entry.volume,
      summary: (entry.content[0] ?? entry.title).replace(/\s+/g, ' ').slice(0, 90),
      source: {
        work: `《${book.title}》`,
        locator: entry.volume === '卷前' ? '卷前' : entry.title,
        note: book.note,
      },
      content: entry.content.map((text) => ({ type: 'paragraph', text })),
    })),
  }
}

for (const book of BOOKS) {
  const payload = buildBook(book)
  const outFile = path.join(root, 'src', 'data', 'cases', `${book.id}.json`)
  fs.writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

  const categories = new Map()
  const modes = new Map()
  for (const entry of payload.cases) {
    categories.set(entry.category, (categories.get(entry.category) ?? 0) + 1)
    modes.set(entry.mode, (modes.get(entry.mode) ?? 0) + 1)
  }
  console.log(
    `${book.id}\t${book.title}\t${payload.cases.length} 条\t${JSON.stringify(Object.fromEntries(categories))}\t${JSON.stringify(Object.fromEntries(modes))}`,
  )
}
