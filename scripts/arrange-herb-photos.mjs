import fs from 'node:fs'

const file = 'scripts/content/herb-photos.json'
const data = JSON.parse(fs.readFileSync(file, 'utf8'))

const order = {
  gancao: ['gancao-1.jpeg', 'gancao-3.jpg'],
  guizhi: ['guizhi-3.jpg', 'guizhi-2.jpg'],
  baishao: ['baishao-2.jpg', 'baishao-1.jpg'],
  shengjiang: ['shengjiang-1.jpg', 'shengjiang-root1.jpg', 'shengjiang-root2.jpg'],
  dazao: ['dazao-3.jpeg', 'dazao-fruit2.jpg', 'dazao-fruit1.jpg'],
  chaihu: ['chaihu-2.jpg', 'chaihu-1.jpeg'],
  huangqin: ['huangqin-2.jpg', 'huangqin-c1.jpeg'],
  banxia: ['banxia-2.jpeg', 'banxia-1.jpg'],
  renshen: ['renshen-2.jpeg', 'renshen-1.jpg'],
}

const slots = ['whole', 'part', 'medicinal']
const pending = {
  type: 'pending',
  url: '/images/herbs/real/pending-medicinal.svg',
  alt: '药材切片图待补',
  caption: '药材切片图待补',
  credit: '待补：公开授权图库暂缺',
  license: '—',
  slot: 'medicinal',
  pending: true,
}

for (const [id, files] of Object.entries(order)) {
  const current = data[id].images
  const byFile = new Map(current.map((im) => [im.url.split('/').pop(), im]))
  const images = files.map((f, i) => {
    const im = byFile.get(f)
    if (!im) throw new Error(`Missing image for ${id}: ${f}`)
    return { ...im, slot: slots[i] }
  })
  if (images.length === 2) images.push({ ...pending })
  data[id].images = images
}

fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8')
console.log('Arranged herb photos as whole / part / medicinal.')
