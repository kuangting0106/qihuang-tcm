<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

export interface HerbIndexItem {
  id: string
  name: string
  pinyin?: string
  flavors: string[]
  meridians: string[]
  effects: string
  href: string
  cover?: string
  coverAlt?: string
  seal: string
  badge: string
  source: string
}

const props = defineProps<{ item: HerbIndexItem }>()

const visibleFlavors = computed(() => props.item.flavors.filter(Boolean).slice(0, 3))
const visibleMeridians = computed(() => props.item.meridians.filter(Boolean).slice(0, 2))
const extraMeridians = computed(() =>
  Math.max(0, props.item.meridians.filter(Boolean).length - visibleMeridians.value.length),
)
</script>

<template>
  <RouterLink class="herb-index-card" :to="item.href">
    <div class="herb-index-card__cover" :class="{ 'herb-index-card__cover--empty': !item.cover }">
      <img v-if="item.cover" :src="item.cover" :alt="item.coverAlt || item.name" loading="lazy" />
      <template v-else>
        <span class="herb-index-card__seal" aria-hidden="true">{{ item.seal }}</span>
        <span class="herb-index-card__rank">{{ item.badge }}</span>
      </template>
      <span v-if="item.cover" class="herb-index-card__badge">{{ item.badge }}</span>
    </div>

    <div class="herb-index-card__body">
      <div class="herb-index-card__title">
        <h3>{{ item.name }}</h3>
        <span aria-hidden="true">→</span>
      </div>
      <p v-if="item.pinyin" class="herb-index-card__pinyin">{{ item.pinyin }}</p>

      <div class="herb-index-card__chips">
        <span v-for="flavor in visibleFlavors" :key="flavor" class="mini-chip mini-chip--flavor">{{ flavor }}</span>
        <span v-for="meridian in visibleMeridians" :key="meridian" class="mini-chip mini-chip--meridian">{{ meridian }}</span>
        <span v-if="extraMeridians" class="mini-chip mini-chip--meridian">+{{ extraMeridians }}</span>
        <span v-if="!item.meridians.length" class="mini-chip mini-chip--muted">归经待考</span>
      </div>

      <p class="herb-index-card__effects">{{ item.effects || '讲义未载功效，待考。' }}</p>
      <p class="herb-index-card__source">{{ item.source }}</p>
    </div>
  </RouterLink>
</template>

<style scoped>
.herb-index-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: rgba(255, 252, 245, 0.72);
  color: inherit;
  text-decoration: none;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.herb-index-card:hover {
  transform: translateY(-4px);
  border-color: var(--jade);
  box-shadow: var(--shadow-soft);
}

.herb-index-card__cover {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: linear-gradient(150deg, #e7efe6, #f3eee1 58%, #eadfce);
}

.herb-index-card__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.herb-index-card:hover .herb-index-card__cover img {
  transform: scale(1.03);
}

.herb-index-card__cover--empty {
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 8px;
  background:
    radial-gradient(circle at 26% 20%, rgba(255, 255, 255, 0.82), transparent 46%),
    repeating-linear-gradient(135deg, rgba(122, 145, 123, 0.07) 0 1px, transparent 1px 12px),
    linear-gradient(150deg, #e9f0e8, #f5efe2 60%, #ecdfcd);
}

.herb-index-card__seal {
  display: grid;
  place-content: center;
  width: 58px;
  height: 58px;
  border: 1px solid var(--cinnabar);
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 1.9rem;
  line-height: 1;
}

.herb-index-card__rank {
  color: var(--ink-faint);
  font-size: 0.62rem;
  letter-spacing: 0.14em;
}

.herb-index-card__badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(255, 252, 245, 0.92);
  color: var(--jade-deep, #3f5c4a);
  font-size: 0.6rem;
  letter-spacing: 0.04em;
}

.herb-index-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  padding: 15px 16px 14px;
}

.herb-index-card__title {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: baseline;
}

.herb-index-card__title h3 {
  font-family: var(--serif);
  font-size: 1.28rem;
  font-weight: 400;
  letter-spacing: 0.04em;
}

.herb-index-card__title span {
  color: var(--ink-faint);
  font-size: 0.9rem;
}

.herb-index-card__pinyin {
  color: var(--ink-faint);
  font-size: 0.68rem;
  letter-spacing: 0.08em;
}

.herb-index-card__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 2px;
}

.mini-chip {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.64rem;
  line-height: 1.6;
  white-space: nowrap;
}

.mini-chip--flavor {
  border: 1px solid color-mix(in srgb, var(--cinnabar) 26%, transparent);
  background: rgba(190, 92, 72, 0.07);
  color: #8c4a3c;
}

.mini-chip--meridian {
  border: 1px solid color-mix(in srgb, var(--jade) 26%, transparent);
  background: rgba(86, 120, 96, 0.07);
  color: #4f6b56;
}

.mini-chip--muted {
  border: 1px dashed var(--line-strong);
  color: var(--ink-faint);
}

.herb-index-card__effects {
  display: -webkit-box;
  overflow: hidden;
  margin-top: 2px;
  color: var(--ink-soft);
  font-size: 0.76rem;
  line-height: 1.62;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.herb-index-card__source {
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px dashed var(--line);
  color: var(--ink-faint);
  font-size: 0.62rem;
  line-height: 1.5;
}

@media (max-width: 700px) {
  .herb-index-card__body {
    padding: 12px 13px;
  }

  .herb-index-card__title h3 {
    font-size: 1.15rem;
  }
}
</style>
