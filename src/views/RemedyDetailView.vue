<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  fetchRemedy,
  safetyLabel,
  type RemedyDetail,
} from '@/composables/useRemedyApi'
import { fetchScanIndex, type RemedyScanPageRef } from '@/composables/useRemedyScan'

const route = useRoute()
const remedy = ref<RemedyDetail | null>(null)
const scanRef = ref<RemedyScanPageRef | null>(null)
const loading = ref(true)
const error = ref('')

const safetyClass = computed(() => `is-${remedy.value?.safetyLevel ?? 'low'}`)
const safetyText = computed(() =>
  remedy.value ? safetyLabel(remedy.value.safetyLevel) : '',
)
const hasStructuredText = computed(() =>
  Boolean(
    remedy.value?.indications ||
      remedy.value?.formula ||
      remedy.value?.usage ||
      remedy.value?.cautions ||
      remedy.value?.appendix,
  ),
)
const sourceLine = computed(() => {
  const item = remedy.value
  if (!item) return ''
  return [item.book, item.author, item.dynasty, item.year]
    .filter(Boolean)
    .filter((part, index, list) => list.indexOf(part) === index)
    .join(' · ')
})

async function load(id: string) {
  loading.value = true
  error.value = ''
  remedy.value = null
  scanRef.value = null
  try {
    const [detail, scanIndex] = await Promise.all([
      fetchRemedy(id),
      fetchScanIndex().catch(() => null),
    ])
    remedy.value = detail
    scanRef.value = scanIndex?.remedyPages[id] ?? null
  } catch (err) {
    error.value = err instanceof Error ? err.message : '偏方读取失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => load(String(route.params.id)))

watch(
  () => route.params.id,
  (id) => {
    if (id && route.name === 'remedy-detail') void load(String(id))
  },
)
</script>

<template>
  <div class="page remedy-page">
    <div class="container">
      <nav class="breadcrumbs">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/remedies">民间偏方集录</RouterLink>
        <span>/</span>
        <span>{{ remedy?.title ?? '偏方详情' }}</span>
      </nav>

      <p v-if="loading" class="remedy-state">正在读取原文…</p>
      <p v-else-if="error" class="remedy-state remedy-state--error">
        {{ error }}
        <RouterLink to="/remedies">返回偏方目录</RouterLink>
      </p>

      <template v-else-if="remedy">
        <header class="remedy-hero">
          <div class="remedy-hero__main">
            <div class="remedy-hero__badges">
              <span class="remedy-safety" :class="safetyClass">{{ safetyText }}</span>
              <span class="remedy-era">{{ remedy.era || '年代不详' }}</span>
              <span class="remedy-category">
                {{ remedy.category }}<template v-if="remedy.subcategory"> / {{ remedy.subcategory }}</template>
              </span>
            </div>
            <h1>{{ remedy.title }}</h1>
            <p v-if="sourceLine" class="remedy-source-line">{{ sourceLine }}</p>
            <p v-if="remedy.section && remedy.section !== remedy.title" class="remedy-section-line">
              原书栏目：{{ remedy.section }}<template v-if="remedy.chapter"> · {{ remedy.chapter }}</template>
            </p>
          </div>
          <RouterLink class="remedy-back" to="/remedies">返回目录</RouterLink>
        </header>

        <div v-if="remedy.safetyLevel !== 'low'" class="remedy-alert" :class="safetyClass">
          <strong v-if="remedy.safetyLevel === 'high'">高风险原文，仅供文献学习</strong>
          <strong v-else>使用需谨慎</strong>
          <p v-if="remedy.safetyLevel === 'high'">
            本方含毒性或峻烈药材，或原文明确标注禁忌。请勿自行采集、配制或服用；如已误服或出现不适，立即就医。
          </p>
          <p v-else>
            本方可能含孕妇、儿童禁忌或外用要求，请先咨询中医师，不要自行长期服用。
          </p>
          <p v-if="remedy.toxicTags?.length" class="remedy-alert__tags">
            相关药材：{{ remedy.toxicTags.join('、') }}
          </p>
        </div>

        <article class="remedy-sheet">
          <section v-if="hasStructuredText" class="remedy-block">
            <h2>原文摘录</h2>
            <p class="remedy-note">
              以下字段由原文自动切分，可能因古籍排版或 OCR 而错位；请以“完整原文”为准。
            </p>
            <dl class="remedy-fields">
              <div v-if="remedy.indications">
                <dt>主治</dt>
                <dd>{{ remedy.indications }}</dd>
              </div>
              <div v-if="remedy.formula">
                <dt>方药</dt>
                <dd>{{ remedy.formula }}</dd>
              </div>
              <div v-if="remedy.usage">
                <dt>用法</dt>
                <dd>{{ remedy.usage }}</dd>
              </div>
              <div v-if="remedy.cautions">
                <dt>注意事项</dt>
                <dd>{{ remedy.cautions }}</dd>
              </div>
              <div v-if="remedy.appendix">
                <dt>附录</dt>
                <dd>{{ remedy.appendix }}</dd>
              </div>
              <div v-if="remedy.source">
                <dt>来源</dt>
                <dd>{{ remedy.source }}</dd>
              </div>
            </dl>
          </section>

          <section v-if="remedy.raw" class="remedy-block">
            <h2>完整原文</h2>
            <div class="remedy-raw">{{ remedy.raw }}</div>
          </section>

          <section v-if="sourceLine || remedy.sourceNote" class="remedy-block">
            <h2>出处</h2>
            <p v-if="sourceLine" class="remedy-cite">{{ sourceLine }}</p>
            <p v-if="remedy.sourceNote" class="remedy-cite">{{ remedy.sourceNote }}</p>
            <p class="remedy-cite">原书栏目：{{ remedy.section || '未标注' }}</p>
            <div v-if="scanRef" class="remedy-scan">
              <RouterLink
                class="remedy-scan__link"
                :to="{
                  name: 'remedy-scan-page',
                  params: { bookId: 'QZ01', page: String(scanRef.page) },
                  query: { remedy: remedy.id },
                }"
              >
                查看原书扫描页 · 第 {{ scanRef.page }} 页 →
              </RouterLink>
              <p class="remedy-scan__note">
                {{
                  scanRef.mode === 'section'
                    ? '该条按所在章节定位，扫描页可能不是这一方的确切页；请结合左侧原图与完整原文核对。'
                    : '扫描页为 OCR 自动匹配，可能因识别误差偏移；请以原图为准。'
                }}
              </p>
            </div>
          </section>
        </article>

        <footer class="remedy-disclaimer">
          <strong>阅读提示</strong>
          <p>
            本页为古籍与民间资料的原文整理，不是处方。文中剂量均为原文记载，仅供文献学习与参考，不等同现代临床用量。
            偏方未经现代医学验证，不能替代医生诊断和治疗；孕妇、儿童、老人及慢性病患者尤其不要自行尝试。
          </p>
        </footer>
      </template>
    </div>
  </div>
</template>

<style scoped>
.remedy-page {
  padding-bottom: 72px;
}

.remedy-hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: start;
  margin: 20px 0 24px;
}

.remedy-hero__main {
  min-width: 0;
}

.remedy-hero__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
}

.remedy-safety,
.remedy-era,
.remedy-category {
  padding: 3px 9px;
  border: 1px solid var(--line);
  font-size: 0.78rem;
}

.remedy-safety.is-high {
  border-color: #a33a2b;
  background: #fbf3f0;
  color: #8c2f22;
}

.remedy-safety.is-medium {
  border-color: #b58a3a;
  background: #fdf8ec;
  color: #8a6420;
}

.remedy-era,
.remedy-category {
  color: var(--muted);
}

.remedy-hero h1 {
  margin: 0 0 10px;
  font-size: clamp(1.7rem, 3.4vw, 2.6rem);
  line-height: 1.35;
  letter-spacing: 0.03em;
}

.remedy-source-line,
.remedy-section-line {
  margin: 4px 0 0;
  color: var(--muted);
  line-height: 1.7;
}

.remedy-back {
  flex: none;
  padding: 8px 14px;
  border: 1px solid var(--line);
  color: inherit;
  text-decoration: none;
  font-size: 0.86rem;
}

.remedy-back:hover {
  border-color: var(--ink);
}

.remedy-alert {
  margin-bottom: 24px;
  padding: 16px 20px;
  border-left: 4px solid var(--line);
  background: #f7f5ef;
}

.remedy-alert.is-high {
  border-left-color: #a33a2b;
  background: #fbf3f0;
}

.remedy-alert.is-medium {
  border-left-color: #b58a3a;
  background: #fdf8ec;
}

.remedy-alert strong {
  color: #8c2f22;
}

.remedy-alert.is-medium strong {
  color: #8a6420;
}

.remedy-alert p {
  margin: 6px 0 0;
  line-height: 1.8;
  font-size: 0.92rem;
}

.remedy-alert__tags {
  color: var(--muted);
}

.remedy-sheet {
  display: grid;
  gap: 22px;
}

.remedy-block {
  padding: 24px;
  border: 1px solid var(--line);
  background: var(--paper);
}

.remedy-block h2 {
  margin: 0 0 14px;
  font-size: 1.05rem;
  letter-spacing: 0.08em;
}

.remedy-note {
  margin: -4px 0 16px;
  color: var(--muted);
  font-size: 0.84rem;
  line-height: 1.7;
}

.remedy-fields {
  display: grid;
  gap: 14px;
  margin: 0;
}

.remedy-fields div {
  display: grid;
  grid-template-columns: 4.2em minmax(0, 1fr);
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px dashed var(--line);
}

.remedy-fields div:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.remedy-fields dt {
  color: var(--muted);
  font-size: 0.9rem;
}

.remedy-fields dd {
  margin: 0;
  line-height: 1.9;
}

.remedy-raw {
  max-height: 34rem;
  overflow: auto;
  padding: 16px 18px;
  border: 1px solid var(--line);
  background: #faf8f3;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 2;
  font-size: 0.94rem;
}

.remedy-cite {
  margin: 0 0 8px;
  color: var(--muted);
  line-height: 1.8;
}

.remedy-cite:last-child {
  margin-bottom: 0;
}

.remedy-scan {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--line);
}

.remedy-scan__link {
  display: inline-block;
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.95rem;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.remedy-scan__note {
  margin-top: 6px;
  color: var(--ink-faint);
  font-size: 0.72rem;
  line-height: 1.7;
}

.remedy-disclaimer {
  margin-top: 24px;
  padding: 18px 22px;
  border: 1px solid var(--line);
  background: #f7f5ef;
}

.remedy-disclaimer strong {
  display: block;
  margin-bottom: 6px;
}

.remedy-disclaimer p {
  margin: 0;
  color: var(--muted);
  line-height: 1.85;
  font-size: 0.9rem;
}

.remedy-state {
  padding: 48px 0;
  color: var(--muted);
  text-align: center;
}

.remedy-state--error {
  color: #8c2f22;
}

.remedy-state a {
  margin-left: 8px;
  color: inherit;
}

@media (max-width: 700px) {
  .remedy-hero {
    flex-direction: column;
  }

  .remedy-block {
    padding: 18px;
  }

  .remedy-fields div {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>
