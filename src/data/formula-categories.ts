import type { FormulaSummary } from '@/composables/useFormulaApi'

export type FormulaBook = 'shanghan' | 'jingui' | 'mijingzi'

export interface FormulaBookMeta {
  key: FormulaBook
  label: string
  description: string
}

export const FORMULA_BOOKS: FormulaBookMeta[] = [
  {
    key: 'shanghan',
    label: '伤寒论',
    description: '按六经病篇归类；同一篇内的方剂按原书条序排列。',
  },
  {
    key: 'jingui',
    label: '金匮要略',
    description: '按原书病证篇归类；篇名保留原书用语，便于对照条文。',
  },
  {
    key: 'mijingzi',
    label: '米晶子济世良方',
    description: '按原书上级分部分类；条目据扫描本 OCR 整理，未逐字校勘。',
  },
]

// 《米晶子济世良方》正文按「大分部—小部位」编排，目录里的小部位归入上级分部，
// 避免首页同时出现「头部」和「头面部」这类重复章节。
const MIJINGZI_PARTS: Record<string, string> = {
  头面部: '头面部',
  头部: '头面部',
  面部: '头面部',
  眼眉部: '头面部',
  鼻部: '头面部',
  耳部: '头面部',
  口舌部: '头面部',
  牙部: '头面部',
  胸腹颈项部: '胸腹颈项部',
  喉部: '胸腹颈项部',
  项部: '胸腹颈项部',
  胸部: '胸腹颈项部',
  胁部: '胸腹颈项部',
  胃腹食部: '胸腹颈项部',
  少腹部: '胸腹颈项部',
  小便部: '胸腹颈项部',
  大便部: '胸腹颈项部',
  全身部: '全身部',
  手足部: '全身部',
  腰背部: '全身部',
  内外妇儿: '内外妇儿',
  内科: '内外妇儿',
  外科: '内外妇儿',
  妇科: '内外妇儿',
  妇科经带类: '内外妇儿',
  妇科妇产类: '内外妇儿',
  儿科: '内外妇儿',
  癫疯部: '癫疯部',
  虫咬部: '虫咬部',
  其他: '其他',
  经典效方: '经典效方',
  脉诊: '脉诊',
  附录: '附录',
}

export function bookOf(formula: FormulaSummary): FormulaBook | 'other' {
  const work = formula.sourceCitation?.work ?? ''
  if (work.includes('米晶子')) return 'mijingzi'
  if (work.includes('金匮')) return 'jingui'
  if (work.includes('伤寒')) return 'shanghan'
  return 'other'
}

export function chapterOf(formula: FormulaSummary) {
  const locator = formula.sourceCitation?.locator ?? ''
  const head = locator.split('·')[0]
  const book = bookOf(formula)
  if (book === 'mijingzi') return MIJINGZI_PARTS[head] ?? head ?? '米晶子其他'
  if (book === 'shanghan') {
    const match = head.match(/^辨(太阳|阳明|少阳|太阴|少阴|厥阴)病/)
    if (match) return `${match[1]}病`
    if (head.includes('差后劳复') || head.includes('阴阳易')) return '差后劳复'
    return '伤寒其他篇'
  }
  return (
    head
      .replace(/脉.*$/, '')
      .replace(/证.*$/, '')
      .replace(/第.*$/, '')
      .trim() || '金匮其他篇'
  )
}

export function hasHerb(formula: FormulaSummary, name: string) {
  return formula.composition.some((item) => (item.herbName ?? '').includes(name))
}

export const FORMULA_CLASSES = [
  { key: 'guizhi', title: '桂枝类方', hint: '桂枝', match: (f: FormulaSummary) => hasHerb(f, '桂枝') },
  { key: 'mahuang', title: '麻黄类方', hint: '麻黄', match: (f: FormulaSummary) => hasHerb(f, '麻黄') },
  { key: 'chaihu', title: '柴胡类方', hint: '柴胡', match: (f: FormulaSummary) => hasHerb(f, '柴胡') },
  { key: 'chengqi', title: '承气类方', hint: '承气', match: (f: FormulaSummary) => f.name.includes('承气') },
  { key: 'linggui', title: '苓桂类方', hint: '茯苓 + 桂枝', match: (f: FormulaSummary) => hasHerb(f, '茯苓') && hasHerb(f, '桂枝') },
  { key: 'sini', title: '四逆类方', hint: '四逆', match: (f: FormulaSummary) => f.name.includes('四逆') || (hasHerb(f, '附子') && hasHerb(f, '干姜')) },
  { key: 'xiexin', title: '泻心类方', hint: '泻心', match: (f: FormulaSummary) => f.name.includes('泻心') },
  { key: 'fuzi', title: '附子类方', hint: '附子', match: (f: FormulaSummary) => hasHerb(f, '附子') },
  { key: 'shigao', title: '石膏类方', hint: '石膏', match: (f: FormulaSummary) => hasHerb(f, '石膏') },
  { key: 'banxia', title: '半夏类方', hint: '半夏', match: (f: FormulaSummary) => hasHerb(f, '半夏') },
] as const

export type FormulaClass = (typeof FORMULA_CLASSES)[number]

export function classByKey(key: string) {
  return FORMULA_CLASSES.find((item) => item.key === key)
}

export function formulasForClass(formulas: FormulaSummary[], key: string) {
  const item = classByKey(key)
  return item ? formulas.filter((formula) => item.match(formula)) : []
}

export function formulasForSource(
  formulas: FormulaSummary[],
  book: string,
  chapter: string,
) {
  return formulas.filter(
    (formula) => bookOf(formula) === book && chapterOf(formula) === chapter,
  )
}

export function formulaSourcePath(book: string, chapter: string) {
  return `/formulas/source/${book}/${encodeURIComponent(chapter)}`
}

export function formulaClassPath(key: string) {
  return `/formulas/class/${key}`
}

export function normalizeFormulaText(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

export function searchFormulas(formulas: FormulaSummary[], rawQuery: string) {
  const q = normalizeFormulaText(rawQuery.trim())
  if (!q) return []
  const exact = formulas.filter(
    (formula) =>
      normalizeFormulaText(formula.name) === q || normalizeFormulaText(formula.pinyin) === q,
  )
  if (exact.length) return exact
  return formulas.filter((formula) => {
    const haystack = normalizeFormulaText(
      [
        formula.name,
        formula.pinyin,
        formula.effectsText,
        ...formula.symptomTags,
        ...formula.composition.map((item) => item.herbName ?? item.herbId),
      ].join(' '),
    )
    return haystack.includes(q)
  })
}
