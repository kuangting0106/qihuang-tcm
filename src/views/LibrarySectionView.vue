<script setup lang="ts">
// 医藏单篇阅读页：按需读取一篇正文，不在前端加载整本书。
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useLibraryApi } from '@/composables/useLibraryApi'
import type { LibrarySectionPayload } from '@/composables/useLibraryApi'

const route = useRoute()
const { loading, error, fetchLibrarySection } = useLibraryApi()

const payload = ref<LibrarySectionPayload | null>(null)
const sectionError = ref('')

const bookId = computed(() => String(route.params.bookId ?? ''))
const sectionId = computed(() => String(route.params.sectionId ?? ''))
const isPart = computed(() => payload.value?.section.kind === 'part')

async function load() {
  if (!bookId.value || !sectionId.value) return
  payload.value = null
  sectionError.value = ''
  try {
    payload.value = await fetchLibrarySection(bookId.value, sectionId.value)
  } catch (err) {
    sectionError.value = err instanceof Error ? err.message : '这一篇没有打开'
  }
}

watch([bookId, sectionId], load, { immediate: true })

const book = computed(() => payload.value?.book ?? null)
const section = computed(() => payload.value?.section ?? null)
const prev = computed(() => payload.value?.prev ?? null)
const next = computed(() => payload.value?.next ?? null)

</script>

<template>
  <div class="page library-section-page">
    <div class="container">
      <nav class="breadcrumbs" aria-label="面包屑">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/classics">医家经典书籍</RouterLink>
        <span>/</span>
        <RouterLink to="/classics/library">医藏</RouterLink>
        <template v-if="book">
          <span>/</span>
          <RouterLink :to="`/classics/library/${book.id}`">{{ book.title }}</RouterLink>
        </template>
        <template v-if="section">
          <span>/</span>
          <span>{{ section.title }}</span>
        </template>
      </nav>

      <p v-if="loading" class="state-panel paper-panel">正在展开这一篇…</p>

      <div v-else-if="sectionError || error" class="state-panel paper-panel" role="alert">
        <h1>这一篇没有打开</h1>
        <p>{{ sectionError || error }}</p>
        <div class="state-actions">
          <button class="btn btn--primary" type="button" @click="load">重新加载</button>
          <RouterLink v-if="book" class="btn btn--ghost" :to="`/classics/library/${book.id}`">
            返回书目
          </RouterLink>
        </div>
      </div>

      <template v-else-if="book && section">
        <header class="section-head">
          <div>
            <p class="eyebrow">LIBRARY READING / 医藏阅读</p>
            <p class="section-head__book">
              <RouterLink :to="`/classics/library/${book.id}`">{{ book.title }}</RouterLink>
              <span v-if="book.author"> · {{ book.author }}</span>
            </p>
            <h1>{{ section.title }}</h1>
            <div class="section-head__meta">
              <span class="chip">{{ isPart ? '自动分段' : '原书篇目' }}</span>
              <span v-if="book.duplicateOf" class="chip chip--cinnabar">另一版本</span>
              <span v-if="book.versionNote" class="section-head__note">{{ book.versionNote }}</span>
            </div>
          </div>
          <RouterLink class="back-link" :to="`/classics/library/${book.id}`">
            ← 返回目录
          </RouterLink>
        </header>

        <article class="reading-body paper-panel">
          <p v-for="(paragraph, index) in section.paragraphs" :key="index">{{ paragraph }}</p>
        </article>

        <nav class="section-nav" aria-label="篇目翻页">
          <RouterLink
            v-if="prev"
            class="section-nav__item"
            :to="`/classics/library/${book.id}/${prev.id}`"
          >
            <span>上一篇</span>
            <strong>{{ prev.title }}</strong>
          </RouterLink>
          <span v-else class="section-nav__empty">已是第一篇</span>

          <RouterLink class="section-nav__back" :to="`/classics/library/${book.id}`">
            ← 返回目录
          </RouterLink>

          <RouterLink
            v-if="next"
            class="section-nav__item section-nav__item--next"
            :to="`/classics/library/${book.id}/${next.id}`"
          >
            <span>下一篇</span>
            <strong>{{ next.title }}</strong>
          </RouterLink>
          <span v-else class="section-nav__empty section-nav__empty--next">已是最后一篇</span>
        </nav>

        <footer v-if="book.source" class="source-note paper-panel">
          <strong>版本说明</strong>
          <p>{{ book.source.note }}</p>
          <p v-if="book.source.lastmod" class="muted tiny">整理时间：{{ book.source.lastmod }}</p>
        </footer>
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
  padding: 20px 0 24px;
  color: var(--ink-faint);
  font-size: 0.76rem;
}

.breadcrumbs a:hover {
  color: var(--cinnabar);
}

.state-panel {
  padding: 28px;
  margin-bottom: 30px;
}

.state-panel h1 {
  margin-bottom: 10px;
}

.state-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 26px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line-strong);
}

.section-head__book {
  margin-top: 6px;
  color: var(--ink-soft);
  font-size: 0.84rem;
}

.section-head__book a:hover {
  color: var(--cinnabar);
}

.section-head h1 {
  margin: 8px 0 10px;
  font-size: clamp(1.7rem, 3.2vw, 2.7rem);
  letter-spacing: 0.04em;
}

.section-head__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  align-items: center;
}

.section-head__note {
  color: var(--ink-faint);
  font-size: 0.72rem;
}

.back-link {
  flex: none;
  color: var(--cinnabar);
  font-size: 0.78rem;
}

.reading-body {
  margin-top: 18px;
  padding: clamp(22px, 4vw, 46px);
}

.reading-body p {
  margin: 0 0 1.05em;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: clamp(1rem, 1.15vw, 1.08rem);
  line-height: 2.05;
  text-align: justify;
  word-break: break-word;
}

.reading-body p:last-child {
  margin-bottom: 0;
}

.section-nav {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 12px;
  align-items: stretch;
  margin-top: 20px;
}

.section-nav__item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.4);
}

.section-nav__item:hover {
  border-color: var(--cinnabar);
}

.section-nav__item span {
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.section-nav__item strong {
  overflow: hidden;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 0.95rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.section-nav__item--next {
  text-align: right;
}

.section-nav__back {
  align-self: center;
  padding: 0 8px;
  color: var(--cinnabar);
  font-size: 0.78rem;
  white-space: nowrap;
}

.section-nav__empty {
  padding: 14px 16px;
  border: 1px dashed var(--line);
  border-radius: 12px;
  color: var(--ink-faint);
  font-size: 0.75rem;
}

.section-nav__empty--next {
  text-align: right;
}

.source-note {
  margin-top: 20px;
  padding: 16px 18px;
}

.source-note strong {
  font-size: 0.8rem;
}

.source-note p {
  margin-top: 6px;
  color: var(--ink-soft);
  font-size: 0.78rem;
  line-height: 1.8;
}

@media (max-width: 760px) {
  .section-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .section-nav {
    grid-template-columns: 1fr;
  }

  .section-nav__back {
    order: -1;
    padding: 4px 0;
  }

  .section-nav__item--next,
  .section-nav__empty--next {
    text-align: left;
  }
}
</style>
