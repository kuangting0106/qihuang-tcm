import type { OriginalAnnotation } from '@/types/tcm'

interface GlossaryEntry {
  phrase: string
  note: string
}

/**
 * 常见《伤寒论》症状术语的现代解释。
 *
 * 这些解释只帮助阅读原文，不是对条文方证的重新诊断，也不替代原书与
 * 执业中医师的辨证。术语按最长匹配优先，避免“汗出”覆盖“不汗出”等。
 */
const GLOSSARY: GlossaryEntry[] = [
  { phrase: '头项强痛', note: '头痛，连及颈项拘紧疼痛。' },
  { phrase: '身疼痛', note: '身体肌肉、关节疼痛。' },
  { phrase: '骨节疼痛', note: '周身关节疼痛。' },
  { phrase: '腰痛', note: '腰部疼痛。' },
  { phrase: '身重', note: '身体沉重，活动不利。' },
  { phrase: '发热', note: '体温升高，或自觉身热。' },
  { phrase: '恶寒', note: '怕冷，加衣盖被仍不能缓解。' },
  { phrase: '恶风', note: '怕风，遇风不适，程度一般较恶寒轻。' },
  { phrase: '寒热', note: '发热与恶寒并见，或寒热交替。' },
  { phrase: '往来寒热', note: '恶寒与发热交替出现，一阵冷一阵热。' },
  { phrase: '但热不寒', note: '只发热，不恶寒。' },
  { phrase: '潮热', note: '发热像潮水一样定时而作。' },
  { phrase: '不汗出', note: '没有汗。' },
  { phrase: '汗出', note: '有汗，或汗自行外出。' },
  { phrase: '无汗', note: '没有汗。' },
  { phrase: '但头汗出', note: '只有头部出汗，身体其他部位不出汗。' },
  { phrase: '自汗', note: '不因活动或发汗而自然出汗。' },
  { phrase: '盗汗', note: '睡时出汗，醒后汗止。' },
  { phrase: '头痛', note: '头部疼痛，可连及颈项。' },
  { phrase: '头眩', note: '头晕、视物昏花。' },
  { phrase: '目眩', note: '视物昏花、眼前发黑。' },
  { phrase: '鼻鸣', note: '鼻塞，呼吸时鼻中有声。' },
  { phrase: '鼻干', note: '鼻腔干燥。' },
  { phrase: '咽干', note: '咽喉干燥。' },
  { phrase: '咽痛', note: '咽喉疼痛。' },
  { phrase: '口苦', note: '口中有苦味。' },
  { phrase: '口干', note: '口腔干燥。' },
  { phrase: '口渴', note: '口干而想喝水。' },
  { phrase: '不渴', note: '没有口渴感。' },
  { phrase: '胸满', note: '胸部胀闷不舒。' },
  { phrase: '胸胁苦满', note: '胸部和胁肋部胀满不适，为少阳经气不利的常见表现。' },
  { phrase: '胁下满', note: '胁肋下胀满。' },
  { phrase: '心下满', note: '胃脘部胀满。' },
  { phrase: '心下痞', note: '胃脘部痞塞胀满，按之柔软。' },
  { phrase: '心下悸', note: '胃脘部跳动不安。' },
  { phrase: '心悸', note: '自觉心跳不安。' },
  { phrase: '腹满', note: '腹部胀满。' },
  { phrase: '腹痛', note: '腹部疼痛。' },
  { phrase: '腹胀', note: '腹部胀大不适。' },
  { phrase: '少腹满', note: '下腹部胀满。' },
  { phrase: '少腹急结', note: '下腹部拘急、按之有结滞感。' },
  { phrase: '烦躁', note: '心烦不安、躁动。' },
  { phrase: '虚烦', note: '心烦而虚弱，或烦闷不宁。' },
  { phrase: '不得眠', note: '睡不着，或睡眠不安。' },
  { phrase: '失眠', note: '难以入睡或睡而易醒。' },
  { phrase: '多眠睡', note: '嗜睡，精神困倦。' },
  { phrase: '嗜卧', note: '喜欢躺卧，精神倦怠。' },
  { phrase: '但欲寐', note: '只想睡，精神萎靡。' },
  { phrase: '谵语', note: '神志不清、胡言乱语。' },
  { phrase: '直视', note: '两眼直视，神志异常。' },
  { phrase: '循衣摸床', note: '两手无意识地乱摸衣被、床沿，常见于神志不清。' },
  { phrase: '惕而不安', note: '惊恐不安、心神不宁。' },
  { phrase: '嘿嘿不欲饮食', note: '神情沉默，不想吃东西。' },
  { phrase: '心烦喜呕', note: '心中烦闷，容易恶心呕吐。' },
  { phrase: '喜呕', note: '容易恶心呕吐。' },
  { phrase: '干呕', note: '作呕而没有东西吐出。' },
  { phrase: '呕', note: '恶心呕吐。' },
  { phrase: '吐', note: '呕吐。' },
  { phrase: '咳', note: '咳嗽。' },
  { phrase: '喘', note: '呼吸急促、喘息。' },
  { phrase: '微喘', note: '轻微气喘。' },
  { phrase: '短气', note: '呼吸短促，气不够用。' },
  { phrase: '气逆', note: '气往上冲。' },
  { phrase: '奔豚', note: '自觉有气从少腹上冲胸咽。' },
  { phrase: '吐涎沫', note: '吐出清水或痰涎。' },
  { phrase: '干噫食臭', note: '嗳气带有食物腐臭气味。' },
  { phrase: '肠鸣', note: '腹中咕噜作响。' },
  { phrase: '小便不利', note: '排尿不畅，或尿量减少。' },
  { phrase: '小便自利', note: '小便通利，尿量偏多。' },
  { phrase: '小便数', note: '小便次数多。' },
  { phrase: '遗尿', note: '小便失禁。' },
  { phrase: '下利', note: '腹泻。' },
  { phrase: '自下利', note: '没有用攻下药而自行腹泻。' },
  { phrase: '下利清谷', note: '腹泻，大便中有未消化的食物。' },
  { phrase: '便脓血', note: '大便中夹有脓血。' },
  { phrase: '大便硬', note: '大便干硬。' },
  { phrase: '不大便', note: '没有大便。' },
  { phrase: '便秘', note: '大便干结、排便困难。' },
  { phrase: '下重', note: '肛门坠胀，排便不爽。' },
  { phrase: '里急后重', note: '腹痛急迫，排便后仍觉未尽。' },
  { phrase: '衄血', note: '鼻出血。' },
  { phrase: '吐血', note: '吐血。' },
  { phrase: '发黄', note: '皮肤或眼睛发黄。' },
  { phrase: '身黄', note: '身体皮肤发黄。' },
  { phrase: '身目悉黄', note: '全身皮肤和眼睛都发黄。' },
  { phrase: '水肿', note: '肢体或面部浮肿。' },
  { phrase: '手足温', note: '手足温暖。' },
  { phrase: '手足厥冷', note: '手足发凉。' },
  { phrase: '厥逆', note: '手足逆冷，或气机逆乱。' },
  { phrase: '背恶寒', note: '背部怕冷。' },
  { phrase: '筋惕肉瞤', note: '肌肉跳动、抽动。' },
  { phrase: '筋惕肉润', note: '肌肉跳动、抽动；原文用字如此。' },
  { phrase: '振振欲擗地', note: '身体震颤、站立不稳，像要倒地。' },
  { phrase: '脉浮紧', note: '脉位浮、脉势紧，常见于外感寒邪、表实证。' },
  { phrase: '脉浮缓', note: '脉位浮、脉势缓，常见于外感风邪、表虚证。' },
  { phrase: '脉浮', note: '脉位轻取即得，常见于表证。' },
  { phrase: '脉微弱', note: '脉细软无力，提示正气不足。' },
  { phrase: '脉微', note: '脉细软无力，提示阳气不足。' },
  { phrase: '脉沉', note: '脉位沉，轻取不应。' },
  { phrase: '脉细', note: '脉体细小。' },
  { phrase: '脉数', note: '脉搏偏快。' },
  { phrase: '脉迟', note: '脉搏偏慢。' },
  { phrase: '脉促', note: '脉来急促，或有歇止。' },
  { phrase: '脉弦', note: '脉势端直，如按琴弦。' },
  { phrase: '脉滑', note: '脉来流利圆滑。' },
]

function normalizeForMatch(value: string) {
  return value
    .replace(/[「」『』“”"'《》〈〉，,。.！!？?；;：:\s（）()]/g, '')
    .replace(/朮/g, '术')
    .replace(/方中/g, '')
    .replace(/各[一二三四五六七八九十百]+(?:两|钱|分|铢|枚|个|升|合)/g, '')
    .replace(/[一二三四五六七八九十百]+(?:两|钱|分|铢|枚|个|升|合)/g, '')
}

/**
 * 返回原文中实际出现、且互不重叠的术语注解。
 */
export function glossaryAnnotationsFor(text: string): OriginalAnnotation[] {
  const source = text ?? ''
  if (!source) return []

  const candidates = GLOSSARY.map((entry) => ({
    ...entry,
    index: source.indexOf(entry.phrase),
  }))
    .filter((entry) => entry.index >= 0)
    .sort((a, b) => b.phrase.length - a.phrase.length || a.index - b.index)

  const used = new Array(source.length).fill(false)
  const accepted: Array<GlossaryEntry & { index: number }> = []

  for (const entry of candidates) {
    let start = source.indexOf(entry.phrase)
    while (
      start >= 0 &&
      used.slice(start, start + entry.phrase.length).some(Boolean)
    ) {
      start = source.indexOf(entry.phrase, start + 1)
    }
    if (start < 0) continue
    for (let i = start; i < start + entry.phrase.length; i += 1) used[i] = true
    accepted.push({ phrase: entry.phrase, note: entry.note, index: start })
  }

  return accepted
    .sort((a, b) => a.index - b.index)
    .map(({ phrase, note, index }) => ({
      id: `gloss-${index}-${phrase.length}`,
      phrase,
      note,
    }))
}

export function glossaryTagsFor(text: string): string[] {
  const tags = glossaryAnnotationsFor(text).map((annotation) => annotation.phrase)
  return [...new Set(tags)].slice(0, 8)
}

/**
 * 只取包含方名的主句，避免把“不可服”等禁忌句中的症状当成方证主症。
 */
export function primarySymptomText(text: string, formulaName: string): string {
  const source = text ?? ''
  if (!source) return ''
  const target = normalizeForMatch(formulaName)
  if (!target) return source

  const sentences = source.match(/[^。！？]+[。！？]?/g) ?? [source]
  const hit = sentences.find((sentence) =>
    normalizeForMatch(sentence).includes(target),
  )
  return hit ?? source
}
