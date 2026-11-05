<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import FormulaCard from '@/components/FormulaCard.vue'
import { useFormulaApi } from '@/composables/useFormulaApi'
import type { FormulaSummary } from '@/composables/useFormulaApi'

const { loading, error, fetchFormulaList } = useFormulaApi()
const formulas = ref<FormulaSummary[]>([])
const query = ref('')
const activeBook = ref<'shanghan' | 'jingui' | 'mijingzi'>('shanghan')
const activeChapter = ref('')
const activeClass = ref('')

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

async function load() {
  try {
    formulas.value = await fetchFormulaList()
  } catch {
    formulas.value = []
  }
}

onMounted(load)

const totalComposition = computed(() =>
  formulas.value.reduce((n, f) => n + f.composition.length, 0),
)

function bookOf(formula: FormulaSummary) {
  const work = formula.sourceCitation?.work ?? ''
  if (work.includes('米晶子')) return 'mijingzi'
  if (work.includes('金匮')) return 'jingui'
  if (work.includes('伤寒')) return 'shanghan'
  return 'other'
}

// 《米晶子济世良方》正文按「大分部—小部位」编排，目录里的小部位归入上级分部，
// 避免首页同时出现「头部」和「头面部」这类重复章节。
const MIJINGZI_PARTS: Record<string, string> = {
  头面部: '头面部',
  头部: '头面部',
  面部: '头面部',
  眼眉部: '头面部',
  鼻部: '头面部',
  耳部: '头面部',
  口舌部: '头面部',
  牙部: '头面部',
  胸腹颈项部: '胸腹颈项部',
  喉部: '胸腹颈项部',
  项部: '胸腹颈项部',
  胸部: '胸腹颈项部',
  胁部: '胸腹颈项部',
  胃腹食部: '胸腹颈项部',
  少腹部: '胸腹颈项部',
  小便部: '胸腹颈项部',
  大便部: '胸腹颈项部',
  全身部: '全身部',
  手足部: '全身部',
  腰背部: '全身部',
  内外妇儿: '内外妇儿',
  内科: '内外妇儿',
  外科: '内外妇儿',
  妇科: '内外妇儿',
  妇科经带类: '内外妇儿',
  妇科妇产类: '内外妇儿',
  儿科: '内外妇儿',
  癫疯部: '癫疯部',
  虫咬部: '虫咬部',
  其他: '其他',
  经典效方: '经典效方',
  脉诊: '脉诊',
  附录: '附录',
}

function chapterOf(formula: FormulaSummary) {
  const locator = formula.sourceCitation?.locator ?? ''
  const head = locator.split('·')[0]
  if (bookOf(formula) === 'mijingzi') return MIJINGZI_PARTS[head] ?? head ?? '米晶子其他'
  if (bookOf(formula) === 'shanghan') {
    const match = head.match(/^辨(太阳|阳明|少阳|太阴|少阴|厥阴)病/)
    if (match) return `${match[1]}病`
    if (head.includes('差后劳复') || head.includes('阴阳易')) return '差后劳复'
    return '伤寒其他篇'
  }
  return (
    head
      .replace(/脉.*$/, '')
      .replace(/证.*$/, '')
      .replace(/第.*$/, '')
      .trim() || '金匮其他篇'
  )
}

const bookCounts = computed(() => {
  let shanghan = 0
  let jingui = 0
  let mijingzi = 0
  for (const formula of formulas.value) {
    const book = bookOf(formula)
    if (book === 'shanghan') shanghan += 1
    else if (book === 'jingui') jingui += 1
    else if (book === 'mijingzi') mijingzi += 1
  }
  return { shanghan, jingui, mijingzi }
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

function hasHerb(formula: FormulaSummary, name: string) {
  return formula.composition.some((item) => (item.herbName ?? '').includes(name))
}

const FORMULA_CLASSES = [
  { key: 'guizhi', title: '桂枝类方', hint: '桂枝', match: (f: FormulaSummary) => hasHerb(f, '桂枝') },
  { key: 'mahuang', title: '麻黄类方', hint: '麻黄', match: (f: FormulaSummary) => hasHerb(f, '麻黄') },
  { key: 'chaihu', title: '柴胡类方', hint: '柴胡', match: (f: FormulaSummary) => hasHerb(f, '柴胡') },
  { key: 'chengqi', title: '承气类方', hint: '承气', match: (f: FormulaSummary) => f.name.includes('承气') },
  { key: 'linggui', title: '苓桂类方', hint: '茯苓 + 桂枝', match: (f: FormulaSummary) => hasHerb(f, '茯苓') && hasHerb(f, '桂枝') },
  { key: 'sini', title: '四逆类方', hint: '四逆', match: (f: FormulaSummary) => f.name.includes('四逆') || (hasHerb(f, '附子') && hasHerb(f, '干姜')) },
  { key: 'xiexin', title: '泻心类方', hint: '泻心', match: (f: FormulaSummary) => f.name.includes('泻心') },
  { key: 'fuzi', title: '附子类方', hint: '附子', match: (f: FormulaSummary) => hasHerb(f, '附子') },
  { key: 'shigao', title: '石膏类方', hint: '石膏', match: (f: FormulaSummary) => hasHerb(f, '石膏') },
  { key: 'banxia', title: '半夏类方', hint: '半夏', match: (f: FormulaSummary) => hasHerb(f, '半夏') },
] as const

const classCounts = computed(() =>
  FORMULA_CLASSES.map((item) => ({
    ...item,
    count: formulas.value.filter((formula) => item.match(formula)).length,
  })),
)

const searchResults = computed(() => {
  const q = normalize(query.value.trim())
  if (!q) return []
  const exact = formulas.value.filter(
    (f) => normalize(f.name) === q || normalize(f.pinyin) === q,
  )
  if (exact.length) return exact
  return formulas.value.filter((f) => {
    const haystack = normalize(
      [
        f.name,
        f.pinyin,
        f.effectsText,
        ...f.symptomTags,
        ...f.composition.map((c) => c.herbName ?? c.herbId),
      ].join(' '),
    )
    return haystack.includes(q)
  })
})

const filtered = computed(() => {
  if (query.value.trim()) return searchResults.value
  if (activeClass.value) {
    const item = FORMULA_CLASSES.find((entry) => entry.key === activeClass.value)
    return item ? formulas.value.filter((formula) => item.match(formula)) : []
  }
  if (!activeChapter.value) return []
  return formulas.value.filter(
    (formula) =>
      bookOf(formula) === activeBook.value && chapterOf(formula) === activeChapter.value,
  )
})

const hasBrowsing = computed(
  () => Boolean(query.value.trim() || activeChapter.value || activeClass.value),
)

const activeLabel = computed(() => {
  if (query.value.trim()) return `搜索“${query.value.trim()}”`
  if (activeClass.value) {
    return FORMULA_CLASSES.find((item) => item.key === activeClass.value)?.title ?? '类方'
  }
  if (activeChapter.value) {
    const bookLabel = { shanghan: '伤寒论', jingui: '金匮要略', mijingzi: '米晶子济世良方' }[
      activeBook.value
    ]
    return `${bookLabel} · ${activeChapter.value}`
  }
  return ''
})

function selectBook(book: 'shanghan' | 'jingui' | 'mijingzi') {
  if (activeBook.value === book && !activeChapter.value && !activeClass.value) return
  activeBook.value = book
  activeChapter.value = ''
  activeClass.value = ''
  query.value = ''
}

async function scrollToResults() {
  await nextTick()
  document.getElementById('formula-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function selectChapter(key: string) {
  const next = activeChapter.value === key ? '' : key
  activeChapter.value = next
  activeClass.value = ''
  if (next) void scrollToResults()
}

function selectClass(key: string) {
  const next = activeClass.value === key ? '' : key
  activeClass.value = next
  activeChapter.value = ''
  if (next) void scrollToResults()
}

function clearFilters() {
  query.value = ''
  activeChapter.value = ''
  activeClass.value = ''
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
        <div class="page-hero__stat">
          <span>{{ formulas.length }}</span>
          <small>首方剂</small>
          <span>{{ totalComposition }}</span>
          <small>条组成记录</small>
        </div>
      </header>

      <p v-if="loading && !formulas.length" class="empty-state paper-panel">正在加载方剂目录…</p>
      <div v-else-if="error && !formulas.length" class="empty-state paper-panel">
        <h2>方剂目录没有打开</h2>
        <p>{{ error }}</p>
        <button class="btn btn--primary" type="button" @click="load">重试</button>
      </div>

      <template v-else>
        <section class="filter-bar paper-panel" aria-label="方剂搜索">
          <label class="search-field">
            <span class="search-field__icon" aria-hidden="true">⌕</span>
            <input v-model="query" type="search" placeholder="输入方名、拼音或药材…" />
          </label>
          <p class="filter-hint">输入方名即可进入方剂；也可按《伤寒论》《金匮要略》《米晶子济世良方》篇章或主药类方浏览。</p>
        </section>

        <template v-if="!query">
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
              <button
                v-for="chapter in chapters"
                :key="chapter.key"
                type="button"
                class="chapter-card"
                :class="{ 'is-active': activeChapter === chapter.key }"
                @click="selectChapter(chapter.key)"
              >
                <span class="chapter-card__head">
                  <strong>{{ chapter.key }}</strong>
                  <span>{{ chapter.count }} 首 · 查看 →</span>
                </span>
                <span class="chapter-card__preview">{{ chapter.preview.join(' · ') }}</span>
              </button>
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
              <button
                v-for="item in classCounts"
                :key="item.key"
                type="button"
                class="class-card"
                :class="{ 'is-active': activeClass === item.key }"
                @click="selectClass(item.key)"
              >
                <span class="class-card__title">{{ item.title }}<span>{{ item.count }} 首</span></span>
                <span class="class-card__hint">{{ item.hint }}</span>
              </button>
            </div>
          </section>
        </template>

        <div v-if="hasBrowsing" id="formula-results" class="result-line">
          <p><strong>{{ activeLabel }}</strong><span>共 {{ filtered.length }} 首</span></p>
          <button class="text-link tiny" type="button" @click="clearFilters">清除筛选</button>
        </div>

        <div v-if="hasBrowsing && filtered.length" class="formula-grid">
          <FormulaCard v-for="f in filtered" :key="f.id" :formula="f" />
        </div>

        <div v-else-if="hasBrowsing" class="empty-state paper-panel">
          <h2>没有找到这首方</h2>
          <p>试试方名或其中一味药。</p>
          <button class="btn btn--primary" type="button" @click="clearFilters">清除筛选</button>
        </div>

        <div v-else class="browse-hint paper-panel">
          <p>从上方选择经典篇章或主药类方，也可以直接输入方名。</p>
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
