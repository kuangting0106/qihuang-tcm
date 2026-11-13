<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useCaseApi } from '@/composables/useCaseApi'
import type { CaseSummary } from '@/types/cases'

const route = useRoute()
const { loading, error, fetchCases } = useCaseApi()
const cases = ref<CaseSummary[]>([])

const bookId = computed(() => String(route.params.bookId ?? ''))

onMounted(async () => {
  try {
    cases.value = await fetchCases()
  } catch {
    cases.value = []
  }
})

const bookCases = computed(() =>
  cases.value.filter((item) => item.source?.work === bookId.value),
)

const doctor = computed(() => bookCases.value.find((item) => item.doctor)?.doctor ?? '')

const groups = computed(() => {
  const map = new Map<string, CaseSummary[]>()
  for (const item of bookCases.value) {
    const key = item.subcategory?.trim() || '未分卷'
    const list = map.get(key) ?? []
    list.push(item)
    map.set(key, list)
  }
  return [...map.entries()].map(([title, items]) => ({ title, items }))
})

const modeLabel = (mode?: string) => {
  if (mode === 'thought') return '经验集'
  if (mode === 'formula') return '方书'
  return '医案'
}
</script>

<template>
  <div class="page case-book-page">
    <div class="container">
      <nav class="case-book-crumb" aria-label="面包屑">
        <RouterLink to="/cases">医案</RouterLink>
        <span>/</span>
        <span>按医书浏览</span>
      </nav>

      <header class="case-book-hero">
        <p class="eyebrow">CASE BOOK / 按医书浏览</p>
        <h1>{{ bookId }}</h1>
        <p v-if="doctor" class="case-book-hero__author">作者：{{ doctor }}</p>
        <p class="case-book-hero__meta">
          {{ bookCases.length }} 则 · {{ groups.length }} 门
        </p>
        <p class="case-book-hero__note">
          按原书门类汇集，条目保留原文。方药剂量仅供文献学习，请勿自行照方用药。
        </p>
      </header>

      <p v-if="loading" class="case-book-state">正在载入医案…</p>
      <p v-else-if="error" class="case-book-state">{{ error }}</p>
      <p v-else-if="!bookCases.length" class="case-book-state">
        未找到这部医案的条目。<RouterLink to="/cases">返回医案首页</RouterLink>
      </p>

      <template v-else>
        <section v-for="group in groups" :key="group.title" class="case-book-group">
          <div class="case-book-group__head">
            <h2>{{ group.title }}</h2>
            <span>{{ group.items.length }} 则</span>
          </div>
          <div class="case-book-list">
            <RouterLink
              v-for="item in group.items"
              :key="item.id"
              :to="`/cases/${item.id}`"
              class="case-book-item paper-panel"
            >
              <span class="case-book-item__mode">{{ modeLabel(item.mode) }}</span>
              <h3>{{ item.title }}</h3>
              <p>{{ item.summary }}</p>
              <span class="case-book-item__link">阅读全文 →</span>
            </RouterLink>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped>
.case-book-page {
  padding-bottom: 64px;
}

.case-book-crumb {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 18px 0 4px;
  color: var(--ink-faint);
  font-size: 0.78rem;
}

.case-book-crumb a {
  color: var(--jade);
}

.case-book-hero {
  padding: 26px 0 22px;
  border-bottom: 1px solid var(--line);
}

.case-book-hero h1 {
  margin-top: 8px;
  font-size: clamp(1.7rem, 4vw, 2.5rem);
}

.case-book-hero__author {
  margin-top: 6px;
  color: var(--ink-soft);
}

.case-book-hero__meta {
  margin-top: 12px;
  color: var(--ink-faint);
  font-size: 0.8rem;
  letter-spacing: 0.04em;
}

.case-book-hero__note {
  max-width: 640px;
  margin-top: 10px;
  color: var(--ink-faint);
  font-size: 0.8rem;
  line-height: 1.8;
}

.case-book-state {
  padding: 44px 0;
  color: var(--ink-faint);
}

.case-book-state a {
  color: var(--jade);
}

.case-book-group {
  margin-top: 34px;
}

.case-book-group__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--line-strong);
}

.case-book-group__head h2 {
  font-size: 1.12rem;
}

.case-book-group__head span {
  color: var(--ink-faint);
  font-size: 0.74rem;
}

.case-book-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.case-book-item {
  display: flex;
  flex-direction: column;
  min-height: 168px;
  padding: 18px 18px 14px;
  transition: transform 0.18s ease, border-color 0.18s ease;
}

.case-book-item:hover {
  transform: translateY(-2px);
  border-color: var(--jade);
}

.case-book-item__mode {
  align-self: flex-start;
  padding: 2px 8px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  color: var(--jade);
  font-size: 0.66rem;
  letter-spacing: 0.08em;
}

.case-book-item h3 {
  margin-top: 10px;
  font-size: 1rem;
  line-height: 1.5;
}

.case-book-item p {
  margin-top: 6px;
  color: var(--ink-faint);
  font-size: 0.76rem;
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.case-book-item__link {
  margin-top: auto;
  padding-top: 12px;
  color: var(--jade);
  font-size: 0.74rem;
}

@media (max-width: 700px) {
  .case-book-list {
    grid-template-columns: 1fr;
  }
}
</style>
