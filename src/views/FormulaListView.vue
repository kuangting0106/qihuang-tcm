<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import CitationBadge from '@/components/CitationBadge.vue'
import { useFormulaApi } from '@/composables/useFormulaApi'
import { loadTcmData } from '@/composables/useTcmData'
import type { FormulaSummary } from '@/composables/useFormulaApi'
import type { FormulaBook } from '@/data/formula-categories'
import {
  FORMULA_CLASSES,
  bookOf,
  chapterOf,
  formulaClassPath,
  formulaSourcePath,
} from '@/data/formula-categories'

const router = useRouter()
const { loading, error, fetchFormulaList } = useFormulaApi()
const formulas = ref<FormulaSummary[]>([])
const query = ref('')
const activeBook = ref<FormulaBook>('shanghan')

const junchenOpen = ref(false)
const junchenRoles = [
  {
    name: '君药',
    text: '针对主病或主证起主要治疗作用，是方中不可或缺、药力居首的药物。',
  },
  {
    name: '臣药',
    text: '一是辅助君药加强治疗主病或主证；二是针对兼病或兼证起治疗作用。其在方中之药力小于君药。',
  },
  {
    name: '佐药',
    text: '一是佐助药，协助君、臣药以加强治疗作用，或直接治疗次要兼证；二是佐制药，制约君、臣药的峻烈之性，或减轻、消除君、臣药毒性；三是反佐药，根据病证需要，配伍少量与君药性味或作用相反而又能在治疗中起相成作用的药物。药力小于臣药，一般用量较轻。',
  },
  {
    name: '使药',
    text: '一是引经药，引方中诸药以达病所；二是调和药，调和诸药。其在方中之药力较小，用量亦轻。',
  },
]

const junchenQuotes = [
  {
    title: '《脾胃论》引《素问·至真要大论》',
    text: '有毒无毒，所治为主。主病者为君，佐君者为臣，应臣者为使。一法，力大者为君。',
    citationIds: ['src-piweilun-zhizhen'],
  },
  {
    title: '《脾胃论》论气味阴阳',
    text: '凡药之所用，皆以气味为主，补泻在味，随时换气。气薄者，为阳中之阴，气厚者，为阳中之阳；味薄者，为阴中之阳，味厚者，为阴中之阴。辛、甘、淡中热者，为阳中之阳，辛、甘、淡中寒者，为阳中之阴；酸、苦、咸之寒者，为阴中之阴，酸、苦、咸之热者，为阴中之阳。夫辛、甘、淡、酸、苦、咸，乃味之阴阳，又为地之阴阳也；温、凉、寒、热，乃气之阴阳，又为天之阴阳也。气味生成，而阴阳造化之机存焉。一物之内，气味兼有，一药之中，理性具焉，主对治疗，由是而出。',
    citationIds: ['src-piweilun-qixiang'],
  },
  {
    title: '《脾胃论》随证用药举例',
    text: '假令治表实，麻黄、葛根；表虚，桂枝、黄芪。里实，枳实、大黄；里虚，人参、芍药。热者，黄芩、黄连；寒者，干姜、附子之类为君。',
    citationIds: ['src-piweilun-yongyao'],
  },
]

async function load() {
  try {
    formulas.value = await fetchFormulaList()
  } catch {
    formulas.value = []
  }
}

onMounted(() => {
  void load()
  void loadTcmData()
})

const totalComposition = computed(() =>
  formulas.value.reduce((n, f) => n + f.composition.length, 0),
)

const bookCounts = computed(() => {
  const counts: Record<FormulaBook, number> = { shanghan: 0, jingui: 0, mijingzi: 0 }
  for (const formula of formulas.value) {
    const book = bookOf(formula)
    if (book !== 'other') counts[book] += 1
  }
  return counts
})

const chapters = computed(() => {
  const map = new Map<string, { key: string; count: number; preview: string[] }>()
  for (const formula of formulas.value) {
    if (bookOf(formula) !== activeBook.value) continue
    const key = chapterOf(formula)
    const entry = map.get(key) ?? { key, count: 0, preview: [] }
    entry.count += 1
    if (entry.preview.length < 4) entry.preview.push(formula.name)
    map.set(key, entry)
  }
  return [...map.values()]
})

const classCounts = computed(() =>
  FORMULA_CLASSES.map((item) => ({
    ...item,
    count: formulas.value.filter((formula) => item.match(formula)).length,
  })),
)

function selectBook(book: FormulaBook) {
  activeBook.value = book
}

function submitSearch() {
  const q = query.value.trim()
  if (!q) return
  void router.push({ name: 'formula-search', query: { q } })
}
</script>

<template>
  <div class="page formula-list-page">
    <div class="container">
      <header class="page-hero">
        <div>
          <p class="eyebrow">FORMULA / 方剂</p>
          <h1>方剂</h1>
          <p class="page-hero__lead">
            原文、症状、组成、君臣佐使与加减放在同一页。
            图谱与原文出处双轨呈现；桂枝汤没有加减，就写“原文未列”，不硬编。
          </p>
          <p class="page-hero__note">药方重在：治症思路、药材选取、用量</p>
        </div>
        <div class="page-hero__aside">
          <div class="page-hero__stat">
            <span>{{ formulas.length }}</span>
            <small>首方剂</small>
            <span>{{ totalComposition }}</span>
            <small>条组成记录</small>
          </div>

          <div
            class="junchen-guide"
            @mouseenter="junchenOpen = true"
            @mouseleave="junchenOpen = false"
            @keydown.esc="junchenOpen = false"
          >
            <button
              class="junchen-guide__trigger"
              type="button"
              :aria-expanded="junchenOpen"
              aria-controls="junchen-guide-panel"
              @click="junchenOpen = !junchenOpen"
            >
              <span class="junchen-guide__seal" aria-hidden="true">方</span>
              <span class="junchen-guide__copy">
                <span class="junchen-guide__eyebrow">君臣佐使 · 读方提示</span>
                <strong>此处可查看药物的君臣佐使说明</strong>
                <small>悬停或点击展开</small>
              </span>
              <span class="junchen-guide__arrow" aria-hidden="true">{{ junchenOpen ? '−' : '+' }}</span>
            </button>

            <div
              v-if="junchenOpen"
              id="junchen-guide-panel"
              class="junchen-guide__panel"
              role="dialog"
              aria-label="君臣佐使说明"
            >
              <div class="junchen-guide__head">
                <p class="eyebrow">JUN CHEN ZUO SHI / 君臣佐使</p>
                <h2>读方先看配伍地位</h2>
                <p>
                  药方重在：治症思路、药材选取、用量。君臣佐使说明的是药物在方中的主次与配伍关系，
                  不是单味药效的排行榜；同一味药在不同方中，地位可以不同。
                </p>
              </div>

              <div class="junchen-roles">
                <article v-for="role in junchenRoles" :key="role.name" class="junchen-role">
                  <h3>{{ role.name }}</h3>
                  <p>{{ role.text }}</p>
                </article>
              </div>
              <p class="junchen-guide__cite">
                <CitationBadge
                  :citation-ids="['src-zhongyaoxue-yaoxing']"
                  label="教材归纳"
                  compact
                />
              </p>

              <div class="junchen-quotes">
                <blockquote v-for="quote in junchenQuotes" :key="quote.title">
                  <header>{{ quote.title }}</header>
                  <p>{{ quote.text }}</p>
                  <CitationBadge :citation-ids="quote.citationIds" label="原文" compact />
                </blockquote>
              </div>

              <p class="junchen-guide__note">
                上引《脾胃论》文字据用户提供资料录入，未逐字校勘；君臣佐使的定义按《中药学》教材归纳，
                不冒充古籍原文。读方时仍以原方主治、药量与煎服法为准。
              </p>
            </div>
          </div>
        </div>
      </header>

      <p v-if="loading && !formulas.length" class="empty-state paper-panel">正在加载方剂目录…</p>
      <div v-else-if="error && !formulas.length" class="empty-state paper-panel">
        <h2>方剂目录没有打开</h2>
        <p>{{ error }}</p>
        <button class="btn btn--primary" type="button" @click="load">重试</button>
      </div>

      <template v-else>
        <form class="filter-bar paper-panel" aria-label="方剂搜索" @submit.prevent="submitSearch">
          <label class="search-field">
            <span class="search-field__icon" aria-hidden="true">⌕</span>
            <input v-model="query" type="search" placeholder="输入方名、拼音或药材…" />
          </label>
          <button class="btn btn--primary" type="submit">搜索</button>
          <p class="filter-hint">输入方名后进入检索页；也可按《伤寒论》《金匮要略》《米晶子济世良方》篇章或主药类方浏览。</p>
        </form>

          <section class="browse-panel" aria-label="按经典出处分类">
            <div class="browse-panel__head">
              <div>
                <p class="eyebrow">BY SOURCE / 经典出处</p>
                <h2>按病证篇查找</h2>
              </div>
              <div class="book-tabs" role="tablist" aria-label="选择经典">
                <button
                  type="button"
                  role="tab"
                  :aria-selected="activeBook === 'shanghan'"
                  :class="{ 'is-active': activeBook === 'shanghan' }"
                  @click="selectBook('shanghan')"
                >
                  伤寒论 <span>{{ bookCounts.shanghan }}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  :aria-selected="activeBook === 'jingui'"
                  :class="{ 'is-active': activeBook === 'jingui' }"
                  @click="selectBook('jingui')"
                >
                  金匮要略 <span>{{ bookCounts.jingui }}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  :aria-selected="activeBook === 'mijingzi'"
                  :class="{ 'is-active': activeBook === 'mijingzi' }"
                  @click="selectBook('mijingzi')"
                >
                  米晶子济世良方 <span>{{ bookCounts.mijingzi }}</span>
                </button>
              </div>
            </div>

            <div class="chapter-grid">
              <RouterLink
                v-for="chapter in chapters"
                :key="chapter.key"
                :to="formulaSourcePath(activeBook, chapter.key)"
                class="chapter-card"
              >
                <span class="chapter-card__head">
                  <strong>{{ chapter.key }}</strong>
                  <span>{{ chapter.count }} 首 · 进入 →</span>
                </span>
                <span class="chapter-card__preview">{{ chapter.preview.join(' · ') }}</span>
              </RouterLink>
            </div>
          </section>

          <section class="class-section" aria-label="按主药类方分类">
            <div class="section-head">
              <div>
                <p class="eyebrow">BY KEY HERB / 主药类方</p>
                <h2>按主药类方查找</h2>
              </div>
              <p>按组成中的主药检索，便于类方学习；不是传统类方定论。</p>
            </div>
            <div class="class-grid">
              <RouterLink
                v-for="item in classCounts"
                :key="item.key"
                :to="formulaClassPath(item.key)"
                class="class-card"
              >
                <span class="class-card__title">{{ item.title }}<span>{{ item.count }} 首 · 进入 →</span></span>
                <span class="class-card__hint">{{ item.hint }}</span>
              </RouterLink>
            </div>
          </section>

        <div class="browse-hint paper-panel">
          <p>本页只展示分类与入口。点击经典篇章或主药类方，进入下层页面查看具体方剂；也可以输入方名进入检索页。</p>
        </div>
      </template>

      <aside class="list-note paper-panel">
        <span class="list-note__mark">方</span>
        <div>
          <strong>为什么强调“原文出处”？</strong>
          <p>
            《伤寒论》原文只列症状、药味与用量，不标君臣佐使。页面把“原文”和“后世方解”分开，
            点击出处能看到书名、条号与原文；方剂加减也逐条回到原条。
            详情页另按“一两 = 现今的一钱”列今用参考剂量，可一键切换古籍原方；方义解说逐味说明该药在方中作用。
          </p>
          <p>
            《米晶子济世良方》条目据扫描本 OCR 整理，未逐字校勘；方药、剂量与用法以原书为准。
          </p>
        </div>
      </aside>
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
  letter-spacing: 0.08em;
}

.page-hero__lead {
  max-width: 680px;
  color: var(--ink-soft);
  font-size: 0.98rem;
  line-height: 1.9;
}

.page-hero__note {
  display: inline-block;
  margin-top: 14px;
  padding: 7px 13px;
  border-left: 2px solid var(--cinnabar);
  background: rgba(255, 255, 255, 0.42);
  color: var(--ink);
  font-size: 0.84rem;
  letter-spacing: 0.02em;
}

.page-hero__stat {
  display: grid;
  grid-template-columns: auto auto;
  gap: 0 12px;
  align-items: baseline;
  padding-left: 24px;
  border-left: 1px solid var(--line-strong);
}

.page-hero__stat span {
  font-family: var(--serif);
  font-size: 2.2rem;
  line-height: 1.2;
}

.page-hero__stat small {
  color: var(--ink-soft);
  font-size: 0.76rem;
}

.page-hero__aside {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  min-width: 300px;
}

.junchen-guide {
  position: relative;
  width: 100%;
  max-width: 360px;
}

.junchen-guide__trigger {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid rgba(126, 35, 26, 0.5);
  border-radius: 2px;
  background: linear-gradient(135deg, #a63a2b 0%, #7d271e 100%);
  color: #fff9ec;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(95, 30, 22, 0.18);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.junchen-guide__trigger:hover,
.junchen-guide__trigger:focus-visible {
  transform: translateY(-1px);
  box-shadow: 0 14px 30px rgba(95, 30, 22, 0.26);
  outline: none;
}

.junchen-guide__seal {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  place-items: center;
  border: 1px solid rgba(255, 249, 236, 0.62);
  border-radius: 50%;
  font-family: var(--serif);
  font-size: 1.05rem;
}

.junchen-guide__copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.junchen-guide__eyebrow {
  color: rgba(255, 249, 236, 0.72);
  font-size: 0.62rem;
  letter-spacing: 0.12em;
}

.junchen-guide__copy strong {
  font-size: 0.8rem;
  font-weight: 500;
  line-height: 1.5;
}

.junchen-guide__copy small {
  color: rgba(255, 249, 236, 0.72);
  font-size: 0.64rem;
}

.junchen-guide__arrow {
  margin-left: auto;
  font-size: 1.1rem;
  line-height: 1;
}

.junchen-guide__panel {
  position: absolute;
  z-index: 40;
  top: calc(100% + 8px);
  right: 0;
  width: min(580px, calc(100vw - 48px));
  max-height: 72vh;
  overflow: auto;
  padding: 20px 22px;
  border: 1px solid var(--line-strong);
  background: #fffdf7;
  box-shadow: 0 24px 60px rgba(44, 30, 20, 0.24);
  text-align: left;
}

.junchen-guide__head h2 {
  margin: 4px 0 8px;
  font-size: 1.5rem;
  letter-spacing: 0.04em;
}

.junchen-guide__head > p:last-child {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.78rem;
  line-height: 1.8;
}

.junchen-roles {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.junchen-role {
  padding: 10px 12px;
  border-left: 2px solid var(--cinnabar);
  background: rgba(238, 231, 218, 0.34);
}

.junchen-role h3 {
  margin: 0 0 4px;
  font-family: var(--serif);
  font-size: 1rem;
  color: var(--cinnabar);
}

.junchen-role p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.74rem;
  line-height: 1.75;
}

.junchen-guide__cite {
  margin: 8px 0 0;
}

.junchen-quotes {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.junchen-quotes blockquote {
  margin: 0;
  padding: 10px 12px;
  border: 1px solid rgba(176, 138, 74, 0.25);
  background: rgba(255, 255, 255, 0.52);
}

.junchen-quotes header {
  margin-bottom: 5px;
  color: var(--cinnabar);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.junchen-quotes p {
  margin: 0 0 6px;
  color: var(--ink);
  font-family: var(--serif);
  font-size: 0.82rem;
  line-height: 1.9;
}

.junchen-guide__note {
  margin: 12px 0 0;
  padding-top: 10px;
  border-top: 1px dashed var(--line-strong);
  color: var(--ink-faint);
  font-size: 0.68rem;
  line-height: 1.7;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 14px;
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

.filter-hint {
  color: var(--ink-faint);
  font-size: 0.76rem;
}

.browse-panel {
  padding: 22px 0 6px;
}

.browse-panel__head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-end;
  margin-bottom: 16px;
}

.browse-panel__head h2,
.section-head h2 {
  margin: 4px 0 0;
  font-size: clamp(1.35rem, 2.2vw, 1.8rem);
  letter-spacing: 0.04em;
}

.book-tabs {
  display: inline-flex;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.45);
}

.book-tabs button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 0;
  background: none;
  color: var(--ink-soft);
  font: inherit;
  font-size: 0.84rem;
  cursor: pointer;
}

.book-tabs button span {
  color: var(--ink-faint);
  font-size: 0.72rem;
}

.book-tabs button.is-active {
  background: var(--cinnabar);
  color: #fff;
}

.book-tabs button.is-active span {
  color: rgba(255, 255, 255, 0.72);
}

.chapter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}

.chapter-card,
.class-card {
  display: flex;
  text-decoration: none;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
  padding: 12px 14px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.38);
  color: var(--ink);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    transform 0.18s ease;
}

.chapter-card:hover,
.class-card:hover {
  border-color: var(--cinnabar);
  transform: translateY(-1px);
}

.chapter-card.is-active,
.class-card.is-active {
  border-color: var(--cinnabar);
  background: var(--cinnabar-pale);
}

.chapter-card__head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: baseline;
  width: 100%;
}

.chapter-card__head strong {
  font-family: var(--serif);
  font-size: 0.92rem;
  font-weight: 600;
}

.chapter-card__head span {
  color: var(--ink-faint);
  font-size: 0.72rem;
  white-space: nowrap;
}

.chapter-card__preview {
  color: var(--ink-soft);
  font-size: 0.74rem;
  line-height: 1.6;
}

.class-section {
  margin-top: 28px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-end;
  margin-bottom: 12px;
}

.section-head > p {
  max-width: 320px;
  color: var(--ink-faint);
  font-size: 0.76rem;
  line-height: 1.7;
  text-align: right;
}

.class-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.class-card {
  padding: 10px 12px;
}

.class-card__title {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: baseline;
  width: 100%;
  font-family: var(--serif);
  font-size: 0.88rem;
}

.class-card__title span {
  color: var(--ink-faint);
  font-family: var(--font-sans);
  font-size: 0.7rem;
  white-space: nowrap;
}

.class-card__hint {
  color: var(--ink-faint);
  font-size: 0.72rem;
}

.browse-hint {
  margin-top: 18px;
  padding: 16px 18px;
  color: var(--ink-faint);
  font-size: 0.82rem;
}

#formula-results {
  scroll-margin-top: 90px;
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

.formula-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
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

@media (max-width: 960px) {
  .page-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-hero__stat {
    border-left: 0;
    padding-left: 0;
  }

  .page-hero__aside {
    align-items: stretch;
    width: 100%;
    max-width: 560px;
  }

  .junchen-guide {
    max-width: none;
  }

  .junchen-guide__panel {
    position: static;
    width: 100%;
    max-height: none;
    margin-top: 8px;
  }

  .junchen-roles {
    grid-template-columns: 1fr;
  }

  .formula-grid {
    grid-template-columns: 1fr;
  }

  .browse-panel__head,
  .section-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .section-head > p {
    max-width: none;
    text-align: left;
  }

  .class-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
