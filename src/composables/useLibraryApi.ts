import { ref } from 'vue'

export interface LibrarySubcategory {
  key: string
  label: string
  count: number
}

export interface LibraryCategory {
  key: string
  label: string
  description: string
  count: number
  subs: LibrarySubcategory[]
}

export interface LibrarySource {
  dir?: string
  totalFiles?: number
  totalBooks?: number
  excluded?: string[]
  chars?: number
}

export interface LibraryIndexPayload {
  categories: LibraryCategory[]
  source: LibrarySource
  total: number
}

export interface LibraryBookSummary {
  id: string
  title: string
  author: string
  dynasty: string
  category: string
  subcategory: string
  charCount: number
  sectionCount: number
  duplicateOf: string
  versionNote: string
}

export interface LibraryBookListPayload {
  total: number
  page: number
  limit: number
  pages: number
  books: LibraryBookSummary[]
}

export interface LibrarySectionSummary {
  id: string
  title: string
  kind: string
  charCount: number
}

export interface LibraryBookDetail extends LibraryBookSummary {
  source: {
    daizhige?: string
    github?: string
    lastmod?: string
    note?: string
  }
  sections: LibrarySectionSummary[]
}

export interface LibrarySectionDetail {
  id: string
  title: string
  kind: string
  charCount: number
  paragraphs: string[]
}

export interface LibrarySectionPayload {
  book: Pick<
    LibraryBookDetail,
    'id' | 'title' | 'author' | 'source' | 'duplicateOf' | 'versionNote'
  >
  section: LibrarySectionDetail
  prev: { id: string; title: string } | null
  next: { id: string; title: string } | null
}

const API_BASE = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`

let indexPromise: Promise<LibraryIndexPayload> | null = null
const listPromises = new Map<string, Promise<LibraryBookListPayload>>()
const bookPromises = new Map<string, Promise<LibraryBookDetail>>()
const sectionPromises = new Map<string, Promise<LibrarySectionPayload>>()

async function request<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (response.status === 404) throw new Error('没有找到这本书')
  if (response.status === 503) throw new Error('医藏书库尚未就绪')
  if (!response.ok) throw new Error(`医藏书库读取失败：HTTP ${response.status}`)
  return (await response.json()) as T
}

export function fetchLibraryIndex() {
  if (!indexPromise) {
    indexPromise = request<LibraryIndexPayload>(`${API_BASE}/library`).catch((error) => {
      indexPromise = null
      throw error
    })
  }
  return indexPromise
}

export function fetchLibraryBooks(params: {
  category?: string
  subcategory?: string
  q?: string
  page?: number
  limit?: number
}) {
  const search = new URLSearchParams()
  if (params.category) search.set('category', params.category)
  if (params.subcategory) search.set('subcategory', params.subcategory)
  if (params.q) search.set('q', params.q)
  search.set('page', String(params.page ?? 1))
  search.set('limit', String(params.limit ?? 48))
  const key = search.toString()
  const cached = listPromises.get(key)
  if (cached) return cached
  const promise = request<LibraryBookListPayload>(`${API_BASE}/library/books?${key}`).catch(
    (error) => {
      listPromises.delete(key)
      throw error
    },
  )
  listPromises.set(key, promise)
  return promise
}

export function fetchLibraryBook(id: string) {
  const cached = bookPromises.get(id)
  if (cached) return cached
  const promise = request<LibraryBookDetail>(
    `${API_BASE}/library/books/${encodeURIComponent(id)}`,
  ).catch((error) => {
    bookPromises.delete(id)
    throw error
  })
  bookPromises.set(id, promise)
  return promise
}

export function fetchLibrarySection(bookId: string, sectionId: string) {
  const key = `${bookId}/${sectionId}`
  const cached = sectionPromises.get(key)
  if (cached) return cached
  const promise = request<LibrarySectionPayload>(
    `${API_BASE}/library/books/${encodeURIComponent(bookId)}/sections/${encodeURIComponent(sectionId)}`,
  ).catch((error) => {
    sectionPromises.delete(key)
    throw error
  })
  sectionPromises.set(key, promise)
  return promise
}

export function useLibraryApi() {
  const loading = ref(false)
  const error = ref('')

  async function run<T>(task: () => Promise<T>) {
    loading.value = true
    error.value = ''
    try {
      return await task()
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : '医藏书库读取失败'
      throw reason
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchLibraryIndex: () => run(fetchLibraryIndex),
    fetchLibraryBooks: (params: Parameters<typeof fetchLibraryBooks>[0]) =>
      run(() => fetchLibraryBooks(params)),
    fetchLibraryBook: (id: string) => run(() => fetchLibraryBook(id)),
    fetchLibrarySection: (bookId: string, sectionId: string) =>
      run(() => fetchLibrarySection(bookId, sectionId)),
  }
}
