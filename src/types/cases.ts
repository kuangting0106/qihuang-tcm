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
  note?: string
}

export type CaseMode = 'case' | 'thought'
export type CaseEra = 'ancient' | 'modern'

export interface CaseItem {
  id: string
  title: string
  category: string
  doctor?: string
  mode?: CaseMode
  era?: CaseEra
  subcategory?: string
  summary: string
  source: CaseSource
  content: CaseContent[]
}

export interface CaseSummary {
  id: string
  title: string
  category: string
  doctor?: string
  mode?: CaseMode
  era?: CaseEra
  subcategory?: string
  summary: string
  source: CaseSource
  prescriptionCount: number
}

export function casePrescriptionCount(item: CaseItem): number {
  return item.content.filter((block) => block.type === 'prescription').length
}
