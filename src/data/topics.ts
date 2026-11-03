import { cases } from './cases'

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
    subtitle: '十问提纲、女性与儿童附问、病因诱因与记录模板；经验总结，非诊断标准。',
  },
  {
    id: 'treatment-methods',
    title: '治疗法门',
    subtitle: '虚实总纲、表里先后、寒湿水饮、实邪与阴实的处理顺序；经验总结，非处方。',
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
    subtitle: '山根、手掌、眼目、触诊与语言姿态的望诊经验；单看一处不能定病。',
  },
  {
    id: 'treatment-order',
    title: '治病先后主次',
    subtitle: '标本缓急、先后次序与治疗节奏；条文与医案待补。',
  },
  {
    id: 'moxibustion',
    title: '灸',
    subtitle: '节录倪海厦《人纪·针灸教程》第一章：隔姜灸、隔盐灸、隔蒜灸、米粒灸与灸的宜忌；原文照录，非专业勿试。',
  },
  {
    id: 'acupuncture',
    title: '针',
    subtitle: '十二经穴位速查、211 条病症常针、31 条透针透穴、下针医案，以及倪海厦人纪针灸教程；另保留石学敏醒脑开窍针法。非专业人士不要尝试。',
  },
]

export const caseTopics: Topic[] = cases.map((item) => ({
  id: item.id,
  title: item.title,
  subtitle: `${item.category} · ${item.summary}`,
}))

export const topicSections = {
  methods: {
    key: 'methods' as const,
    eyebrow: 'METHOD / 治疗法门篇',
    title: '治疗法门篇',
    lead: '把看诊、辨证、治法与记录方法拆成可检索的篇目。以下内容为经验总结，不代表绝对正确，仅供学习参考，不能替代专业诊断。',
    topics: methodTopics,
  },
  cases: {
    key: 'cases' as const,
    eyebrow: 'CASE / 医案',
    title: '医案',
    lead: '讲义临床案例原文照录：先看病人叙述与辨证，再看处方、复诊与转归。每则案例都注明讲义出处，不补写原文之外的诊断与用药。',
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
