import fs from 'node:fs'
import path from 'node:path'
import { lexer, parser } from 'marked'

const root = process.cwd()
const sourceDir = path.join(root, 'scripts', 'content', 'li-ke-details')
const outputDir = path.join(root, 'public', 'data', 'li-ke-details')

const modules = [
  {
    id: 'yangqi',
    number: '01',
    stage: '立根',
    file: '01_yangqi.md',
    title: '阳气理论详解',
    summary: '阳气定义、生命根基、现代伤阳、护阳方法与李可相关医论。',
  },
  {
    id: 'shanghan',
    number: '02',
    stage: '立根',
    file: '02_shanghan.md',
    title: '六经辨证要点',
    summary: '六经总论、六经各论、自学路径与彭子益圆运动理论。',
  },
  {
    id: 'zhenghou',
    number: '05',
    stage: '立根',
    file: '05_zhenghou.md',
    title: '辨证要点与假证识别',
    summary: '阴阳总纲、假阳证十大场景、假阴证、各经假证与五步辨证。',
  },
  {
    id: 'maifa',
    number: '06',
    stage: '立根',
    file: '06_maifa.md',
    title: '脉诊经验',
    summary: '常见脉象、危重脉象、方证对应、动态观察与三则医案。',
  },
  {
    id: 'jingfang',
    number: '03',
    stage: '入方',
    file: '03_jingfang.md',
    title: '李可经方基础有效量详解',
    summary: '古今剂量折算、核心药物有效量、经方剂量表、煎服法与六经验方。',
  },
  {
    id: 'suxiao',
    number: '11',
    stage: '入方',
    file: '11-jichu-youxiaoliang.md',
    title: '经方基础有效量（速查）',
    summary: '方剂级基础有效量、铜权换算、原方折半、小青龙汤与伤寒金匮速查。',
  },
  {
    id: 'leifang',
    number: '12',
    stage: '入方',
    file: '12-leifang-huican-pizhu.md',
    title: '类方批注：左季云《伤寒论类方汇参》',
    summary: '李可唯一批注医书的五大特点、十二类方批注与书末增补笔记。',
  },
  {
    id: 'peiyuan',
    number: '04',
    stage: '入方',
    file: '04_peiyuan.md',
    title: '培元固本散详解',
    summary: '慢性病善后、方剂组成、药分三层、临床应用与配伍思路。',
  },
  {
    id: 'yilun',
    number: '07',
    stage: '读人',
    file: '07-yilun-buyi.md',
    title: '《医论专辑》补遗',
    summary: '川崎病、甲流、免疫病、学经方两关、三关与李可年谱。',
  },
  {
    id: 'liujingxue',
    number: '09',
    stage: '读人',
    file: '09-liujing-bianzhengxue.md',
    title: '六经辨证学（孙其新整理框架）',
    summary: '以方类证的编排、六经各论、会通六合与整理框架。',
  },
  {
    id: 'duihua',
    number: '10',
    stage: '读人',
    file: '10-renti-yangqi-duihua.md',
    title: '人体阳气与疾病 · 对话大医李可',
    summary: '田原采访实录：阳气、空调病、剂量、肿瘤、脉法与传承。',
  },
  {
    id: 'suoyin',
    number: '08',
    stage: '备用',
    file: '08-fangji-suoyin.md',
    title: '李可方剂总索引',
    summary: '按病证快速定位的方剂索引、李可命名方与笔者拟名方。',
  },
]

function plainText(value) {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function wrapTables(html) {
  return html
    .replace(/<table>/g, '<div class="table-scroll"><table>')
    .replace(/<\/table>/g, '</table></div>')
}

function countChars(markdown) {
  return Array.from(markdown.replace(/\s/g, '')).length
}

fs.mkdirSync(outputDir, { recursive: true })

const indexItems = []
let totalSections = 0

for (const item of modules) {
  const filePath = path.join(sourceDir, item.file)
  const markdown = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '')
  const tokens = lexer(markdown, { gfm: true })

  const rebuilt = tokens.map((token) => token.raw).join('')
  if (rebuilt !== markdown) {
    throw new Error(
      `${item.file}: token.raw 无法完整拼回原文（原文 ${markdown.length}，重建 ${rebuilt.length}）`,
    )
  }

  const firstH2 = tokens.findIndex(
    (token) => token.type === 'heading' && token.depth === 2,
  )
  if (firstH2 < 0) throw new Error(`${item.file}: 未找到 H2，无法分节`)

  const introTokens = tokens.slice(0, firstH2)
  const h1 = introTokens.find((token) => token.type === 'heading' && token.depth === 1)
  const title = h1 ? plainText(h1.text) : item.title
  const introHtml = wrapTables(
    parser(
      introTokens.filter((token) => !(token.type === 'heading' && token.depth === 1)),
      { gfm: true },
    ),
  )

  const sections = []
  let current = null
  for (const token of tokens.slice(firstH2)) {
    if (token.type === 'heading' && token.depth === 2) {
      if (current) sections.push(current)
      current = {
        tokens: [],
        titleToken: token,
      }
    } else if (current) {
      current.tokens.push(token)
    }
  }
  if (current) sections.push(current)

  const renderedSections = sections.map((section, index) => ({
    id: `section-${index + 1}`,
    number: String(index + 1).padStart(2, '0'),
    title: plainText(section.titleToken.text),
    html: wrapTables(parser(section.tokens, { gfm: true })),
  }))

  totalSections += renderedSections.length

  const detail = {
    id: item.id,
    number: item.number,
    stage: item.stage,
    title,
    summary: item.summary,
    sourceFile: item.file,
    charCount: countChars(markdown),
    sectionCount: renderedSections.length,
    introHtml,
    sections: renderedSections,
    sourceNote:
      '本页按原稿 H2 分节，正文未删减，仅做 Markdown 排版。原稿含 OCR/蒸馏痕迹与具体处方剂量，仅供文献学习，不能照方用药。',
  }

  fs.writeFileSync(
    path.join(outputDir, `${item.id}.json`),
    `${JSON.stringify(detail, null, 2)}\n`,
  )

  indexItems.push({
    id: item.id,
    number: item.number,
    stage: item.stage,
    title,
    summary: item.summary,
    sourceFile: item.file,
    charCount: detail.charCount,
    sectionCount: detail.sectionCount,
    sections: renderedSections.map((section) => ({
      id: section.id,
      number: section.number,
      title: section.title,
    })),
  })

  console.log(
    `${item.id.padEnd(13)} ${String(detail.charCount).padStart(6)} 字  ${String(detail.sectionCount).padStart(2)} 节  ${title}`,
  )
}

indexItems.sort((a, b) => Number(a.number) - Number(b.number))

fs.writeFileSync(
  path.join(outputDir, 'index.json'),
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      sourceDir: 'scripts/content/li-ke-details',
      note: '李可医书经验提纲详解全文。每篇按 H2 分节，正文未删减。',
      items: indexItems,
    },
    null,
    2,
  )}\n`,
)

console.log(`\nWrote ${indexItems.length} details, ${totalSections} sections`)
