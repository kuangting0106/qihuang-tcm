#!/usr/bin/env node
/**
 * 构建「医藏古籍」独立库。
 *
 * 数据源：F:\中医\8CE88F\%E5%8C%BB%E8%97%8F（598 本 Markdown，排除《本草纲目》目录本）
 * 产物：
 *   scripts/content/classic-library-index.json  分类、书目元数据
 *   data/classic-library.db                     独立 SQLite 库，按书/篇按需读取
 *
 * 用法：
 *   node scripts/build-classic-library.mjs --index-only
 *   node scripts/build-classic-library.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { loadExtraTxtBooks } from './extra-txt-classics.mjs'

const ROOT = process.cwd()
const SOURCE_DIR =
  process.env.QIHUANG_LIBRARY_DIR ??
  'F:\\中医\\8CE88F\\%E5%8C%BB%E8%97%8F'
const INDEX_FILE = path.join(ROOT, 'scripts', 'content', 'classic-library-index.json')
const DB_FILE =
  process.env.QIHUANG_LIBRARY_DB_FILE ??
  path.join(ROOT, 'data', 'classic-library.db')
const INDEX_ONLY = process.argv.includes('--index-only')
const EXCLUDED_TITLES = new Set(['本草纲目'])
const SHORT_LIMIT = 5000

const CATEGORY_DEFS = [
  {
    key: 'yijing',
    label: '医经',
    description: '内经、难经、太素等中医理论根柢。',
    subs: [
      ['suwen', '素问'],
      ['lingshu', '灵枢'],
      ['nanjing', '难经'],
      ['taisu', '太素'],
      ['leijing', '类经'],
      ['other', '其他医经'],
    ],
  },
  {
    key: 'shanghan',
    label: '伤寒金匮',
    description: '《伤寒论》《金匮要略》及历代注本、方论。',
    subs: [
      ['shanghan', '伤寒'],
      ['jingui', '金匮'],
      ['other', '其他'],
    ],
  },
  {
    key: 'bencao',
    label: '本草',
    description: '本草经、综合本草、炮制与药性歌诀。',
    subs: [
      ['bencaojing', '本草经'],
      ['comprehensive', '综合本草'],
      ['paozhi', '炮制'],
      ['gejue', '药性歌诀'],
    ],
  },
  {
    key: 'fangshu',
    label: '方书',
    description: '方论、方剂歌诀、验方单方与大型方书。',
    subs: [
      ['fanglun', '方论'],
      ['gejue', '方剂歌诀'],
      ['yanfang', '验方单方'],
      ['large', '大型方书'],
    ],
  },
  {
    key: 'zhenfa',
    label: '诊法',
    description: '脉诊、舌诊、望诊与四诊综合。',
    subs: [
      ['maizhen', '脉诊'],
      ['shezhen', '舌诊'],
      ['wangzhen', '望诊'],
      ['other', '四诊综合'],
    ],
  },
  {
    key: 'zhenjiu',
    label: '针灸经络',
    description: '针灸通论、经络腧穴、灸法与针灸歌赋。',
    subs: [
      ['tonglun', '针灸通论'],
      ['jingluo', '经络腧穴'],
      ['jiufa', '灸法'],
      ['tuina', '推拿'],
      ['gefue', '针灸歌赋'],
    ],
  },
  {
    key: 'linzheng',
    label: '临证各科',
    description: '内科杂病、妇科、儿科、外科伤科、喉科口齿、眼科与温病疫病。',
    subs: [
      ['neike', '内科杂病'],
      ['fuke', '妇科'],
      ['erke', '儿科'],
      ['waike', '外科伤科'],
      ['houke', '喉科口齿'],
      ['yanke', '眼科'],
      ['wenbing', '温病疫病'],
    ],
  },
  {
    key: 'yian',
    label: '医案医话',
    description: '历代医案、方案与医话。',
    subs: [
      ['yian', '医案'],
      ['yihua', '医话'],
    ],
  },
  {
    key: 'yangsheng',
    label: '养生食疗',
    description: '养生、食疗、导引与服食。',
    subs: [
      ['yangsheng', '养生'],
      ['shiliao', '食疗'],
      ['daoyin', '导引'],
    ],
  },
  {
    key: 'zonghe',
    label: '综合医书',
    description: '医学全书、医学入门与综合性临床著作。',
    subs: [
      ['quanshu', '医学全书'],
      ['rumen', '医学入门'],
      ['other', '综合'],
    ],
  },
  {
    key: 'yilun',
    label: '医论医史',
    description: '医论、医话、医史、温病疫病与内科杂病源流。',
    subs: [
      ['wenbing', '温病疫病'],
      ['neike', '内科杂病'],
      ['yishi', '医史医话'],
      ['yilun', '医论医话'],
    ],
  },
  {
    key: 'duanpian',
    label: '短篇',
    description: '不足五千字的歌诀、秘方、针法与其他短篇。',
    subs: [
      ['zhenjiu', '针灸歌诀'],
      ['maixue', '脉学歌诀'],
      ['fangyao', '方药歌诀'],
      ['other', '其他短篇'],
    ],
  },
]

const CATEGORY_MAP = new Map(CATEGORY_DEFS.map((item) => [item.key, item]))

const MANUAL = {
  儒门事亲: ['yilun', 'yilun'],
  格致余论: ['yilun', 'yilun'],
  医学源流论: ['yilun', 'yilun'],
  医贯: ['yilun', 'yilun'],
  医门法律: ['zonghe', 'other'],
  温病条辨: ['yilun', 'wenbing'],
  温热经纬: ['yilun', 'wenbing'],
  温疫论: ['yilun', 'wenbing'],
  时病论: ['yilun', 'wenbing'],
  诸病源候论: ['yilun', 'neike'],
  杂病源流犀烛: ['yilun', 'neike'],
  脾胃论: ['linzheng', 'neike'],
  内外伤辨惑论: ['linzheng', 'neike'],
  兰室秘藏: ['linzheng', 'neike'],
  血证论: ['linzheng', 'neike'],
  傅青主女科: ['linzheng', 'fuke'],
  石室秘录: ['zonghe', 'quanshu'],
  景岳全书: ['zonghe', 'quanshu'],
  医宗金鉴: ['zonghe', 'quanshu'],
  御纂医宗金鉴: ['zonghe', 'quanshu'],
  证治准绳: ['zonghe', 'quanshu'],
  张氏医通: ['zonghe', 'quanshu'],
  皇汉医学: ['zonghe', 'other'],
  医宗必读: ['zonghe', 'rumen'],
  医学入门: ['zonghe', 'rumen'],
  万病回春: ['zonghe', 'rumen'],
  寿世保元: ['zonghe', 'rumen'],
  丹溪心法: ['zonghe', 'other'],
  医学正传: ['zonghe', 'rumen'],
  古今医鉴: ['zonghe', 'other'],
  赤水元珠: ['zonghe', 'other'],
  医宗己任编: ['zonghe', 'other'],
  罗氏会约医镜: ['zonghe', 'other'],
  顾松园医镜: ['zonghe', 'other'],
}

// 机器关键词容易误分的书名，逐本校正。
Object.assign(MANUAL, {
  本经逢原: ['bencao', 'comprehensive'],
  本经疏证: ['bencao', 'comprehensive'],
  药征: ['bencao', 'comprehensive'],
  药征续编: ['bencao', 'comprehensive'],
  药笼小品: ['bencao', 'comprehensive'],
  要药分剂: ['bencao', 'comprehensive'],
  药症忌宜: ['bencao', 'comprehensive'],
  长沙药解: ['bencao', 'comprehensive'],
  石药尔雅: ['bencao', 'comprehensive'],
  刺灸心法要诀: ['zhenjiu', 'tonglun'],
  神灸经纶: ['zhenjiu', 'jiufa'],
  神应经: ['zhenjiu', 'tonglun'],
  十四经发挥: ['zhenjiu', 'jingluo'],
  金针秘传: ['zhenjiu', 'tonglun'],
  推拿抉微: ['zhenjiu', 'tuina'],
  厘正按摩要术: ['zhenjiu', 'tuina'],
  达生编: ['linzheng', 'fuke'],
  广嗣要语: ['linzheng', 'fuke'],
  济阴纲目: ['linzheng', 'fuke'],
  经效产宝: ['linzheng', 'fuke'],
  宁坤秘笈: ['linzheng', 'fuke'],
  重订产孕集: ['linzheng', 'fuke'],
  妙一斋医学正印种子编: ['linzheng', 'fuke'],
  颅囟经: ['linzheng', 'erke'],
  颅顖经: ['linzheng', 'erke'],
  婴儿论: ['linzheng', 'erke'],
  婴童百问: ['linzheng', 'erke'],
  婴童类萃: ['linzheng', 'erke'],
  鬻婴提要说: ['linzheng', 'erke'],
  经验麻科: ['linzheng', 'erke'],
  麻疹阐注: ['linzheng', 'erke'],
  明目至宝: ['linzheng', 'yanke'],
  目经大成: ['linzheng', 'yanke'],
  原机启微: ['linzheng', 'yanke'],
  重楼玉钥: ['linzheng', 'houke'],
  重楼玉钥续编: ['linzheng', 'houke'],
  发背对口治诀论: ['linzheng', 'waike'],
  解围元薮: ['linzheng', 'waike'],
  救伤秘旨: ['linzheng', 'waike'],
  卫济宝书: ['linzheng', 'waike'],
  回生集: ['fangshu', 'yanfang'],
  急救广生集: ['fangshu', 'yanfang'],
  绛囊撮要: ['fangshu', 'yanfang'],
  十剂表: ['fangshu', 'fanglun'],
  辨证录: ['linzheng', 'neike'],
  辨证奇闻: ['linzheng', 'neike'],
  虚损启微: ['linzheng', 'neike'],
  杂症会心录: ['linzheng', 'neike'],
  阴证略例: ['linzheng', 'neike'],
  此事难知: ['linzheng', 'neike'],
  医学发明: ['linzheng', 'neike'],
  活法机要: ['linzheng', 'neike'],
  医法圆通: ['linzheng', 'neike'],
  医醇剩义: ['linzheng', 'neike'],
  医略: ['linzheng', 'neike'],
  医效秘传: ['linzheng', 'neike'],
  医学传灯: ['linzheng', 'neike'],
  医学传心录: ['linzheng', 'neike'],
  医学妙谛: ['linzheng', 'neike'],
  医学举要: ['linzheng', 'neike'],
  医学课儿策: ['linzheng', 'neike'],
  医原: ['linzheng', 'neike'],
  医源: ['linzheng', 'neike'],
  医旨绪余: ['linzheng', 'neike'],
  医津一筏: ['linzheng', 'neike'],
  医林改错: ['linzheng', 'neike'],
  医门补要: ['linzheng', 'neike'],
  医中一得: ['linzheng', 'neike'],
  医病简要: ['linzheng', 'neike'],
  医贯: ['linzheng', 'neike'],
  医暇卮言: ['yian', 'yihua'],
  古今医彻: ['zonghe', 'other'],
  简明医彀: ['zonghe', 'other'],
  明医杂着: ['zonghe', 'other'],
  明医指掌: ['zonghe', 'other'],
  医学集成: ['zonghe', 'other'],
  医学心悟: ['zonghe', 'other'],
  医学实在易: ['zonghe', 'other'],
  医学从众录: ['zonghe', 'other'],
  玉机微义: ['zonghe', 'other'],
  松崖医径: ['zonghe', 'other'],
  医宗己任编: ['zonghe', 'other'],
  寓意草: ['yian', 'yian'],
  奇症汇: ['yian', 'yian'],
  医验随笔: ['yian', 'yian'],
  先醒斋广笔记: ['yian', 'yian'],
  程门雪遗稿: ['yian', 'yian'],
  归砚录: ['yian', 'yihua'],
  重庆堂随笔: ['yian', 'yihua'],
  读医随笔: ['yian', 'yihua'],
  肯堂医论: ['yilun', 'yilun'],
  市隐庐医学杂着: ['yian', 'yihua'],
  医林琐语: ['yian', 'yihua'],
  心医集: ['yian', 'yihua'],
  医医十病: ['yilun', 'yilun'],
  医医小草: ['yilun', 'yilun'],
  医医医: ['yilun', 'yilun'],
  轩岐救正论: ['yilun', 'yilun'],
  推求师意: ['yilun', 'yilun'],
  慎柔五书: ['linzheng', 'neike'],
  慎斋遗书: ['zonghe', 'other'],
  陆地仙经: ['yangsheng', 'daoyin'],
  养性延命录: ['yangsheng', 'daoyin'],
  黄庭内景五藏六府图: ['yangsheng', 'daoyin'],
  月令采奇: ['yangsheng', 'yangsheng'],
  祝由十三科: ['yilun', 'yilun'],
  太医局诸科程文格: ['yilun', 'yishi'],
  洗冤集录: ['yilun', 'yishi'],
})

// 与站内现有经典同名、但正文不同的版本。相似度在构建时重新计算。
const EXISTING_CLASSICS = {
  血证论: 'xuezhenglun',
  石室秘录: 'shishimilu',
  傅青主女科: 'fuqingzhu-nvke',
}

function readText(file) {
  return fs.readFileSync(file, 'utf8')
}

function parseBook(file) {
  const raw = readText(file)
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  const yaml = match?.[1] ?? ''
  const body = match ? raw.slice(match[0].length) : raw
  const title = clean((yaml.match(/^\s{2}zh-hans:\s*(.+)$/m) ?? [])[1] ?? path.basename(file, '.md'))
  const authors = [...yaml.matchAll(/^\s*-\s*name:\s*(.+)$/gm)].map((item) => clean(item[1]))
  const dynasties = [...yaml.matchAll(/^\s+dynasty:\s*(.+)$/gm)].map((item) => clean(item[1]))
  const author = authors.length ? [...new Set(authors)].join('、') : '佚名'
  const dynasty = dynasties.length ? [...new Set(dynasties)].join('、') : ''
  return {
    file: path.basename(file),
    title,
    author,
    dynasty,
    lastmod: clean((yaml.match(/^lastmod:\s*(.+)$/m) ?? [])[1] ?? ''),
    github: clean((yaml.match(/^github_repo_url:\s*(.+)$/m) ?? [])[1] ?? ''),
    daizhige: clean((yaml.match(/^daizhige_url:\s*(.+)$/m) ?? [])[1] ?? ''),
    body,
  }
}

function clean(value) {
  return String(value ?? '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim()
}

function includesAny(text, words) {
  return words.some((word) => text.includes(word))
}

function classify(book) {
  if (book.body.length < SHORT_LIMIT) return shortCategory(book.title)

  const title = book.title
  const manual = MANUAL[title]
  if (manual) return manual

  if (includesAny(title, ['针灸', '鍼灸', '灸法', '针经', '針經', '針灸', '明堂', '铜人', '銅人', '经穴', '經穴', '腧穴', '子午流注', '奇经', '奇經', '经络', '經絡', '太乙神针', '太乙神針', '推拿', '按摩'])) {
    if (includesAny(title, ['推拿', '按摩'])) return ['zhenjiu', 'tuina']
    if (includesAny(title, ['灸', '神灸'])) return ['zhenjiu', 'jiufa']
    if (includesAny(title, ['经穴', '經穴', '腧穴', '铜人', '銅人', '明堂', '子午流注', '奇经', '奇經', '经络', '經絡'])) return ['zhenjiu', 'jingluo']
    if (includesAny(title, ['歌', '赋', '賦'])) return ['zhenjiu', 'gefue']
    return ['zhenjiu', 'tonglun']
  }

  if (includesAny(title, ['本草', '药性', '藥性', '炮炙', '雷公', '神农', '神農', '食性', '食物本草', '药品', '藥品'])) {
    if (includesAny(title, ['神农', '神農', '本经', '本經'])) return ['bencao', 'bencaojing']
    if (includesAny(title, ['炮炙', '雷公'])) return ['bencao', 'paozhi']
    if (includesAny(title, ['歌括', '歌诀', '歌訣', '药性', '藥性'])) return ['bencao', 'gejue']
    return ['bencao', 'comprehensive']
  }

  if (includesAny(title, ['伤寒', '傷寒', '金匮', '金匱', '仲景'])) {
    return ['shanghan', includesAny(title, ['金匮', '金匱']) ? 'jingui' : 'shanghan']
  }

  if (includesAny(title, ['黄帝内经', '黃帝內經', '素问', '素問', '灵枢', '靈樞', '难经', '難經', '太素', '类经', '類經', '内经', '內經', '医经', '醫經'])) {
    if (includesAny(title, ['素问', '素問'])) return ['yijing', 'suwen']
    if (includesAny(title, ['灵枢', '靈樞'])) return ['yijing', 'lingshu']
    if (includesAny(title, ['难经', '難經'])) return ['yijing', 'nanjing']
    if (includesAny(title, ['太素'])) return ['yijing', 'taisu']
    if (includesAny(title, ['类经', '類經'])) return ['yijing', 'leijing']
    return ['yijing', 'other']
  }

  if (includesAny(title, ['脉', '脈', '诊', '診', '舌', '望诊', '望診', '四诊', '四診', '察病', '辨症', '辨證'])) {
    if (includesAny(title, ['脉', '脈'])) return ['zhenfa', 'maizhen']
    if (includesAny(title, ['舌'])) return ['zhenfa', 'shezhen']
    if (includesAny(title, ['望'])) return ['zhenfa', 'wangzhen']
    return ['zhenfa', 'other']
  }

  if (includesAny(title, ['医案', '醫案', '类案', '類案', '医话', '醫話', '方案', '验案', '驗案', '名医', '名醫'])) {
    return ['yian', includesAny(title, ['话', '話']) ? 'yihua' : 'yian']
  }

  if (includesAny(title, ['养生', '養生', '寿世', '壽世', '养老', '養老', '食治', '食疗', '食療', '饮膳', '飲膳', '饮食', '飲食', '遵生', '导引', '導引', '房中', '修真', '服食', '却病', '卻病'])) {
    if (includesAny(title, ['食', '饮膳', '飲膳'])) return ['yangsheng', 'shiliao']
    if (includesAny(title, ['导引', '導引', '修真', '服气', '服氣'])) return ['yangsheng', 'daoyin']
    return ['yangsheng', 'yangsheng']
  }

  if (includesAny(title, ['方', '汤头', '湯頭', '歌括', '良方', '秘方', '验方', '驗方', '集解', '普济', '普濟', '圣济', '聖濟', '局方', '奇效', '简便', '簡便', '外台', '外臺', '千金', '肘后', '肘後', '医方', '醫方', '方论', '方論', '成方', '串雅', '单方', '單方'])) {
    if (includesAny(title, ['歌括', '歌诀', '歌訣', '汤头', '湯頭'])) return ['fangshu', 'gejue']
    if (includesAny(title, ['良方', '秘方', '验方', '驗方', '奇效', '简便', '簡便', '单方', '單方', '串雅'])) return ['fangshu', 'yanfang']
    if (includesAny(title, ['普济', '普濟', '圣济', '聖濟', '外台', '外臺', '千金', '肘后', '肘後'])) return ['fangshu', 'large']
    return ['fangshu', 'fanglun']
  }

  if (includesAny(title, ['妇', '婦', '女科', '产科', '產科', '经带', '經帶', '胎产', '胎產'])) return ['linzheng', 'fuke']
  if (includesAny(title, ['幼', '小儿', '小兒', '儿科', '兒科', '种痘', '種痘'])) return ['linzheng', 'erke']
  if (includesAny(title, ['外科', '疡', '瘍', '痈', '癰', '疽', '痔', '伤科', '傷科', '正体', '正體', '跌打', '金疮', '金瘡', '瘰疬', '瘰癧'])) return ['linzheng', 'waike']
  if (includesAny(title, ['喉', '口齿', '口齒', '白喉', '齿', '齒', '牙'])) return ['linzheng', 'houke']
  if (includesAny(title, ['眼', '银海', '銀海', '审视', '審視', '目科'])) return ['linzheng', 'yanke']
  if (includesAny(title, ['温病', '溫病', '温热', '溫熱', '温疫', '溫疫', '时病', '時病', '霍乱', '霍亂', '痧', '疟', '瘧', '痢', '疫'])) return ['linzheng', 'wenbing']
  if (includesAny(title, ['内科', '內科', '脾胃', '血证', '血證', '虚劳', '虛勞', '痨', '癆', '杂病', '雜病', '证治', '證治', '症因', '理虚', '理虛', '痰火', '中风', '中風', '消渴', '水肿', '水腫', '咳', '喘', '臌', '胀', '脹', '痹', '痿', '病源', '诸病', '諸病', '医镜', '醫鏡', '会约', '會約'])) {
    return ['linzheng', 'neike']
  }

  if (includesAny(title, ['全书', '全書', '金鉴', '金鑑', '准绳', '準繩', '景岳', '医宗', '醫宗', '赤水', '医镜', '醫鏡', '会约', '會約', '万病回春', '萬病回春', '寿世保元', '壽世保元', '医学入门', '醫學入門', '医门法律', '醫門法律', '张氏医通', '張氏醫通', '皇汉医学', '皇漢醫學', '丹溪心法', '医学正传', '醫學正傳', '医宗必读', '醫宗必讀', '杂病源流', '雜病源流'])) {
    if (includesAny(title, ['全书', '全書', '金鉴', '金鑑', '准绳', '準繩', '景岳', '医宗', '醫宗'])) return ['zonghe', 'quanshu']
    if (includesAny(title, ['入门', '入門', '正传', '正傳', '必读', '必讀', '心法'])) return ['zonghe', 'rumen']
    return ['zonghe', 'other']
  }

  if (includesAny(title, ['温病', '溫病', '温热', '溫熱', '温疫', '溫疫', '时病', '時病', '疫', '霍乱', '霍亂', '痧', '疟', '瘧'])) return ['yilun', 'wenbing']
  if (includesAny(title, ['史', '医说', '醫說', '续医说', '續醫說', '吴医汇讲', '吳醫匯講'])) return ['yilun', 'yishi']
  if (includesAny(title, ['病源', '诸病', '諸病', '杂病', '雜病', '内科', '內科', '脾胃', '血证', '血證', '虚劳', '虛勞'])) return ['yilun', 'neike']
  if (includesAny(title, ['医论', '醫論', '医话', '醫話', '源流', '格致', '儒门', '儒門', '医贯', '醫貫', '医门', '醫門'])) return ['yilun', 'yilun']

  return ['yilun', 'yilun']
}

function shortCategory(title) {
  if (includesAny(title, ['针', '針', '灸', '穴'])) return ['duanpian', 'zhenjiu']
  if (includesAny(title, ['脉', '脈'])) return ['duanpian', 'maixue']
  if (includesAny(title, ['方', '汤', '湯', '药', '藥'])) return ['duanpian', 'fangyao']
  return ['duanpian', 'other']
}

function normalizeText(value) {
  return value.replace(/[\s\p{P}\p{S}]/gu, '')
}

function shingles(value, size = 5) {
  const set = new Set()
  for (let index = 0; index + size <= value.length; index += 2) {
    set.add(value.slice(index, index + size))
  }
  return set
}

function containment(source, target) {
  if (!source.size) return 0
  let hit = 0
  for (const item of source) if (target.has(item)) hit += 1
  return hit / source.size
}

function existingText(bookId) {
  const file = path.join(ROOT, 'public', 'data', 'classics', `${bookId}.json`)
  if (!fs.existsSync(file)) return ''
  const book = JSON.parse(readText(file))
  const sections = [
    ...(book.prefaces ?? []),
    ...(book.frontMatter ?? []),
    ...(book.volumes ?? []).flatMap((volume) => volume.chapters ?? []),
    ...(book.postscripts ?? []),
  ]
  return sections.flatMap((section) => section.paragraphs ?? []).join('')
}

function duplicateInfo(book) {
  const existingId = EXISTING_CLASSICS[book.title]
  if (!existingId) return null
  const existing = existingText(existingId)
  if (!existing) return null
  const incoming = shingles(normalizeText(book.body))
  const current = shingles(normalizeText(existing))
  const similarity = Math.max(containment(incoming, current), containment(current, incoming))
  return {
    existingId,
    similarity: Number(similarity.toFixed(3)),
    identical: similarity >= 0.95,
  }
}

function splitIntoSections(book) {
  const lines = book.body
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.replace(/\u3000/g, ' ').trim())
    .filter(Boolean)
  if (lines[0] === book.title || lines[0] === `《${book.title}》`) lines.shift()

  const headingPattern =
    /^(卷[一二三四五六七八九十百千零〇两0-9]+|第[一二三四五六七八九十百千零〇两0-9]+[卷篇门門]|上卷|下卷)(\s|$)/
  const headingIndexes = []
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (line.length <= 42 && headingPattern.test(line)) headingIndexes.push(index)
  }

  const groups = []
  if (headingIndexes.length >= 3) {
    if (headingIndexes[0] > 0) {
      groups.push({ title: '卷前', lines: lines.slice(0, headingIndexes[0]) })
    }
    for (let index = 0; index < headingIndexes.length; index += 1) {
      const start = headingIndexes[index]
      const end = headingIndexes[index + 1] ?? lines.length
      groups.push({ title: lines[start], lines: lines.slice(start + 1, end) })
    }
  } else {
    let current = []
    let length = 0
    for (const line of lines) {
      current.push(line)
      length += line.length
      if (length >= 7000) {
        groups.push({ title: '', lines: current })
        current = []
        length = 0
      }
    }
    if (current.length) groups.push({ title: '', lines: current })
  }

  const sections = []
  for (const group of groups) {
    let index = 0
    while (index < group.lines.length) {
      let length = 0
      const paragraphs = []
      while (index < group.lines.length && (length < 12000 || paragraphs.length === 0)) {
        const line = group.lines[index]
        paragraphs.push(line)
        length += line.length
        index += 1
      }
      if (!paragraphs.length) continue
      sections.push({
        title: group.title || '',
        paragraphs,
        charCount: paragraphs.join('').length,
      })
    }
  }

  const baseTitles = sections.map(
    (section, index) => section.title || `第 ${index + 1} 部分`,
  )
  const totalByTitle = new Map()
  for (const title of baseTitles) {
    totalByTitle.set(title, (totalByTitle.get(title) ?? 0) + 1)
  }
  const seenByTitle = new Map()

  return sections.map((section, index) => {
    const baseTitle = baseTitles[index]
    let title = baseTitle
    if ((totalByTitle.get(baseTitle) ?? 0) > 1) {
      const seen = (seenByTitle.get(baseTitle) ?? 0) + 1
      seenByTitle.set(baseTitle, seen)
      title = `${baseTitle}（${cnNum(seen)}）`
    }
    return {
      id: `s-${String(index + 1).padStart(4, '0')}`,
      title,
      kind: section.title ? 'chapter' : 'part',
      charCount: section.charCount,
      paragraphs: section.paragraphs,
      sortOrder: index,
    }
  })
}

function cnNum(value) {
  const digits = '零一二三四五六七八九'
  if (value < 10) return digits[value]
  if (value < 20) return `十${value % 10 ? digits[value % 10] : ''}`
  if (value < 100) {
    const tens = Math.floor(value / 10)
    const ones = value % 10
    return `${digits[tens]}十${ones ? digits[ones] : ''}`
  }
  return String(value)
}

function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error(`医藏目录不存在：${SOURCE_DIR}`)
  }
  const files = fs
    .readdirSync(SOURCE_DIR)
    .filter((name) => name.endsWith('.md'))
    .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))

  const books = []
  const excluded = []
  for (const file of files) {
    const book = parseBook(path.join(SOURCE_DIR, file))
    if (EXCLUDED_TITLES.has(book.title)) {
      excluded.push(book.title)
      continue
    }
    const duplicate = duplicateInfo(book)
    if (duplicate?.identical) {
      excluded.push(`${book.title}（与站内版本相同）`)
      continue
    }
    const [category, subcategory] = classify(book)
    books.push({
      id: `lib-${crypto.createHash('sha1').update(book.file).digest('hex').slice(0, 10)}`,
      file: book.file,
      title: book.title,
      author: book.author || '佚名',
      dynasty: book.dynasty,
      category,
      subcategory,
      charCount: book.body.length,
      duplicateOf: duplicate?.existingId ?? '',
      versionNote: duplicate
        ? `与站内同名版本正文相似度约 ${(duplicate.similarity * 100).toFixed(0)}%，标为另一版本。`
        : '',
      source: {
        daizhige: book.daizhige,
        github: book.github,
        lastmod: book.lastmod,
        note: '据殆知阁医藏 Markdown 转换本整理；未逐字校勘，原文以通行本为准。',
      },
    })
  }

  const extra = loadExtraTxtBooks()
  books.push(...extra.books)

  const categoryCounts = new Map()
  for (const book of books) {
    categoryCounts.set(book.category, (categoryCounts.get(book.category) ?? 0) + 1)
  }
  const categories = CATEGORY_DEFS.map((definition) => ({
    key: definition.key,
    label: definition.label,
    description: definition.description,
    count: categoryCounts.get(definition.key) ?? 0,
    subs: definition.subs
      .map(([key, label]) => ({
        key,
        label,
        count: books.filter((book) => book.category === definition.key && book.subcategory === key).length,
      }))
      .filter((item) => item.count > 0),
  }))

  const index = {
    generatedAt: new Date().toISOString(),
    source: {
      dir: SOURCE_DIR,
      totalFiles: files.length + extra.books.length,
      totalBooks: books.length,
      excluded,
      chars: books.reduce((sum, book) => sum + book.charCount, 0),
    },
    categories,
    books,
  }

  fs.mkdirSync(path.dirname(INDEX_FILE), { recursive: true })
  fs.writeFileSync(INDEX_FILE, `${JSON.stringify(index, null, 2)}\n`, 'utf8')
  console.log(`已生成 ${path.relative(ROOT, INDEX_FILE)}：${books.length} 部（排除 ${excluded.length}）`)
  for (const category of categories) {
    console.log(`  ${category.label} ${category.count}：${category.subs.map((item) => `${item.label} ${item.count}`).join(' / ')}`)
  }
  const shortCount = books.filter((book) => book.category === 'duanpian').length
  console.log(`短篇 ${shortCount}；另一版本 ${books.filter((book) => book.duplicateOf).length}`)

  if (INDEX_ONLY) return

  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true })
  for (const suffix of ['', '-wal', '-shm']) {
    fs.rmSync(`${DB_FILE}${suffix}`, { force: true })
  }
  const db = new DatabaseSync(DB_FILE)
  db.exec(`
    PRAGMA journal_mode = OFF;
    PRAGMA synchronous = OFF;
    CREATE TABLE library_books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      dynasty TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT NOT NULL,
      char_count INTEGER NOT NULL,
      section_count INTEGER NOT NULL,
      duplicate_of TEXT NOT NULL DEFAULT '',
      version_note TEXT NOT NULL DEFAULT '',
      data_json TEXT NOT NULL
    );
    CREATE TABLE library_sections (
      book_id TEXT NOT NULL,
      id TEXT NOT NULL,
      title TEXT NOT NULL,
      kind TEXT NOT NULL,
      char_count INTEGER NOT NULL,
      sort_order INTEGER NOT NULL,
      paragraphs_json TEXT NOT NULL,
      PRIMARY KEY (book_id, id)
    );
    CREATE TABLE app_meta (key TEXT PRIMARY KEY, value_json TEXT NOT NULL);
    CREATE INDEX idx_library_books_category ON library_books(category, subcategory);
    CREATE INDEX idx_library_books_title ON library_books(title);
    CREATE INDEX idx_library_sections_book ON library_sections(book_id, sort_order);
  `)

  const insertBook = db.prepare(`
    INSERT INTO library_books (
      id, title, author, dynasty, category, subcategory, char_count,
      section_count, duplicate_of, version_note, data_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertSection = db.prepare(`
    INSERT INTO library_sections (
      book_id, id, title, kind, char_count, sort_order, paragraphs_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const insertMeta = db.prepare('INSERT INTO app_meta (key, value_json) VALUES (?, ?)')

  db.exec('BEGIN')
  try {
    let totalSections = 0
    for (const book of books) {
      const parsed = book.file.endsWith('.md')
        ? parseBook(path.join(SOURCE_DIR, book.file))
        : { title: book.title, body: '' }
      const sections = extra.sectionMap.get(book.id) ?? splitIntoSections(parsed)
      insertBook.run(
        book.id,
        book.title,
        book.author,
        book.dynasty,
        book.category,
        book.subcategory,
        book.charCount,
        sections.length,
        book.duplicateOf,
        book.versionNote,
        JSON.stringify(book),
      )
      for (const section of sections) {
        insertSection.run(
          book.id,
          section.id,
          section.title,
          section.kind,
          section.charCount,
          section.sortOrder,
          JSON.stringify(section.paragraphs),
        )
      }
      totalSections += sections.length
    }
    insertMeta.run('library_index', JSON.stringify({ categories, source: index.source }))
    db.exec('COMMIT')
    db.exec('ANALYZE')
    console.log(`数据库已生成：${path.relative(ROOT, DB_FILE)} (${(fs.statSync(DB_FILE).size / 1024 / 1024).toFixed(1)} MB)`)
    console.log(`books=${books.length} sections=${totalSections}`)
  } catch (error) {
    db.exec('ROLLBACK')
    db.close()
    throw error
  }
  db.close()
}

main()
