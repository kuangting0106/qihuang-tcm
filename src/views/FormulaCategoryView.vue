<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import FormulaCard from '@/components/FormulaCard.vue'
import { useFormulaApi } from '@/composables/useFormulaApi'
import type { FormulaSummary } from '@/composables/useFormulaApi'
import {
  FORMULA_BOOKS,
  classByKey,
  formulasForClass,
  formulasForSource,
  searchFormulas,
} from '@/data/formula-categories'

const route = useRoute()
const { loading, error, fetchFormulaList } = useFormulaApi()
const formulas = ref<FormulaSummary[]>([])
const loadError = ref('')
const query = ref('')

const isClass = computed(() => route.name === 'formula-class')
const isSearch = computed(() => route.name === 'formula-search')
const bookKey = computed(() => String(route.params.book ?? ''))
const chapterKey = computed(() => String(route.params.chapter ?? ''))
const classKey = computed(() => String(route.params.key ?? ''))
const searchQuery = computed(() => String(route.query.q ?? '').trim())
const bookInfo = computed(() => FORMULA_BOOKS.find((item) => item.key === bookKey.value))
const classInfo = computed(() => (isClass.value ? classByKey(classKey.value) : undefined))

const valid = computed(() => {
  if (isClass.value) return Boolean(classInfo.value)
  if (isSearch.value) return Boolean(searchQuery.value)
  return Boolean(bookInfo.value && chapterKey.value)
})

const title = computed(() => {
  if (isClass.value) return classInfo.value?.title ?? '类方'
  if (isSearch.value) return `搜索“${searchQuery.value}”`
  return chapterKey.value
})

const kicker = computed(() => {
  if (isClass.value) return 'FORMULA CLASS / 主药类方'
  if (isSearch.value) return 'FORMULA SEARCH / 方剂检索'
  return `FORMULA SOURCE / ${bookInfo.value?.label ?? '经典出处'}`
})

const lead = computed(() => {
  if (isClass.value) {
    return '按组成中的主药检索，便于类方学习。'
  }
  if (isSearch.value) {
    return '按方名、拼音、功效、症状与组成药材检索；方名或拼音精确匹配优先。'
  }
  return bookInfo.value?.description ?? ''
})

const items = computed(() => {
  if (isClass.value) return formulasForClass(formulas.value, classKey.value)
  if (isSearch.value) return searchFormulas(formulas.value, searchQuery.value)
  return formulasForSource(formulas.value, bookKey.value, chapterKey.value)
})

const compositionCount = computed(() =>
  items.value.reduce((total, formula) => total + formula.composition.length, 0),
)

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

const visibleFormulas = computed(() => {
  const q = normalize(query.value.trim())
  if (!q) return items.value
  return items.value.filter((formula) => {
    const haystack = normalize(
      [
        formula.name,
        formula.pinyin,
        formula.effectsText,
        ...formula.symptomTags,
        ...formula.composition.map((item) => item.herbName ?? item.herbId),
      ].join(' '),
    )
    return haystack.includes(q)
  })
})

const displayError = computed(() => loadError.value || error.value)

async function load() {
  try {
    formulas.value = await fetchFormulaList()
  } catch (err: unknown) {
    loadError.value = err instanceof Error ? err.message : '方剂目录加载失败'
  }
}

onMounted(load)

watch([bookKey, chapterKey, classKey, searchQuery], () => {
  query.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
})
</script>

<template>
  <div class="page formula-category-page">
    <div class="container">
      <nav class="breadcrumbs">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/formulas">方剂</RouterLink>
        <span>/</span>
        <span v-if="isSearch">方剂检索</span>
        <span v-else-if="isClass">主药类方</span>
        <template v-else>
          <span>{{ bookInfo?.label ?? '经典出处' }}</span>
          <span>/</span>
        </template>
        <span>{{ title }}</span>
      </nav>

      <p v-if="loading && !formulas.length" class="empty-state paper-panel">正在加载方剂…</p>
      <div v-else-if="displayError && !formulas.length" class="empty-state paper-panel">
        <h2>方剂目录没有打开</h2>
        <p>{{ displayError }}</p>
        <button class="btn btn--primary" type="button" @click="load">重试</button>
      </div>

      <template v-else-if="valid">
        <header class="category-hero">
          <div>
            <p class="eyebrow">{{ kicker }}</p>
            <h1>{{ title }}</h1>
            <p class="category-hero__lead">{{ lead }}</p>
            <p v-if="isClass" class="category-hero__note">
              以组成中含该主药的方剂归入一类，只作检索入口，不是传统类方定论。
            </p>
          </div>
          <div class="category-hero__stat">
            <span>{{ items.length }}</span>
            <small>首方剂</small>
            <template v-if="compositionCount">
              <span>{{ compositionCount }}</span>
              <small>条组成记录</small>
            </template>
          </div>
        </header>

        <template v-if="items.length">
          <section v-if="!isSearch" class="category-tools paper-panel" aria-label="在本分类中搜索">
            <label class="category-search">
              <span aria-hidden="true">⌕</span>
              <input v-model="query" type="search" placeholder="在本分类中搜索方名、拼音或药材…" />
            </label>
            <p class="category-count">
              共 <strong>{{ visibleFormulas.length }}</strong> 首
              <span v-if="query.trim()">/ {{ items.length }}</span>
            </p>
          </section>

          <div v-else class="category-tools paper-panel category-tools--count">
            <p class="category-count">
              共 <strong>{{ visibleFormulas.length }}</strong> 首
            </p>
          </div>

          <div v-if="visibleFormulas.length" class="formula-grid">
            <FormulaCard v-for="formula in visibleFormulas" :key="formula.id" :formula="formula" />
          </div>
          <div v-else class="empty-state paper-panel">
            <h2>没有找到这首方</h2>
            <p>试试方名或其中一味药。</p>
            <button class="btn btn--primary" type="button" @click="query = ''">清除搜索</button>
          </div>
        </template>

        <div v-else-if="isSearch" class="empty-state paper-panel">
          <h2>没有找到相关方剂</h2>
          <p>试试只输入方名中的两个字，或换一味组成药材。</p>
        </div>

        <div v-else class="empty-state paper-panel">
          <h2>这个分类下暂时没有方剂</h2>
          <p>返回方剂首页，换一个经典篇章或主药类方查看。</p>
        </div>

        <div class="category-back">
          <RouterLink class="btn btn--ghost" to="/formulas">← 返回方剂分类</RouterLink>
        </div>
      </template>

      <div v-else class="empty-state paper-panel">
        <h2>没有找到这个分类</h2>
        <p>链接里的分类名称可能不正确，返回方剂首页重新选择。</p>
        <RouterLink class="btn btn--primary" to="/formulas">返回方剂首页</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.breadcrumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 18px 0 8px;
  color: var(--ink-faint);
  font-size: 0.76rem;
}

.breadcrumbs a:hover {
  color: var(--cinnabar);
}

.category-hero {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  align-items: flex-end;
  padding: 18px 0 30px;
}

.category-hero h1 {
  margin: 6px 0 12px;
  font-size: clamp(2.2rem, 5vw, 4rem);
  letter-spacing: 0.06em;
}

.category-hero__lead {
  max-width: 720px;
  color: var(--ink-soft);
  font-size: 0.94rem;
  line-height: 1.9;
}

.category-hero__note {
  display: inline-block;
  margin-top: 14px;
  padding: 7px 13px;
  border-left: 2px solid var(--cinnabar);
  background: rgba(255, 255, 255, 0.42);
  color: var(--ink);
  font-size: 0.82rem;
}

.category-hero__stat {
  display: grid;
  grid-template-columns: auto auto;
  gap: 0 12px;
  align-items: baseline;
  padding-left: 24px;
  border-left: 1px solid var(--line-strong);
}

.category-hero__stat span {
  font-family: var(--serif);
  font-size: 2.2rem;
  line-height: 1.2;
}

.category-hero__stat small {
  color: var(--ink-soft);
  font-size: 0.76rem;
}

.category-tools {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.category-search {
  flex: 1 1 300px;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.45);
  color: var(--ink-faint);
}

.category-search input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--ink);
}

.category-tools--count {
  justify-content: flex-end;
}

.category-count {
  color: var(--ink-faint);
  font-size: 0.78rem;
}

.category-count strong {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 1.05rem;
}

.formula-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.category-back {
  margin-top: 26px;
}

@media (max-width: 960px) {
  .category-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .category-hero__stat {
    padding-left: 0;
    border-left: 0;
  }

  .formula-grid {
    grid-template-columns: 1fr;
  }
}
</style>
