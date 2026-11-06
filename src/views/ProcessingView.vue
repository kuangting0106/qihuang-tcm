<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import CitationBadge from '@/components/CitationBadge.vue'
import ProcessingClassics from '@/components/ProcessingClassics.vue'
import { loadBencaoCatalog } from '@/composables/useBencaoLectures'
import { useTcmData } from '@/composables/useTcmData'
import { processingCategories } from '@/data/processing'
import type { BencaoCatalog } from '@/types/bencao'

const { data } = useTcmData()

const catalog = ref<BencaoCatalog | null>(null)
onMounted(async () => {
  try {
    catalog.value = await loadBencaoCatalog()
  } catch {
    catalog.value = null
  }
})

const lectureProcessing = computed(() =>
  (catalog.value?.items ?? []).filter((item) => item.hasProcessing && item.processingText),
)

function lectureRank(item: { rankId: string }) {
  return catalog.value?.ranks.find((rank) => rank.id === item.rankId)?.title ?? '讲义'
}

const herbs = computed(() => data.value?.herbs ?? [])
const examples = computed(() => data.value?.processingExamples ?? [])

const classicEntries = computed(() => data.value?.processingClassics?.entries ?? [])

const groups = computed(() =>
  processingCategories.map((category) => {
    const entries = herbs.value.filter((h) => h.processing?.categoryId === category.id)
    const classicCount = classicEntries.value.filter((e) => e.category === category.id).length
    return { ...category, entries, classicCount, totalCount: entries.length + classicCount }
  }),
)

const totalEntries = computed(() => groups.value.reduce((sum, group) => sum + group.totalCount, 0))

function categoryTitle(categoryId: string) {
  return processingCategories.find((category) => category.id === categoryId)?.title ?? categoryId
}
</script>

<template>
  <div class="page processing-page">
    <div class="container">
      <header class="processing-hero">
        <div>
          <p class="eyebrow">PROCESSING / 药材的炮制</p>
          <h1>药材的炮制</h1>
          <p class="processing-hero__lead">
            按草木类、蛇虫类、金石类收集药材炮制方法。每一条都与本草详情页共用同一份数据，
            并注明药典或炮制规范；来源未核的线索单独列出，不写成已收录方法。
          </p>
          <div class="processing-hero__meta">
            <span class="chip chip--gold">{{ processingCategories.length }} 个类别</span>
            <span class="chip">{{ totalEntries }} 味已收录</span>
            <span class="chip chip--jade">{{ lectureProcessing.length }} 味讲义炮制</span>
            <span class="chip">{{ examples.length }} 条待核线索</span>
          </div>
        </div>
        <div class="processing-hero__seal" aria-hidden="true">制</div>
      </header>

      <section class="processing-grid" aria-label="药材炮制类别">
        <article v-for="group in groups" :key="group.id" class="processing-card">
          <div class="processing-card__top">
            <span class="processing-card__kicker">{{ group.kicker }}</span>
            <span class="processing-card__status">{{ group.totalCount ? '已收录' : '待收录' }}</span>
          </div>
          <h2>{{ group.title }}</h2>
          <p class="processing-card__scope">{{ group.scope }}</p>
          <div class="processing-card__count">{{ group.totalCount }} 味已收录</div>
          <p class="processing-card__note">{{ group.note }}</p>
        </article>
      </section>

      <ProcessingClassics />

      <section class="processing-entries">
        <div class="section-head">
          <div>
            <p class="eyebrow">ENTRIES / 炮制条目</p>
            <h2>已收录条目</h2>
          </div>
          <p>
            只展示能回引具体出处的炮制方法。标为“摘录”的内容据药典【炮制】项归纳，
            不是逐字原文；具体工艺、辅料比例与成品性状须以现行版药典和当地炮制规范复核。
          </p>
        </div>

        <template v-for="group in groups" :key="group.id">
          <div v-if="group.entries.length" class="entry-group">
            <h3 class="entry-group__title">
              {{ group.title }}<span>{{ group.entries.length }} 味</span>
            </h3>
            <div class="entry-list">
              <article v-for="herb in group.entries" :key="herb.id" class="entry-card paper-panel">
                <div class="entry-card__top">
                  <div>
                    <RouterLink class="entry-card__name" :to="`/herbs/${herb.id}`">
                      {{ herb.name }}
                    </RouterLink>
                    <p class="entry-card__pinyin">{{ herb.pinyin }}</p>
                  </div>
                  <span class="chip chip--gold">已收录</span>
                </div>

                <p class="entry-card__summary">{{ herb.processing.summary }}</p>

                <div class="entry-card__methods">
                  <span v-for="method in herb.processing.methods" :key="method.label" class="method-chip">
                    {{ method.label }}
                  </span>
                </div>

                <dl class="entry-card__meta">
                  <div>
                    <dt>成品性状</dt>
                    <dd>{{ herb.processing.product }}</dd>
                  </div>
                  <div v-if="herb.processing.cautions.length">
                    <dt>使用注意</dt>
                    <dd>{{ herb.processing.cautions.join('；') }}</dd>
                  </div>
                </dl>

                <div class="entry-card__foot">
                  <div class="entry-card__sources">
                    <span class="kind-badge kind-badge--paraphrase">摘录</span>
                    <CitationBadge
                      :citation-ids="herb.processing.methods.flatMap((m) => m.citationIds)"
                      label="炮制出处"
                      tone="muted"
                      compact
                    />
                  </div>
                  <RouterLink class="text-link" :to="`/herbs/${herb.id}`">查看本草详情 →</RouterLink>
                </div>
              </article>
            </div>
          </div>

          <div v-else class="entry-empty paper-panel">
            <strong>{{ group.title }}暂无已核条目</strong>
            <p>该类药材的炮制方法尚未逐条核对，暂不写操作步骤。</p>
          </div>
        </template>
      </section>

      <section v-if="lectureProcessing.length" class="lecture-processing">
        <div class="section-head">
          <div>
            <p class="eyebrow">LECTURE NOTES / 讲义所载炮制</p>
            <h2>《神农本草经》讲义炮制摘录</h2>
          </div>
          <p>
            以下 36 味据倪海厦讲义「炮制」节摘出，原文未经现行药典与炮制规范逐条核对，
            因此只作阅读线索，不写成可操作工艺；实际炮制须由执业中药师按规范处理。
          </p>
        </div>

        <div class="lecture-processing__grid">
          <article v-for="item in lectureProcessing" :key="item.key" class="lecture-processing__card paper-panel">
            <div class="lecture-processing__top">
              <RouterLink :to="`/bencao/${item.groupId}/${item.entryId}`">{{ item.name }}</RouterLink>
              <span class="chip chip--gold">{{ lectureRank(item) }}</span>
            </div>
            <p class="lecture-processing__text">{{ item.processingText }}</p>
            <RouterLink class="text-link" :to="`/bencao/${item.groupId}/${item.entryId}`">
              查看讲义原文 →
            </RouterLink>
          </article>
        </div>
      </section>

      <section v-if="examples.length" class="pending-section">
        <div class="section-head">
          <div>
            <p class="eyebrow">PENDING / 待核线索</p>
            <h2>读者线索与待核条目</h2>
          </div>
          <p>
            下面几条来自读者提供，尚未核对原书与现行炮制规范，因此只展示线索，
            不作为已收录炮制方法，也不提供自行操作建议。
          </p>
        </div>

        <div class="pending-grid">
          <article v-for="example in examples" :key="example.id" class="pending-card">
            <div class="pending-card__top">
              <h3>{{ example.herbName }}</h3>
              <span class="pending-badge">待核</span>
            </div>
            <p class="pending-card__meta">
              <span v-if="example.rankHint">{{ example.rankHint }}</span>
              <span>{{ categoryTitle(example.categoryId) }}</span>
            </p>
            <ul>
              <li v-for="line in example.lines" :key="line">{{ line }}</li>
            </ul>
            <p class="pending-card__note">{{ example.note }}</p>
          </article>
        </div>
      </section>

      <section class="processing-rules paper-panel">
        <div>
          <span class="eyebrow">COLLECTION RULE</span>
          <h2>炮制不是“随便炒一下”</h2>
        </div>
        <div>
          <ul>
            <li><strong>出处先行</strong>：每法回引《雷公炮炙论》、药典或现行炮制规范；查不到就不写。</li>
            <li><strong>分类清楚</strong>：草木类、蛇虫类、金石类分开；毒性药材单独标注减毒、去毒与使用限制。</li>
            <li><strong>原文与归纳分开</strong>：古籍原文标“原文”，现代规范归纳标“摘录”，不混成同一句话。</li>
            <li><strong>安全边界</strong>：只做知识整理，不提供自行炮制、试药或临床用药建议。</li>
          </ul>
          <RouterLink class="text-link" to="/herbs">查看本草条目 →</RouterLink>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.processing-hero {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  align-items: center;
  padding: 30px 0 36px;
  border-bottom: 1px solid var(--line-strong);
}

.processing-hero h1 {
  margin: 6px 0 12px;
  font-size: clamp(3rem, 7vw, 5.4rem);
  letter-spacing: 0.08em;
}

.processing-hero__lead {
  max-width: 800px;
  color: var(--ink-soft);
  font-size: 0.95rem;
  line-height: 1.9;
}

.processing-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 16px;
}

.processing-hero__seal {
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 48% 52% 46% 54%;
  background: var(--gold);
  color: var(--paper);
  font-family: var(--serif);
  font-size: 2.8rem;
  transform: rotate(-4deg);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.22);
}

.processing-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  padding: 30px 0 36px;
}

.processing-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 20px 18px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: rgba(255, 252, 245, 0.55);
}

.processing-card__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.processing-card__kicker {
  color: var(--gold);
  font-size: 0.66rem;
  letter-spacing: 0.1em;
}

.processing-card__status {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(237, 224, 200, 0.55);
  color: var(--ink-soft);
  font-size: 0.64rem;
}

.processing-card h2 {
  margin-top: 2px;
  font-size: 1.6rem;
}

.processing-card__scope {
  color: var(--ink);
  font-size: 0.82rem;
  line-height: 1.8;
}

.processing-card__count {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.78rem;
}

.processing-card__note {
  color: var(--ink-faint);
  font-size: 0.74rem;
  line-height: 1.75;
}

.processing-entries {
  padding-bottom: 36px;
}

.entry-group + .entry-group {
  margin-top: 26px;
}

.entry-group__title {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--line);
  font-size: 1.12rem;
}

.entry-group__title span {
  color: var(--ink-faint);
  font-family: var(--sans);
  font-size: 0.7rem;
  letter-spacing: 0;
}

.entry-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.entry-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 20px;
}

.entry-card__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.entry-card__name {
  font-family: var(--serif);
  font-size: 1.28rem;
  letter-spacing: 0.04em;
}

.entry-card__name:hover {
  color: var(--cinnabar);
}

.entry-card__pinyin {
  margin-top: 1px;
  color: var(--ink-faint);
  font-size: 0.68rem;
  letter-spacing: 0.1em;
}

.entry-card__summary {
  color: var(--ink);
  font-size: 0.82rem;
  line-height: 1.85;
}

.entry-card__methods {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.method-chip {
  padding: 2px 8px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--ink-soft);
  font-size: 0.68rem;
}

.entry-card__meta {
  display: grid;
  gap: 6px;
}

.entry-card__meta > div {
  display: grid;
  grid-template-columns: 62px minmax(0, 1fr);
  gap: 8px;
}

.entry-card__meta dt {
  color: var(--ink-faint);
  font-size: 0.68rem;
  letter-spacing: 0.06em;
}

.entry-card__meta dd {
  color: var(--ink-soft);
  font-size: 0.76rem;
  line-height: 1.7;
}

.entry-card__foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--line);
}

.entry-card__sources {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.entry-card__foot .text-link {
  font-size: 0.74rem;
}

.entry-empty {
  padding: 20px 22px;
  margin-top: 12px;
}

.entry-empty strong {
  font-family: var(--serif);
  font-size: 1rem;
}

.entry-empty p {
  margin-top: 4px;
  color: var(--ink-soft);
  font-size: 0.78rem;
}

.classic-processing {
  padding: 28px 0 34px;
  border-top: 1px solid var(--line);
}

.classic-processing__books {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.classic-book {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 13px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: rgba(255, 252, 245, 0.5);
  text-align: left;
}

.classic-book strong {
  color: var(--ink);
  font-family: var(--serif);
  font-size: 0.9rem;
}

.classic-book span {
  color: var(--ink-faint);
  font-size: 0.64rem;
}

.classic-book--active {
  border-color: rgba(163, 58, 43, 0.4);
  background: rgba(241, 221, 214, 0.36);
}

.classic-book--active strong {
  color: var(--cinnabar);
}

.classic-processing__tools {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  margin-bottom: 14px;
}

.classic-processing__tools input {
  width: min(420px, 100%);
  padding: 9px 12px;
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.55);
  color: var(--ink);
  font-size: 0.8rem;
}

.classic-processing__tools span {
  color: var(--ink-faint);
  font-size: 0.7rem;
}

.classic-processing__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.classic-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 18px;
}

.classic-card__top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
}

.classic-card__top h3 {
  font-size: 1.18rem;
}

.classic-card__top p {
  margin-top: 2px;
  color: var(--ink-faint);
  font-size: 0.66rem;
}

.classic-card__block {
  display: grid;
  gap: 3px;
}

.classic-card__label {
  color: var(--gold);
  font-size: 0.64rem;
  letter-spacing: 0.08em;
}

.classic-card__block p {
  color: var(--ink-soft);
  font-family: var(--serif);
  font-size: 0.82rem;
  line-height: 1.9;
  white-space: pre-line;
}

.classic-card__empty {
  color: var(--ink-faint);
  font-family: var(--sans);
  font-size: 0.74rem;
}

.classic-card__foot {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-top: auto;
  padding-top: 9px;
  border-top: 1px dashed var(--line);
}

.classic-processing__more {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.lecture-processing {
  padding: 8px 0 28px;
  border-top: 1px dashed var(--line);
  margin-top: 12px;
}

.lecture-processing__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.lecture-processing__card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
}

.lecture-processing__top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.lecture-processing__top a {
  font-family: var(--serif);
  font-size: 1.02rem;
  letter-spacing: 0.04em;
}

.lecture-processing__text {
  display: -webkit-box;
  overflow: hidden;
  color: var(--ink-soft);
  font-size: 0.7rem;
  line-height: 1.7;
  white-space: pre-line;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 5;
}

.lecture-processing .text-link {
  margin-top: auto;
  font-size: 0.7rem;
}

.pending-section {
  padding-bottom: 36px;
}

.pending-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.pending-card {
  padding: 16px 18px;
  border: 1px dashed var(--line-strong);
  border-radius: 14px;
  background: rgba(255, 252, 245, 0.38);
}

.pending-card__top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.pending-card__top h3 {
  font-size: 1.1rem;
}

.pending-badge {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(241, 221, 214, 0.6);
  color: var(--cinnabar);
  font-size: 0.64rem;
}

.pending-card__meta {
  display: flex;
  gap: 8px;
  margin-top: 2px;
  color: var(--ink-faint);
  font-size: 0.66rem;
}

.pending-card__meta span + span::before {
  content: '·';
  margin-right: 8px;
}

.pending-card ul {
  margin: 9px 0 0;
  padding-left: 16px;
  color: var(--ink-soft);
  font-size: 0.78rem;
  line-height: 1.8;
}

.pending-card__note {
  margin-top: 9px;
  padding-top: 8px;
  border-top: 1px dashed var(--line);
  color: var(--ink-faint);
  font-size: 0.68rem;
  line-height: 1.7;
}

.processing-rules {
  display: grid;
  grid-template-columns: minmax(0, 0.5fr) minmax(0, 1.5fr);
  gap: 30px;
  padding: 22px 24px;
  margin-bottom: 40px;
}

.processing-rules h2 {
  margin-top: 3px;
  font-size: 1.3rem;
}

.processing-rules ul {
  margin: 0;
  padding-left: 18px;
  color: var(--ink-soft);
  font-size: 0.8rem;
  line-height: 1.9;
}

.processing-rules strong {
  color: var(--ink);
}

.processing-rules .text-link {
  display: inline-block;
  margin-top: 8px;
  font-size: 0.78rem;
}

@media (max-width: 960px) {
  .processing-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .entry-list,
  .pending-grid,
  .classic-processing__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .processing-hero {
    align-items: flex-start;
    gap: 16px;
  }

  .processing-hero h1 {
    font-size: clamp(2.4rem, 10vw, 3rem);
  }

  .processing-hero__seal {
    width: 62px;
    height: 62px;
    font-size: 1.35rem;
  }

  .processing-grid {
    grid-template-columns: 1fr;
  }

  .processing-rules {
    grid-template-columns: 1fr;
  }
}
</style>
