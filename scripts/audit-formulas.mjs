#!/usr/bin/env node
/**
 * 方剂数据审计：伤寒、金匮、米晶子三部分。
 * 输出 scripts/content/formula-audit.json，并把摘要打印到终端。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const files = {
  shanghan: path.join(root, 'scripts', 'content', 'shanghan-formulas.json'),
  jingui: path.join(root, 'scripts', 'content', 'jingui-formulas.json'),
  mijingzi: path.join(root, 'scripts', 'content', 'mijingzi-formulas.json'),
}

function read(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

const data = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, read(file)]),
)
const mijingzi = data.mijingzi

const rows = []
for (const [book, value] of Object.entries(data)) {
  for (const formula of value.formulas ?? []) {
    const composition = formula.composition ?? []
    const preparation = formula.preparation ?? null
    rows.push({
      book,
      id: formula.id,
      name: formula.name,
      compositionCount: composition.length,
      hasComposition: composition.length > 0,
      hasPreparation: Boolean(
        preparation && (preparation.ingredients || preparation.decoction || preparation.administration),
      ),
      missingDosage: composition.filter((item) => !item.dosage).length,
      fallbackDosage: composition.filter((item) => String(item.dosage ?? '').includes('用量需')).length,
      corePairs: formula.corePairs?.length ?? 0,
      decoctionEmpty: !String(preparation?.decoction?.text ?? '').trim(),
      administrationEmpty: !String(preparation?.administration?.text ?? '').trim(),
    })
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  total: rows.length,
  byBook: Object.fromEntries(
    Object.keys(data).map((book) => {
      const list = rows.filter((row) => row.book === book)
      return [
        book,
        {
          total: list.length,
          withComposition: list.filter((row) => row.hasComposition).length,
          withoutComposition: list.filter((row) => !row.hasComposition).length,
          withPreparation: list.filter((row) => row.hasPreparation).length,
          withoutPreparation: list.filter((row) => !row.hasPreparation).length,
          compositionItems: list.reduce((sum, row) => sum + row.compositionCount, 0),
          missingDosage: list.reduce((sum, row) => sum + row.missingDosage, 0),
          fallbackDosage: list.reduce((sum, row) => sum + row.fallbackDosage, 0),
          formulasWithCorePairs: list.filter((row) => row.corePairs > 0).length,
          emptyDecoction: list.filter((row) => row.decoctionEmpty).length,
        },
      ]
    }),
  ),
  mijingzi: {
    originalTotal: mijingzi.stats?.originalFormulas ?? 501,
    kept: (mijingzi.formulas ?? []).length,
    dropped: mijingzi.stats?.dropped ?? mijingzi.dropped?.length ?? 0,
    droppedIds: (mijingzi.dropped ?? []).map((item) => item.id),
    fallbackDosage: mijingzi.stats?.fallbackDoses ?? 0,
  },
  review: {
    uncertainItems: rows
      .filter((row) => row.book === 'mijingzi')
      .flatMap((row) => {
        const formula = (mijingzi.formulas ?? []).find((item) => item.id === row.id)
        return (formula?.composition ?? [])
          .filter((item) => /待考/.test(String(item.note ?? '')))
          .map((item) => ({ id: row.id, name: row.name, herb: item.herbName, note: item.note }))
      }),
    formulasWithoutPreparation: rows.filter((row) => !row.hasPreparation).map((row) => row.id),
  },
}

const output = path.join(root, 'scripts', 'content', 'formula-audit.json')
fs.writeFileSync(output, `${JSON.stringify({ summary, rows }, null, 2)}\n`, 'utf8')

console.log(`审计：${summary.total} 首`)
for (const [book, stats] of Object.entries(summary.byBook)) {
  console.log(
    `  ${book}: ${stats.total} 首，有组成 ${stats.withComposition}，无组成 ${stats.withoutComposition}，` +
      `有煎服 ${stats.withPreparation}，无煎服 ${stats.withoutPreparation}，组成 ${stats.compositionItems} 味，` +
      `缺剂量 ${stats.missingDosage}，待定剂量 ${stats.fallbackDosage}，有药对 ${stats.formulasWithCorePairs}`,
  )
}
console.log(
  `  米晶子：原 ${summary.mijingzi.originalTotal} 首，保留 ${summary.mijingzi.kept}，删除 ${summary.mijingzi.dropped}`,
)
console.log(`报告：${path.relative(root, output)}`)
