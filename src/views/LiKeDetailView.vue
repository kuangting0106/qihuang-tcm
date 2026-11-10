<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

interface DetailSection {
  id: string
  number: string
  title: string
  html: string
}

interface DetailItem {
  id: string
  number: string
  stage: string
  title: string
  summary: string
  sourceFile: string
  charCount: number
  sectionCount: number
  introHtml: string
  sections: DetailSection[]
  sourceNote: string
}

interface DetailIndexItem {
  id: string
  number: string
  stage: string
  title: string
  summary: string
  sourceFile: string
  charCount: number
  sectionCount: number
  sections: Array<{ id: string; number: string; title: string }>
}

interface DetailIndex {
  generatedAt: string
  sourceDir: string
  note: string
  items: DetailIndexItem[]
}

const route = useRoute()
const detail = ref<DetailItem | null>(null)
const index = ref<DetailIndexItem[]>([])
const loading = ref(true)
const error = ref('')

const detailId = computed(() => String(route.params.detailId || ''))
const currentIndex = computed(() => index.value.findIndex((item) => item.id === detailId.value))
const previous = computed(() =>
  currentIndex.value > 0 ? index.value[currentIndex.value - 1] : null,
)
const next = computed(() =>
  currentIndex.value >= 0 && currentIndex.value < index.value.length - 1
    ? index.value[currentIndex.value + 1]
    : null,
)

function dataUrl(file: string) {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
  return `${base}data/li-ke-details/${file}`
}

async function fetchJson<T>(file: string): Promise<T> {
  const response = await fetch(dataUrl(file))
  if (!response.ok) throw new Error(`无法载入${file}`)
  return (await response.json()) as T
}

async function load() {
  loading.value = true
  error.value = ''
  const requested = detailId.value
  detail.value = null

  try {
    const [indexData, detailData] = await Promise.all([
      index.value.length ? Promise.resolve({ items: index.value } as DetailIndex) : fetchJson<DetailIndex>('index.json'),
      fetchJson<DetailItem>(`${requested}.json`),
    ])
    if (requested !== detailId.value) return

    index.value = indexData.items
    detail.value = detailData
    document.title = `${detailData.title} · 李可医书经验提纲`

    await nextTick()
    if (route.hash) {
      document.querySelector(route.hash)?.scrollIntoView({ block: 'start' })
    }
  } catch (caught) {
    if (requested !== detailId.value) return
    error.value = caught instanceof Error ? caught.message : '载入失败'
  } finally {
    if (requested === detailId.value) loading.value = false
  }
}

watch(detailId, load, { immediate: true })
</script>

<template>
  <div class="page detail-page">
    <div class="container">
      <nav class="detail-breadcrumb" aria-label="面包屑">
        <RouterLink to="/lectures">名家讲堂</RouterLink>
        <span>/</span>
        <RouterLink to="/lectures/li-ke">李可医书经验提纲</RouterLink>
        <span>/</span>
        <em>{{ detail?.title || '全文详解' }}</em>
      </nav>

      <p v-if="loading" class="detail-state paper-panel">正在载入全文…</p>

      <div v-else-if="error" class="detail-state detail-state--error paper-panel" role="alert">
        <strong>没有找到这篇全文</strong>
        <p>{{ error }}。请返回学习纲要重新选择。</p>
        <RouterLink class="btn btn--primary btn--small" to="/lectures/li-ke">
          返回学习纲要
        </RouterLink>
      </div>

      <template v-else-if="detail">
        <header class="detail-hero">
          <div class="detail-hero__copy">
            <p class="eyebrow">LI KE FULL TEXT / 全文详解 · {{ detail.number }}</p>
            <h1>{{ detail.title }}</h1>
            <p class="detail-hero__summary">{{ detail.summary }}</p>
            <div class="detail-hero__meta">
              <span class="chip chip--jade">{{ detail.stage }}</span>
              <span class="chip">{{ detail.sectionCount }} 节</span>
              <span class="chip chip--cinnabar">原文未删减</span>
            </div>
          </div>
          <div class="detail-hero__mark" aria-hidden="true">
            <span class="detail-hero__seal">李</span>
            <span>全文</span>
          </div>
        </header>

        <p class="detail-source-note">
          {{ detail.sourceNote }}
          <span>原稿：{{ detail.sourceFile }}</span>
        </p>

        <div class="detail-layout">
          <aside class="detail-toc" aria-label="本篇目录">
            <div class="detail-toc__head">
              <p class="eyebrow">CONTENTS / 本篇目录</p>
              <strong>{{ detail.sectionCount }} 节</strong>
            </div>
            <nav>
              <a v-for="section in detail.sections" :key="section.id" :href="`#${section.id}`">
                <span>{{ section.number }}</span>
                {{ section.title }}
              </a>
            </nav>
            <RouterLink class="detail-toc__back" to="/lectures/li-ke">← 返回学习纲要</RouterLink>
          </aside>

          <div class="detail-content">
            <section v-if="detail.introHtml" class="detail-intro detail-prose" v-html="detail.introHtml"></section>

            <section
              v-for="section in detail.sections"
              :id="section.id"
              :key="section.id"
              class="detail-section"
            >
              <header class="detail-section__head">
                <span>{{ section.number }}</span>
                <h2>{{ section.title }}</h2>
              </header>
              <div class="detail-prose" v-html="section.html"></div>
            </section>

            <nav class="detail-pager" aria-label="上一篇与下一篇">
              <RouterLink
                v-if="previous"
                class="detail-pager__item detail-pager__item--prev"
                :to="`/lectures/li-ke/${previous.id}`"
              >
                <small>上一篇 · {{ previous.number }}</small>
                <strong>← {{ previous.title }}</strong>
              </RouterLink>
              <span v-else></span>

              <RouterLink
                v-if="next"
                class="detail-pager__item detail-pager__item--next"
                :to="`/lectures/li-ke/${next.id}`"
              >
                <small>下一篇 · {{ next.number }}</small>
                <strong>{{ next.title }} →</strong>
              </RouterLink>
            </nav>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.detail-page {
  padding-top: 30px;
}

.detail-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  align-items: center;
  color: var(--ink-faint);
  font-size: 0.74rem;
}

.detail-breadcrumb a {
  color: var(--ink-soft);
}

.detail-breadcrumb a:hover {
  color: var(--cinnabar);
}

.detail-breadcrumb em {
  color: var(--ink);
  font-style: normal;
}

.detail-state {
  max-width: 620px;
  margin: 40px auto;
  padding: 28px;
  text-align: center;
  color: var(--ink-soft);
}

.detail-state--error strong {
  display: block;
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 1.2rem;
}

.detail-state--error p {
  margin: 8px 0 16px;
  font-size: 0.84rem;
}

.detail-hero {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  align-items: center;
  padding: 22px 0 24px;
  border-bottom: 1px solid var(--line-strong);
}

.detail-hero__copy {
  max-width: 900px;
}

.detail-hero h1 {
  margin: 6px 0 10px;
  font-size: clamp(2rem, 4.6vw, 3.7rem);
  line-height: 1.24;
}

.detail-hero__summary {
  max-width: 760px;
  color: var(--ink-soft);
  font-size: 0.88rem;
  line-height: 1.85;
}

.detail-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
}

.detail-hero__mark {
  width: 110px;
  flex-shrink: 0;
  display: grid;
  justify-items: center;
  gap: 8px;
  color: var(--ink-faint);
  font-family: var(--serif);
  font-size: 0.72rem;
  letter-spacing: 0.18em;
}

.detail-hero__seal {
  width: 92px;
  height: 92px;
  display: grid;
  place-items: center;
  border-radius: 48% 52% 46% 54%;
  background: var(--cinnabar);
  color: #f8efe3;
  font-size: 2.2rem;
  transform: rotate(-4deg);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.24);
}

.detail-source-note {
  max-width: 960px;
  margin-top: 12px;
  color: var(--ink-faint);
  font-size: 0.72rem;
  line-height: 1.8;
}

.detail-source-note span {
  display: block;
  margin-top: 2px;
  font-family: var(--serif);
  letter-spacing: 0.04em;
}

.detail-layout {
  display: grid;
  grid-template-columns: minmax(190px, 248px) minmax(0, 1fr);
  gap: 38px;
  align-items: start;
  margin-top: 26px;
}

.detail-toc {
  position: sticky;
  top: calc(var(--header-h) + 20px);
  max-height: calc(100vh - var(--header-h) - 40px);
  overflow: auto;
  padding: 14px 16px 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255, 252, 245, 0.64);
}

.detail-toc__head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: baseline;
  padding-bottom: 7px;
  border-bottom: 1px dashed var(--line);
}

.detail-toc__head strong {
  color: var(--ink-faint);
  font-size: 0.68rem;
  font-weight: 500;
}

.detail-toc nav {
  display: grid;
  gap: 1px;
  margin-top: 6px;
}

.detail-toc nav a {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 5px;
  padding: 4px 5px;
  border-radius: 5px;
  color: var(--ink-soft);
  font-size: 0.72rem;
  line-height: 1.5;
}

.detail-toc nav a:hover {
  background: var(--cinnabar-pale);
  color: var(--cinnabar);
}

.detail-toc nav a span {
  color: var(--gold);
  font-family: var(--serif);
  font-size: 0.66rem;
}

.detail-toc__back {
  display: block;
  margin-top: 10px;
  padding-top: 9px;
  border-top: 1px dashed var(--line);
  color: var(--cinnabar);
  font-size: 0.72rem;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.detail-content {
  min-width: 0;
}

.detail-intro {
  padding: 18px 20px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255, 252, 245, 0.56);
}

.detail-section {
  padding: 30px 0 8px;
  border-top: 1px solid var(--line);
  scroll-margin-top: calc(var(--header-h) + 18px);
}

.detail-section:first-of-type {
  border-top: 0;
}

.detail-section__head {
  display: flex;
  gap: 10px;
  align-items: baseline;
  margin-bottom: 10px;
}

.detail-section__head span {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 1.05rem;
}

.detail-section__head h2 {
  font-size: clamp(1.3rem, 2.6vw, 1.7rem);
}

.detail-prose {
  color: #343a35;
  font-family: var(--serif);
  font-size: 0.92rem;
  line-height: 2;
  overflow-wrap: anywhere;
}

.detail-prose :deep(h3) {
  margin: 24px 0 8px;
  padding-left: 10px;
  border-left: 3px solid var(--gold);
  font-size: 1.12rem;
  line-height: 1.5;
}

.detail-prose :deep(h4) {
  margin: 18px 0 6px;
  color: var(--jade);
  font-size: 1rem;
  line-height: 1.5;
}

.detail-prose :deep(h5) {
  margin: 12px 0 4px;
  font-size: 0.94rem;
}

.detail-prose :deep(p) {
  margin: 9px 0;
}

.detail-prose :deep(ul),
.detail-prose :deep(ol) {
  margin: 8px 0;
  padding-left: 1.5em;
}

.detail-prose :deep(li) {
  margin: 3px 0;
  padding-left: 2px;
}

.detail-prose :deep(li > ul),
.detail-prose :deep(li > ol) {
  margin: 3px 0;
}

.detail-prose :deep(strong) {
  color: var(--ink);
  font-weight: 600;
}

.detail-prose :deep(em) {
  color: var(--cinnabar);
}

.detail-prose :deep(blockquote) {
  margin: 14px 0;
  padding: 10px 14px;
  border-left: 2px solid var(--cinnabar-2);
  background: rgba(241, 221, 214, 0.42);
  color: var(--ink-soft);
}

.detail-prose :deep(blockquote p) {
  margin: 3px 0;
}

.detail-prose :deep(hr) {
  height: 1px;
  margin: 18px 0;
  border: 0;
  background: var(--line);
}

.detail-prose :deep(.table-scroll) {
  margin: 12px 0;
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: rgba(255, 252, 245, 0.55);
}

.detail-prose :deep(table) {
  width: 100%;
  min-width: 620px;
  border-collapse: collapse;
  font-family: var(--sans);
  font-size: 0.76rem;
  line-height: 1.7;
}

.detail-prose :deep(th),
.detail-prose :deep(td) {
  padding: 7px 10px;
  border-bottom: 1px solid var(--line);
  text-align: left;
  vertical-align: top;
}

.detail-prose :deep(th) {
  background: var(--paper-2);
  color: var(--ink);
  font-weight: 600;
  white-space: nowrap;
}

.detail-prose :deep(tr:last-child td) {
  border-bottom: 0;
}

.detail-prose :deep(code) {
  padding: 1px 4px;
  border-radius: 4px;
  background: var(--paper-2);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 0.82em;
}

.detail-prose :deep(pre) {
  margin: 12px 0;
  padding: 12px 14px;
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #262b28;
  color: #e9e4d9;
  line-height: 1.75;
}

.detail-prose :deep(pre code) {
  padding: 0;
  background: transparent;
  color: inherit;
  font-size: 0.78rem;
}

.detail-prose :deep(a) {
  color: var(--cinnabar);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.detail-pager {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 34px;
  padding-top: 20px;
  border-top: 1px solid var(--line-strong);
}

.detail-pager__item {
  display: grid;
  gap: 3px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: rgba(255, 252, 245, 0.5);
  transition: border-color 0.16s ease, background 0.16s ease;
}

.detail-pager__item:hover {
  border-color: var(--cinnabar-2);
  background: var(--cinnabar-pale);
}

.detail-pager__item--next {
  text-align: right;
}

.detail-pager__item small {
  color: var(--ink-faint);
  font-size: 0.66rem;
}

.detail-pager__item strong {
  color: var(--ink);
  font-family: var(--serif);
  font-size: 0.88rem;
  font-weight: 500;
  line-height: 1.55;
}

@media (max-width: 960px) {
  .detail-layout {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .detail-toc {
    position: static;
    max-height: none;
  }

  .detail-toc nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .detail-hero {
    align-items: flex-start;
    gap: 12px;
  }

  .detail-hero__mark {
    width: 54px;
  }

  .detail-hero__seal {
    width: 50px;
    height: 50px;
    font-size: 1.2rem;
  }

  .detail-hero__mark span:last-child {
    display: none;
  }

  .detail-toc nav {
    grid-template-columns: 1fr;
  }

  .detail-prose {
    font-size: 0.88rem;
    line-height: 1.95;
  }

  .detail-prose :deep(table) {
    min-width: 560px;
  }

  .detail-pager {
    grid-template-columns: 1fr;
  }

  .detail-pager__item--next {
    text-align: left;
  }
}
</style>
