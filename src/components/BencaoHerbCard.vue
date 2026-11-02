<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { BencaoCatalogItem } from '@/types/bencao'

const props = defineProps<{
  item: BencaoCatalogItem
  rankTitle: string
}>()

const traits = computed(() =>
  [...props.item.flavorTags, props.item.nature].filter(Boolean).slice(0, 4),
)
const meridians = computed(() => props.item.meridianNames.slice(0, 2))
const moreMeridians = computed(() => Math.max(0, props.item.meridianNames.length - 2))
const initial = computed(() => props.item.name.slice(0, 1))
</script>

<template>
  <RouterLink
    class="lecture-card"
    :to="`/bencao/${item.groupId}/${item.entryId}`"
    :aria-label="`${item.name} · ${rankTitle}讲义`"
  >
    <div class="lecture-card__cover">
      <span class="lecture-card__rank">{{ rankTitle }}</span>
      <span class="lecture-card__seal" aria-hidden="true">{{ initial }}</span>
      <span class="lecture-card__badge">讲义整理</span>
    </div>

    <div class="lecture-card__body">
      <div class="lecture-card__title">
        <div>
          <h3>{{ item.name }}</h3>
          <p>{{ item.pinyin }}</p>
        </div>
        <span class="lecture-card__arrow" aria-hidden="true">→</span>
      </div>

      <div class="lecture-card__tags">
        <span v-for="t in traits" :key="t" class="chip chip--cinnabar">{{ t }}</span>
        <span v-for="m in meridians" :key="m" class="chip chip--jade">{{ m }}</span>
        <span v-if="moreMeridians" class="chip chip--jade">+{{ moreMeridians }}</span>
        <span v-if="item.meridianPending" class="chip lecture-card__pending">归经待考</span>
      </div>

      <p class="lecture-card__effect">{{ item.effects || item.summary || '讲义原文待补' }}</p>

      <div class="lecture-card__foot">
        <span class="lecture-card__source">倪海厦讲义</span>
        <span v-if="item.hasProcessing" class="lecture-card__processing">附炮制</span>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.lecture-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: rgba(255, 252, 245, 0.62);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.lecture-card:hover {
  transform: translateY(-4px);
  border-color: rgba(176, 138, 74, 0.6);
  box-shadow: var(--shadow);
}

.lecture-card__cover {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 4 / 3;
  background:
    radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.7), transparent 46%),
    linear-gradient(145deg, var(--paper-2), rgba(224, 236, 226, 0.55));
  overflow: hidden;
}

.lecture-card__cover::before {
  content: '';
  position: absolute;
  inset: 12px;
  border: 1px solid rgba(120, 108, 88, 0.22);
  border-radius: 10px;
}

.lecture-card__seal {
  color: color-mix(in srgb, var(--cinnabar) 82%, #6f2f1e);
  font-family: var(--serif);
  font-size: 3.1rem;
  line-height: 1;
  opacity: 0.72;
}

.lecture-card__rank {
  position: absolute;
  top: 14px;
  left: 16px;
  color: var(--ink-faint);
  font-size: 0.62rem;
  letter-spacing: 0.16em;
}

.lecture-card__badge {
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

.lecture-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  padding: 18px 18px 16px;
}

.lecture-card__title {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
}

.lecture-card__title h3 {
  font-size: 1.3rem;
}

.lecture-card__title p {
  margin-top: 2px;
  color: var(--ink-faint);
  font-size: 0.72rem;
  letter-spacing: 0.06em;
}

.lecture-card__arrow {
  color: var(--ink-faint);
  transition: transform 0.2s ease, color 0.2s ease;
}

.lecture-card:hover .lecture-card__arrow {
  color: var(--cinnabar);
  transform: translateX(3px);
}

.lecture-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.lecture-card__pending {
  border-color: var(--line-strong);
  color: var(--ink-faint);
}

.lecture-card__effect {
  color: var(--ink-soft);
  font-size: 0.82rem;
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.lecture-card__foot {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid var(--line);
  color: var(--ink-faint);
  font-size: 0.66rem;
}

.lecture-card__processing {
  padding: 1px 7px;
  border: 1px solid rgba(176, 138, 74, 0.4);
  border-radius: 999px;
  color: var(--gold);
}
</style>
