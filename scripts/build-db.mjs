#!/usr/bin/env node
/**
 * 从 public/data 的 JSON 生成只读 SQLite 数据库。
 *
 * 运行：node scripts/build-db.mjs
 * 输出：data/qihuang.db（可用 QIHUANG_DB_FILE 覆盖）
 *
 * 可重复运行：每次先删除旧库，再按 scripts/schema.sql 重建。
 */
import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const samplePath = path.join(root, 'public', 'data', 'sample_data.json')
const bencaoDir = path.join(root, 'public', 'data', 'bencao-lectures')
const schemaPath = path.join(root, 'scripts', 'schema.sql')
const dbPath = process.env.QIHUANG_DB_FILE ?? path.join(root, 'data', 'qihuang.db')

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function flatPinyin(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, '')
}

function summaryOf(entry) {
  const text =
    entry.profile?.effects ||
    entry.profile?.indications ||
    entry.sections?.flatMap((section) => section.blocks ?? []).find((block) => block.text)?.text ||
    ''
  return String(text).replace(/\s+/g, ' ').trim().slice(0, 160)
}

const data = readJson(samplePath)
const bencaoIndex = readJson(path.join(bencaoDir, 'index.json'))
const bencaoCatalog = readJson(path.join(bencaoDir, 'catalog.json'))
const bencaoGroupIds = ['intro', 'shangjing', 'zhongjing', 'xiajing', 'nishi', 'editor']
const bencaoGroups = bencaoGroupIds
  .map((id) => {
    const file = path.join(bencaoDir, `${id}.json`)
    return fs.existsSync(file) ? readJson(file) : null
  })
  .filter(Boolean)

fs.mkdirSync(path.dirname(dbPath), { recursive: true })
if (fs.existsSync(dbPath)) {
  try {
    fs.rmSync(dbPath)
  } catch {
    throw new Error(
      `无法覆盖 ${path.relative(root, dbPath)}；请先停止占用该文件的进程（例如本地 API 服务）`,
    )
  }
}
const db = new DatabaseSync(dbPath)
db.exec(fs.readFileSync(schemaPath, 'utf8'))

const insertSource = db.prepare(
  'INSERT INTO sources (id, type, work, locator, data_json) VALUES (?, ?, ?, ?, ?)',
)
const insertHerb = db.prepare(
  'INSERT INTO herbs (id, name, pinyin, classic_rank_id, effects_text, data_json) VALUES (?, ?, ?, ?, ?, ?)',
)
const insertFormula = db.prepare(
  `INSERT INTO formulas (id, name, pinyin, pinyin_flat, source_id, effects_text, symptom_tags_json, data_json)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
)
const insertComposition = db.prepare(
  `INSERT INTO formula_composition (formula_id, sort_order, herb_id, herb_name, dose, role, data_json)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
)
const insertSymptom = db.prepare(
  `INSERT INTO formula_symptoms (formula_id, sort_order, text, kind, citation_ids_json, data_json)
   VALUES (?, ?, ?, ?, ?, ?)`,
)
const insertAnnotation = db.prepare(
  `INSERT INTO formula_annotations (formula_id, sort_order, annotation_id, phrase, note, citation_ids_json, data_json)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
)
const insertModification = db.prepare(
  `INSERT INTO formula_modifications (formula_id, sort_order, condition, change, citation_ids_json, data_json)
   VALUES (?, ?, ?, ?, ?, ?)`,
)
const insertPreparation = db.prepare(
  `INSERT INTO formula_preparation (formula_id, field, text, locator, citation_ids_json, data_json)
   VALUES (?, ?, ?, ?, ?, ?)`,
)
const insertBencaoGroup = db.prepare(
  `INSERT INTO bencao_groups (id, title, subtitle, description, entry_count, char_count, sort_order, data_json)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
)
const insertBencaoEntry = db.prepare(
  `INSERT INTO bencao_entries
     (id, group_id, number, title, subtitle, pinyin, summary, note, aliases_json, char_count, section_count, sort_order, data_json)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
)
const insertMeta = db.prepare('INSERT INTO app_meta (key, value_json) VALUES (?, ?)')
const insertHerbLecture = db.prepare(
  `INSERT INTO herb_lecture_index
     (key, name, pinyin, group_id, entry_id, rank_id, number, therapy_category_ids_json, data_json)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
)

const counts = {
  sources: 0,
  herbs: 0,
  formulas: 0,
  composition: 0,
  bencaoGroups: 0,
  bencaoEntries: 0,
  herbLectures: 0,
}

db.exec('BEGIN')
try {
  for (const source of data.sources ?? []) {
    insertSource.run(source.id, source.type ?? '', source.work ?? '', source.locator ?? '', JSON.stringify(source))
    counts.sources += 1
  }

  for (const herb of data.herbs ?? []) {
    insertHerb.run(
      herb.id,
      herb.name,
      herb.pinyin ?? '',
      herb.classicRankId ?? null,
      herb.properties?.effects?.text ?? '',
      JSON.stringify(herb),
    )
    counts.herbs += 1
  }

  for (const formula of data.formulas ?? []) {
    insertFormula.run(
      formula.id,
      formula.name,
      formula.pinyin ?? '',
      flatPinyin(formula.pinyin),
      formula.sourceCitationId ?? '',
      formula.effects?.text ?? '',
      JSON.stringify(formula.symptomTags ?? []),
      JSON.stringify(formula),
    )
    counts.formulas += 1

    ;(formula.composition ?? []).forEach((item, index) => {
      insertComposition.run(
        formula.id,
        index,
        item.herbId ?? '',
        item.herbName ?? null,
        item.dosage ?? '',
        item.role ?? '',
        JSON.stringify(item),
      )
      counts.composition += 1
    })

    ;(formula.symptoms ?? []).forEach((item, index) => {
      insertSymptom.run(
        formula.id,
        index,
        item.text ?? '',
        item.kind ?? '',
        JSON.stringify(item.citationIds ?? []),
        JSON.stringify(item),
      )
    })

    ;(formula.originalAnnotations ?? []).forEach((item, index) => {
      insertAnnotation.run(
        formula.id,
        index,
        item.id ?? '',
        item.phrase ?? '',
        item.note ?? '',
        JSON.stringify(item.citationIds ?? []),
        JSON.stringify(item),
      )
    })

    ;(formula.modifications ?? []).forEach((item, index) => {
      insertModification.run(
        formula.id,
        index,
        item.condition ?? '',
        item.change ?? '',
        JSON.stringify(item.citationIds ?? []),
        JSON.stringify(item),
      )
    })

    const preparation = formula.preparation ?? {}
    for (const field of ['ingredients', 'decoction', 'administration']) {
      const claim = preparation[field]
      if (!claim || typeof claim !== 'object') continue
      insertPreparation.run(
        formula.id,
        field,
        claim.text ?? '',
        claim.locator ?? '',
        JSON.stringify(claim.citationIds ?? []),
        JSON.stringify(claim),
      )
    }
  }

  bencaoGroups.forEach((group, groupIndex) => {
    const entries = group.entries ?? []
    const charCount = entries.reduce((sum, entry) => sum + (entry.charCount ?? 0), 0)
    insertBencaoGroup.run(
      group.id,
      group.title ?? group.id,
      group.subtitle ?? '',
      group.description ?? '',
      entries.length,
      charCount,
      groupIndex,
      JSON.stringify({
        id: group.id,
        title: group.title ?? group.id,
        subtitle: group.subtitle ?? '',
        description: group.description ?? '',
        count: entries.length,
        charCount,
      }),
    )
    counts.bencaoGroups += 1

    entries.forEach((entry, index) => {
      insertBencaoEntry.run(
        entry.id,
        entry.groupId ?? group.id,
        Number.isInteger(entry.number) ? entry.number : null,
        entry.title ?? entry.id,
        entry.subtitle ?? '',
        entry.pinyin ?? '',
        summaryOf(entry),
        entry.note ?? '',
        JSON.stringify(entry.alsoKnownAs ?? []),
        entry.charCount ?? 0,
        entry.sections?.length ?? 0,
        index,
        JSON.stringify(entry),
      )
      counts.bencaoEntries += 1
    })
  })

  insertMeta.run('bencao_index', JSON.stringify(bencaoIndex))
  insertMeta.run(
    'bencao_catalog_meta',
    JSON.stringify({
      generatedAt: bencaoCatalog.generatedAt,
      source: bencaoCatalog.source,
      total: bencaoCatalog.total,
      threeRanks: bencaoCatalog.threeRanks,
      ranks: bencaoCatalog.ranks ?? [],
    }),
  )
  insertMeta.run('herb_principles', JSON.stringify(data.herbPrinciples ?? null))
  insertMeta.run(
    'meridian_names',
    JSON.stringify(Object.fromEntries((data.meridians ?? []).map((m) => [m.id, m.name]))),
  )
  insertMeta.run(
    'content_meta',
    JSON.stringify({
      schemaVersion: data.schemaVersion,
      contentVersion: data.contentVersion,
      generatedAt: data.generatedAt,
      title: data.title,
      disclaimer: data.disclaimer,
    }),
  )
  insertMeta.run('herb_taxonomy', JSON.stringify(data.herbTaxonomy ?? null))

  for (const item of bencaoCatalog.items ?? []) {
    insertHerbLecture.run(
      item.key,
      item.name,
      item.pinyin ?? '',
      item.groupId ?? '',
      item.entryId ?? '',
      item.rankId ?? '',
      Number.isInteger(item.number) ? item.number : null,
      JSON.stringify(item.therapyCategoryIds ?? []),
      JSON.stringify(item),
    )
    counts.herbLectures += 1
  }

  db.exec('COMMIT')
} catch (error) {
  db.exec('ROLLBACK')
  db.close()
  fs.rmSync(dbPath, { force: true })
  throw error
}

db.exec('ANALYZE')
db.close()

const size = fs.statSync(dbPath).size
console.log(`数据库已生成：${path.relative(root, dbPath)} (${(size / 1024 / 1024).toFixed(1)} MB)`)
console.log(
  [
    `sources=${counts.sources}`,
    `herbs=${counts.herbs}`,
    `formulas=${counts.formulas}`,
    `composition=${counts.composition}`,
    `bencaoGroups=${counts.bencaoGroups}`,
    `bencaoEntries=${counts.bencaoEntries}`,
    `herbLectures=${counts.herbLectures}`,
  ].join('  '),
)
