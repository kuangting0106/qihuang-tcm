export type ClaimKind = 'quote' | 'paraphrase' | 'analysis'
export type CitationType = 'classic' | 'standard' | 'textbook' | 'image'

export interface SourcedText {
  text: string
  kind: ClaimKind
  citationIds: string[]
  locator?: string
  note?: string
}

export interface Citation {
  id: string
  type: CitationType
  work: string
  parentWork?: string
  parentNote?: string
  author?: string
  edition?: string
  publisher?: string
  year?: string
  locator: string
  quote?: string
  url?: string
  note?: string
}

export interface HerbImage {
  type: string
  url: string
  alt: string
  caption: string
  credit: string
  license: string
  sourceUrl?: string
  slot?: 'whole' | 'part' | 'medicinal'
  pending?: boolean
}

export const HERB_IMAGE_SLOT_LABELS = {
  whole: '全图',
  part: '入药部位图',
  medicinal: '药材高清切片图',
} as const

export type ProcessingCategoryId = 'plants' | 'animals' | 'minerals'

export interface HerbProcessingStep {
  label: string
  text: string
  kind: ClaimKind
  citationIds: string[]
}

export interface HerbProcessing {
  categoryId: ProcessingCategoryId
  summary: string
  methods: HerbProcessingStep[]
  product: string
  cautions: string[]
  note?: string
  verification: 'reference' | 'pending'
}

export interface ProcessingExample {
  id: string
  herbName: string
  rankHint?: string
  categoryId: ProcessingCategoryId
  status: '待核'
  lines: string[]
  note: string
}

export interface ProcessingClassicEntry {
  id: string
  book: string
  bookId: string
  author: string
  dynasty: string
  section: string
  name: string
  nature: string
  processing: string
  sourceId: string
}

export interface ProcessingClassicBook {
  id: string
  title: string
  author: string
  dynasty: string
  sourceId: string
  count: number
}

export interface HerbPairing {
  herbId: string
  label: string
  kind: ClaimKind
  citationIds: string[]
  note?: string
}

export interface HerbNameNotes {
  ancient: SourcedText
  regional: SourcedText
}

export interface HerbProperties {
  natureFlavor: SourcedText
  meridians: SourcedText
  effects: SourcedText
  indications: SourcedText
  contraindications: SourcedText
}

export interface Herb {
  id: string
  name: string
  pinyin: string
  aliases: string[]
  names: HerbNameNotes
  flavorTags: string[]
  meridianIds: string[]
  classicRankId: string
  therapyCategoryIds: string[]
  properties: HerbProperties
  processing: HerbProcessing
  images: HerbImage[]
  pairings: HerbPairing[]
  verification: 'verified' | 'reference' | 'pending'
  note?: string
}

export interface HerbClassicRank {
  id: string
  title: string
  subtitle: string
  description: string
  citationIds: string[]
}

export interface HerbTherapyCategory {
  id: string
  title: string
  description: string
  pending: string[]
}

export interface HerbTaxonomy {
  ranks: HerbClassicRank[]
  categories: HerbTherapyCategory[]
  assignments: Record<string, { rankId: string; categoryIds: string[] }>
  note: string
}

export interface HerbPrincipleItem {
  label: string
  text: string
}

export interface HerbPrincipleBranch {
  id: string
  index: string
  title: string
  subtitle: string
  tone: 'jade' | 'gold' | 'cinnabar' | 'plum' | 'stone' | 'moss'
  summary: string
  items: HerbPrincipleItem[]
  note: string
  kindLabel: string
  citationIds: string[]
}

export interface HerbPrinciples {
  title: string
  intro: string
  branches: HerbPrincipleBranch[]
  closing: string
}

export type FormulaRole = '君' | '臣' | '佐' | '使' | '佐使' | '未标注'

export interface DosageRatio {
  group: string
  value: number
  text: string
  note?: string
}

export interface DosageConversion {
  text: string
  note?: string
}

export interface FormulaCompositionItem {
  herbId: string
  /** 未收录药材的显示名；有值时可不链接到药材详情页 */
  herbName?: string
  dosage: string
  role: FormulaRole
  roleCitationIds: string[]
  note?: string
  ratio?: DosageRatio
  modernDose?: string
  modernRatio?: DosageRatio
  /** 本方中作用，属后世方解，不是经典原文 */
  action?: SourcedText
}

export interface FormulaCommentary {
  id: string
  author: string
  era: string
  title: string
  text: string
  kind: ClaimKind
  citationIds: string[]
}

export interface CommentarySlot {
  id: string
  kind: 'classic' | 'physician'
  label: string
  work: string
  locator: string
  quote: string
  status: '待补充' | '已收录'
}

export interface FormulaModification {
  condition: string
  change: string
  citationIds: string[]
  kind?: ClaimKind
}

export interface FormulaCorePair {
  from: string
  to: string
  label: string
  kind: ClaimKind
  citationIds: string[]
  note?: string
}

export interface FormulaPreparation {
  ingredients: SourcedText
  decoction: SourcedText
  administration?: SourcedText
  modernDecoction?: string
  modernAdministration?: string
  modernNote?: string
}

export interface FormulaHerbMeaning {
  herbId: string
  text: string
}

export interface FormulaMeaning {
  herbMeanings: FormulaHerbMeaning[]
  summary: SourcedText
}

export interface OriginalAnnotation {
  id: string
  phrase: string
  note: string
  citationIds?: string[]
}

export interface Formula {
  id: string
  name: string
  pinyin: string
  sourceCitationId: string
  originalText: SourcedText
  effects: SourcedText
  modernExplanation?: SourcedText
  symptoms: SourcedText[]
  /** 无独立方证条文时的说明，如讲义附方 */
  symptomNote?: string
  originalAnnotations?: OriginalAnnotation[]
  preparation?: FormulaPreparation
  meaning?: FormulaMeaning
  composition: FormulaCompositionItem[]
  modifications: FormulaModification[]
  modificationsNote?: string
  corePairs: FormulaCorePair[]
  dosageNote?: string
  dosageRatioSummary?: string
  modernRatioSummary?: string
  modernGramDoses?: Record<string, string>
  modernGramNote?: string
  doseConversion?: DosageConversion
  modernDoseSummary?: string
  modernDoseNote?: string
  symptomTags?: string[]
  commentaries: FormulaCommentary[]
  commentarySlots?: CommentarySlot[]
  additionalIndications: SourcedText[]
  commentaryNote?: string
  verification: 'verified' | 'reference' | 'pending'
}

export type Region = 'head-neck' | 'trunk' | 'upper-limb' | 'lower-limb'

export interface PointType {
  label: string
  citationIds: string[]
  note?: string
}

export interface ExtraordinaryConnection {
  vesselId: string
  label: string
  citationIds: string[]
}

export interface Acupoint {
  id: string
  name: string
  pinyin: string
  meridianId: string
  region: Region
  pointTypes: PointType[]
  extraordinaryConnections: ExtraordinaryConnection[]
  location: SourcedText
  indications: SourcedText
  needle: SourcedText
  moxa: SourcedText
  coordinates: [number, number, number]
  orderFromDistal?: number
  annotation: string
  safety?: string
  verification: 'verified' | 'reference' | 'pending'
}

export interface Meridian {
  id: string
  name: string
  abbr: string
  category: 'regular' | 'extraordinary'
  hasOwnPoints: boolean
  flowLabel: string
  description: SourcedText
  acupointIds: string[]
  totalPoints?: number
  path?: [number, number, number][]
  pathNote?: string
}

export interface BodyModel {
  id: string
  coordinateFrame: string
  height: number
  notes: string
}

export interface TcmData {
  schemaVersion: string
  contentVersion: string
  generatedAt: string
  title: string
  disclaimer: string
  contentPrinciples: string[]
  bodyModel: BodyModel
  sources: Citation[]
  herbs: Herb[]
  herbTaxonomy: HerbTaxonomy
  herbPrinciples: HerbPrinciples
  processingExamples: ProcessingExample[]
  processingClassics: {
    books: ProcessingClassicBook[]
    entries: ProcessingClassicEntry[]
  }
  formulas: Formula[]
  meridians: Meridian[]
  acupoints: Acupoint[]
}

export interface HerbFilters {
  query: string
  flavor: string
  meridian: string
}

export const REGION_LABELS: Record<Region, string> = {
  'head-neck': '头颈',
  trunk: '躯干',
  'upper-limb': '上肢',
  'lower-limb': '下肢',
}

export const ROLE_ORDER: FormulaRole[] = ['君', '臣', '佐', '使', '佐使', '未标注']

export const KIND_LABELS: Record<ClaimKind, string> = {
  quote: '原文',
  paraphrase: '摘录',
  analysis: '后世方解',
}
