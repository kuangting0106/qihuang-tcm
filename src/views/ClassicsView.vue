<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useTcmData } from '@/composables/useTcmData'
import type { Citation } from '@/types/tcm'

const { data } = useTcmData()

const classics = computed(
  () => (data.value?.sources ?? []).filter((source) => source.type === 'classic'),
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
        <p class="eyebrow">CLASSICS / 医家经典古籍</p>
        <h1>医家经典古籍</h1>
        <p>
          这里收本项目已经引用的古籍与条文：书名、作者、版本、篇卷条号与原文摘录。
          具体内容页旁的“出处”仍可直接打开对应引文；本页只把已录入的古籍集中呈现，不另做全书索引。
        </p>
        <div class="classic-stats">
          <div><strong>{{ stats.works }}</strong><span>部古籍</span></div>
          <div><strong>{{ stats.entries }}</strong><span>条引文</span></div>
          <div><strong>{{ stats.quotes }}</strong><span>条带原文</span></div>
        </div>
      </header>

      <section class="classics-principle paper-panel">
        <div>
          <span class="eyebrow">READING RULE</span>
          <h2>先看原书，再看归纳</h2>
        </div>
        <ul>
          <li><strong>只列已录入的古籍</strong>：没有核对到书名、篇卷或条号的内容，不在这里硬补。</li>
          <li><strong>原文与归纳分开</strong>：有原文的条目直接展示；只有书名与条号者，明确标“未附逐字原文”。</li>
          <li><strong>不替代逐条出处</strong>：本草、方剂、经络页面中的“出处”按钮才是具体内容的引用入口。</li>
        </ul>
      </section>

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

@media (max-width: 900px) {
  .classics-principle,
  .classics-footer {
    grid-template-columns: 1fr;
  }

  .work-card__head {
    flex-direction: column;
  }
}
</style>
