<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { processingCategories } from '@/data/processing'

const totalEntries = processingCategories.reduce((sum, category) => sum + category.count, 0)
</script>

<template>
  <div class="page processing-page">
    <div class="container">
      <header class="processing-hero">
        <div>
          <p class="eyebrow">PROCESSING / 药材的炮制</p>
          <h1>药材的炮制</h1>
          <p class="processing-hero__lead">
            按草木类、蛇虫类、金石类等分类，收集多味药材的炮制方法。
            每一条都注明原书、药典或炮制规范；来源未核前只列条目，不写操作细节。
          </p>
          <div class="processing-hero__meta">
            <span class="chip chip--gold">{{ processingCategories.length }} 个类别</span>
            <span class="chip">{{ totalEntries }} 味已收录</span>
            <span class="chip chip--jade">炮制方法待逐条补入</span>
          </div>
        </div>
        <div class="processing-hero__seal" aria-hidden="true">制</div>
      </header>

      <section class="processing-grid" aria-label="药材炮制类别">
        <article v-for="category in processingCategories" :key="category.id" class="processing-card">
          <div class="processing-card__top">
            <span class="processing-card__kicker">{{ category.kicker }}</span>
            <span class="processing-card__status">{{ category.status }}</span>
          </div>
          <h2>{{ category.title }}</h2>
          <p class="processing-card__scope">{{ category.scope }}</p>
          <div class="processing-card__count">{{ category.count }} 味已收录</div>
          <p class="processing-card__note">{{ category.note }}</p>
        </article>
      </section>

      <section class="processing-entries">
        <div class="section-head">
          <div>
            <p class="eyebrow">ENTRIES / 炮制条目</p>
            <h2>已核条目</h2>
          </div>
          <p>只展示能回引具体出处的炮制方法；未核条目留在待收录清单，不先写操作步骤。</p>
        </div>

        <div class="entry-table paper-panel">
          <div class="entry-table__head" aria-hidden="true">
            <span>药材</span>
            <span>类别</span>
            <span>炮制方法</span>
            <span>出处</span>
            <span>状态</span>
          </div>
          <div class="entry-table__empty">
            <strong>暂无已核条目</strong>
            <p>
              录入时会补：药材名、类别、炮制方法、成品性状、使用注意与出处。
              草木类、蛇虫类、金石类分开登记，毒性药材单独标注。
            </p>
            <RouterLink class="text-link" to="/classics">查看现有医家经典古籍 →</RouterLink>
          </div>
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

.entry-table {
  padding: 0;
  overflow: hidden;
}

.entry-table__head {
  display: grid;
  grid-template-columns: 1fr 0.7fr 2fr 1.2fr 0.6fr;
  gap: 12px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--line);
  background: rgba(237, 224, 200, 0.28);
  color: var(--ink-faint);
  font-size: 0.7rem;
}

.entry-table__empty {
  padding: 28px 22px;
}

.entry-table__empty strong {
  font-family: var(--serif);
  font-size: 1.1rem;
}

.entry-table__empty p {
  max-width: 720px;
  margin: 6px 0 10px;
  color: var(--ink-soft);
  font-size: 0.8rem;
  line-height: 1.85;
}

.entry-table__empty .text-link {
  font-size: 0.78rem;
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
}

@media (max-width: 700px) {
  .processing-hero {
    align-items: flex-start;
  }

  .processing-hero__seal {
    width: 74px;
    height: 74px;
    font-size: 1.6rem;
  }

  .processing-grid {
    grid-template-columns: 1fr;
  }

  .entry-table__head {
    display: none;
  }

  .processing-rules {
    grid-template-columns: 1fr;
  }
}
</style>
