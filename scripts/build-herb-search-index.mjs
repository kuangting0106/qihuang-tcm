import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const sampleFile = path.join(root, 'public', 'data', 'sample_data.json')
const catalogFile = path.join(root, 'public', 'data', 'bencao-lectures', 'catalog.json')
const outFile = path.join(root, 'public', 'data', 'herb-search-index.json')

const sample = JSON.parse(fs.readFileSync(sampleFile, 'utf8'))
const catalog = JSON.parse(fs.readFileSync(catalogFile, 'utf8'))

const herbs = (sample.herbs ?? []).map((herb) => ({
  id: herb.id,
  name: herb.name,
  pinyin: herb.pinyin,
  aliases: herb.aliases ?? [],
  classicRankId: herb.classicRankId,
  therapyCategoryIds: herb.therapyCategoryIds ?? [],
  flavorTags: herb.flavorTags ?? [],
  meridianIds: herb.meridianIds ?? [],
  verification: herb.verification,
  images: (herb.images ?? []).slice(0, 1),
  properties: {
    effects: { text: herb.properties?.effects?.text ?? '' },
    indications: { text: herb.properties?.indications?.text ?? '' },
  },
}))

const lectures = (catalog.items ?? []).map((item) => ({
  key: item.key,
  name: item.name,
  pinyin: item.pinyin,
  groupId: item.groupId,
  entryId: item.entryId,
  rankId: item.rankId,
  number: item.number,
  flavorTags: item.flavorTags ?? [],
  nature: item.nature ?? '',
  meridianIds: item.meridianIds ?? [],
  meridianNames: item.meridianNames ?? [],
  effects: item.effects ?? '',
  indications: item.indications ?? '',
  summary: item.summary ?? '',
  aliases: item.aliases ?? [],
  therapyCategoryIds: item.therapyCategoryIds ?? [],
  curatedId: item.curatedId,
}))

const payload = { herbs, lectures }
fs.writeFileSync(outFile, `${JSON.stringify(payload)}\n`)
console.log(
  `Wrote ${path.relative(root, outFile)}: ${herbs.length} herbs, ${lectures.length} lecture items, ${(fs.statSync(outFile).size / 1024).toFixed(1)} KB`,
)
