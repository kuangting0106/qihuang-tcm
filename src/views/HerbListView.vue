<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import HerbPropertyPrinciples from '@/components/HerbPropertyPrinciples.vue'
import { formatCharCount, loadBencaoCatalog, loadBencaoIndex } from '@/composables/useBencaoLectures'
import { useTcmData } from '@/composables/useTcmData'
import type { BencaoCatalog } from '@/types/bencao'

const { data } = useTcmData()

const herbs = computed(() => data.value?.herbs ?? [])
const taxonomy = computed(() => data.value?.herbTaxonomy ?? null)

const catalog = ref<BencaoCatalog | null>(null)
const lectureCount = ref(0)
const lectureChars = ref(0)

onMounted(async () => {
  try {
    const [library, index] = await Promise.all([loadBencaoCatalog(), loadBencaoIndex()])
    catalog.value = library
    lectureCount.value = index.groups.reduce((sum, group) => sum + group.count, 0)
    lectureChars.value = index.groups.reduce((sum, group) => sum + group.charCount, 0)
  } catch {
    catalog.value = null
    lectureCount.value = 0
  }
})

const lectureItems = computed(() => (catalog.value?.items ?? []).filter((item) => !item.curatedId))
const totalHerbCount = computed(() => herbs.value.length + lectureItems.value.length)

function rankHerbs(rankId: string) {
  return herbs.value.filter((herb) => herb.classicRankId === rankId)
}

function rankLecture(rankId: string) {
  return lectureItems.value.filter((item) => item.rankId === rankId)
}

function rankTotal(rankId: string) {
  return rankHerbs(rankId).length + rankLecture(rankId).length
}

function rankPreview(rankId: string) {
  return [
    ...rankHerbs(rankId).map((herb) => herb.name),
    ...rankLecture(rankId).map((item) => item.name),
  ].slice(0, 6)
}

function categoryHerbs(categoryId: string) {
  return herbs.value.filter((herb) => herb.therapyCategoryIds.includes(categoryId))
}

function categoryLecture(categoryId: string) {
  return lectureItems.value.filter((item) => item.therapyCategoryIds.includes(categoryId))
}

function categoryTotal(categoryId: string) {
  return categoryHerbs(categoryId).length + categoryLecture(categoryId).length
}

function categoryPreview(categoryId: string) {
  return [
    ...categoryHerbs(categoryId).map((herb) => herb.name),
    ...categoryLecture(categoryId).map((item) => item.name),
  ].slice(0, 6)
}

const supplementRanks = computed(() =>
  (catalog.value?.ranks ?? []).filter((rank) => rank.id === 'nishi' || rank.id === 'editor'),
)
</script>

<template>
  <div class="page herb-list-page">
    <div class="container">
      <header class="page-hero">
        <div>
          <p class="eyebrow">MATERIA MEDICA / 本草</p>
          <h1>本草</h1>
          <p class="page-hero__lead">
            先看性味归经，再看功效主治。三经与功效分类是两套阅读入口，
            同一味药可以从任一入口进入详情，再跳到另一套索引。
          </p>
        </div>
        <div class="page-hero__stat">
          <span>{{ totalHerbCount }}</span>
          <small>味药材（含讲义）</small>
          <span>{{ data?.formulas.length ?? 0 }}</span>
          <small>首方剂交叉索引</small>
        </div>
      </header>

      <HerbPropertyPrinciples />

      <section v-if="taxonomy" class="taxonomy-section" aria-label="本草分类">
        <div class="taxonomy-head">
          <div>
            <p class="eyebrow">CLASSIFICATION / 分类</p>
            <h2>三经为纲，功效分类为目</h2>
          </div>
          <p class="taxonomy-head__note">
            三经名目见《神农本草经》序录；十二个功效分类是本站导航标签，不是经典原文。
            点开任一分类，可查看该类的全部药材。
          </p>
        </div>

        <div class="rank-grid">
          <RouterLink
            v-for="rank in taxonomy.ranks"
            :key="rank.id"
            class="rank-card"
            :class="`rank-card--${rank.id}`"
            :to="`/herbs/rank/${rank.id}`"
          >
            <span class="rank-card__top">
              <span class="rank-card__title">{{ rank.title }}</span>
              <span class="rank-card__count">{{ rankTotal(rank.id) }} 味</span>
            </span>
            <span class="rank-card__subtitle">{{ rank.subtitle }}</span>
            <span class="rank-card__desc">{{ rank.description }}</span>
            <span class="rank-card__herbs">
              <span v-for="name in rankPreview(rank.id)" :key="name">{{ name }}</span>
              <span v-if="rankTotal(rank.id) > 6" class="rank-card__more">等 {{ rankTotal(rank.id) }} 味</span>
            </span>
            <span class="rank-card__go">查看全部 →</span>
          </RouterLink>
        </div>

        <div v-if="supplementRanks.length" class="supplement-line">
          <span>三经之外另有补列：</span>
          <RouterLink v-for="rank in supplementRanks" :key="rank.id" :to="`/herbs/rank/${rank.id}`">
            {{ rank.title }} {{ rank.count }} 味
          </RouterLink>
          <span class="supplement-line__note">经方所用与整理者增补，均单列，不混入三经。</span>
        </div>

        <div class="therapy-grid">
          <RouterLink
            v-for="cat in taxonomy.categories"
            :key="cat.id"
            class="therapy-card"
            :to="`/herbs/category/${cat.id}`"
          >
            <span class="therapy-card__head">
              <h3>{{ cat.title }}</h3>
              <span>{{ categoryTotal(cat.id) }} 味</span>
            </span>
            <span class="therapy-card__desc">{{ cat.description }}</span>
            <span class="therapy-card__herbs">
              <span v-for="name in categoryPreview(cat.id)" :key="name">{{ name }}</span>
              <span v-if="categoryTotal(cat.id) > 6" class="therapy-card__more">…</span>
              <span v-if="!categoryTotal(cat.id) && !cat.pending.length" class="pending-text">待收录</span>
            </span>
            <span class="therapy-card__go">查看全部 →</span>
          </RouterLink>
        </div>

        <p class="taxonomy-foot">
          {{ taxonomy.note }}
          讲义药材的功效分类据公开中药资料映射，只用于导航，不作辨证依据。
        </p>
      </section>

      <section class="course-section" aria-label="讲义与课程">
        <div class="section-head">
          <div>
            <p class="eyebrow">LECTURES / 讲义与课程</p>
            <h2>讲义与课程</h2>
          </div>
          <p>按上线顺序排列；课程讲义与药典条目分栏阅读，不混为同一套校勘本。</p>
        </div>

        <div class="course-list">
          <RouterLink class="lecture-entry" to="/bencao">
            <span class="lecture-entry__seal" aria-hidden="true">本</span>
            <span class="lecture-entry__body">
              <span class="eyebrow">LECTURE NOTES / 本草讲记</span>
              <strong>倪海厦《神农本草经》讲义</strong>
              <span class="lecture-entry__desc">
                按上经、中经、下经逐味整理，附《伤寒》《金匮》所用而《本经》未收的药物；
                原文、注家、讲义归纳与课堂讲授分层标注。
              </span>
            </span>
            <span class="lecture-entry__meta">
              <span v-if="lectureCount">{{ lectureCount }} 条 · {{ formatCharCount(lectureChars) }}</span>
              <span v-else>进入讲义</span>
              <span class="lecture-entry__arrow" aria-hidden="true">→</span>
            </span>
          </RouterLink>
        </div>
      </section>

      <p class="page-foot-note">
        本页只做分类索引与阅读入口，不构成用药建议；具体性味、归经、功效、主治与炮制，以各药详情页所注出处为准。
      </p>
    </div>
  </div>
</template>

<style scoped>
.page-hero {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  align-items: flex-end;
  padding: 26px 0 34px;
}

.page-hero h1 {
  margin: 6px 0 12px;
  font-size: clamp(3rem, 7vw, 5.6rem);
}

.page-hero__lead {
  max-width: 720px;
  color: var(--ink-soft);
  font-size: 0.9rem;
  line-height: 1.9;
}

.page-hero__stat {
  display: grid;
  grid-template-columns: auto auto;
  gap: 1px 10px;
  align-items: baseline;
  padding-left: 20px;
  border-left: 1px solid var(--line-strong);
}

.page-hero__stat span {
  font-family: var(--serif);
  font-size: 1.45rem;
  line-height: 1.25;
}

.page-hero__stat small {
  color: var(--ink-soft);
  font-size: 0.68rem;
}

.taxonomy-section {
  margin: 26px 0 0;
}

.taxonomy-head {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  align-items: flex-end;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line-strong);
}

.taxonomy-head h2 {
  margin-top: 4px;
  font-family: var(--serif);
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  font-weight: 400;
  letter-spacing: 0.05em;
}

.taxonomy-head__note {
  max-width: 440px;
  color: var(--ink-faint);
  font-size: 0.72rem;
  line-height: 1.8;
}

.rank-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.rank-card {
  --rank-color: var(--jade);
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px 20px 16px;
  border: 1px solid var(--line);
  border-top: 2px solid var(--rank-color);
  border-radius: 4px 4px 14px 14px;
  background: rgba(255, 252, 245, 0.6);
  color: inherit;
  text-decoration: none;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease;
}

.rank-card:hover {
  transform: translateY(-3px);
  border-color: var(--rank-color);
  background: rgba(255, 252, 245, 0.92);
}

.rank-card--middle {
  --rank-color: var(--gold);
}

.rank-card--lower {
  --rank-color: var(--cinnabar);
}

.rank-card__top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: baseline;
}

.rank-card__title {
  font-family: var(--serif);
  font-size: 1.7rem;
  letter-spacing: 0.1em;
}

.rank-card__count {
  color: var(--rank-color);
  font-family: var(--serif);
  font-size: 0.9rem;
}

.rank-card__subtitle {
  color: var(--rank-color);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
}

.rank-card__desc {
  color: var(--ink-soft);
  font-size: 0.72rem;
  line-height: 1.75;
}

.rank-card__herbs {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 10px;
  margin-top: 4px;
  padding-top: 9px;
  border-top: 1px dashed var(--line);
  color: var(--ink-soft);
  font-size: 0.68rem;
}

.rank-card__more {
  color: var(--ink-faint);
}

.rank-card__go,
.therapy-card__go {
  margin-top: auto;
  padding-top: 8px;
  color: var(--rank-color);
  font-size: 0.68rem;
  letter-spacing: 0.04em;
}

.supplement-line {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  align-items: baseline;
  margin-top: 10px;
  color: var(--ink-faint);
  font-size: 0.7rem;
}

.supplement-line a {
  color: var(--ink-soft);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.supplement-line__note {
  margin-left: auto;
}

.therapy-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;
}

.therapy-card {
  --rank-color: var(--ink-soft);
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 13px 15px 12px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255, 252, 245, 0.4);
  color: inherit;
  text-decoration: none;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    transform 0.18s ease;
}

.therapy-card:hover {
  transform: translateY(-2px);
  border-color: var(--jade);
  background: rgba(255, 252, 245, 0.88);
}

.therapy-card__head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: baseline;
}

.therapy-card__head h3 {
  font-size: 0.92rem;
  letter-spacing: 0.03em;
}

.therapy-card__head span {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.76rem;
  white-space: nowrap;
}

.therapy-card__desc {
  color: var(--ink-faint);
  font-size: 0.66rem;
  line-height: 1.6;
}

.therapy-card__herbs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  color: var(--ink-soft);
  font-size: 0.64rem;
  line-height: 1.6;
}

.therapy-card__more {
  color: var(--ink-faint);
}

.therapy-card__go {
  color: var(--jade);
}

.taxonomy-foot {
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px dashed var(--line);
  color: var(--ink-faint);
  font-size: 0.68rem;
  line-height: 1.8;
}

.course-section {
  margin-top: 44px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  align-items: flex-end;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line-strong);
}

.section-head h2 {
  margin-top: 4px;
  font-family: var(--serif);
  font-size: clamp(1.4rem, 2.6vw, 1.9rem);
  font-weight: 400;
  letter-spacing: 0.05em;
}

.section-head > p {
  max-width: 440px;
  color: var(--ink-faint);
  font-size: 0.72rem;
  line-height: 1.8;
}

.course-list {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.lecture-entry {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 16px 20px;
  border: 1px solid color-mix(in srgb, var(--jade) 30%, var(--line));
  border-radius: 16px;
  background:
    linear-gradient(100deg, rgba(228, 239, 229, 0.72), rgba(255, 252, 245, 0.5)),
    rgba(255, 252, 245, 0.6);
  color: inherit;
  text-decoration: none;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.lecture-entry:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-soft);
}

.lecture-entry__seal {
  flex-shrink: 0;
  display: grid;
  place-content: center;
  width: 48px;
  height: 48px;
  border: 1px solid var(--cinnabar);
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 1.6rem;
}

.lecture-entry__body {
  display: grid;
  flex: 1;
  gap: 3px;
  min-width: 0;
}

.lecture-entry__body strong {
  font-family: var(--serif);
  font-size: 1.06rem;
  font-weight: 400;
  letter-spacing: 0.04em;
}

.lecture-entry__desc {
  color: var(--ink-soft);
  font-size: 0.72rem;
  line-height: 1.7;
}

.lecture-entry__meta {
  display: flex;
  flex-shrink: 0;
  gap: 12px;
  align-items: center;
  color: var(--ink-faint);
  font-size: 0.7rem;
  white-space: nowrap;
}

.lecture-entry__arrow {
  color: var(--jade);
  font-size: 1rem;
}

.page-foot-note {
  margin-top: 26px;
  color: var(--ink-faint);
  font-size: 0.68rem;
  line-height: 1.8;
}

@media (max-width: 1100px) {
  .therapy-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .page-hero {
    align-items: flex-start;
    flex-direction: column;
    gap: 18px;
  }

  .page-hero__stat {
    padding-left: 0;
    border-left: 0;
  }

  .taxonomy-head,
  .section-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .rank-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .therapy-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .supplement-line__note {
    margin-left: 0;
  }

  .lecture-entry {
    align-items: flex-start;
    padding: 14px;
  }

  .lecture-entry__seal {
    width: 40px;
    height: 40px;
    font-size: 1.3rem;
  }

  .lecture-entry__meta {
    align-items: flex-end;
    flex-direction: column;
    gap: 2px;
  }
}

@media (max-width: 520px) {
  .therapy-grid {
    grid-template-columns: 1fr;
  }
}
</style>
