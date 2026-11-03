import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const contentDir = path.join(root, 'scripts', 'content')

const readText = (file) => fs.readFileSync(file, 'utf8')
const writeJson = (file, data, pretty = false) => {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(data, null, pretty ? 2 : 0) + '\n', 'utf8')
}

const normalizeSpaces = (value) => value.replace(/\u3000/g, ' ').replace(/[ \t]+/g, ' ').trim()

function splitTitlePoints(text) {
  const cleaned = text.trim()
  const match = cleaned.match(/^([^：:]+)[：:]\s*(.*)$/)
  if (!match) return { title: cleaned, points: '', note: '' }
  let title = match[1].trim()
  let rest = match[2].trim()
  let note = ''
  const noteMatch = rest.match(/[；;]\s*(备注|注意)[：:]\s*(.*)$/)
  if (noteMatch) {
    note = `${noteMatch[1]}：${noteMatch[2]}`.trim()
    rest = rest.slice(0, noteMatch.index).trim()
  }
  if (title.length > 40) title = cleaned
  return { title, points: rest, note }
}

function parseQuickrefMarkdown() {
  const file = path.join(contentDir, 'nihaixia-acupuncture-quickref.md')
  const lines = readText(file).split(/\r?\n/)
  const quickIndex = lines.findIndex((line) => line.startsWith('## 215条针灸经验'))
  const penetrationIndex = lines.findIndex((line) => line.startsWith('## 31条透针透穴'))
  if (quickIndex < 0 || penetrationIndex < 0) throw new Error('速查 Markdown 缺少主标题')

  const preamble = []
  let paragraph = []
  const flushPreamble = () => {
    if (paragraph.length) {
      preamble.push(paragraph.join('').trim().replace(/^[@＠]\s*/, ''))
      paragraph = []
    }
  }
  for (const line of lines.slice(0, quickIndex)) {
    if (!line.trim()) flushPreamble()
    else paragraph.push(line.trim())
  }
  flushPreamble()

  const categories = []
  let category = null
  let condition = null
  let conditionCase = ''
  let conditionExtra = []
  let categoryIndex = 0

  const finishCondition = () => {
    if (!condition) return
    if (conditionCase) condition.case = conditionCase.trim()
    if (conditionExtra.length) condition.extra = conditionExtra.join('').trim()
    category?.conditions.push(condition)
    condition = null
    conditionCase = ''
    conditionExtra = []
  }

  for (const rawLine of lines.slice(quickIndex + 1, penetrationIndex)) {
    const line = rawLine.trim()
    if (!line) continue
    const categoryMatch = line.match(/^####\s+(.+)$/)
    if (categoryMatch) {
      finishCondition()
      categoryIndex += 1
      const rawTitle = categoryMatch[1].trim()
      const title = rawTitle.replace(/^\d+[.、．]\s*/, '')
      category = {
        id: `cat-${String(categoryIndex).padStart(2, '0')}`,
        order: categoryIndex,
        title,
        rawTitle,
        conditions: [],
      }
      categories.push(category)
      continue
    }
    const conditionMatch = line.match(/^(\d+)[.、．]\s*(.+)$/)
    if (conditionMatch && !line.startsWith('【医案】')) {
      finishCondition()
      const parsed = splitTitlePoints(conditionMatch[2])
      condition = {
        id: `${category.id}-${String(conditionMatch[1]).padStart(2, '0')}`,
        order: Number(conditionMatch[1]),
        title: parsed.title,
        points: parsed.points,
        note: parsed.note,
      }
      continue
    }
    if (!condition) continue
    if (line.startsWith('【医案】')) {
      conditionCase = line.replace(/^【医案】[：:]?\s*/, '')
      continue
    }
    if (conditionCase) conditionCase += line
    else conditionExtra.push(line)
  }
  finishCondition()

  const conditionCases = []
  for (const cat of categories) {
    for (const item of cat.conditions) {
      if (!item.case) continue
      conditionCases.push({
        id: `case-${item.id}`,
        categoryId: cat.id,
        categoryTitle: cat.title,
        conditionId: item.id,
        conditionTitle: item.title,
        text: item.case,
      })
    }
  }

  const penetrationIntroLines = []
  const penetrations = []
  let penetration = null
  let penetrationField = ''
  for (const rawLine of lines.slice(penetrationIndex + 1)) {
    const line = rawLine.trim()
    if (!line) continue
    const itemMatch = line.match(/^(\d+)[.、．]\s*(.+)$/)
    if (itemMatch && !/[：:]$/.test(line)) {
      if (penetration) penetrations.push(penetration)
      penetration = {
        id: `penetration-${String(itemMatch[1]).padStart(2, '0')}`,
        order: Number(itemMatch[1]),
        title: itemMatch[2].trim(),
        indications: '',
        source: '',
        notes: '',
        case: '',
      }
      penetrationField = ''
      continue
    }
    if (!penetration) {
      penetrationIntroLines.push(line)
      continue
    }
    const fieldMatch = line.match(/^(治症|来源|临证心悟|倪海厦治案)[：:]\s*(.*)$/)
    if (fieldMatch) {
      const [, label, value] = fieldMatch
      penetrationField =
        label === '治症' ? 'indications' : label === '来源' ? 'source' : label === '临证心悟' ? 'notes' : 'case'
      penetration[penetrationField] += value
      continue
    }
    if (penetrationField === 'source' && /医案/.test(line)) {
      penetrationField = 'case'
    }
    penetration[penetrationField] += line
  }
  if (penetration) penetrations.push(penetration)

  return {
    preamble,
    categories,
    conditionCases,
    penetrationIntro: penetrationIntroLines.join(''),
    penetrations,
  }
}

// ---------------------------------------------------------------------------
// 教程层级：TOC -> chapters -> sections -> level-3 topics，正文按标题行切分
// ---------------------------------------------------------------------------

const MERIDIAN_SECTIONS = {
  任脉经穴: { id: 'ren', name: '任脉' },
  督脉经穴篇: { id: 'du', name: '督脉' },
  手太阴肺经: { id: 'lung', name: '手太阴肺经' },
  手阳明大肠经: { id: 'large-intestine', name: '手阳明大肠经' },
  足阳明胃经: { id: 'stomach', name: '足阳明胃经' },
  足太阴脾经: { id: 'spleen', name: '足太阴脾经' },
  手少阴心经: { id: 'heart', name: '手少阴心经' },
  手太阳小肠经: { id: 'small-intestine', name: '手太阳小肠经' },
  足太阳膀胱经: { id: 'bladder', name: '足太阳膀胱经' },
  足少阴肾经: { id: 'kidney', name: '足少阴肾经' },
  手厥阴心包经: { id: 'pericardium', name: '手厥阴心包经' },
  手少阳三焦经: { id: 'triple-burner', name: '手少阳三焦经' },
  足少阳胆经: { id: 'gallbladder', name: '足少阳胆经' },
  足厥阴肝经: { id: 'liver', name: '足厥阴肝经' },
}

const TIME_RE = /[（(](\d+-\d{1,2}:\d{2}:\d{2})[）)]/

function cleanTitle(raw) {
  let title = raw.trim()
  const timeMatch = title.match(TIME_RE)
  const time = timeMatch ? timeMatch[1] : ''
  title = title.replace(TIME_RE, '').trim()
  title = title.replace(/^第[一二三四五六七八九十百]+章\s*/, '')
  title = title.replace(/^[一二三四五六七八九十百]+、\s*/, '')
  title = title.replace(/^\d+[、.．]\s*/, '')
  return { title: title.trim(), time }
}

function headingCore(value) {
  return value
    .replace(TIME_RE, '')
    .replace(/^[一二三四五六七八九十百]+、\s*/, '')
    .replace(/^\d+[、.．]\s*/, '')
    .replace(/[\s\u3000]/g, '')
    .replace(/[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]/g, '')
    .replace(/[：:，,。.、；;！？!?（）()《》〈〉“”"'‘’]/g, '')
}

function cleanPageText(text) {
  return text
    .split(/\r?\n/)
    .map((line) => normalizeSpaces(line))
    .filter((line) => {
      if (!line) return false
      if (/^人纪系列针灸/.test(line)) return false
      if (/^V2-\d+/.test(line)) return false
      if (/^\d{1,3}$/.test(line)) return false
      return true
    })
}

function paragraphize(lines) {
  const text = normalizeSpaces(lines.join(''))
  if (!text) return []
  const sentences = text.match(/[^。！？!?；;]+[。！？!?；;]?/g) ?? [text]
  const paragraphs = []
  let buffer = ''
  for (const sentence of sentences) {
    buffer += sentence
    if (buffer.length >= 135) {
      paragraphs.push(buffer.trim())
      buffer = ''
    }
  }
  if (buffer.trim()) paragraphs.push(buffer.trim())
  return paragraphs
}

function buildTutorial() {
  const pages = JSON.parse(readText(path.join(contentDir, 'nihaixia-acupuncture-pages.json')))
  const toc = JSON.parse(readText(path.join(contentDir, 'nihaixia-acupuncture-toc.json')))
  const pageText = new Map(pages.map((item) => [Number(item.page), String(item.text ?? '')]))

  let sample = null
  try {
    sample = JSON.parse(readText(path.join(root, 'public', 'data', 'sample_data.json')))
  } catch {
    sample = null
  }
  const meridianById = new Map((sample?.meridians ?? []).map((item) => [item.id, item]))

  const chapters = []
  for (const row of toc) {
    const level = Number(row.level)
    const page = Number(row.page)
    if (!Number.isFinite(page)) continue
    if (level === 1) {
      const parsed = cleanTitle(String(row.title ?? ''))
      chapters.push({
        id: `chapter-${chapters.length + 1}`,
        order: chapters.length + 1,
        title: parsed.title,
        time: parsed.time,
        page,
        sections: [],
      })
      continue
    }
    if (!chapters.length) continue
    const chapter = chapters[chapters.length - 1]
    if (level === 2) {
      const parsed = cleanTitle(String(row.title ?? ''))
      const mapped = MERIDIAN_SECTIONS[parsed.title]
      const order = chapter.sections.length + 1
      chapter.sections.push({
        id: mapped?.id ?? `s${order}`,
        order,
        title: parsed.title,
        time: parsed.time,
        page,
        meridianId: mapped?.id ?? null,
        meridianName: mapped?.name ?? null,
        topics: [],
      })
      continue
    }
    if (level === 3) {
      const section = chapter.sections[chapter.sections.length - 1]
      if (!section) continue
      const parsed = cleanTitle(String(row.title ?? ''))
      section.topics.push({
        id: `t${section.order}-${section.topics.length + 1}`,
        order: section.topics.length + 1,
        title: parsed.title,
        time: parsed.time,
        page,
        paragraphs: [],
      })
    }
  }

  // 每章的下一章起点，用于确定最后一节的正文范围。
  const chapterStartPages = chapters.map((chapter) => chapter.page)
  const allSections = chapters.flatMap((chapter) => chapter.sections)
  const sectionStarts = allSections.map((section) => section.page)

  for (const chapter of chapters) {
    const chapterIndex = chapters.indexOf(chapter)
    const nextChapterPage = chapterStartPages[chapterIndex + 1] ?? 200
    for (const section of chapter.sections) {
      const globalIndex = allSections.indexOf(section)
      const nextSection = allSections[globalIndex + 1]
      const scanEndPage = nextSection?.page ?? nextChapterPage
      const endPage = scanEndPage
      const lines = []
      for (let page = section.page; page <= endPage; page += 1) {
        const text = pageText.get(page)
        if (!text) continue
        for (const line of cleanPageText(text)) lines.push({ page, line })
      }

      // 章节可能从上一节正文中间开始，找到本节标题后再保留其后内容。
      const sectionCore = headingCore(section.title)
      let startAt = 0
      for (let i = 0; i < Math.min(lines.length, 120); i += 1) {
        if (headingCore(lines[i].line) === sectionCore) {
          startAt = i + 1
          break
        }
      }
      let bodyLines = lines.slice(startAt)
      if (nextSection) {
        const nextCore = headingCore(nextSection.title)
        const cutAt = bodyLines.findIndex((item) => headingCore(item.line) === nextCore)
        if (cutAt >= 0) bodyLines = bodyLines.slice(0, cutAt)
      }
      const topicByCore = new Map(section.topics.map((topic) => [headingCore(topic.title), topic]))
      const buckets = section.topics.map(() => [])
      const intro = []
      let current = -1
      for (let index = 0; index < bodyLines.length; index += 1) {
        const line = bodyLines[index].line
        let topic = topicByCore.get(headingCore(line))
        let consumed = 1
        if (!topic && index + 1 < bodyLines.length && line.length <= 40) {
          const joined = `${line}${bodyLines[index + 1].line}`
          topic = topicByCore.get(headingCore(joined))
          if (topic) consumed = 2
        }
        if (topic) {
          current = section.topics.indexOf(topic)
          index += consumed - 1
          continue
        }
        if (current >= 0) buckets[current].push(line)
        else intro.push(line)
      }
      section.intro = section.topics.length ? paragraphize(intro) : []
      let missing = 0
      section.topics.forEach((topic, index) => {
        topic.paragraphs = paragraphize(buckets[index])
        if (!topic.paragraphs.length) {
          missing += 1
          topic.missing = true
        }
      })
      if (!section.topics.length) {
        section.body = paragraphize(bodyLines.map((item) => item.line))
      }
      if (missing) {
        console.warn(`[warn] ${chapter.title} / ${section.title}: ${missing} 个小节未匹配到正文标题`)
      }

      const meridian = section.meridianId ? meridianById.get(section.meridianId) : null
      if (meridian) {
        section.meridianStatus = {
          collected: meridian.acupointIds?.length ?? 0,
          total: meridian.totalPoints ?? 0,
          complete:
            Boolean(meridian.totalPoints) &&
            (meridian.acupointIds?.length ?? 0) >= meridian.totalPoints,
        }
      }
      section.endPage = endPage
      section.topicCount = section.topics.length
    }
    chapter.endPage = chapter.sections[chapter.sections.length - 1]?.endPage ?? nextChapterPage - 1
  }

  const usableChapters = chapters.filter((chapter) => chapter.sections.length > 0)
  return {
    source:
      '据《倪海厦人纪系列之针灸教程》PDF 文本层整理；保留章节、小目录、每条经络教程与正文，页眉页脚已清理。',
    sourcePdf: '倪海厦人纪系列之针灸教程.pdf',
    chapters: usableChapters,
    stats: {
      chapters: usableChapters.length,
      sections: usableChapters.reduce((sum, chapter) => sum + chapter.sections.length, 0),
      topics: usableChapters.reduce(
        (sum, chapter) =>
          sum + chapter.sections.reduce((sectionSum, section) => sectionSum + section.topics.length, 0),
        0,
      ),
      pages: pages.length,
    },
  }
}

const markdown = parseQuickrefMarkdown()
const quickrefStatic = JSON.parse(readText(path.join(contentDir, 'acupuncture-meridian-quickref.json')))
const generatedAt = new Date().toISOString()

const conditionCount = markdown.categories.reduce((sum, cat) => sum + cat.conditions.length, 0)
const quickref = {
  generatedAt,
  ...quickrefStatic,
  ...markdown,
  conditionCount,
  declaredConditionCount: 215,
  conditionCaseCount: markdown.conditionCases.length,
  penetrationCaseCount: markdown.penetrations.filter((item) => item.case).length,
}
const tutorial = {
  generatedAt,
  ...buildTutorial(),
}

writeJson(path.join(root, 'src', 'data', 'acupuncture-quickref.json'), quickref, true)
writeJson(path.join(root, 'src', 'data', 'acupuncture-tutorial.json'), tutorial)

console.log(
  `Wrote acupuncture quickref: ${markdown.categories.length} categories, ${conditionCount} conditions, ${markdown.penetrations.length} penetrations, ${markdown.conditionCases.length} cases`,
)
console.log(
  `Wrote acupuncture tutorial: ${tutorial.stats.chapters} chapters, ${tutorial.stats.sections} sections, ${tutorial.stats.topics} topics, ${tutorial.stats.pages} pages`,
)
