<script setup lang="ts">
import { computed, ref } from 'vue'
import HerbCard from '@/components/HerbCard.vue'
import { useTcmData } from '@/composables/useTcmData'

const { data, allFlavorTags, allMeridians, meridianName } = useTcmData()

const query = ref('')
const flavor = ref('')
const meridian = ref('')

const herbs = computed(() => data.value?.herbs ?? [])

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return herbs.value.filter((h) => {
    if (flavor.value && !h.flavorTags.includes(flavor.value)) return false
    if (meridian.value && !h.meridianIds.includes(meridian.value)) return false
    if (!q) return true
    const haystack = [
      h.name,
      h.pinyin,
      ...h.aliases,
      ...h.flavorTags,
      ...h.meridianIds.map((id) => meridianName(id)),
      h.properties.effects.text,
      h.properties.indications.text,
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
})

const activeFilters = computed(() => [query.value, flavor.value, meridian.value].filter(Boolean).length)

function reset() {
  query.value = ''
  flavor.value = ''
  meridian.value = ''
}

const meridianOptions = computed(() =>
  allMeridians.value.filter((m) => herbs.value.some((h) => h.meridianIds.includes(m.id))),
)
</script>

<template>
  <div class="page herb-list-page">
    <div class="container">
      <header class="page-hero">
        <div>
          <p class="eyebrow">MATERIA MEDICA / 本草</p>
          <h1>本草</h1>
          <p class="page-hero__lead">
            先看性味归经，再看功效主治。每味药的字段都挂出处；
            配伍关系另标“后世方解”，不把后世归纳冒充经典原文。
          </p>
        </div>
        <div class="page-hero__stat">
          <span>{{ herbs.length }}</span>
          <small>味样例药材</small>
          <span>{{ data?.formulas.length ?? 0 }}</span>
          <small>首方剂交叉索引</small>
        </div>
      </header>

      <section class="filter-bar paper-panel" aria-label="药材筛选">
        <label class="search-field">
          <span class="search-field__icon" aria-hidden="true">⌕</span>
          <input v-model="query" type="search" placeholder="搜索药名、拼音、功效…" />
        </label>
        <label class="select-field">
          <span>性味</span>
          <select v-model="flavor">
            <option value="">全部</option>
            <option v-for="t in allFlavorTags" :key="t" :value="t">{{ t }}</option>
          </select>
        </label>
        <label class="select-field">
          <span>归经</span>
          <select v-model="meridian">
            <option value="">全部</option>
            <option v-for="m in meridianOptions" :key="m.id" :value="m.id">{{ m.name }}</option>
          </select>
        </label>
        <button v-if="activeFilters" class="btn btn--ghost btn--small" type="button" @click="reset">
          清除筛选
        </button>
      </section>

      <div class="result-line">
        <p>
          共 <strong>{{ filtered.length }}</strong> 味
          <span v-if="activeFilters">· 已筛选 {{ activeFilters }} 项</span>
        </p>
        <p class="muted tiny">所有内容为学习样例，不构成用药建议。</p>
      </div>

      <div v-if="filtered.length" class="herb-grid">
        <HerbCard v-for="herb in filtered" :key="herb.id" :herb="herb" />
      </div>

      <div v-else class="empty-state paper-panel">
        <h2>没有找到这味药</h2>
        <p>试试只搜一个字，或清除性味、归经筛选。</p>
        <button class="btn btn--primary" type="button" @click="reset">清除筛选</button>
      </div>

      <aside class="list-note paper-panel">
        <span class="list-note__mark">按</span>
        <div>
          <strong>为什么每味药只有几行字？</strong>
          <p>
            第一版是结构原型，重点验证“字段—出处—跳转”的闭环。药性、归经、功效、主治按药典摘录；
            配伍关系按后世方书与教材归纳，并单独标注“后世方解”。
          </p>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.page-hero {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  align-items: flex-end;
  padding: 26px 0 34px;
}

.page-hero h1 {
  margin: 6px 0 12px;
  font-size: clamp(3rem, 7vw, 5.6rem);
  letter-spacing: 0.08em;
}

.page-hero__lead {
  max-width: 620px;
  color: var(--ink-soft);
  font-size: 0.98rem;
  line-height: 1.9;
}

.page-hero__stat {
  display: grid;
  grid-template-columns: auto auto;
  gap: 0 12px;
  align-items: baseline;
  padding-left: 24px;
  border-left: 1px solid var(--line-strong);
}

.page-hero__stat span {
  font-family: var(--serif);
  font-size: 2.2rem;
  line-height: 1.2;
}

.page-hero__stat small {
  color: var(--ink-soft);
  font-size: 0.76rem;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  flex-wrap: wrap;
}

.search-field {
  flex: 1 1 280px;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.45);
}

.search-field__icon {
  color: var(--ink-faint);
  font-size: 1.1rem;
}

.search-field input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--ink);
}

.select-field {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.45);
  color: var(--ink-soft);
  font-size: 0.82rem;
}

.select-field select {
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
}

.result-line {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: baseline;
  padding: 20px 2px 16px;
  color: var(--ink-soft);
  font-size: 0.82rem;
}

.result-line strong {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 1.2rem;
}

.herb-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

.herb-grid :deep(.herb-card__body) {
  padding: 14px 14px 12px;
}

.herb-grid :deep(.herb-card__title h3) {
  font-size: 1.15rem;
}

.herb-grid :deep(.herb-card__effect) {
  font-size: 0.78rem;
  line-height: 1.6;
}

.list-note {
  margin-top: 36px;
  padding: 20px 22px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.list-note__mark {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--cinnabar-pale);
  color: var(--cinnabar);
  font-family: var(--serif);
}

.list-note strong {
  font-family: var(--serif);
  font-size: 0.98rem;
}

.list-note p {
  margin-top: 4px;
  color: var(--ink-soft);
  font-size: 0.82rem;
  line-height: 1.8;
}

@media (max-width: 1240px) {
  .herb-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .herb-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .page-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-hero__stat {
    border-left: 0;
    padding-left: 0;
  }
}

@media (max-width: 700px) {
  .herb-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .result-line {
    flex-direction: column;
    gap: 4px;
  }
}

@media (max-width: 520px) {
  .herb-grid {
    grid-template-columns: 1fr;
  }
}
</style>
