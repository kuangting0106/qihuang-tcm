import raw from './jingui-cases.json'

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

export const cases = (raw as { cases: CaseItem[] }).cases

export const casesById = new Map(cases.map((item) => [item.id, item]))

export function casePrescriptionCount(item: CaseItem) {
  return item.content.filter((block) => block.type === 'prescription').length
}
