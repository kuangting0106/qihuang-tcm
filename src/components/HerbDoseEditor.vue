<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Formula } from '@/types/tcm'
import { usePublicNotes } from '@/composables/usePublicNotes'

const props = defineProps<{
  formulaId: string
  item: Formula['composition'][number]
  modern?: boolean
  modernText?: string
}>()

const STORAGE_KEY = 'qihuang.formula.herbDoses'
const PENDING_TEXT = '用量需根据实际病症情况而定'

type DoseMap = Record<string, Record<string, string>>

function readDoses(): DoseMap {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    if (!parsed || typeof parsed !== 'object') return {}
    const next: DoseMap = {}
    for (const [formulaId, value] of Object.entries(parsed)) {
      if (!value || typeof value !== 'object') continue
      const items: Record<string, string> = {}
      for (const [herbId, dose] of Object.entries(value as Record<string, unknown>)) {
        if (typeof dose !== 'string') continue
        const text = dose.trim()
        if (text && herbId) items[herbId] = text
      }
      if (Object.keys(items).length) next[formulaId] = items
    }
    return next
  } catch {
    return {}
  }
}

const doses = ref<DoseMap>(readDoses())
const editing = ref(false)
const draft = ref('')
const hint = ref('')
const publishing = ref(false)

const { savePublicNote, publicHerbDoses } = usePublicNotes()

const herbKey = computed(() => props.item.herbId || props.item.herbName || '')
const publicOverride = computed(
  () => publicHerbDoses(props.formulaId)[herbKey.value] ?? '',
)
const localOverride = computed(
  () => doses.value[props.formulaId]?.[herbKey.value] ?? '',
)
const override = computed(() => publicOverride.value || localOverride.value)
const isPending = computed(() => !override.value && props.item.dosage === PENDING_TEXT)
const displayText = computed(() => {
  if (props.modern) return props.modernText ?? props.item.dosage
  return override.value || props.item.dosage
})

function persist(next: DoseMap) {
  doses.value = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // 浏览器禁用存储时，至少保留当前会话内的修改。
  }
}

function beginEdit() {
  editing.value = true
  hint.value = ''
  draft.value = override.value || (isPending.value ? '' : props.item.dosage)
}

function cancelEdit() {
  editing.value = false
  draft.value = ''
}

function setLocalDose(text: string) {
  const current = doses.value[props.formulaId] ?? {}
  persist({
    ...doses.value,
    [props.formulaId]: { ...current, [herbKey.value]: text },
  })
}

function clearLocalDose() {
  const current = doses.value[props.formulaId]
  if (!current) return
  const nextItems = { ...current }
  delete nextItems[herbKey.value]
  const next = { ...doses.value }
  if (Object.keys(nextItems).length) next[props.formulaId] = nextItems
  else delete next[props.formulaId]
  persist(next)
}

async function saveDose() {
  const text = draft.value.trim()
  if (!text) {
    hint.value = '用量不能为空。'
    return
  }
  publishing.value = true
  const result = await savePublicNote({
    op: 'herb-dose',
    formulaId: props.formulaId,
    herbId: herbKey.value,
    dose: text,
  })
  if (result.ok) {
    clearLocalDose()
    hint.value = '已发布到网页，所有访客可见。'
  } else {
    setLocalDose(text)
    hint.value = '公开保存未成功，已保存到本机浏览器。'
  }
  publishing.value = false
  editing.value = false
}

async function resetDose() {
  publishing.value = true
  if (publicOverride.value) {
    const result = await savePublicNote({
      op: 'herb-dose',
      formulaId: props.formulaId,
      herbId: herbKey.value,
      dose: '',
    })
    if (!result.ok) {
      hint.value = '公开清除未成功，请稍后再试。'
      publishing.value = false
      return
    }
  }
  clearLocalDose()
  editing.value = false
  publishing.value = false
  hint.value = '已恢复原文用量。'
}

watch(
  () => props.formulaId,
  () => {
    editing.value = false
    hint.value = ''
  },
)
</script>

<template>
  <span class="dose-editor">
    <template v-if="editing">
      <input
        v-model="draft"
        class="dose-editor__input"
        type="text"
        :placeholder="`原文：${item.dosage}`"
        @keyup.enter="saveDose"
        @keyup.esc="cancelEdit"
      />
      <button class="dose-editor__btn dose-editor__btn--primary" type="button" :disabled="publishing" @click="saveDose">
        {{ publishing ? '保存中…' : '保存并发布' }}
      </button>
      <button class="dose-editor__btn" type="button" :disabled="publishing" @click="cancelEdit">取消</button>
      <button v-if="override" class="dose-editor__btn" type="button" :disabled="publishing" @click="resetDose">恢复原文</button>
    </template>
    <template v-else>
      <span class="dose-editor__value" :class="{ 'is-pending': isPending }">{{ displayText }}</span>
      <template v-if="!modern">
        <button class="dose-editor__btn" type="button" :disabled="publishing" @click="beginEdit">
          {{ override ? '改用量' : '补用量' }}
        </button>
        <button v-if="override" class="dose-editor__btn" type="button" :disabled="publishing" @click="resetDose">恢复</button>
      </template>
    </template>
    <span v-if="hint" class="dose-editor__hint">{{ hint }}</span>
  </span>
</template>

<style scoped>
.dose-editor {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.dose-editor__value {
  color: var(--ink-soft);
  font-size: 0.82rem;
}
.dose-editor__value.is-pending {
  color: var(--cinnabar);
  font-size: 0.76rem;
}
.dose-editor__btn {
  border: 1px solid var(--line);
  border-radius: 3px;
  background: transparent;
  color: var(--ink-faint);
  padding: 2px 7px;
  font-size: 0.68rem;
  line-height: 1.5;
  cursor: pointer;
}
.dose-editor__btn:hover {
  border-color: var(--cinnabar);
  color: var(--cinnabar);
}
.dose-editor__btn--primary {
  border-color: var(--cinnabar);
  background: var(--cinnabar);
  color: #fff;
}
.dose-editor__btn--primary:hover {
  color: #fff;
  opacity: 0.9;
}
.dose-editor__input {
  width: min(240px, 52vw);
  border: 1px solid var(--line-strong);
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.7);
  padding: 4px 8px;
  color: var(--ink);
  font-size: 0.8rem;
}
.dose-editor__hint {
  flex-basis: 100%;
  color: var(--ink-faint);
  font-size: 0.68rem;
}
</style>
