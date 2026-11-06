export interface ProcessingCategory {
  id: string
  title: string
  kicker: string
  scope: string
  status: '待收录' | '已收录'
  count: number
  note: string
}

export const processingCategories: ProcessingCategory[] = [
  {
    id: 'plants',
    title: '草木类',
    kicker: 'HERBS / 草木',
    scope: '根、茎、叶、花、果实、种子、全草',
    status: '待收录',
    count: 0,
    note: '收录净制、切制、炒、炙、蒸、煮、煅等炮制方法；每法注明原书、药典或炮制规范。',
  },
  {
    id: 'animals',
    title: '蛇虫类',
    kicker: 'ANIMALS / 蛇虫',
    scope: '蛇、虫、甲壳、爬行类及其他动物药',
    status: '待收录',
    count: 0,
    note: '毒性药材须写清减毒、去毒与使用限制；未核来源前不写具体操作细节。',
  },
  {
    id: 'minerals',
    title: '金石类',
    kicker: 'MINERALS / 金石',
    scope: '矿物、金属、化石、贝壳类',
    status: '待收录',
    count: 0,
    note: '收录煅、淬、水飞、醋制等方法；明确炮制目的、成品性状与安全边界。',
  },
  {
    id: 'other',
    title: '其他类',
    kicker: 'OTHERS / 其他',
    scope: '水、火、土、人部及其他暂难归入三类的药材',
    status: '待收录',
    count: 0,
    note: '无法稳定归入草木、蛇虫、金石者暂列此处，待核对原书部类后再细分。',
  },
]
