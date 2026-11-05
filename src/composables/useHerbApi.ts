import { ref } from 'vue'
import type {
  Citation,
  Herb,
  HerbClassicRank,
  HerbPrinciples,
  HerbTaxonomy,
  HerbTherapyCategory,
} from '@/types/tcm'
import type { BencaoCatalogItem } from '@/types/bencao'
import { registerCitations } from './useTcmData'

const API_BASE = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`

export interface HerbSummary {
  id: string
  name: string
  pinyin: string
  aliases: string[]
  ancientName: string
  flavorTags: string[]
  meridianIds: string[]
  classicRankId: string | null
  therapyCategoryIds: string[]
  effectsText: string
  indicationsText: string
  cover?: string
  coverAlt?: string
}

export interface HerbLectureSearchItem {
  key: string
  name: string
  pinyin: string
  aliases: string[]
  ancientName: string
  alsoKnownAs: string[]
  groupId: string
  entryId: string
  rankId: string
  therapyCategoryIds: string[]
  curatedId?: string
}

export interface HerbSearchIndexPayload {
  herbs: HerbSummary[]
  lectures: HerbLectureSearchItem[]
}

export interface HerbRankMeta extends HerbClassicRank {
  count: number
  preview: string[]
}

export interface HerbCategoryMeta extends HerbTherapyCategory {
  count: number
  preview: string[]
}

export interface HerbMetaTaxonomy
  extends Omit<HerbTaxonomy, 'ranks' | 'categories'> {
  ranks: HerbRankMeta[]
  categories: HerbCategoryMeta[]
}

export interface HerbMetaPayload {
  taxonomy: HerbMetaTaxonomy
  principles: HerbPrinciples | null
  counts: {
    herbs: number
    lectureItems: number
    lectureEntries: number
    lectureChars: number
    formulas: number
  }
}

export interface HerbCollectionItem {
  id: string
  name: string
  pinyin: string
  flavors: string[]
  meridians: string[]
  effects: string
  href: string
  cover?: string
  coverAlt?: string
  seal: string
  badge: string
  source: string
}

export interface HerbCollectionPayload {
  kind: 'rank' | 'category'
  key: string
  title: string
  subtitle: string
  description: string
  count: number
  items: HerbCollectionItem[]
}

export type HerbLectureItem = Pick<
  BencaoCatalogItem,
  'key' | 'name' | 'groupId' | 'entryId' | 'charCount'
>

export interface HerbDetailPayload extends Herb {
  taxonomy: HerbTaxonomy | null
  meridians: Array<{ id: string; name: string }>
  lecture: HerbLectureItem | null
  pairingHerbs: Record<string, { id: string; name: string }>
  citations: Citation[]
}

async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    const hint =
      response.status === 404
        ? '没有找到这条记录'
        : response.status === 503
          ? '数据服务未就绪'
          : `HTTP ${response.status}`
    throw new Error(`本草数据加载失败：${hint}`)
  }
  return (await response.json()) as T
}

let metaPromise: Promise<HerbMetaPayload> | null = null
let searchIndexPromise: Promise<HerbSearchIndexPayload> | null = null
const collectionPromises = new Map<string, Promise<HerbCollectionPayload>>()
const detailPromises = new Map<string, Promise<HerbDetailPayload>>()

function fetchMeta(): Promise<HerbMetaPayload> {
  if (!metaPromise) {
    metaPromise = requestJson<HerbMetaPayload>('/herbs/meta').catch((error) => {
      metaPromise = null
      throw error
    })
  }
  return metaPromise
}

function fetchSearchIndex(): Promise<HerbSearchIndexPayload> {
  if (!searchIndexPromise) {
    searchIndexPromise = requestJson<HerbSearchIndexPayload>('/herbs/search-index').catch(
      (error) => {
        searchIndexPromise = null
        throw error
      },
    )
  }
  return searchIndexPromise
}

function fetchCollection(
  kind: 'rank' | 'category',
  key: string,
): Promise<HerbCollectionPayload> {
  const cacheKey = `${kind}:${key}`
  const cached = collectionPromises.get(cacheKey)
  if (cached) return cached
  const promise = requestJson<HerbCollectionPayload>(
    `/herbs/collection/${kind}/${encodeURIComponent(key)}`,
  ).catch((error) => {
    collectionPromises.delete(cacheKey)
    throw error
  })
  collectionPromises.set(cacheKey, promise)
  return promise
}

function fetchDetail(id: string): Promise<HerbDetailPayload> {
  const cached = detailPromises.get(id)
  if (cached) return cached
  const promise = requestJson<HerbDetailPayload>(
    `/herbs/${encodeURIComponent(id)}`,
  )
    .then((detail) => {
      registerCitations(detail.citations)
      return detail
    })
    .catch((error) => {
      detailPromises.delete(id)
      throw error
    })
  detailPromises.set(id, promise)
  return promise
}

export function useHerbApi() {
  const loading = ref(true)
  const error = ref('')

  async function fetchHerbMeta() {
    loading.value = true
    error.value = ''
    try {
      return await fetchMeta()
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '本草索引加载失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchHerbSearchIndex() {
    loading.value = true
    error.value = ''
    try {
      return await fetchSearchIndex()
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '本草索引加载失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchHerbCollection(kind: 'rank' | 'category', key: string) {
    loading.value = true
    error.value = ''
    try {
      return await fetchCollection(kind, key)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '分类列表加载失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchHerbDetail(id: string) {
    loading.value = true
    error.value = ''
    try {
      return await fetchDetail(id)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '药材详情加载失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchHerbMeta,
    fetchHerbSearchIndex,
    fetchHerbCollection,
    fetchHerbDetail,
  }
}
