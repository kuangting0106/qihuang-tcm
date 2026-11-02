<script setup lang="ts">
import { computed, ref } from 'vue'
import type { OriginalAnnotation } from '@/types/tcm'
import CitationBadge from './CitationBadge.vue'

interface Segment {
  text: string
  annotation?: OriginalAnnotation
}

interface ActiveAnnotation {
  text: string
  annotation: OriginalAnnotation
}

const props = withDefaults(
  defineProps<{
    text: string
    annotations?: OriginalAnnotation[]
  }>(),
  {
    annotations: undefined,
  },
)

const root = ref<HTMLElement | null>(null)
const active = ref<ActiveAnnotation | null>(null)
const tip = ref({ x: 0, y: 0, width: 280 })

const segments = computed<Segment[]>(() => {
  const source = props.text
  const annotations = (props.annotations ?? []).filter(
    (item) => !!item.phrase && !!item.note && source.includes(item.phrase),
  )
  if (!annotations.length) return [{ text: source }]

  const used = new Array(source.length).fill(false)
  const hits: { start: number; end: number; annotation: OriginalAnnotation }[] = []

  for (const annotation of [...annotations].sort((a, b) => b.phrase.length - a.phrase.length)) {
    let from = 0
    while (from <= source.length - annotation.phrase.length) {
      const start = source.indexOf(annotation.phrase, from)
      if (start === -1) break
      const end = start + annotation.phrase.length
      let overlap = false
      for (let i = start; i < end; i += 1) {
        if (used[i]) {
          overlap = true
          break
        }
      }
      if (!overlap) {
        for (let i = start; i < end; i += 1) used[i] = true
        hits.push({ start, end, annotation })
        break
      }
      from = start + 1
    }
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
  active.value = { text: segment.text, annotation: segment.annotation }
  placeTip(event.currentTarget as HTMLElement)
}

function hide() {
  active.value = null
}
</script>

<template>
  <div ref="root" class="annotated-text" @mouseleave="hide">
    <template v-for="(segment, index) in segments" :key="index">
      <span
        v-if="segment.annotation"
        class="annotated-text__term"
        :class="{ 'annotated-text__term--active': active?.annotation.id === segment.annotation.id }"
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

    <div
      v-if="active"
      class="annotated-tip"
      :style="{ left: `${tip.x}px`, top: `${tip.y}px`, width: `${tip.width}px` }"
    >
      <div class="annotated-tip__head">
        <strong>{{ active.text }}</strong>
        <span>现代注解</span>
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
        <span>非原文</span>
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

.annotated-text__term {
  padding: 0 1px;
  border-bottom: 1px dotted var(--cinnabar);
  background: linear-gradient(to top, rgba(237, 224, 200, 0.55) 42%, transparent 42%);
  cursor: help;
  outline: none;
}

.annotated-text__term:hover,
.annotated-text__term:focus-visible,
.annotated-text__term--active {
  border-bottom-color: var(--cinnabar);
  background: rgba(237, 224, 200, 0.72);
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
</style>
