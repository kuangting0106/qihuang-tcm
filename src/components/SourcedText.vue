<script setup lang="ts">
import { computed } from 'vue'
import type { SourcedText } from '@/types/tcm'
import { KIND_LABELS } from '@/types/tcm'
import CitationBadge from './CitationBadge.vue'

const props = withDefaults(
  defineProps<{
    claim: SourcedText
    label?: string
    showKind?: boolean
    block?: boolean
  }>(),
  {
    label: undefined,
    showKind: true,
    block: false,
  },
)

const kindClass = computed(() => `kind-badge kind-badge--${props.claim.kind}`)
const citationLabel = computed(() => {
  if (props.label) return props.label
  if (props.claim.kind === 'quote') return '原文'
  if (props.claim.kind === 'analysis') return '后世方解'
  return '依据'
})
</script>

<template>
  <component :is="block ? 'div' : 'span'" class="sourced-text" :class="{ 'sourced-text--block': block }">
    <span class="sourced-text__content">{{ claim.text }}</span>
    <span v-if="showKind" :class="kindClass">{{ KIND_LABELS[claim.kind] }}</span>
    <CitationBadge
      :citation-ids="claim.citationIds"
      :label="citationLabel"
      :locator="claim.locator"
      :tone="claim.kind === 'analysis' ? 'muted' : 'default'"
      compact
    />
  </component>
</template>
