import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { herbs } from './content/herbs.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir =
  'E:/data/sources/tcm/raw/hantang-nihaixia-follower/倪海厦/人纪-5-金匮要略'
const outFile = path.join(root, 'scripts', 'content', 'jingui-formulas.json')
const shanghanFile = path.join(root, 'scripts', 'content', 'shanghan-formulas.json')

const shanghan = JSON.parse(fs.readFileSync(shanghanFile, 'utf8'))
const existingNames = new Set(shanghan.formulas.map((formula) => formula.name))
const herbIdByName = new Map(herbs.map((herb) => [herb.name, herb.id]))
for (const formula of shanghan.formulas) {
  for (const item of formula.composition ?? []) {
    if (item.herbName && !herbIdByName.has(item.herbName)) {
      herbIdByName.set(item.herbName, item.herbId)
    }
  }
}

const DOSE_RE =
  /((?:[一二三四五六七八九十百千万半0-9]+)(?:两|钱|分|铢|斤|升|合|枚|个|茎|片|把|条|只|张|克|寸|劈|具|握|撮|尺|斗|斛|束|颗|粒|支|滴|匕))([\s\S]*)$/
const PREP_RE =
  /^(上|右).{0,6}味|以水|水[一二三四五六七八九十百]+升|煮取|煎取|微火煎|去滓|温服|分温|为散|为末|杵|捣|纳|丸如|如梧子|顿服|日[一二三]服|以上.{0,6}味|炼蜜|和蜜|酒服|米饮/
const MODEL = /主之|宜|可与|与|属/

function hash(value) {
  return crypto.createHash('sha1').update(value).digest('hex').slice(0, 6)
}

function cleanLine(line) {
  return line.replace(/^>\s?/, '').trim()
}

function isFormulaTitle(title) {
  return /^[\u4e00-\u9fa5A-Za-z0-9、，（）()·\-—\s]{1,40}$/.test(title) &&
    /(汤|散|丸|饮|煎|方)$/.test(title) &&
    !MODEL.test(title) &&
    !/[，。；]/.test(title)
}

const NAME_ALIASES = new Map([
  ['栝篓桂枝汤', '栝蒌桂枝汤'],
  ['桅子大黄汤', '栀子大黄汤'],
  ['防己黄耆汤', '防己黄芪汤'],
  ['黄耆芍药桂枝苦酒汤', '黄芪芍药桂枝苦酒汤'],
  ['桂枝加黄耆汤', '桂枝加黄芪汤'],
  ['黄苓加半夏生姜汤', '黄芩加半夏生姜汤'],
  ['猪膏髪煎', '猪膏发煎'],
])

const HERB_ALIASES = new Map([
  ['黄耆', '黄芪'],
  ['栝篓', '栝蒌'],
  ['瓜篓', '栝蒌'],
  ['桅子', '栀子'],
])

const HERB_NAME_FIXES = new Map([
  ['猪肥汁', '猪胆汁'],
  ['盐等分', '盐'],
])

function cleanHerbName(name) {
  let out = name.trim().replace(/(?:大者|小者|等分|熬)$/g, '')
  out = HERB_NAME_FIXES.get(out) ?? out
  for (const [from, to] of HERB_ALIASES) out = out.split(from).join(to)
  return out.trim()
}

function normalizeName(title) {
  let name = title.replace(/^[一二三四五六七八九十百]+[、.．]\s*/, '').trim()
  if (name.endsWith('处方')) return name
  name = name.replace(/\s*方$/, '').replace(/\s+/g, ' ')
  const parts = name.split(' ')
  if (parts.length > 1) name = parts[0].replace(/\s*方$/, '')
  if (name === '难产') return ''
  return NAME_ALIASES.get(name) ?? name
}

function parseHerbPart(part) {
  const trimmed = part.trim()
  if (!trimmed) return null
  const match = trimmed.match(/^([\u4e00-\u9fa5·（）()]+?)((?:[一二三四五六七八九十百千万半0-9]+(?:两|钱|分|铢|斤|升|合|枚|个|茎|片|把|条|只|张|克|寸|劈|具|握|撮|尺|斗|斛|束|颗|粒|支|滴|匕).*)?)$/)
  const doseMatch = trimmed.match(DOSE_RE)
  let name = trimmed
  let dose = ''
  if (doseMatch && doseMatch.index) {
    name = trimmed.slice(0, doseMatch.index).trim()
    dose = trimmed.slice(doseMatch.index).trim()
  } else if (match) {
    name = match[1]
    dose = (match[2] ?? '').trim()
  }
  name = cleanHerbName(name.replace(/[，,。；;：:].*$/, '').trim())
  return name ? { name, dose } : null
}

function expandHerbParts(part) {
  if (!part.includes('、')) return [parseHerbPart(part)].filter(Boolean)
  const chunks = part
    .split('、')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
  if (chunks.length < 2) return [parseHerbPart(part)].filter(Boolean)

  const last = chunks[chunks.length - 1]
  const each = last.match(/^(.+?)各(.+)$/)
  if (each) {
    const dose = each[2].trim()
    const names = [...chunks.slice(0, -1), each[1].trim()]
    return names
      .map((name) => {
        const cleaned = cleanHerbName(name.replace(/[，,。；;：:].*$/, '').trim())
        return cleaned ? { name: cleaned, dose } : null
      })
      .filter(Boolean)
  }
  return chunks.map(parseHerbPart).filter(Boolean)
}

function compositionOf(lines) {
  for (const line of lines) {
    if (/[。；]/.test(line)) continue
    let parts = []
    if (line.includes('|')) {
      parts = line.split('|')
    } else if (
      !PREP_RE.test(line) &&
      line.includes('、') &&
      /(两|钱|分|铢|斤|升|合|枚|个|片|克|各)/.test(line)
    ) {
      parts = [line]
    } else {
      continue
    }
    const parsed = parts.flatMap((part) => expandHerbParts(part.trim()))
    if (parsed.length >= 2) return { raw: line, herbs: parsed }
  }
  return null
}

function splitBlocks(text, chapter) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/)
  const blocks = []
  let current = null
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (line.startsWith('#### ')) {
      if (current) blocks.push(current)
      current = { title: line.slice(5).trim(), lines: [] }
      continue
    }
    if (current && line) current.lines.push(cleanLine(line))
  }
  if (current) blocks.push(current)
  return blocks.map((block) => ({ ...block, chapter }))
}

function effectText(explanation, name) {
  const sentences = explanation
    .split(/(?<=[。！？；\n])/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 8 && !sentence.startsWith('小编'))
  const useful = sentences.filter((sentence) =>
    /治|主|功能|作用|用在|用来|可以|能够|专门|适用/.test(sentence),
  )
  const picked = (useful.length ? useful : sentences).slice(0, 2).join('')
  return picked.length > 300 ? `${picked.slice(0, 300)}…` : picked
}

function actionFor(herbName, explanation, citationId, locator) {
  if (herbName.length < 2) return undefined
  const sentences = explanation
    .split(/(?<=[。！？；\n])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
  const hit = sentences.find(
    (sentence) => sentence.includes(herbName) && sentence.length <= 220,
  )
  if (!hit) return undefined
  return {
    text: hit,
    citationIds: [citationId],
    kind: 'analysis',
    locator,
  }
}

function modificationList(explanation, citationId, locator) {
  const sentences = explanation
    .split(/(?<=[。！？；\n])/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 8 && sentence.length <= 160)
  const out = []
  for (const sentence of sentences) {
    if (!/(加|减|去)/.test(sentence)) continue
    if (/小编/.test(sentence)) continue
    if (!/(汤|散|丸|药|味|桂枝|白芍|麻黄|附子|大黄|石膏|生姜|大枣|甘草|半夏|茯苓|人参|当归|川芎|黄芩|黄连)/.test(sentence)) {
      continue
    }
    const cut = sentence.search(/[，,：:]/)
    const condition = cut > 0 ? sentence.slice(0, cut).trim() : '随证调整'
    const change = cut > 0 ? sentence.slice(cut + 1).trim() : sentence
    if (!change || change === condition) continue
    out.push({ condition, change, citationIds: [citationId], kind: 'analysis' })
    if (out.length >= 6) break
  }
  return out
}

const files = fs
  .readdirSync(sourceDir)
  .filter((name) => name.endsWith('.md'))
  .filter((name) => !name.startsWith('1.'))
  .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10))

const sources = []
const formulas = []
const seenNames = new Set(existingNames)

for (const file of files) {
  const text = fs.readFileSync(path.join(sourceDir, file), 'utf8')
  const chapterMatch = text.match(/^##\s+(.+)$/m)
  const chapter = chapterMatch ? chapterMatch[1].trim() : file.replace(/\.md$/, '')
  const blocks = splitBlocks(text, chapter)

  let lastClause = null
  for (const block of blocks) {
    const title = block.title
    const body = block.lines
    const composition = compositionOf(body)

    if (!isFormulaTitle(title) || !composition) {
      if (
        !/方$/.test(title) &&
        title.length <= 180 &&
        !title.includes('|') &&
        !/^[0-9〇零一二三四五六七八九十百]+[、.:：]/.test(title)
      ) {
        lastClause = { title, chapter }
      }
      continue
    }

    const name = normalizeName(title)
    if (!name || seenNames.has(name)) continue

    const sourceId = `src-jingui-${hash(`${chapter}-${name}`)}`
    const locator = `${chapter}·${name}`
    const prepLines = body.filter((line) => PREP_RE.test(line) && !line.includes('|'))
    const explanation = body
      .filter((line) => line !== composition.raw && !prepLines.includes(line))
      .filter((line) => !/^小编[:：]/.test(line))
      .join('\n')

    const compositionText = composition.raw
    const decoctionText = prepLines.join('\n')
    const clauseText =
      lastClause && lastClause.title.includes(name.replace(/方$/, ''))
        ? lastClause.title
        : ''

    const quoteParts = [clauseText, compositionText, decoctionText, explanation].filter(Boolean)
    const quote = quoteParts.join('\n\n')
    const citation = (kind, text, textLocator = locator) => ({
      text,
      citationIds: [sourceId],
      kind,
      locator: textLocator,
    })

    const symptoms = clauseText
      ? [citation('quote', clauseText, `${chapter}·相关条文`)]
      : []
    const effectsText = effectText(explanation, name)

    const compositionItems = composition.herbs.map((herb) => {
      const herbId =
        herbIdByName.get(herb.name) ?? `jingui-herb-${hash(herb.name)}`
      if (!herbIdByName.has(herb.name)) herbIdByName.set(herb.name, herbId)
      return {
        herbId,
        herbName: herb.name,
        dosage: herb.dose,
        role: '未标注',
        roleCitationIds: [sourceId],
        action: actionFor(herb.name, explanation, sourceId, locator),
      }
    })

    const formula = {
      id: `jingui-${hash(`${chapter}-${name}`)}`,
      name,
      pinyin: '',
      sourceCitationId: sourceId,
      originalText: citation(
        'quote',
        [compositionText, decoctionText].filter(Boolean).join('\n'),
      ),
      effects: citation(
        'analysis',
        effectsText || '讲义未单列功效概括，详见下方方证与讲解。',
      ),
      symptoms,
      ...(symptoms.length
        ? {}
        : { symptomNote: '讲义未单列本方证条文，详见下方讲解。' }),
      preparation: {
        ingredients: citation('quote', compositionText),
        decoction: decoctionText
          ? citation('quote', decoctionText)
          : citation('analysis', '讲义未单列煎煮法。'),
        modernNote: '煎服法依讲义原文录入，未作剂量换算。',
      },
      composition: compositionItems,
      modifications: explanation
        ? modificationList(explanation, sourceId, locator)
        : [],
      modificationsNote: explanation
        ? '加减文字取自方后讲义讲解，属后世临证调整，不是《金匮要略》原文。'
        : undefined,
      corePairs: [],
      commentaries: [],
      additionalIndications: [],
      commentaryNote:
        '方后讲解为倪海厦《人纪·金匮要略》讲义原文；未补历代注家方解。',
      dosageNote: '剂量依讲义原文；汉代度量衡换算见相关原书说明。',
      modernGramNote: '本站未折算金匮方今用剂量，请以原书及执业中医师辨证为准。',
      verification: 'reference',
      modernExplanation: explanation
        ? citation('analysis', explanation)
        : undefined,
    }

    formulas.push(formula)
    sources.push({
      id: sourceId,
      type: 'classic',
      work: '金匮要略',
      parentWork: '伤寒杂病论',
      parentNote: '倪海厦《人纪·金匮要略》讲义，按原篇章整理。',
      author: '张仲景',
      edition: '倪海厦《人纪·金匮要略》讲义',
      locator,
      quote,
      note: '据倪海厦《人纪·金匮要略》讲义整理；方药剂量与煎服法依讲义原文。',
    })
    seenNames.add(name)
  }
}

fs.writeFileSync(outFile, JSON.stringify({ generatedAt: new Date().toISOString(), sources, formulas }, null, 2) + '\n')
console.log(`Wrote ${path.relative(process.cwd(), outFile)}: ${formulas.length} formulas, ${sources.length} sources`)
console.log(formulas.map((formula) => formula.name).join('、'))
