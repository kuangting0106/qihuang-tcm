// 民间偏方 / 古方抽取脚本
// 数据源：
//   1. F:/中医/植物药材图片/偏方库/raw/pdf/泉州_全文.txt（现代汇编，结构化）
//   2. F:/中医/植物药材图片/偏方库/raw/tcmoc/books/*.txt（671 本古籍，UTF-8）
// 输出：
//   data/remedies.jsonl        一行一条，供 build-db.mjs 入库
//   data/remedies-stats.json   统计与质检报告
//   data/remedies-sample.json  抽样，供人工核对
//
// 原则：原文为准。raw 字段保留清洗后的原书文字；indications/formula/usage
// 只是便于检索的初步切分，页面必须同时展示 raw，并注明“原文摘录”。

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const ROOT = path.resolve(import.meta.dirname, '..')
const RAW_ROOT = 'F:/中医/植物药材图片/偏方库/raw'
const QZ_TXT = path.join(RAW_ROOT, 'pdf', '泉州_全文.txt')
const TCMOC_DIR = path.join(RAW_ROOT, 'tcmoc', 'books')
const OUT_DIR = path.join(ROOT, 'data')
const OUT_JSONL = path.join(OUT_DIR, 'remedies.jsonl')
const OUT_STATS = path.join(OUT_DIR, 'remedies-stats.json')
const OUT_SAMPLE = path.join(OUT_DIR, 'remedies-sample.json')

const argv = process.argv.slice(2)
const limitBooks = Number(argv.find((a) => a.startsWith('--limit-books='))?.split('=')[1] ?? 0)
const bookFilterRaw = argv.find((a) => a.startsWith('--books='))?.split('=')[1] ?? ''
const bookFilter = bookFilterRaw.trim()
  ? bookFilterRaw
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n))
  : []
const onlyQz = argv.includes('--only-qz')

// 方论、歌诀、药性赋类古籍：一段即一篇方论，不能按“治…方/又方”切成偏方，
// v1 先排除，避免把方解、医论误当方药。后续可单列为“方论”栏目。
const SKIP_BOOK_NUMBERS = new Set([47, 72, 78, 82, 87, 89, 91, 92, 93, 94, 95, 96, 102, 118, 121, 122, 357, 639, 657, 659])
// 非方书：本草、药性、食疗、针灸、脉学、医籍考、医论/医话、经典理论书不作为偏方主源。
const SKIP_BOOK_TITLE_RE =
  /(本草|药性|食性|食物|救荒|炮炙|炮制|针灸|脉经|脉诀|脉学|医籍考|医论|医话|素问|灵枢|难经|子午流注|明堂灸经|奇经八脉|经穴汇解|经络全书|经络考|经络汇编|铜人指穴|神灸经纶|刺灸心法)/

// 书名不含「针灸」的经络专书、或方书中的经络/腧穴章节，不能当偏方入库。
// 同时保护「冲脉饮子」这类以经络名起首的方剂名。
const MERIDIAN_SECTION_RE =
  /^(手|足)?(太阴|少阴|厥阴|太阳|阳明|少阳)?[^，。；]{0,6}经([五六七八九十]+穴|穴分寸|穴歌|分寸歌|步穴歌|诸穴歌|穴$)|^(任|督|冲|带|阴维|阳维|阴跷|阳跷)脉|^奇经八脉$|^十二别络|^经正六合|^卧针迎随|^催气手法|分寸歌$/
const FORMULA_NAME_RE = /(饮子|汤|丸|散|膏|丹|煎|方)$/

function isMeridianSection(title) {
  const text = String(title ?? '').trim()
  if (!text || FORMULA_NAME_RE.test(text)) return false
  return MERIDIAN_SECTION_RE.test(text)
}

const ERA = [
  ['现代', 100],
  ['民国', 90],
  ['清', 80],
  ['明', 70],
  ['元', 60],
  ['宋', 50],
  ['金', 45],
  ['唐', 40],
  ['隋', 38],
  ['南北朝', 35],
  ['晋', 30],
  ['汉', 25],
  ['未知', 0],
]

const CATEGORY_RULES = [
  ['妇科', /(月经|经水|经闭|经行|经候|痛经|崩漏|崩中|血崩|带下|妊娠|胎前|胎动|胎漏|滑胎|难产|催生|堕胎|产后|胞衣|子死腹中|不孕|求子|种子|嗣育|子宫|阴挺|阴痒|阴肿|阴疮|乳痈|乳少|乳吹|乳岩|乳癖|月水)/],
  ['儿科', /(小儿|婴|幼儿|痘|麻疹|惊风|惊|疳|夜啼|囟|胎毒|奶癣|脐风|五迟|五软|遗尿|变蒸)/],
  ['五官科', /(眼|目|耳|鼻|咽喉|喉|失音|声哑|翳|障|耳鸣|耳聋|鼻炎|口疮|口舌|唇|牙|齿|牙龈|牙疳|舌痛|喉痹|喉蛾)/],
  ['皮肤科', /(癣|疥|癞|麻风|疠风|白癜风|白驳|汗斑|湿疹|荨麻疹|皮炎|冻疮|皲裂|鸡眼|胼胝|秃疮|脱发|乌髭|须发)/],
  ['骨伤科', /(骨折|折骨|脱臼|脱骱|伤筋|扭伤|跌打|金疮|创伤|刀伤|杖疮|夹伤|闪挫|腰扭|骨伤|接骨)/],
  ['外科', /(疮|疡|痈|疽|疔|疖|瘰|疬|瘿|瘤|肠痈|痔|瘘|疝|脱肛|丹毒|流注|臁疮|褥疮|烧烫伤|烫伤|烧伤|蛇咬|犬咬|虫咬|蜈蚣|蝎|破伤风|无名肿毒|肿毒|疔毒|发背|背疽|搭手)/],
  ['急救', /(中毒|砒|信石|溺|缢|自刎|猝死|昏厥|休克|中暑|霍乱|痧|急救|解百毒|误吞|误服|断肠草|毒蕈|河豚|毒蛇|蛊毒|异物|哽|噎)/],
  ['内科', /(伤寒|温病|瘟疫|时疫|时气|热病|感冒|伤风|诸风|风症|发热|咳嗽|喘|哮|痰|肺|心|胸痹|心悸|怔忡|胃|脾|腹痛|腹胀|泻|泄泻|痢|便秘|大便|黄疸|黄胆|水肿|淋|浊|癃闭|小便|消渴|眩晕|头风|头痛|中风|癫|痫|郁|虚劳|精极|遗精|阳痿|血证|吐血|咳血|衄|便血|尿血|下血|肠风|脏毒|汗|疟|痹|痿|脚气|香港脚|虫|寄生虫|积|聚|噎|膈|呕|呃逆|霍乱|疟疾|腰痛|腰疼|肾虚|补益|诸虚|中湿|首风|一切气|胁痛)/],
]

const SUB_RULES = [
  ['伤寒温病', /(伤寒|温病|瘟疫|时疫|感冒|伤风|发热)/],
  ['咳嗽哮喘', /(咳嗽|喘|哮|痰饮|肺痈|肺痿|肺胀)/],
  ['疟疾痢疾', /(疟|痢|霍乱|泄泻|下利)/],
  ['脾胃肠病', /(胃|脾|腹痛|腹胀|呕|呃逆|噎|膈|便秘|肠|痔|脱肛)/],
  ['肝胆病', /(肝|胆|黄疸|胁痛|臌胀|积聚|癥瘕)/],
  ['心脑病', /(心|胸痹|心悸|怔忡|中风|眩晕|头痛|癫|痫|失眠|健忘|郁)/],
  ['肾与水道', /(肾|水肿|淋|浊|癃闭|尿|遗精|阳痿|早泄|消渴|腰痛)/],
  ['虚劳血证', /(虚劳|劳|血证|吐血|咳血|衄|便血|尿血|紫癜|汗)/],
  ['痹痿脚气', /(痹|痿|脚气|痛风|历节)/],
  ['疮疡痈疽', /(疮|疡|痈|疽|疔|疖|肿毒|丹毒|流注|瘰疬|瘿|瘤)/],
  ['乳病疝气', /(乳|疝|阴囊|睾丸)/],
  ['肛肠病', /(痔|瘘|脱肛|便血)/],
  ['跌打金疮', /(跌打|金疮|创伤|骨折|脱臼|伤筋|扭伤|杖疮|接骨)/],
  ['烧烫冻伤', /(烧|烫|冻|皲裂)/],
  ['蛇虫犬咬', /(蛇|犬|虫|蜈蚣|蝎|蜂|蜘蛛|蚂蟥)/],
  ['月经带下', /(月经|经水|经闭|痛经|崩漏|带下|子宫|阴痒|阴挺)/],
  ['胎产不孕', /(胎|产|孕|妊娠|难产|催生|堕胎|滑胎|不孕|癥瘕)/],
  ['小儿痘疹', /(小儿|婴|幼儿|痘|麻疹|疹|惊风|疳|夜啼|囟|胎毒)/],
  ['眼目耳鼻', /(眼|目|耳|鼻|翳|障|耳鸣|耳聋|鼻炎)/],
  ['口齿咽喉', /(口|舌|齿|牙|咽喉|喉|失音|声哑|口疮|牙痛|喉痹|喉蛾)/],
  ['皮肤病', /(癣|疥|癞|麻风|白癜风|白驳|斑|秃|脱发|汗斑|湿疹|荨麻疹|皮炎)/],
  ['急救中毒', /(中毒|砒|信石|溺|缢|自刎|猝死|昏厥|休克|中暑|痧|急救|解百毒|误吞|异物|哽|噎)/],
]

const TOXIC_TERMS = [
  ['砒霜', /砒霜|白信|信石|砒石|红砒|白砒/],
  ['轻粉', /轻粉|汞粉|水银|升药|降药/],
  ['朱砂', /朱砂|辰砂|丹砂/],
  ['雄黄', /雄黄|雌黄/],
  ['曼陀罗', /曼陀罗|洋金花|闹羊花|山莨菪/],
  ['蟾酥', /蟾酥|蟾蜍|干蟾/],
  ['乌头类', /川乌|草乌|乌头|附子|天雄|侧子/],
  ['半夏南星', /半夏|天南星|南星/],
  ['峻下逐水', /商陆|甘遂|大戟|芫花|牵牛子|巴豆|千金子|续随子/],
  ['马钱子', /马钱子|番木鳖/],
  ['雷公藤', /雷公藤|昆明山海棠/],
  ['斑蝥', /斑蝥|芫青|红娘子/],
  ['铅丹', /铅丹|黄丹|樟丹/],
  ['硫黄', /硫黄|石硫黄/],
  ['细辛', /细辛/],
  ['罂粟', /罂粟|鸦片|阿片/],
  ['金汁', /金汁|粪清/],
  ['胎盘', /紫河车|胎盘|人胞/],
  ['动物药', /蜈蚣|全蝎|水蛭|虻虫|地鳖虫|土鳖虫|蕲蛇|白花蛇|乌梢蛇/],
]

const CAUTION_RE = /(孕妇|妊娠|忌服|不可服|不可内服|只可外用|外用|剧毒|有毒|慎用|禁忌|忌食|忌口|不可多服|久服)/

function pad(n, width = 4) {
  return String(n).padStart(width, '0')
}

function sha1(text) {
  return crypto.createHash('sha1').update(text).digest('hex')
}

function joinLines(text) {
  let out = String(text).replace(/\r/g, '').replace(/\n+/g, '')
  out = out.replace(/\\psjzl\d+\.bmp/gi, '')
  out = out.replace(/\\[rn]/g, '')
  out = out.replace(/\\x([^\\x]*)\\x/g, '$1')
  out = out.replace(/\\x/g, '')
  out = out.replace(/【\s*】/g, ' ')
  out = out.replace(/\u00a0/g, ' ')
  out = out.replace(/([\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff])/g, '$1')
  out = out.replace(/([\u4e00-\u9fff])\s+(?=[，。；：、！？）】」』])/g, '$1')
  out = out.replace(/([（【「『])\s+(?=[\u4e00-\u9fff])/g, '$1')
  out = out.replace(/[ \t]{2,}/g, ' ')
  out = out.replace(/\s+([，。；：、！？])/g, '$1')
  return out.trim()
}

function cleanSectionBody(body) {
  let out = String(body).replace(/\r/g, '')
  out = out.replace(/^\s*属性：/, '')
  out = out.replace(/<目录>[\s\S]*$/g, '')
  return out
}

function hasDose(text) {
  return /(\d+|[一二三四五六七八九十百零〇两]+)\s*(钱|两|分|厘|克|斤|升|合|枚|个|只|片|盏|铢|握|具|条|寸|尺|碗|杯|匙|粒|味)/.test(text)
}

function hasProcessing(text) {
  return /(煎|服|为末|研|捣|炼蜜|糊丸|水泛|醋|酒|敷|贴|擦|洗|熏|含|吹|灌|调下|送下|外搽|涂)/.test(text)
}

function isFormulaLike(text) {
  return text.length >= 12 && text.length <= 2600 && (hasDose(text) || (hasProcessing(text) && /上[一二三四五六七八九十]+味/.test(text)))
}

const DOSE_RE = /[一二三四五六七八九十百千0-9]+\s*(钱|两|分|厘|克|斤|升|合|枚|个|只|片|盏|铢|握|具|条|寸|尺|碗|杯|匙|粒)/g

function doseCount(text) {
  return (String(text).match(DOSE_RE) ?? []).length
}

// 只统计“药味 + 剂量”，排除“重四斤四两”“长三丈二尺”等叙述性度量。
function herbDoseCount(text) {
  let count = 0
  const re = /([\u4e00-\u9fff])[一二三四五六七八九十百千0-9]+\s*(钱|两|分|厘|克|斤|升|合|枚|个|片|盏|铢|握|具|条|碗|杯|匙|粒)/g
  for (const match of String(text).matchAll(re)) {
    if (!/[重长高阔深广周径围约共凡计]/.test(match[1])) count += 1
  }
  return count
}

function hasMultiHerb(text) {
  return /[\u4e00-\u9fff]{2,8}(?:（[^）]{0,12}）)?[，、][\u4e00-\u9fff]{2,8}/.test(String(text))
}

function isTheoryTitle(title) {
  const text = String(title)
  return (
    /(像位|岁图|学诊例|脉位|脉法|脉诀|脉象|诊法|三部|七表脉|八里脉|脉主治|煎煮|炮制|炮炙|禁忌|总论|方论|集注|集解|方解|注释|按语|药性|本草|十剂|经络|针灸|穴位|穴法|考正穴法|经穴起止|歌诀|歌括|脏腑|五脏|六腑|分三品|三品|反恶|秤两|升合|度量|正文|杂病用药赋)/.test(
      text,
    ) ||
    /^(序|自序|原序|凡例|目录|跋|后序|进书表|校勘|重刊|出版|说明|前言|缘起|索引)/.test(text) ||
    /^(论|五运|六气|运气|脉|诊|察|辨|评|附|正文|卷|穴|经络|脏腑|药性|本草|修制|炮制|禁忌|服饵|食忌|养生|导引|针灸|医案|医话|方论|集注|集解|注释|按语|分三品|秤两|升合|七表|八里)/.test(
      text,
    ) ||
    /^卷[一二三四五六七八九十百]+/.test(text) ||
    /^穴$/.test(text)
  )
}

function isTheoryText(text) {
  const value = String(text)
  if (herbDoseCount(value) >= 2) return false
  return /(内容：|一百二十种|为君|为臣|为佐使|曰：|按语|集注|方解)/.test(value)
}

function parseBookMeta(meta) {
  const text = String(meta).replace(/\r/g, '')
  const pick = (label) => {
    const m = text.match(new RegExp(`${label}[：:][ \\t]*([^\\n]*)`))
    if (!m) return ''
    const value = m[1].trim().replace(/[：:\s]+$/g, '')
    if (!value || value.startsWith('<') || /^[：:\s]*$/.test(value)) return ''
    return value
  }
  const first = text.split(/\n/).map((s) => s.trim()).find(Boolean) ?? ''
  return {
    title: pick('书名') || first.replace(/^《|》$/g, ''),
    author: pick('作者'),
    dynasty: pick('朝代'),
    year: pick('年份'),
  }
}

function inferDynasty(text) {
  if (/民国/.test(text)) return '民国'
  if (/(光绪|咸丰|同治|宣统|道光|嘉庆|乾隆|康熙|雍正|顺治)/.test(text)) return '清'
  if (/(万历|嘉靖|隆庆|崇祯|天启|洪武|永乐)/.test(text)) return '明'
  return ''
}

function eraOf(meta) {
  const dynasty = String(meta.dynasty ?? '').replace(/公元/g, '')
  const yearText = String(meta.year ?? '').replace(/公元/g, '')
  // 先看朝代：避免“公元”里的“元”把宋代误判成元代。
  if (/(现代|民国|中华人民共和国)/.test(dynasty)) {
    return /民国/.test(dynasty) ? { label: '民国', rank: 90 } : { label: '现代', rank: 100 }
  }
  if (/(南北朝)/.test(dynasty)) return { label: '南北朝', rank: 35 }
  for (const [name, rank] of [
    ['清', 80],
    ['明', 70],
    ['元', 60],
    ['宋', 50],
    ['金', 45],
    ['唐', 40],
    ['隋', 38],
    ['晋', 30],
    ['汉', 25],
  ]) {
    if (dynasty.includes(name)) return { label: name, rank }
  }
  const yearMatch = `${dynasty} ${yearText}`.match(/\b(\d{3,4})\b/)
  if (yearMatch) {
    const year = Number(yearMatch[1])
    if (year >= 1949) return { label: '现代', rank: 100 }
    if (year >= 1912) return { label: '民国', rank: 90 }
    if (year >= 1644) return { label: '清', rank: 80 }
    if (year >= 1368) return { label: '明', rank: 70 }
    if (year >= 1271) return { label: '元', rank: 60 }
    if (year >= 960) return { label: '宋', rank: 50 }
    if (year >= 618) return { label: '唐', rank: 40 }
    if (year >= 265) return { label: '晋', rank: 30 }
    if (year >= 25) return { label: '汉', rank: 25 }
  }
  return { label: '未知', rank: 0 }
}

function classify(title, indications, extra = '') {
  // 标题/章节是主依据；主治只在标题无信息时兜底，避免“鼻塞”把感冒分到五官科。
  const primary = `${title} ${extra}`.slice(0, 300)
  const secondary = String(indications).slice(0, 200)
  let category = '其他'
  for (const [name, re] of CATEGORY_RULES) {
    if (re.test(primary)) {
      category = name
      break
    }
  }
  if (category === '其他') {
    for (const [name, re] of CATEGORY_RULES) {
      if (re.test(secondary)) {
        category = name
        break
      }
    }
  }
  let subcategory = '其他'
  for (const [name, re] of SUB_RULES) {
    if (re.test(primary)) {
      subcategory = name
      break
    }
  }
  if (subcategory === '其他') {
    for (const [name, re] of SUB_RULES) {
      if (re.test(secondary)) {
        subcategory = name
        break
      }
    }
  }
  return { category, subcategory }
}

function qzCategory(chapter, section) {
  if (chapter.includes('内科')) {
    if (/(中暑|痧|中毒|溺|缢|猝|急救)/.test(section)) return '急救'
    return '内科'
  }
  if (chapter.includes('外科')) {
    if (/(癣|疥|斑|疹|秃|白癜风|白驳|汗斑|湿疹|荨麻疹|皮炎|冻疮|皲裂)/.test(section)) return '皮肤科'
    if (/(跌打|骨折|创伤|伤筋|扭伤|金疮|烧|烫)/.test(section)) return '骨伤科'
    return '外科'
  }
  if (chapter.includes('妇产')) return '妇科'
  if (chapter.includes('小儿')) return '儿科'
  if (chapter.includes('五官')) return '五官科'
  if (chapter.includes('其他')) return /(中毒|溺|缢|猝|急救|解百毒|误服|误吞|断肠草|毒蕈|河豚|毒蛇)/.test(section) ? '急救' : '其他'
  return '其他'
}

const HIGH_TOXIC = new Set([
  '砒霜',
  '轻粉',
  '曼陀罗',
  '蟾酥',
  '乌头类',
  '马钱子',
  '雷公藤',
  '斑蝥',
  '铅丹',
  '罂粟',
  '金汁',
])

function safetyOf(text) {
  const tags = []
  for (const [tag, re] of TOXIC_TERMS) {
    if (re.test(text)) tags.push(tag)
  }
  const caution = CAUTION_RE.test(text)
  let level = 'low'
  if (tags.some((tag) => HIGH_TOXIC.has(tag))) level = 'high'
  else if (tags.length || caution) level = 'medium'
  return { safetyLevel: level, toxicTags: tags, caution }
}

function stripFieldNoise(text) {
  return text
    .replace(/^[：:\s]+/, '')
    .replace(/^【[^】]*】/, '')
    .trim()
}

function splitFields(entryText) {
  const re = /【(主治|方药与用法|方药与方法|方药|用法与用量|用法|治疗方法|注意事项|禁忌|来源|编者按|备注|附录)】/g
  const matches = [...entryText.matchAll(re)]
  const fields = {}
  for (let i = 0; i < matches.length; i++) {
    const key = matches[i][1]
    const start = matches[i].index + matches[i][0].length
    const end = i + 1 < matches.length ? matches[i + 1].index : entryText.length
    const value = joinLines(entryText.slice(start, end))
    if (!fields[key]) fields[key] = value
    else fields[key] += `\n${value}`
  }
  return fields
}

// ---------------- 泉州 ----------------
function parseQz() {
  const raw = fs.readFileSync(QZ_TXT, 'utf8').replace(/\r/g, '')
  const tocStart = raw.indexOf('目录')
  const editor = raw.indexOf('编者的话')
  const toc = raw.slice(tocStart, editor)
  const chapters = []
  const sections = []
  let currentChapter = ''
  for (const line of toc.split(/\n/)) {
    const trimmed = line.trim()
    const cm = trimmed.match(/^第([一二三四五六])章\s*(.+)$/)
    if (cm) {
      currentChapter = cm[2].trim()
      chapters.push(currentChapter)
      continue
    }
    const sm = trimmed.match(/^(\d+)、(.+?)\s*…/)
    if (sm && currentChapter) {
      sections.push({ order: Number(sm[1]), name: sm[2].trim(), chapter: currentChapter })
    }
  }

  const bodyStart = raw.indexOf('第一章', editor)
  const body = raw.slice(bodyStart)
  const sectionMap = new Map()
  for (const s of sections) if (!sectionMap.has(s.name)) sectionMap.set(s.name, s)

  const chapterNames = new Set(chapters)
  const records = []
  let current = null
  let chapter = chapters[0] ?? ''
  let buffer = []

  const flush = () => {
    if (!current || !buffer.length) return
    const sectionText = buffer.join('\n')
    const entryRe = /^方([一二三四五六七八九十百零〇两]+)[：:]/gm
    const matches = [...sectionText.matchAll(entryRe)]
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index
      const end = i + 1 < matches.length ? matches[i + 1].index : sectionText.length
      const entryText = sectionText.slice(start, end)
      const label = `方${matches[i][1]}`
      const fields = splitFields(entryText)
      const indications = stripFieldNoise(fields['主治'] ?? '')
      let formula = stripFieldNoise(
        fields['方药'] ?? fields['方药与用法'] ?? fields['方药与方法'] ?? '',
      )
      let usage = stripFieldNoise(fields['用法'] ?? fields['用法与用量'] ?? fields['治疗方法'] ?? '')
      if (!usage && formula) {
        const cut = findUsageStart(formula)
        if (cut > 0) {
          usage = formula.slice(cut).trim()
          formula = formula.slice(0, cut).trim()
        }
      }
      const cautionText = [fields['注意事项'], fields['禁忌'], fields['编者按']]
        .filter(Boolean)
        .join('\n')
      const source = stripFieldNoise(fields['来源'] ?? '')
      const appendix = stripFieldNoise(fields['附录'] ?? fields['备注'] ?? '')
      const rawText = joinLines(entryText.replace(entryRe, ''))
      const safety = safetyOf(`${rawText} ${cautionText}`)
      const classed = classify(current.name, indications, current.chapter)
      const category = qzCategory(current.chapter, current.name)
      const subcategory = classed.subcategory
      const id = `qz-${pad(records.length + 1)}`
      if (!formula && !usage) continue
      records.push({
        id,
        origin: '泉州民间偏方验方选辑',
        title: `${current.name} · ${label}`,
        category,
        subcategory: current.name,
        era: '现代',
        eraRank: 100,
        book: '泉州民间偏方验方选辑',
        author: '',
        dynasty: '现代',
        year: '1959–2010',
        chapter: current.chapter,
        section: current.name,
        indications: indications || current.name,
        formula,
        usage,
        cautions: cautionText,
        appendix,
        source,
        raw: rawText,
        sourceNote: `《泉州民间偏方验方选辑》· ${current.chapter} · ${current.name} · ${label}`,
        safetyLevel: safety.safetyLevel,
        toxicTags: safety.toxicTags,
        groupKey: `qz:${current.chapter}:${current.name}:${sha1(rawText).slice(0, 12)}`,
        duplicateOf: '',
      })
    }
  }

  for (const line of body.split(/\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const cm = trimmed.match(/^第([一二三四五六])章\s*(.+)$/)
    if (cm) {
      flush()
      buffer = []
      current = null
      chapter = cm[2].trim()
      if (!chapterNames.has(chapter)) chapterNames.add(chapter)
      continue
    }
    const section = sectionMap.get(trimmed)
    if (section) {
      flush()
      buffer = []
      current = { ...section, chapter: section.chapter || chapter }
      continue
    }
    if (current) buffer.push(line)
  }
  flush()
  return records
}

// ---------------- 古籍 ----------------
function splitTcmocSections(raw) {
  const parts = raw.split(/<篇名>/).filter((s) => s.trim())
  const meta = parseBookMeta(parts[0] ?? '')
  if (!meta.dynasty) meta.dynasty = inferDynasty(raw.slice(0, 6000))
  const sections = []
  for (const part of parts.slice(1)) {
    const idx = part.indexOf('\n')
    const title = (idx < 0 ? part : part.slice(0, idx)).trim()
    const body = idx < 0 ? '' : part.slice(idx + 1)
    sections.push({ title, body })
  }
  return { meta, sections }
}

function headerTitle(header, sectionTitle) {
  let text = String(header).replace(/\\x/g, '').trim()
  text = text.replace(/^（[^）]*）/, '').trim()
  const zhi = text.indexOf('治')
  let name = zhi > 0 ? text.slice(0, zhi).trim() : text.trim()
  let indications = ''
  if (zhi === 0) {
    name = ''
    indications = text.slice(1).replace(/方$/, '').trim()
  } else if (zhi > 0) {
    indications = text.slice(zhi + 1).replace(/方$/, '').trim()
  }
  name = name.replace(/[（(].*?[)）]/g, '').trim()
  if (!name || name.length > 24 || /[。；]/.test(name)) name = sectionTitle
  return { name, indications }
}

const SPLIT_PATTERNS = [
  /(?:^|[。；！？\n])\s*(又方[：:∶]?)/g,
  /(?:^|[。；！？\n])\s*(【[^】\n]{1,120}】)/g,
  /(?:^|[。；！？\n])\s*([一二三四五六七八九十百]+方[：:∶]?)/g,
  /(?:^|[。；！？\n])\s*(治[^。；！？\n]{2,70}?[方汤散丸丹膏饮煎][：:∶]?)/g,
  /(?:^|[。；！？\n])\s*(治[^。；！？\n]{2,60}。[^。；！？\n]{2,16}(?:汤|散|丸|丹|膏|饮|煎)方)/g,
  /(?:^|[。；！？\n])\s*([\u4e00-\u9fff]{2,14}(?:汤|散|丸|丹|膏|饮|煎|锭|露|霜|胶|茶|饼)(?:方)?)[：:∶]/g,
  /(?:^|[。；！？\n])\s*([\u4e00-\u9fff]{2,14}(?:汤|散|丸|丹|膏|饮|煎)(?:方)?)\s*(?=治)/g,
]

function normalizeSectionForSplit(body) {
  let out = String(body).replace(/\r/g, '')
  out = out.replace(/\\psjzl\d+\.bmp/gi, ' ')
  out = out.replace(/\\x方\\x/g, '\n又方：')
  out = out.replace(/\\x([^\\x]{1,200})\\x/g, (_match, header) => `\n【${header.replace(/\s+/g, ' ').trim()}】\n`)
  out = out.replace(/\\x/g, '')
  out = out.replace(/\u00a0/g, ' ')
  out = out.replace(/[ \t]+/g, ' ')
  out = out.replace(/\n+/g, '\n')
  return out.trim()
}

function collectSplitStarts(text) {
  const starts = new Set()
  for (const re of SPLIT_PATTERNS) {
    for (const match of text.matchAll(re)) {
      const captured = match[1]
      if (!captured) continue
      const offset = match[0].indexOf(captured)
      const index = match.index + (offset >= 0 ? offset : 0)
      starts.add(index)
    }
  }
  const sorted = [...starts].sort((a, b) => a - b)
  return sorted.filter((index, i) => i === 0 || index - sorted[i - 1] > 2)
}

function parenDepthAt(text, index) {
  let depth = 0
  for (let i = 0; i < index; i += 1) {
    const ch = text[i]
    if (ch === '（' || ch === '(') depth += 1
    else if (ch === '）' || ch === ')') depth = Math.max(0, depth - 1)
  }
  return depth
}

function findUsageStart(body) {
  const patterns = [
    /(上(?:用水|为末|为细末|为散|为丸|为膏|件药|药|锉|等分|[一二三四五六七八九十百]+味))/g,
    /(?:^|[。；！？\s）)])\s*(上[一二三四五六七八九十百]*[味件药]?)/g,
    /(?:^|[。；！？，])\s*(每服|每次服|日[一二三]服|空心服|食前服|食后服|温服|水煎服|用水|以水|共研|为末|炼蜜|捣烂|捣筛|外敷|调敷|敷患处|贴患处|研末|调服|送服|吞服|煎水洗|外洗|熏洗|水调|调作|调搽|调涂|调贴|噙化|含化|吹鼻|吹喉|点眼|滴耳|滴鼻)/g,
  ]
  for (const [patternIndex, re] of patterns.entries()) {
    for (const match of body.matchAll(re)) {
      const marker = match[1]
      const markerAt = match.index + match[0].indexOf(marker)
      if (markerAt <= 0) continue
      // 强标记（上X味/上件药/上为末…）即使括号未闭合也要切，OCR 常丢右括号。
      if (patternIndex > 0 && parenDepthAt(body, markerAt) > 0) continue
      if (markerAt < 8) continue
      if (/[以之身上面头向]/.test(body[markerAt - 1] ?? '')) continue
      return markerAt
    }
  }
  return -1
}

const HERB_DOSE_ONE =
  /[\u4e00-\u9fff]{1,10}(?:（[^）]{0,12}）)?\s*(?:各)?[一二三四五六七八九十百0-9]+\s*(?:钱|两|分|厘|克|斤|升|合|枚|个|只|片|盏|铢|握|具|条|寸|尺|碗|杯|匙|粒)/

function stripNarrativePrefix(formula, indications) {
  const match = HERB_DOSE_ONE.exec(formula)
  if (!match || match.index < 8) return { formula, indications }
  const prefix = formula.slice(0, match.index)
  const stop = Math.max(prefix.lastIndexOf('。'), prefix.lastIndexOf('；'))
  if (stop < 0) return { formula, indications }
  const narrative = prefix.slice(0, stop + 1).trim()
  if (!narrative) return { formula, indications }
  return {
    formula: formula.slice(stop + 1).trim(),
    indications: `${indications} ${narrative}`.trim(),
  }
}

function parseBlock(blockText, sectionTitle, meta, era, chapter = '') {
  const raw = joinLines(blockText)
  if (raw.length < 12 || raw.length > 2800) return null
  const doses = doseCount(raw)
  const multi = hasMultiHerb(raw)
  const hasFormulaMarker = /上[一二三四五六七八九十百]+味|上等分|上为|上件|上药/.test(raw)
  const hasProcessingHint = /(水煎服|每服|共研|为末|炼蜜|捣烂|外敷|调敷)/.test(raw)
  if (doses < 2 && !(doses >= 1 && multi) && !(multi && hasProcessingHint) && !hasFormulaMarker) return null

  let body = raw.replace(/^[。；，、：:∶\s]+/, '').replace(/^又方[：:∶]?/, '').trim()
  let name = ''
  let indications = ''

  const header = body.match(/^【([^】]{1,160})】/)
  if (header) {
    const parsed = headerTitle(header[1], sectionTitle)
    name = parsed.name
    indications = parsed.indications
    body = body.slice(header[0].length).trim()
  }

  if (!indications && /^治/.test(body)) {
    const dotted = body.match(/^治([^。；！？]{2,90})[。；！？]/)
    if (dotted) {
      indications = dotted[1].replace(/方$/, '').trim()
      body = body.slice(dotted[0].length).trim()
    } else {
      const inline = body.match(/^治([^。；！？]{2,70}?)(?:方|汤|散|丸|丹|膏|饮|煎)[：:∶]?/)
      if (inline) {
        indications = inline[1].replace(/方$/, '').trim()
        body = body.slice(inline[0].length).trim()
      }
    }
  }

  if (!name) {
    const colonName = body.match(/^([\u4e00-\u9fff]{2,14}(?:汤|散|丸|丹|膏|饮|煎|锭|露|霜|胶|茶|饼)方?)(?=[：:∶]|治)/)
    const bareName = body.match(/^([\u4e00-\u9fff]{2,12}(?:汤|散|丸|丹|膏|饮|煎)方)(?=[\u4e00-\u9fff（(])/)
    const found = colonName ?? bareName
    if (found) {
      name = found[1].replace(/方$/, '').trim()
      body = body.slice(found[0].length).replace(/^[：:∶]?/, '').trim()
    }
  }

  body = body.replace(/^[。；，、：:∶]+/, '').trim()
  if (body.length < 6) return null

  const usageAt = findUsageStart(body)
  let formula = body
  let usage = ''
  if (usageAt > 0) {
    formula = body.slice(0, usageAt).trim()
    usage = body.slice(usageAt).trim()
  }
  formula = formula.replace(/^[。；，、：:∶]+/, '').replace(/[。；，、]+$/, '').trim()
  const cleaned = stripNarrativePrefix(formula, indications)
  formula = cleaned.formula
  indications = cleaned.indications
  formula = formula.replace(/（[^）]{0,12}$/, '').trim()
  if (formula.length < 6 || formula.length > 1000) return null
  if (isTheoryText(formula)) return null

  const herbalDoses = herbDoseCount(formula)
  const formulaStructure = /(上[一二三四五六七八九十百]+味|上等分|上为|上件|上药|共为末|研为末)/.test(formula)
  const usageStructure = /(上[一二三四五六七八九十百]+味|上等分|上为|上件|上药|共为末|研为末|每服|水煎服|用水|以水|煎服|为末|捣|研)/.test(usage)
  const narrativeStart = /^(用|取|以|将|候|凡|若|夫|其|此|然后|先|再)/.test(formula)
  const multiHerb = hasMultiHerb(formula)
  if (
    herbalDoses < 2 &&
    !formulaStructure &&
    !multiHerb &&
    !(herbalDoses >= 1 && formula.length < 220) &&
    !(usageStructure && !narrativeStart)
  )
    return null

  const cautions = raw.match(/[^。；]*(?:忌|不可|慎|孕妇|有毒|剧毒)[^。；]*[。；]?/g)?.join('') ?? ''
  const safety = safetyOf(raw)
  const { category, subcategory } = classify(sectionTitle, indications)
  const key = sha1(raw)
  let title = name && name !== sectionTitle ? name : sectionTitle
  if (title.length > 30 || isTheoryTitle(title)) title = sectionTitle.slice(0, 30)
  if (title === sectionTitle && isTheoryTitle(sectionTitle)) return null
  return {
    id: '',
    origin: meta.title,
    title,
    category,
    subcategory,
    era: era.label,
    eraRank: era.rank,
    book: meta.title,
    author: meta.author,
    dynasty: meta.dynasty,
    year: meta.year,
    chapter,
    section: sectionTitle,
    indications: (indications || sectionTitle).slice(0, 160),
    formula,
    usage: usage.slice(0, 900),
    cautions,
    appendix: '',
    source: '',
    raw,
    sourceNote: `《${meta.title}》${meta.dynasty ? `（${meta.dynasty}）` : ''} · ${sectionTitle}`,
    safetyLevel: safety.safetyLevel,
    toxicTags: safety.toxicTags,
    groupKey: `text:${key.slice(0, 16)}`,
    duplicateOf: '',
  }
}

function extractFromSection(section, meta, era) {
  if (/(五运时行|六气时行|论服饵|分三品药及反恶|秤两$|升合$|集注$|七表脉主治|八里脉主治|用药赋|经穴起止|考正穴法|^穴法$|^正文$|药性赋|汤头歌|歌括|歌诀|脉诀|脉法|诊法|像位|岁图)/.test(section.title))
    return []
  const body = normalizeSectionForSplit(cleanSectionBody(section.body))
  if (!body.trim()) return []
  const starts = collectSplitStarts(body)
  if (!starts.length) {
    const rec = parseBlock(body, section.title, meta, era)
    return rec ? [rec] : []
  }

  const chunks = []
  for (let i = 0; i < starts.length; i += 1) {
    const start = starts[i]
    const end = starts[i + 1] ?? body.length
    const chunk = body.slice(start, end).trim()
    if (chunk.length >= 12) chunks.push(chunk)
  }

  const out = []
  const titleSeen = new Map()
  let youfang = 0
  for (const chunk of chunks) {
    const rec = parseBlock(chunk, section.title, meta, era)
    if (!rec) continue
    if (/^又方/.test(chunk)) {
      youfang += 1
      rec.title = `${section.title}·又方${youfang}`
    } else {
      const seen = (titleSeen.get(rec.title) ?? 0) + 1
      titleSeen.set(rec.title, seen)
      if (seen > 1 && rec.title === section.title) rec.title = `${section.title}·方${seen}`
    }
    out.push(rec)
  }
  return out
}

function parseTcmoc() {
  const files = fs.readdirSync(TCMOC_DIR).filter((f) => f.endsWith('.txt')).sort()
  const bookNumber = (file) => Number(file.match(/^(\d+)/)?.[1] ?? -1)
  const filtered = bookFilter.length
    ? files.filter((f) => bookFilter.includes(bookNumber(f)))
    : files
  const selected = limitBooks > 0 ? filtered.slice(0, limitBooks) : filtered
  const records = []
  const perBook = []
  const skippedBooks = []
  for (const file of selected) {
    const number = bookNumber(file)
    if (SKIP_BOOK_NUMBERS.has(number)) {
      skippedBooks.push(file)
      continue
    }
    const raw = fs.readFileSync(path.join(TCMOC_DIR, file), 'utf8')
    const { meta, sections } = splitTcmocSections(raw)
    const bookLabel = meta.title || file.replace(/^\d+-/, '').replace(/\.txt$/, '')
    if (SKIP_BOOK_TITLE_RE.test(bookLabel)) {
      skippedBooks.push(`${file} [非方书]`)
      perBook.push({ file, title: bookLabel, dynasty: meta.dynasty, year: meta.year, era: '未知', sections: sections.length, formulas: 0 })
      continue
    }
    const era = eraOf(meta)
    let count = 0
    for (const section of sections) {
      // 跳过序、凡例、目录、本草、脉法等明显非方剂段
      if (/^(序|自序|原序|凡例|目录|跋|后序|进书表|校勘|重刊|出版|说明|前言|缘起|索引)/.test(section.title)) continue
      // 经络/腧穴章节移交经络页，不混入偏方
      if (isMeridianSection(section.title)) continue
      const recs = extractFromSection(section, meta, era)
      for (const rec of recs) {
        rec.id = `gx-${sha1(`${file}|${section.title}|${rec.raw}`).slice(0, 12)}`
        rec.book = meta.title
        rec.origin = meta.title
        records.push(rec)
        count += 1
      }
    }
    perBook.push({ file, title: meta.title, dynasty: meta.dynasty, year: meta.year, era: era.label, sections: sections.length, formulas: count })
    if (selected.length <= 20 || perBook.length % 50 === 0) {
      console.log(`[${perBook.length}/${selected.length}] ${file} sections=${sections.length} formulas=${count}`)
    }
  }
  return { records, perBook, skippedBooks }
}

// ---------------- 去重与统计 ----------------
function dedupe(records) {
  const seen = new Map()
  let duplicates = 0
  for (const rec of records) {
    const key = `${rec.title.replace(/[\s，。；：、（）()【】]/g, '')}|${rec.raw.replace(/[\s，。；：、（）()【】]/g, '').slice(0, 400)}`
    if (seen.has(key)) {
      rec.duplicateOf = seen.get(key)
      duplicates += 1
    } else {
      seen.set(key, rec.id)
    }
  }
  return duplicates
}

function stats(records, perBook) {
  const byCategory = {}
  const bySubcategory = {}
  const byEra = {}
  const byBook = {}
  const bySafety = {}
  let qz = 0
  let ancient = 0
  let withIndications = 0
  let withFormula = 0
  let withUsage = 0
  for (const rec of records) {
    byCategory[rec.category] = (byCategory[rec.category] ?? 0) + 1
    bySubcategory[rec.subcategory] = (bySubcategory[rec.subcategory] ?? 0) + 1
    byEra[rec.era] = (byEra[rec.era] ?? 0) + 1
    byBook[rec.book] = (byBook[rec.book] ?? 0) + 1
    bySafety[rec.safetyLevel] = (bySafety[rec.safetyLevel] ?? 0) + 1
    if (rec.origin === '泉州民间偏方验方选辑') qz += 1
    else ancient += 1
    if (rec.indications) withIndications += 1
    if (rec.formula && rec.formula.length > 8) withFormula += 1
    if (rec.usage) withUsage += 1
  }
  return {
    total: records.length,
    qz,
    ancient,
    withIndications,
    withFormula,
    withUsage,
    byCategory,
    byEra,
    bySafety,
    topBooks: Object.entries(byBook).sort((a, b) => b[1] - a[1]).slice(0, 30),
    topSubcategories: Object.entries(bySubcategory).sort((a, b) => b[1] - a[1]).slice(0, 40),
    books: perBook.length,
    formulasInBooks: perBook.reduce((s, b) => s + b.formulas, 0),
    perBook: perBook.filter((b) => b.formulas > 0).sort((a, b) => b.formulas - a.formulas).slice(0, 50),
  }
}

function sample(records) {
  const picks = []
  const qz = records.filter((r) => r.id.startsWith('qz-'))
  picks.push(...qz.slice(0, 3))
  const wanted = ['074-普济方', '060-圣济总录', '097-验方新编', '106-奇效简便良方', '087-医方集解', '055-太平圣惠方', '532-备急千金要方']
  for (const suffix of wanted) {
    const rec = records.find((r) => r.book === suffix)
    if (rec) picks.push(rec)
  }
  const seen = new Set()
  return picks.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true))).slice(0, 20)
}

function writeJsonl(records) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const fd = fs.openSync(OUT_JSONL, 'w')
  let buf = ''
  for (const rec of records) {
    buf += JSON.stringify(rec) + '\n'
    if (buf.length > 1_000_000) {
      fs.writeSync(fd, buf)
      buf = ''
    }
  }
  if (buf) fs.writeSync(fd, buf)
  fs.closeSync(fd)
}

function main() {
  const started = Date.now()
  console.log('解析泉州…')
  const qz = parseQz()
  console.log(`泉州：${qz.length} 条`)
  let ancient = []
  let perBook = []
  let skippedBooks = []
  if (!onlyQz) {
    console.log('解析 tcmoc 古籍…')
    const parsed = parseTcmoc()
    ancient = parsed.records
    perBook = parsed.perBook
    skippedBooks = parsed.skippedBooks
    console.log(`古籍：${ancient.length} 条，${perBook.length} 本，跳过方论/歌诀 ${skippedBooks.length} 本`)
  }
  const records = [...qz, ...ancient]
  const duplicates = dedupe(records)
  const report = {
    ...stats(records, perBook),
    duplicates,
    skippedBooks,
    generatedAt: new Date().toISOString(),
    elapsedMs: Date.now() - started,
  }
  writeJsonl(records)
  fs.writeFileSync(OUT_STATS, JSON.stringify(report, null, 2) + '\n')
  fs.writeFileSync(OUT_SAMPLE, JSON.stringify(sample(records), null, 2) + '\n')
  console.log(JSON.stringify({ total: report.total, qz: report.qz, ancient: report.ancient, duplicates, byCategory: report.byCategory, byEra: report.byEra, bySafety: report.bySafety }, null, 2))
  console.log(`写出 ${OUT_JSONL}`)
  console.log(`统计 ${OUT_STATS}`)
  console.log(`样例 ${OUT_SAMPLE}`)
}

main()
