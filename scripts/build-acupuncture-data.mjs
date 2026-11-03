import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceFile = path.join(root, 'scripts', 'content', 'acupuncture', '醒脑开窍针刺法.txt')
const outFile = path.join(root, 'src', 'data', 'acupuncture.json')

const text = fs
  .readFileSync(sourceFile, 'utf8')
  .replace(/\r\n/g, '\n')
  .replace(/GBl2/g, 'GB12')
  .replace(/TEl7/g, 'TE17')
  .replace(/HTl/g, 'HT1')
  .replace(/Lu5/g, 'LU5')
  .replace(/委中（BL54/g, '委中（BL40')
  .replace(/肩髃（LI15，足阳明大肠经）/g, '肩髃（LI15，手阳明大肠经）')
  .replace(/肩髎（SJ14，手少阳三焦经）/g, '肩髎（TE14，手少阳三焦经）')
  .replace(/痛点啊是穴/g, '痛点阿是穴')
  .replace(/此亮经/g, '此两经')
  .replace(/强迫白放/g, '强迫摆放')
  .replace(/担用力/g, '但用力')
const lines = text.split('\n')

const sectionRe = /^([一二三四五六七八九十]+)、\s*(.+)$/
const sections = []
let current = null

for (const rawLine of lines) {
  const line = rawLine.trim()
  if (!line) continue

  const match = line.match(sectionRe)
  if (match) {
    if (current) sections.push(current)
    current = { index: match[1], title: match[2].trim(), lines: [] }
    continue
  }

  if (!current) continue
  if (current.lines.length === 0 && !current.title) {
    current.title = line
    continue
  }
  current.lines.push(line)
}
if (current) sections.push(current)

function parseSection(section) {
  let points = ''
  const steps = []
  let inOperation = false

  for (const line of section.lines) {
    const pointMatch = line.match(/^[12]、\s*腧穴组成[:：]\s*(.+)$/)
    if (pointMatch) {
      points = pointMatch[1].trim()
      continue
    }

    if (/^[12]、\s*规范操作[:：]?\s*$/.test(line)) {
      inOperation = true
      continue
    }

    const numbered = line.match(/^[12]、\s*(.+)$/)
    if (numbered && !inOperation) {
      steps.push(numbered[1].trim())
      continue
    }

    steps.push(line)
  }

  return { points, steps }
}

const foundation = []
const conditions = []
let timing = ''
let closing = ''

for (const [index, section] of sections.entries()) {
  if (section.title.includes('治疗时间')) {
    const joined = section.lines.join(' ').trim()
    const splitAt = joined.indexOf('以上内容')
    timing = (splitAt >= 0 ? joined.slice(0, splitAt) : joined).trim()
    closing = splitAt >= 0 ? joined.slice(splitAt).trim() : ''
    continue
  }
  if (section.title.startsWith('以上内容')) {
    closing = section.lines.join(' ').trim()
    continue
  }

  const parsed = parseSection(section)
  const isFoundation = index < 4
  const title =
    isFoundation && section.title.includes('主穴之方')
      ? `主穴之方（${index === 0 ? '一' : '二'}）`
      : isFoundation && section.title.includes('辅穴')
        ? '辅穴'
        : isFoundation && section.title.includes('配穴')
          ? '配穴'
          : section.title

  const item = {
    id: `acup-${String(index + 1).padStart(2, '0')}`,
    index: section.index,
    title,
    points: parsed.points,
    steps: parsed.steps,
  }

  if (isFoundation) foundation.push(item)
  else conditions.push(item)
}

const payload = {
  id: 'shixuemin-xingnao',
  title: '醒脑开窍针刺法',
  subtitle: '石学敏院士中风及后遗症针法',
  warning: '非专业人士不要尝试。本页只作学习与文献整理，不构成操作指导。',
  warningNote:
    '针刺涉及深度、角度、手法与急救处理，咽后壁点刺、风府哑门、鸠尾等部位风险更高；必须由具备资质的执业中医师在合规场所操作。',
  source:
    '据《醒脑开窍针刺法操作方法（石学敏中风及后遗症针法）》整理，保留原操作说明的顺序与内容；未逐条核对正式出版教材与临床规范。',
  proofNote:
    '原文个别腧穴代码与经名有误（如委中 BL54、完骨 GBl2、翳风 TEl7、肩髃归经），已按现行经穴标准校正；其余文字照录，未作删节。',
  intro:
    '醒脑开窍针刺法以“醒神、调神、通窍”为纲，先取主穴，再按兼症加辅穴、配穴。以下按原文拆成基础穴方与病症分项，腧穴定位、进针方向、深度与手法均照录原文。',
  foundation,
  conditions,
  timing,
  closing,
}

fs.writeFileSync(outFile, JSON.stringify(payload, null, 2) + '\n', 'utf8')
console.log(
  `Wrote ${path.relative(root, outFile)}: ${foundation.length} foundation, ${conditions.length} conditions, ${timing ? 'timing yes' : 'timing no'}`,
)
