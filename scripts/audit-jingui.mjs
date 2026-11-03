import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const file = path.join(root, 'scripts', 'content', 'jingui-formulas.json')
const data = JSON.parse(fs.readFileSync(file, 'utf8'))
const formulas = data.formulas

const genericEffects = formulas.filter((f) =>
  (f.effects?.text ?? '').includes('讲义未单列功效概括'),
)
const noSymptoms = formulas.filter((f) => !(f.symptoms?.length))
const herbs = formulas.flatMap((f) => f.composition.map((c) => ({ formula: f.name, ...c })))
const withAction = herbs.filter((c) => c.action?.text?.trim())
const noAction = herbs.filter((c) => !c.action?.text?.trim())
const suspicious = herbs.filter((c) => {
  const name = c.herbName || c.herbId || ''
  return (
    /[，,。；;：:\s]/.test(name) ||
    /(大者|小者|等分|熬|汁)$/.test(name) ||
    name.length > 8
  )
})
const noMod = formulas.filter((f) => !(f.modifications?.length))
const modCounts = formulas
  .map((f) => ({ name: f.name, count: f.modifications?.length ?? 0 }))
  .filter((x) => x.count)
  .sort((a, b) => b.count - a.count)

console.log('formulas', formulas.length)
console.log('noSymptoms', noSymptoms.length, noSymptoms.map((f) => f.name).join('、'))
console.log('genericEffects', genericEffects.length)
console.log('herbs', herbs.length, 'withAction', withAction.length, 'noAction', noAction.length)
console.log('noMod', noMod.length)
console.log('modTop', JSON.stringify(modCounts.slice(0, 15)))
console.log('suspiciousHerbs', suspicious.length)
for (const item of suspicious.slice(0, 40)) {
  console.log('  -', item.formula, '|', item.herbName || item.herbId, '|', item.dosage)
}
