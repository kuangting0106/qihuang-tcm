import { ref } from 'vue'
import type { Citation, Formula, FormulaRole, Herb } from '@/types/tcm'
import { registerCitations, registerHerbs } from './useTcmData'

const API_BASE = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`

export interface FormulaSummaryComposition {
  herbId: string
  herbName?: string
  dose?: string
  role?: FormulaRole
}

export interface FormulaSummary {
  id: string
  name: string
  pinyin: string
  sourceCitationId: string
  effectsText: string
  composition: FormulaSummaryComposition[]
  herbCount: number
  symptomTags: string[]
  sourceCitation?: Citation | null
}

export interface FormulaDetail extends Formula {
  citations: Citation[]
  herbs: Record<string, Herb>
}

let listCache: FormulaSummary[] | null = null
const detailCache = new Map<string, FormulaDetail>()

async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    const hint = response.status === 503 ? '数据服务未就绪' : `HTTP ${response.status}`
    throw new Error(`数据加载失败：${hint}`)
  }
  return (await response.json()) as T
}

function rememberCitations(list: FormulaSummary[]) {
  registerCitations(
    list
      .map((item) => item.sourceCitation)
      .filter((item): item is Citation => Boolean(item)),
  )
}

export function useFormulaApi() {
  const loading = ref(true)
  const error = ref('')

  async function fetchFormulaList(q = ''): Promise<FormulaSummary[]> {
    loading.value = true
    error.value = ''
    try {
      if (!q.trim() && listCache) return listCache
      const query = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''
      const list = await requestJson<FormulaSummary[]>(`/formulas${query}`)
      rememberCitations(list)
      if (!q.trim()) listCache = list
      return list
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '方剂目录加载失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchFormulaDetail(id: string): Promise<FormulaDetail> {
    loading.value = true
    error.value = ''
    try {
      const cached = detailCache.get(id)
      if (cached) {
        registerCitations(cached.citations)
        registerHerbs(cached.herbs)
        return cached
      }
      const detail = await requestJson<FormulaDetail>(`/formulas/${encodeURIComponent(id)}`)
      registerCitations(detail.citations)
      registerHerbs(detail.herbs)
      detailCache.set(id, detail)
      return detail
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '方剂详情加载失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return { loading, error, fetchFormulaList, fetchFormulaDetail }
}
