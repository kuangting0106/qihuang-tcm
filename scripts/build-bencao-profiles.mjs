import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const catalogFile = path.join(root, 'public', 'data', 'bencao-lectures', 'catalog.json')
const sourceFile = process.env.BENCAO_SOURCE ?? path.join(process.env.TEMP ?? '', 'herbs-source.json')
const outFile = path.join(root, 'scripts', 'content', 'bencao-profiles.json')

const SOURCE = {
  id: 'zhongyi-buddy-herbs',
  name: '中医Buddy 中药数据',
  repository: 'iosonolatte/zhongyi-buddy',
  commit: 'dd8baddaa6a693e1d761b2ba187fb52edd16bfe0',
  file: 'nihaixia-web/data/herbs.json',
  license: '仓库未声明许可',
  note:
    '公开整理的中药资料，原项目注明数据移植自 nihaixia-app，属倪海厦一系资料，并非独立药典或校勘本。仅抽取性味、归经、功效、剂量、禁忌等事实字段用于补足讲义条目，引用时须与讲义原文及原书核对。',
}

// 讲义底稿中的药名与公开资料药名不完全一致，只做同药异名的保守映射。
const ALIASES = {
  '青石赤石黄石白石黑石脂等': '五色石脂',
  '络石 络石藤': '络石',
  '黄耆 黄芪': '黄芪',
  '古南(石南?)': '古南',
  '蒴翟细叶': '蒴翟',
  '炙鳖甲': '鳖甲',
  '银花': '金银花',
  '南柴胡': '柴胡',
  '甜杏仁': '杏仁',
  '枳壳': '枳实',
  '肉松容': '肉苁蓉',
  '灶心土': '伏龙肝',
  '灯芯草': '灯心草',
  '密陀僧 密陀曾': '密陀僧',
  '蝎子 全蝎': '全蝎',
  '（鼯）鼠': '鼯鼠',
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function splitList(value) {
  if (Array.isArray(value)) return value.map((item) => clean(item)).filter(Boolean)
  return clean(value)
    .split(/[、，,；;／/\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const catalog = JSON.parse(fs.readFileSync(catalogFile, 'utf8'))
const source = JSON.parse(fs.readFileSync(sourceFile, 'utf8'))

const CATEGORY_RULES = [
  [/解表/, ['exterior']],
  [/泻下|涌吐/, ['purgative']],
  [/止血|凉血/, ['stop-bleeding']],
  [/活血|化瘀/, ['blood-moving']],
  [/化痰|止咳|泻肺|清肺/, ['cough-phlegm']],
  [/安神|开窍|平肝/, ['calm-open']],
  [/收涩|固涩/, ['astringent']],
  [/理气|行气|消食/, ['qi-digest']],
  [/补益|补气|补阳|补阴|补血|温里|生津/, ['warm-tonic']],
  [/清热|清热解毒|清热凉血|清热燥湿/, ['clear-heat']],
  [/利水|渗湿|祛风湿|化湿|燥湿/, ['wind-damp']],
  [/杀虫|矿石|动物|外用|种子|谷物|根茎|花类|止痛|通络|软坚散结|排脓/, ['attack-cold']],
]

function mapCategories(value) {
  const ids = []
  for (const rule of CATEGORY_RULES) {
    if (rule[0].test(value)) {
      for (const id of rule[1]) if (!ids.includes(id)) ids.push(id)
    }
  }
  return ids
}

// 公开资料分类明显有误的个别药，按讲义主治纠正。
const CATEGORY_OVERRIDES = {
  芎穷: ['blood-moving'],
  川芎: ['blood-moving'],
}

// 公开资料中个别条目与讲义药名相近但并非同一药，或同一植物不同药用部位；
// 这些字段回退到讲义原文，避免把另一味药的功效写成这一味。
const PROFILE_FIXES = {
  常山: {
    action:
      '常山为驱痰截疟要药，主祛老痰积饮，治新久诸疟；能引痰上行使吐，下行使下，逐水消肿。',
    therapyCategoryIds: ['cough-phlegm'],
    sourceCategory: '本站据讲义主治纠正',
  },
  槐角: {
    action: '',
    therapyCategoryIds: ['stop-bleeding'],
    sourceCategory: '本站据讲义主治归类',
  },
  铅丹: {
    action: '',
    flavor: '',
    nature: '',
    meridians: [],
    therapyCategoryIds: ['attack-cold'],
    sourceCategory: '本站据讲义主治归类',
  },
  芍药: { action: '' },
}
const CATEGORY_FALLBACK = {
  肉松容: ['warm-tonic'],
  五加皮: ['wind-damp'],
  慈石: ['calm-open'],
  玄参: ['clear-heat'],
  狗脊: ['warm-tonic'],
  水苏: ['exterior'],
  乌韭: ['clear-heat'],
  灶心土: ['stop-bleeding', 'warm-tonic'],
  灯芯草: ['wind-damp'],
  密陀僧: ['attack-cold'],
  土茯苓: ['wind-damp'],
  海金沙: ['wind-damp'],
  五倍子: ['astringent'],
  百草霜: ['stop-bleeding'],
  石决明: ['calm-open'],
  藿香: ['wind-damp'],
  薄荷: ['exterior'],
  白附子: ['cough-phlegm'],
  钩藤: ['calm-open'],
  威灵仙: ['wind-damp'],
  全蝎: ['calm-open'],
  夜交藤: ['calm-open'],
  莱菔子: ['qi-digest'],
  白芥子: ['cough-phlegm'],
  黄明胶: ['warm-tonic'],
  太子参: ['warm-tonic'],
  锁阳: ['warm-tonic'],
  香附: ['qi-digest'],
  益智仁: ['warm-tonic'],
  白蒿: ['wind-damp'],
  蒺藜子: ['calm-open'],
  香蒲: ['stop-bleeding'],
  蕤核: ['clear-heat'],
  鲤鱼胆: ['clear-heat'],
  马先蒿: ['wind-damp'],
  女菀: ['cough-phlegm'],
  '古南(石南?)': ['wind-damp'],
  蔓椒: ['attack-cold'],
  青盐: ['attack-cold'],
  '密陀僧 密陀曾': ['attack-cold'],
  '蝎子 全蝎': ['calm-open'],
  '（鼯）鼠': ['attack-cold'],
  龙须草: ['wind-damp'],
  青黛: ['clear-heat'],
  常山: ['purgative'],
}


function applyProfileFixes(name, item) {
  const fix = PROFILE_FIXES[name]
  return fix ? { ...item, ...fix } : item
}

const byName = new Map()
for (const herb of source.herbs) {
  const name = clean(herb.name)
  if (name && !byName.has(name)) byName.set(name, herb)
}

const items = {}
const matched = new Set()
const unresolved = []

for (const entry of catalog.items) {
  const candidates = [entry.name, ALIASES[entry.name], ...(entry.aliases ?? [])].filter(Boolean)
  const herb = candidates.map((name) => byName.get(name)).find(Boolean)
  const override = CATEGORY_OVERRIDES[entry.name]
  if (!herb) {
    unresolved.push(entry.name)
    const fallback = override ?? CATEGORY_FALLBACK[entry.name] ?? []
    if (fallback.length) {
      items[entry.name] = applyProfileFixes(entry.name, {
        matchedName: '',
        flavor: '',
        nature: '',
        meridians: [],
        action: '',
        dosage: '',
        contraindication: '',
        sourceCategory: override ? '本站据讲义主治纠正' : '',
        therapyCategoryIds: fallback,
      })
    }
    continue
  }

  const flavor = splitList(herb.flavor)
    .flatMap((part) => part.split(''))
    .filter((char) => '辛甘酸苦咸淡涩'.includes(char))
  const nature = clean(herb.nature_category) || clean(herb.nature)
  const sourceCategory = clean(herb.category)
  const therapyCategoryIds = mapCategories(sourceCategory)

  items[entry.name] = applyProfileFixes(entry.name, {
    matchedName: clean(herb.name),
    flavor: [...new Set(flavor)].join(''),
    nature,
    meridians: splitList(herb.meridians),
    action: clean(herb.action),
    dosage: clean(herb.dosage),
    contraindication: clean(herb.contraindication),
    sourceCategory: override ? '本站据讲义主治纠正' : sourceCategory,
    therapyCategoryIds: override
      ? override
      : therapyCategoryIds.length
        ? therapyCategoryIds
        : (CATEGORY_FALLBACK[entry.name] ?? []),
  })
  matched.add(entry.name)
}

const payload = {
  generatedAt: new Date().toISOString(),
  source: SOURCE,
  total: Object.keys(items).length,
  items,
}

fs.writeFileSync(outFile, JSON.stringify(payload, null, 2) + '\n', 'utf8')

console.log(
  `Wrote ${path.relative(root, outFile)}: ${payload.total}/${catalog.items.length} matched, ${unresolved.length} unresolved`,
)
console.log('unresolved:', unresolved.join('、'))
console.log(
  `meridians: ${Object.values(items).filter((x) => x.meridians.length).length}, ` +
    `flavor: ${Object.values(items).filter((x) => x.flavor).length}, ` +
    `action: ${Object.values(items).filter((x) => x.action).length}`,
)
