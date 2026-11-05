import { ref } from 'vue'
import type { Acupoint, Citation, Meridian } from '@/types/tcm'
import { registerCitations } from './useTcmData'

const API_BASE = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`

export interface MeridianDataPayload {
  meridians: Meridian[]
  acupoints: Acupoint[]
  citations: Citation[]
}

let meridianPromise: Promise<MeridianDataPayload> | null = null

export function fetchMeridianData(): Promise<MeridianDataPayload> {
  if (meridianPromise) return meridianPromise
  meridianPromise = fetch(`${API_BASE}/meridians`, {
    headers: { Accept: 'application/json' },
  })
    .then(async (response) => {
      if (!response.ok) {
        const hint = response.status === 503 ? '数据服务未就绪' : `HTTP ${response.status}`
        throw new Error(`经络数据加载失败：${hint}`)
      }
      return (await response.json()) as MeridianDataPayload
    })
    .then((payload) => {
      registerCitations(payload.citations ?? [])
      return payload
    })
    .catch((error) => {
      meridianPromise = null
      throw error
    })
  return meridianPromise
}

export function useMeridianApi() {
  const loading = ref(true)
  const error = ref('')

  async function fetchMeridians() {
    loading.value = true
    error.value = ''
    try {
      return await fetchMeridianData()
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '经络数据加载失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return { loading, error, fetchMeridians }
}
