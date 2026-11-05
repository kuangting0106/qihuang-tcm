<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import BencaoHerbCard from '@/components/BencaoHerbCard.vue'
import HerbCard from '@/components/HerbCard.vue'
import HerbPropertyPrinciples from '@/components/HerbPropertyPrinciples.vue'
import { formatCharCount } from '@/composables/useBencaoLectures'
import {
  useHerbApi,
  type HerbMetaPayload,
  type HerbSearchIndexPayload,
} from '@/composables/useHerbApi'
import type { BencaoCatalogItem } from '@/types/bencao'
import type { Herb } from '@/types/tcm'

const { loading, error, fetchHerbMeta, fetchHerbSearchIndex } = useHerbApi()
const route = useRoute()
const router = useRouter()

const meta = ref<HerbMetaPayload | null>(null)
const herbs = ref<Herb[]>([])
const lectureItems = ref<BencaoCatalogItem[]>([])
const meridianLookup = ref<Record<string, string>>({})

const query = ref('')
const flavor = ref('')
const meridian = ref('')
const rankFilter = ref(typeof route.query.rank === 'string' ? route.query.rank : '')
const categoryFilter = ref(typeof route.query.category === 'string' ? route.query.category : '')
const lectureLimit = ref(60)

const taxonomy = computed(() => meta.value?.taxonomy ?? null)
const counts = computed(() => meta.value?.counts ?? null)
const lectureCount = computed(() => counts.value?.lectureEntries ?? 0)
const lectureChars = computed(() => counts.value?.lectureChars ?? 0)

async function load() {
  try {
    const [nextMeta, nextIndex] = await Promise.all([
      fetchHerbMeta(),
      fetchHerbSearchIndex(),
    ])
    meta.value = nextMeta
    herbs.value = nextIndex.herbs
    lectureItems.value = nextIndex.lectures.filter((item) => !item.curatedId)
    meridianLookup.value = Object.fromEntries(
      nextMeta.meridians.map((entry) => [entry.id, entry.name]),
    )
  } catch {
    // 错误信息由 composable 的 error 展示。
  }
}

onMounted(load)

watch(
  () => [route.query.rank, route.query.category],
  ([rank, category]) => {
    rankFilter.value = typeof rank === 'string' ? rank : ''
    categoryFilter.value = typeof category === 'string' ? category : ''
  },
)

const lectureFiltered = computed(() => {
  if (categoryFilter.value) return []
  const q = query.value.trim().toLowerCase()
  return lectureItems.value.filter((item) => {
    if (rankFilter.value && item.rankId !== rankFilter.value) return false
    if (flavor.value && !item.flavorTags.includes(flavor.value)) return false
    if (meridian.value && !item.meridianIds.includes(meridian.value)) return false
    if (!q) return true
    return [
      item.name,
      item.pinyin,
      item.nature,
      ...item.flavorTags,
      ...item.aliases,
      ...item.meridianNames,
      item.effects,
      item.indications,
      item.summary,
    ]
      .join(' ')
      .toLowerCase()
      .includes(q)
  })
})

const visibleLecture = computed(() => lectureFiltered.value.slice(0, lectureLimit.value))
const totalHerbCount = computed(() => (counts.value?.herbs ?? 0) + (counts.value?.lectureItems ?? 0))

watch([query, flavor, rankFilter, categoryFilter, meridian], () => {
  lectureLimit.value = 60
})

function lectureRankCount(rankId: string) {
  return lectureItems.value.filter((item) => item.rankId === rankId).length
}

function rankLabel(rankId: string) {
  return taxonomy.value?.ranks.find((rank) => rank.id === rankId)?.title ?? '讲义'
}

const RANK_GROUPS: Record<string, string> = {
  upper: 'shangjing',
  middle: 'zhongjing',
  lower: 'xiajing',
}

function groupForRank(rankId: string) {
  return RANK_GROUPS[rankId] ?? ''
}

function meridianName(id: string) {
  return meridianLookup.value[id] ?? id
}

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return herbs.value.filter((h) => {
    if (rankFilter.value && h.classicRankId !== rankFilter.value) return false
    if (categoryFilter.value && !h.therapyCategoryIds.includes(categoryFilter.value)) return false
    if (flavor.value && !h.flavorTags.includes(flavor.value)) return false
    if (meridian.value && !h.meridianIds.includes(meridian.value)) return false
    if (!q) return true
    const haystack = [
      h.name,
      h.pinyin,
      ...h.aliases,
      ...h.flavorTags,
      ...h.meridianIds.map((id) => meridianName(id)),
      h.properties.effects.text,
      h.properties.indications.text,
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
})

const allFlavorTags = computed(() => {
  const tags = new Set<string>(['热'])
  for (const herb of herbs.value) herb.flavorTags.forEach((tag) => tags.add(tag))
  for (const item of lectureItems.value) item.flavorTags.forEach((tag) => tags.add(tag))
  return [...tags]
})

const activeFilters = computed(
  () => [query.value, flavor.value, meridian.value, rankFilter.value, categoryFilter.value].filter(Boolean).length,
)

function reset() {
  query.value = ''
  flavor.value = ''
  meridian.value = ''
  rankFilter.value = ''
  categoryFilter.value = ''
  syncTaxonomyQuery()
}

function syncTaxonomyQuery() {
  const next = { ...route.query }
  if (rankFilter.value) next.rank = rankFilter.value
  else delete next.rank
  if (categoryFilter.value) next.category = categoryFilter.value
  else delete next.category
  router.replace({ query: next })
}

function rankHerbs(rankId: string) {
  return herbs.value.filter((h) => h.classicRankId === rankId)
}

function categoryHerbs(categoryId: string) {
  return herbs.value.filter((h) => h.therapyCategoryIds.includes(categoryId))
}

function toggleRank(rankId: string) {
  rankFilter.value = rankFilter.value === rankId ? '' : rankId
  categoryFilter.value = ''
  syncTaxonomyQuery()
  scrollToResults()
}

function toggleCategory(categoryId: string) {
  categoryFilter.value = categoryFilter.value === categoryId ? '' : categoryId
  rankFilter.value = ''
  syncTaxonomyQuery()
  scrollToResults()
}

function clearTaxonomy() {
  rankFilter.value = ''
  categoryFilter.value = ''
  syncTaxonomyQuery()
}

function scrollToResults() {
  nextTick(() => {
    document.getElementById('herb-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

const meridianOptions = computed(() =>
  (meta.value?.meridians ?? []).filter(
    (m) =>
      herbs.value.some((h) => h.meridianIds.includes(m.id)) ||
      lectureItems.value.some((item) => item.meridianIds.includes(m.id)),
  ),
)
</script>

<template>
  <div class="page herb-list-page">
    <div class="container">
      <div v-if="error" class="data-error paper-panel">
        <p>{{ error }}</p>
        <button class="btn btn--primary" type="button" @click="load">重新加载</button>
      </div>
      <p v-else-if="loading && !meta" class="data-loading">正在加载本草索引…</p>

      <header class="page-hero">
        <div>
          <p class="eyebrow">MATERIA MEDICA / 本草</p>
          <h1>本草</h1>
          <p class="page-hero__lead">
            先看性味归经，再看功效主治。每味药的字段都挂出处；
            配伍关系另标“后世方解”，不把后世归纳冒充经典原文。
          </p>
        </div>
        <div class="page-hero__stat">
          <span>{{ totalHerbCount }}</span>
          <small>味药材（含讲义）</small>
          <span>{{ counts?.formulas ?? 0 }}</span>
          <small>首方剂交叉索引</small>
        </div>
      </header>

      <HerbPropertyPrinciples :principles="meta?.principles ?? null" />

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

      <section v-if="taxonomy" class="taxonomy-section" aria-label="本草分类">
        <div class="taxonomy-head">
          <div>
            <p class="eyebrow">CLASSIFICATION / 分类</p>
            <h2>三经为纲，功效分类为目</h2>
          </div>
          <p class="taxonomy-head__note">
            三经名目见《神农本草经》序录；十二个功效分类是本站导航标签，不是经典原文。
            同一味药可以同时出现在三经与多个功效分类中。
          </p>
        </div>

        <div class="rank-grid">
          <article
            v-for="rank in taxonomy.ranks"
            :key="rank.id"
            class="rank-card"
            :class="[`rank-card--${rank.id}`, { 'rank-card--active': rankFilter === rank.id }]"
          >
            <button class="rank-card__select" type="button" :aria-pressed="rankFilter === rank.id" @click="toggleRank(rank.id)">
              <span class="rank-card__title">{{ rank.title }}</span>
              <span class="rank-card__subtitle">{{ rank.subtitle }}</span>
              <span class="rank-card__count">{{ rankHerbs(rank.id).length }} 味药典样例</span>
            </button>
            <p class="rank-card__desc">{{ rank.description }}</p>
            <div class="rank-card__herbs">
              <RouterLink v-for="h in rankHerbs(rank.id).slice(0, 8)" :key="h.id" :to="`/herbs/${h.id}`">
                {{ h.name }}
              </RouterLink>
              <span v-if="rankHerbs(rank.id).length > 8" class="rank-card__more">
                +{{ rankHerbs(rank.id).length - 8 }}
              </span>
              <span v-if="!rankHerbs(rank.id).length" class="pending-text">待收录</span>
            </div>
            <RouterLink
              v-if="lectureRankCount(rank.id)"
              class="rank-card__lecture"
              :to="`/bencao/${groupForRank(rank.id)}`"
            >
              讲义 {{ lectureRankCount(rank.id) }} 味 →
            </RouterLink>
            <span class="rank-card__hint">{{ rankFilter === rank.id ? '正在按本经筛选' : '点击筛选本经' }}</span>
          </article>
        </div>

        <div class="therapy-grid">
          <article
            v-for="cat in taxonomy.categories"
            :key="cat.id"
            class="therapy-card"
            :class="{ 'therapy-card--active': categoryFilter === cat.id }"
          >
            <button class="therapy-card__head" type="button" :aria-pressed="categoryFilter === cat.id" @click="toggleCategory(cat.id)">
              <h3>{{ cat.title }}</h3>
              <span>{{ categoryHerbs(cat.id).length }} 味</span>
            </button>
            <p class="therapy-card__desc">{{ cat.description }}</p>
            <div class="therapy-card__herbs">
              <RouterLink v-for="h in categoryHerbs(cat.id)" :key="h.id" :to="`/herbs/${h.id}`">
                {{ h.name }}
              </RouterLink>
              <span v-for="name in cat.pending" :key="name" class="pending-herb">
                {{ name }}<em>待收</em>
              </span>
              <span v-if="!categoryHerbs(cat.id).length && !cat.pending.length" class="pending-text">待收录</span>
            </div>
          </article>
        </div>

        <p class="taxonomy-foot">
          {{ taxonomy.note }}
          <button v-if="rankFilter || categoryFilter" class="text-button" type="button" @click="clearTaxonomy">
            清除分类筛选
          </button>
        </p>
      </section>

      <section class="filter-bar paper-panel" aria-label="药材筛选">
        <label class="search-field">
          <span class="search-field__icon" aria-hidden="true">⌕</span>
          <input v-model="query" type="search" placeholder="搜索药名、拼音、功效…" />
        </label>
        <label class="select-field">
          <span>性味</span>
          <select v-model="flavor">
            <option value="">全部</option>
            <option v-for="t in allFlavorTags" :key="t" :value="t">{{ t }}</option>
          </select>
        </label>
        <label class="select-field">
          <span>归经</span>
          <select v-model="meridian">
            <option value="">全部</option>
            <option v-for="m in meridianOptions" :key="m.id" :value="m.id">{{ m.name }}</option>
          </select>
        </label>
        <button v-if="activeFilters" class="btn btn--ghost btn--small" type="button" @click="reset">
          清除筛选
        </button>
      </section>

      <div id="herb-results" class="result-line">
        <p>
          共 <strong>{{ filtered.length + lectureFiltered.length }}</strong> 味
          <span v-if="activeFilters">· 已筛选 {{ activeFilters }} 项</span>
        </p>
        <p class="muted tiny">所有内容为学习样例，不构成用药建议。</p>
      </div>

      <div v-if="filtered.length" class="herb-grid">
        <HerbCard
          v-for="herb in filtered"
          :key="herb.id"
          :herb="herb"
          :meridian-names="meridianLookup"
        />
      </div>

      <section v-if="lectureFiltered.length" class="lecture-list" aria-label="讲义药材">
        <div class="lecture-list__head">
          <div>
            <p class="eyebrow">LECTURE MATERIA MEDICA / 讲义药材</p>
            <h2>《神农本草经》讲义逐味索引</h2>
          </div>
          <p>
            据倪海厦讲义整理，共 {{ lectureFiltered.length }} 味可查
            <span v-if="lectureFiltered.length > visibleLecture.length">（先显示 {{ visibleLecture.length }} 味）</span>；
            每味点开可读原文、历代注家与课堂讲授。
          </p>
        </div>

        <div class="lecture-grid">
          <BencaoHerbCard
            v-for="item in visibleLecture"
            :key="item.key"
            :item="item"
            :rank-title="rankLabel(item.rankId)"
          />
        </div>

        <button
          v-if="lectureFiltered.length > visibleLecture.length"
          class="btn btn--ghost lecture-list__more"
          type="button"
          @click="lectureLimit += 60"
        >
          再看 60 味（剩余 {{ lectureFiltered.length - visibleLecture.length }}）
        </button>
      </section>

      <div v-if="!filtered.length && !lectureFiltered.length" class="empty-state paper-panel">
        <h2>没有找到这味药</h2>
        <p>试试只搜一个字，或清除性味、归经、三经与功效分类筛选。</p>
        <button class="btn btn--primary" type="button" @click="reset">清除筛选</button>
      </div>

      <aside class="list-note paper-panel">
        <span class="list-note__mark">按</span>
        <div>
          <strong>为什么每味药只有几行字？</strong>
          <p>
            第一版是结构原型，重点验证“字段—出处—跳转”的闭环。药性、归经、功效、主治按药典摘录；
            配伍关系按后世方书与教材归纳，并单独标注“后世方解”。
          </p>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.data-error {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin: 18px 0 0;
  padding: 14px 16px;
  color: var(--cinnabar);
  font-size: 0.82rem;
}

.data-loading {
  margin: 18px 0 0;
  color: var(--ink-faint);
  font-size: 0.78rem;
}

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
  letter-spacing: 0.08em;
}

.page-hero__lead {
  max-width: 620px;
  color: var(--ink-soft);
  font-size: 0.98rem;
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

.lecture-entry {
  display: flex;
  gap: 16px;
  align-items: center;
  margin: 18px 0 26px;
  padding: 16px 18px;
  border: 1px solid var(--line-strong);
  border-radius: 16px;
  background:
    linear-gradient(100deg, rgba(220, 232, 226, 0.4), transparent 46%),
    rgba(255, 252, 245, 0.5);
  transition: border-color 0.18s ease, transform 0.18s ease;
}

.lecture-entry:hover {
  border-color: var(--jade-2);
  transform: translateY(-2px);
}

.lecture-entry__seal {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border: 1px solid var(--cinnabar);
  border-radius: 5px;
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 1.3rem;
  transform: rotate(-3deg);
}

.lecture-entry__body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.lecture-entry__body strong {
  font-family: var(--serif);
  font-size: 1.12rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.lecture-entry__desc {
  color: var(--ink-soft);
  font-size: 0.72rem;
  line-height: 1.7;
}

.lecture-entry__meta {
  display: flex;
  flex: 0 0 auto;
  gap: 10px;
  align-items: center;
  margin-left: auto;
  color: var(--ink-faint);
  font-size: 0.68rem;
  white-space: nowrap;
}

.lecture-entry__arrow {
  color: var(--jade);
  font-size: 0.85rem;
}

.taxonomy-section {
  padding: 30px 0 8px;
  border-top: 1px solid var(--line-strong);
}

.taxonomy-head {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  align-items: flex-end;
  margin-bottom: 16px;
}

.taxonomy-head h2 {
  margin-top: 4px;
  font-size: 1.6rem;
}

.taxonomy-head__note {
  max-width: 520px;
  color: var(--ink-soft);
  font-size: 0.76rem;
  line-height: 1.8;
}

.rank-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.rank-card {
  --rank-color: var(--jade);
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 17px 18px 13px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: rgba(255, 252, 245, 0.5);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.rank-card--middle {
  --rank-color: var(--gold);
}

.rank-card--lower {
  --rank-color: var(--cinnabar);
}

.rank-card--active {
  border-color: var(--rank-color);
  background: rgba(255, 252, 245, 0.9);
  box-shadow: var(--shadow-soft);
}

.rank-card__select {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.rank-card__title {
  color: var(--rank-color);
  font-family: var(--serif);
  font-size: 1.8rem;
  letter-spacing: 0.08em;
  line-height: 1.15;
}

.rank-card__subtitle {
  color: var(--ink-soft);
  font-size: 0.84rem;
}

.rank-card__count {
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.rank-card__desc {
  color: var(--ink-soft);
  font-size: 0.72rem;
  line-height: 1.7;
}

.rank-card__herbs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
}

.rank-card__herbs a {
  padding: 3px 8px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--ink);
  font-size: 0.72rem;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.rank-card__herbs a:hover {
  border-color: var(--rank-color);
  color: var(--rank-color);
}

.rank-card__hint {
  color: var(--rank-color);
  font-size: 0.64rem;
}

.rank-card__more {
  padding: 3px 8px;
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.rank-card__lecture {
  align-self: flex-start;
  color: var(--rank-color);
  font-size: 0.7rem;
  border-bottom: 1px solid color-mix(in srgb, var(--rank-color) 40%, transparent);
}

.therapy-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.therapy-card {
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255, 252, 245, 0.4);
  transition: border-color 0.16s ease, background 0.16s ease;
}

.therapy-card--active {
  border-color: var(--cinnabar);
  background: rgba(241, 221, 214, 0.26);
}

.therapy-card__head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: baseline;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.therapy-card__head h3 {
  font-size: 0.92rem;
}

.therapy-card__head span {
  color: var(--ink-faint);
  font-size: 0.64rem;
  white-space: nowrap;
}

.therapy-card__desc {
  margin-top: 4px;
  color: var(--ink-faint);
  font-size: 0.7rem;
  line-height: 1.6;
}

.therapy-card__herbs {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 8px;
  margin-top: 8px;
}

.therapy-card__herbs a {
  color: var(--cinnabar);
  font-size: 0.72rem;
}

.therapy-card__herbs a:hover {
  text-decoration: underline;
}

.pending-herb {
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.pending-herb em {
  margin-left: 3px;
  padding: 0 3px;
  border-radius: 3px;
  background: var(--paper-2);
  font-size: 0.56rem;
  font-style: normal;
}

.pending-text {
  color: var(--ink-faint);
  font-size: 0.7rem;
}

.taxonomy-foot {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-top: 12px;
  color: var(--ink-faint);
  font-size: 0.7rem;
  line-height: 1.7;
}

.text-button {
  padding: 0;
  border: 0;
  background: none;
  color: var(--cinnabar);
  font-size: 0.7rem;
  text-decoration: underline;
  cursor: pointer;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  flex-wrap: wrap;
}

.search-field {
  flex: 1 1 280px;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.45);
}

.search-field__icon {
  color: var(--ink-faint);
  font-size: 1.1rem;
}

.search-field input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--ink);
}

.select-field {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.45);
  color: var(--ink-soft);
  font-size: 0.82rem;
}

.select-field select {
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
}

.result-line {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: baseline;
  padding: 20px 2px 16px;
  color: var(--ink-soft);
  font-size: 0.82rem;
}

.result-line strong {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 1.2rem;
}

.herb-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

.herb-grid :deep(.herb-card__body) {
  padding: 14px 14px 12px;
}

.herb-grid :deep(.herb-card__title h3) {
  font-size: 1.15rem;
}

.herb-grid :deep(.herb-card__effect) {
  font-size: 0.78rem;
  line-height: 1.6;
}

.lecture-list {
  margin-top: 40px;
  padding-top: 28px;
  border-top: 1px solid var(--line-strong);
}

.lecture-list__head {
  display: flex;
  justify-content: space-between;
  gap: 28px;
  align-items: flex-end;
  margin-bottom: 16px;
}

.lecture-list__head h2 {
  margin-top: 4px;
  font-size: 1.45rem;
}

.lecture-list__head > p {
  max-width: 480px;
  color: var(--ink-soft);
  font-size: 0.74rem;
  line-height: 1.75;
}

.lecture-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

.lecture-grid :deep(.lecture-card__body) {
  padding: 14px 14px 12px;
}

.lecture-grid :deep(.lecture-card__title h3) {
  font-size: 1.15rem;
}

.lecture-grid :deep(.lecture-card__effect) {
  font-size: 0.78rem;
  line-height: 1.6;
}

.lecture-list__more {
  display: block;
  margin: 18px auto 0;
}

.list-note {
  margin-top: 36px;
  padding: 20px 22px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.list-note__mark {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--cinnabar-pale);
  color: var(--cinnabar);
  font-family: var(--serif);
}

.list-note strong {
  font-family: var(--serif);
  font-size: 0.98rem;
}

.list-note p {
  margin-top: 4px;
  color: var(--ink-soft);
  font-size: 0.82rem;
  line-height: 1.8;
}

@media (max-width: 1240px) {
  .herb-grid,
  .lecture-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .therapy-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .herb-grid,
  .lecture-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .lecture-list__head {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .taxonomy-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .page-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-hero__stat {
    border-left: 0;
    padding-left: 0;
  }
}

@media (max-width: 700px) {
  .herb-grid,
  .lecture-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .rank-grid {
    grid-template-columns: 1fr;
  }

  .therapy-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .result-line {
    flex-direction: column;
    gap: 4px;
  }
}

@media (max-width: 520px) {
  .herb-grid,
  .lecture-grid {
    grid-template-columns: 1fr;
  }

  .therapy-grid {
    grid-template-columns: 1fr;
  }
}
</style>
