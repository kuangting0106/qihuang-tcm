<script setup lang="ts">
import { computed } from 'vue'
import { useTcmData } from '@/composables/useTcmData'
import { openCitations } from '@/composables/useCitationDrawer'

const props = withDefaults(
  defineProps<{
    citationIds: string[]
    label?: string
    locator?: string
    compact?: boolean
    tone?: 'default' | 'muted'
  }>(),
  {
    label: '出处',
    compact: false,
    tone: 'default',
  },
)

const { citationsById } = useTcmData()

const citations = computed(() =>
  props.citationIds.map((id) => citationsById.value.get(id)).filter((x) => !!x),
)

const first = computed(() => citations.value[0])
const text = computed(() => {
  if (!first.value) return '出处待补'
  const locator = props.locator || first.value.locator
  const more = citations.value.length > 1 ? ` +${citations.value.length - 1}` : ''
  return `${props.label}：${first.value.work}${locator ? ` · ${locator}` : ''}${more}`
})

const typeClass = computed(() => {
  const type = first.value?.type
  return type ? `citation-badge--${type}` : ''
})

function open() {
  if (props.citationIds.length) openCitations(props.citationIds, `${props.label} · ${first.value?.work ?? ''}`)
}
</script>

<template>
  <button
    class="citation-badge"
    :class="[typeClass, { 'citation-badge--compact': compact, 'citation-badge--muted': tone === 'muted' }]"
    type="button"
    :title="text"
    @click.stop="open"
  >
    <span class="citation-badge__mark" aria-hidden="true">❖</span>
    <span class="citation-badge__text">{{ text }}</span>
  </button>
</template>
