import { ref } from 'vue'
import type {
  BencaoEntry,
  BencaoGroupMeta,
  BencaoLectureIndex,
} from '@/types/bencao'
import type { HerbTaxonomy } from '@/types/tcm'

const API_BASE = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`

export interface BencaoIndexPayload extends BencaoLectureIndex {
  groups: BencaoGroupMeta[]
  taxonomy?: HerbTaxonomy | null
}

export interface BencaoEntrySummary {
  id: string
  groupId: string
  number: number | null
  title: string
  subtitle: string
  pinyin: string
  summary: string
  note: string
  alsoKnownAs: string[]
  charCount: number
  sectionCount: number
}

export interface BencaoGroupPayload {
  id: string
  title: string
  subtitle: string
  description: string
  entries: BencaoEntrySummary[]
}

async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    const hint = response.status === 404 ? '没有找到这条记录' : `HTTP ${response.status}`
    throw new Error(`讲义加载失败：${hint}`)
  }
  return (await response.json()) as T
}

let indexPromise: Promise<BencaoIndexPayload> | null = null
const groupPromises = new Map<string, Promise<BencaoGroupPayload>>()
const entryPromises = new Map<string, Promise<BencaoEntry>>()

function fetchIndex(): Promise<BencaoIndexPayload> {
  if (!indexPromise) {
    indexPromise = requestJson<BencaoIndexPayload>('/bencao').catch((error) => {
      indexPromise = null
      throw error
    })
  }
  return indexPromise
}

function fetchGroup(groupId: string): Promise<BencaoGroupPayload> {
  const cached = groupPromises.get(groupId)
  if (cached) return cached
  const promise = requestJson<BencaoGroupPayload>(
    `/bencao/${encodeURIComponent(groupId)}`,
  ).catch((error) => {
    groupPromises.delete(groupId)
    throw error
  })
  groupPromises.set(groupId, promise)
  return promise
}

function fetchEntry(entryId: string): Promise<BencaoEntry> {
  const cached = entryPromises.get(entryId)
  if (cached) return cached
  const promise = requestJson<BencaoEntry>(
    `/bencao/entry/${encodeURIComponent(entryId)}`,
  ).catch((error) => {
    entryPromises.delete(entryId)
    throw error
  })
  entryPromises.set(entryId, promise)
  return promise
}

export function useBencaoApi() {
  const loading = ref(true)
  const error = ref('')

  async function fetchBencaoIndex() {
    loading.value = true
    error.value = ''
    try {
      return await fetchIndex()
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '讲义目录加载失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchBencaoGroup(groupId: string) {
    loading.value = true
    error.value = ''
    try {
      return await fetchGroup(groupId)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '讲义目录加载失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchBencaoEntry(entryId: string) {
    loading.value = true
    error.value = ''
    try {
      return await fetchEntry(entryId)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '讲义正文加载失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return { loading, error, fetchBencaoIndex, fetchBencaoGroup, fetchBencaoEntry }
}
