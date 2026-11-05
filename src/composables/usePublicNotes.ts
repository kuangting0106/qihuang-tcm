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

const API_URL = '/api/notes'
const KEY_STORAGE = 'qihuang.editKey'

const empty = (): PublicNotes => ({
  symptomAnnotations: {},
  herbNotes: {},
  herbRoles: {},
  herbDoses: {},
  modernNotes: {},
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

let keyPrompt: Promise<string> | null = null

function askKey() {
  const entered = window.prompt(
    '请输入公开编辑口令。口令只保存在本机浏览器，用于把内容发布给所有访客。',
    '',
  )
  if (!entered) return ''
  const key = entered.trim()
  if (key) writeKey(key)
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

async function performSave(op: PublicNoteOp) {
  if (!available.value) {
    return { ok: false, message: '发布服务不可用，内容只保存在本机浏览器。' }
  }
  let key = readKey()
  if (!key) key = await askKeyOnce()
  if (!key) return { ok: false, message: '未输入编辑口令，内容只保存在本机。' }

  try {
    let response = await post(op, key)
    if (response.status === 401) {
      writeKey('')
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
    status.value = '已发布，所有访客可见。'
    return { ok: true, message: status.value }
  } catch {
    available.value = false
    return { ok: false, message: '无法连接发布服务，内容只保存在本机。' }
  }
}

export function savePublicNote(op: PublicNoteOp) {
  const task = saveQueue.then(() => performSave(op))
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

export function usePublicNotes() {
  return {
    notes,
    loading: computed(() => loading.value),
    available: computed(() => available.value),
    status,
    loadPublicNotes,
    savePublicNote,
    publicAnnotationsFor,
    publicHerbNotes,
    publicHerbRoles,
    publicHerbDoses,
    publicModernNotes,
  }
}
