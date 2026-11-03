import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SOURCE_DIR =
  'E:/data/sources/tcm/raw/hantang-nihaixia-follower/倪海厦/人纪-5-金匮要略/26.临床案例和方剂补充处方'
const OUT = path.join(__dirname, '..', 'src', 'data', 'jingui-cases.json')

const FILES = [
  ['1.淋巴癌同时血癌.md', 'lymphoma-leukemia', '癌症'],
  ['2.渐冻症.md', 'als', '神经'],
  ['3.胆切了肝结石同时肝硬化.md', 'gallbladder-liver-cirrhosis', '肝胆'],
  ['4.心绞痛动脉血管堵塞.md', 'angina-artery-blockage', '心胸'],
  ['5.肝癌.md', 'liver-cancer', '肝胆'],
  ['6.乳癌末期移转.md', 'breast-cancer-metastasis', '妇科'],
  ['7.尿毒症.md', 'uremia', '肾与水病'],
  ['8.红斑性狼疮.md', 'lupus-1', '免疫'],
  ['9.肺癌第三期第四期.md', 'lung-cancer-stage-3-4', '肺系'],
  ['10.肺炎肺脓疡.md', 'pneumonia-lung-abscess', '肺系'],
  ['11.子宫肌瘤不孕不育.md', 'uterine-fibroid-infertility', '妇科'],
  ['12.右肾癌5次化疗左肾切除.md', 'right-kidney-cancer', '肾与水病'],
  ['13.红斑性狼疮.md', 'lupus-2', '免疫'],
]

const NON_MEDICAL_RE =
  /参同契|阴爻|阳爻|卦|爻|阴符经|周易|魏伯阳|易黄老|道德经|六十四卦|64个卦|六十四个卦|天纪|地纪|紫微斗数|风水|算命/

function splitPrescription(line) {
  const parts = line
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length < 2) return null

  const herbs = parts.map((part) => {
    const match = part.match(/^([\u4e00-\u9fa5·（）()]+?)([一二三四五六七八九十百两钱分铢克枚片个升合包支条斤\d].*)?$/)
    if (!match) return { name: part, dose: '' }
    return { name: match[1], dose: (match[2] || '').trim() }
  })
  return { raw: line, herbs }
}

function parseFile(file, id, category) {
  const full = path.join(SOURCE_DIR, file)
  const raw = fs.readFileSync(full, 'utf8').replace(/^\uFEFF/, '')
  const lines = raw.split(/\r?\n/)
  let title = file.replace(/^\d+\./, '').replace(/\.md$/, '')
  const content = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('#### ')) {
      title = trimmed.slice(5).trim()
      continue
    }
    if (!trimmed.startsWith('>')) continue
    const body = trimmed.replace(/^>\s?/, '').trim()
    if (!body) continue
    const prescription = splitPrescription(body)
    if (prescription) content.push({ type: 'prescription', ...prescription })
    else if (!NON_MEDICAL_RE.test(body)) content.push({ type: 'paragraph', text: body })
  }

  const paragraphs = content.filter((item) => item.type === 'paragraph')
  const patientParagraph =
    paragraphs.find((item) => /病人|患者|来看|来找|找我|就诊|求诊|\d{4}年|\d+岁/.test(item.text)) ??
    paragraphs[0]
  const summary = patientParagraph
    ? patientParagraph.text.replace(/\s+/g, ' ').slice(0, 90) +
      (patientParagraph.text.length > 90 ? '…' : '')
    : '讲义所录临床案例。'

  return {
    id,
    title,
    category,
    summary,
    source: {
      work: '倪海厦《人纪·金匮要略》讲义',
      locator: `临床案例和方剂补充处方 · ${file.replace(/\.md$/, '')}`,
    },
    content,
  }
}

const cases = FILES.map(([file, id, category]) => {
  if (!fs.existsSync(path.join(SOURCE_DIR, file))) {
    throw new Error(`缺少源文件：${file}`)
  }
  return parseFile(file, id, category)
})

fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), cases }, null, 2) + '\n')
const prescriptions = cases.reduce(
  (sum, item) => sum + item.content.filter((x) => x.type === 'prescription').length,
  0,
)
console.log(`Wrote ${path.relative(process.cwd(), OUT)}: ${cases.length} cases, ${prescriptions} prescriptions`)
