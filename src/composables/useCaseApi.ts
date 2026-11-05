import { ref } from 'vue'
import type { CaseItem, CaseSummary } from '@/types/cases'

const API_BASE = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`

let listPromise: Promise<CaseSummary[]> | null = null
const detailPromises = new Map<string, Promise<CaseItem>>()

async function requestJson<T>(path: string, label: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    const hint =
      response.status === 404
        ? '没有找到这则医案'
        : response.status === 503
          ? '数据服务未就绪'
          : `HTTP ${response.status}`
    throw new Error(`${label}加载失败：${hint}`)
  }
  return (await response.json()) as T
}

export function fetchCaseList(): Promise<CaseSummary[]> {
  if (!listPromise) {
    listPromise = requestJson<CaseSummary[]>('/cases', '医案目录').catch((error) => {
      listPromise = null
      throw error
    })
  }
  return listPromise
}

export function fetchCaseDetail(id: string): Promise<CaseItem> {
  const cached = detailPromises.get(id)
  if (cached) return cached
  const promise = requestJson<CaseItem>(`/cases/${encodeURIComponent(id)}`, '医案').catch(
    (error) => {
      detailPromises.delete(id)
      throw error
    },
  )
  detailPromises.set(id, promise)
  return promise
}

export function useCaseApi() {
  const loading = ref(true)
  const error = ref('')

  async function fetchCases() {
    loading.value = true
    error.value = ''
    try {
      return await fetchCaseList()
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '医案目录加载失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchCase(id: string) {
    loading.value = true
    error.value = ''
    try {
      return await fetchCaseDetail(id)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '医案加载失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return { loading, error, fetchCases, fetchCase }
}
