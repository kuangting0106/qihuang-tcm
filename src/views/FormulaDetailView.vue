<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import CitationBadge from '@/components/CitationBadge.vue'
import FormulaGraph from '@/components/FormulaGraph.vue'
import HerbDoseEditor from '@/components/HerbDoseEditor.vue'
import AnnotatedOriginalText from '@/components/AnnotatedOriginalText.vue'
import SourcedText from '@/components/SourcedText.vue'
import { useTcmData } from '@/composables/useTcmData'
import { useFormulaApi } from '@/composables/useFormulaApi'
import type { FormulaSummary } from '@/composables/useFormulaApi'
import { usePublicNotes } from '@/composables/usePublicNotes'
import {
  glossaryAnnotationsFor,
  glossaryTagsFor,
  primarySymptomText,
} from '@/data/symptom-glossary'
import { ROLE_ORDER } from '@/types/tcm'
import type { Formula, FormulaRole } from '@/types/tcm'

const route = useRoute()
const router = useRouter()
const { herbsById, citationsById, herbName } = useTcmData()
const {
  loading: detailLoading,
  error: detailError,
  fetchFormulaDetail,
  fetchFormulaList,
} = useFormulaApi()
const {
  loadPublicNotes,
  publicAnnotationsFor,
  publicHerbNotes,
  publicHerbRoles,
  savePublicNote,
  publicModernNotes,
} = usePublicNotes()

const formulaList = ref<FormulaSummary[]>([])

async function loadFormulaList() {
  try {
    formulaList.value = await fetchFormulaList()
  } catch {
    formulaList.value = []
  }
}

onMounted(() => {
  void loadPublicNotes()
  void loadFormulaList()
})

const formula = ref<Formula | null>(null)
let requestSeq = 0

async function loadFormula(id: string) {
  const seq = ++requestSeq
  formula.value = null
  try {
    const detail = await fetchFormulaDetail(id)
    if (seq === requestSeq) formula.value = detail
  } catch {
    if (seq === requestSeq) formula.value = null
  }
}

function retry() {
  const id = String(route.params.id ?? '')
  if (id) void loadFormula(id)
}

const sourceCitation = computed(() =>
  formula.value ? citationsById.value.get(formula.value.sourceCitationId) ?? null : null,
)
const isMijingzi = computed(() => (sourceCitation.value?.work ?? '').includes('米晶子'))
const preparation = computed(() => formula.value?.preparation ?? null)
const ingredientText = computed(() => preparation.value?.ingredients?.text?.trim() ?? '')
const decoctionText = computed(() => preparation.value?.decoction?.text?.trim() ?? '')
const administrationText = computed(() => preparation.value?.administration?.text?.trim() ?? '')
const preparationCitationIds = computed(() => {
  const ids = preparation.value?.ingredients?.citationIds ?? []
  return ids.length ? ids : (formula.value?.originalText?.citationIds ?? [])
})
const hasComposition = computed(() => (formula.value?.composition?.length ?? 0) > 0)
const graphNote = computed(() =>
  isMijingzi.value
    ? '图谱仅展示组成关系，原书未标君臣佐使/药对；不补写后世方解，也不把同方药材两两强行连线。'
    : '实线为“方剂 → 药材”的组成关系；虚线为教材明确归纳的核心药对，没有依据时不连线。',
)
const modificationsNote = computed(() => {
  const note = formula.value?.modificationsNote?.trim()
  if (note) return note
  return isMijingzi.value ? '原书未列加减。' : '原文未列加减。'
})
const sourceFullLabel = computed(() => {
  const c = sourceCitation.value
  if (!c) return ''
  return `${c.parentWork ? `张仲景《${c.parentWork}》· ` : ''}${c.work} · ${c.locator}`
})
const selectedHerbId = ref<string | null>(null)
const showPairs = ref(true)
const showGraph = ref(true)
const prepDoseMode = ref<'ancient' | 'modern'>('ancient')
const annotationMode = ref(false)

watch(
  () => route.params.id,
  (id) => {
    selectedHerbId.value = null
    showPairs.value = true
    prepDoseMode.value = 'ancient'
    annotationMode.value = false
    if (id) void loadFormula(String(id))
  },
  { immediate: true },
)

watch(
  formula,
  (f) => {
    const count = f?.composition?.length ?? 0
    showGraph.value = count > 0 && count <= 20
  },
  { immediate: true },
)

const currentFormulaId = computed(() => String(route.params.id ?? ''))
const currentFormulaIndex = computed(() =>
  formulaList.value.findIndex((item) => item.id === currentFormulaId.value),
)
const previousFormula = computed(() =>
  currentFormulaIndex.value > 0 ? formulaList.value[currentFormulaIndex.value - 1] : null,
)
const nextFormula = computed(() => {
  const index = currentFormulaIndex.value
  return index >= 0 && index < formulaList.value.length - 1
    ? formulaList.value[index + 1]
    : null
})

function goBack() {
  if (window.history.state?.back) router.back()
  else void router.push('/formulas')
}

const size = computed(() => formula.value?.composition.length ?? 0)
const isLarge = computed(() => size.value > 20)
const hasModernDoses = computed(() =>
  Object.keys(formula.value?.modernGramDoses ?? {}).length > 0,
)

const HERB_NOTE_STORAGE_KEY = 'qihuang.formula.herbRoleNotes'
const HERB_ROLE_STORAGE_KEY = 'qihuang.formula.herbRoleOverrides'

function readHerbNotes(): Record<string, Record<string, string>> {
  try {
    const raw = localStorage.getItem(HERB_NOTE_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object') return {}
    const out: Record<string, Record<string, string>> = {}
    for (const [formulaId, value] of Object.entries(parsed)) {
      if (!value || typeof value !== 'object') continue
      const notes: Record<string, string> = {}
      for (const [herbId, note] of Object.entries(value as Record<string, unknown>)) {
        if (typeof note === 'string' && note.trim()) notes[herbId] = note.trim()
      }
      if (Object.keys(notes).length) out[formulaId] = notes
    }
    return out
  } catch {
    return {}
  }
}

function readHerbRoles(): Record<string, Record<string, FormulaRole>> {
  try {
    const raw = localStorage.getItem(HERB_ROLE_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object') return {}
    const out: Record<string, Record<string, FormulaRole>> = {}
    for (const [formulaId, value] of Object.entries(parsed)) {
      if (!value || typeof value !== 'object') continue
      const roles: Record<string, FormulaRole> = {}
      for (const [herbId, role] of Object.entries(value as Record<string, unknown>)) {
        if (typeof role === 'string' && ROLE_ORDER.includes(role as FormulaRole)) {
          roles[herbId] = role as FormulaRole
        }
      }
      if (Object.keys(roles).length) out[formulaId] = roles
    }
    return out
  } catch {
    return {}
  }
}

const herbNotes = ref<Record<string, Record<string, string>>>(readHerbNotes())
const herbRoles = ref<Record<string, Record<string, FormulaRole>>>(readHerbRoles())

const currentHerbNotes = computed(() => {
  const id = formula.value?.id
  if (!id) return {}
  return { ...publicHerbNotes(id), ...(herbNotes.value[id] ?? {}) }
})
const currentHerbRoles = computed(() => {
  const id = formula.value?.id
  if (!id) return {}
  return { ...publicHerbRoles(id), ...(herbRoles.value[id] ?? {}) }
})

function persistHerbNotes(next: Record<string, Record<string, string>>) {
  herbNotes.value = next
  try {
    localStorage.setItem(HERB_NOTE_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // 浏览器禁用 localStorage 时，只保留本次会话内的内容。
  }
}

function persistHerbRoles(next: Record<string, Record<string, FormulaRole>>) {
  herbRoles.value = next
  try {
    localStorage.setItem(HERB_ROLE_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // 浏览器禁用 localStorage 时，只保留本次会话内的内容。
  }
}

function baseRoleFor(herbId: string): FormulaRole {
  return formula.value?.composition.find((item) => item.herbId === herbId)?.role ?? '未标注'
}

const saveHint = ref('')

function clearLocalHerbNote(formulaId: string, herbId: string) {
  const book = { ...(herbNotes.value[formulaId] ?? {}) }
  delete book[herbId]
  const next = { ...herbNotes.value }
  if (Object.keys(book).length) next[formulaId] = book
  else delete next[formulaId]
  persistHerbNotes(next)
}

function clearLocalHerbRole(formulaId: string, herbId: string) {
  const book = { ...(herbRoles.value[formulaId] ?? {}) }
  delete book[herbId]
  const next = { ...herbRoles.value }
  if (Object.keys(book).length) next[formulaId] = book
  else delete next[formulaId]
  persistHerbRoles(next)
}

function setHerbNote(herbId: string, text: string) {
  const current = formula.value
  if (!current) return
  const note = text.trim()
  void (async () => {
    const result = await savePublicNote({
      op: 'herb-note',
      formulaId: current.id,
      herbId,
      note,
    })
    if (result.ok) {
      clearLocalHerbNote(current.id, herbId)
      saveHint.value = '已发布到网页，所有访客可见。'
      return
    }
    const book = { ...(herbNotes.value[current.id] ?? {}) }
    if (note) book[herbId] = note
    else delete book[herbId]
    const next = { ...herbNotes.value }
    if (Object.keys(book).length) next[current.id] = book
    else delete next[current.id]
    persistHerbNotes(next)
    saveHint.value = '公开保存未成功，已保存到本机浏览器。'
  })()
}

function setHerbRole(herbId: string, role: FormulaRole) {
  const current = formula.value
  if (!current) return
  const isBase = role === baseRoleFor(herbId)
  void (async () => {
    const result = await savePublicNote({
      op: 'herb-role',
      formulaId: current.id,
      herbId,
      role: isBase ? '未标注' : role,
    })
    if (result.ok) {
      clearLocalHerbRole(current.id, herbId)
      saveHint.value = '已发布到网页，所有访客可见。'
      return
    }
    const book = { ...(herbRoles.value[current.id] ?? {}) }
    if (isBase) delete book[herbId]
    else book[herbId] = role
    const next = { ...herbRoles.value }
    if (Object.keys(book).length) next[current.id] = book
    else delete next[current.id]
    persistHerbRoles(next)
    saveHint.value = '公开保存未成功，已保存到本机浏览器。'
  })()
}

function resetHerb(herbId: string) {
  const current = formula.value
  if (!current) return
  void (async () => {
    const result = await savePublicNote({
      op: 'herb-reset',
      formulaId: current.id,
      herbId,
    })
    clearLocalHerbRole(current.id, herbId)
    clearLocalHerbNote(current.id, herbId)
    saveHint.value = result.ok
      ? '已清除网页与本机修改。'
      : '公开清除未成功，已清除本机修改。'
  })()
}

function selectHerb(id: string) {
  selectedHerbId.value = selectedHerbId.value === id ? null : id
}

function annotationsForSymptom(index: number) {
  const current = formula.value
  const symptom = current?.symptoms[index]
  if (!current || !symptom) return []
  const original = current.originalAnnotations ?? []
  const seen = new Set(original.map((item) => item.phrase))
  return [
    ...original,
    ...glossaryAnnotationsFor(symptom.text).filter((item) => !seen.has(item.phrase)),
  ]
}

function tagsForSymptom(index: number) {
  const current = formula.value
  if (!current) return []
  if (current.symptomTags?.length) return current.symptomTags
  const symptom = current.symptoms[index]
  if (!symptom) return []
  return glossaryTagsFor(primarySymptomText(symptom.text, current.name))
}

function publishedAnnotationsForSymptom(index: number) {
  const current = formula.value
  if (!current) return []
  return publicAnnotationsFor(`${current.id}:${index}`).map((item) => ({
    id: item.id,
    phrase: item.phrase,
    note: item.note,
    start: item.start,
  }))
}

function publishSymptomAnnotation(index: number) {
  return async (payload: { phrase: string; note: string; start: number }) => {
    const current = formula.value
    if (!current) return { ok: false, message: '方剂数据尚未加载。' }
    return savePublicNote({
      op: 'symptom-upsert',
      scopeKey: `${current.id}:${index}`,
      annotation: payload,
    })
  }
}

function unpublishSymptomAnnotation(index: number) {
  return async (payload: { phrase: string; start: number }) => {
    const current = formula.value
    if (!current) return { ok: false, message: '方剂数据尚未加载。' }
    return savePublicNote({
      op: 'symptom-delete',
      scopeKey: `${current.id}:${index}`,
      phrase: payload.phrase,
      start: payload.start,
    })
  }
}

const NOTE_STORAGE_KEY = 'qihuang.formula.modernNotes'

function readLocalNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(NOTE_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, string>) : {}
  } catch {
    return {}
  }
}

const localNotes = ref<Record<string, string>>(readLocalNotes())
const editingNote = ref(false)
const noteDraft = ref('')
const showNoteCode = ref(false)
const noteSaving = ref(false)
const noteMessage = ref('')

const localNote = computed(() =>
  formula.value ? localNotes.value[formula.value.id] ?? '' : '',
)
const effectiveNote = computed(() => {
  if (localNote.value.trim()) {
    return { text: localNote.value.trim(), local: true, citationIds: [] as string[] }
  }
  const published = formula.value ? publicModernNotes(formula.value.id).trim() : ''
  if (published) {
    return { text: published, local: false, citationIds: [] as string[] }
  }
  if (formula.value?.modernExplanation) {
    return {
      text: formula.value.modernExplanation.text,
      local: false,
      citationIds: formula.value.modernExplanation.citationIds,
    }
  }
  return null
})

const noteCode = computed(() => {
  const text = effectiveNote.value?.text
  if (!text) return ''
  return `modernExplanation: claim(\n  ${JSON.stringify(text)},\n  ['src-fangjixue'],\n  'analysis',\n),`
})

function startEditNote() {
  noteDraft.value = effectiveNote.value?.text ?? ''
  editingNote.value = true
  showNoteCode.value = false
}

async function saveNote() {
  const current = formula.value
  if (!current) return
  const text = noteDraft.value.trim()
  noteSaving.value = true
  noteMessage.value = ''
  const result = await savePublicNote({
    op: 'modern-note',
    formulaId: current.id,
    text,
  })
  const next = { ...localNotes.value }
  if (result.ok) {
    delete next[current.id]
    noteMessage.value = '已发布到网页，关闭页面后仍会保留。'
  } else if (text) {
    next[current.id] = text
    noteMessage.value = '公开保存未成功，已保存到本机浏览器。'
  } else {
    delete next[current.id]
    noteMessage.value = '公开保存未成功，已清除本机草稿。'
  }
  localNotes.value = next
  try {
    localStorage.setItem(NOTE_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // 浏览器禁用 localStorage 时，只保留本次会话内的内容。
  }
  noteSaving.value = false
  editingNote.value = false
}

function clearLocalNote() {
  const current = formula.value
  if (!current) return
  const next = { ...localNotes.value }
  delete next[current.id]
  localNotes.value = next
  try {
    localStorage.setItem(NOTE_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // 忽略存储失败。
  }
  editingNote.value = false
}

watch(
  () => route.params.id,
  () => {
    editingNote.value = false
    showNoteCode.value = false
    noteDraft.value = ''
  },
)

</script>

<template>
  <div v-if="detailLoading && !formula" class="page container">
    <div class="empty-state paper-panel">
      <h2>正在加载方剂…</h2>
      <p>按需读取方剂详情，不再下载整份数据。</p>
    </div>
  </div>

  <div v-else-if="detailError && !formula" class="page container">
    <div class="empty-state paper-panel">
      <h2>方剂没有打开</h2>
      <p>{{ detailError }}</p>
      <button class="btn btn--primary" type="button" @click="retry">重试</button>
      <RouterLink class="btn btn--ghost btn--small" to="/formulas">返回方剂列表</RouterLink>
    </div>
  </div>

  <div v-else-if="formula" class="page formula-detail-page">
    <div class="container">
      <nav class="breadcrumbs" aria-label="面包屑">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/formulas">方剂</RouterLink>
        <span>/</span>
        <span>{{ formula.name }}</span>
      </nav>

      <header class="detail-head">
        <div>
          <p class="eyebrow">FORMULA / 方剂</p>
          <div class="detail-title-row">
            <h1>{{ formula.name }}</h1>
            <span class="detail-pinyin">{{ formula.pinyin }}</span>
          </div>
        </div>
        <div class="detail-head__source">
          <span class="muted tiny">出处</span>
          <CitationBadge :citation-ids="[formula.sourceCitationId]" label="原文" />
        </div>
      </header>

      <section class="preparation-section">
        <div class="section-head">
          <div>
            <p class="eyebrow">ORIGINAL PREPARATION / 原书方药</p>
            <h2>药材及用量与煎煮服用</h2>
          </div>
          <p v-if="isMijingzi">
            据原书 OCR 拆分药味、用量与煎服法；未逐字校勘，剂量与炮制以原书影印本为准。
          </p>
          <p v-else>药味、用量、炮制与原文煎服法录自原条方后注；现代用法另标，仅作参考。</p>
        </div>

        <div class="preparation-grid">
          <article class="preparation-card preparation-card--ingredients">
            <div class="preparation-card__head">
              <span class="preparation-card__index">01</span>
              <div class="preparation-card__title">
                <h3>药材及用量</h3>
                <p>
                  {{ prepDoseMode === 'modern' ? '现代剂量参考，不等同实际处方' : '原文药味与用量' }}
                </p>
              </div>
              <button
                v-if="hasModernDoses"
                class="prep-dose-toggle"
                type="button"
                :aria-pressed="prepDoseMode === 'modern'"
                @click="prepDoseMode = prepDoseMode === 'modern' ? 'ancient' : 'modern'"
              >
                <span aria-hidden="true">⇄</span>
                {{ prepDoseMode === 'modern' ? '切换原文用量' : '切换现代用量' }}
              </button>
            </div>

            <ul v-if="hasComposition" class="preparation-herbs">
              <li v-for="item in formula.composition" :key="item.herbId" class="preparation-herb">
                <div class="preparation-herb__main">
                  <RouterLink
                    v-if="herbsById.has(item.herbId)"
                    class="preparation-herb__name"
                    :to="`/herbs/${item.herbId}`"
                  >
                    {{ item.herbName ?? herbName(item.herbId) }}
                  </RouterLink>
                  <span v-else class="preparation-herb__name">{{ item.herbName ?? herbName(item.herbId) }}</span>
                  <HerbDoseEditor
                    :formula-id="formula.id"
                    :item="item"
                    :modern="prepDoseMode === 'modern'"
                    :modern-text="formula.modernGramDoses?.[item.herbId]"
                  />
                </div>
                <p v-if="item.note" class="preparation-herb__note">{{ item.note }}</p>
              </li>
            </ul>
            <blockquote v-else-if="ingredientText" class="preparation-quote">
              {{ ingredientText }}
            </blockquote>
            <p v-else class="preparation-empty">原书未列药材及用量。</p>

            <p v-if="hasComposition" class="preparation-herb-hint">
              君臣佐使与单味作用见下方“关系与图谱”；点图谱中的药材，可修改角色或补充本地备注。药材行的“补用量 / 改用量”也可直接填写，保存后再次修改。备注与用量只保存在本机浏览器，不会发布。
            </p>
            <p v-if="formula.modernGramNote" class="preparation-dose-note">{{ formula.modernGramNote }}</p>
            <CitationBadge
              v-if="preparationCitationIds.length"
              :citation-ids="preparationCitationIds"
              label="原文"
              compact
            />
          </article>

          <article class="preparation-card preparation-card--decoction">
            <div class="preparation-card__head">
              <span class="preparation-card__index">02</span>
              <div>
                <h3>煎煮及服用</h3>
                <p>原文煎煮、炮制、服法与禁忌</p>
              </div>
            </div>

            <div class="preparation-sub">
              <h4>煎煮 / 炮制</h4>
              <blockquote v-if="decoctionText" class="preparation-quote preparation-quote--large">
                {{ decoctionText }}
              </blockquote>
              <p v-else class="preparation-empty">原书未列煎煮法。</p>
            </div>

            <div class="preparation-sub">
              <h4>服用 / 调护</h4>
              <blockquote v-if="administrationText" class="preparation-quote preparation-quote--large">
                {{ administrationText }}
              </blockquote>
              <p v-else class="preparation-empty">原书未列服法。</p>
            </div>

            <CitationBadge
              v-if="preparationCitationIds.length"
              :citation-ids="preparationCitationIds"
              label="原文"
              compact
            />
          </article>
        </div>

        <details class="preparation-original">
          <summary>查看原书条文</summary>
          <blockquote class="preparation-quote preparation-quote--large">
            {{ formula.originalText.text }}
          </blockquote>
          <CitationBadge :citation-ids="formula.originalText.citationIds" label="原文" compact />
        </details>

        <p class="preparation-note">
          <template v-if="isMijingzi">
            以上为据原书 OCR 拆分的药材与煎服法；未逐字校勘，方药、剂量与操作以原书影印本为准，不构成临床用药建议。
          </template>
          <template v-else>
            以上为原书煎煮、服法与调护原文；方药剂量与操作以原书影印本为准，不构成临床用药建议。
          </template>
        </p>
      </section>

      <section class="symptom-layout">
        <div class="effect-card">
          <span class="eyebrow">EFFECT / 功效</span>
          <SourcedText :claim="formula.effects" block />
          <dl class="effect-meta">
            <div><dt>药味</dt><dd>{{ formula.composition.length ? `${formula.composition.length} 味` : '原方见原文' }}</dd></div>
            <div><dt>出处</dt><dd>{{ sourceFullLabel }}</dd></div>
          </dl>

          <div class="effect-modern">
            <div class="effect-modern__head">
              <span class="eyebrow">MODERN NOTE / 现代解说</span>
              <div class="effect-modern__tools">
                <span v-if="effectiveNote?.local" class="effect-modern__status effect-modern__status--local">
                  本地草稿
                </span>
                <span v-else-if="effectiveNote" class="effect-modern__status effect-modern__status--published">
                  已发布
                </span>
                <span v-else class="effect-modern__status">待补充</span>
                <button v-if="!editingNote" class="note-btn" type="button" @click="startEditNote">
                  {{ effectiveNote ? '编辑' : '添加解说' }}
                </button>
              </div>
            </div>

            <template v-if="!editingNote">
              <template v-if="effectiveNote">
                <p>{{ effectiveNote.text }}</p>
                <div class="effect-modern__foot">
                  <CitationBadge
                    v-if="effectiveNote.citationIds.length"
                    :citation-ids="effectiveNote.citationIds"
                    label="后世方解"
                    tone="muted"
                    compact
                  />
                  <span v-if="effectiveNote.local" class="effect-modern__draft">本地草稿 · 仅本浏览器可见，未写入公开数据</span>
                  <span v-else class="effect-modern__draft">已发布 · 所有访客可见</span>
                  <button
                    v-if="effectiveNote.local"
                    class="note-link"
                    type="button"
                    @click="showNoteCode = !showNoteCode"
                  >
                    {{ showNoteCode ? '收起数据代码' : '查看数据代码' }}
                  </button>
                </div>
                <pre v-if="showNoteCode" class="effect-modern__code">{{ noteCode }}</pre>
              </template>
              <p v-else class="effect-modern__empty">
                还没有现代解说。点右上“添加解说”填写，保存后会发布到网页，所有访客可见。
              </p>
            </template>

            <form v-else class="note-editor" @submit.prevent="saveNote">
              <textarea
                v-model="noteDraft"
                rows="5"
                placeholder="在这里输入现代对本方证候的解说……"
              ></textarea>
              <div class="note-editor__actions">
                <button class="note-btn note-btn--primary" type="submit" :disabled="noteSaving">
                  {{ noteSaving ? '保存中…' : '保存并发布' }}
                </button>
                <button class="note-btn" type="button" @click="editingNote = false">取消</button>
                <button
                  v-if="effectiveNote?.local"
                  class="note-btn note-btn--danger"
                  type="button"
                  @click="clearLocalNote"
                >
                  清除本地草稿
                </button>
              </div>
              <p class="note-editor__hint">
                保存后写入网页，所有访客可见；公开保存失败时会自动保存到本机浏览器。
              </p>
              <p v-if="noteMessage" class="note-editor__message">{{ noteMessage }}</p>
            </form>
          </div>
        </div>

        <div class="symptom-panel">
          <div class="symptom-panel__head">
            <div>
              <span class="eyebrow">SYMPTOMS / 症状描述</span>
              <h2>原文怎么描述这个方证</h2>
            </div>
            <button
              v-if="formula.symptoms.length"
              class="note-btn"
              :class="{ 'note-btn--primary': annotationMode }"
              type="button"
              @click="annotationMode = !annotationMode"
            >
              {{ annotationMode ? '退出标注' : '划线标注' }}
            </button>
          </div>

          <p v-if="annotationMode" class="symptom-edit-hint">
            用鼠标或手指选中原文词句，松开后填写注解。保存后会发布到网页，所有访客可见；公开保存失败时自动存本机。
          </p>

          <blockquote v-for="(s, i) in formula.symptoms" :key="`${formula.id}-${i}`" class="symptom-quote">
            <AnnotatedOriginalText
              :text="s.text"
              :annotations="annotationsForSymptom(i)"
              :published-annotations="publishedAnnotationsForSymptom(i)"
              :tags="tagsForSymptom(i)"
              :editable="annotationMode"
              :scope-key="`${formula.id}:${i}`"
              :publish-annotation="publishSymptomAnnotation(i)"
              :unpublish-annotation="unpublishSymptomAnnotation(i)"
            />
          </blockquote>

          <p v-if="!formula.symptoms.length" class="symptom-empty">
            {{ formula.symptomNote ?? '原讲义未单列本方证条文，暂未引症状原文。' }}
          </p>

          <div v-if="formula.symptoms.length" class="symptom-panel__foot">
            <CitationBadge :citation-ids="formula.symptoms[0]?.citationIds ?? [formula.sourceCitationId]" label="原文" />
            <span v-if="isMijingzi">症状与方名据《米晶子济世良方》原文摘录；带下划线的词可悬停看注解，点“划线标注”可补充注解并发布到网页。</span>
            <span v-else>症状与方名均回引《伤寒论》相关条文；带下划线的词可悬停看注解，点“划线标注”可补充注解并发布到网页。</span>
          </div>
        </div>
      </section>

      <section v-if="formula.modernExplanation?.text" class="explanation-section paper-panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">LECTURE / 讲义讲解</p>
            <h2>病症解说与用药思路</h2>
          </div>
          <CitationBadge
            :citation-ids="formula.modernExplanation.citationIds"
            label="讲义原文"
            tone="muted"
            compact
          />
        </div>
        <SourcedText :claim="formula.modernExplanation" block />
        <p class="explanation-note">
          以上为讲义讲解整理，用来说明当时的辨证与用药思路，不是诊断标准，也不构成自行用药建议。
        </p>
      </section>

      <div v-if="isLarge" class="large-hint paper-panel">
        <div>
          <strong>大方超过 20 味，关系图默认收起。</strong>
          <p>组成与用量见上方“药材选取与炮制”；展开关系图可查看药材之间的连接。</p>
        </div>
        <button class="btn btn--ghost btn--small" type="button" @click="showGraph = !showGraph">
          {{ showGraph ? '收起关系图' : '查看关系图' }}
        </button>
      </div>

      <section v-if="size > 0" class="graph-commentary-section">
        <div class="graph-column">
          <div class="section-head">
            <div>
              <p class="eyebrow">NETWORK / 配伍</p>
              <h2>关系与图谱</h2>
            </div>
            <div class="graph-section__tools">
              <label v-if="(formula.corePairs?.length ?? 0) > 0" class="switch">
                <input v-model="showPairs" type="checkbox" />
                <span>显示方解药对</span>
              </label>
              <button v-if="showGraph" class="btn btn--ghost btn--small" type="button" @click="showGraph = false">
                收起图谱
              </button>
              <button v-else class="btn btn--ghost btn--small" type="button" @click="showGraph = true">
                展开图谱
              </button>
            </div>
          </div>
          <div v-if="showGraph" class="graph-section__body">
            <FormulaGraph
              :formula="formula"
              :selected-herb-id="selectedHerbId"
              :show-pairs="showPairs"
              :herb-notes="currentHerbNotes"
              :herb-roles="currentHerbRoles"
              :source-note="graphNote"
              :unlabeled-label="isMijingzi ? '原书未标' : '待补'"
              @select="selectHerb"
              @update-role="setHerbRole"
              @update-note="setHerbNote"
              @reset="resetHerb"
            />
            <p class="graph-caption">
              {{ graphNote }}
              <template v-if="isMijingzi">
                点药材可查看原文药名与用量；备注保存后会发布到网页，所有访客可见。
              </template>
              <template v-else>
                节点显示君臣佐使与作用摘要，悬停看完整说明；点药材可修改角色或补充方中作用。
                保存后发布到网页，所有访客可见；公开保存失败时自动存本机。
                君臣佐使据《方剂学》教材通例归纳，不是讲义原文。
              </template>
            </p>
            <p v-if="saveHint" class="graph-publish-hint">{{ saveHint }}</p>
          </div>
          <div v-else class="graph-collapsed paper-panel">
            <strong>关系图谱已收起</strong>
            <p>展开后查看药材之间的连接与核心药对；组成与用量见上方“药材选取与炮制”。</p>
            <button class="btn btn--ghost btn--small" type="button" @click="showGraph = true">查看关系图谱 →</button>
          </div>
        </div>
      </section>

      <section class="modification-section">
        <div class="section-head">
          <div>
            <p class="eyebrow">MODIFICATIONS / 加减</p>
            <h2>加减法</h2>
          </div>
          <p v-if="formula.modifications.length">{{ modificationsNote }}</p>
        </div>

        <div v-if="formula.modifications.length" class="modification-list">
          <article v-for="(m, index) in formula.modifications" :key="index" class="modification-card">
            <span class="modification-card__index">{{ String(index + 1).padStart(2, '0') }}</span>
            <div>
              <p class="modification-card__condition">{{ m.condition }}</p>
              <p class="modification-card__change">{{ m.change }}</p>
              <CitationBadge :citation-ids="m.citationIds" label="原文" compact />
            </div>
          </article>
        </div>
        <div v-else class="empty-inline paper-panel">
          {{ modificationsNote }}
        </div>
      </section>

      <section v-if="formula.corePairs?.length" class="pair-section">
        <div class="section-head">
          <div>
            <p class="eyebrow">CORE PAIRS / 核心药对</p>
            <h2>后世归纳的核心药对</h2>
          </div>
          <p>只列后世方书/教材明确归纳的核心药对，不是《伤寒论》原文，也不把同方所有药两两连线。</p>
        </div>
        <div class="pair-grid">
          <article v-for="pair in formula.corePairs" :key="`${pair.from}-${pair.to}`" class="pair-card">
            <div class="pair-card__names">
              <RouterLink :to="`/herbs/${pair.from}`">{{ herbsById.get(pair.from)?.name }}</RouterLink>
              <span>×</span>
              <RouterLink :to="`/herbs/${pair.to}`">{{ herbsById.get(pair.to)?.name }}</RouterLink>
            </div>
            <p class="pair-card__label">{{ pair.label }}</p>
            <p v-if="pair.note" class="pair-card__note">{{ pair.note }}</p>
            <CitationBadge :citation-ids="pair.citationIds" label="后世方解" tone="muted" compact />
          </article>
        </div>
      </section>

      <section class="coverage paper-panel">
        <div>
          <span class="eyebrow">SOURCE COVERAGE</span>
          <h3>原文与方解分开标注</h3>
        </div>
        <p v-if="isMijingzi">
          方剂原文与主治据《米晶子济世良方》扫描本 OCR 整理，未逐字校勘；原书未标君臣佐使，
          页面不补写方解。用药、剂量与炮制以原书为准，点击“出处”查看版本信息。
        </p>
        <p v-else>
          方剂原文、组成、加减均回引《伤寒论》原条；君臣佐使、药对与功效归纳标为“后世方解”，
          并注明《方剂学》《中药学》教材依据。点击任意“出处”查看完整引文。
        </p>
      </section>

      <nav class="formula-nav" aria-label="方剂翻页">
        <RouterLink
          v-if="previousFormula"
          class="formula-nav__link formula-nav__link--prev"
          :to="`/formulas/${previousFormula.id}`"
        >
          <span>← 上一个药方</span>
          <strong>{{ previousFormula.name }}</strong>
        </RouterLink>

        <button class="formula-nav__back" type="button" @click="goBack">← 返回上页</button>

        <RouterLink
          v-if="nextFormula"
          class="formula-nav__link formula-nav__link--next"
          :to="`/formulas/${nextFormula.id}`"
        >
          <span>下一个药方</span>
          <strong>{{ nextFormula.name }} →</strong>
        </RouterLink>
      </nav>

      <p class="formula-nav__all">
        <RouterLink to="/formulas">返回方剂分类</RouterLink>
      </p>
    </div>
  </div>

  <div v-else class="page container">
    <div class="empty-state paper-panel">
      <h2>没有这首方</h2>
      <p>可能是链接里的方剂 id 不正确。</p>
      <RouterLink class="btn btn--primary" to="/formulas">返回方剂列表</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.breadcrumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 20px 0 28px;
  color: var(--ink-faint);
  font-size: 0.78rem;
}

.breadcrumbs a:hover {
  color: var(--cinnabar);
}

.detail-head {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  align-items: flex-end;
  padding-bottom: 28px;
  border-bottom: 1px solid var(--line-strong);
}

.detail-title-row {
  display: flex;
  align-items: baseline;
  gap: 18px;
  flex-wrap: wrap;
}

.detail-title-row h1 {
  font-size: clamp(2.8rem, 6.5vw, 5rem);
  letter-spacing: 0.07em;
}

.detail-pinyin {
  color: var(--ink-faint);
  font-family: var(--serif);
  font-size: 1rem;
  letter-spacing: 0.08em;
}

.detail-head__source {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  max-width: 340px;
}

.preparation-section {
  padding-top: 26px;
}

.preparation-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 12px;
  align-items: start;
}

.preparation-card {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 15px 17px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(255, 252, 245, 0.55);
}

.preparation-card--ingredients {
  border-top: 3px solid var(--cinnabar);
}

.preparation-card--decoction {
  border-top: 3px solid var(--gold);
}

.preparation-card--administration {
  border-top: 3px solid var(--jade);
}

.preparation-sub {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.preparation-sub + .preparation-sub {
  padding-top: 8px;
  border-top: 1px dashed var(--line);
}

.preparation-sub h4 {
  color: var(--ink-soft);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
}

.preparation-empty {
  margin: 0;
  padding: 9px 11px;
  border: 1px dashed var(--line-strong);
  border-radius: 8px;
  background: rgba(235, 226, 210, 0.24);
  color: var(--ink-faint);
  font-size: 0.72rem;
  line-height: 1.7;
}

.preparation-original {
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px dashed var(--line);
  border-radius: 10px;
  background: rgba(255, 252, 245, 0.4);
}

.preparation-original summary {
  color: var(--ink-faint);
  cursor: pointer;
  font-size: 0.72rem;
}

.preparation-original[open] summary {
  margin-bottom: 8px;
}

.preparation-card__head {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.preparation-card__index {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 1.15rem;
  line-height: 1;
}

.preparation-card__head h3 {
  font-size: 0.98rem;
}

.preparation-card__head p {
  margin-top: 2px;
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.preparation-card__title {
  flex: 1;
  min-width: 0;
}

.prep-dose-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  padding: 3px 8px;
  border: 1px solid rgba(47, 111, 107, 0.3);
  border-radius: 999px;
  background: rgba(221, 236, 232, 0.45);
  color: var(--jade);
  cursor: pointer;
  font-size: 0.62rem;
  white-space: nowrap;
}

.prep-dose-toggle:hover {
  border-color: var(--jade);
  background: rgba(221, 236, 232, 0.8);
}

.preparation-dose-note {
  margin-top: 2px;
  color: var(--cinnabar);
  font-size: 0.66rem;
  line-height: 1.6;
}

.preparation-herbs {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.preparation-herb {
  padding: 6px 0;
  border-bottom: 1px dotted var(--line);
}

.preparation-herb__main {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: baseline;
}

.preparation-herb__name {
  color: var(--ink);
  font-family: var(--serif);
  font-size: 0.8rem;
}

.preparation-herbs a.preparation-herb__name {
  text-decoration: underline;
  text-decoration-color: rgba(163, 58, 43, 0.28);
  text-underline-offset: 3px;
}

.preparation-herbs a.preparation-herb__name:hover {
  color: var(--cinnabar);
}

.preparation-herb__dose {
  color: var(--ink-soft);
  font-size: 0.72rem;
  white-space: nowrap;
}
.preparation-herb__note {
  margin: 3px 0 0;
  color: var(--ink-faint);
  font-size: 0.64rem;
  line-height: 1.55;
}

.preparation-herb-hint {
  margin-top: 2px;
  color: var(--ink-faint);
  font-size: 0.64rem;
  line-height: 1.55;
}

.preparation-quote {
  margin: 0;
  padding: 9px 11px;
  border-left: 2px solid var(--cinnabar-2);
  background: rgba(235, 226, 210, 0.3);
  color: var(--ink);
  font-family: var(--serif);
  font-size: 0.84rem;
  line-height: 1.8;
}

.preparation-quote--large {
  border-left-color: var(--gold);
  font-size: 0.95rem;
  line-height: 1.95;
}

.preparation-card--administration .preparation-quote {
  border-left-color: var(--jade);
}

.preparation-note {
  margin-top: 9px;
  color: var(--ink-faint);
  font-size: 0.68rem;
  line-height: 1.7;
}

.symptom-layout {
  display: grid;
  grid-template-columns: minmax(0, 0.52fr) minmax(0, 0.48fr);
  gap: 22px;
  padding: 26px 0 30px;
  align-items: stretch;
}

.symptom-panel {
  order: -1;
}

.effect-card {
  padding: 18px 20px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(255, 252, 245, 0.55);
}

.effect-card :deep(.sourced-text__content) {
  display: block;
  margin-top: 8px;
  font-family: var(--serif);
  font-size: 1.02rem;
  line-height: 1.9;
}

.effect-meta {
  display: grid;
  gap: 8px;
  margin: 18px 0 0;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}

.effect-meta div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.effect-meta dt {
  color: var(--ink-faint);
  font-size: 0.7rem;
  white-space: nowrap;
}

.effect-meta dd {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.74rem;
}

.effect-modern {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}

.effect-modern__head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.effect-modern__tools {
  display: flex;
  align-items: center;
  gap: 6px;
}

.effect-modern__status {
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--gold-pale);
  color: #7b5a26;
  font-size: 0.6rem;
  white-space: nowrap;
}

.effect-modern__status--local {
  background: rgba(47, 111, 107, 0.14);
  color: var(--jade);
}

.effect-modern__status--published {
  background: rgba(192, 57, 43, 0.12);
  color: var(--cinnabar);
}

.note-btn {
  padding: 2px 8px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.45);
  color: var(--ink-soft);
  cursor: pointer;
  font-size: 0.64rem;
}

.note-btn:hover {
  border-color: var(--cinnabar);
  color: var(--cinnabar);
}

.note-btn--primary {
  border-color: var(--cinnabar);
  background: var(--cinnabar);
  color: #fff;
}

.note-btn--primary:hover {
  color: #fff;
  opacity: 0.9;
}

.note-btn--danger {
  border-color: rgba(163, 58, 43, 0.35);
  color: var(--cinnabar);
}

.effect-modern__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
  margin-top: 8px;
}

.effect-modern__draft {
  color: var(--jade);
  font-size: 0.64rem;
}

.note-link {
  border: 0;
  background: transparent;
  color: var(--cinnabar);
  cursor: pointer;
  font-size: 0.64rem;
  text-decoration: underline;
}

.effect-modern__code {
  margin-top: 7px;
  padding: 8px 9px;
  overflow-x: auto;
  border-radius: 6px;
  background: #202522;
  color: #f4efe4;
  font-family: ui-monospace, monospace;
  font-size: 0.66rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.note-editor {
  margin-top: 8px;
}

.note-editor textarea {
  width: 100%;
  resize: vertical;
  padding: 9px 10px;
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.6);
  color: var(--ink);
  font-family: var(--serif);
  font-size: 0.86rem;
  line-height: 1.8;
}

.note-editor textarea:focus {
  outline: none;
  border-color: var(--cinnabar);
  box-shadow: 0 0 0 2px rgba(163, 58, 43, 0.08);
}

.note-editor__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.note-editor__hint {
  margin-top: 7px;
  color: var(--ink-faint);
  font-size: 0.66rem;
  line-height: 1.7;
}

.note-editor__hint code {
  padding: 1px 4px;
  border-radius: 3px;
  background: rgba(235, 226, 210, 0.6);
  font-size: 0.62rem;
}

.effect-modern p {
  margin-top: 7px;
  color: var(--ink-soft);
  font-family: var(--serif);
  font-size: 0.9rem;
  line-height: 1.9;
  white-space: pre-line;
}

.effect-modern__empty {
  padding: 9px 10px;
  border: 1px dashed var(--line-strong);
  border-radius: 8px;
  background: rgba(235, 226, 210, 0.24);
  color: var(--ink-faint) !important;
  font-family: var(--sans) !important;
  font-size: 0.74rem !important;
}

.effect-modern :deep(.citation-badge) {
  margin-top: 0;
}

.symptom-panel {
  padding: 20px 22px 16px;
  border: 1px solid rgba(163, 58, 43, 0.22);
  border-radius: 16px;
  background:
    linear-gradient(rgba(255, 252, 245, 0.82), rgba(255, 252, 245, 0.6)),
    repeating-linear-gradient(0deg, transparent 0 33px, rgba(32, 37, 34, 0.035) 33px 34px);
  box-shadow: var(--shadow-soft);
}

.symptom-panel__head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
}

.symptom-panel__head h2 {
  margin-top: 3px;
  font-size: clamp(1.4rem, 2.3vw, 1.9rem);
}

.symptom-edit-hint {
  margin: 8px 0 0;
  color: var(--cinnabar);
  font-size: 0.7rem;
  line-height: 1.6;
}

.symptom-quote {
  margin: 16px 0 0;
  color: #3b3a35;
  font-family: var(--serif);
  font-size: clamp(1.04rem, 1.55vw, 1.24rem);
  line-height: 2.05;
  text-align: justify;
}

.symptom-empty {
  margin: 16px 0 0;
  padding: 12px 14px;
  border-left: 2px solid var(--gold);
  background: rgba(235, 226, 210, 0.3);
  color: var(--ink-soft);
  font-size: 0.82rem;
  line-height: 1.8;
}

.symptom-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 14px;
}

.symptom-panel__foot {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px solid var(--line);
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.symptom-panel__foot > span {
  max-width: 70%;
  text-align: right;
}

.large-hint {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
  padding: 16px 20px;
  margin-bottom: 24px;
}

.large-hint strong {
  font-family: var(--serif);
}

.large-hint p {
  margin-top: 3px;
  color: var(--ink-soft);
  font-size: 0.8rem;
}

.explanation-section {
  margin-top: 18px;
  padding: 18px 20px;
}

.explanation-section :deep(.sourced-text__content) {
  color: var(--ink);
  font-family: var(--serif);
  font-size: 0.95rem;
  line-height: 1.95;
}

.explanation-note {
  margin-top: 10px;
  padding-top: 9px;
  border-top: 1px dashed var(--line);
  color: var(--ink-faint);
  font-size: 0.68rem;
  line-height: 1.6;
}

.modification-section,
.pair-section,
.graph-commentary-section {
  padding-top: 44px;
}

.graph-commentary-section {
  display: block;
}

.graph-column {
  min-width: 0;
}

.graph-section__tools {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.graph-section__body {
  max-width: 560px;
}

.graph-commentary-section :deep(.graph-canvas) {
  max-height: 410px;
}

.graph-collapsed {
  max-width: 620px;
  padding: 26px 24px;
  border-style: dashed;
}

.graph-collapsed strong {
  font-family: var(--serif);
  font-size: 1rem;
}

.graph-collapsed p {
  margin: 4px 0 12px;
  color: var(--ink-soft);
  font-size: 0.78rem;
}

.switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ink-soft);
  font-size: 0.72rem;
  cursor: pointer;
}

.switch input {
  accent-color: var(--cinnabar);
}

.graph-caption {
  padding: 8px 4px 0;
  color: var(--ink-faint);
  font-size: 0.7rem;
  line-height: 1.6;
}

.graph-publish-hint {
  padding: 2px 4px 0;
  color: var(--cinnabar);
  font-size: 0.68rem;
  line-height: 1.6;
}

.graph-reopen {
  padding-top: 18px;
  text-align: center;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-end;
  margin-bottom: 18px;
}

.section-head h2 {
  margin-top: 3px;
}

.section-head > p {
  max-width: 420px;
  color: var(--ink-soft);
  font-size: 0.8rem;
  text-align: right;
}

.section-head > p strong {
  color: var(--cinnabar);
}

.modification-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.modification-card {
  display: flex;
  gap: 12px;
  padding: 15px 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255, 252, 245, 0.5);
}

.modification-card__index {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.8rem;
}

.modification-card__condition {
  color: var(--ink-soft);
  font-size: 0.8rem;
}

.modification-card__change {
  margin: 3px 0 6px;
  font-family: var(--serif);
  font-size: 1rem;
}

.pair-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.pair-card {
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255, 252, 245, 0.5);
}

.pair-card__names {
  display: flex;
  gap: 6px;
  align-items: baseline;
  flex-wrap: wrap;
  font-family: var(--serif);
  font-size: 1rem;
}

.pair-card__names a {
  text-decoration: underline;
  text-decoration-color: rgba(163, 58, 43, 0.28);
  text-underline-offset: 3px;
}

.pair-card__names a:hover {
  color: var(--cinnabar);
}

.pair-card__label {
  margin: 6px 0 4px;
  color: var(--cinnabar);
  font-size: 0.82rem;
}

.pair-card__note {
  color: var(--ink-soft);
  font-size: 0.74rem;
}

.empty-inline {
  padding: 20px;
  color: var(--ink-soft);
  font-size: 0.84rem;
}

.coverage {
  margin-top: 50px;
  padding: 22px 24px;
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr) auto;
  gap: 22px;
  align-items: center;
}

.coverage h3 {
  margin-top: 4px;
  font-size: 1.05rem;
}

.coverage p {
  color: var(--ink-soft);
  font-size: 0.8rem;
}

.coverage .text-link {
  white-space: nowrap;
  font-size: 0.8rem;
}

@media (max-width: 1080px) {
  .symptom-layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
  }

  .preparation-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .graph-commentary-section {
    grid-template-columns: minmax(0, 1fr);
  }

  .effect-card,
  .symptom-panel,
  .graph-column,
  .graph-section__body {
    min-width: 0;
  }

  .effect-card :deep(.citation-badge__text) {
    white-space: normal;
  }

  .graph-section__body {
    max-width: none;
  }
}

@media (max-width: 900px) {
  .detail-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .detail-head__source {
    align-items: flex-start;
  }

  .symptom-panel__head {
    flex-direction: column;
  }

  .symptom-panel__foot {
    flex-direction: column;
    align-items: flex-start;
  }

  .symptom-panel__foot > span {
    max-width: none;
    text-align: left;
  }

  .modification-list,
  .pair-grid {
    grid-template-columns: 1fr;
  }

  .preparation-grid {
    grid-template-columns: 1fr;
  }

  .section-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .section-head > p {
    text-align: left;
  }

  .coverage {
    grid-template-columns: 1fr;
  }
}
.formula-nav {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 14px;
  align-items: stretch;
  margin-top: 34px;
  padding-top: 22px;
  border-top: 1px solid var(--line);
}

.formula-nav__link {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 14px 16px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.42);
  color: var(--ink);
  text-decoration: none;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.formula-nav__link--prev {
  grid-column: 1;
}

.formula-nav__link--next {
  grid-column: 3;
  align-items: flex-end;
  text-align: right;
}

.formula-nav__link:hover {
  border-color: var(--cinnabar);
  transform: translateY(-1px);
}

.formula-nav__link span {
  color: var(--ink-faint);
  font-size: 0.68rem;
  letter-spacing: 0.08em;
}

.formula-nav__link strong {
  max-width: 100%;
  overflow: hidden;
  color: var(--cinnabar);
  font-family: var(--font-serif);
  font-size: 1rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.formula-nav__back {
  grid-column: 2;
  align-self: center;
  padding: 9px 18px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: transparent;
  color: var(--ink-soft);
  font: inherit;
  font-size: 0.78rem;
  white-space: nowrap;
  cursor: pointer;
}

.formula-nav__back:hover {
  border-color: var(--cinnabar);
  color: var(--cinnabar);
}

.formula-nav__all {
  margin: 14px 0 0;
  text-align: center;
  font-size: 0.76rem;
}

.formula-nav__all a {
  color: var(--ink-faint);
}

.formula-nav__all a:hover {
  color: var(--cinnabar);
}

@media (max-width: 760px) {
  .formula-nav {
    grid-template-columns: 1fr;
  }

  .formula-nav__link--prev,
  .formula-nav__link--next,
  .formula-nav__back {
    grid-column: auto;
  }

  .formula-nav__link--next {
    align-items: flex-start;
    text-align: left;
  }

  .formula-nav__back {
    justify-self: start;
  }
}
</style>
