<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useTcmData } from '@/composables/useTcmData'
import type { Citation } from '@/types/tcm'

const { data } = useTcmData()

const sources = computed(() => data.value?.sources ?? [])

const typeLabels: Record<string, string> = {
  classic: '经典原文',
  standard: '标准 / 药典',
  textbook: '教材归纳',
  image: '图片',
}

const groups = computed(() => {
  const order = ['classic', 'standard', 'textbook']
  return order
    .map((type) => ({
      type,
      label: typeLabels[type] ?? type,
      items: sources.value.filter((s) => s.type === type),
    }))
    .filter((g) => g.items.length)
})

const usage = computed(() => {
  const counts = new Map<string, number>()
  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      node.forEach(visit)
      return
    }
    const obj = node as Record<string, unknown>
    const ids = obj.citationIds
    if (Array.isArray(ids)) {
      ids.forEach((id) => {
        if (typeof id === 'string') counts.set(id, (counts.get(id) ?? 0) + 1)
      })
    }
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'citationIds') continue
      visit(value)
    }
  }
  visit(data.value)
  return counts
})

function usageCount(c: Citation) {
  return usage.value.get(c.id) ?? 0
}

const stats = computed(() => {
  const total = sources.value.length
  const classic = sources.value.filter((s) => s.type === 'classic').length
  const standard = sources.value.filter((s) => s.type === 'standard').length
  const textbook = sources.value.filter((s) => s.type === 'textbook').length
  return { total, classic, standard, textbook }
})
</script>

<template>
  <div class="page sources-page">
    <div class="container">
      <header class="sources-head">
        <p class="eyebrow">SOURCE INDEX / 出处索引</p>
        <h1>出处索引</h1>
        <p>
          这是原型的“参考文献”页。经典原文、药典/标准、教材归纳分开列出；
          每条内容在页面里都挂到这里的编号，点击即可查看书名、版次、条号与引文。
        </p>
        <div class="source-stats">
          <div><strong>{{ stats.total }}</strong><span>条来源</span></div>
          <div><strong>{{ stats.classic }}</strong><span>经典原文</span></div>
          <div><strong>{{ stats.standard }}</strong><span>标准 / 药典</span></div>
          <div><strong>{{ stats.textbook }}</strong><span>教材归纳</span></div>
        </div>
      </header>

      <section class="source-principles paper-panel">
        <div>
          <span class="eyebrow">PRINCIPLE</span>
          <h2>原文、摘录、方解，不混在一起</h2>
        </div>
        <ul>
          <li><strong>原文</strong>：经典原句，尽量保留原字与原条号。</li>
          <li><strong>摘录</strong>：药典、标准或教材的归纳，不冒充经典原句。</li>
          <li><strong>后世方解</strong>：君臣佐使、药对意义等后世分析，单独标“后世方解”，不冒充经典原文。</li>
        </ul>
      </section>

      <section v-for="group in groups" :key="group.type" class="source-group">
        <div class="section-head">
          <div>
            <p class="eyebrow">{{ group.type.toUpperCase() }}</p>
            <h2>{{ group.label }}</h2>
          </div>
          <p>{{ group.items.length }} 条</p>
        </div>

        <div class="source-list">
          <article v-for="c in group.items" :id="c.id" :key="c.id" class="source-card">
            <header class="source-card__head">
              <div>
                <span class="citation-type" :class="`citation-type--${c.type}`">{{ typeLabels[c.type] }}</span>
                <h3>{{ c.work }}</h3>
                <p class="source-card__meta">
                  <span v-if="c.author">{{ c.author }}</span>
                  <span v-if="c.edition">{{ c.edition }}</span>
                  <span v-if="c.publisher">{{ c.publisher }}</span>
                  <span v-if="c.year">{{ c.year }}</span>
                </p>
              </div>
              <span class="source-card__usage">{{ usageCount(c) }} 处引用</span>
            </header>
            <p class="source-card__locator">{{ c.locator }}</p>
            <blockquote v-if="c.quote" class="source-card__quote">{{ c.quote }}</blockquote>
            <p v-else class="source-card__note">本条为依据该来源归纳，未附逐字原文。</p>
            <p v-if="c.note" class="source-card__note">{{ c.note }}</p>
          </article>
        </div>
      </section>

      <section class="source-footer paper-panel">
        <div>
          <span class="eyebrow">CHECK</span>
          <h3>如何核对</h3>
        </div>
        <p>
          先看条目旁的“原文/摘录/后世方解”标签，再点“出处”查看引文。经典原文以《伤寒论》宋本、《灵枢》《难经》为据；
          药性以《中华人民共和国药典》2020年版一部为样例依据；穴位定位以 GB/T 12346-2021 为据；
          君臣佐使与药对按《方剂学》《中药学》规划教材归纳。正式使用前应按现行版原书复核。
        </p>
        <RouterLink class="text-link" to="/">返回首页 →</RouterLink>
      </section>
    </div>
  </div>
</template>

<style scoped>
.sources-head {
  padding: 28px 0 30px;
  border-bottom: 1px solid var(--line-strong);
}

.sources-head h1 {
  margin: 5px 0 12px;
  font-size: clamp(2.8rem, 6vw, 4.6rem);
  letter-spacing: 0.08em;
}

.sources-head > p {
  max-width: 760px;
  color: var(--ink-soft);
  font-size: 0.92rem;
  line-height: 1.9;
}

.source-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 18px 34px;
  margin-top: 24px;
}

.source-stats div {
  display: flex;
  align-items: baseline;
  gap: 7px;
  border-left: 1px solid var(--line-strong);
  padding-left: 12px;
}

.source-stats strong {
  font-family: var(--serif);
  font-size: 1.7rem;
}

.source-stats span {
  color: var(--ink-soft);
  font-size: 0.74rem;
}

.source-principles {
  margin: 22px 0 36px;
  padding: 20px 22px;
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: 24px;
}

.source-principles h2 {
  margin-top: 3px;
  font-size: 1.2rem;
}

.source-principles ul {
  margin: 0;
  padding-left: 18px;
  color: var(--ink-soft);
  font-size: 0.82rem;
  line-height: 1.9;
}

.source-principles strong {
  color: var(--cinnabar);
}

.source-group {
  padding-top: 26px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-end;
  margin-bottom: 14px;
}

.section-head h2 {
  margin-top: 3px;
}

.section-head > p {
  color: var(--ink-faint);
  font-size: 0.8rem;
}

.source-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.source-card {
  scroll-margin-top: 100px;
  padding: 17px 18px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(255, 252, 245, 0.52);
}

.source-card__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.source-card h3 {
  margin-top: 5px;
  font-size: 1.05rem;
}

.source-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 3px 10px;
  margin-top: 3px;
  color: var(--ink-faint);
  font-size: 0.7rem;
}

.source-card__usage {
  flex-shrink: 0;
  color: var(--jade);
  font-size: 0.68rem;
}

.source-card__locator {
  margin-top: 8px;
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.82rem;
}

.source-card__quote {
  margin: 8px 0 0;
  padding: 9px 11px;
  border-left: 2px solid var(--cinnabar-2);
  background: rgba(255, 255, 255, 0.38);
  font-family: var(--serif);
  font-size: 0.8rem;
  line-height: 1.8;
  color: var(--ink-soft);
}

.source-card__note {
  margin-top: 8px;
  color: var(--ink-faint);
  font-size: 0.7rem;
  line-height: 1.7;
}

.source-footer {
  margin-top: 42px;
  padding: 22px 24px;
  display: grid;
  grid-template-columns: minmax(0, 0.6fr) minmax(0, 1.4fr) auto;
  gap: 24px;
  align-items: center;
}

.source-footer h3 {
  margin-top: 3px;
  font-size: 1.05rem;
}

.source-footer p {
  color: var(--ink-soft);
  font-size: 0.78rem;
  line-height: 1.8;
}

.source-footer .text-link {
  white-space: nowrap;
  font-size: 0.8rem;
}

@media (max-width: 900px) {
  .source-list {
    grid-template-columns: 1fr;
  }

  .source-principles,
  .source-footer {
    grid-template-columns: 1fr;
  }

  .section-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
