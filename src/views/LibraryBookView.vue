<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { formatCharCount } from '@/composables/useClassicLibrary'
import { useLibraryApi } from '@/composables/useLibraryApi'
import type { LibraryBookDetail, LibraryIndexPayload } from '@/composables/useLibraryApi'

const route = useRoute()
const { loading, error, fetchLibraryBook, fetchLibraryIndex } = useLibraryApi()
const book = ref<LibraryBookDetail | null>(null)
const library = ref<LibraryIndexPayload | null>(null)
const query = ref('')

const bookId = computed(() => String(route.params.bookId ?? ''))

async function load() {
  book.value = null
  query.value = ''
  try {
    book.value = await fetchLibraryBook(bookId.value)
  } catch {
    book.value = null
  }
}

onMounted(async () => {
  void load()
  try {
    library.value = await fetchLibraryIndex()
  } catch {
    library.value = null
  }
})

watch(bookId, load)

const category = computed(() =>
  library.value?.categories.find((item) => item.key === book.value?.category),
)
const subcategory = computed(() =>
  category.value?.subs.find((item) => item.key === book.value?.subcategory),
)
const filteredSections = computed(() => {
  const q = query.value.trim()
  if (!q || !book.value) return book.value?.sections ?? []
  return book.value.sections.filter((section) => section.title.includes(q))
})
const firstSection = computed(() => book.value?.sections[0] ?? null)
</script>

<template>
  <div class="page library-book-page">
    <div class="container">
      <nav class="breadcrumbs" aria-label="面包屑">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/classics">医家经典书籍</RouterLink>
        <span>/</span>
        <RouterLink to="/classics/library">医藏</RouterLink>
        <span>/</span>
        <span>{{ book?.title ?? '书目' }}</span>
      </nav>

      <p v-if="loading && !book" class="state-card paper-panel">正在打开书目…</p>
      <div v-else-if="error && !book" class="state-card paper-panel" role="alert">
        <h1>这本书没有打开</h1>
        <p>{{ error }}</p>
        <div class="state-actions">
          <button class="btn btn--primary" type="button" @click="load">重试</button>
          <RouterLink class="btn btn--ghost" to="/classics/library">返回医藏</RouterLink>
        </div>
      </div>

      <template v-else-if="book">
        <header class="book-head">
          <div class="book-head__main">
            <p class="eyebrow">LIBRARY / 医藏古籍</p>
            <h1>{{ book.title }}</h1>
            <p class="book-head__byline">
              <span>{{ book.author }}</span>
              <span v-if="book.dynasty">{{ book.dynasty }}</span>
              <span v-if="category">{{ category.label }}</span>
              <span v-if="subcategory">· {{ subcategory.label }}</span>
            </p>
            <p v-if="book.versionNote" class="book-head__version">{{ book.versionNote }}</p>
          </div>
          <div class="book-head__stats">
            <div><strong>{{ formatCharCount(book.charCount) }}</strong><small>正文规模</small></div>
            <div><strong>{{ book.sectionCount }}</strong><small>篇目</small></div>
          </div>
        </header>

        <div class="book-actions">
          <RouterLink v-if="firstSection" class="btn btn--primary" :to="`/classics/library/${book.id}/${firstSection.id}`">
            开始阅读
          </RouterLink>
          <span v-if="firstSection" class="book-actions__hint">从「{{ firstSection.title }}」开始</span>
          <span v-if="book.duplicateOf" class="version-badge">另一版本</span>
        </div>

        <section class="toc-section" aria-labelledby="toc-title">
          <div class="toc-head">
            <div>
              <p class="eyebrow">CONTENTS / 目录</p>
              <h2 id="toc-title">全书篇目</h2>
            </div>
            <label class="toc-search">
              <span aria-hidden="true">⌕</span>
              <input v-model="query" type="search" placeholder="在目录中搜索篇名" />
            </label>
          </div>

          <p v-if="!filteredSections.length" class="toc-empty paper-panel">目录里没有匹配的篇名。</p>
          <ol v-else class="toc-list">
            <li v-for="(section, index) in filteredSections" :key="section.id">
              <RouterLink :to="`/classics/library/${book.id}/${section.id}`">
                <span class="toc-list__index">{{ String(index + 1).padStart(2, '0') }}</span>
                <span class="toc-list__title">{{ section.title }}</span>
                <span class="toc-list__meta">
                  {{ section.kind === 'chapter' ? '篇' : '段' }} · {{ formatCharCount(section.charCount) }}
                </span>
                <span class="toc-list__arrow" aria-hidden="true">→</span>
              </RouterLink>
            </li>
          </ol>
        </section>

        <aside class="source-card paper-panel">
          <div>
            <span class="eyebrow">SOURCE / 版本</span>
            <h3>据殆知阁医藏转换本整理</h3>
          </div>
          <div class="source-card__body">
            <p>{{ book.source.note }}</p>
            <p v-if="book.source.lastmod">整理时间：{{ book.source.lastmod }}</p>
            <p v-if="book.source.daizhige">
              来源：<a :href="book.source.daizhige" target="_blank" rel="noreferrer">殆知阁</a>
            </p>
            <p v-if="book.source.github">
              转换仓库：<a :href="book.source.github" target="_blank" rel="noreferrer">GitHub</a>
            </p>
          </div>
        </aside>
      </template>
    </div>
  </div>
</template>

<style scoped>
.breadcrumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 20px 0 28px;
  color: var(--ink-faint);
  font-size: 0.76rem;
}
.breadcrumbs a:hover { color: var(--cinnabar); }
.state-card { padding: 30px; }
.state-card h1 { margin-top: 0; }
.state-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
.book-head {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  align-items: flex-end;
  padding: 8px 0 26px;
  border-bottom: 1px solid var(--line);
}
.book-head h1 {
  margin: 6px 0 10px;
  font-size: clamp(2rem, 4.5vw, 3.4rem);
  letter-spacing: 0.04em;
}
.book-head__byline {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  color: var(--ink-soft);
  font-size: 0.86rem;
}
.book-head__version {
  max-width: 720px;
  margin-top: 10px;
  padding: 7px 12px;
  border-left: 2px solid var(--cinnabar);
  background: rgba(255, 255, 255, 0.4);
  color: var(--ink-faint);
  font-size: 0.8rem;
}
.book-head__stats {
  display: flex;
  gap: 26px;
  padding-left: 24px;
  border-left: 1px solid var(--line-strong);
}
.book-head__stats div { display: flex; flex-direction: column; gap: 3px; }
.book-head__stats strong { font-family: var(--serif); font-size: 1.35rem; }
.book-head__stats small { color: var(--ink-faint); font-size: 0.7rem; }
.book-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  padding: 20px 0 8px;
}
.book-actions__hint { color: var(--ink-faint); font-size: 0.76rem; }
.version-badge {
  padding: 3px 9px;
  border: 1px solid rgba(156, 62, 44, 0.3);
  border-radius: 999px;
  color: var(--cinnabar);
  font-size: 0.7rem;
}
.toc-section { padding: 24px 0 10px; }
.toc-head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-end;
  margin-bottom: 16px;
}
.toc-head h2 { margin: 4px 0 0; font-size: clamp(1.3rem, 2.4vw, 1.8rem); }
.toc-search {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 260px;
  padding: 0 14px;
  min-height: 40px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.46);
  color: var(--ink-faint);
}
.toc-search input { width: 100%; border: 0; outline: 0; background: transparent; color: var(--ink); }
.toc-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 24px;
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--line);
}
.toc-list li { border-bottom: 1px solid var(--line); }
.toc-list a {
  display: grid;
  grid-template-columns: 34px 1fr auto auto;
  gap: 10px;
  align-items: center;
  padding: 11px 4px;
  color: var(--ink);
  font-size: 0.84rem;
}
.toc-list a:hover { color: var(--cinnabar); }
.toc-list__index { color: var(--ink-faint); font-size: 0.7rem; }
.toc-list__title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.toc-list__meta { color: var(--ink-faint); font-size: 0.7rem; }
.toc-list__arrow { color: var(--cinnabar); }
.toc-empty { padding: 22px; }
.source-card {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 30px;
  margin: 34px 0 10px;
  padding: 24px 26px;
}
.source-card h3 { margin: 4px 0 0; font-size: 1.05rem; }
.source-card__body { color: var(--ink-soft); font-size: 0.82rem; line-height: 1.8; }
.source-card__body p + p { margin-top: 4px; }
.source-card__body a { color: var(--cinnabar); text-decoration: underline; text-underline-offset: 3px; }
@media (max-width: 900px) {
  .book-head { flex-direction: column; align-items: flex-start; }
  .book-head__stats { padding-left: 0; border-left: 0; }
  .toc-list { grid-template-columns: 1fr; }
  .source-card { grid-template-columns: 1fr; gap: 14px; }
}
@media (max-width: 640px) {
  .toc-head { flex-direction: column; align-items: stretch; }
  .toc-search { min-width: 0; }
  .book-head__stats { gap: 18px; }
}
</style>
