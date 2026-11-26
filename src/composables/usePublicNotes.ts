import { computed, ref } from 'vue'
import type { FormulaRole } from '@/types/tcm'

export interface PublicSymptomAnnotation {
  id: string
  phrase: string
  note: string
  start?: number
  updatedAt?: string
}

export interface PublicNotes {
  symptomAnnotations: Record<string, PublicSymptomAnnotation[]>
  herbNotes: Record<string, Record<string, string>>
  herbRoles: Record<string, Record<string, FormulaRole>>
  herbDoses: Record<string, Record<string, string>>
  modernNotes: Record<string, string>
  formulaNotes: Record<string, string>
  updatedAt?: string | null
}

export type PublicNoteOp =
  | {
      op: 'symptom-upsert'
      scopeKey: string
      annotation: { phrase: string; note: string; start?: number }
    }
  | { op: 'symptom-delete'; scopeKey: string; phrase: string; start?: number }
  | { op: 'herb-note'; formulaId: string; herbId: string; note: string }
  | { op: 'herb-role'; formulaId: string; herbId: string; role: FormulaRole }
  | { op: 'herb-reset'; formulaId: string; herbId: string }
  | { op: 'herb-dose'; formulaId: string; herbId: string; dose: string }
  | { op: 'modern-note'; formulaId: string; text: string }
  | { op: 'formula-note'; formulaId: string; note: string }

const API_URL = '/api/notes'
const KEY_STORAGE = 'qihuang.editKey'

const empty = (): PublicNotes => ({
  symptomAnnotations: {},
  herbNotes: {},
  herbRoles: {},
  herbDoses: {},
  modernNotes: {},
  formulaNotes: {},
  updatedAt: null,
})

const notes = ref<PublicNotes>(empty())
const loading = ref(false)
const available = ref(true)
const status = ref('')
let loaded = false
let loadingPromise: Promise<void> | null = null

function normalize(raw: unknown): PublicNotes {
  const data = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    symptomAnnotations:
      data.symptomAnnotations && typeof data.symptomAnnotations === 'object'
        ? (data.symptomAnnotations as PublicNotes['symptomAnnotations'])
        : {},
    herbNotes:
      data.herbNotes && typeof data.herbNotes === 'object'
        ? (data.herbNotes as PublicNotes['herbNotes'])
        : {},
    herbRoles:
      data.herbRoles && typeof data.herbRoles === 'object'
        ? (data.herbRoles as PublicNotes['herbRoles'])
        : {},
    herbDoses:
      data.herbDoses && typeof data.herbDoses === 'object'
        ? (data.herbDoses as PublicNotes['herbDoses'])
        : {},
    modernNotes:
      data.modernNotes && typeof data.modernNotes === 'object'
        ? (data.modernNotes as PublicNotes['modernNotes'])
        : {},
    formulaNotes:
      data.formulaNotes && typeof data.formulaNotes === 'object'
        ? (data.formulaNotes as PublicNotes['formulaNotes'])
        : {},
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : null,
  }
}

export async function loadPublicNotes(force = false) {
  if (loaded && !force) return
  if (loadingPromise) return loadingPromise
  loading.value = true
  loadingPromise = (async () => {
    try {
      const response = await fetch(API_URL, { headers: { Accept: 'application/json' } })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      notes.value = normalize(await response.json())
      available.value = true
    } catch {
      available.value = false
    } finally {
      loaded = true
      loading.value = false
      loadingPromise = null
    }
  })()
  return loadingPromise
}

function readKey() {
  try {
    return localStorage.getItem(KEY_STORAGE) ?? ''
  } catch {
    return ''
  }
}

function writeKey(key: string) {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key)
    else localStorage.removeItem(KEY_STORAGE)
  } catch {
    // 禁用 localStorage 时每次保存都会重新询问。
  }
}

const editKey = ref(readKey())

export function setEditKey(key: string) {
  const value = key.trim()
  writeKey(value)
  editKey.value = value
}

export function clearEditKey() {
  writeKey('')
  editKey.value = ''
}

export const hasEditKey = computed(() => Boolean(editKey.value))

let keyPrompt: Promise<string> | null = null

function askKey() {
  const entered = window.prompt(
    '请输入公开编辑口令。口令只保存在本机浏览器，用于把内容发布给所有访客。',
    '',
  )
  if (!entered) return ''
  const key = entered.trim()
  if (key) setEditKey(key)
  return key
}

function askKeyOnce() {
  if (!keyPrompt) {
    keyPrompt = Promise.resolve()
      .then(() => askKey())
      .finally(() => {
        keyPrompt = null
      })
  }
  return keyPrompt
}

async function post(op: PublicNoteOp, key: string) {
  return fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-qihuang-key': key,
    },
    body: JSON.stringify(op),
  })
}

let saveQueue: Promise<unknown> = Promise.resolve()

async function performSave(op: PublicNoteOp, explicitKey = '') {
  if (!available.value) {
    return { ok: false, message: '发布服务不可用，内容只保存在本机浏览器。' }
  }
  let key = explicitKey || editKey.value
  if (!key) key = await askKeyOnce()
  if (!key) return { ok: false, message: '未输入编辑口令，内容只保存在本机。' }

  try {
    let response = await post(op, key)
    if (response.status === 401) {
      clearEditKey()
      // 页面内已提供口令时不再弹系统对话框，直接把错误交回调用方。
      if (explicitKey) return { ok: false, message: '编辑口令不正确，内容只保存在本机。' }
      key = await askKeyOnce()
      if (!key) return { ok: false, message: '编辑口令不正确，内容只保存在本机。' }
      response = await post(op, key)
    }
    if (!response.ok) {
      return {
        ok: false,
        message:
          response.status === 401 ? '编辑口令不正确，内容只保存在本机。' : '发布服务暂不可用，内容只保存在本机。',
      }
    }
    notes.value = normalize(await response.json())
    available.value = true
    editKey.value = key
    status.value = '已发布，所有访客可见。'
    return { ok: true, message: status.value }
  } catch {
    available.value = false
    return { ok: false, message: '无法连接发布服务，内容只保存在本机。' }
  }
}

export function savePublicNote(op: PublicNoteOp, explicitKey = '') {
  const task = saveQueue.then(() => performSave(op, explicitKey))
  saveQueue = task.then(
    () => undefined,
    () => undefined,
  )
  return task
}

async function postPublic(op: PublicNoteOp) {
  return fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(op),
  })
}

async function performFormulaNoteSave(formulaId: string, note: string) {
  if (!available.value) {
    return { ok: false, message: '发布服务暂不可用，请稍后再试。' }
  }
  try {
    const response = await postPublic({ op: 'formula-note', formulaId, note })
    if (!response.ok) {
      return { ok: false, message: '发布服务暂不可用，请稍后再试。' }
    }
    notes.value = normalize(await response.json())
    available.value = true
    return { ok: true, message: '已保存到网页，所有访客可见。' }
  } catch {
    available.value = false
    return { ok: false, message: '无法连接发布服务，请稍后再试。' }
  }
}

/** 方剂备注：按站点要求免口令公开写入，保存即发布。 */
export function saveFormulaNote(formulaId: string, note: string) {
  const task = saveQueue.then(() => performFormulaNoteSave(formulaId, note))
  saveQueue = task.then(
    () => undefined,
    () => undefined,
  )
  return task
}

export function publicAnnotationsFor(scopeKey: string) {
  return notes.value.symptomAnnotations[scopeKey] ?? []
}

export function publicHerbNotes(formulaId: string) {
  return notes.value.herbNotes[formulaId] ?? {}
}

export function publicHerbRoles(formulaId: string) {
  return notes.value.herbRoles[formulaId] ?? {}
}

export function publicHerbDoses(formulaId: string) {
  return notes.value.herbDoses[formulaId] ?? {}
}

export function publicModernNotes(formulaId: string) {
  return notes.value.modernNotes[formulaId] ?? ''
}

export function publicFormulaNote(formulaId: string) {
  return notes.value.formulaNotes[formulaId] ?? ''
}

export function usePublicNotes() {
  return {
    notes,
    loading: computed(() => loading.value),
    available: computed(() => available.value),
    status,
    editKey,
    hasEditKey,
    setEditKey,
    clearEditKey,
    loadPublicNotes,
    savePublicNote,
    saveFormulaNote,
    publicAnnotationsFor,
    publicHerbNotes,
    publicHerbRoles,
    publicHerbDoses,
    publicModernNotes,
    publicFormulaNote,
  }
}
