<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useTcmData } from '@/composables/useTcmData'
import { processingCategories } from '@/data/processing'

const route = useRoute()
const { data } = useTcmData()

const categoryId = computed(() => String(route.params.categoryId ?? ''))
const category = computed(() => processingCategories.find((item) => item.id === categoryId.value))

const herbs = computed(() =>
  (data.value?.herbs ?? []).filter((herb) => herb.processing?.categoryId === categoryId.value),
)
const classics = computed(() =>
  (data.value?.processingClassics?.entries ?? []).filter(
    (entry) => entry.category === categoryId.value,
  ),
)

const query = ref('')
const visibleCount = ref(48)

watch(categoryId, () => {
  query.value = ''
  visibleCount.value = 48
})

const filteredClassics = computed(() => {
  const keyword = query.value.trim()
  if (!keyword) return classics.value
  return classics.value.filter((entry) =>
    [entry.name, entry.section, entry.nature, entry.processing, entry.book, entry.categoryTitle]
      .join(' ')
      .includes(keyword),
  )
})

const shownClassics = computed(() => filteredClassics.value.slice(0, visibleCount.value))

const total = computed(() => herbs.value.length + classics.value.length)
</script>

<template>
  <div class="page processing-category-page">
    <div class="container">
      <nav class="page-crumbs" aria-label="面包屑">
        <RouterLink to="/processing">药材的炮制</RouterLink>
        <span aria-hidden="true">/</span>
        <span>{{ category?.title ?? '类别' }}</span>
      </nav>

      <header v-if="category" class="category-hero">
        <div>
          <p class="eyebrow">{{ category.kicker }}</p>
          <h1>{{ category.title }}</h1>
          <p class="category-hero__scope">{{ category.scope }}</p>
          <p class="category-hero__note">{{ category.note }}</p>
          <div class="category-hero__meta">
            <span class="chip chip--gold">{{ total }} 味已收录</span>
            <span class="chip">{{ herbs.length }} 味在本草详情</span>
            <span class="chip chip--jade">{{ classics.length }} 条古籍炮制</span>
          </div>
        </div>
        <div class="category-hero__seal" aria-hidden="true">制</div>
      </header>

      <p v-else class="paper-panel empty-panel">没有找到这个炮制类别，请返回炮制首页重新选择。</p>

      <template v-if="category">
        <section v-if="herbs.length" class="category-section">
          <div class="section-head">
            <div>
              <p class="eyebrow">HERBS / 本草详情</p>
              <h2>{{ category.title }}炮制</h2>
            </div>
            <p>来自本草详情页的炮制字段，点药名查看性味、功效与完整出处。</p>
          </div>
          <div class="category-herb-grid">
            <RouterLink
              v-for="herb in herbs"
              :key="herb.id"
              class="category-herb"
              :to="`/herbs/${herb.id}`"
            >
              <strong>{{ herb.name }}</strong>
              <span>{{ herb.processing?.summary }}</span>
              <small>{{ (herb.processing?.methods ?? []).join(' · ') }}</small>
            </RouterLink>
          </div>
        </section>

        <section class="category-section">
          <div class="section-head">
            <div>
              <p class="eyebrow">CLASSICS / 古籍条目</p>
              <h2>{{ category.title }}古籍炮制</h2>
            </div>
            <p>
              《雷公炮制药性解》《炮炙大法》中归入本类的条目，保留原书卷部与炮制原文。
            </p>
          </div>

          <div class="category-tools">
            <input
              v-model="query"
              type="search"
              placeholder="搜药名、卷部、药性或炮制方法…"
              aria-label="搜索本类炮制条目"
            />
            <span v-if="query.trim()">找到 {{ filteredClassics.length }} 味</span>
            <span v-else>共 {{ classics.length }} 味，按原书顺序排列</span>
          </div>

          <div v-if="shownClassics.length" class="category-list">
            <RouterLink
              v-for="entry in shownClassics"
              :key="entry.id"
              class="category-row"
              :to="`/processing/herb/${entry.id}`"
            >
              <div class="category-row__top">
                <strong>{{ entry.name }}</strong>
                <span>{{ entry.categoryTitle }}</span>
              </div>
              <p class="category-row__meta">{{ entry.book }} · {{ entry.section || '卷部待考' }}</p>
              <p class="category-row__text">{{ entry.processing }}</p>
            </RouterLink>
          </div>
          <p v-else class="paper-panel empty-panel">没有找到匹配的条目，换一个药名或卷部再试。</p>

          <button
            v-if="visibleCount < filteredClassics.length"
            class="load-more"
            type="button"
            @click="visibleCount += 48"
          >
            加载更多（还剩 {{ filteredClassics.length - visibleCount }} 味）
          </button>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped>
.page-crumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 18px 0 4px;
  color: var(--ink-faint);
  font-size: 0.74rem;
}

.page-crumbs a {
  color: var(--cinnabar);
}

.category-hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: center;
  padding: 28px 0 26px;
}

.category-hero h1 {
  margin: 6px 0 10px;
  font-size: clamp(2rem, 4vw, 3rem);
}

.category-hero__scope {
  color: var(--ink);
  font-size: 0.92rem;
  line-height: 1.8;
}

.category-hero__note {
  max-width: 760px;
  margin-top: 8px;
  color: var(--ink-faint);
  font-size: 0.8rem;
  line-height: 1.8;
}

.category-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.category-hero__seal {
  width: 104px;
  height: 104px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 48% 52% 46% 54%;
  background: var(--gold);
  color: var(--paper);
  font-family: var(--serif);
  font-size: 2.4rem;
  transform: rotate(-4deg);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.22);
}

.category-section {
  padding: 8px 0 30px;
}

.category-herb-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.category-herb {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 16px 18px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255, 252, 245, 0.6);
}

.category-herb:hover {
  border-color: var(--cinnabar);
}

.category-herb strong {
  font-family: var(--serif);
  font-size: 1.2rem;
}

.category-herb span {
  color: var(--ink-soft);
  font-size: 0.8rem;
  line-height: 1.7;
}

.category-herb small {
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.category-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  align-items: center;
  margin: 4px 0 14px;
}

.category-tools input {
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

.category-tools span {
  color: var(--ink-faint);
  font-size: 0.72rem;
}

.category-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.category-row {
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.5);
}

.category-row:hover {
  border-color: var(--cinnabar);
}

.category-row__top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: baseline;
}

.category-row__top strong {
  font-family: var(--serif);
  font-size: 1.05rem;
}

.category-row__top span {
  color: var(--cinnabar);
  font-size: 0.66rem;
}

.category-row__meta {
  margin: 4px 0;
  color: var(--ink-faint);
  font-size: 0.7rem;
}

.category-row__text {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.76rem;
  line-height: 1.7;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.empty-panel {
  padding: 18px;
  color: var(--ink-faint);
  font-size: 0.82rem;
}

.load-more {
  display: block;
  margin: 18px auto 0;
  padding: 9px 22px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: rgba(255, 252, 245, 0.8);
  color: var(--ink);
  font: inherit;
  font-size: 0.78rem;
  cursor: pointer;
}

.load-more:hover {
  border-color: var(--cinnabar);
  color: var(--cinnabar);
}

@media (max-width: 760px) {
  .category-hero {
    align-items: flex-start;
  }

  .category-hero__seal {
    width: 76px;
    height: 76px;
    font-size: 1.8rem;
  }

  .category-herb-grid,
  .category-list {
    grid-template-columns: 1fr;
  }
}
</style>
