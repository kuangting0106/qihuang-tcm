<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  fetchRemedies,
  fetchRemedyMeta,
  safetyLabel,
  type RemedyListItem,
  type RemedyMeta,
  type RemedySafetyLevel,
} from '@/composables/useRemedyApi'

const meta = ref<RemedyMeta | null>(null)
const items = ref<RemedyListItem[]>([])
const query = ref('')
const appliedQuery = ref('')
const activeCategory = ref('')
const activeEra = ref('')
const activeSafety = ref('')
const page = ref(1)
const pages = ref(0)
const total = ref(0)
const loadingMeta = ref(true)
const loadingList = ref(false)
const metaError = ref('')
const listError = ref('')
let requestSeq = 0

const hasMore = computed(() => page.value < pages.value)
const filtersActive = computed(
  () =>
    Boolean(
      appliedQuery.value || activeCategory.value || activeEra.value || activeSafety.value,
    ),
)
const activeFilterText = computed(() => {
  const labels: string[] = []
  if (appliedQuery.value) labels.push(`搜索“${appliedQuery.value}”`)
  if (activeCategory.value) labels.push(activeCategory.value)
  if (activeEra.value) labels.push(activeEra.value)
  if (activeSafety.value) labels.push(safetyLabel(activeSafety.value as RemedySafetyLevel))
  return labels.join(' · ')
})
const totalText = computed(() =>
  meta.value ? meta.value.total.toLocaleString('zh-CN') : '—',
)

async function loadMeta() {
  loadingMeta.value = true
  metaError.value = ''
  try {
    meta.value = await fetchRemedyMeta()
    await loadList(true)
  } catch (error) {
    metaError.value = error instanceof Error ? error.message : '偏方目录加载失败'
  } finally {
    loadingMeta.value = false
  }
}

async function loadList(reset = false) {
  if (!reset && loadingList.value) return
  if (reset) {
    page.value = 1
    items.value = []
  }
  const seq = ++requestSeq
  loadingList.value = true
  listError.value = ''
  try {
    const payload = await fetchRemedies({
      q: appliedQuery.value || undefined,
      category: activeCategory.value || undefined,
      era: activeEra.value || undefined,
      safety: activeSafety.value || undefined,
      page: page.value,
      pageSize: 24,
    })
    if (seq !== requestSeq) return
    items.value = reset ? payload.items : [...items.value, ...payload.items]
    total.value = payload.total
    pages.value = payload.pages
  } catch (error) {
    if (seq !== requestSeq) return
    listError.value = error instanceof Error ? error.message : '偏方列表加载失败'
  } finally {
    if (seq === requestSeq) loadingList.value = false
  }
}

function selectCategory(name: string) {
  activeCategory.value = name
  void loadList(true)
}

function reloadList() {
  void loadList(true)
}

function applyFilters() {
  appliedQuery.value = query.value.trim()
  void loadList(true)
}

function resetFilters() {
  query.value = ''
  appliedQuery.value = ''
  activeCategory.value = ''
  activeEra.value = ''
  activeSafety.value = ''
  void loadList(true)
}

function loadMore() {
  if (!hasMore.value || loadingList.value) return
  page.value += 1
  void loadList(false)
}

onMounted(loadMeta)
</script>

<template>
  <div class="page remedies-page">
    <div class="container">
      <nav class="breadcrumbs">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <span>民间偏方集录</span>
      </nav>

      <header class="remedies-hero">
        <div>
          <p class="eyebrow">FOLK REMEDIES / 民间偏方</p>
          <h1>民间偏方集录</h1>
          <p class="remedies-hero__lead">
            收录《泉州民间偏方验方选辑》与历代方书中的方剂，按病症分类，现代、近代在前。
            每一条都保留原文与出处；方药、用法为原文摘录，未经现代临床验证。
          </p>
          <RouterLink class="remedies-hero__scan" to="/remedies/scans">
            浏览原书扫描页附录 · OCR 机器识别·待校 →
          </RouterLink>
        </div>
        <div class="remedies-hero__stat">
          <strong>{{ totalText }}</strong>
          <span>条原文摘录</span>
          <small>现代与历代方书合编</small>
        </div>
      </header>

      <div class="remedies-warning">
        <strong>使用前请先读</strong>
        <p>
          偏方多来自民间经验与古籍，未经现代医学验证，不能替代医生诊疗。
          含毒性药材、孕妇禁忌或注明“剧毒”的条目已标为高风险，仅作文献学习，请勿自行配制服用。
        </p>
      </div>

      <form class="remedies-search" @submit.prevent="applyFilters">
        <label class="remedies-search__field">
          <span>搜索病症、药材或方名</span>
          <input
            v-model="query"
            type="search"
            placeholder="例如：咳嗽、桂枝、烫伤、产后"
            autocomplete="off"
          />
        </label>
        <button type="submit" class="remedies-search__submit">搜索</button>
        <button v-if="filtersActive" type="button" class="remedies-search__reset" @click="resetFilters">
          清除
        </button>
      </form>

      <section v-if="meta" class="remedies-filters" aria-label="偏方筛选">
        <div class="remedies-filter">
          <span class="remedies-filter__label">病症分类</span>
          <div class="remedies-chips">
            <button
              type="button"
              class="remedies-chip"
              :class="{ 'is-active': !activeCategory }"
              @click="selectCategory('')"
            >
              全部
            </button>
            <button
              v-for="item in meta.categories"
              :key="item.name"
              type="button"
              class="remedies-chip"
              :class="{ 'is-active': activeCategory === item.name }"
              @click="selectCategory(item.name)"
            >
              {{ item.name }}
              <span>{{ item.count.toLocaleString('zh-CN') }}</span>
            </button>
          </div>
        </div>

        <div class="remedies-selects">
          <label>
            <span>年代</span>
            <select v-model="activeEra" @change="reloadList">
              <option value="">全部年代</option>
              <option v-for="item in meta.eras" :key="item.name" :value="item.name">
                {{ item.name }}（{{ item.count.toLocaleString('zh-CN') }}）
              </option>
            </select>
          </label>
          <label>
            <span>安全提示</span>
            <select v-model="activeSafety" @change="reloadList">
              <option value="">全部</option>
              <option v-for="item in meta.safety" :key="item.level" :value="item.level">
                {{ item.label }}（{{ item.count.toLocaleString('zh-CN') }}）
              </option>
            </select>
          </label>
        </div>
      </section>

      <div class="remedies-resultbar">
        <p>
          <template v-if="activeFilterText">{{ activeFilterText }} · </template>
          共 <strong>{{ total.toLocaleString('zh-CN') }}</strong> 条
        </p>
        <p v-if="loadingList" class="remedies-resultbar__loading">正在读取…</p>
      </div>

      <p v-if="metaError" class="remedies-state remedies-state--error">{{ metaError }}</p>
      <p v-else-if="listError" class="remedies-state remedies-state--error">{{ listError }}</p>
      <div v-else-if="loadingMeta" class="remedies-state">正在整理偏方目录…</div>
      <div v-else-if="!items.length" class="remedies-state">
        没有找到符合条件的偏方，可以换一个关键词或清除筛选。
      </div>

      <div v-else class="remedies-list">
        <article v-for="item in items" :key="item.id" class="remedy-card">
          <div class="remedy-card__top">
            <span class="remedy-card__safety" :class="`is-${item.safetyLevel}`">
              {{ safetyLabel(item.safetyLevel) }}
            </span>
            <span class="remedy-card__era">{{ item.era || '年代不详' }}</span>
          </div>
          <h2>
            <RouterLink :to="`/remedies/${item.id}`">{{ item.title }}</RouterLink>
          </h2>
          <p class="remedy-card__meta">
            {{ item.book || '佚名' }}
            <template v-if="item.dynasty && item.dynasty !== item.era"> · {{ item.dynasty }}</template>
            · {{ item.category }}<template v-if="item.subcategory"> / {{ item.subcategory }}</template>
          </p>
          <dl>
            <div v-if="item.indications">
              <dt>主治</dt>
              <dd>{{ item.indications }}</dd>
            </div>
            <div v-if="item.formula">
              <dt>方药</dt>
              <dd>{{ item.formula }}</dd>
            </div>
            <div v-if="item.usage">
              <dt>用法</dt>
              <dd>{{ item.usage }}</dd>
            </div>
          </dl>
          <RouterLink class="remedy-card__link" :to="`/remedies/${item.id}`">
            查看原文与出处
          </RouterLink>
        </article>
      </div>

      <div v-if="hasMore" class="remedies-more">
        <button type="button" :disabled="loadingList" @click="loadMore">
          {{ loadingList ? '正在读取…' : '加载更多' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.remedies-page {
  padding-bottom: 72px;
}

.remedies-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 32px;
  align-items: end;
  margin: 20px 0 28px;
}

.remedies-hero h1 {
  margin: 6px 0 12px;
  font-size: clamp(2rem, 4vw, 3rem);
  letter-spacing: 0.06em;
}

.remedies-hero__lead {
  max-width: 68ch;
  margin: 0;
  color: var(--muted);
  line-height: 1.85;
}

.remedies-hero__scan {
  display: inline-block;
  margin-top: 10px;
  color: var(--cinnabar);
  font-size: 0.8rem;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.remedies-hero__stat {
  display: grid;
  gap: 4px;
  padding: 20px 24px;
  border: 1px solid var(--line);
  background: var(--paper);
  text-align: right;
}

.remedies-hero__stat strong {
  font-size: 2rem;
  line-height: 1;
}

.remedies-hero__stat span,
.remedies-hero__stat small {
  color: var(--muted);
  font-size: 0.85rem;
}

.remedies-warning {
  display: grid;
  gap: 6px;
  margin-bottom: 24px;
  padding: 16px 20px;
  border-left: 4px solid #a33a2b;
  background: #fbf3f0;
}

.remedies-warning strong {
  color: #8c2f22;
}

.remedies-warning p {
  margin: 0;
  color: #6d4a42;
  line-height: 1.8;
  font-size: 0.92rem;
}

.remedies-search {
  display: flex;
  gap: 10px;
  align-items: end;
  margin-bottom: 20px;
}

.remedies-search__field {
  display: grid;
  gap: 6px;
  flex: 1;
}

.remedies-search__field span {
  color: var(--muted);
  font-size: 0.85rem;
}

.remedies-search input,
.remedies-selects select {
  width: 100%;
  min-height: 44px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 0;
  background: var(--paper);
  color: inherit;
  font: inherit;
}

.remedies-search__submit,
.remedies-more button {
  min-height: 44px;
  padding: 0 22px;
  border: 1px solid var(--ink);
  background: var(--ink);
  color: var(--paper);
  cursor: pointer;
}

.remedies-search__reset {
  min-height: 44px;
  padding: 0 14px;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}

.remedies-filters {
  display: grid;
  gap: 14px;
  margin-bottom: 18px;
}

.remedies-filter {
  display: grid;
  gap: 8px;
}

.remedies-filter__label {
  color: var(--muted);
  font-size: 0.85rem;
}

.remedies-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.remedies-chip {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 7px 12px;
  border: 1px solid var(--line);
  background: var(--paper);
  color: inherit;
  cursor: pointer;
  font-size: 0.9rem;
}

.remedies-chip span {
  color: var(--muted);
  font-size: 0.76rem;
}

.remedies-chip.is-active {
  border-color: var(--ink);
  background: var(--ink);
  color: var(--paper);
}

.remedies-chip.is-active span {
  color: rgba(255, 255, 255, 0.7);
}

.remedies-selects {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 220px));
  gap: 12px;
}

.remedies-selects label {
  display: grid;
  gap: 6px;
}

.remedies-selects label > span {
  color: var(--muted);
  font-size: 0.85rem;
}

.remedies-resultbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin: 18px 0;
  padding-top: 14px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 0.9rem;
}

.remedies-resultbar p {
  margin: 0;
}

.remedies-state {
  padding: 42px 0;
  color: var(--muted);
  text-align: center;
}

.remedies-state--error {
  color: #8c2f22;
}

.remedies-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.remedy-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
  border: 1px solid var(--line);
  background: var(--paper);
}

.remedy-card__top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.remedy-card__safety {
  padding: 2px 8px;
  border: 1px solid var(--line);
  font-size: 0.76rem;
}

.remedy-card__safety.is-high {
  border-color: #a33a2b;
  background: #fbf3f0;
  color: #8c2f22;
}

.remedy-card__safety.is-medium {
  border-color: #b58a3a;
  background: #fdf8ec;
  color: #8a6420;
}

.remedy-card__era {
  color: var(--muted);
  font-size: 0.8rem;
}

.remedy-card h2 {
  margin: 0;
  font-size: 1.12rem;
  line-height: 1.45;
}

.remedy-card h2 a {
  color: inherit;
  text-decoration: none;
}

.remedy-card h2 a:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}

.remedy-card__meta {
  margin: 0;
  color: var(--muted);
  font-size: 0.82rem;
  line-height: 1.6;
}

.remedy-card dl {
  display: grid;
  gap: 8px;
  margin: 0;
}

.remedy-card dl div {
  display: grid;
  grid-template-columns: 2.2em minmax(0, 1fr);
  gap: 8px;
}

.remedy-card dt {
  color: var(--muted);
  font-size: 0.8rem;
}

.remedy-card dd {
  margin: 0;
  line-height: 1.75;
  font-size: 0.92rem;
}

.remedy-card__link {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px dashed var(--line);
  color: var(--ink);
  font-size: 0.85rem;
  text-decoration: none;
}

.remedies-more {
  display: flex;
  justify-content: center;
  margin-top: 28px;
}

.remedies-more button:disabled {
  opacity: 0.6;
  cursor: wait;
}

@media (max-width: 760px) {
  .remedies-hero {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .remedies-hero__stat {
    text-align: left;
  }

  .remedies-search {
    flex-wrap: wrap;
  }

  .remedies-search__field {
    flex-basis: 100%;
  }

  .remedies-selects {
    grid-template-columns: 1fr;
  }

  .remedies-list {
    grid-template-columns: 1fr;
  }
}
</style>
