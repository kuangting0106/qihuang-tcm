#!/usr/bin/env node
/**
 * 把现有 scripts/content/mijingzi-formulas.json 的 OCR 原文重新拆方。
 *
 * - 有可识别药材：写入 composition / preparation，保留原 id（删条目留空号）。
 * - 没有可识别药材：从 formulas 与 sources 中移除，不把纯针灸、纯外治、单纯方名
 *   或“见某条”的索引当方剂展示。
 *
 * 运行：node scripts/enrich-mijingzi-formulas.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseMijingziFormula, UNDETERMINED_DOSAGE } from './mijingzi-formula-parser.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const file = path.join(root, 'scripts', 'content', 'mijingzi-formulas.json')
const data = JSON.parse(fs.readFileSync(file, 'utf8'))

const kept = []
const dropped = [...(data.dropped ?? [])]
const originalTotal = data.stats?.originalFormulas ?? data.formulas?.length ?? 0
let fallbackDoses = 0

for (const formula of data.formulas ?? []) {
  const parsed = parseMijingziFormula(formula)
  if (parsed.dropped) {
    if (!dropped.some((item) => item.id === formula.id)) {
      dropped.push({
        id: formula.id,
        name: formula.name,
        reason: parsed.warnings.join('；') || '未识别到药材',
      })
    }
    continue
  }

  fallbackDoses += parsed.composition.filter(
    (item) => item.dosage === UNDETERMINED_DOSAGE,
  ).length

  kept.push({
    ...formula,
    composition: parsed.composition,
    preparation: parsed.preparation,
    corePairs: [],
    modifications: [],
    modificationsNote: formula.modificationsNote ?? '',
  })
}

const keptSourceIds = new Set(kept.map((formula) => formula.sourceCitationId))
const sources = (data.sources ?? []).filter((source) => keptSourceIds.has(source.id))

const next = {
  ...data,
  generatedAt: new Date().toISOString(),
  stats: {
    ...(data.stats ?? {}),
    originalFormulas: originalTotal,
    formulas: kept.length,
    sources: sources.length,
    dropped: dropped.length,
    fallbackDoses,
  },
  dropped,
  sources,
  formulas: kept,
}

fs.writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
console.log(
  `米晶子拆方完成：原 ${originalTotal} 首，保留 ${kept.length} 首，删除 ${dropped.length} 首，` +
    `组成 ${kept.reduce((sum, formula) => sum + formula.composition.length, 0)} 味，` +
    `未标用量 ${fallbackDoses} 味。`,
)
console.log('删除条目：')
for (const item of dropped) console.log(`  ${item.id} ${item.name} — ${item.reason}`)
