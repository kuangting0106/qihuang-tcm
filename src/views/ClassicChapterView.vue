<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { loadClassicSection } from '@/composables/useClassicLibrary'
import type { ClassicBook, ClassicSection } from '@/types/classics'

type ClassicBookHeader = Pick<ClassicBook, 'id' | 'title' | 'author' | 'source' | 'stats'>

const route = useRoute()
const book = ref<ClassicBookHeader | null>(null)
const section = ref<ClassicSection | null>(null)
const sections = ref<Array<Pick<ClassicSection, 'id' | 'title'>>>([])
const loading = ref(true)
const error = ref('')

async function load(bookId: string, chapterId: string) {
  loading.value = true
  error.value = ''
  book.value = null
  section.value = null
  sections.value = []
  try {
    const payload = await loadClassicSection(bookId, chapterId)
    book.value = payload.book
    section.value = payload.section
    sections.value = payload.sections
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : '古籍原文加载失败'
  } finally {
    loading.value = false
  }
}

watch(
  () => [String(route.params.bookId ?? ''), String(route.params.chapterId ?? '')] as const,
  ([bookId, chapterId]) => {
    if (bookId && chapterId) load(bookId, chapterId)
  },
  { immediate: true },
)

const currentIndex = computed(() =>
  section.value ? sections.value.findIndex((item) => item.id === section.value?.id) : -1,
)

const prevSection = computed(() =>
  currentIndex.value > 0 ? sections.value[currentIndex.value - 1] : null,
)
const nextSection = computed(() =>
  currentIndex.value >= 0 && currentIndex.value < sections.value.length - 1
    ? sections.value[currentIndex.value + 1]
    : null,
)

const groupTitle = computed(() => {
  if (!section.value) return ''
  if (section.value.kind === 'preface') return '序'
  if (section.value.kind === 'postscript') return '跋'
  if (section.value.kind === 'frontMatter') return '卷前'
  return section.value.volume
})

const numerals = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

const displayTitle = computed(() => {
  if (!section.value) return ''
  const sameTitle = sections.value.filter((item) => item.title === section.value?.title)
  if (sameTitle.length <= 1) return section.value.title
  const index = sameTitle.findIndex((item) => item.id === section.value?.id) + 1
  return `${section.value.title}（${numerals[index - 1] ?? index}）`
})
</script>

<template>
  <div class="page classic-chapter-page">
    <div class="container">
      <nav class="breadcrumbs" aria-label="面包屑">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/classics">医家经典书籍</RouterLink>
        <span>/</span>
        <RouterLink v-if="book" :to="`/classics/${book.id}`">{{ book.title }}</RouterLink>
        <span>/</span>
        <span>{{ displayTitle || '原文' }}</span>
      </nav>

      <p v-if="loading" class="chapter-state paper-panel">正在展开这一篇…</p>
      <div v-else-if="error" class="chapter-state paper-panel">
        <h1>这一篇没有打开</h1>
        <p>{{ error }}</p>
        <RouterLink class="btn btn--primary" to="/classics">返回古籍目录</RouterLink>
      </div>

      <template v-else-if="book && section">
        <header class="chapter-head">
          <p class="eyebrow">{{ book.title }} / {{ groupTitle }}</p>
          <h1>{{ displayTitle }}</h1>
          <p class="chapter-head__meta">
            作者：{{ book.author }}
            <span v-if="section.kind === 'preface'">· 序</span>
            <span v-if="section.kind === 'postscript'">· 跋</span>
            <span v-if="section.kind === 'frontMatter'">· 卷前</span>
          </p>
        </header>

        <article class="classic-reading paper-panel">
          <p v-for="(paragraph, index) in section.paragraphs" :key="index">{{ paragraph }}</p>
        </article>

        <p class="reading-note">
          {{ book.source.note }}
        </p>

        <nav class="chapter-pager" aria-label="篇目翻页">
          <RouterLink
            v-if="prevSection"
            class="pager-link"
            :to="`/classics/${book.id}/${prevSection.id}`"
          >
            <span>上一篇</span>
            <strong>{{ prevSection.title }}</strong>
          </RouterLink>
          <span v-else class="pager-empty">已是全书开头</span>

          <RouterLink class="pager-back" :to="`/classics/${book.id}`">返回全书目录</RouterLink>

          <RouterLink
            v-if="nextSection"
            class="pager-link pager-link--next"
            :to="`/classics/${book.id}/${nextSection.id}`"
          >
            <span>下一篇</span>
            <strong>{{ nextSection.title }}</strong>
          </RouterLink>
          <span v-else class="pager-empty">已是全书末尾</span>
        </nav>
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

.chapter-state {
  margin: 30px 0;
  padding: 40px 28px;
  text-align: center;
  color: var(--ink-soft);
}

.chapter-state h1 {
  margin-bottom: 10px;
}

.chapter-head {
  padding: 8px 0 22px;
  border-bottom: 1px solid var(--line-strong);
}

.chapter-head h1 {
  margin: 6px 0 10px;
  font-size: clamp(2.2rem, 5.4vw, 3.8rem);
  letter-spacing: 0.06em;
  line-height: 1.2;
}

.chapter-head__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  color: var(--ink-faint);
  font-size: 0.78rem;
}

.chapter-head__meta span {
  color: var(--cinnabar);
}

.classic-reading {
  margin: 24px 0 0;
  padding: 34px clamp(18px, 5vw, 54px);
}

.classic-reading p {
  color: var(--ink);
  font-family: var(--serif);
  font-size: clamp(1rem, 1.25vw, 1.08rem);
  line-height: 2.1;
  text-align: justify;
  text-indent: 2em;
}

.classic-reading p + p {
  margin-top: 0.7em;
}

.reading-note {
  margin-top: 12px;
  color: var(--ink-faint);
  font-size: 0.72rem;
  line-height: 1.8;
  text-align: center;
}

.chapter-pager {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 12px;
  align-items: stretch;
  margin: 30px 0 10px;
}

.pager-link {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255, 252, 245, 0.42);
  transition: border-color 0.16s ease, background 0.16s ease;
}

.pager-link:hover {
  border-color: var(--jade);
  background: var(--jade-pale);
}

.pager-link span {
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.pager-link strong {
  font-family: var(--serif);
  font-size: 0.9rem;
  font-weight: 500;
}

.pager-link--next {
  text-align: right;
}

.pager-back {
  display: grid;
  place-items: center;
  padding: 0 18px;
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  color: var(--jade);
  font-size: 0.76rem;
  white-space: nowrap;
}

.pager-empty {
  display: grid;
  place-items: center;
  padding: 14px;
  border: 1px dashed var(--line);
  border-radius: 12px;
  color: var(--ink-faint);
  font-size: 0.72rem;
}

@media (max-width: 760px) {
  .chapter-pager {
    grid-template-columns: 1fr;
  }

  .pager-link--next {
    text-align: left;
  }

  .pager-back {
    order: 3;
    min-height: 44px;
  }

  .classic-reading {
    padding: 24px 18px;
  }
}
</style>
