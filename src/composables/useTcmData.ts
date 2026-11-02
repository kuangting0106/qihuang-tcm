import { computed, ref, shallowRef } from 'vue'
import type { Acupoint, Citation, Formula, Herb, Meridian, TcmData } from '@/types/tcm'

const data = shallowRef<TcmData | null>(null)
const loading = ref(true)
const error = ref('')
let loadPromise: Promise<TcmData> | null = null

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
      throw err
    })
  return loadPromise
}

export function useTcmData() {
  const herbsById = computed<Map<string, Herb>>(
    () => new Map((data.value?.herbs ?? []).map((h) => [h.id, h])),
  )
  const formulasById = computed<Map<string, Formula>>(
    () => new Map((data.value?.formulas ?? []).map((f) => [f.id, f])),
  )
  const meridiansById = computed<Map<string, Meridian>>(
    () => new Map((data.value?.meridians ?? []).map((m) => [m.id, m])),
  )
  const acupointsById = computed<Map<string, Acupoint>>(
    () => new Map((data.value?.acupoints ?? []).map((p) => [p.id, p])),
  )
  const citationsById = computed<Map<string, Citation>>(
    () => new Map((data.value?.sources ?? []).map((s) => [s.id, s])),
  )

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
