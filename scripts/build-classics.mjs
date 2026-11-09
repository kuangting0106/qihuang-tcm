import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { classicBooks } from './content/classics.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = path.join(root, 'scripts', 'content', 'classics')
const outDir = path.join(root, 'public', 'data', 'classics')

const PREFACE_RE = /序|跋/
const FRONT_MATTER_RE = /凡例|例言|校勘|目录|提要/
const VOLUME_ONLY_RE = /^卷[一二三四五六七八九十百]+(?:[（(][^）)]*[）)])?$/

function normalizeVolume(value) {
  return value.replace(/\\/g, ' · ').trim()
}

function isPreface(title) {
  return PREFACE_RE.test(title)
}

function isPostscript(title) {
  return /跋|书后|后序/.test(title)
}

function isFrontMatter(title) {
  return FRONT_MATTER_RE.test(title)
}

function splitLongParagraph(text) {
  const trimmed = text.trim()
  if (!trimmed) return []
  if (trimmed.length <= 220) return [trimmed]

  // Keep the source characters untouched; only add paragraph breaks at
  // sentence boundaries so a long classical section stays readable online.
  const sentences = trimmed.match(/[^。！？]+[。！？]?/g) ?? [trimmed]
  const paragraphs = []
  let buffer = ''
  for (const sentence of sentences) {
    if (buffer && buffer.length + sentence.length > 180) {
      paragraphs.push(buffer.trim())
      buffer = ''
    }
    buffer += sentence
  }
  if (buffer.trim()) paragraphs.push(buffer.trim())
  return paragraphs
}

function buildParagraphs(bodyLines) {
  const paragraphs = []
  let buffer = []

  const flush = () => {
    if (!buffer.length) return
    const text = buffer.join('').trim()
    if (text) paragraphs.push(...splitLongParagraph(text))
    buffer = []
  }

  for (const rawLine of bodyLines) {
    const line = rawLine.trim()
    if (!line) {
      flush()
      continue
    }

    // The source uses \x...\x to mark signature lines, formula names and
    // section subheadings. Keep the marked text, drop the control markers.
    if (line.includes('\\x')) {
      const parts = line.split('\\x')
      parts.forEach((part, index) => {
        const text = part.trim()
        if (!text) return
        if (index % 2 === 1) {
          flush()
          paragraphs.push(text)
        } else {
          buffer.push(text)
        }
      })
      continue
    }

    buffer.push(line)
  }

  flush()
  return paragraphs
}

function parseTaggedBook(book) {
  const text = fs.readFileSync(path.join(sourceDir, book.file), 'utf8')
  const lines = text.split('\n')

  let volume = ''
  let title = ''
  let body = []
  let started = false
  const sections = []

  const flush = () => {
    if (!started || !title) {
      body = []
      return
    }
    const paragraphs = buildParagraphs(body)
    sections.push({
      volume,
      title,
      paragraphs,
    })
    body = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (line.startsWith('<目录>')) {
      flush()
      started = false
      volume = normalizeVolume(line.slice(4).trim())
      continue
    }

    if (line.startsWith('<篇名>')) {
      flush()
      started = false
      title = line.slice(4).trim()
      continue
    }

    if (line.startsWith('属性：')) {
      started = true
      body.push(line.slice(3).trim())
      continue
    }

    if (started) body.push(rawLine)
  }
  flush()

  const prefaces = []
  const postscripts = []
  const frontMatter = []
  const volumeMap = new Map()

  for (const section of sections) {
    const isVolumeTitle = VOLUME_ONLY_RE.test(section.title)
    const sectionVolume = section.volume || (isVolumeTitle ? section.title : '')

    let kind = 'chapter'
    if (isPostscript(section.title)) kind = 'postscript'
    else if (isPreface(section.title)) kind = 'preface'
    else if (isFrontMatter(section.title)) kind = 'frontMatter'

    if (kind === 'preface' || kind === 'postscript' || kind === 'frontMatter') {
      const item = {
        id: '',
        title: section.title,
        volume: sectionVolume,
        kind,
        charCount: section.paragraphs.join('').length,
        paragraphs: section.paragraphs,
      }
      if (kind === 'preface') {
        item.id = `p-${String(prefaces.length + 1).padStart(2, '0')}`
        prefaces.push(item)
      } else if (kind === 'postscript') {
        item.id = `b-${String(postscripts.length + 1).padStart(2, '0')}`
        postscripts.push(item)
      } else {
        item.id = `f-${String(frontMatter.length + 1).padStart(2, '0')}`
        frontMatter.push(item)
      }
      continue
    }

    const groupTitle = sectionVolume || '正文'
    if (!volumeMap.has(groupTitle)) volumeMap.set(groupTitle, [])
    const chapters = volumeMap.get(groupTitle)
    chapters.push({
      id: `c-${String(chapters.length + 1).padStart(3, '0')}`,
      title: section.title,
      volume: groupTitle,
      kind,
      charCount: section.paragraphs.join('').length,
      paragraphs: section.paragraphs,
    })
  }

  // Chapter ids are only unique inside a volume; make them book-wide.
  let chapterIndex = 0
  const volumes = [...volumeMap.entries()].map(([volumeTitle, chapters]) => {
    for (const chapter of chapters) {
      chapterIndex += 1
      chapter.id = `c-${String(chapterIndex).padStart(3, '0')}`
    }
    return { title: volumeTitle, chapters }
  })

  const chapterCount = volumes.reduce((sum, v) => sum + v.chapters.length, 0)
  const charCount = [
    ...prefaces,
    ...postscripts,
    ...frontMatter,
    ...volumes.flatMap((v) => v.chapters),
  ].reduce((sum, item) => sum + item.charCount, 0)

  return {
    id: book.id,
    title: book.title,
    author: book.author,
    tier: book.tier,
    source: {
      file: book.file,
      note:
        book.note ??
        '据用户提供的文本整理；原文件为 GBK 编码，已转为 UTF-8。仅作阅读，未做校勘。',
    },
    prefaces,
    postscripts,
    frontMatter,
    volumes,
    stats: {
      prefaceCount: prefaces.length + postscripts.length,
      postscriptCount: postscripts.length,
      frontMatterCount: frontMatter.length,
      chapterCount,
      volumeCount: volumes.length,
      charCount,
    },
  }
}

function parseMarkdownBook(book) {
  const dir = path.join(sourceDir, book.dir)
  const files = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))

  const volume = '素问'
  const chapters = []

  for (const file of files) {
    const text = fs.readFileSync(path.join(dir, file), 'utf8')
    const lines = text.split('\n')
    const headingIndex = lines.findIndex((line) => /^##\s+/.test(line.trim()))
    if (headingIndex === -1) throw new Error(`${book.title} / ${file}: 缺少篇名标题`)
    const title = lines[headingIndex].trim().replace(/^##\s+/, '')

    const paragraphs = []
    let buffer = []

    const flush = () => {
      if (!buffer.length) return
      const value = buffer.join('').trim()
      if (value) paragraphs.push(...splitLongParagraph(value))
      buffer = []
    }

    for (const rawLine of lines.slice(headingIndex + 1)) {
      const line = rawLine.trim()
      if (!line) {
        flush()
        continue
      }
      if (/^####\s+/.test(line)) {
        flush()
        paragraphs.push(`原文：${line.replace(/^####\s+/, '')}`)
        continue
      }
      buffer.push(line)
    }
    flush()

    chapters.push({
      id: `c-${String(chapters.length + 1).padStart(3, '0')}`,
      title,
      volume,
      kind: 'chapter',
      charCount: paragraphs.join('').length,
      paragraphs,
    })
  }

  const charCount = chapters.reduce((sum, chapter) => sum + chapter.charCount, 0)

  return {
    id: book.id,
    title: book.title,
    author: book.author,
    tier: book.tier,
    source: {
      file: book.dir,
      note: book.note,
    },
    prefaces: [],
    postscripts: [],
    frontMatter: [],
    volumes: [{ title: volume, chapters }],
    stats: {
      prefaceCount: 0,
      postscriptCount: 0,
      frontMatterCount: 0,
      chapterCount: chapters.length,
      volumeCount: 1,
      charCount,
    },
  }
}

function parseShanghanParagraphs(lines) {
  const paragraphs = []
  let buffer = []
  const flush = () => {
    if (!buffer.length) return
    const value = buffer.join('').trim()
    if (value) paragraphs.push(...splitLongParagraph(value))
    buffer = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      flush()
      continue
    }
    if (line.startsWith('## ')) continue
    if (line.startsWith('#### ')) {
      flush()
      const heading = line.replace(/^####\s+/, '').trim()
      const numbered = /^[0-9一二三四五六七八九十百]+[、.:：]/.test(heading)
      const cleanHeading = heading.replace(/[（(][^）)]*[）)]\s*$/, '').trim()
      const isFormula = cleanHeading.endsWith('方') || heading.startsWith('蜜煎导法')
      paragraphs.push(`${numbered ? '原文' : isFormula ? '方' : '原文'}：${heading}`)
      continue
    }
    if (line.startsWith('>')) {
      flush()
      const value = line.replace(/^>\s*/, '').trim()
      if (value) paragraphs.push(`讲解：${value}`)
      continue
    }
    buffer.push(line)
  }
  flush()
  return paragraphs
}

function parseShanghanBook(book) {
  const dir = path.join(sourceDir, book.dir)
  const files = fs.readdirSync(dir).filter((file) => file.endsWith('.md'))
  const findFile = (prefix) => files.find((file) => file.startsWith(prefix))

  const readSection = (file, kind, volume) => {
    const text = fs.readFileSync(path.join(dir, file), 'utf8')
    const lines = text.split('\n')
    const headingIndex = lines.findIndex((line) => /^##\s+/.test(line.trim()))
    const title =
      headingIndex === -1 ? file.replace(/\.md$/, '') : lines[headingIndex].trim().replace(/^##\s+/, '')
    const paragraphs = parseShanghanParagraphs(lines.slice(headingIndex + 1))
    return {
      title,
      volume,
      kind,
      charCount: paragraphs.join('').length,
      paragraphs,
    }
  }

  const prefaces = []
  const frontMatter = []
  const volumes = [
    { title: '伤寒论', chapters: [] },
    { title: '附篇', chapters: [] },
    { title: '附录·度量衡', chapters: [] },
  ]

  const prefaceFile = findFile('1.')
  if (prefaceFile) prefaces.push(readSection(prefaceFile, 'preface', ''))
  const frontFile = findFile('2.')
  if (frontFile) frontMatter.push(readSection(frontFile, 'frontMatter', ''))

  const mainPrefixes = ['3.', '4.', '5.', '6.', '7.', '8.', '9.', '10.']
  const mainFiles = files
    .filter((file) => mainPrefixes.some((prefix) => file.startsWith(prefix)) && !file.startsWith('6.1'))
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
  for (const file of mainFiles) volumes[0].chapters.push(readSection(file, 'chapter', '伤寒论'))

  const lingxuFile = findFile('6.1')
  if (lingxuFile) volumes[1].chapters.push(readSection(lingxuFile, 'chapter', '附篇'))

  const appendixFiles = files.filter(
    (file) => !/^\d/.test(file) && file !== '6.1灵枢经-与阳明有关章节.md',
  )
  for (const file of appendixFiles) {
    volumes[2].chapters.push(readSection(file, 'chapter', '附录·度量衡'))
  }

  let chapterIndex = 0
  const allSections = [...prefaces, ...frontMatter, ...volumes.flatMap((volume) => volume.chapters)]
  for (const section of allSections) {
    chapterIndex += 1
    section.id = `c-${String(chapterIndex).padStart(3, '0')}`
  }

  const activeVolumes = volumes.filter((volume) => volume.chapters.length)
  const chapterCount = activeVolumes.reduce((sum, volume) => sum + volume.chapters.length, 0)
  const charCount = allSections.reduce((sum, section) => sum + section.charCount, 0)

  return {
    id: book.id,
    title: book.title,
    author: book.author,
    tier: book.tier,
    source: { file: book.dir, note: book.note },
    prefaces,
    postscripts: [],
    frontMatter,
    volumes: activeVolumes,
    stats: {
      prefaceCount: prefaces.length,
      postscriptCount: 0,
      frontMatterCount: frontMatter.length,
      chapterCount,
      volumeCount: activeVolumes.length,
      charCount,
    },
  }
}

export function buildClassics() {
  fs.mkdirSync(outDir, { recursive: true })
  const books = classicBooks
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((book) => {
      if (book.format === 'markdown') return parseMarkdownBook(book)
      if (book.format === 'shanghan') return parseShanghanBook(book)
      return parseTaggedBook(book)
    })

  for (const book of books) {
    fs.writeFileSync(path.join(outDir, `${book.id}.json`), JSON.stringify(book, null, 2), 'utf8')
  }

  const index = {
    generatedAt: new Date().toISOString(),
    books: books.map((book) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      tier: book.tier,
      stats: book.stats,
    })),
  }
  fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index, null, 2), 'utf8')

  console.log(
    `Wrote classics: ${books.length} books, ` +
      books.map((book) => `${book.title} ${book.stats.chapterCount} 篇`).join('，'),
  )
  return index
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildClassics()
}
