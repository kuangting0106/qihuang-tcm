import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const tutorialPath = path.join(root, 'src', 'data', 'acupuncture-tutorial.json')
const outPath = path.join(root, 'src', 'data', 'moxibustion.json')

const tutorial = JSON.parse(fs.readFileSync(tutorialPath, 'utf8'))
const chapter = tutorial.chapters.find((item) => item.title.includes('针灸的使用时机'))
const section = chapter?.sections.find((item) => item.title.includes('针灸的使用时机'))
if (!section) throw new Error('未找到“针灸的使用时机”章节')

const topic = (title) => {
  const found = section.topics.find((item) => item.title === title)
  if (!found) throw new Error(`未找到灸法小节：${title}`)
  return found
}

const ginger = topic('隔姜灸')
const salt = topic('隔盐灸')
const garlic = topic('隔蒜灸')
const rice = topic('米粒灸')

const intro = section.intro
const whyStart = intro[1].indexOf('灸呢？')
if (whyStart < 0) throw new Error('未找到“灸呢？”段落')

const garlicContraindicationStart = garlic.paragraphs[7].indexOf('一般热症不用灸法。')
if (garlicContraindicationStart < 0) throw new Error('未找到灸法禁忌段落')
const songEndMarker = '历代就一直就是这样子。'
const songEnd = garlic.paragraphs[8].indexOf(songEndMarker)
if (songEnd < 0) throw new Error('未找到针灸禁忌歌诀结尾')

const data = {
  generatedAt: new Date().toISOString(),
  source: {
    work: '倪海厦人纪系列之针灸教程',
    chapter: '第一章 针灸的使用时机',
    pages: '11–13',
    note: '节录自《倪海厦人纪系列之针灸教程》第一章“针灸的使用时机”，仅收灸法段落；原文按讲义顺序保留，未改写。针刺、急救与火罐内容见针灸教程。',
  },
  warning: {
    title: '先读安全提示',
    body: '艾灸有烫伤风险。本页仅节录讲义原文，供学习与查考，非专业者请勿自行施灸。',
  },
  facts: [
    { label: '灸材', value: '艾绒' },
    { label: '壮数', value: '灸单不灸双' },
    { label: '火候', value: '痛灸到不痛止，不痛灸到痛止' },
    { label: '禁灸', value: '热症、多汗处、眼、阴部、痔疮' },
  ],
  sections: [
    {
      id: 'why',
      no: '01',
      title: '为什么用灸',
      subtitle: '针力不足，气血大虚',
      page: 11,
      lead: '讲义先说艾草与艾绒，再说明什么时候该用灸。',
      paragraphs: [intro[1].slice(whyStart), intro[2]],
    },
    {
      id: 'ginger',
      no: '02',
      title: '隔姜灸',
      subtitle: '生姜垫艾，温热即换',
      page: 11,
      lead: '以生姜片隔艾施灸，讲义列其操作、壮数与灸后反应。',
      paragraphs: ginger.paragraphs,
    },
    {
      id: 'salt',
      no: '03',
      title: '隔盐灸',
      subtitle: '青盐填脐，寒利热利',
      page: 12,
      lead: '以炒熟青盐填神阙，讲义说明盐温与下利用法。',
      paragraphs: salt.paragraphs,
    },
    {
      id: 'garlic',
      no: '04',
      title: '隔蒜灸',
      subtitle: '久咳、虫咬与疱疹',
      page: 12,
      lead: '以蒜隔艾，讲义用于肺系咳嗽、毒虫咬伤、破伤风与疱疹。',
      paragraphs: [
        ...garlic.paragraphs.slice(0, 7),
        garlic.paragraphs[7].slice(0, garlicContraindicationStart),
      ],
    },
    {
      id: 'rice',
      no: '05',
      title: '米粒灸',
      subtitle: '小炷直接灸',
      page: 13,
      lead: '艾绒如米粒大，讲义说明取穴、点灸与“痛灸到不痛止”的原则。',
      paragraphs: [rice.paragraphs[0]],
    },
    {
      id: 'caution',
      no: '06',
      title: '灸的宜忌',
      subtitle: '热症、头面与阴部',
      page: 13,
      lead: '讲义列不宜施灸的部位与情形，并附针灸禁忌歌诀。',
      paragraphs: [
        garlic.paragraphs[7].slice(garlicContraindicationStart),
        garlic.paragraphs[8].slice(0, songEnd + songEndMarker.length),
      ],
    },
  ],
}

fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8')
console.log(
  `Wrote moxibustion: ${data.sections.length} sections, ${data.sections.reduce(
    (sum, item) => sum + item.paragraphs.join('').length,
    0,
  )} chars`,
)
