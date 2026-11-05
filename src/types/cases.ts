export interface CaseHerb {
  name: string
  dose: string
}

export type CaseContent =
  | { type: 'paragraph'; text: string }
  | { type: 'prescription'; raw: string; herbs: CaseHerb[] }

export interface CaseSource {
  work: string
  locator: string
}

export interface CaseItem {
  id: string
  title: string
  category: string
  summary: string
  source: CaseSource
  content: CaseContent[]
}

export interface CaseSummary {
  id: string
  title: string
  category: string
  summary: string
  source: CaseSource
  prescriptionCount: number
}

export function casePrescriptionCount(item: CaseItem): number {
  return item.content.filter((block) => block.type === 'prescription').length
}
