<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  formatCharCount,
  loadClassicBook,
} from '@/composables/useClassicLibrary'
import type { ClassicBook, ClassicSection } from '@/types/classics'

const route = useRoute()
const book = ref<ClassicBook | null>(null)
const loading = ref(true)
const error = ref('')

async function loadBook(id: string) {
  loading.value = true
  error.value = ''
  book.value = null
  try {
    book.value = await loadClassicBook(id)
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : '古籍原文加载失败'
  } finally {
    loading.value = false
  }
}

watch(
  () => String(route.params.bookId ?? ''),
  (id) => {
    if (id) loadBook(id)
  },
  { immediate: true },
)

const outline = computed(() => {
  if (!book.value) return []
  const items: { href: string; label: string; count?: number }[] = []
  if (book.value.prefaces.length) {
    items.push({ href: '#prefaces', label: '序跋', count: book.value.prefaces.length })
  }
  if (book.value.frontMatter.length) {
    items.push({ href: '#front-matter', label: '卷前', count: book.value.frontMatter.length })
  }
  book.value.volumes.forEach((volume, index) => {
    items.push({
      href: `#volume-${index}`,
      label: volume.title,
      count: volume.chapters.length,
    })
  })
  if (book.value.postscripts.length) {
    items.push({ href: '#postscripts', label: '跋', count: book.value.postscripts.length })
  }
  return items
})

function excerpt(section: ClassicSection): string {
  const text = section.paragraphs.join('')
  return text.length > 150 ? `${text.slice(0, 150)}…` : text
}

const numerals = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

function displayTitle(section: ClassicSection, siblings: ClassicSection[]): string {
  const sameTitle = siblings.filter((item) => item.title === section.title)
  if (sameTitle.length <= 1) return section.title
  const index = sameTitle.indexOf(section) + 1
  return `${section.title}（${numerals[index - 1] ?? index}）`
}
</script>

<template>
  <div class="page classic-book-page">
    <div class="container">
      <nav class="breadcrumbs" aria-label="面包屑">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/classics">医家经典书籍</RouterLink>
        <span>/</span>
        <span>{{ book?.title ?? '全书' }}</span>
      </nav>

      <p v-if="loading" class="book-state paper-panel">正在展开书页…</p>
      <div v-else-if="error" class="book-state paper-panel">
        <h1>书页没有打开</h1>
        <p>{{ error }}</p>
        <RouterLink class="btn btn--primary" to="/classics">返回古籍目录</RouterLink>
      </div>

      <template v-else-if="book">
        <header class="book-head">
          <div>
            <p class="eyebrow">FULL TEXT / 原书全文</p>
            <h1>{{ book.title }}</h1>
            <p class="book-head__author">作者：{{ book.author }}</p>
          </div>
          <dl class="book-head__stats">
            <div><dt>{{ book.stats.chapterCount }}</dt><dd>篇正文</dd></div>
            <div><dt>{{ book.stats.prefaceCount }}</dt><dd>篇序跋</dd></div>
            <div><dt>{{ book.stats.volumeCount }}</dt><dd>卷</dd></div>
            <div><dt>{{ formatCharCount(book.stats.charCount) }}</dt><dd>原文</dd></div>
          </dl>
        </header>

        <p class="book-source">
          {{ book.source.note }}
        </p>

        <div class="book-layout">
          <aside class="book-outline paper-panel" aria-label="全书目录">
            <span class="eyebrow">OUTLINE</span>
            <h2>全书目录</h2>
            <nav>
              <a v-for="item in outline" :key="item.href" :href="item.href">
                <span>{{ item.label }}</span>
                <small v-if="item.count">{{ item.count }}</small>
              </a>
            </nav>
          </aside>

          <div class="book-body">
            <section v-if="book.prefaces.length" id="prefaces" class="book-section">
              <div class="book-section__head">
                <span class="eyebrow">PREFACES / 序跋</span>
                <h2>序跋</h2>
              </div>
              <div class="section-card-list">
                <article v-for="section in book.prefaces" :key="section.id" class="section-card paper-panel">
                  <div class="section-card__top">
                    <h3>{{ displayTitle(section, book.prefaces) }}</h3>
                    <span>{{ section.charCount }} 字</span>
                  </div>
                  <p>{{ excerpt(section) }}</p>
                  <RouterLink class="text-link" :to="`/classics/${book.id}/${section.id}`">
                    读全文 →
                  </RouterLink>
                </article>
              </div>
            </section>

            <section v-if="book.frontMatter.length" id="front-matter" class="book-section">
              <div class="book-section__head">
                <span class="eyebrow">FRONT MATTER / 卷前</span>
                <h2>卷前</h2>
              </div>
              <div class="section-card-list">
                <article v-for="section in book.frontMatter" :key="section.id" class="section-card paper-panel">
                  <div class="section-card__top">
                    <h3>{{ displayTitle(section, book.frontMatter) }}</h3>
                    <span>{{ section.charCount }} 字</span>
                  </div>
                  <p>{{ excerpt(section) }}</p>
                  <RouterLink class="text-link" :to="`/classics/${book.id}/${section.id}`">
                    读全文 →
                  </RouterLink>
                </article>
              </div>
            </section>

            <section
              v-for="(volume, index) in book.volumes"
              :id="`volume-${index}`"
              :key="volume.title"
              class="book-section"
            >
              <div class="book-section__head">
                <span class="eyebrow">VOLUME {{ index + 1 }}</span>
                <h2>{{ volume.title }}</h2>
                <p>{{ volume.chapters.length }} 篇</p>
              </div>
              <div class="chapter-grid">
                <RouterLink
                  v-for="chapter in volume.chapters"
                  :key="chapter.id"
                  :to="`/classics/${book.id}/${chapter.id}`"
                  class="chapter-link"
                >
                  <span class="chapter-link__title">{{ displayTitle(chapter, volume.chapters) }}</span>
                  <span class="chapter-link__meta">{{ chapter.charCount }} 字 →</span>
                </RouterLink>
              </div>
            </section>

            <section v-if="book.postscripts.length" id="postscripts" class="book-section">
              <div class="book-section__head">
                <span class="eyebrow">POSTSCRIPT / 跋</span>
                <h2>跋</h2>
              </div>
              <div class="section-card-list">
                <article v-for="section in book.postscripts" :key="section.id" class="section-card paper-panel">
                  <div class="section-card__top">
                    <h3>{{ displayTitle(section, book.postscripts) }}</h3>
                    <span>{{ section.charCount }} 字</span>
                  </div>
                  <p>{{ excerpt(section) }}</p>
                  <RouterLink class="text-link" :to="`/classics/${book.id}/${section.id}`">
                    读全文 →
                  </RouterLink>
                </article>
              </div>
            </section>
          </div>
        </div>
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
  padding: 20px 0 26px;
  color: var(--ink-faint);
  font-size: 0.78rem;
}

.breadcrumbs a:hover {
  color: var(--cinnabar);
}

.book-state {
  margin: 30px 0;
  padding: 40px 28px;
  text-align: center;
  color: var(--ink-soft);
}

.book-state h1 {
  margin-bottom: 10px;
}

.book-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 36px;
  padding: 8px 0 24px;
  border-bottom: 1px solid var(--line-strong);
}

.book-head h1 {
  margin: 5px 0 8px;
  font-size: clamp(2.8rem, 6vw, 4.6rem);
  letter-spacing: 0.08em;
}

.book-head__author {
  color: var(--cinnabar);
  font-size: 0.9rem;
}

.book-head__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
  margin: 0;
}

.book-head__stats div {
  min-width: 64px;
  border-left: 1px solid var(--line-strong);
  padding-left: 12px;
}

.book-head__stats dt {
  font-family: var(--serif);
  font-size: 1.28rem;
  white-space: nowrap;
}

.book-head__stats dd {
  margin: 3px 0 0;
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.book-source {
  margin: 14px 0 0;
  color: var(--ink-faint);
  font-size: 0.76rem;
  line-height: 1.8;
}

.book-layout {
  display: grid;
  grid-template-columns: minmax(220px, 0.28fr) minmax(0, 1fr);
  gap: 22px;
  align-items: start;
  padding-top: 28px;
}

.book-outline {
  position: sticky;
  top: 92px;
  max-height: calc(100vh - 120px);
  overflow: auto;
  padding: 20px;
}

.book-outline h2 {
  margin: 4px 0 12px;
  font-size: 1.15rem;
}

.book-outline nav {
  display: grid;
  gap: 2px;
}

.book-outline a {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 8px;
  border-radius: 8px;
  color: var(--ink-soft);
  font-size: 0.78rem;
}

.book-outline a:hover {
  background: var(--jade-pale);
  color: var(--jade);
}

.book-outline small {
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.book-body {
  display: grid;
  gap: 36px;
}

.book-section {
  scroll-margin-top: 96px;
}

.book-section__head {
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 14px;
}

.book-section__head h2 {
  margin-top: 3px;
  font-size: 1.65rem;
}

.book-section__head > p {
  margin-top: 4px;
  color: var(--ink-faint);
  font-size: 0.74rem;
}

.section-card-list {
  display: grid;
  gap: 12px;
}

.section-card {
  padding: 18px 20px;
}

.section-card__top {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: baseline;
}

.section-card__top h3 {
  font-size: 1.2rem;
}

.section-card__top span {
  flex-shrink: 0;
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.section-card p {
  margin: 8px 0 12px;
  color: var(--ink-soft);
  font-family: var(--serif);
  font-size: 0.85rem;
  line-height: 1.95;
}

.section-card .text-link {
  font-size: 0.76rem;
}

.chapter-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.chapter-link {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 10px;
  min-height: 78px;
  padding: 12px 13px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: rgba(255, 252, 245, 0.4);
  transition: border-color 0.16s ease, background 0.16s ease;
}

.chapter-link:hover {
  border-color: var(--jade);
  background: var(--jade-pale);
}

.chapter-link__title {
  color: var(--ink);
  font-family: var(--serif);
  font-size: 0.92rem;
  line-height: 1.5;
}

.chapter-link__meta {
  color: var(--ink-faint);
  font-size: 0.66rem;
}

@media (max-width: 980px) {
  .book-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .book-layout {
    grid-template-columns: 1fr;
  }

  .book-outline {
    position: static;
    max-height: none;
  }

  .book-outline nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .chapter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .book-head__stats {
    gap: 12px 16px;
  }

  .book-outline nav,
  .chapter-grid {
    grid-template-columns: 1fr;
  }
}
</style>
