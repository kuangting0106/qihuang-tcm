<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { loadClassicCatalog } from '@/composables/useClassicLibrary'
import { groupClassicWorks } from '@/data/classic-citations'
import type { ClassicWork } from '@/data/classic-citations'

const route = useRoute()
const work = ref<ClassicWork | null>(null)
const loading = ref(true)
const error = ref('')

const workKey = computed(() => String(route.params.workKey ?? ''))

async function load() {
  loading.value = true
  error.value = ''
  work.value = null
  try {
    const payload = await loadClassicCatalog()
    const found = groupClassicWorks(payload.works).find((item) => item.key === workKey.value)
    if (!found) {
      error.value = '没有找到这组引文，链接里的书名可能不正确。'
      return
    }
    work.value = found
  } catch (err) {
    error.value = err instanceof Error ? err.message : '引文索引加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page citation-page">
    <div class="container">
      <nav class="breadcrumbs" aria-label="面包屑">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/classics">医家经典书籍</RouterLink>
        <span>/</span>
        <span>引文索引</span>
        <template v-if="work">
          <span>/</span>
          <span>{{ work.work }}</span>
        </template>
      </nav>

      <p v-if="loading" class="state paper-panel">正在打开引文索引…</p>

      <div v-else-if="error" class="state paper-panel" role="alert">
        <h1>引文索引没有打开</h1>
        <p>{{ error }}</p>
        <div class="state__actions">
          <button class="btn btn--primary" type="button" @click="load">重新加载</button>
          <RouterLink class="btn btn--ghost" to="/classics">返回经典首页</RouterLink>
        </div>
      </div>

      <template v-else-if="work">
        <header class="citation-head">
          <div>
            <p class="eyebrow">CITED WORK / 引文索引</p>
            <h1>{{ work.work }}</h1>
            <p v-if="work.parentWork" class="citation-head__parent">
              属{{ work.author ? `${work.author}《${work.parentWork}》` : `《${work.parentWork}》` }} ·
              {{ work.work }}部分
            </p>
            <p class="citation-head__meta">
              <span v-if="work.author">{{ work.author }}</span>
              <span v-if="work.edition">{{ work.edition }}</span>
              <span>共 {{ work.items.length }} 条</span>
            </p>
          </div>
        </header>

        <p v-if="work.parentNote" class="citation-note paper-panel">{{ work.parentNote }}</p>

        <section class="citation-list" aria-label="古籍引文条目">
          <article
            v-for="(source, index) in work.items"
            :id="source.id"
            :key="source.id"
            class="citation-entry paper-panel"
          >
            <div class="citation-entry__head">
              <p class="citation-entry__locator">{{ source.locator }}</p>
              <span>{{ String(index + 1).padStart(2, '0') }}</span>
            </div>
            <blockquote v-if="source.quote" class="citation-entry__quote">{{ source.quote }}</blockquote>
            <p v-else class="citation-entry__pending">本条仅登记书名与条号，未附逐字原文。</p>
            <p v-if="source.note" class="citation-entry__note">{{ source.note }}</p>
          </article>
        </section>

        <div class="back-row">
          <RouterLink class="text-link" to="/classics">← 返回医家经典书籍</RouterLink>
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
  padding: 18px 0 20px;
  color: var(--ink-faint);
  font-size: 0.76rem;
}
.breadcrumbs a:hover { color: var(--cinnabar); }
.state {
  margin: 20px 0;
  padding: 22px;
}
.state h1 { margin: 0 0 8px; font-size: 1.5rem; }
.state p { color: var(--ink-soft); font-size: 0.84rem; }
.state__actions { display: flex; gap: 8px; margin-top: 14px; }
.citation-head {
  padding: 12px 0 22px;
  border-bottom: 1px solid var(--line);
}
.citation-head h1 {
  margin: 6px 0 8px;
  font-family: var(--serif);
  font-size: clamp(2.2rem, 4.4vw, 3.6rem);
  letter-spacing: 0.04em;
}
.citation-head__parent {
  margin: 0 0 8px;
  color: var(--cinnabar);
  font-size: 0.8rem;
}
.citation-head__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin: 0;
  color: var(--ink-faint);
  font-size: 0.76rem;
}
.citation-note {
  margin: 18px 0 0;
  padding: 12px 16px;
  border-left: 2px solid var(--cinnabar);
  color: var(--ink-soft);
  font-size: 0.8rem;
  line-height: 1.8;
}
.citation-list {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}
.citation-entry {
  padding: 16px 18px;
  scroll-margin-top: 90px;
}
.citation-entry__head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: baseline;
  margin-bottom: 8px;
}
.citation-entry__head > span {
  color: var(--ink-faint);
  font-family: var(--serif);
  font-size: 0.78rem;
}
.citation-entry__locator {
  margin: 0;
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.9rem;
  letter-spacing: 0.03em;
}
.citation-entry__quote {
  margin: 0;
  padding-left: 14px;
  border-left: 2px solid var(--cinnabar);
  color: var(--ink);
  font-size: 0.9rem;
  line-height: 1.95;
  text-align: justify;
}
.citation-entry__pending {
  margin: 0;
  color: var(--ink-faint);
  font-size: 0.82rem;
}
.citation-entry__note {
  margin: 10px 0 0;
  color: var(--ink-soft);
  font-size: 0.76rem;
  line-height: 1.75;
}
.back-row { padding: 24px 0 48px; }
@media (max-width: 760px) {
  .citation-head h1 { font-size: 2rem; }
  .citation-entry { padding: 14px; }
  .citation-entry__head { flex-direction: column; gap: 4px; }
}
</style>
