<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useTcmData } from '@/composables/useTcmData'

const { data } = useTcmData()
const books = computed(() => data.value?.processingClassics?.books ?? [])
const entries = computed(() => data.value?.processingClassics?.entries ?? [])

const featuredNames = ['甘草', '桂枝', '黄芩', '雄黄', '硫黄', '枳壳', '露蜂房', '大黄', '半夏', '当归']

const query = ref('')

const featuredEntries = computed(() =>
  featuredNames
    .map((name) => entries.value.find((entry) => entry.name === name))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
)

const searchResults = computed(() => {
  const keyword = query.value.trim()
  if (!keyword) return []
  return entries.value
    .filter((entry) =>
      [entry.name, entry.section, entry.nature, entry.processing, entry.categoryTitle]
        .join(' ')
        .includes(keyword),
    )
    .slice(0, 30)
})

const shownEntries = computed(() =>
  query.value.trim() ? searchResults.value : featuredEntries.value,
)

function bookSummary(id: string) {
  return id === 'leigong'
    ? '药性解说与「雷公云」修事、炮制原文'
    : '修事、炮制、鉴别与畏恶反使原文'
}
</script>

<template>
  <section class="classic-hub">
    <div class="section-head">
      <div>
        <p class="eyebrow">CLASSICS / 古籍炮制</p>
        <h2>《雷公炮制药性解》《炮炙大法》</h2>
      </div>
      <p>
        两书只保留有具体修事、炮制或收集方法的条目；仅有药性解说的条目已移除。
        点书名进入该书的药材目录，再点药名查看原文详情。
      </p>
    </div>

    <div class="classic-hub__books">
      <RouterLink
        v-for="book in books"
        :key="book.id"
        class="classic-hub__book"
        :to="`/processing/book/${book.id}`"
      >
        <div>
          <span class="classic-hub__book-kicker">{{ book.dynasty }} · {{ book.author }}</span>
          <strong>《{{ book.title }}》</strong>
          <p>{{ bookSummary(book.id) }}</p>
          <span class="classic-hub__book-count">{{ book.count }} 味有炮制条目</span>
        </div>
        <span class="classic-hub__arrow" aria-hidden="true">→</span>
      </RouterLink>
    </div>

    <div class="classic-hub__tools">
      <input
        v-model="query"
        type="search"
        placeholder="搜药名、卷部、药性或炮制方法…"
        aria-label="搜索古籍炮制药材"
      />
      <span v-if="query.trim()">找到 {{ searchResults.length }} 味，最多显示 30 味</span>
      <span v-else>展示 10 味；点书名查看完整目录</span>
    </div>

    <div v-if="shownEntries.length" class="classic-hub__grid">
      <RouterLink
        v-for="entry in shownEntries"
        :key="entry.id"
        class="classic-hub__card"
        :to="`/processing/herb/${entry.id}`"
      >
        <div class="classic-hub__card-top">
          <strong>{{ entry.name }}</strong>
          <span>{{ entry.categoryTitle }}</span>
        </div>
        <p class="classic-hub__card-meta">{{ entry.book }} · {{ entry.section || '卷部待考' }}</p>
        <p class="classic-hub__card-text">{{ entry.processing }}</p>
      </RouterLink>
    </div>

    <p v-else class="classic-hub__empty paper-panel">没有找到匹配的药材，换一个药名或卷部再试。</p>
  </section>
</template>

<style scoped>
.classic-hub {
  margin: 26px 0 34px;
  padding: 24px;
  border: 1px solid var(--line-strong);
  border-radius: 14px;
  background: rgba(255, 252, 245, 0.6);
}

.classic-hub__books {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.classic-hub__book {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 18px 20px;
  border: 1px solid rgba(176, 138, 74, 0.42);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.56);
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.classic-hub__book:hover {
  border-color: var(--cinnabar);
  transform: translateY(-1px);
}

.classic-hub__book-kicker {
  display: block;
  color: var(--ink-faint);
  font-size: 0.68rem;
  letter-spacing: 0.08em;
}

.classic-hub__book strong {
  display: block;
  margin: 5px 0;
  color: var(--ink);
  font-family: var(--serif);
  font-size: 1.25rem;
}

.classic-hub__book p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.78rem;
  line-height: 1.7;
}

.classic-hub__book-count {
  display: inline-block;
  margin-top: 7px;
  color: var(--cinnabar);
  font-size: 0.72rem;
}

.classic-hub__arrow {
  color: var(--cinnabar);
  font-size: 1.5rem;
  line-height: 1;
}

.classic-hub__tools {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  align-items: center;
  margin-top: 18px;
}

.classic-hub__tools input {
  flex: 1 1 320px;
  max-width: 620px;
  padding: 9px 12px;
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.7);
  color: var(--ink);
  font: inherit;
  font-size: 0.82rem;
}

.classic-hub__tools span {
  color: var(--ink-faint);
  font-size: 0.72rem;
}

.classic-hub__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.classic-hub__card {
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.5);
}

.classic-hub__card:hover {
  border-color: var(--cinnabar);
}

.classic-hub__card-top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: baseline;
}

.classic-hub__card-top strong {
  color: var(--ink);
  font-family: var(--serif);
  font-size: 1.05rem;
}

.classic-hub__card-top span {
  color: var(--cinnabar);
  font-size: 0.66rem;
}

.classic-hub__card-meta {
  margin: 4px 0;
  color: var(--ink-faint);
  font-size: 0.7rem;
}

.classic-hub__card-text {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.76rem;
  line-height: 1.7;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.classic-hub__empty {
  margin-top: 14px;
  padding: 16px;
  color: var(--ink-faint);
  font-size: 0.8rem;
}

@media (max-width: 760px) {
  .classic-hub {
    padding: 18px;
  }

  .classic-hub__books,
  .classic-hub__grid {
    grid-template-columns: 1fr;
  }
}
</style>
