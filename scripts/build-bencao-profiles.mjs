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
  if (!herb) {
    unresolved.push(entry.name)
    continue
  }

  const flavor = splitList(herb.flavor)
    .flatMap((part) => part.split(''))
    .filter((char) => '辛甘酸苦咸淡涩'.includes(char))
  const nature = clean(herb.nature_category) || clean(herb.nature)

  items[entry.name] = {
    matchedName: clean(herb.name),
    flavor: [...new Set(flavor)].join(''),
    nature,
    meridians: splitList(herb.meridians),
    action: clean(herb.action),
    dosage: clean(herb.dosage),
    contraindication: clean(herb.contraindication),
  }
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
