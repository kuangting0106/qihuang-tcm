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
    const slots = h.images.map((im) => im.slot)
    for (const slot of ['whole', 'part', 'medicinal']) {
      if (!slots.includes(slot)) {
        errors.push(`药材 ${h.id}: 缺少 ${slot} 图（全图 / 入药部位图 / 药材高清切片图）`)
      }
    }
    if (new Set(slots).size !== slots.length) {
      errors.push(`药材 ${h.id}: 图片槽位重复`)
    }
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

  const processing = h.processing
  const processingCategoryIds = new Set(['plants', 'animals', 'minerals'])
  if (!processing) {
    errors.push(`药材 ${h.id}: 缺少炮制方法 processing`)
  } else {
    if (!processingCategoryIds.has(processing.categoryId)) {
      errors.push(`药材 ${h.id}: 炮制分类无效 ${processing.categoryId}`)
    }
    if (!processing.summary) errors.push(`药材 ${h.id}: 炮制缺少 summary`)
    if (!Array.isArray(processing.methods) || processing.methods.length === 0) {
      errors.push(`药材 ${h.id}: 炮制缺少具体方法 methods`)
    } else {
      for (const method of processing.methods) {
        if (!method.label) errors.push(`药材 ${h.id}: 炮制方法缺少 label`)
        if (!method.text) errors.push(`药材 ${h.id}: 炮制方法缺少正文`)
        if (!['quote', 'paraphrase', 'analysis'].includes(method.kind)) {
          errors.push(`药材 ${h.id}: 炮制方法 ${method.label} 的 kind 无效`)
        }
        checkCitationIds(method.citationIds, `药材 ${h.id} 炮制 ${method.label}`)
      }
    }
    if (!processing.product) errors.push(`药材 ${h.id}: 炮制缺少成品性状 product`)
    if (!Array.isArray(processing.cautions)) {
      errors.push(`药材 ${h.id}: 炮制 cautions 必须是数组`)
    }
    if (!['reference', 'pending'].includes(processing.verification)) {
      errors.push(`药材 ${h.id}: 炮制 verification 无效`)
    }
  }
}

const taxonomy = data.herbTaxonomy
if (!taxonomy) {
  errors.push('缺少 herbTaxonomy 本草分类')
} else {
  if (!Array.isArray(taxonomy.ranks) || taxonomy.ranks.length !== 3) {
    errors.push('herbTaxonomy: 三经必须正好 3 项')
  }
  if (!Array.isArray(taxonomy.categories) || taxonomy.categories.length < 12) {
    errors.push('herbTaxonomy: 功效分类少于 12 项')
  }
  const rankIds = new Set((taxonomy.ranks ?? []).map((r) => r.id))
  const categoryIds = new Set((taxonomy.categories ?? []).map((c) => c.id))
  const coreCategoryIds = [
    'exterior',
    'clear-heat',
    'purgative',
    'wind-damp',
    'qi-digest',
    'stop-bleeding',
    'blood-moving',
    'cough-phlegm',
    'warm-tonic',
    'astringent',
    'calm-open',
    'attack-cold',
  ]
  if (rankIds.size !== 3) errors.push('herbTaxonomy: 三经 id 缺失或重复')
  for (const id of coreCategoryIds) {
    if (!categoryIds.has(id)) errors.push(`herbTaxonomy: 缺少功效分类 ${id}`)
  }
  if (categoryIds.size !== (taxonomy.categories ?? []).length) {
    errors.push('herbTaxonomy: 功效分类 id 缺失或重复')
  }
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

const principles = data.herbPrinciples
if (!principles) {
  errors.push('缺少 herbPrinciples 药性基础法则')
} else {
  if (!principles.title) errors.push('herbPrinciples: 缺少标题')
  if (!principles.intro) errors.push('herbPrinciples: 缺少导语')
  if (!Array.isArray(principles.branches) || principles.branches.length < 6) {
    errors.push(`herbPrinciples: 分支至少 6 组，实际 ${principles.branches?.length ?? 0}`)
  }
  const branchIds = new Set()
  for (const branch of principles.branches ?? []) {
    if (!branch.id || branchIds.has(branch.id)) {
      errors.push(`herbPrinciples: 分支 id 缺失或重复 ${branch.id}`)
    }
    branchIds.add(branch.id)
    if (!branch.title || !branch.subtitle || !branch.summary) {
      errors.push(`herbPrinciples ${branch.id}: 缺少标题、副标题或总述`)
    }
    if (!branch.kindLabel) errors.push(`herbPrinciples ${branch.id}: 缺少文本层级标注`)
    checkCitationIds(branch.citationIds, `herbPrinciples ${branch.id}`)
    if (!Array.isArray(branch.items) || branch.items.length === 0) {
      errors.push(`herbPrinciples ${branch.id}: 缺少条目`)
    } else {
      for (const [index, item] of branch.items.entries()) {
        if (!item.label || !item.text?.trim()) {
          errors.push(`herbPrinciples ${branch.id}: 第 ${index + 1} 条缺少 label/text`)
        }
      }
    }
  }
}

const exampleIds = new Set()
for (const example of data.processingExamples ?? []) {
  if (!example.id || exampleIds.has(example.id)) {
    errors.push(`炮制待核线索 id 缺失或重复: ${example.id}`)
  }
  exampleIds.add(example.id)
  if (!example.herbName) errors.push(`炮制待核线索 ${example.id}: 缺少 herbName`)
  if (example.status !== '待核') errors.push(`炮制待核线索 ${example.id}: 状态必须为待核`)
  if (!['plants', 'animals', 'minerals'].includes(example.categoryId)) {
    errors.push(`炮制待核线索 ${example.id}: 分类无效 ${example.categoryId}`)
  }
  if (!Array.isArray(example.lines) || example.lines.length === 0) {
    errors.push(`炮制待核线索 ${example.id}: 缺少线索正文`)
  }
  if (!example.note) errors.push(`炮制待核线索 ${example.id}: 缺少待核说明`)
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
    if (!herbIds.has(c.herbId) && !c.herbName?.trim()) {
      errors.push(`方剂 ${f.id}: 组成引用了不存在的药材 ${c.herbId}`)
    }
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

// 全本医书全文
const classicsDir = path.join(root, 'public', 'data', 'classics')
let classicsIndex = null
try {
  classicsIndex = JSON.parse(fs.readFileSync(path.join(classicsDir, 'index.json'), 'utf8'))
} catch {
  errors.push('缺少 public/data/classics/index.json，请运行 node scripts/build-sample-data.mjs')
}
const expectedClassicAuthors = {
  血证论: '唐容川',
  李可老中医急危重症疑难病经验专辑: '李可',
  伤寒捷诀: '严则庵纂辑、裘庆元辑',
  伤寒论辑义: '丹波元简',
  石室秘录: '陈士铎',
  傅青主女科: '傅山（傅青主）',
  黄帝内经: '倪海厦',
  伤寒论: '倪海厦',
  经方实验录: '曹颖甫',
  圆运动的古中医学: '彭子益',
  '圆运动的古中医学（续）': '彭子益 著，李可 主校',
  脾胃论: '李杲（东垣）',
  中藏经: '华佗',
  陆士谔医话: '陆士谔',
  三指禅: '周学霆',
  厘正按摩要术: '张振鉴（张筱衫）',
  '普济方（总论）': '朱橚',
}
let classicChapters = 0
let classicChars = 0
if (classicsIndex) {
  if (classicsIndex.books.length !== 17) {
    errors.push(`医书全文数量应为 12，实际 ${classicsIndex.books.length}`)
  }
  for (const summary of classicsIndex.books) {
    const bookPath = path.join(classicsDir, `${summary.id}.json`)
    if (!fs.existsSync(bookPath)) {
      errors.push(`医书 ${summary.title}: 缺少 ${summary.id}.json`)
      continue
    }
    const book = JSON.parse(fs.readFileSync(bookPath, 'utf8'))
    if (book.author !== expectedClassicAuthors[book.title]) {
      errors.push(`医书 ${book.title}: 作者应为 ${expectedClassicAuthors[book.title]}，实际 ${book.author}`)
    }
    const sections = [
      ...book.prefaces,
      ...book.postscripts,
      ...book.frontMatter,
      ...book.volumes.flatMap((v) => v.chapters),
    ]
    if (sections.length === 0) errors.push(`医书 ${book.title}: 没有任何篇章`)
    for (const section of sections) {
      if (!section.id || !section.title) errors.push(`医书 ${book.title}: 篇章缺少 id/title`)
      if (!Array.isArray(section.paragraphs) || section.paragraphs.length === 0) {
        errors.push(`医书 ${book.title} / ${section.title}: 正文为空`)
      }
      const body = (section.paragraphs ?? []).join('')
      if (/<篇名>|<目录>|属性：|\\x/.test(body)) {
        errors.push(`医书 ${book.title} / ${section.title}: 正文残留源文件控制标记`)
      }
    }
    const actualChapters = book.volumes.reduce((sum, v) => sum + v.chapters.length, 0)
    if (actualChapters !== book.stats.chapterCount) {
      errors.push(`医书 ${book.title}: 篇数统计不一致`)
    }
    classicChapters += actualChapters
    classicChars += book.stats.charCount
  }
}

// 倪海厦《神农本草经》讲义
const bencaoDir = path.join(root, 'public', 'data', 'bencao-lectures')
let bencaoIndex = null
try {
  bencaoIndex = JSON.parse(fs.readFileSync(path.join(bencaoDir, 'index.json'), 'utf8'))
} catch {
  errors.push('缺少 public/data/bencao-lectures/index.json，请运行 npm run build:lectures')
}
const expectedBencaoCounts = {
  intro: 5,
  shangjing: 137,
  zhongjing: 93,
  xiajing: 75,
  nishi: 27,
  editor: 34,
  yaoxing: 23,
}
const allowedBencaoKinds = new Set(['original', 'commentary', 'study', 'nishi', 'lecture', 'lesson'])
let bencaoEntries = 0
let bencaoChars = 0
if (bencaoIndex) {
  for (const key of ['id', 'title', 'author', 'course', 'commit', 'sourcePath', 'note']) {
    if (!bencaoIndex.source?.[key]) errors.push(`讲义来源缺少 ${key}`)
  }
  if (!Array.isArray(bencaoIndex.groups) || bencaoIndex.groups.length !== 7) {
    errors.push(`讲义分组应为 6，实际 ${bencaoIndex.groups?.length ?? 0}`)
  }
  const seenEntries = new Set()
  for (const meta of bencaoIndex.groups ?? []) {
    const groupPath = path.join(bencaoDir, `${meta.id}.json`)
    if (!fs.existsSync(groupPath)) {
      errors.push(`讲义分组 ${meta.id}: 缺少 ${meta.id}.json`)
      continue
    }
    const group = JSON.parse(fs.readFileSync(groupPath, 'utf8'))
    if (group.entries.length !== meta.count) {
      errors.push(`讲义分组 ${meta.id}: 索引条数 ${meta.count} 与正文 ${group.entries.length} 不一致`)
    }
    const expected = expectedBencaoCounts[meta.id]
    if (expected && group.entries.length !== expected) {
      errors.push(`讲义分组 ${meta.id}: 条目数应为 ${expected}，实际 ${group.entries.length}`)
    }
    let chars = 0
    for (const entry of group.entries) {
      if (!entry.id || seenEntries.has(entry.id)) {
        errors.push(`讲义条目 id 缺失或重复: ${entry.id}`)
      }
      seenEntries.add(entry.id)
      if (entry.groupId !== meta.id) errors.push(`讲义条目 ${entry.id}: groupId 不一致`)
      if (!entry.title) errors.push(`讲义条目 ${entry.id}: 缺少标题`)
      if (!Array.isArray(entry.sections) || entry.sections.length === 0) {
        errors.push(`讲义条目 ${entry.id}: 没有分节`)
        continue
      }
      if (meta.id !== 'intro' && meta.id !== 'yaoxing') {
        if (!entry.pinyin) errors.push(`讲义条目 ${entry.id}: 缺少拼音`)
        if (!entry.profile) {
          errors.push(`讲义条目 ${entry.id}: 缺少药性概览`)
        } else {
          for (const key of ['flavorTags', 'meridianIds', 'meridianNames', 'sources']) {
            if (!Array.isArray(entry.profile[key])) {
              errors.push(`讲义条目 ${entry.id}: profile.${key} 应为数组`)
            }
          }
          if (!entry.profile.effects) errors.push(`讲义条目 ${entry.id}: 缺少功效`)
        }
      }
      let entryChars = 0
      for (const section of entry.sections) {
        if (!allowedBencaoKinds.has(section.kind)) {
          errors.push(`讲义条目 ${entry.id}: 非法文本层级 ${section.kind}`)
        }
        if (!section.kindLabel) errors.push(`讲义条目 ${entry.id}: 缺少层级标签`)
        if (!Array.isArray(section.blocks) || section.blocks.length === 0) {
          errors.push(`讲义条目 ${entry.id} / ${section.label}: 内容为空`)
          continue
        }
        for (const block of section.blocks) {
          if (!block.text?.trim()) errors.push(`讲义条目 ${entry.id}: 空段落`)
          if (/<[a-z][^>]*>/i.test(block.text ?? '')) {
            errors.push(`讲义条目 ${entry.id}: 残留 HTML`)
          }
          entryChars += block.text?.length ?? 0
        }
      }
      if (entryChars !== entry.charCount) {
        errors.push(`讲义条目 ${entry.id}: 字数统计不一致`)
      }
      chars += entryChars
    }
    if (chars !== meta.charCount) {
      errors.push(`讲义分组 ${meta.id}: 字数统计不一致`)
    }
    if (meta.id !== 'yaoxing') {
      bencaoEntries += group.entries.length
      bencaoChars += chars
    }
  }
}

const catalogPath = path.join(bencaoDir, 'catalog.json')
let bencaoCatalog = null
try {
  bencaoCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'))
} catch {
  errors.push('缺少 public/data/bencao-lectures/catalog.json')
}
if (bencaoCatalog) {
  if (bencaoCatalog.total !== 366) errors.push(`讲义目录总数应为 366，实际 ${bencaoCatalog.total}`)
  if (bencaoCatalog.threeRanks !== 305) {
    errors.push(`三经目录条数应为 305，实际 ${bencaoCatalog.threeRanks}`)
  }
  if (bencaoChars !== 266233) {
    errors.push(`讲义总字数应为 266233，实际 ${bencaoChars}`)
  }
  if (bencaoCatalog.items?.length !== bencaoCatalog.total) {
    errors.push('讲义目录 items 与 total 不一致')
  }
  const withFlavor = bencaoCatalog.items.filter((item) => item.flavorTags?.length).length
  const withNature = bencaoCatalog.items.filter((item) => item.nature).length
  const withMeridian = bencaoCatalog.items.filter((item) => item.meridianIds?.length).length
  if (withFlavor < 355) errors.push(`带性味的讲义药材过少：${withFlavor}/366`)
  if (withNature < 355) errors.push(`带气（寒热温凉平）的讲义药材过少：${withNature}/366`)
  if (withMeridian < 120) errors.push(`带归经的讲义药材过少：${withMeridian}/366`)
  const seenNames = new Set()
  for (const item of bencaoCatalog.items) {
    if (!item.pinyin) errors.push(`讲义目录 ${item.name}: 缺少拼音`)
    if (!item.effects) errors.push(`讲义目录 ${item.name}: 缺少功效`)
    if (!Array.isArray(item.profileSources) || item.profileSources.length === 0) {
      errors.push(`讲义目录 ${item.name}: 缺少药性来源标注`)
    }
    if (seenNames.has(item.name)) errors.push(`讲义目录仍有重复药名: ${item.name}`)
    seenNames.add(item.name)
  }
}

const profilesFile = path.join(root, 'scripts', 'content', 'bencao-profiles.json')
let bencaoProfiles = null
try {
  bencaoProfiles = JSON.parse(fs.readFileSync(profilesFile, 'utf8'))
} catch {
  errors.push('缺少 scripts/content/bencao-profiles.json，请运行 npm run build:profiles')
}
if (bencaoProfiles) {
  if (!bencaoProfiles.source?.commit) errors.push('药性补全数据缺少来源 commit')
  if (!bencaoProfiles.source?.note) errors.push('药性补全数据缺少来源说明')
  if (Object.keys(bencaoProfiles.items ?? {}).length < 380) {
    errors.push(`药性补全条目过少：${Object.keys(bencaoProfiles.items ?? {}).length}`)
  }
}

const counts = {
  sources: data.sources.length,
  herbs: data.herbs.length,
  herbRanks: data.herbTaxonomy?.ranks?.length ?? 0,
  herbCategories: data.herbTaxonomy?.categories?.length ?? 0,
  herbPrincipleBranches: data.herbPrinciples?.branches?.length ?? 0,
  processingEntries: data.herbs.filter((h) => h.processing).length,
  processingExamples: data.processingExamples?.length ?? 0,
  formulas: data.formulas.length,
  meridians: data.meridians.length,
  regularMeridians: regular.length,
  extraordinaryMeridians: extraordinary.length,
  acupoints: data.acupoints.length,
  regions: [...regions],
  classicBooks: classicsIndex?.books?.length ?? 0,
  classicChapters,
  classicChars,
  bencaoGroups: bencaoIndex?.groups?.length ?? 0,
  bencaoEntries,
  bencaoChars,
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
console.log('\n通过：出处、引用、组成、坐标、八类穴、八脉交会、全本医书与本草讲义检查均正常。')
