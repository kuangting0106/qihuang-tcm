export type TopicSection = 'methods' | 'cases'

export interface Topic {
  id: string
  title: string
  subtitle: string
  note?: string
}

export const methodTopics: Topic[] = [
  {
    id: 'ten-questions',
    title: '看诊十问',
    subtitle: '问诊框架与记录模板：从寒热、汗、头身、饮食、二便等入口建立信息表。',
  },
  {
    id: 'treatment-methods',
    title: '治疗法门',
    subtitle: '治法与方药的组织方式：先辨病机，再谈治法、方药与调护。',
  },
  {
    id: 'cancer-methods',
    title: '治癌法门',
    subtitle: '专题资料栏。正文待按典籍、医案与当代文献逐条录入。',
  },
  {
    id: 'pulse',
    title: '脉诊',
    subtitle: '脉象记录、部位与对比方法；具体脉案待补。',
  },
  {
    id: 'inspection',
    title: '望诊',
    subtitle: '望神、色、形、态与舌象的观察记录；图谱与条文待补。',
  },
  {
    id: 'listening',
    title: '听诊',
    subtitle: '闻诊/听诊资料栏：声音、气息与咳嗽等信息如何记录。',
  },
  {
    id: 'treatment-order',
    title: '治病先后主次',
    subtitle: '标本缓急、先后次序与治疗节奏；条文与医案待补。',
  },
  {
    id: 'moxibustion',
    title: '灸',
    subtitle: '灸法资料栏：艾灸材料、操作、宜忌与相关医案；具体内容待按典籍与规范逐条录入。',
  },
  {
    id: 'acupuncture',
    title: '针',
    subtitle: '十二经穴位速查、211 条病症常针、31 条透针透穴、下针医案，以及倪海厦人纪针灸教程；另保留石学敏醒脑开窍针法。非专业人士不要尝试。',
  },
]

export const caseTopics: Topic[] = [
  { id: 'rheumatism', title: '风湿', subtitle: '痹证、风湿类医案与按语。' },
  { id: 'exterior', title: '表证', subtitle: '外感表证的辨证、治法与医案。' },
  { id: 'stomach-intestine', title: '肠胃', subtitle: '脾胃、肠胃类医案与按语。' },
  { id: 'lung', title: '肺篇', subtitle: '肺系病证的医案与按语。' },
  { id: 'heart-chest', title: '心胸', subtitle: '心胸闷痛、心悸类医案。' },
  { id: 'abdomen', title: '腹篇', subtitle: '腹痛、腹满、痞块类医案。' },
  { id: 'retained-fluid', title: '积饮病', subtitle: '痰饮、积饮类医案与按语。' },
  { id: 'wasting-thirst', title: '消渴', subtitle: '消渴类医案与按语。' },
  { id: 'water-disease', title: '水病', subtitle: '水肿、水气病类医案。' },
  { id: 'dysentery', title: '痢篇', subtitle: '痢疾类医案与按语。' },
  { id: 'abscess', title: '脓疡', subtitle: '痈疽、脓疡类医案。' },
  { id: 'gynecology', title: '孕妇科', subtitle: '妇科、妊娠相关医案。' },
  { id: 'andrology', title: '男科', subtitle: '男科相关医案与按语。' },
  { id: 'mental', title: '精神', subtitle: '精神情志类医案与按语；具体内容待按原文录入。' },
]

export const topicSections = {
  methods: {
    key: 'methods' as const,
    eyebrow: 'METHOD / 治疗法门篇',
    title: '治疗法门篇',
    lead: '把看诊、辨证、治法与记录方法拆成可检索的篇目。第一版先立栏目与出处字段，正文逐条录入。',
    topics: methodTopics,
  },
  cases: {
    key: 'cases' as const,
    eyebrow: 'CASE / 医案',
    title: '医案',
    lead: '按病类整理医案：先看症状与病机，再看治法、方药与转归。每则医案都必须回到原文出处。',
    topics: caseTopics,
  },
}

export function getTopicSection(key: string) {
  return key === 'cases' ? topicSections.cases : topicSections.methods
}

export function findTopic(sectionKey: string, id: string) {
  const section = getTopicSection(sectionKey)
  return section.topics.find((t) => t.id === id) ?? null
}
