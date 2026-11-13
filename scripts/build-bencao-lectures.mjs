import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pinyin } from 'pinyin-pro'
import { canonicalName, herbAliasGroups } from './content/herb-aliases.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = path.join(root, 'scripts', 'content', 'bencao-lectures')
const outDir = path.join(root, 'public', 'data', 'bencao-lectures')

const SOURCE = {
  id: 'nihaixia-bencao',
  title: '倪海厦《神农本草经》讲义',
  author: '倪海厦',
  course: '人纪 · 神农本草经',
  repository: '9527qingfeng/hantang-nihaixia-follower',
  commit: 'bb24f93c2d0e6db00643eec4d275aff39ac9bb8d',
  sourcePath: '倪海厦/人纪-3-神农本草经',
  note:
    '讲义整理本，非《神农本草经》校勘本。原文、历代注家、讲义归纳与课堂讲授分层标注；条文与注文未经校勘，引用请回原书核对。',
}

const GROUP_DEFS = [
  {
    id: 'intro',
    dir: '导读',
    title: '讲义导读',
    subtitle: '自序 · 前言 · 药性总义',
    description:
      '倪海厦《神农本草经》课程的开篇与药性总纲。此组为讲义正文，不是《本经》原文。',
  },
  {
    id: 'shangjing',
    dir: '上经',
    title: '上经',
    subtitle: '上药养命',
    description:
      '上药共一百二十种，为君主养命以应天，皆无毒，多服久服不伤人；欲轻身益气、不老延年者，本于上经。',
  },
  {
    id: 'zhongjing',
    dir: '中经',
    title: '中经',
    subtitle: '中药遏病',
    description:
      '中药共一百二十种，为臣，主养性以应人，有毒无毒斟酌其宜；欲遏病补虚羸者，本于中经。',
  },
  {
    id: 'xiajing',
    dir: '下经',
    title: '下经',
    subtitle: '下药除邪',
    description:
      '下药共一百二十五种，为佐使，主治病以应地，多毒不可久服；欲除寒热邪气、破积聚、愈疾者，本于下经。',
  },
  {
    id: 'nishi',
    dir: '倪师补充药物',
    title: '倪师补充药物',
    subtitle: '《伤寒》《金匮》所用而《本经》未收',
    description:
      '倪海厦按：以下药物原不见于《神农本草经》，但张仲景《伤寒论》《金匮要略》中有使用，另列并附使用说明。',
  },
  {
    id: 'editor',
    dir: '小编补充药物',
    title: '小编补充药物',
    subtitle: '整理者增补 · 非倪师原讲义',
    description:
      '课程整理者增补的常用药，不属于倪海厦原讲义正文；阅读时与倪师讲授内容分开看待。',
  },
  {
    id: 'yaoxing',
    dir: '药性总论',
    title: '药性总论',
    subtitle: '增广和剂局方药性总论',
    description:
      '元·佚名辑，按玉石、草、木、人、兽、禽、虫鱼、果、米谷、菜等部类汇录药性主治；原文照录，供文献学习。',
  },
]

// 现代罕用、基原待考或已不再使用的条目，按整理要求从讲义目录中隐藏；
// 源 Markdown 保留备查，不删除原始资料。
const HIDDEN_ENTRY_IDS = new Set([
  'shangjing-089', // 别羁
  'shangjing-090', // 屈草
  'shangjing-091', // 淮木
  'zhongjing-151', // 孔公孽
  'zhongjing-152', // 殷孽
  'zhongjing-154', // 理石
  'zhongjing-155', // 长石
  'zhongjing-156', // 肤青
  'zhongjing-158', // 枲耳实（今名苍耳子）
  'zhongjing-217', // 白棘
  'zhongjing-222', // 白马茎
  'zhongjing-226', // 牡狗阴茎（今名狗鞭）
  'zhongjing-229', // 燕屎
  'zhongjing-230', // 天鼠屎
  'zhongjing-235', // 蚱蝉
  'zhongjing-236', // 蛴螬
  'zhongjing-241', // 蛞蝓
  'zhongjing-243', // 木虻（今名虻虫）
  'zhongjing-244', // 虻虫（木虻今名）
  'zhongjing-251', // 黍米（今名黄米）
  'zhongjing-252', // 蓼实
  'zhongjing-253', // 葱实（今名葱子）
  'xiajing-262', // 冬灰
  'xiajing-280', // 恒山（今名常山）
  'xiajing-285', // 雚菌
  'xiajing-289', // 茵芋
  'xiajing-299', // 鬼臼
  'xiajing-301', // 女青
  'xiajing-303', // 蔺茹
  'xiajing-304', // 乌韭
  'xiajing-305', // 鹿藿
  'xiajing-308', // 陆英（今名接骨草）
  'xiajing-310', // 牛扁
  'xiajing-323', // 古南（石南）
  'xiajing-324', // 黄环
  'xiajing-325', // 溲疏
  'xiajing-328', // 栾花
  'xiajing-329', // 蔓椒
  'xiajing-330', // 豚卵
  'xiajing-331', // 麋脂
  'xiajing-332', // （鼯）鼠
  'xiajing-333', // 六畜毛蹄甲
  'xiajing-334', // 虾蟆
  'xiajing-335', // 马刀
  'xiajing-347', // 马陆
  'xiajing-348', // 地胆
  'xiajing-349', // 鼠妇
  'xiajing-350', // 萤火（今名萤火虫）
])

const ORIGINAL_LABELS = new Set(['本经原文', '本经', '本草原文', '本绖原文', '原经文'])
const NISHI_LABELS = new Set(['倪注', '倪师用法'])
const STUDY_LABELS = new Set([
  '产地',
  '产池',
  '性味',
  '主治',
  '主冶',
  '效用',
  '用量',
  '剂量',
  '禁忌',
  '炮制',
  '泡制',
  '别名',
  '复方',
  '附方',
  '附录',
  '括要',
  '药性',
  '各家论述',
  '著名方剂',
  '臓器',
  '附加菊叶',
  '酒制',
])

const KIND_LABELS = {
  original: '原文',
  commentary: '后世注家',
  study: '讲义归纳',
  nishi: '倪师按',
  lecture: '课堂讲授',
  lesson: '讲义',
}

function classify(label) {
  if (ORIGINAL_LABELS.has(label)) return 'original'
  if (NISHI_LABELS.has(label)) return 'nishi'
  if (STUDY_LABELS.has(label)) return 'study'
  return 'commentary'
}

function clean(text) {
  return text.replace(/\u0000/g, '').replace(/[ \t]+$/gm, '').trim()
}

function makeSection(label, kind, blocks) {
  if (!blocks.length) return null
  return { label, kind, kindLabel: KIND_LABELS[kind], blocks }
}

function parseMarkdown(text, { intro = false } = {}) {
  const lines = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').split('\n')
  let title = ''
  const sections = []
  let current = null
  let blocks = []
  let buffer = null

  const flushBuffer = () => {
    if (!buffer) return
    const value = clean(buffer.lines.join('\n'))
    if (value) blocks.push({ type: buffer.type, text: value })
    buffer = null
  }

  const flushSection = () => {
    flushBuffer()
    const section = makeSection(current?.label ?? '', current?.kind ?? (intro ? 'lesson' : 'lecture'), blocks)
    if (section) sections.push(section)
    blocks = []
  }

  const startSection = (label, kind) => {
    flushSection()
    current = { label, kind }
  }

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, '')
    const h2 = line.match(/^##\s+(.+)$/)
    const h4 = line.match(/^####\s+(.+)$/)

    if (h2 && !title) {
      title = clean(h2[1])
      continue
    }

    if (h4) {
      const heading = clean(h4[1])
      const bracket = heading.match(/^【([^】]+)】/)
      if (bracket) {
        const label = clean(bracket[1])
        startSection(label, intro ? 'lesson' : classify(label))
        const rest = clean(heading.slice(bracket[0].length))
        if (rest) {
          blocks.push({ type: 'p', text: rest })
        }
      } else {
        startSection(heading, intro ? 'lesson' : 'lecture')
      }
      continue
    }

    if (h2) {
      startSection(clean(h2[1]), intro ? 'lesson' : 'lecture')
      continue
    }

    if (!line.trim()) {
      flushBuffer()
      continue
    }

    if (line.startsWith('>')) {
      const content = line.replace(/^>\s?/, '')
      if (buffer?.type === 'quote') {
        buffer.lines.push(content)
      } else {
        flushBuffer()
        buffer = { type: 'quote', lines: [content] }
      }
      continue
    }

    if (buffer?.type === 'p') {
      buffer.lines.push(line.trim())
    } else {
      flushBuffer()
      buffer = { type: 'p', lines: [line.trim()] }
    }
  }

  flushSection()

  if (!title) {
    const first = sections[0]?.blocks.find((b) => b.type === 'p')
    title = first ? first.text.slice(0, 18) : '未题'
  }

  if (!sections.length) {
    sections.push(makeSection('', intro ? 'lesson' : 'lecture', []))
  }

  return { title, sections: sections.filter(Boolean) }
}

function countChars(sections) {
  let total = 0
  for (const section of sections) {
    for (const block of section.blocks) total += block.text.length
  }
  return total
}

const FLAVOR_ORDER = ['辛', '甘', '酸', '苦', '咸', '淡', '涩']

const profilesFile = path.join(root, 'scripts', 'content', 'bencao-profiles.json')
const profiles = fs.existsSync(profilesFile)
  ? JSON.parse(fs.readFileSync(profilesFile, 'utf8'))
  : { items: {} }

const creditsFile = path.join(root, 'scripts', 'content', 'herb-image-credits.json')
const imageCredits = fs.existsSync(creditsFile)
  ? JSON.parse(fs.readFileSync(creditsFile, 'utf8')).items ?? []
  : []
const imageByName = new Map(imageCredits.map((item) => [item.name, item]))

const extraAliasesFile = path.join(root, 'scripts', 'content', 'bencao-extra-aliases.json')
const extraAliases = fs.existsSync(extraAliasesFile)
  ? JSON.parse(fs.readFileSync(extraAliasesFile, 'utf8'))
  : {}

function buildImages(name) {
  const credit = imageByName.get(name) ?? imageByName.get(canonicalName(name))
  if (!credit) return []
  const list = credit.images?.length
    ? credit.images
    : [
        {
          file: credit.file,
          alt: `${canonicalName(name)}（${credit.latin}）`,
          credit: credit.credit,
          license: credit.license,
          sourceUrl: credit.sourceUrl,
        },
      ]
  return list.map((item) => ({
    url: item.file,
    alt: item.alt ?? `${canonicalName(name)}（${credit.latin}）`,
    credit: item.credit ?? credit.credit,
    license: item.license ?? credit.license,
    sourceUrl: item.sourceUrl ?? credit.sourceUrl ?? '',
    latin: credit.latin,
    ...(item.kind ? { kind: item.kind } : {}),
  }))
}

const imageForEntry = (name) => {
  const images = buildImages(name)
  return { image: images[0] ?? null, images }
}

const MERIDIAN_MAP = {
  心包: { id: 'pericardium', name: '手厥阴心包经' },
  心: { id: 'heart', name: '手少阴心经' },
  肝: { id: 'liver', name: '足厥阴肝经' },
  脾: { id: 'spleen', name: '足太阴脾经' },
  肺: { id: 'lung', name: '手太阴肺经' },
  肾: { id: 'kidney', name: '足少阴肾经' },
  胃: { id: 'stomach', name: '足阳明胃经' },
  胆: { id: 'gallbladder', name: '足少阳胆经' },
  膀胱: { id: 'bladder', name: '足太阳膀胱经' },
  大肠: { id: 'large-intestine', name: '手阳明大肠经' },
  小肠: { id: 'small-intestine', name: '手太阳小肠经' },
  三焦: { id: 'triple-burner', name: '手少阳三焦经' },
}

const PINYIN_FIXES = {
  白术: 'bái zhú',
  苍术: 'cāng zhú',
  黄芩: 'huáng qín',
  栀子: 'zhī zǐ',
  枳实: 'zhǐ shí',
  枳壳: 'zhǐ ké',
  桔梗: 'jié gěng',
  茜根: 'qiàn gēn',
  秦艽: 'qín jiāo',
  阿胶: 'ē jiāo',
  龟甲: 'guī jiǎ',
  牡蛎: 'mǔ lì',
  菟丝子: 'tù sī zǐ',
  川芎: 'chuān xiōng',
  芎穷: 'xiōng qióng',
  荨麻: 'qián má',
  大枣: 'dà zǎo',
  枸杞: 'gǒu qǐ',
  厚朴: 'hòu pò',
  萆薢: 'bì xiè',
  射干: 'yè gān',
  藿香: 'huò xiāng',
  熟地黄: 'shú dì huáng',
  干地黄: 'gān dì huáng',
}

function pinyinFor(name) {
  if (PINYIN_FIXES[name]) return PINYIN_FIXES[name]
  try {
    return pinyin(name, { toneType: 'symbol', type: 'array' }).join(' ')
  } catch {
    return ''
  }
}

function normalizeMeridians(list) {
  const result = []
  for (const raw of list ?? []) {
    const text = String(raw).replace(/\s/g, '')
    for (const [organ, target] of Object.entries(MERIDIAN_MAP)) {
      if (text.includes(organ) && !result.some((item) => item.id === target.id)) {
        result.push(target)
      }
    }
  }
  return result
}

function sectionText(entry, labels) {
  const names = Array.isArray(labels) ? labels : [labels]
  const section = entry.sections.find((s) => names.includes(s.label))
  if (!section) return ''
  return section.blocks
    .filter((b) => b.type === 'p')
    .map((b) => b.text)
    .join(' ')
    .trim()
}

function extractFlavors(text) {
  if (!text) return []
  return FLAVOR_ORDER.filter((flavor) => text.includes(flavor))
}

function extractNature(text) {
  if (!text) return ''
  const match = text.match(/(大寒|微寒|大热|微温|温|寒|凉|热|平)/)
  return match ? match[1] : ''
}

function extractAliases(entry) {
  const text = sectionText(entry, '别名')
  if (!text) return []
  return text
    .split(/[、，,；;\s]+/)
    .map((item) => item.replace(/^别名[:：]?/, '').trim())
    .filter((item) => item && item.length <= 12)
    .slice(0, 8)
}

function originalText(entry) {
  return sectionText(entry, ['本经原文', '本经', '本草原文', '本绖原文', '原经文'])
}

function extractIndication(text) {
  if (!text) return ''
  const match = text.match(/主([^。；]{2,70})/)
  return match ? `主${match[1]}` : ''
}

function firstParagraph(entry) {
  for (const section of entry.sections) {
    const paragraph = section.blocks.find((block) => block.type === 'p' && block.text.trim())
    if (paragraph) return paragraph.text.trim()
  }
  return ''
}

function buildProfile(entry) {
  const record =
    profiles.items?.[entry.title] ?? profiles.items?.[canonicalName(entry.title)]
  const flavorText = sectionText(entry, '性味')
  const original = originalText(entry)
  const lectureFlavors = [
    ...extractFlavors(flavorText),
    ...extractFlavors(original.slice(0, 80)),
  ]
  const recordFlavors = (record?.flavor ?? '').split('').filter((char) => FLAVOR_ORDER.includes(char))
  const flavorTags = FLAVOR_ORDER.filter((flavor) =>
    [...lectureFlavors, ...recordFlavors].includes(flavor),
  )
  const nature =
    extractNature(flavorText) || extractNature(original.slice(0, 80)) || record?.nature || ''
  const meridians = normalizeMeridians(record?.meridians ?? [])
  const lectureEffects = sectionText(entry, ['主治', '主冶', '效用', '倪师用法'])
  const fallback = firstParagraph(entry)
  const effects =
    lectureEffects || record?.action || extractIndication(original) || fallback.slice(0, 100)
  const indications = extractIndication(original) || extractIndication(effects) || effects
  const contraindications = sectionText(entry, '禁忌') || record?.contraindication || ''

  const usedLecture = Boolean(flavorText || original || lectureEffects || fallback)
  const usedRecord = Boolean(
    record &&
      ((!extractFlavors(flavorText).length && recordFlavors.length) ||
        (!extractNature(flavorText) && record.nature) ||
        meridians.length ||
        (!lectureEffects && record.action) ||
        (!contraindications && record.contraindication)),
  )

  return {
    flavorTags,
    nature,
    meridianIds: meridians.map((item) => item.id),
    meridianNames: meridians.map((item) => item.name),
    effects,
    indications,
    contraindications,
    dosage: record?.dosage ?? '',
    meridianPending: meridians.length === 0,
    therapyCategoryIds: record?.therapyCategoryIds ?? [],
    sourceCategory: record?.sourceCategory ?? '',
    sources: [...(usedLecture ? ['讲义原文'] : []), ...(usedRecord ? ['中医Buddy 中药数据'] : [])],
  }
}

const RANK_BY_GROUP = {
  shangjing: 'upper',
  zhongjing: 'middle',
  xiajing: 'lower',
  nishi: 'nishi',
  editor: 'editor',
}

const CURATED_IDS = {
  甘草: 'gancao',
  桂枝: 'guizhi',
  白芍: 'baishao',
  生姜: 'shengjiang',
  大枣: 'dazao',
  柴胡: 'chaihu',
  黄芩: 'huangqin',
  半夏: 'banxia',
  人参: 'renshen',
}

const TITLE_FIXES = {
  'shangjing-30': {
    title: '防葵',
    note: '底稿标题误题“女萎”，正文为防葵；据文件名与条文校正。',
  },
}

// 原稿中冷僻、基原待考或与他条内容交叉的条目，保留全文，并在条目页说明。
const ENTRY_NOTES = {
  'shangjing-29': '原题“女萎”。讲义原文明确：女萎又称玉竹，现以玉竹为正名；到药房抓药写玉竹。',
  'shangjing-54': '蘼芜为川芎之苗，川芎用根；经方少用，原书条文保留备考。',
  'shangjing-87': '青蘘为胡麻（脂麻）之叶，种子名胡麻子；现代多以黑芝麻入药。',
  'zhongjing-156': '仅存《本经》条文，基原与今日商品名待考。',
  'zhongjing-222': '仅存《本经》条文，现代临床少用，保留备考。',
  'zhongjing-224': '本条兼录牛黄、牛角鳃、牛髓、牛胆；牛黄另见上经，内容有重复。',
  'xiajing-338': '仅存《本经》条文，基原待考。',
  'nishi-7': '大苏为大苏叶、大苏梗、大苏子的简称，均指紫苏。',
}

function readGroup(def) {
  const dir = path.join(sourceDir, def.dir)
  const entries = []

  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.md')) continue
    const base = name.replace(/\.md$/, '')

    if (/^0\./.test(base)) continue

    const numberMatch = base.match(/^(\d+)\./)
    const number = numberMatch ? Number(numberMatch[1]) : null
    const entryId = `${def.id}-${number !== null ? String(number).padStart(3, '0') : ''}`
    if (number !== null && HIDDEN_ENTRY_IDS.has(entryId)) continue

    const text = fs.readFileSync(path.join(dir, name), 'utf8')
    const parsed = parseMarkdown(text, { intro: def.id === 'intro' })
    const fix = number !== null ? TITLE_FIXES[`${def.id}-${number}`] : null
    const fileTitle = base.replace(/^\d+\./, '')
    const title = fix?.title ?? (def.id === 'intro' ? fileTitle : parsed.title)

    const entry = {
      id: `${def.id}-${number !== null ? String(number).padStart(3, '0') : String(entries.length + 1).padStart(3, '0')}`,
      groupId: def.id,
      number,
      title,
      subtitle:
        def.id === 'intro'
          ? '讲义导读'
          : number !== null
            ? `${def.title} · 第 ${number} 味`
            : def.title,
      charCount: countChars(parsed.sections),
      sections: parsed.sections,
    }
    const note = fix?.note ?? (number !== null ? ENTRY_NOTES[`${def.id}-${number}`] : '')
    if (note) entry.note = note
    if (def.id !== 'intro') {
      entry.pinyin = pinyinFor(title)
      entry.profile = buildProfile(entry)
      const gallery = imageForEntry(title)
      if (gallery.image) {
        entry.image = gallery.image
        if (gallery.images.length > 1) entry.images = gallery.images
      }
    }
    entries.push(entry)
  }

  entries.sort((a, b) => {
    if (a.number === null && b.number === null) return a.id.localeCompare(b.id)
    if (a.number === null) return -1
    if (b.number === null) return 1
    return a.number - b.number
  })

  return { ...def, entries }
}

const RANK_PRIORITY = { shangjing: 0, zhongjing: 1, xiajing: 2, nishi: 3, editor: 4, yaoxing: 5 }
const entryRedirects = {}

// 源稿中的冷僻条目不再整条删除；保留全文，由 ENTRY_NOTES 说明基原与使用情况。
function mergeAliasEntries(groups) {
  const buckets = new Map()
  for (const group of groups) {
    if (group.id === 'intro') continue
    for (const entry of group.entries) {
      const canonical = canonicalName(entry.title)
      if (!buckets.has(canonical)) buckets.set(canonical, [])
      buckets.get(canonical).push(entry)
    }
  }

  const mergedByGroup = new Map()
  for (const [canonical, list] of buckets) {
    list.sort((a, b) => {
      const rankDiff = (RANK_PRIORITY[a.groupId] ?? 9) - (RANK_PRIORITY[b.groupId] ?? 9)
      if (rankDiff) return rankDiff
      return (a.number ?? 9999) - (b.number ?? 9999)
    })

    const primary = list[0]
    const aliasSet = new Set(primary.alsoKnownAs ?? [])
    const groupAliases = herbAliasGroups.find((item) => item.canonical === canonical)?.aliases ?? []
    for (const alias of groupAliases) aliasSet.add(alias)

    for (const other of list.slice(1)) {
      entryRedirects[`${other.groupId}:${other.id}`] = {
        groupId: primary.groupId,
        entryId: primary.id,
        name: canonical,
      }
      aliasSet.add(other.title)
      for (const alias of other.alsoKnownAs ?? []) aliasSet.add(alias)
      for (const section of other.sections) {
        primary.sections.push({
          ...section,
          label: section.label ? `${other.title} · ${section.label}` : `${other.title} · 正文`,
        })
      }
      primary.charCount += other.charCount
    }

    if (primary.title !== canonical) primary.ancientName = primary.title
    primary.title = canonical
    primary.canonicalName = canonical
    for (const alias of extraAliases[canonical] ?? []) aliasSet.add(alias)
    primary.alsoKnownAs = [...aliasSet].filter((name) => name && name !== canonical)
    primary.pinyin = pinyinFor(canonical)
    if (!mergedByGroup.has(primary.groupId)) mergedByGroup.set(primary.groupId, [])
    mergedByGroup.get(primary.groupId).push(primary)
  }

  for (const group of groups) {
    if (group.id === 'intro') continue
    group.entries = (mergedByGroup.get(group.id) ?? []).sort((a, b) => {
      if (a.number === null && b.number === null) return a.id.localeCompare(b.id)
      if (a.number === null) return -1
      if (b.number === null) return 1
      return a.number - b.number
    })
  }
  return groups
}

const groups = mergeAliasEntries(GROUP_DEFS.map(readGroup))
const all = groups.flatMap((g) => g.entries)

const errors = []
for (const group of groups) {
  if (!group.entries.length) errors.push(`${group.id}: 没有条目`)
  for (const entry of group.entries) {
    if (!entry.title) errors.push(`${entry.id}: 缺少标题`)
    if (!entry.sections.length) errors.push(`${entry.id}: 没有内容`)
    if (!entry.charCount) errors.push(`${entry.id}: 字数为 0`)
    for (const section of entry.sections) {
      for (const block of section.blocks) {
        if (/<[a-z][^>]*>/i.test(block.text)) errors.push(`${entry.id}: 残留 HTML`)
        if (/\u0000|\u0007/.test(block.text)) errors.push(`${entry.id}: 残留控制字符`)
      }
    }
  }
}

const EXPECTED_MIN = { intro: 5, shangjing: 130, zhongjing: 90, xiajing: 70, nishi: 25, editor: 30 }
for (const [id, count] of Object.entries(EXPECTED_MIN)) {
  const actual = groups.find((g) => g.id === id)?.entries.length ?? 0
  if (actual < count) errors.push(`${id}: 条目数少于 ${count}，实际 ${actual}`)
}

if (errors.length) {
  console.error('神农本草经讲义整理失败：')
  for (const error of errors) console.error('  - ' + error)
  process.exit(1)
}

fs.mkdirSync(outDir, { recursive: true })

const catalogItems = groups
  .filter((group) => group.id !== 'intro' && group.id !== 'yaoxing')
  .flatMap((group) =>
    group.entries.map((entry) => {
      const flavorText = sectionText(entry, '性味')
      const mainText = sectionText(entry, ['主治', '主冶', '效用'])
      const processingText = sectionText(entry, ['炮制', '泡制'])
      const profile = entry.profile
      const item = {
        key: `${group.id}:${entry.id}`,
        name: entry.title,
        ancientName: entry.ancientName,
        pinyin: entry.pinyin,
        groupId: group.id,
        entryId: entry.id,
        rankId: RANK_BY_GROUP[group.id],
        number: entry.number,
        flavorTags: profile.flavorTags,
        nature: profile.nature,
        meridianIds: profile.meridianIds,
        meridianNames: profile.meridianNames,
        effects: profile.effects,
        indications: profile.indications,
        contraindications: profile.contraindications,
        summary: (profile.effects || mainText).replace(/^主治[:：]?/, '').slice(0, 120),
        charCount: entry.charCount,
        hasProcessing: Boolean(processingText),
        aliases: [
          ...new Set([
            ...(entry.alsoKnownAs ?? []),
            ...extractAliases(entry),
            ...(extraAliases[entry.title] ?? []),
          ]),
        ],
        alsoKnownAs: entry.alsoKnownAs ?? [],
        meridianPending: profile.meridianPending,
        therapyCategoryIds: profile.therapyCategoryIds,
        sourceCategory: profile.sourceCategory,
        image: entry.image,
        images: entry.images,
        profileSources: profile.sources,
      }
      if (processingText) item.processingText = processingText
      if (CURATED_IDS[entry.title]) item.curatedId = CURATED_IDS[entry.title]
      return item
    }),
  )

const generatedAt = new Date().toISOString()

const catalog = {
  generatedAt,
  source: SOURCE,
  total: catalogItems.length,
  threeRanks: catalogItems.filter((item) => ['upper', 'middle', 'lower'].includes(item.rankId))
    .length,
  ranks: [
    { id: 'upper', title: '上经', subtitle: '上药养命', count: catalogItems.filter((i) => i.rankId === 'upper').length },
    { id: 'middle', title: '中经', subtitle: '中药遏病', count: catalogItems.filter((i) => i.rankId === 'middle').length },
    { id: 'lower', title: '下经', subtitle: '下药除邪', count: catalogItems.filter((i) => i.rankId === 'lower').length },
    { id: 'nishi', title: '倪师补充', subtitle: '经方所用而《本经》未收', count: catalogItems.filter((i) => i.rankId === 'nishi').length },
    { id: 'editor', title: '小编补充', subtitle: '整理者增补 · 非倪师原讲义', count: catalogItems.filter((i) => i.rankId === 'editor').length },
  ],
  items: catalogItems,
}

if (catalog.total < 360 || catalog.threeRanks < 300) {
  console.error(
    `本草讲义目录条数异常：total=${catalog.total}，threeRanks=${catalog.threeRanks}`,
  )
  process.exit(1)
}

fs.writeFileSync(path.join(outDir, 'catalog.json'), JSON.stringify(catalog) + '\n', 'utf8')

const index = {
  generatedAt,
  source: SOURCE,
  groups: groups.map((g) => ({
    id: g.id,
    title: g.title,
    subtitle: g.subtitle,
    description: g.description,
    count: g.entries.length,
    charCount: g.entries.reduce((sum, e) => sum + e.charCount, 0),
  })),
  intro: groups
    .find((g) => g.id === 'intro')
    .entries.map((e) => ({ id: e.id, title: e.title, subtitle: e.subtitle, charCount: e.charCount })),
  entryRedirects,
}

fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index, null, 2) + '\n', 'utf8')

for (const group of groups) {
  const payload = {
    id: group.id,
    title: group.title,
    subtitle: group.subtitle,
    description: group.description,
    entries: group.entries,
  }
  fs.writeFileSync(path.join(outDir, `${group.id}.json`), JSON.stringify(payload) + '\n', 'utf8')
}

const totalChars = all.reduce((sum, e) => sum + e.charCount, 0)
console.log(
  `Wrote bencao lectures: ${groups.length} groups, ${all.length} entries, ${totalChars.toLocaleString('en-US')} chars`,
)
for (const group of groups) {
  console.log(`  ${group.title}: ${group.entries.length} 条`)
}
console.log(
  `  profiles: flavor ${catalogItems.filter((i) => i.flavorTags.length).length}, ` +
    `nature ${catalogItems.filter((i) => i.nature).length}, ` +
    `meridians ${catalogItems.filter((i) => i.meridianIds.length).length}, ` +
    `meridianPending ${catalogItems.filter((i) => i.meridianPending).length}`,
)
