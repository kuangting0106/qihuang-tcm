#!/usr/bin/env node
/**
 * 补《金匮要略》讲义数据中 composition 缺失的剂量。
 *
 * 只在 dosage 为空时补；已有剂量、君臣佐使、药对、讲解一律不动。
 * 原文没有明确剂量的，统一写“用量需根据实际病症情况而定”，不猜单位。
 *
 * 运行：node scripts/fix-jingui-doses.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const file = path.join(root, 'scripts', 'content', 'jingui-formulas.json')
const data = JSON.parse(fs.readFileSync(file, 'utf8'))
const FALLBACK = '用量需根据实际病症情况而定'

const patches = {
  'jingui-3ae220': { 栝蒌根: '等分', 牡蛎: '等分' },
  'jingui-83ddeb': { 盐: '等分' },
  'jingui-6b0f62': {
    麻黄: FALLBACK,
    黄芪: FALLBACK,
    黄芩: FALLBACK,
    细辛: FALLBACK,
    独活: FALLBACK,
  },
  'jingui-5142de': {
    黄芪: FALLBACK,
    当归: FALLBACK,
    白芍: FALLBACK,
    川芎: FALLBACK,
    桃仁: FALLBACK,
    红花: FALLBACK,
    地龙: FALLBACK,
  },
  'jingui-dcec4d': {
    昆布: FALLBACK,
    海藻: FALLBACK,
    黄柏: FALLBACK,
    知母: FALLBACK,
    栝蒌根: FALLBACK,
    桔梗: FALLBACK,
    三棱: FALLBACK,
    莪术: FALLBACK,
    连翘: FALLBACK,
    黄芩: FALLBACK,
    黄连: FALLBACK,
    葛根: FALLBACK,
    柴胡: FALLBACK,
    当归: FALLBACK,
    龙胆草: FALLBACK,
    甘草: FALLBACK,
  },
  'jingui-8e99da': { 石膏: '如鸡子大' },
  'jingui-d3bb4c': { 葶苈: FALLBACK },
  'jingui-5e7de1': { 黄连: '两钱', 枳实: FALLBACK },
  'jingui-8b3a5b': { 硝石: '等分', 矾石: '等分' },
  'jingui-aeb261': { 枳实: '等分', 芍药: '等分' },
}

let changed = 0
for (const formula of data.formulas ?? []) {
  const patch = patches[formula.id]
  if (!patch) continue
  for (const item of formula.composition ?? []) {
    const name = item.herbName || item.herbId
    if (!name) continue
    const key = Object.keys(patch).find((candidate) => name.startsWith(candidate))
    if (!key) continue
    // 旧数据把剂量/炮制粘在 herbName 上，显示时会重复；这里只清理这些待补条目。
    const cleanName = name
      .replace(/(?:熬令黄色|烧令黑|各|如鸡子大|两钱)$/, '')
      .replace(/\d+$/, '')
    if (cleanName && cleanName !== name && item.herbName) item.herbName = cleanName
    if (item.dosage) continue
    item.dosage = patch[key]
    changed += 1
    if (patch[key] === FALLBACK) {
      item.note = item.note ?? `原文作“${name}”，未标明确用量`
    }
  }
}

fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
console.log(`金匮剂量补齐：${changed} 味。`)
