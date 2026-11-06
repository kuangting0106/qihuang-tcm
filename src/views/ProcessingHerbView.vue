<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import CitationBadge from '@/components/CitationBadge.vue'
import { useTcmData } from '@/composables/useTcmData'

const route = useRoute()
const { data } = useTcmData()

const entry = computed(() =>
  data.value?.processingClassics?.entries.find((item) => item.id === String(route.params.id)) ?? null,
)

const book = computed(() =>
  entry.value
    ? data.value?.processingClassics?.books.find((item) => item.id === entry.value?.bookId) ?? null
    : null,
)
</script>

<template>
  <div class="page processing-herb-page">
    <div class="container">
      <nav class="processing-breadcrumb" aria-label="面包屑">
        <RouterLink to="/processing">药材的炮制</RouterLink>
        <span aria-hidden="true">/</span>
        <RouterLink v-if="book" :to="`/processing/book/${book.id}`">{{ book.title }}</RouterLink>
        <span aria-hidden="true">/</span>
        <span>{{ entry?.name ?? '未找到' }}</span>
      </nav>

      <template v-if="entry">
        <header class="processing-herb-hero">
          <div>
            <p class="eyebrow">PROCESSING / 古籍炮制</p>
            <h1>{{ entry.name }}</h1>
            <p class="processing-herb-hero__meta">
              <span>{{ entry.categoryTitle }}</span>
              <span>{{ entry.book }} · {{ entry.section || '卷部待考' }}</span>
              <span>{{ entry.dynasty }} · {{ entry.author }}</span>
            </p>
          </div>
          <span class="chip chip--gold">原文照录</span>
        </header>

        <div class="processing-herb-card paper-panel">
          <section v-if="entry.nature" class="processing-herb-block">
            <span class="eyebrow">NATURE / 药性解说</span>
            <p>{{ entry.nature }}</p>
          </section>

          <section class="processing-herb-block">
            <span class="eyebrow">METHOD / 收集与炮制</span>
            <p>{{ entry.processing }}</p>
          </section>

          <footer class="processing-herb-foot">
            <div>
              <span class="kind-badge kind-badge--quote">古籍原文</span>
              <CitationBadge :citation-ids="[entry.sourceId]" label="古籍出处" tone="muted" compact />
            </div>
            <RouterLink v-if="book" class="text-link" :to="`/processing/book/${book.id}`">
              返回《{{ book.title }}》目录 →
            </RouterLink>
          </footer>
        </div>

        <p class="processing-herb-note">
          原文照录，未逐字校勘；古籍炮制工艺与今规未必相同，实际炮制须由执业中药师按现行规范处理。
        </p>
      </template>

      <div v-else class="entry-empty paper-panel">
        <strong>没有找到这味药材</strong>
        <p>请返回炮制首页，从《雷公炮制药性解》或《炮炙大法》目录进入。</p>
        <RouterLink class="text-link" to="/processing">返回炮制首页 →</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.processing-herb-page {
  padding: 28px 0 70px;
}

.processing-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  color: var(--ink-faint);
  font-size: 0.72rem;
}

.processing-breadcrumb a {
  color: var(--cinnabar);
}

.processing-herb-hero {
  display: flex;
  justify-content: space-between;
  gap: 28px;
  align-items: flex-start;
  padding: 34px 0 26px;
  border-bottom: 1px solid var(--line-strong);
}

.processing-herb-hero h1 {
  margin: 6px 0 12px;
  font-size: clamp(2.4rem, 6vw, 4.4rem);
  letter-spacing: 0.08em;
}

.processing-herb-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  color: var(--ink-soft);
  font-size: 0.8rem;
}

.processing-herb-card {
  margin-top: 28px;
  padding: 28px 30px;
}

.processing-herb-block + .processing-herb-block {
  margin-top: 26px;
  padding-top: 24px;
  border-top: 1px dashed var(--line-strong);
}

.processing-herb-block p {
  margin: 10px 0 0;
  color: var(--ink-soft);
  font-family: var(--serif);
  font-size: 1rem;
  line-height: 2;
  text-align: justify;
}

.processing-herb-foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-top: 28px;
  padding-top: 18px;
  border-top: 1px solid var(--line-strong);
  font-size: 0.72rem;
}

.processing-herb-foot > div {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.processing-herb-note {
  max-width: 760px;
  margin-top: 18px;
  color: var(--ink-faint);
  font-size: 0.72rem;
  line-height: 1.9;
}

@media (max-width: 720px) {
  .processing-herb-hero {
    flex-direction: column;
  }

  .processing-herb-card {
    padding: 22px 18px;
  }
}
</style>
