export interface RemedyScanBook {
  id: string
  title: string
  totalPages: number
  imageDir: string
  hasImages: boolean
  note: string
}

export interface RemedyScanPageRef {
  page: number
  mode: 'text' | 'section'
  score: number
}

export interface RemedyScanIndex {
  books: RemedyScanBook[]
  remedyPages: Record<string, RemedyScanPageRef>
}

export interface RemedyScanPage {
  page: number
  text: string
}

export interface RemedyScanBookData {
  book: RemedyScanBook
  pages: RemedyScanPage[]
  remedyPages: Record<string, RemedyScanPageRef>
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')
let indexPromise: Promise<RemedyScanIndex> | null = null
const bookPromises = new Map<string, Promise<RemedyScanBookData>>()

async function request<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`扫描页数据读取失败：HTTP ${response.status}`)
  return (await response.json()) as T
}

export function fetchScanIndex() {
  if (!indexPromise) {
    indexPromise = request<RemedyScanIndex>(`${BASE}/data/remedy-scans/index.json`).catch((error) => {
      indexPromise = null
      throw error
    })
  }
  return indexPromise
}

export function fetchScanBook(bookId: string) {
  const cached = bookPromises.get(bookId)
  if (cached) return cached
  const promise = request<RemedyScanBookData>(
    `${BASE}/data/remedy-scans/${bookId}.json`,
  ).catch((error) => {
    bookPromises.delete(bookId)
    throw error
  })
  bookPromises.set(bookId, promise)
  return promise
}

export function scanImagePath(bookId: string, page: number) {
  return `${BASE}/images/remedy-scans/${bookId}/${String(page).padStart(4, '0')}.webp`
}
