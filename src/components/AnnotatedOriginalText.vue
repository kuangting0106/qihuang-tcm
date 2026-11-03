<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { OriginalAnnotation } from '@/types/tcm'
import CitationBadge from './CitationBadge.vue'

interface LocalAnnotation extends OriginalAnnotation {
  local?: boolean
  public?: boolean
  start?: number
}

interface PublishResult {
  ok: boolean
  message: string
}

interface PublishPayload {
  phrase: string
  note: string
  start: number
}

interface UnpublishPayload {
  phrase: string
  start: number
}

interface Segment {
  text: string
  annotation?: LocalAnnotation
}

interface ActiveAnnotation {
  text: string
  annotation: LocalAnnotation
}

interface EditorState {
  x: number
  y: number
  width: number
  phrase: string
  start: number
  editing: boolean
}

const MANUAL_STORAGE_KEY = 'qihuang.formula.manualAnnotations'
const MAX_PHRASE = 40
const MAX_NOTE = 240

const props = withDefaults(
  defineProps<{
    text: string
    annotations?: OriginalAnnotation[]
    publishedAnnotations?: OriginalAnnotation[]
    tags?: string[]
    editable?: boolean
    scopeKey?: string
    publishAnnotation?: (payload: PublishPayload) => Promise<PublishResult>
    unpublishAnnotation?: (payload: UnpublishPayload) => Promise<PublishResult>
  }>(),
  {
    annotations: undefined,
    publishedAnnotations: () => [],
    tags: () => [],
    editable: false,
    scopeKey: '',
    publishAnnotation: undefined,
    unpublishAnnotation: undefined,
  },
)

const root = ref<HTMLElement | null>(null)
const body = ref<HTMLElement | null>(null)
const editorInput = ref<HTMLTextAreaElement | null>(null)
const active = ref<ActiveAnnotation | null>(null)
const tip = ref({ x: 0, y: 0, width: 280 })
const editor = ref<EditorState | null>(null)
const noteDraft = ref('')
const selectionHint = ref('')
const publishMessage = ref('')
const publishing = ref(false)
const manual = ref<Record<string, LocalAnnotation[]>>(readManual())

function readManual(): Record<string, LocalAnnotation[]> {
  try {
    const raw = localStorage.getItem(MANUAL_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const out: Record<string, LocalAnnotation[]> = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (!Array.isArray(value)) continue
      const list = value
        .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
        .map((item) => ({
          id: typeof item.id === 'string' ? item.id : `local-${Date.now()}`,
          phrase: typeof item.phrase === 'string' ? item.phrase : '',
          note: typeof item.note === 'string' ? item.note : '',
          local: true,
          start: typeof item.start === 'number' ? item.start : undefined,
          citationIds: Array.isArray(item.citationIds)
            ? item.citationIds.filter((id): id is string => typeof id === 'string')
            : undefined,
        }))
        .filter((item) => item.phrase && item.note)
      if (list.length) out[key] = list
    }
    return out
  } catch {
    return {}
  }
}

function persistManual() {
  try {
    localStorage.setItem(MANUAL_STORAGE_KEY, JSON.stringify(manual.value))
  } catch {
    // 浏览器禁用 localStorage 时，只保留本次会话内的内容。
  }
}

const currentManual = computed(() =>
  props.scopeKey ? manual.value[props.scopeKey] ?? [] : [],
)

const mergedAnnotations = computed<LocalAnnotation[]>(() => {
  const manualList = currentManual.value
  const manualPhrases = new Set(manualList.map((item) => item.phrase))
  const publishedList = props.publishedAnnotations
    .filter((item) => !!item.phrase && !!item.note && !manualPhrases.has(item.phrase))
    .map((item) => ({ ...item, public: true }))
  const publishedPhrases = new Set(publishedList.map((item) => item.phrase))
  const sourceAnnotations = (props.annotations ?? []).filter(
    (item) =>
      !!item.phrase &&
      !!item.note &&
      !manualPhrases.has(item.phrase) &&
      !publishedPhrases.has(item.phrase),
  )
  return [...manualList, ...publishedList, ...sourceAnnotations]
})

const visibleTags = computed(() => props.tags.filter(Boolean).slice(0, 10))

const segments = computed<Segment[]>(() => {
  const source = props.text
  const annotations = mergedAnnotations.value.filter(
    (item) => !!item.phrase && !!item.note,
  )
  if (!annotations.length) return [{ text: source }]

  const used = new Array(source.length).fill(false)
  const hits: { start: number; end: number; annotation: LocalAnnotation }[] = []

  const ordered = [...annotations].sort((a, b) => {
    if (!!b.local !== !!a.local) return b.local ? 1 : -1
    if (!!b.public !== !!a.public) return b.public ? 1 : -1
    return b.phrase.length - a.phrase.length
  })

  for (const annotation of ordered) {
    let start = -1
    if (
      typeof annotation.start === 'number' &&
      source.slice(annotation.start, annotation.start + annotation.phrase.length) ===
        annotation.phrase
    ) {
      start = annotation.start
    } else {
      start = source.indexOf(annotation.phrase)
    }
    if (start === -1) continue

    const end = start + annotation.phrase.length
    let overlap = false
    for (let i = start; i < end; i += 1) {
      if (used[i]) {
        overlap = true
        break
      }
    }
    if (overlap) continue

    for (let i = start; i < end; i += 1) used[i] = true
    hits.push({ start, end, annotation })
  }

  hits.sort((a, b) => a.start - b.start)
  const out: Segment[] = []
  let cursor = 0
  for (const hit of hits) {
    if (hit.start > cursor) out.push({ text: source.slice(cursor, hit.start) })
    out.push({ text: source.slice(hit.start, hit.end), annotation: hit.annotation })
    cursor = hit.end
  }
  if (cursor < source.length) out.push({ text: source.slice(cursor) })
  return out
})

function placeTip(element: HTMLElement) {
  const rootEl = root.value
  if (!rootEl) return
  const rootRect = rootEl.getBoundingClientRect()
  const rect = element.getBoundingClientRect()
  const width = Math.min(300, Math.max(200, rootRect.width - 16))
  let x = rect.left - rootRect.left
  let y = rect.bottom - rootRect.top + 8
  if (x + width > rootRect.width - 8) x = rootRect.width - width - 8
  x = Math.max(8, x)
  tip.value = { x, y, width }
}

function show(segment: Segment, event: Event) {
  if (!segment.annotation) return
  editor.value = null
  active.value = { text: segment.text, annotation: segment.annotation }
  placeTip(event.currentTarget as HTMLElement)
}

function hide() {
  active.value = null
}

function onSelectionEnd() {
  if (!props.editable || !props.scopeKey) return
  const bodyEl = body.value
  const selection = window.getSelection()
  if (!bodyEl || !selection || selection.rangeCount === 0 || selection.isCollapsed) return

  const range = selection.getRangeAt(0)
  if (!bodyEl.contains(range.commonAncestorContainer)) return

  const phrase = selection.toString().replace(/\s+/g, ' ').trim()
  if (!phrase) return
  if (phrase.length > MAX_PHRASE) {
    selectionHint.value = `一次最多选择 ${MAX_PHRASE} 个字，请缩短选区。`
    selection.removeAllRanges()
    return
  }
  if (!props.text.includes(phrase)) {
    selectionHint.value = '请选择原文中的连续文字，不要跨段选择。'
    selection.removeAllRanges()
    return
  }

  const rootRect = root.value?.getBoundingClientRect()
  if (!rootRect) return
  const rect = range.getBoundingClientRect()
  const preRange = range.cloneRange()
  preRange.selectNodeContents(bodyEl)
  preRange.setEnd(range.startContainer, range.startOffset)
  const start = preRange.toString().length

  const width = Math.min(320, Math.max(220, rootRect.width - 16))
  let x = rect.left - rootRect.left
  let y = rect.bottom - rootRect.top + 8
  if (x + width > rootRect.width - 8) x = rootRect.width - width - 8
  x = Math.max(8, x)

  selectionHint.value = ''
  active.value = null
  editor.value = { x, y, width, phrase, start, editing: false }
  noteDraft.value = ''
  selection.removeAllRanges()
  nextTick(() => editorInput.value?.focus())
}

function onTouchEnd() {
  window.setTimeout(onSelectionEnd, 0)
}

function removeManual(phrase: string, start?: number) {
  const list = (manual.value[props.scopeKey] ?? []).filter(
    (item) => !(item.phrase === phrase && item.start === start),
  )
  const next = { ...manual.value }
  if (list.length) next[props.scopeKey] = list
  else delete next[props.scopeKey]
  manual.value = next
  persistManual()
}

async function saveAnnotation() {
  const state = editor.value
  const note = noteDraft.value.trim()
  if (!state) return
  if (!note) {
    selectionHint.value = '请填写注解内容。'
    return
  }

  const list = [...(manual.value[props.scopeKey] ?? [])]
  const existing = list.findIndex(
    (item) => item.phrase === state.phrase && item.start === state.start,
  )
  const entry: LocalAnnotation = {
    id: existing >= 0 ? list[existing].id : `local-${Date.now()}`,
    phrase: state.phrase,
    note,
    local: true,
    start: state.start,
  }
  if (existing >= 0) list[existing] = entry
  else list.push(entry)

  manual.value = { ...manual.value, [props.scopeKey]: list }
  persistManual()
  editor.value = null
  noteDraft.value = ''
  selectionHint.value = ''

  if (!props.publishAnnotation) {
    publishMessage.value = '已保存到本机浏览器。'
    return
  }

  publishing.value = true
  publishMessage.value = '正在发布……'
  try {
    const result = await props.publishAnnotation({
      phrase: state.phrase,
      note,
      start: state.start,
    })
    publishMessage.value = result.message
    if (result.ok) removeManual(state.phrase, state.start)
  } finally {
    publishing.value = false
  }
}

function cancelEditor() {
  editor.value = null
  noteDraft.value = ''
  selectionHint.value = ''
}

function canManageActive() {
  return !!active.value?.annotation.local || !!active.value?.annotation.public
}

function editActive() {
  const current = active.value
  if (!current || !canManageActive()) return
  const start =
    current.annotation.start ?? props.text.indexOf(current.annotation.phrase)
  editor.value = {
    x: tip.value.x,
    y: tip.value.y,
    width: tip.value.width,
    phrase: current.annotation.phrase,
    start: Math.max(0, start),
    editing: true,
  }
  noteDraft.value = current.annotation.note
  active.value = null
  nextTick(() => editorInput.value?.focus())
}

async function deleteActive() {
  const current = active.value
  if (!current || !canManageActive()) return
  const { phrase, start } = current.annotation
  const isPublic = current.annotation.public
  active.value = null

  if (!isPublic) {
    removeManual(phrase, start)
    publishMessage.value = '已删除本机注解。'
    return
  }
  if (!props.unpublishAnnotation) {
    publishMessage.value = '公开注解需要通过发布服务删除。'
    return
  }

  publishing.value = true
  publishMessage.value = '正在删除公开注解……'
  try {
    const result = await props.unpublishAnnotation({ phrase, start: start ?? 0 })
    publishMessage.value = result.message
    if (result.ok) removeManual(phrase, start)
  } finally {
    publishing.value = false
  }
}

watch(
  () => props.scopeKey,
  () => {
    active.value = null
    editor.value = null
    noteDraft.value = ''
    selectionHint.value = ''
  },
)

watch(
  () => props.editable,
  (value) => {
    if (!value) {
      active.value = null
      editor.value = null
      noteDraft.value = ''
      selectionHint.value = ''
    }
  },
)
</script>

<template>
  <div ref="root" class="annotated-text" :class="{ 'annotated-text--editable': editable }" @mouseleave="hide">
    <div
      ref="body"
      class="annotated-text__body"
      @mouseup="onSelectionEnd"
      @touchend="onTouchEnd"
    >
      <template v-for="(segment, index) in segments" :key="index">
        <span
          v-if="segment.annotation"
          class="annotated-text__term"
          :class="{
            'annotated-text__term--active': active?.annotation.id === segment.annotation.id,
            'annotated-text__term--local': segment.annotation.local,
            'annotated-text__term--public': segment.annotation.public,
          }"
          tabindex="0"
          :aria-label="`${segment.text}：${segment.annotation.note}`"
          @mouseenter="show(segment, $event)"
          @focus="show(segment, $event)"
          @click.stop="show(segment, $event)"
          @blur="hide"
        >
          {{ segment.text }}
        </span>
        <template v-else>{{ segment.text }}</template>
      </template>
    </div>

    <div v-if="visibleTags.length" class="annotated-tags">
      <span v-for="tag in visibleTags" :key="tag" class="annotated-tag">{{ tag }}</span>
    </div>

    <p v-if="editable && !editor" class="annotated-hint">
      用鼠标或手指选中原文词句，松开后即可添加注解；保存后会发布给所有访客。
    </p>
    <p v-if="publishMessage" class="annotated-hint">{{ publishMessage }}</p>
    <p v-if="selectionHint" class="annotated-hint annotated-hint--warn">{{ selectionHint }}</p>

    <div
      v-if="editor"
      class="annotated-editor"
      :style="{ left: `${editor.x}px`, top: `${editor.y}px`, width: `${editor.width}px` }"
      @mouseup.stop
      @touchend.stop
    >
      <div class="annotated-editor__head">
        <strong>{{ editor.phrase }}</strong>
        <span>{{ editor.editing ? '编辑注解' : '添加注解' }}</span>
      </div>
      <textarea
        ref="editorInput"
        v-model="noteDraft"
        :maxlength="MAX_NOTE"
        rows="3"
        placeholder="用现代汉语解释这个症状或词句……"
      ></textarea>
      <div class="annotated-editor__actions">
        <button type="button" class="annotated-editor__save" :disabled="publishing" @click="saveAnnotation">
          {{ publishing ? '发布中…' : '保存并发布' }}
        </button>
        <button type="button" @click="cancelEditor">取消</button>
        <span>无口令时仅存本机</span>
      </div>
    </div>

    <div
      v-if="active"
      class="annotated-tip"
      :style="{ left: `${tip.x}px`, top: `${tip.y}px`, width: `${tip.width}px` }"
    >
      <div class="annotated-tip__head">
        <strong>{{ active.text }}</strong>
        <span>{{
          active.annotation.local ? '本地注解' : active.annotation.public ? '公开注解' : '现代注解'
        }}</span>
      </div>
      <p>{{ active.annotation.note }}</p>
      <div class="annotated-tip__foot">
        <CitationBadge
          v-if="active.annotation.citationIds?.length"
          :citation-ids="active.annotation.citationIds"
          label="后世方解"
          tone="muted"
          compact
        />
        <span>{{
          active.annotation.local
            ? '仅存当前浏览器'
            : active.annotation.public
              ? '所有访客可见'
              : '非原文'
        }}</span>
      </div>
      <div v-if="canManageActive()" class="annotated-tip__actions">
        <button type="button" @click.stop="editActive">编辑</button>
        <button type="button" :disabled="publishing" @click.stop="deleteActive">删除</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.annotated-text {
  position: relative;
  font: inherit;
  line-height: inherit;
  color: inherit;
}

.annotated-text__body {
  display: inline;
}

.annotated-text--editable .annotated-text__body {
  cursor: text;
}

.annotated-text__term {
  padding: 0 1px;
  border-bottom: 1px dotted var(--cinnabar);
  background: linear-gradient(to top, rgba(237, 224, 200, 0.55) 42%, transparent 42%);
  cursor: help;
  outline: none;
}

.annotated-text__term--local {
  border-bottom-style: solid;
  border-bottom-color: var(--gold);
  background: rgba(237, 224, 200, 0.45);
}

.annotated-text__term--public {
  border-bottom-style: solid;
  border-bottom-color: var(--cinnabar);
  background: rgba(163, 58, 43, 0.08);
}

.annotated-text__term:hover,
.annotated-text__term:focus-visible,
.annotated-text__term--active {
  border-bottom-color: var(--cinnabar);
  background: rgba(237, 224, 200, 0.72);
}

.annotated-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.annotated-tag {
  padding: 3px 9px;
  border: 1px solid rgba(163, 58, 43, 0.22);
  border-radius: 999px;
  background: rgba(163, 58, 43, 0.06);
  color: var(--cinnabar);
  font-size: 0.68rem;
  line-height: 1.5;
}

.annotated-hint {
  margin: 8px 0 0;
  color: var(--ink-faint);
  font-size: 0.66rem;
  line-height: 1.5;
}

.annotated-hint--warn {
  color: var(--cinnabar);
}

.annotated-editor {
  position: absolute;
  z-index: 40;
  max-width: calc(100vw - 48px);
  padding: 11px 12px;
  border: 1px solid rgba(176, 138, 74, 0.5);
  border-radius: 10px;
  background: rgba(255, 252, 245, 0.99);
  box-shadow: 0 12px 30px rgba(32, 37, 34, 0.18);
}

.annotated-editor__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}

.annotated-editor__head strong {
  color: var(--ink);
  font-family: var(--serif);
  font-size: 0.82rem;
}

.annotated-editor__head span {
  flex: 0 0 auto;
  color: var(--ink-faint);
  font-size: 0.6rem;
}

.annotated-editor textarea {
  box-sizing: border-box;
  width: 100%;
  min-height: 64px;
  padding: 7px 8px;
  border: 1px solid var(--line-strong);
  border-radius: 7px;
  background: #fffdf8;
  color: var(--ink);
  font-family: var(--sans);
  font-size: 0.76rem;
  line-height: 1.65;
  resize: vertical;
}

.annotated-editor__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 7px;
}

.annotated-editor__actions button {
  padding: 4px 10px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: transparent;
  color: var(--ink-soft);
  font-size: 0.66rem;
  cursor: pointer;
}

.annotated-editor__actions button.annotated-editor__save {
  border-color: var(--cinnabar);
  background: var(--cinnabar);
  color: #fff;
}

.annotated-editor__actions span {
  margin-left: auto;
  color: var(--ink-faint);
  font-size: 0.58rem;
}

.annotated-tip {
  position: absolute;
  z-index: 30;
  padding: 11px 13px;
  border: 1px solid rgba(176, 138, 74, 0.45);
  border-radius: 10px;
  background: rgba(255, 252, 245, 0.98);
  box-shadow: 0 10px 28px rgba(32, 37, 34, 0.16);
}

.annotated-tip__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.annotated-tip__head strong {
  font-family: var(--serif);
  font-size: 0.95rem;
  color: var(--ink);
}

.annotated-tip__head span {
  flex: 0 0 auto;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--gold-pale);
  color: #7b5a26;
  font-size: 0.58rem;
}

.annotated-tip p {
  margin-top: 5px;
  color: var(--ink-soft);
  font-family: var(--sans);
  font-size: 0.76rem;
  line-height: 1.75;
}

.annotated-tip__foot {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 7px;
  padding-top: 6px;
  border-top: 1px dashed var(--line);
  color: var(--ink-faint);
  font-size: 0.6rem;
}

.annotated-tip__actions {
  display: flex;
  gap: 6px;
  margin-top: 7px;
}

.annotated-tip__actions button {
  padding: 2px 8px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: transparent;
  color: var(--ink-soft);
  font-size: 0.62rem;
  cursor: pointer;
}

.annotated-tip__actions button:hover {
  border-color: var(--cinnabar);
  color: var(--cinnabar);
}

@media (max-width: 680px) {
  .annotated-editor {
    max-width: calc(100vw - 48px);
  }
}
</style>
