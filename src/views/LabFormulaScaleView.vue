<script setup lang="ts">
import { RouterLink } from 'vue-router'
import FormulaCompositionList from '@/components/FormulaCompositionList.vue'
import type { Formula, FormulaCompositionItem, FormulaRole } from '@/types/tcm'

const roles: { role: FormulaRole; count: number }[] = [
  { role: '君', count: 2 },
  { role: '臣', count: 4 },
  { role: '佐', count: 10 },
  { role: '使', count: 4 },
  { role: '佐使', count: 2 },
  { role: '未标注', count: 2 },
]

const herbNames: Record<string, string> = {}
const composition: FormulaCompositionItem[] = []
let n = 1
for (const group of roles) {
  for (let i = 0; i < group.count; i++) {
    const id = `mock-${String(n).padStart(2, '0')}`
    herbNames[id] = `示例药${String(n).padStart(2, '0')}`
    composition.push({
      herbId: id,
      dosage: `${n} 钱`,
      role: group.role,
      roleCitationIds: ['src-fangjixue'],
    })
    n++
  }
}

const mockFormula: Formula = {
  id: 'mock-large-formula',
  name: '大方布局演示',
  pinyin: 'Dà Fāng Bù Jú Yǎn Shì',
  sourceCitationId: 'src-fangjixue',
  originalText: {
    text: '这是一段布局演示文本，不是方剂原文。',
    kind: 'analysis',
    citationIds: ['src-fangjixue'],
  },
  effects: {
    text: '仅用于验证 21 味以上默认分组列表、全部展开、不折叠。',
    kind: 'analysis',
    citationIds: ['src-fangjixue'],
  },
  symptoms: [],
  composition,
  modifications: [],
  modificationsNote: '布局演示，不涉及真实加减。',
  corePairs: [],
  commentaries: [],
  additionalIndications: [],
  commentaryNote: '布局演示，不涉及真实解说。',
  verification: 'reference',
}

</script>

<template>
  <div class="page lab-page">
    <div class="container">
      <nav class="breadcrumbs" aria-label="面包屑">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/formulas">方剂</RouterLink>
        <span>/</span>
        <span>布局演示</span>
      </nav>

      <header class="lab-head">
        <p class="eyebrow">LAYOUT LAB / 布局演示</p>
        <h1>21 味以上，怎么放？</h1>
        <p>
          这是一个<strong>纯布局演示</strong>，使用 24 个“示例药”节点，不是真实方剂，也不属于医学内容。
          目的只有一个：验证 21 味以上默认按角色分组列表、全部展开、不折叠。
        </p>
        <div class="lab-tags">
          <span class="chip chip--cinnabar">24 味模拟数据</span>
          <span class="chip chip--jade">按角色分组</span>
          <span class="chip chip--gold">全部展开 · 不折叠</span>
          <span class="chip">无手风琴</span>
        </div>
      </header>

      <section class="lab-rules paper-panel">
        <div>
          <span class="eyebrow">RULES</span>
          <h2>三档布局</h2>
        </div>
        <div class="lab-rule-grid">
          <article>
            <strong>1～8 味</strong>
            <p>同心环 / 放射布局，按君 → 臣 → 佐 → 使从内到外。</p>
          </article>
          <article>
            <strong>9～20 味</strong>
            <p>分层图谱 + 角色分组列表并排；列表不折叠。</p>
          </article>
          <article class="lab-rule-grid__active">
            <strong>21 味以上</strong>
            <p>默认角色分组列表，全部展开，不折叠；图谱作为可选视图。</p>
          </article>
        </div>
      </section>

      <section class="lab-demo">
        <div class="section-head">
          <div>
            <p class="eyebrow">DEMO / 24 味</p>
            <h2>大方分组列表</h2>
          </div>
          <p>{{ composition.length }} 味 · 全部分组默认展开</p>
        </div>

        <FormulaCompositionList
          :formula="mockFormula"
          variant="grouped"
          :herb-names="herbNames"
        />
      </section>

      <section class="lab-notes paper-panel">
        <div>
          <span class="eyebrow">WHY</span>
          <h3>为什么不画成一张大网？</h3>
        </div>
        <p>
          24 味药如果两两连线，会产生 276 条边，既看不清，也容易暗示不存在的配伍关系。
          所以主图只画“方剂 → 药材”的组成边；药材之间的药对只列有出处的核心药对。
          21 味以上默认列表，先把每一味药、用量、角色、出处看清楚。
        </p>
        <RouterLink class="text-link" to="/formulas">返回方剂列表 →</RouterLink>
      </section>
    </div>
  </div>
</template>

<style scoped>
.breadcrumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 18px 0 20px;
  color: var(--ink-faint);
  font-size: 0.76rem;
}

.breadcrumbs a:hover {
  color: var(--cinnabar);
}

.lab-head {
  padding-bottom: 28px;
  border-bottom: 1px solid var(--line-strong);
}

.lab-head h1 {
  margin: 5px 0 12px;
  font-size: clamp(2.4rem, 5.5vw, 4.2rem);
  letter-spacing: 0.04em;
}

.lab-head > p {
  max-width: 760px;
  color: var(--ink-soft);
  font-size: 0.92rem;
  line-height: 1.9;
}

.lab-head strong {
  color: var(--cinnabar);
}

.lab-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 16px;
}

.lab-rules {
  margin: 22px 0 36px;
  padding: 20px 22px;
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 24px;
}

.lab-rules h2 {
  margin-top: 3px;
  font-size: 1.3rem;
}

.lab-rule-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.lab-rule-grid article {
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.34);
}

.lab-rule-grid__active {
  border-color: rgba(163, 58, 43, 0.34) !important;
  background: var(--cinnabar-pale) !important;
}

.lab-rule-grid strong {
  font-family: var(--serif);
  font-size: 0.9rem;
}

.lab-rule-grid p {
  margin-top: 4px;
  color: var(--ink-soft);
  font-size: 0.74rem;
  line-height: 1.7;
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
  font-size: 0.78rem;
}

.lab-notes {
  margin-top: 36px;
  padding: 22px 24px;
  display: grid;
  grid-template-columns: minmax(0, 0.7fr) minmax(0, 1.3fr) auto;
  gap: 22px;
  align-items: center;
}

.lab-notes h3 {
  margin-top: 3px;
  font-size: 1.05rem;
}

.lab-notes p {
  color: var(--ink-soft);
  font-size: 0.8rem;
  line-height: 1.8;
}

.lab-notes .text-link {
  white-space: nowrap;
  font-size: 0.8rem;
}

@media (max-width: 900px) {
  .lab-rules,
  .lab-notes {
    grid-template-columns: 1fr;
  }

  .lab-rule-grid {
    grid-template-columns: 1fr;
  }

  .section-head {
    flex-direction: column;
    align-items: flex-start;
  }

}
</style>
