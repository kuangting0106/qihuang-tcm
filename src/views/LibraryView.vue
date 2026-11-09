<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useLibraryApi } from '@/composables/useLibraryApi'
import type {
  LibraryBookSummary,
  LibraryCategory,
  LibrarySource,
} from '@/composables/useLibraryApi'

const { fetchLibraryIndex, fetchLibraryBooks } = useLibraryApi()

const categories = ref<LibraryCategory[]>([])
const source = ref<LibrarySource | null>(null)
const books = ref<LibraryBookSummary[]>([])
const activeCategory = ref('')
const activeSub = ref('')
const query = ref('')
const appliedQuery = ref('')
const total = ref(0)
const pages = ref(0)
const page = ref(1)
const loadingIndex = ref(true)
const loadingBooks = ref(false)
const indexError = ref('')
const listError = ref('')

const CATEGORY_ICONS: Record<string, string> = {
  yijing: '经',
  shanghan: '寒',
  bencao: '草',
  fangshu: '方',
  zhenfa: '诊',
  zhenjiu: '针',
  linzheng: '临',
  yian: '案',
  yangsheng: '养',
  zonghe: '综',
  yilun: '论',
  duanpian: '篇',
}

const category = computed(
  () => categories.value.find((item) => item.key === activeCategory.value) ?? null,
)
const activeSubLabel = computed(
  () => category.value?.subs.find((item) => item.key === activeSub.value)?.label ?? '',
)
const heading = computed(() => {
  if (appliedQuery.value) return `搜索“${appliedQuery.value}”`
  if (!category.value) return '全部医藏'
  return activeSubLabel.value ? `${category.value.label} · ${activeSubLabel.value}` : category.value.label
})
const hasMore = computed(() => page.value < pages.value)
const totalBooks = computed(() => categories.value.reduce((sum, item) => sum + item.count, 0))

async function loadIndex() {
  loadingIndex.value = true
  indexError.value = ''
  try {
    const payload = await fetchLibraryIndex()
    categories.value = payload.categories
    source.value = payload.source
    const first = payload.categories.find((item) => item.count > 0)
    if (first) {
      activeCategory.value = first.key
      await loadBooks(true)
    }
  } catch (error) {
    indexError.value = error instanceof Error ? error.message : '医藏目录加载失败'
  } finally {
    loadingIndex.value = false
  }
}

async function loadBooks(reset = false) {
  if (loadingBooks.value) return
  if (reset) {
    page.value = 1
    books.value = []
  }
  loadingBooks.value = true
  listError.value = ''
  try {
    const payload = await fetchLibraryBooks({
      category: appliedQuery.value ? undefined : activeCategory.value || undefined,
      subcategory: appliedQuery.value ? undefined : activeSub.value || undefined,
      q: appliedQuery.value || undefined,
      page: page.value,
      limit: 48,
    })
    books.value = reset ? payload.books : [...books.value, ...payload.books]
    total.value = payload.total
    pages.value = payload.pages
  } catch (error) {
    listError.value = error instanceof Error ? error.message : '书目加载失败'
  } finally {
    loadingBooks.value = false
  }
}

function selectCategory(key: string) {
  if (activeCategory.value === key && !activeSub.value && !appliedQuery.value) return
  activeCategory.value = key
  activeSub.value = ''
  query.value = ''
  appliedQuery.value = ''
  void loadBooks(true)
}

function selectSub(categoryKey: string, subKey: string) {
  activeCategory.value = categoryKey
  activeSub.value = subKey
  query.value = ''
  appliedQuery.value = ''
  void loadBooks(true)
}

function submitSearch() {
  appliedQuery.value = query.value.trim()
  page.value = 1
  void loadBooks(true)
}

function clearSearch() {
  query.value = ''
  appliedQuery.value = ''
  void loadBooks(true)
}

function loadMore() {
  if (!hasMore.value || loadingBooks.value) return
  page.value += 1
  void loadBooks(false)
}

onMounted(loadIndex)
</script>

<template>
  <div class="page library-page">
    <div class="container">
      <nav class="breadcrumbs">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/classics">医家经典书籍</RouterLink>
        <span>/</span>
        <span>医藏</span>
      </nav>

      <header class="library-hero">
        <div>
          <p class="eyebrow">LIBRARY / 医藏</p>
          <h1>医藏古籍</h1>
          <p class="library-hero__lead">
            按内容类型分为十二类，同一类书放在一起；鼠标悬浮一级分类可展开二级分类。
            原文据殆知阁医藏整理，未逐字校勘，以通行本为准。
          </p>
        </div>
        <div class="library-hero__stat">
          <span>{{ source?.totalBooks ?? totalBooks }}</span>
          <small>部古籍</small>
          <span>{{ categories.length }}</span>
          <small>个一级分类</small>
        </div>
      </header>

      <p v-if="loadingIndex" class="library-state paper-panel">正在打开医藏书库…</p>
      <div v-else-if="indexError" class="library-state paper-panel" role="alert">
        <h2>医藏书库没有打开</h2>
        <p>{{ indexError }}</p>
        <button class="btn btn--primary" type="button" @click="loadIndex">重试</button>
      </div>

      <div v-else class="library-layout">
        <aside class="category-rail paper-panel" aria-label="医藏一级分类">
          <p class="rail-title">一级分类</p>
          <div class="category-list">
            <div
              v-for="item in categories"
              :key="item.key"
              class="category-item"
              :class="{ 'is-active': activeCategory === item.key }"
            >
              <button class="category-button" type="button" @click="selectCategory(item.key)">
                <span class="category-icon" aria-hidden="true">
                  {{ CATEGORY_ICONS[item.key] ?? item.label.slice(0, 1) }}
                </span>
                <span class="category-name">{{ item.label }}</span>
                <span class="category-count">{{ item.count }}</span>
              </button>
              <div v-if="item.subs.length" class="category-flyout">
                <p class="category-flyout__title">{{ item.label }}</p>
                <button
                  v-for="sub in item.subs"
                  :key="sub.key"
                  type="button"
                  class="category-flyout__link"
                  @click="selectSub(item.key, sub.key)"
                >
                  <span>{{ sub.label }}</span>
                  <span>{{ sub.count }}</span>
                </button>
              </div>
            </div>
          </div>
          <p class="rail-note">悬浮分类可看二级分类</p>
        </aside>

        <main class="library-main">
          <form class="library-search paper-panel" @submit.prevent="submitSearch">
            <span class="library-search__icon" aria-hidden="true">⌕</span>
            <input v-model="query" type="search" placeholder="搜索书名、作者或朝代…" />
            <button class="btn btn--primary" type="submit">搜索</button>
            <button v-if="appliedQuery" class="btn btn--ghost" type="button" @click="clearSearch">
              清除
            </button>
          </form>

          <div class="library-head">
            <div>
              <p class="eyebrow">{{ appliedQuery ? 'SEARCH / 检索' : 'CATEGORY / 分类' }}</p>
              <h2>{{ heading }}</h2>
            </div>
            <p class="library-head__count">共 <strong>{{ total }}</strong> 部</p>
          </div>

          <div v-if="category && !appliedQuery && category.subs.length" class="subcategory-row">
            <button
              type="button"
              class="chip"
              :class="{ 'chip--cinnabar': !activeSub }"
              @click="selectSub(category.key, '')"
            >
              全部
            </button>
            <button
              v-for="sub in category.subs"
              :key="sub.key"
              type="button"
              class="chip"
              :class="{ 'chip--cinnabar': activeSub === sub.key }"
              @click="selectSub(category.key, sub.key)"
            >
              {{ sub.label }} {{ sub.count }}
            </button>
          </div>

          <p v-if="listError" class="library-state paper-panel" role="alert">
            {{ listError }}
            <button class="btn btn--ghost" type="button" @click="loadBooks(true)">重试</button>
          </p>

          <div v-if="books.length" class="library-grid" :class="{ 'is-loading': loadingBooks }">
            <RouterLink
              v-for="book in books"
              :key="book.id"
              class="library-card"
              :to="`/classics/library/${book.id}`"
            >
              <div class="library-card__top">
                <span class="library-card__seal" aria-hidden="true">藏</span>
                <span v-if="book.duplicateOf" class="library-card__badge">另一版本</span>
              </div>
              <h3>{{ book.title }}</h3>
              <p class="library-card__author">{{ book.author }}<span v-if="book.dynasty"> · {{ book.dynasty }}</span></p>
              <p class="library-card__meta">
                {{ book.sectionCount }} 篇
              </p>
              <p v-if="book.versionNote" class="library-card__note">{{ book.versionNote }}</p>
              <span class="library-card__arrow" aria-hidden="true">→</span>
            </RouterLink>
          </div>

          <div v-if="!books.length && !loadingBooks && !listError" class="library-state paper-panel">
            <h2>没有找到这本书</h2>
            <p>试试书名中的一两个字，或切换到其他一级分类。</p>
          </div>

          <button
            v-if="hasMore"
            class="btn btn--ghost library-more"
            type="button"
            :disabled="loadingBooks"
            @click="loadMore"
          >
            {{ loadingBooks ? '正在载入…' : `加载更多（还有 ${total - books.length} 部）` }}
          </button>

          <p class="library-footnote">
            医藏共 {{ source?.totalBooks ?? 0 }} 部；其中三本与站内精校经典同名，正文差异较大，标为“另一版本”。
            短篇不足五千字，单列一类。
          </p>
        </main>
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
  padding: 20px 0 22px;
  color: var(--ink-faint);
  font-size: 0.76rem;
}
.breadcrumbs a:hover { color: var(--cinnabar); }

.library-hero {
  display: flex;
  justify-content: space-between;
  gap: 36px;
  align-items: flex-end;
  padding: 20px 0 28px;
}
.library-hero h1 {
  margin: 4px 0 10px;
  font-size: clamp(2.2rem, 4.8vw, 3.8rem);
  letter-spacing: 0.06em;
}
.library-hero__lead {
  max-width: 720px;
  color: var(--ink-soft);
  font-size: 0.92rem;
  line-height: 1.9;
}
.library-hero__stat {
  display: grid;
  grid-template-columns: auto auto;
  gap: 0 12px;
  padding-left: 24px;
  border-left: 1px solid var(--line-strong);
  white-space: nowrap;
}
.library-hero__stat span {
  font-family: var(--serif);
  font-size: 2.1rem;
  line-height: 1.1;
}
.library-hero__stat small { color: var(--ink-faint); font-size: 0.74rem; }

.library-layout {
  display: grid;
  grid-template-columns: 244px minmax(0, 1fr);
  gap: 30px;
  align-items: start;
  padding-bottom: 40px;
}
.category-rail {
  position: sticky;
  top: 90px;
  padding: 18px 14px 14px;
}
.rail-title {
  margin: 0 6px 10px;
  color: var(--ink-faint);
  font-size: 0.68rem;
  letter-spacing: 0.14em;
}
.category-list { display: flex; flex-direction: column; gap: 4px; }
.category-item { position: relative; }
.category-button {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border: 1px solid transparent;
  border-radius: 3px;
  background: transparent;
  color: var(--ink-soft);
  text-align: left;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}
.category-button:hover,
.category-item.is-active .category-button {
  border-color: rgba(164, 61, 42, 0.28);
  background: rgba(255, 255, 255, 0.55);
  color: var(--ink);
}
.category-item.is-active .category-button { border-left: 3px solid var(--cinnabar); }
.category-icon {
  display: grid;
  place-items: center;
  flex: 0 0 26px;
  width: 26px;
  height: 26px;
  border: 1px solid rgba(164, 61, 42, 0.34);
  border-radius: 2px;
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.78rem;
}
.category-name { flex: 1; font-size: 0.84rem; }
.category-count { color: var(--ink-faint); font-size: 0.7rem; }

.category-flyout {
  position: absolute;
  z-index: 30;
  top: -6px;
  left: calc(100% + 10px);
  width: 216px;
  padding: 12px;
  border: 1px solid var(--line-strong);
  border-radius: 3px;
  background: #fbf7ed;
  box-shadow: 0 12px 28px rgba(52, 36, 22, 0.14);
  opacity: 0;
  visibility: hidden;
  transform: translateX(-4px);
  transition: opacity 0.16s ease, transform 0.16s ease, visibility 0.16s ease;
}
.category-item:hover .category-flyout,
.category-item:focus-within .category-flyout {
  opacity: 1;
  visibility: visible;
  transform: translateX(0);
}
.category-flyout__title {
  margin: 0 6px 8px;
  color: var(--cinnabar);
  font-size: 0.7rem;
  letter-spacing: 0.1em;
}
.category-flyout__link {
  display: flex;
  width: 100%;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 6px;
  border: 0;
  border-bottom: 1px solid var(--line);
  background: transparent;
  color: var(--ink-soft);
  font-size: 0.78rem;
  text-align: left;
  cursor: pointer;
}
.category-flyout__link:last-child { border-bottom: 0; }
.category-flyout__link:hover { color: var(--cinnabar); }
.category-flyout__link span:last-child { color: var(--ink-faint); font-size: 0.68rem; }
.rail-note {
  margin: 12px 6px 0;
  color: var(--ink-faint);
  font-size: 0.68rem;
  line-height: 1.6;
}

.library-main { min-width: 0; }
.library-search {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  flex-wrap: wrap;
}
.library-search__icon { color: var(--ink-faint); font-size: 1.1rem; }
.library-search input {
  flex: 1 1 220px;
  min-height: 38px;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--ink);
  font-size: 0.9rem;
}
.library-head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-end;
  padding: 24px 0 12px;
}
.library-head h2 { margin: 3px 0 0; font-size: clamp(1.35rem, 2.4vw, 1.9rem); }
.library-head__count { color: var(--ink-faint); font-size: 0.78rem; }
.library-head__count strong { color: var(--cinnabar); font-family: var(--serif); font-size: 1.1rem; }
.subcategory-row {
  display: none;
  flex-wrap: wrap;
  gap: 6px;
  padding: 4px 0 16px;
}
.subcategory-row .chip { cursor: pointer; }

.library-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 12px;
  transition: opacity 0.16s ease;
}
.library-grid.is-loading { opacity: 0.55; }
.library-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 186px;
  padding: 16px 16px 14px;
  border: 1px solid var(--line);
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.45);
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}
.library-card:hover {
  transform: translateY(-2px);
  border-color: rgba(164, 61, 42, 0.4);
  box-shadow: 0 10px 22px rgba(52, 36, 22, 0.08);
}
.library-card__top { display: flex; justify-content: space-between; align-items: center; min-height: 24px; }
.library-card__seal {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: 1px solid rgba(164, 61, 42, 0.3);
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.72rem;
}
.library-card__badge {
  padding: 3px 7px;
  border: 1px solid rgba(164, 61, 42, 0.3);
  color: var(--cinnabar);
  font-size: 0.62rem;
  letter-spacing: 0.08em;
}
.library-card h3 {
  margin: 10px 0 4px;
  font-family: var(--serif);
  font-size: 1.08rem;
  line-height: 1.45;
}
.library-card__author { color: var(--ink-soft); font-size: 0.76rem; }
.library-card__meta { margin-top: 6px; color: var(--ink-faint); font-size: 0.7rem; }
.library-card__note {
  margin-top: 7px;
  color: var(--ink-faint);
  font-size: 0.68rem;
  line-height: 1.55;
}
.library-card__arrow {
  margin-top: auto;
  padding-top: 10px;
  color: var(--cinnabar);
  font-size: 0.9rem;
  align-self: flex-end;
}

.library-state { padding: 18px; margin: 12px 0; color: var(--ink-soft); }
.library-state h2 { margin-bottom: 6px; font-size: 1.2rem; }
.library-state .btn { margin-top: 10px; }
.library-more { margin-top: 18px; }
.library-footnote {
  margin-top: 22px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
  color: var(--ink-faint);
  font-size: 0.7rem;
  line-height: 1.7;
}

@media (max-width: 900px) {
  .library-hero { flex-direction: column; align-items: flex-start; gap: 16px; }
  .library-hero__stat { padding-left: 0; border-left: 0; }
  .library-layout { grid-template-columns: 1fr; gap: 18px; }
  .category-rail { position: static; }
  .category-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
  .category-flyout { display: none; }
  .rail-note { display: none; }
  .subcategory-row { display: flex; }
}
</style>
