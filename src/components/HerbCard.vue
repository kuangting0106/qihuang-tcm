<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { Herb } from '@/types/tcm'
import { useTcmData } from '@/composables/useTcmData'

const props = defineProps<{ herb: Herb; meridianNames?: Record<string, string> }>()
const { meridianName } = useTcmData()

const image = computed(() => props.herb.images[0])

function thumbUrl(url: string) {
  if (!/\/images\/herbs\/real\/[^/]+\.(jpe?g|png)$/i.test(url)) return url
  return url
    .replace('/images/herbs/real/', '/images/herbs/real/thumbs/')
    .replace(/\.(jpe?g|png)$/i, '.jpg')
}
const meridianLabels = computed(() =>
  props.herb.meridianIds.map((id) => props.meridianNames?.[id] ?? meridianName(id)),
)
</script>

<template>
  <RouterLink :to="`/herbs/${herb.id}`" class="herb-card">
    <div class="herb-card__image">
      <img :src="thumbUrl(image.url)" :alt="image.alt" loading="lazy" />
      <span class="herb-card__badge">{{ herb.verification === 'reference' ? '药典依据' : '待核验' }}</span>
    </div>
    <div class="herb-card__body">
      <div class="herb-card__title">
        <div>
          <h3>{{ herb.name }}</h3>
          <p>{{ herb.pinyin }}</p>
        </div>
        <span class="herb-card__arrow" aria-hidden="true">→</span>
      </div>
      <div class="herb-card__tags">
        <span v-for="t in herb.flavorTags" :key="t" class="chip chip--cinnabar">{{ t }}</span>
        <span v-for="m in meridianLabels.slice(0, 2)" :key="m" class="chip chip--jade">{{ m }}</span>
      </div>
      <p class="herb-card__effect">{{ herb.properties.effects.text }}</p>
    </div>
  </RouterLink>
</template>

<style scoped>
.herb-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: rgba(255, 252, 245, 0.62);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.herb-card:hover {
  transform: translateY(-4px);
  border-color: rgba(176, 138, 74, 0.6);
  box-shadow: var(--shadow);
}

.herb-card__image {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: var(--paper-2);
}

.herb-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.herb-card:hover .herb-card__image img {
  transform: scale(1.03);
}

.herb-card__badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(244, 239, 228, 0.88);
  color: var(--jade);
  font-size: 0.66rem;
  backdrop-filter: blur(5px);
}

.herb-card__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 18px 16px;
}

.herb-card__title {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
}

.herb-card__title h3 {
  font-size: 1.3rem;
}

.herb-card__title p {
  margin-top: 2px;
  color: var(--ink-faint);
  font-size: 0.72rem;
  letter-spacing: 0.06em;
}

.herb-card__arrow {
  color: var(--ink-faint);
  transition: transform 0.2s ease, color 0.2s ease;
}

.herb-card:hover .herb-card__arrow {
  color: var(--cinnabar);
  transform: translateX(3px);
}

.herb-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.herb-card__effect {
  color: var(--ink-soft);
  font-size: 0.82rem;
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
