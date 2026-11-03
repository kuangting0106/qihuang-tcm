import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { herbs } from './content/herbs.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dir = path.join(root, 'scripts', 'content', 'classics', 'shanghan-nihaixia')
const outFile = path.join(root, 'scripts', 'content', 'shanghan-formulas.json')

const BODY_FILES = [
  '3.辨太阳病脉证并治法上篇.md',
  '4.辨太阳病脉证并治法中篇.md',
  '5.辨太阳病脉证并治法下篇.md',
  '6.辨阳明病脉证并治法.md',
  '7.辨少阳病脉证并治法.md',
  '8.辨太阴病脉证并治法.md',
  '9.辨少阴病脉证并治法.md',
  '10.辨厥阴病脉证并治法.md',
]

const CLAUSE_RE = /^[0-9一二三四五六七八九十百千]+[、.:：]/
const DOSE_RE = /^([^\d一二三四五六七八九十百千万半]+?)((?:[一二三四五六七八九十百千万半0-9]+)(?:两|钱|分|铢|斤|升|合|枚|个|茎|片|把|条|只|张|克|寸).*)$/
const PREP_RE = /右.*味|以水|水[一二三四五六七八九十百]+升|煮取|煎取|微火煎|去滓|温服|分温|为散|为末|杵|纳谷道|灌谷道|和醋|丸如|如梧子|顿服|日三服|以上.*味/
const ATTACHED = new Set(['四物汤', '戒烟涤痰方', '健胃整脾汤方', '脏结汤方'])
const ALIASES = {
  白芍药: '白芍',
  白朮: '白术',
  黄苓: '黄芩',
  桂技: '桂枝',
  桅子: '栀子',
  葶历: '葶苈',
  香鼓: '香豉',
}

const herbIdByName = new Map(herbs.map((herb) => [herb.name, herb.id]))

function hash(value) {
  let h = 0
  for (let i = 0; i < value.length; i += 1) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0
  }
  return h.toString(36)
}

function claim(text, citationIds, kind = 'paraphrase', locator) {
  const result = { text: text.trim(), citationIds, kind }
  if (locator) result.locator = locator
  return result
}

function stripProcessing(name) {
  return name
    .replace(/[（(].*?[）)]/g, '')
    .replace(/(?:去皮|去节|去翅|去心|去黄|去芦|去核|汤洗|酒洗|酒浸|绵裹|打碎|破八片|生用|研如脂|碎|切|擘|炙|炮|洗|熬|炒|焙)+$/g, '')
    .replace(/[，,、·\s]+$/g, '')
    .trim()
}

function parseToken(token) {
  const cleaned = token
    .replace(/^[·、,，;；]+|[·、,，;；]+$/g, '')
    .replace(/各$/, '')
    .trim()
  if (!cleaned) return null
  const match = cleaned.match(DOSE_RE)
  const rawName = (match ? match[1] : cleaned).trim().replace(/各$/, '')
  const name = stripProcessing(rawName).replace(/各$/, '')
  const dosage = match ? match[2].trim() : '见原文'
  return { name: name || rawName, dosage }
}

function herbFor(name) {
  const canonical = ALIASES[name] ?? name
  const id = herbIdByName.get(canonical)
  if (id) return { herbId: id }
  return { herbId: `shanghan-herb-${hash(canonical)}`, herbName: canonical }
}

function parseIngredients(line, formulaName) {
  if (!line || line === '方缺') {
    return [
      {
        ...herbFor('土瓜根'),
        dosage: '原方缺',
        role: '未标注',
        roleCitationIds: ['src-fangjixue'],
        note: '讲义于此方仅注“方缺”，未载药味与剂量。',
      },
    ]
  }

  if (formulaName === '蜜煎导法') {
    return [
      {
        ...herbFor('蜜'),
        dosage: '七合',
        role: '未标注',
        roleCitationIds: ['src-fangjixue'],
        note: '原文并载煎熬、捻挺与纳谷道法，详见煎服法。',
      },
    ]
  }

  if (formulaName === '大猪胆汁') {
    return [
      {
        ...herbFor('大猪胆汁'),
        dosage: '一枚',
        role: '未标注',
        roleCitationIds: ['src-fangjixue'],
        note: '原文并载和醋灌谷道法，详见煎服法。',
      },
    ]
  }

  if (formulaName === '桂枝加桂汤') {
    return [
      {
        ...herbFor('桂枝'),
        dosage: '二两（于桂枝汤中加桂枝）',
        role: '未标注',
        roleCitationIds: ['src-fangjixue'],
        note: '原文仅载“即桂枝汤加桂枝二两”，未列全方；余药见桂枝汤。',
      },
    ]
  }

  const groups = line.split('|').map((group) => group.trim()).filter(Boolean)
  const groupsToParse = groups.length ? groups : [line]
  const items = []

  for (const group of groupsToParse) {
    const tokens = (group.includes('、') ? group.split('、') : group.split(/\s+/))
      .map((token) => token.trim())
      .filter(Boolean)

    const merged = []
    for (const token of tokens) {
      if (/^(?:以上)?各/.test(token) && merged.length) {
        merged[merged.length - 1].marker = token
      } else {
        merged.push({ token })
      }
    }

    let sharedDose = ''
    for (const entry of merged) {
      const parsed = parseToken(entry.marker ?? entry.token)
      if (entry.marker || /各/.test(entry.token)) {
        if (parsed && parsed.dosage !== '见原文') sharedDose = parsed.dosage
      }
    }

    for (const entry of merged) {
      const parsed = parseToken(entry.token)
      if (!parsed) continue
      if (sharedDose && parsed.dosage === '见原文') parsed.dosage = sharedDose
      items.push({
        ...herbFor(parsed.name),
        dosage: parsed.dosage,
        role: '未标注',
        roleCitationIds: ['src-fangjixue'],
      })
    }

    if (sharedDose) {
      for (const item of items) {
        if (item.dosage === '见原文') item.dosage = sharedDose
      }
    }
  }

  return items.length
    ? items
    : [
        {
          ...herbFor('未详'),
          dosage: '见原文',
          role: '未标注',
          roleCitationIds: ['src-fangjixue'],
          note: '讲义未列出可辨认的药味。',
        },
      ]
}

function isFormulaTitle(title) {
  if (!title || CLAUSE_RE.test(title)) return false
  if (/[：:]$/.test(title)) return false
  if (title.endsWith('加减法')) return false
  if (title === '蜜煎导法') return true
  if (/[汤散丸饮]$/.test(title)) return true
  return /方(?:\s*[（(].*[）)])?$/.test(title)
}

function cleanFormulaName(title) {
  return title
    .replace(/方\s*[（(].*?[）)]\s*$/, '')
    .replace(/\s+.*$/, '')
    .replace(/方$/, '')
    .replace(/[，,]/g, '')
    .trim()
}

function looksLikeIngredients(line, formulaName) {
  if (!line) return false
  if (line === '方缺') return true
  if (formulaName === '蜜煎导法') return true
  if (formulaName === '大猪胆汁') return true
  if (line.startsWith('>')) return false
  if (line.includes('|')) return true
  if (line.includes('。')) return false
  if (/^右/.test(line)) return false
  if (PREP_RE.test(line)) return false
  const doses = line.match(/[一二三四五六七八九十百千万半0-9]+\s*(?:两|钱|分|铢|斤|升|合|枚|个|茎|片|把|条|只|张|克)/g)
  return Boolean(doses && doses.length && line.length < 220)
}

function firstEffect(commentary) {
  const text = commentary
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('小编：') && !/^以上(?:为|是)?汉制/.test(line))
    .join('')
  if (!text) return '讲义未附方解，详见原文。'
  const sentence = text.match(/^[^。！？]+[。！？]?/)?.[0] ?? text
  return sentence.length > 88 ? `${sentence.slice(0, 86)}…` : sentence
}

function extractFromFile(file) {
  const text = fs.readFileSync(path.join(dir, file), 'utf8')
  const lines = text.split(/\r?\n/)
  const chapterTitle = (lines.find((line) => /^##\s+/.test(line)) ?? '').replace(/^##\s+/, '').trim()
  const formulas = []
  let lastClause = ''

  let index = 0
  while (index < lines.length) {
    const heading = lines[index]
    if (!/^####\s+/.test(heading)) {
      index += 1
      continue
    }

    const title = heading.replace(/^####\s+/, '').trim()
    let end = index + 1
    while (end < lines.length && !/^####\s+/.test(lines[end])) end += 1
    const block = lines.slice(index + 1, end)

    if (!isFormulaTitle(title)) {
      if (CLAUSE_RE.test(title)) lastClause = title
      index = end
      continue
    }

    const name = cleanFormulaName(title)
    const ingredientIndex = block.findIndex((line) => looksLikeIngredients(line.trim(), name))
    if (ingredientIndex === -1) {
      index = end
      continue
    }

    const ingredientLine = block[ingredientIndex].trim()
    const decoctionLines = []
    let decoctionStart = -1
    for (let i = ingredientIndex + 1; i < block.length; i += 1) {
      const line = block[i].trim()
      if (line && !line.startsWith('>') && PREP_RE.test(line)) {
        decoctionStart = i
        break
      }
    }
    let cursor = decoctionStart
    if (decoctionStart >= 0) {
      while (cursor < block.length) {
        const line = block[cursor].trim()
        if (!line) {
          cursor += 1
          continue
        }
        if (line.startsWith('>') || !PREP_RE.test(line)) break
        decoctionLines.push(line)
        cursor += 1
      }
    }

    const commentaryLines = []
    for (let i = 0; i < block.length; i += 1) {
      if (i === ingredientIndex) continue
      const line = block[i].trim()
      if (!line) continue
      if (line.startsWith('>')) {
        commentaryLines.push(line.replace(/^>\s*/, ''))
        continue
      }
      if (!decoctionLines.includes(line)) commentaryLines.push(line)
    }

    const commentary = commentaryLines.join('\n\n').trim()
    const originalText = [ingredientLine, ...decoctionLines].join('\n').trim()
    const id = `shanghan-nihaixia-${hash(name)}`
    const sourceId = `src-shanghan-nihaixia-${hash(name)}`
    const locator = `${chapterTitle}·${name}`
    const attached = ATTACHED.has(name)

    const composition = parseIngredients(ingredientLine, name)
    const preparation = {
      ingredients: claim(ingredientLine, [sourceId], 'quote', locator),
      decoction: claim(
        decoctionLines.length ? decoctionLines.join('\n') : '原方未另列煎服法。',
        [sourceId],
        decoctionLines.length ? 'quote' : 'analysis',
        locator,
      ),
      modernNote: '煎服法依讲义原文录入，未作剂量换算。',
    }

    formulas.push({
      source: {
        id: sourceId,
        type: 'classic',
        work: '伤寒论',
        parentWork: '伤寒杂病论',
        parentNote: '倪海厦《人纪·伤寒论》讲义，按六经篇次整理。',
        author: '张仲景',
        edition: '倪海厦《人纪·伤寒论》讲义',
        locator,
        quote: [lastClause, originalText, commentary].filter(Boolean).join('\n\n'),
        note: attached
          ? '据倪海厦《人纪·伤寒论》讲义整理；此方为讲义附方，非《伤寒论》原文方。'
          : '据倪海厦《人纪·伤寒论》讲义整理；方药剂量与煎服法依讲义原文，未逐字校勘。',
      },
      formula: {
        id,
        name,
        pinyin: '',
        sourceCitationId: sourceId,
        originalText: claim(originalText, [sourceId], 'quote', locator),
        effects: claim(firstEffect(commentary), [sourceId], 'analysis', '方后讲解'),
        symptoms:
          lastClause && lastClause.includes(name)
            ? [claim(lastClause, [sourceId], 'quote', '前条')]
            : [],
        preparation,
        composition,
        dosageNote: '剂量依讲义原文；汉代度量衡换算见《伤寒论》附录。',
        modifications: [],
        corePairs: [],
        commentaries: [],
        additionalIndications: [],
        commentaryNote: commentary
          ? '方后讲解为倪海厦讲义原文（小编按语未收录）；未补历代注家方解。'
          : '讲义未附方解。',
        modernExplanation: commentary
          ? claim(
              commentary
                .split(/\n+/)
                .filter((line) => line && !line.startsWith('小编：'))
                .join('\n'),
              [sourceId],
              'analysis',
              '方后讲解',
            )
          : undefined,
        verification: 'reference',
      },
    })

    index = end
  }

  return formulas
}

const merged = new Map()
for (const file of BODY_FILES) {
  for (const entry of extractFromFile(file)) {
    const key = entry.formula.name.replace(/[（(].*?[）)]/g, '').replace(/[，,。\s]/g, '')
    if (!merged.has(key)) merged.set(key, entry)
  }
}

const sources = []
const formulas = []
for (const entry of merged.values()) {
  sources.push(entry.source)
  formulas.push(entry.formula)
}

fs.writeFileSync(outFile, JSON.stringify({ sources, formulas }, null, 2), 'utf8')
console.log(`Wrote ${formulas.length} formulas and ${sources.length} sources to ${outFile}`)
console.log(formulas.map((formula) => formula.name).join('、'))
