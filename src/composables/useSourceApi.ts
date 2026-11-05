import type { Citation } from '@/types/tcm'
import { registerCitations } from './useTcmData'

const API_BASE = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`
const cache = new Map<string, Citation>()
const pending = new Map<string, Promise<void>>()

/**
 * 列表页只拿压缩过的出处；打开引用抽屉时再补全 quote/note 等字段。
 */
export async function fetchSources(ids: string[]): Promise<void> {
  const missing = [...new Set(ids)].filter((id) => id && !cache.has(id))
  if (!missing.length) return

  const key = missing.sort().join(',')
  const running = pending.get(key)
  if (running) return running

  const task = (async () => {
    try {
      const response = await fetch(`${API_BASE}/sources?ids=${encodeURIComponent(key)}`, {
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const list = (await response.json()) as Citation[]
      for (const citation of list) {
        if (citation?.id) cache.set(citation.id, citation)
      }
      registerCitations(list)
    } finally {
      pending.delete(key)
    }
  })()
  pending.set(key, task)
  return task
}
