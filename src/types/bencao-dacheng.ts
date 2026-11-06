import type { BencaoImage } from './bencao'

export interface BencaoDachengSection {
  kind: string
  label: string
  text: string
  source?: string
}

export interface BencaoDachengProfile {
  flavorTags: string[]
  nature: string
  meridianNames: string[]
  effects: string
  indications: string
  dosage: string
  contraindications: string
}

export interface BencaoDachengDocument {
  file: string
  kind: string
  title: string
}

export interface BencaoDachengQuote {
  text: string
  source: string
}

export interface BencaoDachengEntry {
  id: string
  number: number
  name: string
  pinyin: string
  aliases: string[]
  categoryId: string
  categoryTitle: string
  summary: string
  quote: BencaoDachengQuote | null
  profile: BencaoDachengProfile
  sections: BencaoDachengSection[]
  sourceText: string
  images: BencaoImage[]
  charCount: number
  docCount: number
  documents: BencaoDachengDocument[]
}

export interface BencaoDachengIndexItem {
  id: string
  number: number
  name: string
  pinyin: string
  aliases: string[]
  categoryId: string
  categoryTitle: string
  summary: string
  image: BencaoImage | null
  docCount: number
  charCount: number
}

export interface BencaoDachengCategory {
  id: string
  title: string
  count: number
}

export interface BencaoDachengIndex {
  generatedAt: string
  total: number
  withImages: number
  categories: BencaoDachengCategory[]
  items: BencaoDachengIndexItem[]
}
