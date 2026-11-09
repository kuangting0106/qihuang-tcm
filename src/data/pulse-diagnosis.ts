export const pulseIntro = {
  eyebrow: 'PULSE / 脉诊经验',
  title: '脉诊：先看胃气、神与根',
  lede:
    '本页据用户提供的《脉法.md》整理，按“总论、常见脉象、危重脉象、方证对应、动态观察、医案”重排。它是李可脉诊经验的二手整理，不是《伤寒论》原文，也不是诊断标准。',
  meta: ['6 类常见脉象', '3 类危重脉象', '3 则脉诊医案'],
}

export const pulseOverview = {
  importance: [
    '脉诊是四诊之一，不可偏废。',
    '但不可单纯依赖脉象，需四诊合参。',
    '脉象与证候不符时，以病人的正气强弱为转归。',
  ],
  features: [
    '强调脉象与整体辨证相结合。',
    '不拘泥于脉象的固定含义。',
    '注重脉象的动态变化。',
  ],
}

export interface CommonPulse {
  id: string
  name: string
  traditional: string
  experience: string
  significance?: string
  differentiation?: string
  treatment?: string
}

export const commonPulses: CommonPulse[] = [
  {
    id: 'sinking',
    name: '沉脉',
    traditional: '沉脉主里证。',
    experience: '沉细脉未必是虚证。',
    significance: '寒邪直中少阴时，脉象反沉细。',
    differentiation: '需结合体质、症状综合判断。',
  },
  {
    id: 'thin',
    name: '细脉',
    traditional: '细脉主虚证。',
    experience: '细脉可见于阳虚、寒凝。',
    significance: '少阴病脉微细，但欲寐。',
    treatment: '四逆汤回阳。',
  },
  {
    id: 'floating',
    name: '浮脉',
    traditional: '浮脉主表证。',
    experience: '虚阳外越时，脉象可能浮大。',
    differentiation: '浮大有力与浮大无根，需分开看。',
    significance: '浮大无根为亡阳之兆。',
  },
  {
    id: 'stringy',
    name: '弦脉',
    traditional: '弦脉主肝胆病、痛证。',
    experience: '弦脉可见于少阳病、寒邪凝滞。',
    significance: '少阳病脉弦，柴胡证。',
  },
  {
    id: 'slippery',
    name: '滑脉',
    traditional: '滑脉主痰饮、食积、妊娠。',
    experience: '滑脉可见于实热、痰热。',
    differentiation: '需结合舌象、症状。',
  },
  {
    id: 'rough',
    name: '涩脉',
    traditional: '涩脉主血瘀、精伤。',
    experience: '涩脉可见于气滞血瘀。',
    significance: '需活血化瘀。',
  },
]

export interface DangerPulse {
  id: string
  name: string
  features: string[]
  significance: string
  treatment?: string
}

export const dangerPulses: DangerPulse[] = [
  {
    id: 'yang-collapse',
    name: '亡阳脉象',
    features: ['脉微细欲绝：阳气将脱，最危重。', '脉浮大无根：虚阳外越，危在旦夕。'],
    significance: '阳气将脱，属急危重症。',
    treatment: '破格救心汤回阳固脱。',
  },
  {
    id: 'true-organ',
    name: '真脏脉象',
    features: ['无胃气。', '无神。', '无根。'],
    significance: '预后不良。',
    treatment: '尽力救治，坦诚告知。',
  },
  {
    id: 'yin-repelling-yang',
    name: '阴盛格阳脉象',
    features: ['脉沉微欲绝。', '但面赤身热。'],
    significance: '阴寒内盛，逼阳外浮。',
    treatment: '通脉四逆汤。',
  },
]

export interface FormulaPattern {
  id: string
  name: string
  items: { pulse: string; formula: string }[]
}

export const formulaPatterns: FormulaPattern[] = [
  {
    id: 'shaoyin',
    name: '少阴病脉象',
    items: [
      { pulse: '脉微细', formula: '四逆汤' },
      { pulse: '脉微欲绝', formula: '通脉四逆汤' },
      { pulse: '脉沉', formula: '麻黄附子细辛汤' },
    ],
  },
  {
    id: 'taiyin',
    name: '太阴病脉象',
    items: [
      { pulse: '脉缓弱', formula: '理中汤' },
      { pulse: '脉沉迟', formula: '附子理中汤' },
    ],
  },
  {
    id: 'taiyang',
    name: '太阳病脉象',
    items: [
      { pulse: '脉浮缓', formula: '桂枝汤' },
      { pulse: '脉浮紧', formula: '麻黄汤' },
    ],
  },
  {
    id: 'shaoyang',
    name: '少阳病脉象',
    items: [
      { pulse: '脉弦', formula: '小柴胡汤' },
      { pulse: '脉弦细', formula: '柴胡桂枝干姜汤' },
    ],
  },
  {
    id: 'yangming',
    name: '阳明病脉象',
    items: [
      { pulse: '脉洪大', formula: '白虎汤' },
      { pulse: '脉沉实', formula: '承气汤' },
    ],
  },
]

export interface PulseDynamicGroup {
  id: string
  title: string
  items: { label: string; description: string }[]
}

export const pulseDynamics: PulseDynamicGroup[] = [
  {
    id: 'after-medication',
    title: '服药后的脉象变化',
    items: [
      { label: '阳回脉象', description: '由沉微转为沉缓，由细弱转为有力。' },
      { label: '邪退脉象', description: '由紧弦转为缓和。' },
      { label: '恶化脉象', description: '由有力转为无力，由缓转为微。' },
    ],
  },
  {
    id: 'prognosis',
    title: '脉象与预后',
    items: [
      { label: '有胃气', description: '脉象从容和缓，预后良好。' },
      { label: '无胃气', description: '脉象弦硬紧急，预后不良。' },
      { label: '有根', description: '尺脉有力，肾气未绝。' },
      { label: '无根', description: '尺脉微弱，肾气将绝。' },
    ],
  },
]

export interface PulseCase {
  id: string
  title: string
  patient: string
  symptoms: string
  pulse: string
  pattern: string
  treatment: string
  outcome: string
}

export const pulseCases: PulseCase[] = [
  {
    id: 'case-false-yang',
    title: '医案一：假阳证的脉象',
    patient: '杨某，30 岁。',
    symptoms: '头痛项强，恶寒发热，无汗咽痛。',
    pulse: '沉细。',
    pattern: '寒邪直中少阴。',
    treatment: '麻黄附子细辛汤。',
    outcome: '服后得汗，次日痊愈。',
  },
  {
    id: 'case-yang-collapse',
    title: '医案二：亡阳脉象',
    patient: '60 岁垂死老妇。',
    symptoms: '四肢冰冷，测不到血压。',
    pulse: '微细欲绝。',
    pattern: '少阴病，阳气将脱。',
    treatment: '破格重用附子 150g 于四逆加人参汤中（原整理稿剂量，仅供文献参考）。',
    outcome: '1 小时后起死回生。',
  },
  {
    id: 'case-floating-yang',
    title: '医案三：虚阳外越脉象',
    patient: '整理稿未记姓名、年龄。',
    symptoms: '每到晚上睡觉时，脚必须放在冰上才能入睡。',
    pulse: '浮大，重按无力。',
    pattern: '虚阳外越。',
    treatment: '四逆汤。',
    outcome: '两三付药就好。',
  },
]

export const pulseBoundary = {
  sourceStatement:
    '整理稿标注信息来源为《李可老中医急危重症疑难病经验专辑》《李可医论专辑》。本页只按整理稿重排，不把整理文字冒充原书原文。',
  limitations: [
    '脉诊需要长期临床实践才能掌握。',
    '李可的脉诊经验基于其个人临床，可能有主观性。',
    '初学者需在有经验的中医师指导下学习脉诊。',
    '脉象的判读需结合四诊，不可孤立看待。',
  ],
}
