import { computed, ref, shallowRef } from 'vue'
import type { Acupoint, Citation, Formula, Herb, Meridian, TcmData } from '@/types/tcm'

const data = shallowRef<TcmData | null>(null)
const loading = ref(true)
const error = ref('')
let loadPromise: Promise<TcmData> | null = null

/**
 * API 按需返回的药材/出处，合并进 useTcmData 的查找表。
 * 这样 CitationBadge、FormulaGraph 等既有组件不必感知数据来自 JSON 还是 SQLite。
 */
const apiHerbs = shallowRef<Map<string, Herb>>(new Map())
const apiCitations = shallowRef<Map<string, Citation>>(new Map())

export function registerHerbs(source: Herb[] | Record<string, Herb> | null | undefined) {
  if (!source) return
  const list = Array.isArray(source) ? source : Object.values(source)
  if (!list.length) return
  const next = new Map(apiHerbs.value)
  for (const herb of list) {
    if (herb?.id) next.set(herb.id, herb)
  }
  apiHerbs.value = next
}

export function registerCitations(
  source: Citation[] | Record<string, Citation> | null | undefined,
) {
  if (!source) return
  const list = Array.isArray(source) ? source : Object.values(source)
  if (!list.length) return
  const next = new Map(apiCitations.value)
  for (const citation of list) {
    if (citation?.id) next.set(citation.id, citation)
  }
  apiCitations.value = next
}

export function loadTcmData(): Promise<TcmData> {
  if (data.value) return Promise.resolve(data.value)
  if (loadPromise) return loadPromise
  loading.value = true
  error.value = ''
  loadPromise = fetch(`${import.meta.env.BASE_URL}data/sample_data.json`)
    .then(async (res) => {
      if (!res.ok) throw new Error(`数据加载失败：HTTP ${res.status}`)
      return (await res.json()) as TcmData
    })
    .then((json) => {
      data.value = json
      loading.value = false
      return json
    })
    .catch((err: unknown) => {
      loading.value = false
      error.value = err instanceof Error ? err.message : '数据加载失败'
      loadPromise = null
      throw err
    })
  return loadPromise
}

export function useTcmData() {
  const herbsById = computed<Map<string, Herb>>(() => {
    const map = new Map(apiHerbs.value)
    for (const herb of data.value?.herbs ?? []) map.set(herb.id, herb)
    return map
  })
  const formulasById = computed<Map<string, Formula>>(
    () => new Map((data.value?.formulas ?? []).map((f) => [f.id, f])),
  )
  const meridiansById = computed<Map<string, Meridian>>(
    () => new Map((data.value?.meridians ?? []).map((m) => [m.id, m])),
  )
  const acupointsById = computed<Map<string, Acupoint>>(
    () => new Map((data.value?.acupoints ?? []).map((p) => [p.id, p])),
  )
  const citationsById = computed<Map<string, Citation>>(() => {
    const map = new Map(apiCitations.value)
    for (const source of data.value?.sources ?? []) map.set(source.id, source)
    return map
  })

  const allFlavorTags = computed(() => {
    // “热”是性味筛选的固定选项；当前样例里没有热性药材，不硬给药材贴标签。
    const tags = new Set<string>(['热'])
    for (const h of data.value?.herbs ?? []) h.flavorTags.forEach((t) => tags.add(t))
    return [...tags]
  })

  const allMeridians = computed(() => data.value?.meridians ?? [])

  function formulasForHerb(herbId: string): Formula[] {
    return (data.value?.formulas ?? []).filter((f) =>
      f.composition.some((c) => c.herbId === herbId),
    )
  }

  function acupointsForMeridian(meridianId: string): Acupoint[] {
    return (data.value?.acupoints ?? []).filter((p) => p.meridianId === meridianId)
  }

  function connectedPoints(vesselId: string): Acupoint[] {
    return (data.value?.acupoints ?? []).filter((p) =>
      p.extraordinaryConnections.some((c) => c.vesselId === vesselId),
    )
  }

  function citationsFor(ids: string[]): Citation[] {
    return ids.map((id) => citationsById.value.get(id)).filter((x): x is Citation => !!x)
  }

  function herbName(id: string): string {
    return herbsById.value.get(id)?.name ?? id
  }

  function meridianName(id: string): string {
    return meridiansById.value.get(id)?.name ?? id
  }

  function formulaName(id: string): string {
    return formulasById.value.get(id)?.name ?? id
  }

  return {
    data,
    loading,
    error,
    herbsById,
    formulasById,
    meridiansById,
    acupointsById,
    citationsById,
    allFlavorTags,
    allMeridians,
    formulasForHerb,
    acupointsForMeridian,
    connectedPoints,
    citationsFor,
    herbName,
    meridianName,
    formulaName,
  }
}
