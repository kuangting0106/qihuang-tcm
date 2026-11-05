import type {
  ClassicBook,
  ClassicLibraryIndex,
  ClassicSection,
  ClassicVolume,
} from '@/types/classics'
import type { Citation } from '@/types/tcm'

const API_BASE = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`

export interface ClassicCatalogPayload {
  index: ClassicLibraryIndex
  works: Citation[]
}

export interface ClassicSectionPayload {
  book: Pick<ClassicBook, 'id' | 'title' | 'author' | 'source' | 'stats'>
  section: ClassicSection
  sections: Array<Pick<ClassicSection, 'id' | 'title'>>
}

let catalogPromise: Promise<ClassicCatalogPayload> | null = null
const bookPromises = new Map<string, Promise<ClassicBook>>()
const sectionPromises = new Map<string, Promise<ClassicSectionPayload>>()

function request<T>(path: string, label: string): Promise<T> {
  return fetch(`${API_BASE}${path}`, { headers: { Accept: 'application/json' } }).then(
    async (response) => {
      if (!response.ok) {
        const hint =
          response.status === 404
            ? '没有找到这条记录'
            : response.status === 503
              ? '数据服务未就绪'
              : `HTTP ${response.status}`
        throw new Error(`${label}加载失败：${hint}`)
      }
      return (await response.json()) as T
    },
  )
}

export function loadClassicCatalog(): Promise<ClassicCatalogPayload> {
  if (!catalogPromise) {
    catalogPromise = request<ClassicCatalogPayload>('/classics', '古籍目录').catch((error) => {
      catalogPromise = null
      throw error
    })
  }
  return catalogPromise
}

export function loadClassicIndex(): Promise<ClassicLibraryIndex> {
  return loadClassicCatalog().then((payload) => payload.index)
}

export function loadClassicBook(id: string): Promise<ClassicBook> {
  const cached = bookPromises.get(id)
  if (cached) return cached

  const promise = request<ClassicBook>(`/classics/${encodeURIComponent(id)}`, '古籍原文').catch(
    (error) => {
      bookPromises.delete(id)
      throw error
    },
  )
  bookPromises.set(id, promise)
  return promise
}

export function loadClassicSection(
  bookId: string,
  sectionId: string,
): Promise<ClassicSectionPayload> {
  const cacheKey = `${bookId}:${sectionId}`
  const cached = sectionPromises.get(cacheKey)
  if (cached) return cached

  const promise = request<ClassicSectionPayload>(
    `/classics/${encodeURIComponent(bookId)}/sections/${encodeURIComponent(sectionId)}`,
    '古籍篇章',
  ).catch((error) => {
    sectionPromises.delete(cacheKey)
    throw error
  })
  sectionPromises.set(cacheKey, promise)
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
