<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Formula } from '@/types/tcm'
import { useTcmData } from '@/composables/useTcmData'
import { openCitations } from '@/composables/useCitationDrawer'

const props = defineProps<{ formula: Formula }>()
const { citationsById } = useTcmData()
const hovering = ref(false)

const citation = computed(() => citationsById.value.get(props.formula.sourceCitationId))
const preview = computed(() => {
  const text = props.formula.originalText.text.replace(/\s+/g, ' ').trim()
  return text.length > 190 ? `${text.slice(0, 190)}…` : text
})

function open() {
  openCitations([props.formula.sourceCitationId], `原文证据 · ${props.formula.name}`)
}
</script>

<template>
  <div class="evidence-trigger" @mouseenter="hovering = true" @mouseleave="hovering = false">
    <button class="evidence-button" type="button" aria-haspopup="dialog" @click="open">
      <span class="evidence-button__eyebrow">ORIGINAL TEXT / 原文</span>
      <strong>原文证据</strong>
      <small>鼠标浮处预览 · 点击查看全文</small>
    </button>

    <Transition name="pop">
      <div v-if="hovering" class="evidence-popover" aria-hidden="true">
        <div class="evidence-popover__head">
          <span>{{ citation?.work }}</span>
          <span>{{ citation?.locator }}</span>
        </div>
        <p>{{ preview }}</p>
        <span class="evidence-popover__more">点击查看全文 →</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.evidence-trigger {
  position: relative;
  align-self: flex-start;
}

.evidence-button {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  padding: 10px 14px;
  border: 1px solid rgba(163, 58, 43, 0.3);
  border-radius: 10px;
  background: var(--cinnabar-pale);
  color: var(--ink);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.16s ease, background 0.16s ease;
}

.evidence-button:hover {
  border-color: var(--cinnabar);
  background: #f6e4dd;
}

.evidence-button__eyebrow {
  color: var(--cinnabar);
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.12em;
}

.evidence-button strong {
  font-family: var(--serif);
  font-size: 0.95rem;
}

.evidence-button small {
  color: var(--ink-soft);
  font-size: 0.64rem;
}

.evidence-popover {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 20;
  width: min(440px, 78vw);
  padding: 13px 15px;
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  background: var(--paper);
  box-shadow: var(--shadow);
  pointer-events: none;
}

.evidence-popover__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.72rem;
}

.evidence-popover p {
  margin-top: 7px;
  color: var(--ink-soft);
  font-family: var(--serif);
  font-size: 0.78rem;
  line-height: 1.8;
}

.evidence-popover__more {
  display: block;
  margin-top: 7px;
  color: var(--jade);
  font-size: 0.68rem;
}

.pop-enter-active,
.pop-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (hover: none) {
  .evidence-popover {
    display: none;
  }
}
</style>
