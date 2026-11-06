import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const SOURCE_DIR = 'F:/中医'

const BOOKS = [
  {
    prefix: 'G-026',
    title: '傅青主女科',
    author: '傅山',
    dynasty: '清',
    category: 'linzheng',
    subcategory: 'fuke',
    parser: 'fuke',
    note: '据《傅青主女科》txt 整理；原文照录，未逐字校勘。',
  },
  {
    prefix: 'O-234',
    title: '傅青主男科重编考释',
    author: '傅山',
    dynasty: '清',
    category: 'linzheng',
    subcategory: 'neike',
    parser: 'pianming',
    note: '据《傅青主男科重编考释》txt 整理；原文照录，未逐字校勘。',
  },
  {
    prefix: 'O-273',
    title: '青囊秘诀',
    author: '佚名',
    dynasty: '清',
    category: 'linzheng',
    subcategory: 'waike',
    parser: 'pianming',
    note: '据《青囊秘诀》txt 整理；原文照录，未逐字校勘。',
  },
  {
    prefix: 'S-055',
    title: '伤寒论辑义',
    author: '丹波元珍',
    dynasty: '日本·江户',
    category: 'shanghan',
    subcategory: 'shanghan',
    parser: 'pianming',
    note: '据《伤寒论辑义》txt 整理；原文照录，未逐字校勘。',
  },
  {
    prefix: 'T-002',
    title: '孙思邈房中补益',
    author: '孙思邈',
    dynasty: '唐',
    category: 'yangsheng',
    subcategory: 'yangsheng',
    parser: 'numbered',
    note: '据《孙思邈房中补益》txt 整理；原文照录，未逐字校勘。',
  },
  {
    prefix: 'Y-031',
    title: '徐灵胎难经经释',
    author: '徐大椿',
    dynasty: '清',
    category: 'yijing',
    subcategory: 'nanjing',
    parser: 'nanjing',
    note: '据《徐灵胎难经经释》txt 整理；原文照录，未逐字校勘。',
  },
  {
    prefix: 'Y-044',
    title: '素问识',
    author: '丹波元珍',
    dynasty: '日本·江户',
    category: 'yijing',
    subcategory: 'suwen',
    parser: 'pianming',
    note: '据《素问识》txt 整理；原文照录，未逐字校勘。',
  },
  {
    prefix: 'Z-003',
    title: '鬼门十三针',
    author: '佚名',
    dynasty: '待考',
    category: 'zhenjiu',
    subcategory: 'tonglun',
    parser: 'single',
    note: '据《鬼门十三针》txt 整理；原文照录，未逐字校勘。',
  },
  {
    prefix: 'Z-006',
    title: '扁鹊神应针灸玉龙经',
    author: '佚名',
    dynasty: '元',
    category: 'zhenjiu',
    subcategory: 'gefue',
    parser: 'pianming',
    note: '据《扁鹊神应针灸玉龙经》txt 整理；原文照录，未逐字校勘。',
  },
]

function cleanLine(line) {
  return line
    .replace(/\r/g, '')
    .replace(/\x[0-9a-f]{2}/gi, '')
    .replace(/\bHT\b/g, '')
    .replace(/\u3000/g, ' ')
    .trim()
}

function isMetadata(line) {
  return /^(书名|作者|朝代|年份|文献名称|所属类别|核心概念|相关公理|文献类型)[：:]/.test(line)
}

function splitParagraphs(lines) {
  return lines.map(cleanLine).filter((line) => line && !isMetadata(line))
}

function section(title, lines, kind = 'chapter') {
  const paragraphs = splitParagraphs(lines)
  const charCount = paragraphs.join('').length
  if (charCount < 4) return null
  return { title: title || '正文', kind, paragraphs, charCount }
}

function chunkSection(title, lines, limit = 7000) {
  const paragraphs = splitParagraphs(lines)
  if (!paragraphs.length) return []
  const sections = []
  let current = []
  let size = 0
  for (const line of paragraphs) {
    if (size && size + line.length > limit) {
      sections.push(section(`${title}（${sections.length + 1}）`, current))
      current = []
      size = 0
    }
    current.push(line)
    size += line.length
  }
  sections.push(section(title, current))
  return sections.filter(Boolean)
}

function splitByPianming(raw) {
  const lines = raw.replace(/\r/g, '').split('\n')
  const sections = []
  let title = ''
  let buffer = []
  let preface = []
  let sawTitle = false
  const flush = () => {
    if (title) {
      const item = section(title, buffer)
      if (item) sections.push(item)
    }
    buffer = []
  }
  for (const rawLine of lines) {
    const line = cleanLine(rawLine)
    const match = line.match(/^<篇名>(.+)$/)
    if (match) {
      flush()
      title = match[1].trim()
      sawTitle = true
      continue
    }
    if (line.startsWith('<目录>')) continue
    if (!sawTitle) {
      if (line && !isMetadata(line)) preface.push(line)
      continue
    }
    if (line) buffer.push(line)
  }
  flush()
  const result = []
  if (preface.join('').length >= 100) result.push(section('卷前', preface, 'frontMatter'))
  for (const item of sections) {
    if (item.charCount > 12000) result.push(...chunkSection(item.title, item.paragraphs))
    else result.push(item)
  }
  return result
}

function splitByNanjing(raw) {
  const lines = raw.replace(/\r/g, '').split('\n')
  const sections = []
  let title = ''
  let buffer = []
  const flush = () => {
    if (!title) return
    const item = section(title, buffer)
    if (item) sections.push(item)
    buffer = []
  }
  for (const rawLine of lines) {
    const line = cleanLine(rawLine)
    if (!line || line.startsWith('<目录>') || /^<篇名>/.test(line)) continue
    const match = line.match(/^([一二三四五六七八九十百]+)难曰/)
    if (match) {
      flush()
      title = `${match[1]}难`
      buffer.push(line)
      continue
    }
    if (title) buffer.push(line)
  }
  flush()
  return sections
}

function splitByNumbered(raw) {
  const lines = raw.replace(/\r/g, '').split('\n')
  const sections = []
  let title = ''
  let buffer = []
  const flush = () => {
    if (!title) return
    const item = section(title, buffer)
    if (item) sections.push(item)
    buffer = []
  }
  for (const rawLine of lines) {
    const line = cleanLine(rawLine)
    if (!line || line.startsWith('<目录>') || /^<篇名>/.test(line)) continue
    const match = line.match(/^（([一二三四五六七八九十百]+)）(.*)$/)
    if (match) {
      flush()
      title = `（${match[1]}）${match[2].slice(0, 14)}`
      buffer.push(line)
      continue
    }
    if (title) buffer.push(line)
  }
  flush()
  return sections
}

function splitFuke(raw) {
  const lines = raw.replace(/\r/g, '').split('\n')
  const sections = []
  let volume = ''
  let title = ''
  let buffer = []
  const headingRe = /^[^\s，。；：、（）()0-9]{2,16}[一二三四五六七八九十]+$/
  const flush = () => {
    if (!title) return
    const item = section(volume ? `${volume} · ${title}` : title, buffer)
    if (item) sections.push(item)
    buffer = []
  }
  for (const rawLine of lines) {
    const line = cleanLine(rawLine)
    if (!line || isMetadata(line)) continue
    if (/^上卷/.test(line) || /^下卷/.test(line)) {
      flush()
      volume = line.slice(0, 2)
      continue
    }
    if (line.startsWith('<') || /^[（(]/.test(line)) continue
    if (headingRe.test(line)) {
      flush()
      title = line
      continue
    }
    if (title) buffer.push(line)
  }
  flush()
  if (!sections.length) {
    return chunkSection('傅青主女科', lines)
  }
  const result = []
  for (const item of sections) {
    if (item.charCount > 12000) result.push(...chunkSection(item.title, item.paragraphs))
    else result.push(item)
  }
  return result
}

function pickParser(kind, raw) {
  if (kind === 'pianming') return splitByPianming(raw)
  if (kind === 'nanjing') return splitByNanjing(raw)
  if (kind === 'numbered') return splitByNumbered(raw)
  if (kind === 'fuke') return splitFuke(raw)
  return [section('鬼门十三针', raw.replace(/\r/g, '').split('\n'))].filter(Boolean)
}

function metaAuthor(raw) {
  const match = raw.slice(0, 800).match(/^作者[：:]\s*(.+)$/m)
  return match ? match[1].trim() : ''
}

function metaDynasty(raw) {
  const match = raw.slice(0, 800).match(/^朝代[：:]\s*(.+)$/m)
  return match ? match[1].trim() : ''
}

export function loadExtraTxtBooks() {
  if (!fs.existsSync(SOURCE_DIR)) throw new Error(`医家经典目录不存在：${SOURCE_DIR}`)
  const files = fs.readdirSync(SOURCE_DIR)
  const books = []
  const sectionMap = new Map()
  for (const config of BOOKS) {
    const file = files.find((name) => name.startsWith(`${config.prefix}-`) && name.endsWith('.txt'))
    if (!file) throw new Error(`缺少源文件：${config.prefix}`)
    const full = path.join(SOURCE_DIR, file)
    const raw = fs.readFileSync(full, 'utf8').replace(/^\uFEFF/, '')
    const sections = pickParser(config.parser, raw)
      .filter(Boolean)
      .map((item, index) => ({
        ...item,
        id: `s-${String(index + 1).padStart(4, '0')}`,
        sortOrder: index + 1,
      }))
    if (!sections.length) throw new Error(`未能拆解：${file}`)
    const id = `lib-${crypto.createHash('sha1').update(file).digest('hex').slice(0, 10)}`
    books.push({
      id,
      file,
      title: config.title,
      author: metaAuthor(raw) || config.author,
      dynasty: metaDynasty(raw) || config.dynasty,
      category: config.category,
      subcategory: config.subcategory,
      charCount: raw.length,
      sectionCount: sections.length,
      duplicateOf: '',
      versionNote: '',
      source: {
        note: config.note,
        path: `F:/中医/${file}`,
      },
    })
    sectionMap.set(id, sections)
  }
  return { books, sectionMap }
}
