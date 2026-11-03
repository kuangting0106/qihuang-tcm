<script setup lang="ts">
import { computed, ref } from 'vue'
import quickref from '@/data/acupuncture-quickref.json'

const query = ref('')
const activeCategory = ref('cat-01')

const categories = computed(() => quickref.categories)
const currentCategory = computed(() =>
  quickref.categories.find((category) => category.id === activeCategory.value) ?? null,
)
const allConditions = computed(() =>
  quickref.categories.flatMap((category) =>
    category.conditions.map((condition) => ({
      ...condition,
      categoryId: category.id,
      categoryTitle: category.title,
    })),
  ),
)
const filtered = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  let list = allConditions.value
  if (activeCategory.value !== 'all') {
    list = list.filter((item) => item.categoryId === activeCategory.value)
  }
  if (keyword) {
    list = list.filter((item) =>
      [item.title, item.points, item.note, item.case, item.extra, item.categoryTitle]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(keyword),
    )
  }
  return list
})
</script>

<template>
  <section class="conditions" aria-labelledby="conditions-title">
    <div class="conditions__head">
      <div>
        <p class="eyebrow">CONDITION POINTS / 病症常针</p>
        <h2 id="conditions-title">病症常针穴位</h2>
        <p class="conditions__source">
          据《215条针灸经验穴位和31条透针透穴》整理，按原书 11 类归档，保留穴位、备注与医案。
          原题作 215 条，正文逐条清点为 {{ quickref.conditionCount }} 条；未补写原文没有的条目。
        </p>
      </div>
      <span class="chip chip--cinnabar">{{ quickref.conditionCount }} 条</span>
    </div>

    <details class="conditions__preamble paper-panel">
      <summary>卷首临床随笔 · {{ quickref.preamble.length }} 则</summary>
      <ul>
        <li v-for="(item, index) in quickref.preamble" :key="index">{{ item }}</li>
      </ul>
    </details>

    <div class="conditions__tools">
      <label class="conditions__search">
        <span>搜索病症或穴位</span>
        <input v-model="query" type="search" placeholder="如：头痛、失眠、足三里" />
      </label>
      <div class="conditions__categories" role="tablist" aria-label="病症分类">
        <button
          type="button"
          :class="{ active: activeCategory === 'all' }"
          @click="activeCategory = 'all'"
        >
          全部 <small>{{ quickref.conditionCount }}</small>
        </button>
        <button
          v-for="category in categories"
          :key="category.id"
          type="button"
          :class="{ active: activeCategory === category.id }"
          @click="activeCategory = category.id"
        >
          {{ category.title }} <small>{{ category.conditions.length }}</small>
        </button>
      </div>
    </div>

    <div class="conditions__meta">
      <span v-if="query.trim()">搜索“{{ query.trim() }}”：{{ filtered.length }} 条</span>
      <span v-else-if="currentCategory">{{ currentCategory.title }} · {{ filtered.length }} 条</span>
      <span v-else>全部 {{ filtered.length }} 条</span>
    </div>

    <div v-if="filtered.length" class="conditions__list">
      <article v-for="item in filtered" :id="item.id" :key="item.id" class="condition paper-panel">
        <header class="condition__head">
          <span class="condition__index">{{ String(item.order).padStart(2, '0') }}</span>
          <div>
            <h3>{{ item.title }}</h3>
            <p class="condition__category">{{ item.categoryTitle }}</p>
          </div>
        </header>
        <div class="condition__points">
          <span>常用穴位</span>
          <p>{{ item.points }}</p>
        </div>
        <p v-if="item.note" class="condition__note">备注：{{ item.note }}</p>
        <div v-if="item.extra" class="condition__extra">
          <span>原文讲解</span>
          <p>{{ item.extra }}</p>
        </div>
        <blockquote v-if="item.case" class="condition__case">
          <span>【医案】</span>
          <p>{{ item.case }}</p>
        </blockquote>
      </article>
    </div>
    <p v-else class="conditions__empty paper-panel">没有匹配的病症，换一个关键词试试。</p>
  </section>
</template>

<style scoped>
.conditions__head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-end;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line-strong);
}

.conditions__head h2 {
  margin: 4px 0 6px;
  font-family: var(--serif);
  font-size: 1.6rem;
  font-weight: 400;
}

.conditions__source {
  max-width: 760px;
  color: var(--ink-faint);
  font-size: 0.68rem;
  line-height: 1.75;
}

.conditions__tools {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.conditions__preamble {
  margin-top: 12px;
  padding: 10px 14px;
}

.conditions__preamble summary {
  color: var(--jade);
  font-family: var(--serif);
  font-size: 0.82rem;
  cursor: pointer;
}

.conditions__preamble ul {
  display: grid;
  gap: 5px;
  margin: 9px 0 0;
  padding-left: 1.15em;
  color: var(--ink-soft);
  font-size: 0.68rem;
  line-height: 1.75;
}

.conditions__search {
  display: flex;
  gap: 10px;
  align-items: center;
  max-width: 520px;
}

.conditions__search span {
  flex-shrink: 0;
  color: var(--ink-faint);
  font-size: 0.66rem;
  letter-spacing: 0.08em;
}

.conditions__search input {
  width: 100%;
  padding: 8px 11px;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: rgba(255, 252, 245, 0.72);
  color: var(--ink);
  font: inherit;
  font-size: 0.72rem;
}

.conditions__categories {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 3px;
}

.conditions__categories button {
  flex-shrink: 0;
  padding: 6px 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: transparent;
  color: var(--ink-soft);
  font: inherit;
  font-size: 0.66rem;
  white-space: nowrap;
  cursor: pointer;
}

.conditions__categories button small {
  margin-left: 4px;
  color: var(--ink-faint);
  font-size: 0.58rem;
}

.conditions__categories button.active {
  border-color: var(--jade);
  background: rgba(40, 92, 69, 0.08);
  color: var(--jade);
}

.conditions__meta {
  margin: 10px 0 12px;
  color: var(--ink-faint);
  font-size: 0.64rem;
  letter-spacing: 0.06em;
}

.conditions__list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.condition {
  padding: 15px 16px;
  scroll-margin-top: 96px;
}

.condition__head {
  display: flex;
  gap: 9px;
  align-items: flex-start;
}

.condition__index {
  flex-shrink: 0;
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.78rem;
}

.condition h3 {
  font-family: var(--serif);
  font-size: 1.06rem;
  font-weight: 500;
  line-height: 1.45;
}

.condition__category {
  margin-top: 1px;
  color: var(--ink-faint);
  font-size: 0.58rem;
  letter-spacing: 0.04em;
}

.condition__points {
  margin-top: 8px;
  padding: 7px 9px;
  border-left: 2px solid var(--jade);
  background: rgba(228, 239, 229, 0.34);
}

.condition__points span,
.condition__extra span {
  color: var(--jade);
  font-size: 0.58rem;
  letter-spacing: 0.1em;
}

.condition__points p {
  margin-top: 2px;
  color: var(--ink-soft);
  font-size: 0.72rem;
  line-height: 1.7;
}

.condition__note {
  margin-top: 7px;
  color: var(--cinnabar);
  font-size: 0.66rem;
  line-height: 1.65;
}

.condition__extra {
  margin-top: 8px;
  padding-top: 7px;
  border-top: 1px dashed var(--line);
}

.condition__extra p {
  margin-top: 3px;
  color: var(--ink-faint);
  font-size: 0.66rem;
  line-height: 1.75;
}

.condition__case {
  margin: 9px 0 0;
  padding: 8px 10px;
  border: 1px dashed var(--line-strong);
  background: rgba(190, 92, 72, 0.035);
}

.condition__case span {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.66rem;
}

.condition__case p {
  margin-top: 3px;
  color: var(--ink-soft);
  font-size: 0.68rem;
  line-height: 1.75;
}

.conditions__empty {
  padding: 22px;
  color: var(--ink-faint);
  font-size: 0.76rem;
  text-align: center;
}

@media (max-width: 900px) {
  .conditions__list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .conditions__head {
    align-items: flex-start;
    flex-direction: column;
  }

  .conditions__search {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
