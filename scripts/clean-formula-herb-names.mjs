#!/usr/bin/env node
/**
 * 清理方剂组成中混入的炮制/剂量文字。
 * 只修明确列出的条目，避免大范围改动已有方剂数据。
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const FILES = [
  path.join(ROOT, 'scripts', 'content', 'shanghan-formulas.json'),
  path.join(ROOT, 'scripts', 'content', 'jingui-formulas.json'),
]

const PATCHES = {
  'shanghan-nihaixia-bvqp12': {
    '石膏如鸡子大': { herbName: '石膏', dosage: '如鸡子大' },
  },
  'jingui-5569a0': {
    代赭石如弹丸大: { herbName: '代赭石', dosage: '如弹丸大，一枚，碎，绵裹' },
  },
  'jingui-f7a1dd': {
    干姜两钱或: { herbName: '干姜', note: '原文作“干姜两钱或”' },
  },
  'jingui-1a9017': {
    甘草如指大: { herbName: '甘草', dosage: '如指大，一枚' },
  },
  'jingui-8f8f81': {
    乱髪烧: { herbName: '乱髪', note: '原文作“乱髪烧”' },
  },
  'jingui-8b3a5b': {
    硝石熬黄: { herbName: '硝石', note: '原文作“硝石熬黄”' },
    矾石烧: { herbName: '矾石', note: '原文作“矾石烧”' },
  },
  'jingui-fd66d6': {
    乱髪如鸡子大: { herbName: '乱髪', dosage: '如鸡子大，三枚' },
  },
}

function appendNote(item, note) {
  if (!note) return
  item.note = item.note ? `${item.note}；${note}` : note
}

let changed = 0
for (const file of FILES) {
  if (!fs.existsSync(file)) continue
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  const formulas = Array.isArray(data) ? data : data.formulas
  if (!Array.isArray(formulas)) continue

  for (const formula of formulas) {
    const patch = PATCHES[formula.id]
    if (!patch) continue
    for (const item of formula.composition ?? []) {
      const next = patch[item.herbName]
      if (!next) continue
      const before = item.herbName
      item.herbName = next.herbName
      if (next.dosage) item.dosage = next.dosage
      appendNote(item, next.note)
      changed += 1
      console.log(`${formula.id}: ${before} -> ${item.herbName}`)
    }
  }

  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

console.log(`已清理 ${changed} 条组成药名。`)
