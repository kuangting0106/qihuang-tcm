import type {
  ClassicBook,
  ClassicLibraryIndex,
  ClassicSection,
  ClassicVolume,
} from '@/types/classics'

const base = import.meta.env.BASE_URL
let indexPromise: Promise<ClassicLibraryIndex> | null = null
const bookPromises = new Map<string, Promise<ClassicBook>>()

export function loadClassicIndex(): Promise<ClassicLibraryIndex> {
  if (!indexPromise) {
    indexPromise = fetch(`${base}data/classics/index.json`).then(async (res) => {
      if (!res.ok) throw new Error(`古籍目录加载失败：HTTP ${res.status}`)
      return (await res.json()) as ClassicLibraryIndex
    })
  }
  return indexPromise
}

export function loadClassicBook(id: string): Promise<ClassicBook> {
  const cached = bookPromises.get(id)
  if (cached) return cached

  const promise = fetch(`${base}data/classics/${id}.json`).then(async (res) => {
    if (!res.ok) throw new Error(`古籍原文加载失败：HTTP ${res.status}`)
    return (await res.json()) as ClassicBook
  })
  bookPromises.set(id, promise)
  return promise
}

export function allClassicSections(book: ClassicBook): ClassicSection[] {
  return [
    ...book.prefaces,
    ...book.frontMatter,
    ...book.volumes.flatMap((volume) => volume.chapters),
    ...book.postscripts,
  ]
}

export function findClassicSection(book: ClassicBook, id: string): ClassicSection | undefined {
  return allClassicSections(book).find((section) => section.id === id)
}

export function classicSectionGroup(book: ClassicBook, section: ClassicSection): ClassicVolume {
  return (
    book.volumes.find((volume) => volume.chapters.some((chapter) => chapter.id === section.id)) ?? {
      title:
        section.kind === 'preface' ? '序' : section.kind === 'postscript' ? '跋' : '卷前',
      chapters: [],
    }
  )
}

export function formatCharCount(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)} 万字`
  return `${count} 字`
}
