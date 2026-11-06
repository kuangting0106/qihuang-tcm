import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '..', 'src', 'data', 'classic-cases.json')

const FILES = {
  yeA: 'F:/中医/A-062-叶天士医案精华.txt',
  yeF: 'F:/中医/F-078-徐批叶天士晚年医案真本.txt',
  cao: 'F:/中医/F-100-曹颖莆 经方实验录 医案.txt',
  chen: 'F:/中医/陈莲舫先生医案.txt',
  modern: 'F:/中医/近现代杂志刊登名医经验医案大编.txt',
  zhu: 'F:/中医/F-101-山西蒋进忠 中医临证经验与方法 医案.txt',
  li: 'F:/中医/Y-039-李培生老中医经验案列集.txt',
}

const CATEGORY_RULES = [
  ['妇科', /经|带下|胎|产|乳|崩|漏|子宫|月经|妇人/],
  ['儿科', /小儿|幼儿|幼科|痘|惊风|疳/],
  ['癌症', /癌|瘤|岩/],
  ['免疫', /红斑|狼疮|过敏|免疫/],
  ['外感时病', /感冒|发热|温病|风温|湿温|暑|燥|疟|痢|疫|伤寒|外感/],
  ['肺系', /咳|喘|痰|肺|失音|咽喉|鼻|哮|肺痈/],
  ['脾胃', /胃|脾|腹|泻|泄|便秘|呕|噎|膈|食|肠/],
  ['肝胆', /肝|胆|胁|黄疸|疝/],
  ['心胸', /心|胸|悸|中风|眩|晕|痫|癫|狂|不寐|失眠/],
  ['肾与水病', /肾|水肿|肿胀|淋|浊|尿|癃|闭|遗尿|遗精/],
  ['神经', /痿|痹|痉|颤|麻|瘫|头痛|痛|风/],
  ['外科皮肤', /疮|疡|痈|疽|癣|疹|斑|痔|伤|折|流注|流痰/],
  ['五官', /眼|目|耳|鼻|喉|齿|口|舌|咽喉/],
]

function mapCategory(label, fallback = '其他') {
  for (const [name, re] of CATEGORY_RULES) {
    if (re.test(label)) return name
  }
  return fallback
}

function cleanText(input) {
  return input
    .replace(/\\x[^\\]*\\x/g, '')
    .replace(/\bHT\b/g, '')
    .replace(/\u3000/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim()
}

function paragraphs(text) {
  return cleanText(text)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^属性：/, '').trim())
    .filter(Boolean)
}

function summarize(text) {
  const plain = text.replace(/\s+/g, ' ').trim()
  return plain.length > 90 ? `${plain.slice(0, 90)}…` : plain
}

function readLines(file) {
  return cleanText(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')).split('\n')
}

function source(work, locator, note = '') {
  return note ? { work, locator, note } : { work, locator }
}

function makeEntry({
  id,
  title,
  category,
  subcategory,
  doctor,
  mode,
  text,
  work,
  locator,
  note,
}) {
  const content = paragraphs(text).map((line) => ({ type: 'paragraph', text: line }))
  if (!content.length) return null
  const summary = summarize(content.map((item) => item.text).join(' '))
  const era = doctor === '叶天士' || doctor === '陈秉钧' ? 'ancient' : 'modern'
  return {
    id,
    title: title.replace(/\s+/g, ' ').trim(),
    category,
    subcategory: subcategory ?? '',
    doctor,
    mode,
    era,
    summary,
    source: source(work, locator, note),
    content,
  }
}

const cases = []
const seen = new Set()

function push(entry) {
  if (!entry) return
  const key = entry.id
  if (seen.has(key)) return
  seen.add(key)
  cases.push(entry)
}

// 叶天士《医案精华》：按病类章节整体入“经验集”
function parseYeA() {
  const raw = cleanText(fs.readFileSync(FILES.yeA, 'utf8'))
  const parts = raw.split(/<篇名>/).slice(1)
  let index = 0
  for (const part of parts) {
    const title = part.split(/\r?\n/)[0].trim()
    if (!title || title === '叶天士医案精华') continue
    index += 1
    push(
      makeEntry({
        id: `ye-a-${String(index).padStart(3, '0')}`,
        title,
        category: mapCategory(title),
        subcategory: title,
        doctor: '叶天士',
        mode: 'thought',
        text: part.slice(title.length),
        work: '叶天士医案精华',
        locator: title,
        note: '原书多列药名而不列每味剂量；本页照录原案，不补剂量。',
      }),
    )
  }
}

// 叶天士《徐批晚年方案真本》：篇名为方名，不当作病类
function parseYeF() {
  const raw = cleanText(fs.readFileSync(FILES.yeF, 'utf8'))
  const parts = raw.split(/<篇名>/).slice(1)
  const skip = new Set(['徐批叶天士晚年方案真本', '张序', '卷上', '卷下'])
  let index = 0
  for (const part of parts) {
    const title = part.split(/\r?\n/)[0].trim()
    if (!title || skip.has(title)) continue
    const body = part.slice(title.length)
    if (body.trim().length < 30) continue
    index += 1
    push(
      makeEntry({
        id: `ye-f-${String(index).padStart(3, '0')}`,
        title: `${title} · 晚年方案`,
        category: mapCategory(body, '其他'),
        subcategory: title,
        doctor: '叶天士',
        mode: 'thought',
        text: body,
        work: '徐批叶天士晚年方案真本',
        locator: `卷${part.includes('卷下') ? '下' : '上'} · ${title}`,
        note: '篇名为方名，不是病症分类；原书多列药名而不列每味剂量。',
      }),
    )
  }
}

// 曹颖甫：按“某方证其N”分案
function parseCao() {
  const lines = readLines(FILES.cao)
  const headingRe = /^(.{1,20}(?:证|痛|痈|饮|豚|节|疽|虚|明|实|汗|多|竭|衄|病|恍惚)(?:其[一二三四五六七八九十]+)?(?:（[^）]*）)?)$/
  let title = ''
  let buffer = []
  let index = 0

  const flush = () => {
    if (!title || buffer.join('').length < 30) return
    index += 1
    push(
      makeEntry({
        id: `cao-${String(index).padStart(3, '0')}`,
        title,
        category: '外感时病',
        subcategory: '经方实验录',
        doctor: '曹颖甫',
        mode: 'case',
        text: buffer.join('\n'),
        work: '经方实验录',
        locator: title,
        note: '处方与剂量依原文；原书按方证分案。',
      }),
    )
  }

  for (const line of lines) {
    if (headingRe.test(line) && !/^(此|其|是|上|下|本|该|诸|各)证$/.test(line)) {
      flush()
      title = line
      buffer = []
      continue
    }
    if (/^上卷|^下卷/.test(line) && line.length < 6) continue
    if (title) buffer.push(line)
  }
  flush()
}

// 陈莲舫：按“（案）”分案，病类取当前标题
function parseChen() {
  const lines = readLines(FILES.chen)
  const diseaseRe = /^[一二三四五六七八九十百]+、([^、。]{1,10})$/
  let disease = '其他'
  let buffer = []
  let index = 0

  const flush = () => {
    if (buffer.join('').length < 20) return
    index += 1
    const text = buffer.join('\n')
    const head = text.replace(/^（案）\s*/, '').split(/[。；]/)[0].slice(0, 18)
    push(
      makeEntry({
        id: `chen-${String(index).padStart(3, '0')}`,
        title: head ? `${disease} · ${head}` : `${disease} · 第${index}案`,
        category: disease === '其他' ? mapCategory(text) : mapCategory(disease),
        subcategory: disease,
        doctor: '陈秉钧',
        mode: 'case',
        text,
        work: '陈莲舫先生医案',
        locator: `${disease} · 第${index}案`,
        note: '原文件题“作者佚名”，正文题“清 陈秉钧撰”，今从正文。原文药名与剂量照录。',
      }),
    )
    buffer = []
  }

  for (const line of lines) {
    if (line.startsWith('（案）')) {
      flush()
      buffer.push(line)
      continue
    }
    const match = line.match(diseaseRe)
    if (match && line.length < 24) {
      flush()
      disease = match[1]
      continue
    }
    if (/^(卷[上中下]|陈莲舫医案|正文开始|={5,}|文献名称|朝代：|作者：|所属类别|核心概念|相关公理|文献类型)/.test(line)) {
      continue
    }
    if (/^(!"|“|”|注：|按：|[^。]{1,12}：此后有|[^。]{1,20}依目录)/.test(line)) continue
    if (buffer.length) buffer.push(line)
  }
  flush()
}

// 近现代名医验案类编：疾病大类 + 例N
function parseModern() {
  const lines = readLines(FILES.modern)
  const categoryRe = /^（([一二三四五六七八九十百]+)）(.{1,12})$/
  const exampleRe = /^例([一二三四五六七八九十百]+)(.*)$/
  let disease = '其他'
  let buffer = []
  let inReview = false
  let index = 0
  const used = new Set()

  const flush = () => {
    if (!buffer.length) return
    const text = buffer.join('\n')
    if (text.length < 40) {
      buffer = []
      return
    }
    if (!/(岁|患者|男|女|[ＸXx×])/.test(text.slice(0, 80))) {
      buffer = []
      return
    }
    index += 1
    const first = text.replace(/^例[一二三四五六七八九十百]+/, '').split(/[。；]/)[0].slice(0, 16)
    const title = `${disease} · 例${buffer[0].match(exampleRe)?.[1] ?? index}${first ? ` · ${first}` : ''}`
    const key = `${disease}|${text.replace(/[^\u4e00-\u9fa5０-９0-9]/g, '').slice(0, 40)}`
    buffer = []
    if (used.has(key)) return
    used.add(key)
    push(
      makeEntry({
        id: `modern-${String(index).padStart(4, '0')}`,
        title,
        category: mapCategory(disease),
        subcategory: disease,
        doctor: '近现代名医',
        mode: 'case',
        text,
        work: '近现代名医验案类编',
        locator: `${disease} · 例${index}`,
        note: '案末出处依原书保留；处方剂量依原文。',
      }),
    )
  }

  for (const line of lines) {
    if (/^【评按】/.test(line)) {
      flush()
      inReview = true
      continue
    }
    const cat = line.match(categoryRe)
    if (cat) {
      flush()
      disease = cat[2].trim()
      inReview = false
      continue
    }
    if (inReview) continue
    if (exampleRe.test(line)) {
      flush()
      buffer.push(line)
      continue
    }
    if (buffer.length) buffer.push(line)
  }
  flush()
}

// 朱进忠：有“例如/又如”且含处方剂量者入医案，其余理论按病名入经验集
function parseZhu() {
  const lines = readLines(FILES.zhu)
  const skip = /^(第[一二三四五六七八九十]+[章节]|中医临证经验与方法|朱进忠|作者：|书名：|朝代：|年份：)/
  let disease = '其他'
  let theory = []
  let caseBuffer = []
  let caseIndex = 0
  let theoryIndex = 0
  let currentDiseaseTheory = []

  const flushTheory = () => {
    const text = currentDiseaseTheory.join('\n').trim()
    currentDiseaseTheory = []
    if (text.length < 120 || text.length > 6000) return
    theoryIndex += 1
    push(
      makeEntry({
        id: `zhu-thought-${String(theoryIndex).padStart(3, '0')}`,
        title: disease,
        category: mapCategory(disease),
        subcategory: disease,
        doctor: '朱进忠',
        mode: 'thought',
        text,
        work: '中医临证经验与方法',
        locator: disease,
        note: '原书病名下的病机与治法论述；不含具体患者处方。',
      }),
    )
  }

  const flushCase = () => {
    const text = caseBuffer.join('\n').trim()
    caseBuffer = []
    if (text.length < 50) return
    if (!/[０-９\d].{0,3}(克|钱|分|两)|处方|方用|药用/.test(text)) return
    caseIndex += 1
    const first = text.replace(/^(例如|又如)：?/, '').split(/[。；]/)[0].slice(0, 18)
    push(
      makeEntry({
        id: `zhu-case-${String(caseIndex).padStart(3, '0')}`,
        title: `${disease} · ${first || `案例${caseIndex}`}`,
        category: mapCategory(disease),
        subcategory: disease,
        doctor: '朱进忠',
        mode: 'case',
        text,
        work: '中医临证经验与方法',
        locator: `${disease} · 案例${caseIndex}`,
        note: '原文件名作“蒋进忠”，正文作者为朱进忠，今从正文。剂量依原文。',
      }),
    )
  }

  for (const line of lines) {
    if (skip.test(line)) continue
    const isShortTitle =
      line.length >= 1 &&
      line.length <= 12 &&
      !/[。；：，、？！0-9０-９]/.test(line) &&
      !/^(例如|又如)/.test(line)
    if (isShortTitle) {
      flushCase()
      flushTheory()
      disease = line
      theory = []
      continue
    }
    if (/^(例如|又如)/.test(line)) {
      flushCase()
      if (theory.length) currentDiseaseTheory.push(...theory)
      theory = []
      caseBuffer.push(line)
      continue
    }
    if (caseBuffer.length) {
      caseBuffer.push(line)
    } else {
      theory.push(line)
    }
  }
  flushCase()
  if (theory.length) currentDiseaseTheory.push(...theory)
  flushTheory()
}

// 李培生：完整医案入 case；学术生平与医论医话入 thought
function parseLi() {
  const lines = readLines(FILES.li)
  const caseLabelRe = /^案例[一二三四五六七八九十]+[：:]/
  const caseHeadingRe = /^[一二三四五六七八九十]+、(.{2,30}?案)(.*)$/
  const essayHeadingRe = /^[一二三四五六七八九十]+、(.{2,30})$/
  let heading = '学术生平与治学'
  let buffer = []
  let section = 'intro'
  let index = 0
  let thoughtIndex = 0

  const flush = () => {
    const text = buffer.join('\n').trim()
    buffer = []
    if (text.length < 60) return
    const hasPatient = /(岁|患者|某某|某，[男女]|[男女]，[０-９\d]+岁)/.test(text)
    const hasDose = /[０-９\d].{0,3}(克|钱|分|两)|处方|药用|方用|药用：/.test(text)
    if (section === 'case' && hasPatient && hasDose && text.length <= 6000) {
      index += 1
      const first = text
        .replace(/^(案例[一二三四五六七八九十]+[：:]?|例如[：:]?|又如[：:]?)/, '')
        .split(/[。；]/)[0]
        .slice(0, 18)
      push(
        makeEntry({
          id: `li-case-${String(index).padStart(3, '0')}`,
          title: `${heading} · ${first || `医案${index}`}`,
          category: mapCategory(`${heading} ${text}`),
          subcategory: heading,
          doctor: '李培生',
          mode: 'case',
          text,
          work: '李培生老中医经验集',
          locator: `${heading} · 医案${index}`,
          note: '据《李培生老中医经验集》整理；剂量依原文。',
        }),
      )
      return
    }
    if (section === 'formula' || section === 'intro') return
    if (text.length < 150 || text.length > 6000) return
    thoughtIndex += 1
    push(
      makeEntry({
        id: `li-thought-${String(thoughtIndex).padStart(3, '0')}`,
        title: heading,
        category: mapCategory(`${heading} ${text}`),
        subcategory: heading,
        doctor: '李培生',
        mode: 'thought',
        text,
        work: '李培生老中医经验集',
        locator: heading,
        note: '学术经验与辨治论述；不含完整医案。',
      }),
    )
  }

  for (const rawLine of lines) {
    const line = rawLine.replace(/^第三卷[０-９0-9]+/, '').trim()
    if (!line) continue
    if (/^(<篇名>|书名：|作者：|朝代：|年份：|李培生$|名老中医经验集目录)/.test(line)) continue
    if (line === '名案评析') {
      flush()
      section = 'case'
      heading = '名案评析'
      continue
    }
    if (line === '医论医话') {
      flush()
      section = 'essay'
      heading = '医论医话'
      continue
    }
    if (line === '经验方') {
      flush()
      section = 'formula'
      heading = '经验方'
      continue
    }
    if (caseLabelRe.test(line) || caseHeadingRe.test(line)) {
      flush()
      section = 'case'
      const label = line.match(caseLabelRe)
      const titled = line.match(caseHeadingRe)
      heading = label
        ? '案例'
        : titled
          ? titled[1]
          : '医案'
      buffer.push(line)
      continue
    }
    if (section === 'essay' && essayHeadingRe.test(line) && line.length < 40) {
      flush()
      heading = line.replace(/^[一二三四五六七八九十]+、/, '')
      continue
    }
    buffer.push(line)
  }
  flush()
}

parseYeA()
parseYeF()
parseCao()
parseChen()
parseModern()
parseZhu()
parseLi()

const byMode = cases.reduce((acc, item) => {
  acc[item.mode] = (acc[item.mode] ?? 0) + 1
  return acc
}, {})

fs.writeFileSync(OUT, `${JSON.stringify({ generatedAt: new Date().toISOString(), cases }, null, 2)}\n`)
console.log(`Wrote ${path.relative(process.cwd(), OUT)}: ${cases.length} entries`, byMode)
for (const doctor of [...new Set(cases.map((item) => item.doctor))]) {
  const list = cases.filter((item) => item.doctor === doctor)
  console.log(`  ${doctor}: ${list.length} (${list.filter((x) => x.mode === 'case').length} 案)`)
}
