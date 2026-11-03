import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { herbSpecies } from './content/herb-species.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'public', 'images', 'herbs', 'lecture')
const creditsFile = path.join(root, 'scripts', 'content', 'herb-image-credits.json')

fs.mkdirSync(outDir, { recursive: true })

const credits = []
for (const species of herbSpecies) {
  if (species.images?.length) {
    const images = species.images.map((image) => ({
      file: image.file,
      kind: image.kind,
      alt: image.alt,
      credit: image.credit,
      license: image.license,
      ...(image.sourceUrl ? { sourceUrl: image.sourceUrl } : {}),
    }))
    const first = images[0]
    credits.push({
      name: species.name,
      latin: species.latin,
      ...(species.taxonId ? { taxonId: species.taxonId } : {}),
      file: first.file,
      credit: first.credit,
      license: first.license,
      sourceUrl: '',
      images,
    })
    console.log(`${species.name}: ${images.length} images`)
    continue
  }

  const ext = path.extname(new URL(species.photoUrl).pathname) || '.jpg'
  const filename = `${species.taxonId}${ext}`
  const target = path.join(outDir, filename)

  if (!fs.existsSync(target)) {
    const res = await fetch(species.photoUrl)
    if (!res.ok) throw new Error(`${species.name}: HTTP ${res.status}`)
    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length < 2000) throw new Error(`${species.name}: 图片过小`)
    fs.writeFileSync(target, buffer)
  }

  credits.push({
    name: species.name,
    latin: species.latin,
    taxonId: species.taxonId,
    file: `/images/herbs/lecture/${filename}`,
    credit: species.credit,
    license: species.license,
    sourceUrl: `https://www.inaturalist.org/taxa/${species.taxonId}`,
  })
  console.log(`${species.name}: ${filename}`)
}

fs.writeFileSync(creditsFile, JSON.stringify({ generatedAt: new Date().toISOString(), items: credits }, null, 2) + '\n', 'utf8')
console.log(`Wrote ${credits.length} credits -> ${path.relative(root, creditsFile)}`)
