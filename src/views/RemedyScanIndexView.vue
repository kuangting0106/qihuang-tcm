<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchScanIndex, type RemedyScanIndex } from '@/composables/useRemedyScan'

const index = ref<RemedyScanIndex | null>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    index.value = await fetchScanIndex()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '扫描页索引读取失败'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page scan-index-page">
    <div class="container">
      <nav class="breadcrumbs">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/remedies">民间偏方集录</RouterLink>
        <span>/</span>
        <span>原书扫描页</span>
      </nav>

      <header class="scan-index-head">
        <p class="eyebrow">SOURCE SCANS / 原书扫描页</p>
        <h1>扫描页附录</h1>
        <p>
          已批量转写六组扫描本，OCR 文本按页保存。泉州本同时提供原书扫描图；其余五组目前只保留文字索引，原图未入库。
        </p>
      </header>

      <p v-if="loading" class="scan-index-state">正在读取扫描页索引…</p>
      <p v-else-if="error" class="scan-index-state scan-index-state--error">{{ error }}</p>

      <div v-else-if="index" class="scan-book-grid">
        <RouterLink
          v-for="book in index.books"
          :key="book.id"
          :to="{ name: 'remedy-scan-page', params: { bookId: book.id, page: '1' } }"
          class="scan-book-card paper-panel"
        >
          <span class="scan-book-card__kicker">{{ book.id }}</span>
          <h2>{{ book.title }}</h2>
          <p>{{ book.totalPages }} 页 · {{ book.hasImages ? '含原书扫描图' : '仅 OCR 文本' }}</p>
          <p class="scan-book-card__note">{{ book.note }}</p>
          <span class="scan-book-card__more">从第 1 页查看 →</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scan-index-page {
  padding-bottom: 72px;
}

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

.scan-index-head {
  max-width: 780px;
  padding-bottom: 26px;
  border-bottom: 1px solid var(--line-strong);
}

.scan-index-head h1 {
  margin: 6px 0 10px;
  font-size: clamp(2.4rem, 5vw, 3.6rem);
}

.scan-index-head p:last-child {
  color: var(--ink-soft);
  line-height: 1.9;
}

.scan-book-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  padding-top: 24px;
}

.scan-book-card {
  display: block;
  padding: 22px 24px;
  color: inherit;
  text-decoration: none;
  transition: border-color 0.16s ease, transform 0.16s ease;
}

.scan-book-card:hover {
  border-color: var(--cinnabar-2);
  transform: translateY(-2px);
}

.scan-book-card__kicker {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.74rem;
  letter-spacing: 0.12em;
}

.scan-book-card h2 {
  margin: 6px 0 6px;
  font-size: 1.24rem;
}

.scan-book-card p {
  color: var(--ink-soft);
  font-size: 0.8rem;
  line-height: 1.8;
}

.scan-book-card__note {
  color: var(--ink-faint) !important;
  font-size: 0.74rem !important;
}

.scan-book-card__more {
  display: inline-block;
  margin-top: 12px;
  color: var(--cinnabar);
  font-size: 0.78rem;
}

.scan-index-state {
  padding: 36px 0;
  color: var(--ink-faint);
}

.scan-index-state--error {
  color: var(--cinnabar);
}

@media (max-width: 760px) {
  .scan-book-grid {
    grid-template-columns: 1fr;
  }
}
</style>
