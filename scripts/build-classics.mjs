import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { classicBooks } from './content/classics.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = path.join(root, 'scripts', 'content', 'classics')
const outDir = path.join(root, 'public', 'data', 'classics')

const PREFACE_RE = /序|跋/
const FRONT_MATTER_RE = /凡例|例言|校勘|目录/
const VOLUME_ONLY_RE = /^卷[一二三四五六七八九十百]+(?:[（(][^）)]*[）)])?$/

function normalizeVolume(value) {
  return value.replace(/\\/g, ' · ').trim()
}

function isPreface(title) {
  return PREFACE_RE.test(title)
}

function isPostscript(title) {
  return /跋/.test(title)
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

function parseBook(book) {
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
    source: {
      file: book.file,
      note: '据用户提供的文本整理；原文件为 GBK 编码，已转为 UTF-8。仅作阅读，未做校勘。',
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

export function buildClassics() {
  fs.mkdirSync(outDir, { recursive: true })
  const books = classicBooks
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((book) => parseBook(book))

  for (const book of books) {
    fs.writeFileSync(path.join(outDir, `${book.id}.json`), JSON.stringify(book, null, 2), 'utf8')
  }

  const index = {
    generatedAt: new Date().toISOString(),
    books: books.map((book) => ({
      id: book.id,
      title: book.title,
      author: book.author,
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
