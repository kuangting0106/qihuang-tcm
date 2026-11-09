export type ClassicSectionKind = 'preface' | 'postscript' | 'frontMatter' | 'chapter'

export interface ClassicSection {
  id: string
  title: string
  volume: string
  kind: ClassicSectionKind
  charCount: number
  paragraphs: string[]
}

export interface ClassicVolume {
  title: string
  chapters: ClassicSection[]
}

export interface ClassicBookStats {
  prefaceCount: number
  postscriptCount: number
  frontMatterCount: number
  chapterCount: number
  volumeCount: number
  charCount: number
}

export interface ClassicBook {
  id: string
  title: string
  author: string
  source: {
    file: string
    note: string
  }
  prefaces: ClassicSection[]
  postscripts: ClassicSection[]
  frontMatter: ClassicSection[]
  volumes: ClassicVolume[]
  stats: ClassicBookStats
}

export interface ClassicBookSummary {
  id: string
  title: string
  author: string
  tier?: 'primary' | 'secondary'
  dynasty?: string
  category?: string
  subcategory?: string
  sectionCount?: number
  charCount?: number
  stats?: ClassicBookStats
}

export interface ClassicLibraryIndex {
  generatedAt: string
  books: ClassicBookSummary[]
}
