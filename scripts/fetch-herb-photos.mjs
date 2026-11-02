import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'public', 'images', 'herbs', 'real')
fs.mkdirSync(outDir, { recursive: true })

const taxa = {
  gancao: { id: 775858, name: '甘草', latin: 'Glycyrrhiza uralensis' },
  guizhi: { id: 774822, name: '桂枝', latin: 'Cinnamomum cassia' },
  baishao: { id: 127857, name: '白芍', latin: 'Paeonia lactiflora' },
  shengjiang: { id: 122971, name: '生姜', latin: 'Zingiber officinale' },
  dazao: { id: 428365, name: '大枣', latin: 'Ziziphus jujuba' },
  chaihu: { id: 601649, name: '柴胡', latin: 'Bupleurum chinense' },
  huangqin: { id: 565882, name: '黄芩', latin: 'Scutellaria baicalensis' },
  banxia: { id: 166883, name: '半夏', latin: 'Pinellia ternata' },
  renshen: { id: 366498, name: '人参', latin: 'Panax ginseng' },
}

const preferred = ['cc0', 'cc-by', 'cc-by-sa']
const usable = new Set([...preferred, 'cc-by-nc', 'cc-by-nc-sa'])

async function json(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'qihuang-tcm-prototype/0.1' } })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

function largeUrl(url) {
  return url.replace(/\/square\.(jpg|jpeg|png)$/i, '/large.$1')
}

async function download(url, dest, attempts = 4) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return fs.readFileSync(dest)
  let lastError
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'qihuang-tcm-prototype/0.1' } })
      if (!res.ok) throw new Error(`Image ${res.status}: ${url}`)
      const buf = Buffer.from(await res.arrayBuffer())
      fs.writeFileSync(dest, buf)
      return buf
    } catch (err) {
      lastError = err
      await new Promise((resolve) => setTimeout(resolve, 700 * (i + 1)))
    }
  }
  throw lastError
}

const result = {}

for (const [id, taxon] of Object.entries(taxa)) {
  console.log(`Fetching ${taxon.name} (${taxon.latin})...`)
  const data = await json(
    `https://api.inaturalist.org/v1/observations?taxon_id=${taxon.id}&photos=true&per_page=40&order_by=votes`,
  )
  const candidates = []
  for (const obs of data.results ?? []) {
    for (const photo of obs.photos ?? []) {
      if (!photo.url || !photo.license_code || !usable.has(photo.license_code)) continue
      candidates.push({
        url: largeUrl(photo.url),
        license: photo.license_code,
        attribution: photo.attribution,
        observationId: obs.id,
        observationUrl: `https://www.inaturalist.org/observations/${obs.id}`,
        taxon: obs.taxon?.name,
      })
    }
  }
  candidates.sort((a, b) => {
    const ap = preferred.indexOf(a.license)
    const bp = preferred.indexOf(b.license)
    return (ap === -1 ? 99 : ap) - (bp === -1 ? 99 : bp)
  })
  const seen = new Set()
  const chosen = []
  for (const c of candidates) {
    if (seen.has(c.observationId)) continue
    seen.add(c.observationId)
    chosen.push(c)
    if (chosen.length === 3) break
  }
  if (chosen.length < 3) {
    for (const c of candidates) {
      if (chosen.some((x) => x.url === c.url)) continue
      chosen.push(c)
      if (chosen.length === 3) break
    }
  }
  const images = []
  for (let i = 0; i < chosen.length; i++) {
    const c = chosen[i]
    const ext = c.url.match(/\.(jpg|jpeg|png)$/i)?.[1]?.toLowerCase() ?? 'jpg'
    const file = `${id}-${i + 1}.${ext}`
    const dest = path.join(outDir, file)
    const buf = await download(c.url, dest)
    images.push({
      type: 'photo',
      url: `/images/herbs/real/${file}`,
      alt: `${taxon.name}实拍照片`,
      caption: '实拍照片',
      credit: c.attribution,
      license: c.license.toUpperCase(),
      sourceUrl: c.observationUrl,
      bytes: buf.length,
    })
    console.log(`  ${file} ${Math.round(buf.length / 1024)} KB (${c.license})`)
  }
  result[id] = { taxon: taxon.latin, images }
}

fs.writeFileSync(
  path.join(root, 'scripts', 'content', 'herb-photos.json'),
  JSON.stringify(result, null, 2),
  'utf8',
)
console.log('Wrote scripts/content/herb-photos.json')
