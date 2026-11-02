export type BencaoBlockType = 'p' | 'quote'

export type BencaoSectionKind =
  | 'original'
  | 'commentary'
  | 'study'
  | 'nishi'
  | 'lecture'
  | 'lesson'

export interface BencaoBlock {
  type: BencaoBlockType
  text: string
}

export interface BencaoSection {
  label: string
  kind: BencaoSectionKind
  kindLabel: string
  blocks: BencaoBlock[]
}

export interface BencaoEntry {
  id: string
  groupId: string
  number: number | null
  title: string
  subtitle: string
  charCount: number
  sections: BencaoSection[]
  note?: string
}

export interface BencaoGroupMeta {
  id: string
  title: string
  subtitle: string
  description: string
  count: number
  charCount: number
}

export interface BencaoLectureSource {
  id: string
  title: string
  author: string
  course: string
  repository: string
  commit: string
  sourcePath: string
  note: string
}

export interface BencaoIntroItem {
  id: string
  title: string
  subtitle: string
  charCount: number
}

export interface BencaoLectureIndex {
  generatedAt: string
  source: BencaoLectureSource
  groups: BencaoGroupMeta[]
  intro: BencaoIntroItem[]
}

export interface BencaoGroup {
  id: string
  title: string
  subtitle: string
  description: string
  entries: BencaoEntry[]
}

export type BencaoRankId = 'upper' | 'middle' | 'lower' | 'nishi' | 'editor'

export interface BencaoCatalogItem {
  key: string
  name: string
  groupId: string
  entryId: string
  rankId: BencaoRankId
  number: number | null
  flavorTags: string[]
  nature: string
  summary: string
  charCount: number
  hasProcessing: boolean
  processingText?: string
  aliases: string[]
  curatedId?: string
}

export interface BencaoCatalogRank {
  id: BencaoRankId
  title: string
  subtitle: string
  count: number
}

export interface BencaoCatalog {
  generatedAt: string
  source: BencaoLectureSource
  total: number
  threeRanks: number
  ranks: BencaoCatalogRank[]
  items: BencaoCatalogItem[]
}
