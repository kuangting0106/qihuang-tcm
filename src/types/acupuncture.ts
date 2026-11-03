export interface AcupunctureTutorialTopic {
  id: string
  order: number
  title: string
  time: string
  page: number
  paragraphs: string[]
  missing?: boolean
}

export interface AcupunctureTutorialSection {
  id: string
  order: number
  title: string
  time: string
  page: number
  endPage: number
  topicCount: number
  meridianId: string | null
  meridianName: string | null
  intro: string[]
  body?: string[]
  topics: AcupunctureTutorialTopic[]
  meridianStatus?: {
    collected: number
    total: number
    complete: boolean
  }
}

export interface AcupunctureTutorialChapter {
  id: string
  order: number
  title: string
  time: string
  page: number
  endPage: number
  sections: AcupunctureTutorialSection[]
}

export interface AcupunctureTutorial {
  generatedAt: string
  source: string
  sourcePdf: string
  chapters: AcupunctureTutorialChapter[]
  stats: {
    chapters: number
    sections: number
    topics: number
    pages: number
  }
}
