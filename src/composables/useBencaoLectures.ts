import type {
  BencaoCatalog,
  BencaoCatalogItem,
  BencaoEntry,
  BencaoGroup,
  BencaoLectureIndex,
} from '@/types/bencao'

const base = import.meta.env.BASE_URL
let indexPromise: Promise<BencaoLectureIndex> | null = null
let catalogPromise: Promise<BencaoCatalog> | null = null
const groupPromises = new Map<string, Promise<BencaoGroup>>()

export function loadBencaoIndex(): Promise<BencaoLectureIndex> {
  if (!indexPromise) {
    indexPromise = fetch(`${base}data/bencao-lectures/index.json`).then(async (res) => {
      if (!res.ok) throw new Error(`讲目录加载失败：HTTP ${res.status}`)
      return (await res.json()) as BencaoLectureIndex
    })
  }
  return indexPromise
}

export function loadBencaoCatalog(): Promise<BencaoCatalog> {
  if (!catalogPromise) {
    catalogPromise = fetch(`${base}data/bencao-lectures/catalog.json`).then(async (res) => {
      if (!res.ok) throw new Error(`讲义药目加载失败：HTTP ${res.status}`)
      return (await res.json()) as BencaoCatalog
    })
  }
  return catalogPromise
}

export function findCatalogByName(
  catalog: BencaoCatalog | null,
  name: string,
): BencaoCatalogItem | null {
  if (!catalog) return null
  return catalog.items.find((item) => item.name === name) ?? null
}

export function loadBencaoGroup(id: string): Promise<BencaoGroup> {
  const cached = groupPromises.get(id)
  if (cached) return cached

  const promise = fetch(`${base}data/bencao-lectures/${id}.json`).then(async (res) => {
    if (!res.ok) throw new Error(`讲义内容加载失败：HTTP ${res.status}`)
    return (await res.json()) as BencaoGroup
  })
  groupPromises.set(id, promise)
  return promise
}

export function findBencaoEntry(
  group: BencaoGroup,
  entryId: string,
): { entry: BencaoEntry; index: number } | null {
  const index = group.entries.findIndex((entry) => entry.id === entryId)
  if (index < 0) return null
  return { entry: group.entries[index], index }
}

export function formatCharCount(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)} 万字`
  return `${count.toLocaleString('zh-CN')} 字`
}
