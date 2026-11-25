export type RemedySafetyLevel = 'high' | 'medium' | 'low'

export interface RemedyListItem {
  id: string
  title: string
  category: string
  subcategory: string
  era: string
  book: string
  dynasty: string
  safetyLevel: RemedySafetyLevel
  indications: string
  formula: string
  usage: string
  section: string
}

export interface RemedyListPayload {
  total: number
  page: number
  pageSize: number
  pages: number
  items: RemedyListItem[]
}

export interface RemedyMeta {
  total: number
  categories: Array<{ name: string; count: number }>
  eras: Array<{ name: string; count: number }>
  safety: Array<{ level: RemedySafetyLevel; label: string; count: number }>
}

export interface RemedyDetail extends RemedyListItem {
  eraRank: number
  duplicateOf: string
  raw: string
  origin: string
  author: string
  year: string
  chapter: string
  cautions: string
  appendix: string
  source: string
  sourceNote: string
  toxicTags: string[]
  groupKey: string
}

const API_BASE = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`

let metaPromise: Promise<RemedyMeta> | null = null
const listPromises = new Map<string, Promise<RemedyListPayload>>()
const detailPromises = new Map<string, Promise<RemedyDetail>>()

async function request<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (response.status === 404) throw new Error('没有找到这条偏方')
  if (response.status === 503) throw new Error('偏方数据尚未就绪')
  if (!response.ok) throw new Error(`偏方数据读取失败：HTTP ${response.status}`)
  return (await response.json()) as T
}

export function fetchRemedyMeta() {
  if (!metaPromise) {
    metaPromise = request<RemedyMeta>(`${API_BASE}/remedies/meta`).catch((error) => {
      metaPromise = null
      throw error
    })
  }
  return metaPromise
}

export function fetchRemedies(params: {
  q?: string
  category?: string
  era?: string
  safety?: string
  page?: number
  pageSize?: number
}) {
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.category) search.set('category', params.category)
  if (params.era) search.set('era', params.era)
  if (params.safety) search.set('safety', params.safety)
  if (params.page) search.set('page', String(params.page))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))
  const url = `${API_BASE}/remedies?${search.toString()}`
  const cached = listPromises.get(url)
  if (cached) return cached
  const promise = request<RemedyListPayload>(url).catch((error) => {
    listPromises.delete(url)
    throw error
  })
  listPromises.set(url, promise)
  return promise
}

export function fetchRemedy(id: string) {
  const cached = detailPromises.get(id)
  if (cached) return cached
  const promise = request<RemedyDetail>(`${API_BASE}/remedies/${encodeURIComponent(id)}`).catch(
    (error) => {
      detailPromises.delete(id)
      throw error
    },
  )
  detailPromises.set(id, promise)
  return promise
}

export function safetyLabel(level: RemedySafetyLevel) {
  return level === 'high' ? '高风险' : level === 'medium' ? '需谨慎' : '一般'
}
