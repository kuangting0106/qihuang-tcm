import fs from 'node:fs'

const data = JSON.parse(fs.readFileSync('scripts/content/herb-photos.json', 'utf8'))
const names = {
  gancao: '甘草',
  guizhi: '桂枝',
  baishao: '白芍',
  shengjiang: '生姜',
  dazao: '大枣',
  chaihu: '柴胡',
  huangqin: '黄芩',
  banxia: '半夏',
  renshen: '人参',
}

let md = `# 本草图片版权\n\n本页图片来自 iNaturalist 开放数据，按各自许可证使用。点击原图链接可查看作者与观察记录。\n\n`
for (const [id, v] of Object.entries(data)) {
  md += `## ${names[id]}（${v.taxon}）\n\n`
  md += `| 图片 | 许可证 | 作者/署名 | 原图 |\n|---|---|---|---|\n`
  for (const [i, im] of v.images.entries()) {
    md += `| ${i + 1} | ${im.license} | ${im.credit} | [查看](${im.sourceUrl}) |\n`
  }
  md += `\n`
}
md += `\n> 图片用于识别学习，不替代植物学/药材学鉴定。CC BY-NC 图片仅用于非商业学习原型；如用于商业用途，请替换为相应授权图片。\n`
fs.writeFileSync('docs/PHOTO-CREDITS.md', md, 'utf8')
console.log('Wrote docs/PHOTO-CREDITS.md')
