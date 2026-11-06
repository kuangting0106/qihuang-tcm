<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { formatCharCount } from '@/composables/useBencaoLectures'
import { loadBencaoDachengIndex } from '@/composables/useBencaoDacheng'
import type { BencaoDachengIndex } from '@/types/bencao-dacheng'

const PAGE_SIZE = 30

const index = ref<BencaoDachengIndex | null>(null)
const loading = ref(true)
const error = ref('')
const query = ref('')
const activeCategory = ref('全部')
const limit = ref(PAGE_SIZE)

function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, '')
}

const categories = computed(() => index.value?.categories ?? [])

const filtered = computed(() => {
  const items = index.value?.items ?? []
  const keyword = normalize(query.value.trim())
  return items.filter((item) => {
    if (activeCategory.value !== '全部' && item.categoryTitle !== activeCategory.value) return false
    if (!keyword) return true
    return normalize(
      [item.name, item.pinyin, item.categoryTitle, item.summary, ...(item.aliases ?? [])].join(' '),
    ).includes(keyword)
  })
})

const visible = computed(() => filtered.value.slice(0, limit.value))
const hiddenCount = computed(() => Math.max(0, filtered.value.length - visible.value.length))

function selectCategory(name: string) {
  activeCategory.value = name
}

function loadMore() {
  limit.value += PAGE_SIZE
}

watch([query, activeCategory], () => {
  limit.value = PAGE_SIZE
})

onMounted(async () => {
  try {
    index.value = await loadBencaoDachengIndex()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : '本草大全加载失败'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page bencao-dacheng">
    <div class="container">
      <nav class="breadcrumbs" aria-label="面包屑">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/herbs">本草</RouterLink>
        <span>/</span>
        <span>本草大全</span>
      </nav>

      <header class="dacheng-hero paper-panel">
        <div class="dacheng-hero__copy">
          <p class="eyebrow">MATERIA MEDICA / 本草大全</p>
          <h1>本草大全 · 中草药大全</h1>
          <p class="dacheng-hero__lead">
            据《本草纲目》引文与《中草药大全》整理。每味药保留原书引文、性味归经、功能主治、用法用量、
            使用注意及炮制、鉴别、附方等原文；未核实的图片与剂量不作补写。
          </p>
          <div class="dacheng-hero__stats">
            <span class="chip chip--cinnabar">{{ index?.total ?? 0 }} 味</span>
            <span class="chip chip--gold">{{ categories.length }} 个功效分类</span>
            <span class="chip">{{ index?.withImages ?? 0 }} 张图片</span>
          </div>
        </div>
        <div class="dacheng-hero__seal" aria-hidden="true">本</div>
      </header>

      <p v-if="loading" class="data-loading">正在展开本草大全…</p>
      <div v-else-if="error" class="data-error paper-panel">
        <p>{{ error }}</p>
        <button class="btn btn--primary" type="button" @click="$router.go(0)">重新加载</button>
      </div>

      <template v-else>
        <section class="dacheng-tools paper-panel" aria-label="搜索与分类">
          <label class="dacheng-search">
            <span class="eyebrow">SEARCH / 检索</span>
            <input
              v-model="query"
              type="search"
              placeholder="搜药名、拼音、别名、功效或主治…"
              autocomplete="off"
            />
          </label>
          <div class="dacheng-categories" role="group" aria-label="按功效分类筛选">
            <button
              class="dacheng-category"
              :class="{ 'dacheng-category--active': activeCategory === '全部' }"
              type="button"
              @click="selectCategory('全部')"
            >
              全部 <span>{{ index?.total ?? 0 }}</span>
            </button>
            <button
              v-for="category in categories"
              :key="category.id"
              class="dacheng-category"
              :class="{ 'dacheng-category--active': activeCategory === category.title }"
              type="button"
              @click="selectCategory(category.title)"
            >
              {{ category.title }} <span>{{ category.count }}</span>
            </button>
          </div>
        </section>

        <div class="dacheng-result-head">
          <p class="eyebrow">ENTRIES / 药材条目</p>
          <span v-if="filtered.length">共 {{ filtered.length }} 味，当前显示 {{ visible.length }} 味</span>
          <span v-else>没有匹配的药材</span>
        </div>

        <section v-if="visible.length" class="dacheng-grid" aria-label="本草条目">
          <RouterLink
            v-for="item in visible"
            :key="item.id"
            class="dacheng-card"
            :to="`/bencao/dacheng/${item.id}`"
          >
            <div class="dacheng-card__image">
              <img v-if="item.image" :src="item.image.url" :alt="item.image.alt" loading="lazy" />
              <span v-else class="dacheng-card__placeholder" aria-hidden="true">药</span>
              <span class="dacheng-card__category">{{ item.categoryTitle }}</span>
            </div>
            <div class="dacheng-card__body">
              <div class="dacheng-card__title">
                <h2>{{ item.name }}</h2>
                <span>{{ item.pinyin }}</span>
              </div>
              <p v-if="item.aliases.length" class="dacheng-card__alias">
                又名：{{ item.aliases.slice(0, 4).join('、') }}
              </p>
              <p class="dacheng-card__summary">{{ item.summary }}</p>
              <div class="dacheng-card__foot">
                <span>{{ item.docCount }} 种来源 · {{ formatCharCount(item.charCount) }}</span>
                <span aria-hidden="true">→</span>
              </div>
            </div>
          </RouterLink>
        </section>

        <p v-else class="dacheng-empty paper-panel">
          没有找到“{{ query || activeCategory }}”相关药材。可换一个药名、拼音或功效关键词。
        </p>

        <div v-if="hiddenCount" class="dacheng-more">
          <span>还有 {{ hiddenCount }} 味未显示</span>
          <button class="btn btn--primary" type="button" @click="loadMore">
            再显示 {{ Math.min(PAGE_SIZE, hiddenCount) }} 味
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.dacheng-hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 30px;
  margin-bottom: 20px;
  background:
    radial-gradient(circle at 92% 18%, rgba(176, 138, 74, 0.18), transparent 34%),
    rgba(255, 255, 255, 0.5);
}

.dacheng-hero h1 {
  margin: 8px 0 10px;
  font-family: var(--font-serif);
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  color: var(--ink);
  letter-spacing: 0.08em;
}

.dacheng-hero__lead {
  max-width: 780px;
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.86rem;
  line-height: 1.9;
}

.dacheng-hero__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.dacheng-hero__seal {
  flex: none;
  width: 96px;
  height: 96px;
  border: 2px solid rgba(163, 58, 43, 0.6);
  display: grid;
  place-items: center;
  color: var(--cinnabar);
  font-family: var(--font-serif);
  font-size: 3rem;
  transform: rotate(-4deg);
}

.dacheng-tools {
  padding: 18px 20px;
  margin-bottom: 18px;
}

.dacheng-search {
  display: grid;
  gap: 7px;
}

.dacheng-search input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--line-strong);
  background: rgba(255, 255, 255, 0.66);
  color: var(--ink);
  font: inherit;
}

.dacheng-search input:focus {
  outline: 2px solid rgba(163, 58, 43, 0.2);
  border-color: var(--cinnabar);
}

.dacheng-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.dacheng-category {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.46);
  color: var(--ink-soft);
  font: inherit;
  font-size: 0.72rem;
  cursor: pointer;
  transition: 0.18s ease;
}

.dacheng-category span {
  color: var(--ink-faint);
  font-size: 0.64rem;
}

.dacheng-category:hover,
.dacheng-category--active {
  border-color: var(--cinnabar);
  background: var(--cinnabar);
  color: #fff;
}

.dacheng-category--active span,
.dacheng-category:hover span {
  color: rgba(255, 255, 255, 0.76);
}

.dacheng-result-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  align-items: baseline;
  margin: 20px 0 12px;
  color: var(--ink-faint);
  font-size: 0.72rem;
}

.dacheng-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.dacheng-card {
  display: grid;
  grid-template-columns: 104px minmax(0, 1fr);
  min-height: 136px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.5);
  color: inherit;
  text-decoration: none;
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.dacheng-card:hover {
  transform: translateY(-2px);
  border-color: rgba(163, 58, 43, 0.45);
  box-shadow: 0 10px 26px rgba(59, 44, 31, 0.09);
}

.dacheng-card__image {
  position: relative;
  background: linear-gradient(160deg, rgba(230, 218, 197, 0.65), rgba(249, 244, 233, 0.9));
  overflow: hidden;
}

.dacheng-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dacheng-card__placeholder {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: rgba(163, 58, 43, 0.28);
  font-family: var(--font-serif);
  font-size: 2.4rem;
}

.dacheng-card__category {
  position: absolute;
  left: 6px;
  bottom: 6px;
  max-width: calc(100% - 12px);
  padding: 2px 6px;
  background: rgba(53, 42, 31, 0.68);
  color: #fff;
  font-size: 0.58rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dacheng-card__body {
  display: flex;
  flex-direction: column;
  padding: 12px 14px 10px;
  min-width: 0;
}

.dacheng-card__title {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
}

.dacheng-card__title h2 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 1.12rem;
  color: var(--ink);
}

.dacheng-card__title span {
  color: var(--ink-faint);
  font-size: 0.62rem;
  letter-spacing: 0.04em;
}

.dacheng-card__alias {
  margin: 5px 0 0;
  color: var(--ink-faint);
  font-size: 0.64rem;
  line-height: 1.6;
}

.dacheng-card__summary {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 6px 0 8px;
  color: var(--ink-soft);
  font-size: 0.74rem;
  line-height: 1.65;
}

.dacheng-card__foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 6px;
  border-top: 1px dashed var(--line);
  color: var(--ink-faint);
  font-size: 0.62rem;
}

.dacheng-more {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin: 24px 0 8px;
  color: var(--ink-faint);
  font-size: 0.72rem;
}

.dacheng-empty {
  margin-top: 12px;
  padding: 28px;
  text-align: center;
  color: var(--ink-faint);
  line-height: 1.8;
}

@media (max-width: 980px) {
  .dacheng-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .dacheng-hero {
    padding: 22px 20px;
  }

  .dacheng-hero__seal {
    display: none;
  }

  .dacheng-card {
    grid-template-columns: 84px minmax(0, 1fr);
  }
}
</style>
