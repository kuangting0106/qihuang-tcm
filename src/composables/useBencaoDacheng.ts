import type { BencaoDachengEntry, BencaoDachengIndex } from '@/types/bencao-dacheng'

const INDEX_URL = '/data/bencao-dacheng/index.json'
const ENTRY_URL = (id: string) => `/data/bencao-dacheng/entries/${id}.json`

let indexCache: BencaoDachengIndex | null = null
let indexPromise: Promise<BencaoDachengIndex> | null = null
const entryCache = new Map<string, BencaoDachengEntry>()

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-cache' })
  if (!response.ok) throw new Error(`数据读取失败：${response.status}`)
  return (await response.json()) as T
}

export function loadBencaoDachengIndex(force = false): Promise<BencaoDachengIndex> {
  if (force) {
    indexCache = null
    indexPromise = null
  }
  if (indexCache) return Promise.resolve(indexCache)
  if (!indexPromise) {
    indexPromise = fetchJson<BencaoDachengIndex>(INDEX_URL)
      .then((data) => {
        indexCache = data
        return data
      })
      .catch((error) => {
        indexPromise = null
        throw error
      })
  }
  return indexPromise
}

export async function loadBencaoDachengEntry(id: string): Promise<BencaoDachengEntry> {
  const cached = entryCache.get(id)
  if (cached) return cached
  const entry = await fetchJson<BencaoDachengEntry>(ENTRY_URL(id))
  entryCache.set(id, entry)
  return entry
}

export function useBencaoDacheng() {
  return {
    loadBencaoDachengIndex,
    loadBencaoDachengEntry,
  }
}
