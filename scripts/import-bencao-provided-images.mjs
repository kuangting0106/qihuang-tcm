import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const SOURCE_DIR = 'F:/中医/植物药材图片'
const CSV_FILE = path.join(SOURCE_DIR, '药材名录.csv')
const INDEX_FILE = path.join(ROOT, 'public', 'data', 'bencao-dacheng', 'index.json')
const OUT_DIR = path.join(ROOT, 'public', 'images', 'herbs', 'dacheng')
const MANIFEST_FILE = path.join(ROOT, 'scripts', 'content', 'bencao-dacheng-provided-images.json')

const SOURCE_URL = 'https://baijiahao.baidu.com/s?id=1846692323081276472'
const CREDIT = '用户提供 / 中草药知识汇总（百家号）· 药用植物图鉴（作者：冬凌草）'
const LICENSE = '用户提供，来源网络，版权归原作者所有'

// 图片原标注与站内药名不一致时的人工对应。
const NAME_OVERRIDES = {
  苏叶: '紫苏叶',
  祁漏芦: '漏芦',
  罗布麻: '罗布麻叶',
}

// 不采用：站内无独立条目，或原图基原与《中国药典》来源不符。
const SKIP_REASONS = {
  荆芥穗: '与荆芥同图，站内无独立“荆芥穗”条目',
  凤仙透骨草: '站内无“凤仙透骨草”条目',
  洋金花: '原图为毛曼陀罗 Datura innoxia，与药典洋金花基原 Datura metel 不符，暂不采用',
  枸杞子: '原图为北方枸杞 Lycium chinense，与药典枸杞子基原 Lycium barbarum 不符；且站内已有图片',
}

function parseCsv(text) {
  const rows = []
  let cur = ''
  let quoted = false
  let row = []
  const source = text.replace(/^\uFEFF/, '')
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i]
    if (char === '"') {
      if (quoted && source[i + 1] === '"') {
        cur += '"'
        i += 1
      } else {
        quoted = !quoted
      }
    } else if (char === ',' && !quoted) {
      row.push(cur)
      cur = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (cur !== '' || row.length) {
        row.push(cur)
        rows.push(row)
        row = []
        cur = ''
      }
      if (char === '\r' && source[i + 1] === '\n') i += 1
    } else {
      cur += char
    }
  }
  if (cur || row.length) {
    row.push(cur)
    rows.push(row)
  }
  return rows.slice(1).filter((item) => item.length >= 6)
}

function main() {
  const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'))
  const byName = new Map(index.items.map((item) => [item.name, item]))
  const rows = parseCsv(fs.readFileSync(CSV_FILE, 'utf8'))

  fs.mkdirSync(OUT_DIR, { recursive: true })
  const manifest = {}
  const added = []
  const already = []
  const skipped = []
  const unmatched = []

  for (const [number, plant, latin, medicine, , file] of rows) {
    const sourceFile = path.join(SOURCE_DIR, file)
    if (!fs.existsSync(sourceFile)) {
      unmatched.push({ number, plant, medicine, reason: `缺少图片文件：${file}` })
      continue
    }

    const targets = medicine
      .split(/[、;；]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => NAME_OVERRIDES[item] ?? item)

    for (const target of targets) {
      if (SKIP_REASONS[target]) {
        skipped.push({ number, plant, target, reason: SKIP_REASONS[target] })
        continue
      }
      const entry = byName.get(target)
      if (!entry) {
        unmatched.push({ number, plant, target, reason: '站内没有同名药材条目' })
        continue
      }
      if (entry.image) {
        already.push({ number, plant, target })
        continue
      }

      const ext = path.extname(file).toLowerCase() || '.jpg'
      const destName = `plant-${String(number).padStart(3, '0')}${ext}`
      const destFile = path.join(OUT_DIR, destName)
      if (!fs.existsSync(destFile)) fs.copyFileSync(sourceFile, destFile)

      manifest[target] = {
        url: `/images/herbs/dacheng/${destName}`,
        alt: `${plant}（${latin}）`,
        credit: CREDIT,
        license: LICENSE,
        sourceUrl: SOURCE_URL,
        latin,
        kind: '原植物',
      }
      added.push({ number, plant, target, destName })
    }
  }

  fs.writeFileSync(MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`Provided images: ${rows.length} rows`)
  console.log(`Added to entries without images: ${added.length}`)
  console.log(`Already had images (kept): ${already.length}`)
  console.log(`Skipped: ${skipped.length}`)
  console.log(`Unmatched: ${unmatched.length}`)
  if (skipped.length) console.log('Skipped detail:', skipped)
  if (unmatched.length) console.log('Unmatched detail:', unmatched)
  console.log(`Manifest: ${path.relative(ROOT, MANIFEST_FILE)}`)
}

main()
