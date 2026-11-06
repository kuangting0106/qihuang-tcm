import path from 'node:path'

export const VERSION_PLAN = {
  'lib-b7c1ca0a6e': {
    drop: ['lib-861e400eed'],
    note: '已与旧版《傅青主女科》比对：正文基本一致，保留本整理本，删除旧版。',
  },
  'lib-3ba9489cc2': {
    drop: ['lib-103af38ffc'],
    note: '已与旧版《难经经释》比对：正文基本一致，保留本整理本，删除旧版。',
  },
  'lib-caaca999fc': {
    drop: ['lib-9140183bca'],
    note: '已与旧版《鬼门十三针》比对：正文基本一致，保留本整理本，删除旧版。',
  },
  'lib-07836920ed': {
    merge: ['lib-52d3517498'],
    note: '已与旧版《傅青主男科》比对：两版内容不同，已合并旧版独有段落并去除重复。',
  },
  'lib-e93d78dbe5': {
    merge: ['lib-afacfb011b'],
    note: '已与旧版《青囊秘诀》比对：两版内容不同，已合并旧版独有段落并去除重复。',
  },
  'lib-47b843b08a': {
    merge: ['lib-5941e9b929', 'lib-3facc171d7'],
    note: '已与两个旧版《扁鹊神应针灸玉龙经》比对：三版内容不同，已合并旧版独有段落并去除重复。',
  },
}

const PUNCT_RE = /[\s\u3000，。；：、！？《》〈〉“”‘’（）()【】\[\]·—…,.!?;:'"<>/\\|-]/g

function normalizeText(text) {
  return String(text ?? '').replace(PUNCT_RE, '')
}

function shingleSet(text, size = 8) {
  const clean = normalizeText(text)
  const set = new Set()
  if (!clean) return set
  if (clean.length <= size) {
    set.add(clean)
    return set
  }
  for (let i = 0; i <= clean.length - size; i += 1) set.add(clean.slice(i, i + size))
  return set
}

export function applyVersionPlan({ books, sectionMap, parseBook, splitIntoSections, sourceDir }) {
  const byId = new Map(books.map((book) => [book.id, book]))
  const mergedSections = new Map()
  const dropIds = new Set()

  for (const [keepId, plan] of Object.entries(VERSION_PLAN)) {
    const keep = byId.get(keepId)
    if (!keep) continue
    for (const id of plan.drop ?? []) dropIds.add(id)
    if (!plan.merge?.length) continue

    const base = sectionMap.get(keepId) ?? []
    const merged = base.map((section) => ({
      ...section,
      paragraphs: [...section.paragraphs],
    }))
    const seenParagraphs = new Set()
    const knownShingles = new Set()

    for (const section of merged) {
      for (const paragraph of section.paragraphs) {
        seenParagraphs.add(normalizeText(paragraph))
        for (const shingle of shingleSet(paragraph)) knownShingles.add(shingle)
      }
    }

    let addedChars = 0
    for (const oldId of plan.merge) {
      const oldBook = byId.get(oldId)
      if (!oldBook) continue
      dropIds.add(oldId)
      const parsed = parseBook(path.join(sourceDir, oldBook.file))
      const oldSections = splitIntoSections(parsed)
      for (const oldSection of oldSections) {
        const paragraphs = []
        for (const paragraph of oldSection.paragraphs) {
          const key = normalizeText(paragraph)
          if (key.length < 10 || seenParagraphs.has(key)) continue
          const shingles = shingleSet(paragraph)
          let hit = 0
          for (const shingle of shingles) {
            if (knownShingles.has(shingle)) hit += 1
          }
          if (shingles.size && hit / shingles.size >= 0.72) continue
          paragraphs.push(paragraph)
          seenParagraphs.add(key)
          for (const shingle of shingles) knownShingles.add(shingle)
        }
        const text = paragraphs.join('')
        if (text.length < 20) continue
        merged.push({
          title: `旧版补录 · ${oldSection.title}`,
          kind: 'chapter',
          paragraphs,
          charCount: text.length,
        })
        addedChars += text.length
      }
    }

    merged.forEach((section, index) => {
      section.id = `s-${String(index + 1).padStart(4, '0')}`
      section.sortOrder = index + 1
    })
    mergedSections.set(keepId, merged)
    keep.sectionCount = merged.length
    keep.charCount = (keep.charCount ?? 0) + addedChars
    keep.versionNote = [keep.versionNote, plan.note].filter(Boolean).join(' ')
  }

  for (let index = books.length - 1; index >= 0; index -= 1) {
    if (dropIds.has(books[index].id)) books.splice(index, 1)
  }

  return mergedSections
}
