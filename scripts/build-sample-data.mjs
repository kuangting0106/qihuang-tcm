import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { sources } from './content/sources.mjs'
import { herbs } from './content/herbs.mjs'
import { meridians } from './content/meridians.mjs'
import { acupoints } from './content/acupoints.mjs'
import { formulas } from './content/formulas.mjs'
import { herbTaxonomy } from './content/herb-taxonomy.mjs'
import { herbProcessing, processingExamples } from './content/herb-processing.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = path.join(root, 'public', 'data')

fs.mkdirSync(dataDir, { recursive: true })

const photoFile = path.join(root, 'scripts', 'content', 'herb-photos.json')
const herbPhotos = fs.existsSync(photoFile)
  ? JSON.parse(fs.readFileSync(photoFile, 'utf8'))
  : {}
const enrichedHerbs = herbs.map((h) => {
  const assignment = herbTaxonomy.assignments[h.id]
  if (!assignment) throw new Error(`Missing herb taxonomy assignment: ${h.id}`)
  const processing = herbProcessing[h.id]
  if (!processing) throw new Error(`Missing herb processing entry: ${h.id}`)
  return {
    ...h,
    classicRankId: assignment.rankId,
    therapyCategoryIds: assignment.categoryIds,
    processing,
    images:
      herbPhotos[h.id]?.images?.length === 3
        ? herbPhotos[h.id].images
        : h.images,
  }
})

const bodyPointsFile = path.join(root, 'scripts', 'content', 'body_points.json')
const bodyPoints = fs.existsSync(bodyPointsFile)
  ? JSON.parse(fs.readFileSync(bodyPointsFile, 'utf8'))
  : null
const enrichedAcupoints = acupoints.map((p) => ({
  ...p,
  ...(bodyPoints?.points?.[p.id] ? { coordinates: bodyPoints.points[p.id] } : {}),
}))
const enrichedMeridians = meridians.map((m) => ({
  ...m,
  ...(bodyPoints?.paths?.[m.id] ? { path: bodyPoints.paths[m.id] } : {}),
  acupointIds: acupoints.filter((p) => p.meridianId === m.id).map((p) => p.id),
}))

const data = {
  schemaVersion: '1.0.0',
  contentVersion: '2026.11.1-prototype',
  generatedAt: new Date().toISOString(),
  title: '岐黄图鉴',
  disclaimer:
    '本站为中医知识学习原型，不构成诊疗建议。针刺、艾灸、用药须由执业中医师辨证操作；方剂与药性内容请以原书及现行标准为准。',
  contentPrinciples: [
    '每条中医内容都挂出处，没有出处的内容不展示。',
    '原文、摘录、后世方解分开标注，不把教材归纳冒充经典原文。',
    '查不到确切出处的字段宁可不写，也不用模型记忆补全。',
    '3D 穴位坐标使用离线预计算表，运行时不做人体表面映射。',
  ],
  bodyModel: {
    id: bodyPoints?.model ?? 'bronze-body-v1',
    coordinateFrame: bodyPoints?.coordinateFrame ?? 'bronze-body-v1',
    height: bodyPoints?.height ?? 1.84,
    notes:
      'MakeHuman CC0 基础网格改造的针灸铜人风格模型；青色腰布与头巾，无性器官细节，仅用于经络穴位学习。换模型必须同步更换坐标表版本。',
  },
  sources,
  herbs: enrichedHerbs,
  herbTaxonomy,
  processingExamples,
  formulas,
  meridians: enrichedMeridians,
  acupoints: enrichedAcupoints,
}

fs.writeFileSync(path.join(dataDir, 'sample_data.json'), JSON.stringify(data, null, 2), 'utf8')

console.log(
  `Wrote ${path.relative(root, path.join(dataDir, 'sample_data.json'))}: ` +
    `${sources.length} sources, ${enrichedHerbs.length} herbs, ${formulas.length} formulas, ` +
    `${enrichedMeridians.length} meridians, ${enrichedAcupoints.length} acupoints, ` +
    `${enrichedHerbs.reduce((n, h) => n + h.images.length, 0)} herb images.`,
)
