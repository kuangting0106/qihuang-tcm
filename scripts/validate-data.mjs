import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataPath = path.join(root, 'public', 'data', 'sample_data.json')
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
const errors = []
const warnings = []

const norm = (s) =>
  String(s || '')
    .replace(/[\s\u3000]/g, '')
    .replace(/[“”‘’"'「」『』（）()《》〈〉，。；：、！？·…—\-—,.!?;:]/g, '')

const sourceMap = new Map()
for (const s of data.sources ?? []) {
  if (sourceMap.has(s.id)) errors.push(`重复出处 id: ${s.id}`)
  sourceMap.set(s.id, s)
  for (const key of ['id', 'type', 'work', 'locator']) {
    if (!s[key]) errors.push(`出处 ${s.id ?? '(无 id)'} 缺少 ${key}`)
  }
}

function checkCitationIds(ids, where) {
  if (!Array.isArray(ids) || ids.length === 0) {
    errors.push(`${where}: 缺少 citationIds`)
    return
  }
  for (const id of ids) {
    if (!sourceMap.has(id)) errors.push(`${where}: 引用了不存在的出处 ${id}`)
  }
}

function walkClaims(node, where = 'root') {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    node.forEach((v, i) => walkClaims(v, `${where}[${i}]`))
    return
  }
  if (typeof node.text === 'string' && Array.isArray(node.citationIds)) {
    if (!['quote', 'paraphrase', 'analysis'].includes(node.kind)) {
      errors.push(`${where}: kind 非法 (${node.kind})`)
    }
    if (!node.text.trim()) errors.push(`${where}: text 为空`)
    checkCitationIds(node.citationIds, where)
    if (node.kind === 'quote') {
      const hit = node.citationIds.some((id) => {
        const src = sourceMap.get(id)
        return src?.quote && norm(src.quote).includes(norm(node.text))
      })
      if (!hit) errors.push(`${where}: 标为 quote，但引用原文中找不到该句`)
    }
  }
  for (const [k, v] of Object.entries(node)) {
    if (k === 'citationIds') continue
    walkClaims(v, `${where}.${k}`)
  }
}

const herbIds = new Set()
for (const h of data.herbs ?? []) {
  if (!h.id || herbIds.has(h.id)) errors.push(`药材 id 缺失或重复: ${h.id}`)
  herbIds.add(h.id)
  for (const key of ['name', 'pinyin']) if (!h[key]) errors.push(`药材 ${h.id} 缺少 ${key}`)
  if (!Array.isArray(h.images) || h.images.length !== 3) {
    errors.push(`药材 ${h.id}: 必须正好 3 张图片`)
  } else {
    for (const im of h.images) {
      if (!im.url) errors.push(`药材 ${h.id}: 图片缺少 url`)
      else if (im.url.startsWith('/')) {
        const f = path.join(root, 'public', im.url.replace(/^\//, ''))
        if (!fs.existsSync(f)) errors.push(`药材 ${h.id}: 图片文件不存在 ${im.url}`)
      }
      if (!im.credit) errors.push(`药材 ${h.id}: 图片缺少 credit`)
      if (!im.license) errors.push(`药材 ${h.id}: 图片缺少 license`)
      if (im.type === 'photo' && !im.sourceUrl) errors.push(`药材 ${h.id}: 实拍图缺少 sourceUrl`)
    }
  }
  for (const p of h.properties ? Object.keys(h.properties) : []) {
    if (!h.properties[p]?.text) errors.push(`药材 ${h.id}: 属性 ${p} 为空`)
  }
  if (!Array.isArray(h.pairings)) errors.push(`药材 ${h.id}: pairings 不是数组`)
  else {
    for (const pairing of h.pairings) {
      if (!herbIds.has(pairing.herbId) && !data.herbs.some((x) => x.id === pairing.herbId)) {
        errors.push(`药材 ${h.id}: 配伍引用了不存在的药材 ${pairing.herbId}`)
      }
      checkCitationIds(pairing.citationIds, `药材 ${h.id} 配伍 ${pairing.herbId}`)
    }
  }
  if (!Array.isArray(h.meridianIds) || h.meridianIds.length === 0) {
    errors.push(`药材 ${h.id}: 缺少归经 meridianIds`)
  }
}

const taxonomy = data.herbTaxonomy
if (!taxonomy) {
  errors.push('缺少 herbTaxonomy 本草分类')
} else {
  if (!Array.isArray(taxonomy.ranks) || taxonomy.ranks.length !== 3) {
    errors.push('herbTaxonomy: 三经必须正好 3 项')
  }
  if (!Array.isArray(taxonomy.categories) || taxonomy.categories.length !== 12) {
    errors.push('herbTaxonomy: 功效分类必须正好 12 项')
  }
  const rankIds = new Set((taxonomy.ranks ?? []).map((r) => r.id))
  const categoryIds = new Set((taxonomy.categories ?? []).map((c) => c.id))
  if (rankIds.size !== 3) errors.push('herbTaxonomy: 三经 id 缺失或重复')
  if (categoryIds.size !== 12) errors.push('herbTaxonomy: 功效分类 id 缺失或重复')
  for (const h of data.herbs ?? []) {
    if (!rankIds.has(h.classicRankId)) {
      errors.push(`药材 ${h.id}: 三经分类无效 ${h.classicRankId}`)
    }
    if (!Array.isArray(h.therapyCategoryIds) || h.therapyCategoryIds.length === 0) {
      errors.push(`药材 ${h.id}: 缺少功效分类 therapyCategoryIds`)
    } else if (new Set(h.therapyCategoryIds).size !== h.therapyCategoryIds.length) {
      errors.push(`药材 ${h.id}: 功效分类重复`)
    } else {
      for (const id of h.therapyCategoryIds) {
        if (!categoryIds.has(id)) errors.push(`药材 ${h.id}: 功效分类不存在 ${id}`)
      }
    }
  }
  for (const id of Object.keys(taxonomy.assignments ?? {})) {
    if (!herbIds.has(id)) errors.push(`herbTaxonomy: 分类指向不存在的药材 ${id}`)
  }
  for (const r of taxonomy.ranks ?? []) {
    checkCitationIds(r.citationIds, `三经 ${r.id}`)
  }
}

const meridianIds = new Set()
for (const m of data.meridians ?? []) {
  if (!m.id || meridianIds.has(m.id)) errors.push(`经络 id 缺失或重复: ${m.id}`)
  meridianIds.add(m.id)
  if (!['regular', 'extraordinary'].includes(m.category)) errors.push(`经络 ${m.id}: category 非法`)
  if (!m.description?.text) errors.push(`经络 ${m.id}: 缺少描述`)
  if (!Array.isArray(m.acupointIds)) errors.push(`经络 ${m.id}: acupointIds 不是数组`)
  for (const pid of m.acupointIds ?? []) {
    if (!data.acupoints.some((p) => p.id === pid)) errors.push(`经络 ${m.id}: 引用了不存在的穴位 ${pid}`)
  }
  if (m.path) {
    for (const [i, p] of m.path.entries()) {
      if (!Array.isArray(p) || p.length !== 3 || p.some((n) => !Number.isFinite(n))) {
        errors.push(`经络 ${m.id}: path[${i}] 坐标非法`)
      }
    }
  }
}

const validRegions = new Set(['head-neck', 'trunk', 'upper-limb', 'lower-limb'])
const pointIds = new Set()
for (const p of data.acupoints ?? []) {
  if (!p.id || pointIds.has(p.id)) errors.push(`穴位 id 缺失或重复: ${p.id}`)
  pointIds.add(p.id)
  if (!meridianIds.has(p.meridianId)) errors.push(`穴位 ${p.id}: 所属经络不存在 ${p.meridianId}`)
  if (!validRegions.has(p.region)) errors.push(`穴位 ${p.id}: region 非法 ${p.region}`)
  if (!Array.isArray(p.coordinates) || p.coordinates.length !== 3) {
    errors.push(`穴位 ${p.id}: coordinates 必须是 [x,y,z]`)
  } else {
    const [x, y, z] = p.coordinates
    if (![x, y, z].every(Number.isFinite)) errors.push(`穴位 ${p.id}: 坐标含非数字`)
    if (Math.abs(x) > 0.6 || y < 0 || y > 2 || Math.abs(z) > 0.6) {
      warnings.push(`穴位 ${p.id}: 坐标超出模型常规范围 [${p.coordinates.join(', ')}]`)
    }
  }
  if (!Array.isArray(p.pointTypes) || p.pointTypes.length === 0) {
    errors.push(`穴位 ${p.id}: 缺少 pointTypes`)
  } else {
    for (const t of p.pointTypes) {
      if (!t.label) errors.push(`穴位 ${p.id}: pointType 缺少 label`)
      checkCitationIds(t.citationIds, `穴位 ${p.id} 类型 ${t.label}`)
    }
  }
  for (const c of p.extraordinaryConnections ?? []) {
    if (!meridianIds.has(c.vesselId)) errors.push(`穴位 ${p.id}: 通奇经 ${c.vesselId} 不存在`)
    const vessel = data.meridians.find((m) => m.id === c.vesselId)
    if (vessel && vessel.category !== 'extraordinary') {
      errors.push(`穴位 ${p.id}: ${c.vesselId} 不是奇经八脉`)
    }
    checkCitationIds(c.citationIds, `穴位 ${p.id} 奇经 ${c.vesselId}`)
  }
  if (p.region === 'upper-limb' || p.region === 'lower-limb') {
    if (!Number.isFinite(p.orderFromDistal)) errors.push(`穴位 ${p.id}: 四肢穴位缺少 orderFromDistal`)
  }
}

const formulaIds = new Set()
for (const f of data.formulas ?? []) {
  if (!f.id || formulaIds.has(f.id)) errors.push(`方剂 id 缺失或重复: ${f.id}`)
  formulaIds.add(f.id)
  if (!sourceMap.has(f.sourceCitationId)) errors.push(`方剂 ${f.id}: sourceCitationId 不存在`)
  if (!f.originalText?.text) errors.push(`方剂 ${f.id}: 缺少原文`)
  if (!Array.isArray(f.composition) || f.composition.length === 0) {
    errors.push(`方剂 ${f.id}: 组成为空`)
  }
  const seen = new Set()
  for (const c of f.composition ?? []) {
    if (!herbIds.has(c.herbId)) errors.push(`方剂 ${f.id}: 组成引用了不存在的药材 ${c.herbId}`)
    if (seen.has(c.herbId)) errors.push(`方剂 ${f.id}: 药材重复 ${c.herbId}`)
    seen.add(c.herbId)
    if (!['君', '臣', '佐', '使', '佐使', '未标注'].includes(c.role)) {
      errors.push(`方剂 ${f.id}: 角色非法 ${c.role}`)
    }
    if (!Array.isArray(c.roleCitationIds) || c.roleCitationIds.length === 0) {
      errors.push(`方剂 ${f.id}: ${c.herbId} 缺少 roleCitationIds`)
    } else {
      checkCitationIds(c.roleCitationIds, `方剂 ${f.id} 角色 ${c.herbId}`)
    }
  }
  for (const pair of f.corePairs ?? []) {
    if (!seen.has(pair.from) || !seen.has(pair.to)) {
      errors.push(`方剂 ${f.id}: 核心药对端点不在组成中 ${pair.from}-${pair.to}`)
    }
    checkCitationIds(pair.citationIds, `方剂 ${f.id} 药对 ${pair.from}-${pair.to}`)
  }
  for (const meaning of f.meaning?.herbMeanings ?? []) {
    if (!seen.has(meaning.herbId)) {
      errors.push(`方剂 ${f.id}: 方义解说引用了不在组成中的药材 ${meaning.herbId}`)
    }
    if (!meaning.text?.trim()) {
      errors.push(`方剂 ${f.id}: 方义解说 ${meaning.herbId} 为空`)
    }
  }
  for (const mod of f.modifications ?? []) {
    if (!mod.condition || !mod.change) errors.push(`方剂 ${f.id}: 加减缺少 condition/change`)
    checkCitationIds(mod.citationIds, `方剂 ${f.id} 加减 ${mod.condition}`)
  }
}

walkClaims(data, 'data')

// 覆盖检查
const regular = data.meridians.filter((m) => m.category === 'regular')
const extraordinary = data.meridians.filter((m) => m.category === 'extraordinary')
if (regular.length !== 12) errors.push(`十二正经数量应为 12，实际 ${regular.length}`)
if (extraordinary.length !== 8) errors.push(`奇经八脉数量应为 8，实际 ${extraordinary.length}`)
for (const m of regular) {
  if (m.acupointIds.length === 0) errors.push(`十二正经 ${m.name} 没有样例穴位`)
}
for (const id of ['ren', 'du']) {
  const m = data.meridians.find((x) => x.id === id)
  if (!m || m.acupointIds.length === 0) errors.push(`任督脉 ${id} 没有本经穴位`)
}

const regions = new Set(data.acupoints.map((p) => p.region))
for (const r of validRegions) if (!regions.has(r)) errors.push(`缺少区域覆盖: ${r}`)

const labels = data.acupoints.flatMap((p) => p.pointTypes.map((t) => t.label))
for (const need of ['原穴', '募穴', '输穴', '络穴', '郄穴', '母穴', '子穴']) {
  if (!labels.includes(need)) errors.push(`缺少穴位类型: ${need}`)
}
for (const need of [
  '八会穴·脏会',
  '八会穴·腑会',
  '八会穴·气会',
  '八会穴·血会',
  '八会穴·筋会',
  '八会穴·脉会',
  '八会穴·骨会',
  '八会穴·髓会',
]) {
  if (!labels.includes(need)) errors.push(`缺少八会穴: ${need}`)
}
for (const need of [
  '八脉交会穴·任脉',
  '八脉交会穴·督脉',
  '八脉交会穴·冲脉',
  '八脉交会穴·带脉',
  '八脉交会穴·阴维脉',
  '八脉交会穴·阳维脉',
  '八脉交会穴·阴跷脉',
  '八脉交会穴·阳跷脉',
]) {
  if (!labels.includes(need)) errors.push(`缺少八脉交会穴: ${need}`)
}

for (const m of extraordinary.filter((x) => !x.hasOwnPoints)) {
  const connected = data.acupoints.some((p) => p.extraordinaryConnections?.some((c) => c.vesselId === m.id))
  if (!connected) errors.push(`奇经 ${m.name} 没有八脉交会穴落点`)
}

if (!data.bodyModel?.coordinateFrame) {
  errors.push('bodyModel.coordinateFrame 不能为空')
}
if (data.bodyModel?.coordinateFrame === 'bronze-body-v1') {
  warnings.push('当前仍是旧版 bronze-body-v1 坐标表，请运行 npm run precompute:body')
}

const counts = {
  sources: data.sources.length,
  herbs: data.herbs.length,
  herbRanks: data.herbTaxonomy?.ranks?.length ?? 0,
  herbCategories: data.herbTaxonomy?.categories?.length ?? 0,
  formulas: data.formulas.length,
  meridians: data.meridians.length,
  regularMeridians: regular.length,
  extraordinaryMeridians: extraordinary.length,
  acupoints: data.acupoints.length,
  regions: [...regions],
  quoteClaims: 0,
}

function countQuotes(node) {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) return node.forEach(countQuotes)
  if (node.kind === 'quote' && node.text) counts.quoteClaims++
  Object.values(node).forEach(countQuotes)
}
countQuotes(data)

console.log('中医样例数据校验')
console.log(JSON.stringify(counts, null, 2))
if (warnings.length) {
  console.log(`\n警告 ${warnings.length} 条：`)
  for (const w of warnings) console.log(`  - ${w}`)
}
if (errors.length) {
  console.error(`\n错误 ${errors.length} 条：`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log('\n通过：出处、引用、组成、坐标、八类穴与八脉交会覆盖检查均正常。')
