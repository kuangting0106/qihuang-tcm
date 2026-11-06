import fs from 'node:fs'
import path from 'node:path'
import { pinyin } from 'pinyin-pro'

const ROOT = process.cwd()
const SOURCE_DIR = 'F:/中医/本草大纲/%E4%B8%AD%E8%8D%89%E8%8D%AF%E5%A4%A7%E5%85%A8'
const OUT_DIR = path.join(ROOT, 'public', 'data', 'bencao-dacheng')
const CATALOG_FILE = path.join(ROOT, 'public', 'data', 'bencao-lectures', 'catalog.json')
const IMAGE_CACHE_FILE = path.join(ROOT, 'scripts', 'content', 'bencao-dacheng-images.json')

const TYPE_A_NAMES = [
  '紫苏叶', '生姜', '香薷', '白芷', '薄荷', '菊花', '葛根', '淡豆豉', '知母', '天花粉',
  '决明子', '金银花', '蒲公英', '鱼腥草', '马齿苋', '青果', '地黄', '玄参', '牡丹皮', '赤芍',
  '木瓜', '丝瓜络', '藿香', '佩兰', '苍术', '砂仁', '茯苓', '薏苡仁', '赤小豆', '冬瓜皮',
  '车前子', '肉桂', '吴茱萸', '花椒', '小茴香', '陈皮', '薤白', '佛手', '玫瑰花', '山楂',
  '麦芽', '莱菔子', '鸡内金', '槐花', '三七', '白及', '川芎', '丹参', '益母草', '骨碎补',
  '川贝母', '桔梗', '胖大海', '白果', '酸枣仁', '柏子仁', '灵芝', '首乌藤', '人参', '西洋参',
  '党参', '太子参', '黄芪', '白术', '山药', '白扁豆', '甘草', '大枣', '蜂蜜', '鹿茸',
  '巴戟天', '杜仲', '肉苁蓉', '菟丝子', '冬虫夏草', '当归', '熟地黄', '何首乌', '白芍', '阿胶',
  '龙眼肉', '北沙参', '百合', '麦冬', '石斛', '玉竹', '黄精', '枸杞子', '女贞子', '桑椹',
  '黑芝麻', '龟甲', '鳖甲', '五味子', '乌梅', '肉豆蔻', '山茱萸', '覆盆子', '金樱子', '芡实',
]

const NAME_FALLBACK = {
  Xuanshen: '玄参',
  Chonglou: '重楼',
  Dajitan: '大蓟炭',
  Zhitiannanxing: '制天南星',
  Shudihuang: '熟地黄',
  Tianranbingpian: '天然冰片',
  Tubiechong: '土鳖虫',
  Sangpiaoxiao: '桑螵蛸',
  Ejiao: '阿胶',
  Geke: '蛤壳',
  Qianjinzishuang: '千金子霜',
  Paojiang: '炮姜',
  Zhichuanwu: '制川乌',
  Zhicaowu: '制草乌',
  Badoushuang: '巴豆霜',
  Zhigancao: '炙甘草',
  Duanshigao: '煅石膏',
  Chaogualouzi: '炒瓜蒌子',
  Fabanxia: '法半夏',
  Jiangbanxia: '姜半夏',
  Qingbanxia: '清半夏',
  Zhiheshouwu: '制何首乌',
  Jingjietan: '荆芥炭',
  Jiaozhizi: '焦栀子',
  Zhihuangqi: '炙黄芪',
  Jiaobinlang: '焦槟榔',
  Chuanshegan: '川射干',
  Taizishen: '太子参',
  Shuibanxia: '水半夏',
  Siyeshen: '四叶参',
  Yibeimu: '伊贝母',
  Ezhu: '莪术',
  Gualou: '瓜蒌',
  Bibo: '荜茇',
  Baijiang: '败酱草',
  Zisu: '紫苏叶',
  Xihonghua: '西红花',
  Difengpi: '地枫皮',
  Huangbo: '黄柏',
  Baomazipi: '暴马子皮',
}

const CATEGORY_DEFS = [
  { id: 'jiebiao', title: '解表药', keywords: ['解表', '发表', '疏散风热', '发汗', '祛风解表'] },
  { id: 'qingre', title: '清热药', keywords: ['清热', '泻火', '解毒', '凉血', '清热燥湿', '清虚热'] },
  { id: 'xiexia', title: '泻下药', keywords: ['泻下', '攻下', '润肠', '峻下', '逐水'] },
  { id: 'qufengshi', title: '祛风湿药', keywords: ['祛风湿', '风湿痹', '舒筋活络', '祛风除湿'] },
  { id: 'huashi', title: '化湿药', keywords: ['化湿', '燥湿', '芳香化浊', '辟秽'] },
  { id: 'lishui', title: '利水渗湿药', keywords: ['利水', '渗湿', '利尿', '通淋', '利湿退黄'] },
  { id: 'wenli', title: '温里药', keywords: ['温中', '散寒', '回阳', '补火助阳', '温经止痛'] },
  { id: 'liqi', title: '理气药', keywords: ['理气', '行气', '疏肝', '降逆', '理气止痛'] },
  { id: 'xiaoshi', title: '消食药', keywords: ['消食', '健胃', '化积', '消积'] },
  { id: 'quchong', title: '驱虫药', keywords: ['杀虫', '驱虫', '灭虱'] },
  { id: 'zhixue', title: '止血药', keywords: ['止血', '收敛止血', '凉血止血', '化瘀止血'] },
  { id: 'huoxue', title: '活血化瘀药', keywords: ['活血', '化瘀', '通经', '止痛', '破血'] },
  { id: 'huatan', title: '化痰止咳平喘药', keywords: ['化痰', '止咳', '平喘', '润肺', '祛痰'] },
  { id: 'anshen', title: '安神药', keywords: ['安神', '宁心', '养心', '镇静'] },
  { id: 'pinggan', title: '平肝息风药', keywords: ['平肝', '息风', '止痉', '潜阳', '平肝明目'] },
  { id: 'buxu', title: '补虚药', keywords: ['补气', '补血', '补阴', '补阳', '补益', '益气', '养血', '滋阴', '温阳', '大补', '补脾', '补肺', '补肾', '补肝', '补心', '益精', '填髓'] },
  { id: 'souse', title: '收涩药', keywords: ['收敛', '固涩', '涩精', '止遗', '止泻', '固表'] },
  { id: 'yongtu', title: '涌吐药', keywords: ['涌吐', '催吐'] },
  { id: 'gongdu', title: '攻毒杀虫止痒药', keywords: ['攻毒', '消肿', '止痒', '杀虫止痒', '拔毒'] },
]
const OTHER_CATEGORY = { id: 'qita', title: '其他药' }

function cleanText(text) {
  return String(text ?? '')
    .replace(/\r/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[\t ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function oneLine(text) {
  return cleanText(text).replace(/\s+/g, ' ').trim()
}

function splitParagraphs(text) {
  return cleanText(text)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function parseFlavor(text) {
  const raw = oneLine(text)
  if (!raw) return { flavorTags: [], nature: '', meridianNames: [], flavorText: '' }
  const match = raw.match(/^(.+?)[。；;]\s*归(.+?经)?/)
  const flavorPart = match ? match[1] : raw.split('归')[0]
  const meridianPart = match ? match[2] ?? '' : raw.includes('归') ? raw.slice(raw.indexOf('归') + 1) : ''
  const parts = flavorPart.split(/[，,、]/).map((part) => part.trim()).filter(Boolean)
  const nature = parts.find((part) => /寒|热|温|凉|平/.test(part)) ?? ''
  const flavorTags = parts
    .map((part) => part.replace(/[，,。；;].*$/, '').trim())
    .filter((part) => part && !/寒|热|温|凉|平|有毒|无毒/.test(part))
  const meridianNames = meridianPart
    ? meridianPart
        .replace(/[。；;].*$/, '')
        .split(/[、，,]/)
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => (part.endsWith('经') ? part : `${part}经`))
    : []
  return { flavorTags, nature, meridianNames, flavorText: raw }
}

function parseFunction(text) {
  const raw = oneLine(text)
  if (!raw) return { effects: '', indications: '' }
  const marker = raw.match(/[。；;]?\s*(?:用于|主治|治)\s*/)
  if (!marker || marker.index === undefined) {
    return { effects: raw.replace(/[。；;]$/, ''), indications: '' }
  }
  const effects = raw.slice(0, marker.index).replace(/[。；;]$/, '').trim()
  const indications = raw.slice(marker.index + marker[0].length).trim()
  return { effects, indications }
}

function categoryOf(text) {
  const clauses = String(text ?? '')
    .split(/[，,、；;。]/)
    .map((item) => item.trim())
    .filter(Boolean)
  if (!clauses.length) return OTHER_CATEGORY
  const scored = CATEGORY_DEFS.map((def, order) => {
    let score = 0
    clauses.forEach((clause, index) => {
      const weight = index === 0 ? 12 : index === 1 ? 6 : 2
      if (def.keywords.some((keyword) => clause.includes(keyword))) score += weight
    })
    return { def, score, order }
  })
  scored.sort((a, b) => b.score - a.score || a.order - b.order)
  return scored[0].score > 0 ? scored[0].def : OTHER_CATEGORY
}

function section(kind, label, text, source) {
  const content = cleanText(text)
  if (!content) return null
  return { kind, label, text: content, source }
}

function parseTypeA(raw, number, name) {
  const text = cleanText(raw.replace(/^\uFEFF/, ''))
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)
  const quoteLine = lines.find((line) => /^《.+》记载/.test(line)) ?? ''
  const quoteMatch = quoteLine.match(/^《([^》]+)》记载[：:]\s*[“"]([\s\S]*?)[”"]\s*$/)
  const quoteText = quoteMatch ? quoteMatch[2].trim() : quoteLine.replace(/^《[^》]+》记载[：:]?/, '').trim()
  const quoteSource = quoteMatch ? quoteMatch[1] : ''

  const headings = []
  let current = { label: '引文', lines: [] }
  for (const line of lines) {
    const heading = line.match(/^【([^】]+)】$/)
    if (heading) {
      if (current.lines.length || current.label !== '引文') headings.push(current)
      current = { label: heading[1], lines: [] }
    } else if (current.label === '引文' && /^性味归经[：:]/.test(line)) {
      current.flavor = line.replace(/^性味归经[：:]/, '').trim()
    } else {
      current.lines.push(line)
    }
  }
  if (current.lines.length || current.label !== '引文') headings.push(current)

  const byLabel = new Map(headings.map((item) => [item.label, item.lines.join('\n')]))
  const flavor = parseFlavor(byLabel.get('性味归经') ?? headings.find((item) => item.flavor)?.flavor ?? '')
  const func = parseFunction(byLabel.get('功能主治') ?? '')
  const dosage = oneLine(byLabel.get('用法用量') ?? '')
  const contraindications = oneLine(byLabel.get('使用注意') ?? '')
  const contentSections = [
    section('processing', '炮制方法', byLabel.get('炮制方法')),
    section('selection', '选购秘笈', byLabel.get('选购秘笈')),
    section('recipe', '家用妙方', byLabel.get('家用妙方')),
    section('diet', '食疗养生', byLabel.get('食疗养生')),
  ].filter(Boolean)
  const profileText = [flavor.flavorText, func.effects, func.indications, dosage, contraindications].join(' ')
  const category = categoryOf(`${func.effects}。${func.indications}。${name}`)
  const allText = [quoteText, profileText, contentSections.map((item) => item.text).join(' ')].join(' ')
  return {
    number,
    name,
    pinyin: pinyin(name, { toneType: 'none' }).replace(/\s+/g, ''),
    aliases: [],
    categoryId: category.id,
    categoryTitle: category.title,
    quote: quoteText ? { text: quoteText, source: quoteSource ? `《${quoteSource}》` : '原书引文' } : null,
    profile: {
      flavorTags: flavor.flavorTags,
      nature: flavor.nature,
      meridianNames: flavor.meridianNames,
      effects: func.effects,
      indications: func.indications,
      dosage,
      contraindications,
    },
    sections: contentSections,
    sourceText: '',
    charCount: allText.length,
    documents: [{ file: `${number}.txt`, kind: 'outline', title: '本草大全 · 本草纲目引文' }],
  }
}

function normalizeHeadings(raw) {
  return cleanText(raw).replace(/【\s*([^】]*?)\s*】/g, (_, label) => `【${label.replace(/\s+/g, '')}】`)
}

function extractPinyin(text) {
  const first = text.split(/\n/).map((line) => line.trim()).find(Boolean) ?? ''
  const match = first.match(/^全拼[：:]\s*(.+)$/)
  return match ? match[1].replace(/[^A-Za-z]/g, '') : ''
}

function normPinyin(text) {
  return String(text ?? '').toLowerCase().replace(/[^a-z]/g, '')
}

function findNameByPinyin(text, target, fallback) {
  const mapped = NAME_FALLBACK[target] ?? NAME_FALLBACK[target.charAt(0).toUpperCase() + target.slice(1)]
  if (mapped) return mapped
  const found = new Map()
  for (let len = 2; len <= 6; len += 1) {
    for (let i = 0; i + len <= text.length; i += 1) {
      const candidate = text.slice(i, i + len)
      if (!/^[\u4e00-\u9fa5]+$/.test(candidate)) continue
      const candidatePinyin = normPinyin(pinyin(candidate, { toneType: 'none', type: 'array' }).join(''))
      if (candidatePinyin === target) found.set(candidate, (found.get(candidate) ?? 0) + 1)
    }
  }
  const ranked = [...found.entries()].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
  if (ranked.length) return ranked[0][0]
  return fallback
}

function extractSourceName(sourceText) {
  const text = oneLine(sourceText)
  const match = text.match(/(?:科|属)植物\s*([\u4e00-\u9fa5]{2,10})/)
  return match ? match[1] : ''
}

function parseTypeB(raw, number) {
  const text = normalizeHeadings(raw.replace(/^\uFEFF/, ''))
  const target = normPinyin(extractPinyin(text))
  const parts = []
  const regex = /【([^】]+)】/g
  let match
  while ((match = regex.exec(text))) {
    parts.push({ label: match[1], start: regex.lastIndex })
  }
  const byLabel = new Map()
  for (let index = 0; index < parts.length; index += 1) {
    const current = parts[index]
    const end = index + 1 < parts.length ? parts[index + 1].start - parts[index + 1].label.length - 2 : text.length
    byLabel.set(current.label, text.slice(current.start, end).trim())
  }
  const sourceText = byLabel.get('来源') ?? ''
  const aliases = (byLabel.get('别名') ?? '')
    .split(/[，,、；;。]/)
    .map((item) => item.trim())
    .filter(Boolean)
  const fallback = extractSourceName(sourceText)
  const name = findNameByPinyin(text, target, fallback || target)
  const flavor = parseFlavor(byLabel.get('性味归经') ?? '')
  const func = parseFunction(byLabel.get('功能主治') ?? '')
  const dosage = oneLine(byLabel.get('用法用量') ?? '')
  const contraindications = oneLine(byLabel.get('使用注意') ?? '')
  const sectionDefs = [
    ['来源', 'source', '来源'],
    ['植物形态', 'morphology', '植物形态'],
    ['生境分布', 'habitat', '生境分布'],
    ['采制', 'collection', '采制'],
    ['炮制', 'processing', '炮制'],
    ['药材性状', 'character', '药材性状'],
    ['化学成分', 'chemistry', '化学成分'],
    ['药理', 'pharmacology', '药理'],
    ['附方', 'formula', '附方'],
  ]
  const contentSections = sectionDefs
    .map(([label, kind, title]) => section(kind, title, byLabel.get(label), '《中草药大全》'))
    .filter(Boolean)
  const profileText = [flavor.flavorText, func.effects, func.indications, dosage, contraindications, sourceText].join(' ')
  const category = categoryOf(`${func.effects}。${func.indications}。${name}`)
  const allText = [profileText, contentSections.map((item) => item.text).join(' ')].join(' ')
  return {
    number,
    name,
    pinyin: target.toLowerCase(),
    aliases,
    categoryId: category.id,
    categoryTitle: category.title,
    quote: null,
    profile: {
      flavorTags: flavor.flavorTags,
      nature: flavor.nature,
      meridianNames: flavor.meridianNames,
      effects: func.effects,
      indications: func.indications,
      dosage,
      contraindications,
    },
    sections: contentSections,
    sourceText,
    charCount: allText.length,
    documents: [{ file: `${number}.txt`, kind: 'herb', title: '本草大全 · 中草药大全' }],
  }
}

function normalizeName(name) {
  return String(name ?? '').replace(/[《》\s·（）()]/g, '').trim()
}

function loadCatalogImageMap() {
  const map = new Map()
  if (!fs.existsSync(CATALOG_FILE)) return map
  const catalog = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8'))
  for (const item of catalog.items ?? []) {
    if (!item.image) continue
    const names = [item.name, item.ancientName, ...(item.aliases ?? []), ...(item.alsoKnownAs ?? [])]
      .map(normalizeName)
      .filter(Boolean)
    for (const name of names) {
      if (!map.has(name)) map.set(name, item.image)
    }
  }
  return map
}

function loadRemoteImageMap() {
  if (!fs.existsSync(IMAGE_CACHE_FILE)) return new Map()
  try {
    const data = JSON.parse(fs.readFileSync(IMAGE_CACHE_FILE, 'utf8'))
    return new Map(Object.entries(data).map(([name, image]) => [normalizeName(name), image]))
  } catch {
    return new Map()
  }
}

function mergeEntry(base, extra) {
  if (!base) return extra
  if (!extra) return base
  const sections = [...base.sections]
  const existingLabels = new Set(sections.map((item) => item.label))
  for (const item of extra.sections) {
    if (existingLabels.has(item.label)) continue
    sections.push(item)
    existingLabels.add(item.label)
  }
  const profile = {
    flavorTags: base.profile.flavorTags.length ? base.profile.flavorTags : extra.profile.flavorTags,
    nature: base.profile.nature || extra.profile.nature,
    meridianNames: base.profile.meridianNames.length ? base.profile.meridianNames : extra.profile.meridianNames,
    effects: base.profile.effects || extra.profile.effects,
    indications: base.profile.indications || extra.profile.indications,
    dosage: base.profile.dosage || extra.profile.dosage,
    contraindications: base.profile.contraindications || extra.profile.contraindications,
  }
  return {
    ...base,
    aliases: [...new Set([...base.aliases, ...extra.aliases])],
    quote: base.quote ?? extra.quote,
    profile,
    sections,
    sourceText: base.sourceText || extra.sourceText,
    charCount: base.charCount + extra.charCount,
    documents: [...base.documents, ...extra.documents],
    categoryId: base.categoryId === OTHER_CATEGORY.id ? extra.categoryId : base.categoryId,
    categoryTitle: base.categoryId === OTHER_CATEGORY.id ? extra.categoryTitle : base.categoryTitle,
  }
}

function main() {
  if (!fs.existsSync(SOURCE_DIR)) throw new Error(`目录不存在：${SOURCE_DIR}`)
  const files = fs.readdirSync(SOURCE_DIR).filter((file) => /^\d+\.txt$/.test(file)).sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10))
  if (files.length !== 714) throw new Error(`预期 714 个文件，实际 ${files.length}`)

  const entries = new Map()
  const sourceNames = []
  for (const file of files) {
    const number = Number.parseInt(file, 10)
    const raw = fs.readFileSync(path.join(SOURCE_DIR, file), 'utf8')
    const entry = number <= 100
      ? parseTypeA(raw, number, TYPE_A_NAMES[number - 1])
      : parseTypeB(raw, number)
    if (!entry.name || entry.name.length < 2) throw new Error(`第 ${number} 条未能识别药名`)
    sourceNames.push({ number, name: entry.name })
    const key = normalizeName(entry.name)
    entries.set(key, mergeEntry(entries.get(key), entry))
  }

  const imageMap = loadCatalogImageMap()
  const remoteImageMap = loadRemoteImageMap()
  const list = [...entries.values()]
    .sort((a, b) => a.number - b.number)
    .map((entry, index) => {
      const id = `dacheng-${String(index + 1).padStart(3, '0')}`
      const image = imageMap.get(normalizeName(entry.name)) ?? remoteImageMap.get(normalizeName(entry.name))
      const summarySource = entry.profile.effects || entry.profile.indications || entry.quote?.text || entry.sourceText
      return {
        ...entry,
        id,
        summary: oneLine(summarySource).slice(0, 90),
        images: image ? [image] : [],
        docCount: entry.documents.length,
      }
    })

  fs.rmSync(OUT_DIR, { recursive: true, force: true })
  fs.mkdirSync(path.join(OUT_DIR, 'entries'), { recursive: true })

  const indexItems = list.map((entry) => ({
    id: entry.id,
    number: entry.number,
    name: entry.name,
    pinyin: entry.pinyin,
    aliases: entry.aliases,
    categoryId: entry.categoryId,
    categoryTitle: entry.categoryTitle,
    summary: entry.summary,
    image: entry.images[0] ?? null,
    docCount: entry.docCount,
    charCount: entry.charCount,
  }))

  const categories = [...CATEGORY_DEFS, OTHER_CATEGORY]
    .map((def) => ({ id: def.id, title: def.title, count: list.filter((entry) => entry.categoryId === def.id).length }))
    .filter((item) => item.count > 0)

  fs.writeFileSync(path.join(OUT_DIR, 'index.json'), `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    total: list.length,
    withImages: list.filter((entry) => entry.images.length).length,
    categories,
    items: indexItems,
  }, null, 2)}\n`)

  for (const entry of list) {
    fs.writeFileSync(path.join(OUT_DIR, 'entries', `${entry.id}.json`), `${JSON.stringify(entry, null, 2)}\n`)
  }

  console.log(`Wrote ${list.length} entries, ${list.filter((entry) => entry.images.length).length} with images`)
  console.log('Categories:', categories.map((item) => `${item.title} ${item.count}`).join(' / '))
  const missing = sourceNames.filter((item) => !list.some((entry) => normalizeName(entry.name) === normalizeName(item.name)))
  console.log('Merged source files:', sourceNames.length - missing.length, 'unique names:', list.length)
  if (missing.length) console.log('Unmerged:', missing.slice(0, 20))
  const noImage = list.filter((entry) => !entry.images.length).length
  console.log('Without images:', noImage)
  console.log('Longest:', list.slice().sort((a, b) => b.charCount - a.charCount).slice(0, 5).map((entry) => `${entry.name} ${entry.charCount}`).join(' / '))
}

main()
