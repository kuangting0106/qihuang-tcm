import type { Citation } from '@/types/tcm'

export interface ClassicWork {
  key: string
  work: string
  parentWork?: string
  parentNote?: string
  author?: string
  edition?: string
  items: Citation[]
}

export const CITED_ENTRY_PREVIEW = 10

export function groupClassicWorks(sources: Citation[]): ClassicWork[] {
  const groups = new Map<string, ClassicWork>()

  for (const source of sources) {
    const key = `${source.parentWork ?? ''}|${source.work}`
    const existing = groups.get(key)
    if (existing) {
      existing.items.push(source)
      continue
    }
    groups.set(key, {
      key,
      work: source.work,
      parentWork: source.parentWork,
      parentNote: source.parentNote,
      author: source.author,
      edition: source.edition,
      items: [source],
    })
  }

  return [...groups.values()]
}
