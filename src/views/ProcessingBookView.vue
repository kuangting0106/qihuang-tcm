<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useTcmData } from '@/composables/useTcmData'
import type { ProcessingClassicEntry } from '@/types/tcm'

const route = useRoute()
const { data } = useTcmData()
const query = ref('')

const bookId = computed(() => String(route.params.bookId ?? ''))
const books = computed(() => data.value?.processingClassics?.books ?? [])
const book = computed(() => books.value.find((item) => item.id === bookId.value) ?? null)
const entries = computed(() =>
  (data.value?.processingClassics?.entries ?? []).filter((item) => item.bookId === bookId.value),
)

const filteredEntries = computed(() => {
  const keyword = query.value.trim()
  if (!keyword) return entries.value
  return entries.value.filter((item) =>
    [item.name, item.section, item.nature, item.processing, item.categoryTitle]
      .join(' ')
      .includes(keyword),
  )
})

const categoryOrder = ['plants', 'animals', 'minerals', 'other'] as const
const groups = computed(() =>
  categoryOrder
    .map((category) => ({
      category,
      title:
        filteredEntries.value.find((item) => item.category === category)?.categoryTitle ??
        { plants: '草木类', animals: '蛇虫类', minerals: '金石类', other: '其他类' }[category],
      entries: filteredEntries.value.filter((item) => item.category === category),
    }))
    .filter((group) => group.entries.length > 0),
)

function summary(entry: ProcessingClassicEntry) {
  const text = entry.processing.replace(/\s+/g, ' ').trim()
  return text.length > 84 ? `${text.slice(0, 84)}…` : text
}
</script>

<template>
  <div class="page processing-book-page">
    <div class="container">
      <p class="eyebrow"><RouterLink to="/processing">药材的炮制</RouterLink> / 古籍目录</p>

      <template v-if="book">
        <header class="processing-book-hero">
          <div>
            <span class="processing-book-hero__dynasty">{{ book.dynasty }} · {{ book.author }}</span>
            <h1>{{ book.title }}</h1>
            <p>
              按原书卷部与药名逐条拆出，保留具体炮制原文。只列原书有炮制内容的药材；
              古籍工艺未逐字校勘，实际炮制须以现行规范复核。
            </p>
          </div>
          <div class="processing-book-hero__count">
            <strong>{{ entries.length }}</strong>
            <span>味有炮制原文</span>
          </div>
        </header>

        <div class="processing-book-tools">
          <input
            v-model="query"
            type="search"
            placeholder="搜药名、卷部、药性或炮制方法…"
            aria-label="搜索本目录药材"
          />
          <span>当前 {{ filteredEntries.length }} 味</span>
        </div>

        <section v-for="group in groups" :key="group.category" class="processing-book-group">
          <div class="processing-book-group__head">
            <h2>{{ group.title }}</h2>
            <span>{{ group.entries.length }} 味</span>
          </div>
          <div class="processing-book-list">
            <RouterLink
              v-for="entry in group.entries"
              :key="entry.id"
              :to="`/processing/herb/${entry.id}`"
              class="processing-book-item"
            >
              <div>
                <h3>{{ entry.name }}</h3>
                <p>{{ entry.section || '卷部待考' }}</p>
              </div>
              <p class="processing-book-item__summary">{{ summary(entry) }}</p>
              <span aria-hidden="true">→</span>
            </RouterLink>
          </div>
        </section>

        <p v-if="!filteredEntries.length" class="processing-empty paper-panel">
          没有找到匹配的药材。可以换一个药名或卷部关键词。
        </p>
      </template>

      <p v-else class="processing-empty paper-panel">
        没有找到这部炮制古籍。<RouterLink class="text-link" to="/processing">返回炮制首页 →</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.processing-book-page {
  padding-bottom: 80px;
}

.processing-book-page .eyebrow a {
  color: var(--cinnabar);
}

.processing-book-hero {
  display: flex;
  justify-content: space-between;
  gap: 32px;
  align-items: flex-end;
  padding: 28px 0 26px;
  border-bottom: 1px solid var(--line-strong);
}

.processing-book-hero__dynasty {
  color: var(--gold);
  font-size: 0.72rem;
  letter-spacing: 0.12em;
}

.processing-book-hero h1 {
  margin: 8px 0 12px;
  font-size: clamp(2.2rem, 5vw, 3.6rem);
  letter-spacing: 0.04em;
}

.processing-book-hero p {
  max-width: 720px;
  color: var(--ink-soft);
  font-size: 0.88rem;
  line-height: 1.9;
}

.processing-book-hero__count {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex: 0 0 auto;
}

.processing-book-hero__count strong {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 3rem;
  line-height: 1;
}

.processing-book-hero__count span {
  margin-top: 6px;
  color: var(--ink-faint);
  font-size: 0.7rem;
}

.processing-book-tools {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin: 22px 0;
}

.processing-book-tools input {
  width: min(460px, 70%);
  padding: 9px 13px;
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.55);
  color: var(--ink);
  font-size: 0.82rem;
}

.processing-book-tools span {
  color: var(--ink-faint);
  font-size: 0.72rem;
}

.processing-book-group {
  margin-top: 26px;
}

.processing-book-group__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--line);
}

.processing-book-group__head h2 {
  margin: 0;
  font-size: 1.15rem;
  letter-spacing: 0.08em;
}

.processing-book-group__head span {
  color: var(--ink-faint);
  font-size: 0.7rem;
}

.processing-book-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.processing-book-item {
  display: grid;
  grid-template-columns: minmax(90px, 0.55fr) minmax(0, 1.45fr) auto;
  gap: 14px;
  align-items: center;
  padding: 13px 14px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: rgba(255, 252, 245, 0.62);
  color: var(--ink);
  text-decoration: none;
  transition: border-color 0.18s ease, background 0.18s ease;
}

.processing-book-item:hover {
  border-color: rgba(163, 58, 43, 0.36);
  background: rgba(255, 252, 245, 0.92);
}

.processing-book-item h3 {
  margin: 0;
  font-size: 1rem;
}

.processing-book-item p {
  margin: 4px 0 0;
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.processing-book-item__summary {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.72rem;
  line-height: 1.65;
}

.processing-book-item > span {
  color: var(--cinnabar);
}

.processing-empty {
  margin-top: 24px;
  padding: 24px;
  color: var(--ink-soft);
}

@media (max-width: 820px) {
  .processing-book-hero {
    display: block;
  }

  .processing-book-hero__count {
    align-items: flex-start;
    margin-top: 16px;
  }

  .processing-book-list {
    grid-template-columns: 1fr;
  }

  .processing-book-tools {
    display: block;
  }

  .processing-book-tools input {
    width: 100%;
  }

  .processing-book-tools span {
    display: block;
    margin-top: 8px;
  }
}
</style>
