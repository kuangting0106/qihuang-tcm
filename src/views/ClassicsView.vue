<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { loadClassicCatalog } from '@/composables/useClassicLibrary'
import { fetchLibraryIndex } from '@/composables/useLibraryApi'
import type { Citation } from '@/types/tcm'
import type { ClassicLibraryIndex } from '@/types/classics'

const library = ref<ClassicLibraryIndex | null>(null)
const libraryTotal = ref(0)
const classicSources = ref<Citation[]>([])
const libraryError = ref('')

onMounted(() => {
  fetchLibraryIndex()
    .then((payload) => {
      libraryTotal.value =
        payload.total ??
        payload.source?.totalBooks ??
        payload.categories.reduce((sum, category) => sum + category.count, 0)
    })
    .catch(() => {
      libraryTotal.value = 0
    })
  loadClassicCatalog()
    .then((payload) => {
      library.value = payload.index
      classicSources.value = payload.works
    })
    .catch((err: unknown) => {
      libraryError.value = err instanceof Error ? err.message : '古籍目录加载失败'
    })
})

const libraryStats = computed(() => {
  const books = library.value?.books ?? []
  return {
    books: books.length,
    chapters: books.reduce(
      (sum, book) => sum + (book.stats?.chapterCount ?? book.sectionCount ?? 0),
      0,
    ),
    prefaces: books.reduce((sum, book) => sum + (book.stats?.prefaceCount ?? 0), 0),
  }
})

const classics = computed(() => classicSources.value)
const primaryBooks = computed(() =>
  (library.value?.books ?? []).filter((book) => book.tier !== 'secondary'),
)
const secondaryBooks = computed(() =>
  (library.value?.books ?? []).filter((book) => book.tier === 'secondary'),
)

interface ClassicWork {
  key: string
  work: string
  parentWork?: string
  parentNote?: string
  author?: string
  edition?: string
  items: Citation[]
}

const works = computed<ClassicWork[]>(() => {
  const groups = new Map<string, ClassicWork>()

  for (const source of classics.value) {
    const key = `${source.parentWork ?? ''}|${source.work}`
    const existing = groups.get(key)
    if (existing) {
      existing.items.push(source)
      continue
    }
    groups.set(key, {
      key,
      work: source.work,
      parentWork: source.parentWork,
      parentNote: source.parentNote,
      author: source.author,
      edition: source.edition,
      items: [source],
    })
  }

  return [...groups.values()]
})

const stats = computed(() => ({
  works: works.value.length,
  entries: classics.value.length,
  quotes: classics.value.filter((source) => source.quote).length,
}))
</script>

<template>
  <div class="page classics-page">
    <div class="container">
      <header class="classics-head">
        <p class="eyebrow">CLASSICS / 医家经典书籍</p>
        <h1>医家经典书籍</h1>
        <p>
          全本医书可逐卷读全文：先看序跋，再按篇名进入正文。
          下方另列本项目已经引用的古籍条文，出处、篇卷与原文摘录分开登记。
        </p>
        <div class="classic-stats">
          <div><strong>{{ libraryStats.books }}</strong><span>部全文</span></div>
          <div><strong>{{ libraryStats.chapters }}</strong><span>篇正文</span></div>
          <div><strong>{{ stats.entries }}</strong><span>条引文</span></div>
        </div>
      </header>

      <section class="fulltext-library" aria-labelledby="fulltext-title">
        <div class="section-head">
          <div>
            <p class="eyebrow">FULL TEXT / 原书全文</p>
            <h2 id="fulltext-title">全本医书</h2>
          </div>
          <p>每本书各自独立。详情页只列作者、序跋与篇名；点开篇名进入该篇原文。</p>
        </div>

        <p v-if="libraryError" class="library-state">{{ libraryError }}</p>
        <p v-else-if="!library" class="library-state">正在展开书页…</p>

        <div v-else class="book-grid">
          <RouterLink
            v-for="book in primaryBooks"
            :key="book.id"
            :to="`/classics/${book.id}`"
            class="book-card paper-panel"
          >
            <span class="book-card__kicker">FULL TEXT</span>
            <h3>{{ book.title }}</h3>
            <p class="book-card__author">作者：{{ book.author }}</p>
            <p class="book-card__meta">
              {{ book.stats?.chapterCount ?? 0 }} 篇 · {{ book.stats?.prefaceCount ?? 0 }} 篇序跋 ·
              {{ book.stats?.volumeCount ?? 0 }} 卷
            </p>
            <span class="book-card__link">进入全书 →</span>
          </RouterLink>
        </div>

        <div v-if="secondaryBooks.length" class="secondary-library">
          <div class="secondary-library__head">
            <div>
              <p class="eyebrow">MORE FULL TEXTS / 其他全本</p>
              <h3>下一层级</h3>
            </div>
            <p>仍可逐篇阅读；从主书架移入此处，不删除原书。</p>
          </div>
          <div class="book-grid book-grid--secondary">
            <RouterLink
              v-for="book in secondaryBooks"
              :key="book.id"
              :to="`/classics/${book.id}`"
              class="book-card paper-panel"
            >
              <span class="book-card__kicker">FULL TEXT</span>
              <h3>{{ book.title }}</h3>
              <p class="book-card__author">作者：{{ book.author }}</p>
              <p class="book-card__meta">
                {{ book.stats?.chapterCount ?? 0 }} 篇 · {{ book.stats?.prefaceCount ?? 0 }} 篇序跋 ·
                {{ book.stats?.volumeCount ?? 0 }} 卷
              </p>
              <span class="book-card__link">进入全书 →</span>
            </RouterLink>
          </div>
        </div>
      </section>

      <section class="library-entry paper-panel">
        <span class="library-entry__seal" aria-hidden="true">藏</span>
        <div class="library-entry__copy">
          <p class="eyebrow">MEDICAL LIBRARY / 医藏古籍</p>
          <h2>医藏古籍 {{ libraryTotal }} 部</h2>
          <p>
            按医经、伤寒金匮、本草、方书、诊法、针灸经络、临证各科等分类；
            一级分类悬浮可看二级分类，进入书库后按需读取书目与正文。
          </p>
        </div>
        <RouterLink class="btn btn--primary" to="/classics/library">进入医藏书库 →</RouterLink>
      </section>

      <section class="classics-principle paper-panel">
        <div>
          <span class="eyebrow">READING RULE</span>
          <h2>先看原书，再看归纳</h2>
        </div>
        <ul>
          <li><strong>全文据公开整理本或用户提供文本转码</strong>：只转编码、分篇与分段，不改字；未做校勘，个别字仍以原书为准。</li>
          <li><strong>原文与归纳分开</strong>：全文页只呈原书文字；本草、方剂页中的后世方解不混入正文。</li>
          <li><strong>不替代逐条出处</strong>：下方引文索引才是本草、方剂、经络页面的具体引用入口。</li>
        </ul>
      </section>

      <div class="section-head work-list-head">
        <div>
          <p class="eyebrow">CITED WORKS / 引文索引</p>
          <h2>已引古籍条目</h2>
        </div>
        <p>这里只列项目实际引用到的书名、篇卷、条号与原文摘录。</p>
      </div>

      <section class="work-list" aria-label="古籍条目">
        <article v-for="work in works" :key="work.key" class="work-card paper-panel">
          <header class="work-card__head">
            <div>
              <span class="citation-type citation-type--classic">经典古籍</span>
              <h2>{{ work.work }}</h2>
              <p v-if="work.parentWork" class="work-card__parent">
                属{{ work.author ? `${work.author}《${work.parentWork}》` : `《${work.parentWork}》` }} ·
                {{ work.work }}部分
              </p>
              <p class="work-card__meta">
                <span v-if="work.author">{{ work.author }}</span>
                <span v-if="work.edition">{{ work.edition }}</span>
              </p>
            </div>
            <span class="work-card__count">{{ work.items.length }} 条</span>
          </header>

          <p v-if="work.parentNote" class="work-card__note">{{ work.parentNote }}</p>

          <div class="entry-list">
            <section v-for="source in work.items" :id="source.id" :key="source.id" class="entry">
              <p class="entry__locator">{{ source.locator }}</p>
              <blockquote v-if="source.quote" class="entry__quote">{{ source.quote }}</blockquote>
              <p v-else class="entry__pending">本条仅登记书名与条号，未附逐字原文。</p>
              <p v-if="source.note" class="entry__note">{{ source.note }}</p>
            </section>
          </div>
        </article>
      </section>

      <section class="classics-footer paper-panel">
        <div>
          <span class="eyebrow">SCOPE</span>
          <h3>收录范围</h3>
        </div>
        <p>
          当前只整理项目实际引用到的古医籍，不追求一次列全。标为“标准 / 药典”和“教材归纳”的依据不属于古医籍，
          仍只在各内容页的“出处”抽屉中查看，不混入本页。
        </p>
        <RouterLink class="text-link" to="/">返回首页 →</RouterLink>
      </section>
    </div>
  </div>
</template>

<style scoped>
.classics-head {
  padding: 28px 0 30px;
  border-bottom: 1px solid var(--line-strong);
}

.classics-head h1 {
  margin: 5px 0 12px;
  font-size: clamp(2.8rem, 6vw, 4.6rem);
  letter-spacing: 0.08em;
}

.classics-head > p {
  max-width: 780px;
  color: var(--ink-soft);
  font-size: 0.92rem;
  line-height: 1.9;
}

.classic-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 18px 34px;
  margin-top: 24px;
}

.classic-stats div {
  display: flex;
  align-items: baseline;
  gap: 7px;
  border-left: 1px solid var(--line-strong);
  padding-left: 12px;
}

.classic-stats strong {
  font-family: var(--serif);
  font-size: 1.7rem;
}

.classic-stats span {
  color: var(--ink-soft);
  font-size: 0.74rem;
}

.fulltext-library {
  padding: 34px 0 38px;
  border-bottom: 1px solid var(--line-strong);
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 30px;
  margin-bottom: 20px;
}

.section-head h2 {
  margin-top: 4px;
  font-size: 1.9rem;
}

.section-head > p {
  max-width: 420px;
  color: var(--ink-soft);
  font-size: 0.82rem;
  line-height: 1.8;
  text-align: right;
}

.library-state {
  padding: 24px;
  border: 1px dashed var(--line-strong);
  border-radius: 14px;
  color: var(--ink-faint);
  font-size: 0.84rem;
  text-align: center;
}

.book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 14px;
}

.secondary-library {
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px dashed var(--line-strong);
}

.secondary-library__head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-end;
  margin-bottom: 14px;
}

.secondary-library__head h3 {
  margin-top: 2px;
  font-size: 1.25rem;
}

.secondary-library__head > p {
  max-width: 340px;
  color: var(--ink-faint);
  font-size: 0.76rem;
  line-height: 1.7;
}

.book-grid--secondary {
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
}

.book-grid--secondary .book-card {
  min-height: 200px;
  background: rgba(255, 252, 245, 0.42);
}

.book-grid--secondary .book-card__kicker {
  color: var(--ink-faint);
}

.book-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 230px;
  padding: 22px 20px 18px;
  overflow: hidden;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.book-card::after {
  content: "书";
  position: absolute;
  right: 12px;
  bottom: -10px;
  color: var(--jade);
  font-family: var(--serif);
  font-size: 5.6rem;
  line-height: 1;
  opacity: 0.07;
  pointer-events: none;
}

.book-card:hover {
  transform: translateY(-3px);
  border-color: var(--jade);
  box-shadow: var(--shadow-soft);
}

.book-card__kicker {
  color: var(--jade);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.book-card h3 {
  margin: 10px 0 8px;
  font-size: 1.7rem;
  letter-spacing: 0.05em;
}

.book-card__author {
  color: var(--cinnabar);
  font-size: 0.8rem;
}

.book-card__meta {
  margin-top: 10px;
  color: var(--ink-soft);
  font-size: 0.74rem;
  line-height: 1.8;
}

.book-card__size {
  margin-top: 3px;
  color: var(--ink-faint);
  font-size: 0.7rem;
}

.book-card__link {
  margin-top: auto;
  padding-top: 18px;
  color: var(--jade);
  font-size: 0.76rem;
}

.work-list-head {
  margin-top: 34px;
}

.classics-principle {
  margin: 22px 0 30px;
  padding: 20px 22px;
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: 24px;
}

.classics-principle h2 {
  margin-top: 3px;
  font-size: 1.2rem;
}

.classics-principle ul {
  margin: 0;
  padding-left: 18px;
  color: var(--ink-soft);
  font-size: 0.82rem;
  line-height: 1.9;
}

.classics-principle strong {
  color: var(--cinnabar);
}

.work-list {
  display: grid;
  gap: 16px;
}

.work-card {
  padding: 22px 24px;
  scroll-margin-top: 100px;
}

.work-card__head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);
}

.work-card h2 {
  margin: 5px 0 4px;
  font-size: 1.65rem;
  letter-spacing: 0.05em;
}

.work-card__parent {
  margin-top: 3px;
  color: var(--cinnabar);
  font-size: 0.76rem;
  line-height: 1.7;
}

.work-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 3px 12px;
  margin-top: 4px;
  color: var(--ink-faint);
  font-size: 0.72rem;
}

.work-card__count {
  flex-shrink: 0;
  color: var(--jade);
  font-size: 0.7rem;
}

.work-card__note {
  margin-top: 12px;
  padding: 8px 10px;
  border-left: 2px solid var(--gold);
  background: rgba(237, 224, 200, 0.28);
  color: var(--ink-soft);
  font-size: 0.74rem;
  line-height: 1.8;
}

.entry-list {
  display: grid;
  gap: 14px;
  margin-top: 14px;
}

.entry {
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255, 252, 245, 0.42);
}

.entry__locator {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.88rem;
}

.entry__quote {
  margin: 8px 0 0;
  padding: 9px 11px;
  border-left: 2px solid var(--cinnabar-2);
  background: rgba(255, 255, 255, 0.4);
  color: var(--ink-soft);
  font-family: var(--serif);
  font-size: 0.82rem;
  line-height: 1.85;
}

.entry__pending {
  margin-top: 6px;
  color: var(--ink-faint);
  font-size: 0.76rem;
  line-height: 1.7;
}

.entry__note {
  margin-top: 7px;
  color: var(--ink-faint);
  font-size: 0.7rem;
  line-height: 1.7;
}

.classics-footer {
  margin-top: 34px;
  padding: 22px 24px;
  display: grid;
  grid-template-columns: minmax(0, 0.6fr) minmax(0, 1.4fr) auto;
  gap: 24px;
  align-items: center;
}

.classics-footer h3 {
  margin-top: 3px;
  font-size: 1.05rem;
}

.classics-footer p {
  color: var(--ink-soft);
  font-size: 0.78rem;
  line-height: 1.8;
}

.classics-footer .text-link {
  white-space: nowrap;
  font-size: 0.8rem;
}

.library-entry {
  display: flex;
  align-items: center;
  gap: 22px;
  margin-top: 28px;
  padding: 22px 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.58), rgba(239, 230, 213, 0.55));
}

.library-entry__seal {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  flex: 0 0 auto;
  border: 1px solid var(--cinnabar);
  border-radius: 4px;
  color: var(--cinnabar);
  font-family: var(--font-serif);
  font-size: 1.5rem;
}

.library-entry__body {
  flex: 1;
  min-width: 0;
}

.library-entry h2 {
  margin: 2px 0 6px;
  font-family: var(--font-serif);
  font-size: clamp(1.35rem, 2.2vw, 1.8rem);
  letter-spacing: 0.04em;
}

.library-entry p {
  max-width: 780px;
  color: var(--ink-soft);
  font-size: 0.82rem;
  line-height: 1.85;
}

.library-entry .btn {
  flex: 0 0 auto;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .classics-principle,
  .classics-footer {
    grid-template-columns: 1fr;
  }

  .library-entry {
    flex-wrap: wrap;
  }

  .work-card__head {
    flex-direction: column;
  }

  .book-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .section-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .section-head > p {
    text-align: left;
  }
}

@media (max-width: 560px) {
  .book-grid {
    grid-template-columns: 1fr;
  }

  .book-card {
    min-height: 0;
  }

  .library-entry {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
