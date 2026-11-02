<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { Formula } from '@/types/tcm'
import { useTcmData } from '@/composables/useTcmData'
import CitationBadge from './CitationBadge.vue'

const props = defineProps<{ formula: Formula }>()
const { citationsById, herbName } = useTcmData()

const citation = computed(() => citationsById.value.get(props.formula.sourceCitationId))
const herbNames = computed(() => props.formula.composition.map((c) => herbName(c.herbId)))
const visibleNames = computed(() => herbNames.value.slice(0, 6))
const rest = computed(() => herbNames.value.length - visibleNames.value.length)

const roleCounts = computed(() => {
  const map = new Map<string, number>()
  for (const c of props.formula.composition) map.set(c.role, (map.get(c.role) ?? 0) + 1)
  return [...map.entries()]
})
</script>

<template>
  <RouterLink :to="`/formulas/${formula.id}`" class="formula-card">
    <div class="formula-card__top">
      <div>
        <p class="eyebrow">{{ citation?.work }} · {{ citation?.locator }}</p>
        <h3>{{ formula.name }}</h3>
        <p class="formula-card__pinyin">{{ formula.pinyin }}</p>
      </div>
      <span class="formula-card__count">{{ formula.composition.length }} 味</span>
    </div>

    <p class="formula-card__effect">{{ formula.effects.text }}</p>

    <div class="formula-card__herbs">
      <span v-for="name in visibleNames" :key="name" class="chip chip--jade">{{ name }}</span>
      <span v-if="rest > 0" class="chip">+{{ rest }}</span>
    </div>

    <div class="formula-card__roles">
      <span v-for="[role, count] in roleCounts" :key="role" class="role-pill" :class="`role-pill--${role}`">
        {{ role }} {{ count }}
      </span>
    </div>

    <div class="formula-card__foot">
      <CitationBadge :citation-ids="[formula.sourceCitationId]" compact />
      <span class="formula-card__arrow" aria-hidden="true">→</span>
    </div>
  </RouterLink>
</template>

<style scoped>
.formula-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background:
    linear-gradient(155deg, rgba(255, 252, 245, 0.76), rgba(235, 226, 210, 0.36)),
    repeating-linear-gradient(0deg, transparent 0 31px, rgba(32, 37, 34, 0.03) 31px 32px);
  box-shadow: var(--shadow-soft);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.formula-card:hover {
  transform: translateY(-4px);
  border-color: rgba(163, 58, 43, 0.45);
  box-shadow: var(--shadow);
}

.formula-card__top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.formula-card__top h3 {
  margin: 4px 0 2px;
  font-size: 1.9rem;
}

.formula-card__pinyin {
  color: var(--ink-faint);
  font-family: var(--serif);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
}

.formula-card__count {
  flex-shrink: 0;
  padding: 4px 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--ink-soft);
  font-size: 0.72rem;
}

.formula-card__effect {
  color: var(--ink);
  font-family: var(--serif);
  font-size: 1.02rem;
}

.formula-card__herbs,
.formula-card__roles {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.role-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  background: #7f8c8d;
  color: #fff;
  font-size: 0.68rem;
  font-weight: 600;
}

.role-pill::before {
  margin-right: 3px;
  font-size: 0.58em;
}

.role-pill--君 {
  background: #c0392b;
}

.role-pill--君::before {
  content: "●";
}

.role-pill--臣 {
  background: #d68910;
}

.role-pill--臣::before {
  content: "■";
}

.role-pill--佐 {
  background: #1e8449;
}

.role-pill--佐::before {
  content: "▲";
}

.role-pill--使 {
  background: #2e5fa3;
}

.role-pill--使::before {
  content: "◆";
}

.role-pill--佐使 {
  background: #7d3c98;
}

.role-pill--佐使::before {
  content: "◈";
}

.formula-card__foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}

.formula-card__arrow {
  color: var(--cinnabar);
}
</style>
