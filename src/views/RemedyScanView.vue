<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  fetchScanBook,
  scanImagePath,
  type RemedyScanBookData,
} from '@/composables/useRemedyScan'

const route = useRoute()
const router = useRouter()

const data = ref<RemedyScanBookData | null>(null)
const loading = ref(true)
const error = ref('')
const imageFailed = ref(false)

const bookId = computed(() => String(route.params.bookId || 'QZ01'))
const page = computed(() => {
  const value = Number(route.params.page)
  return Number.isFinite(value) && value >= 1 ? Math.floor(value) : 1
})
const pageText = computed(() => data.value?.pages.find((item) => item.page === page.value))
const totalPages = computed(() => data.value?.book.totalPages ?? 0)
const remedyId = computed(() => String(route.query.remedy || ''))
const imageSrc = computed(() => scanImagePath(bookId.value, page.value))

async function load() {
  loading.value = true
  error.value = ''
  imageFailed.value = false
  try {
    data.value = await fetchScanBook(bookId.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '扫描页读取失败'
  } finally {
    loading.value = false
  }
}

function goPage(target: number) {
  if (target < 1 || target > totalPages.value) return
  void router.push({
    name: 'remedy-scan-page',
    params: { bookId: bookId.value, page: String(target) },
    query: route.query,
  })
}

onMounted(load)
watch(bookId, load)
</script>

<template>
  <div class="page scan-page">
    <div class="container">
      <nav class="breadcrumbs">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/remedies">民间偏方集录</RouterLink>
        <span>/</span>
        <span>原书页附录</span>
      </nav>

      <p v-if="loading" class="scan-state">正在读取扫描页…</p>
      <p v-else-if="error" class="scan-state scan-state--error">
        {{ error }}
        <RouterLink to="/remedies">返回偏方目录</RouterLink>
      </p>

      <template v-else-if="data">
        <header class="scan-head">
          <div>
            <p class="eyebrow">SOURCE SCAN / 原书页附录</p>
            <h1>{{ data.book.title }}</h1>
            <p class="scan-head__sub">
              扫描页 {{ page }} / {{ totalPages }} · OCR 机器识别·待校
            </p>
          </div>
          <div class="scan-head__actions">
            <RouterLink
              v-if="remedyId"
              class="btn btn--ghost btn--small"
              :to="`/remedies/${remedyId}`"
            >
              返回该条偏方
            </RouterLink>
            <RouterLink class="btn btn--ghost btn--small" to="/remedies">返回目录</RouterLink>
          </div>
        </header>

        <div class="scan-note">
          <strong>阅读提示</strong>
          <p>
            本页 OCR 由 Windows 中文识别生成，未经逐字校对，只作检索与对照线索；原书文字、剂量与炮制方法以扫描页为准。
            页码为扫描图片顺序，页内印刷页码可能不同。
          </p>
        </div>

        <div class="scan-toolbar">
          <button class="btn btn--ghost btn--small" :disabled="page <= 1" @click="goPage(page - 1)">
            ← 上一页
          </button>
          <span class="scan-toolbar__pos">第 {{ page }} 页</span>
          <button
            class="btn btn--ghost btn--small"
            :disabled="page >= totalPages"
            @click="goPage(page + 1)"
          >
            下一页 →
          </button>
        </div>

        <div class="scan-layout">
          <figure class="scan-figure paper-panel">
            <img
              v-if="data.book.hasImages && !imageFailed"
              :src="imageSrc"
              :alt="`${data.book.title} 第 ${page} 页扫描图`"
              loading="lazy"
              @error="imageFailed = true"
            />
            <div v-else class="scan-figure__missing">
              本组扫描原图尚未入库；下方保留 OCR 文本。
            </div>
            <figcaption>{{ data.book.title }} · 扫描页 {{ page }}</figcaption>
          </figure>

          <section class="scan-text paper-panel">
            <span class="eyebrow">OCR TEXT / 机器识别</span>
            <h2>本页文字</h2>
            <pre v-if="pageText?.text" class="scan-text__body">{{ pageText.text }}</pre>
            <p v-else class="scan-text__empty">这一页没有识别出可用文字，请直接看左侧扫描图。</p>
            <p class="scan-text__note">{{ data.book.note }}</p>
          </section>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.scan-page {
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

.scan-head {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: end;
  padding-bottom: 22px;
  border-bottom: 1px solid var(--line-strong);
}

.scan-head h1 {
  margin: 5px 0 6px;
  font-size: clamp(2rem, 4.2vw, 3.2rem);
  letter-spacing: 0.04em;
}

.scan-head__sub {
  color: var(--ink-faint);
  font-size: 0.82rem;
}

.scan-head__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.scan-note {
  margin-top: 18px;
  padding: 14px 18px;
  border-left: 2px solid var(--cinnabar-2);
  background: rgba(241, 221, 214, 0.32);
}

.scan-note strong {
  font-family: var(--serif);
}

.scan-note p {
  margin-top: 4px;
  color: var(--ink-soft);
  font-size: 0.78rem;
  line-height: 1.8;
}

.scan-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 20px 0 16px;
}

.scan-toolbar__pos {
  color: var(--ink-soft);
  font-size: 0.82rem;
}

.scan-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 20px;
  align-items: start;
}

.scan-figure {
  margin: 0;
  padding: 12px;
}

.scan-figure img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 6px;
  background: var(--paper-2);
}

.scan-figure__missing {
  display: grid;
  place-items: center;
  min-height: 26rem;
  padding: 24px;
  border-radius: 6px;
  background: var(--paper-2);
  color: var(--ink-faint);
  font-size: 0.84rem;
  text-align: center;
}

.scan-figure figcaption {
  padding: 10px 4px 0;
  color: var(--ink-faint);
  font-size: 0.74rem;
  text-align: center;
}

.scan-text {
  position: sticky;
  top: 20px;
  padding: 20px 22px;
}

.scan-text h2 {
  margin: 3px 0 12px;
  font-size: 1.15rem;
}

.scan-text__body {
  max-height: 62vh;
  margin: 0;
  overflow: auto;
  padding: 14px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.55);
  color: var(--ink-soft);
  font-family: var(--serif);
  font-size: 0.9rem;
  line-height: 2;
  white-space: pre-wrap;
  word-break: break-word;
}

.scan-text__empty {
  color: var(--ink-faint);
  font-size: 0.82rem;
  line-height: 1.8;
}

.scan-text__note {
  margin-top: 12px;
  color: var(--ink-faint);
  font-size: 0.72rem;
  line-height: 1.7;
}

.scan-state {
  padding: 40px 0;
  color: var(--ink-faint);
}

.scan-state--error {
  color: var(--cinnabar);
}

@media (max-width: 900px) {
  .scan-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .scan-layout {
    grid-template-columns: 1fr;
  }

  .scan-text {
    position: static;
  }

  .scan-text__body {
    max-height: 50vh;
  }
}
</style>
