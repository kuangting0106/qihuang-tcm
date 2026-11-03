<script setup lang="ts">
import { computed } from 'vue'
import quickref from '@/data/acupuncture-quickref.json'

const cases = computed(() => [
  ...quickref.conditionCases.map((item) => ({
    id: item.id,
    kind: '病症常针医案',
    group: item.categoryTitle,
    title: item.conditionTitle,
    text: item.text,
  })),
  ...quickref.penetrations
    .filter((item) => item.case)
    .map((item) => ({
      id: `penetration-case-${item.id}`,
      kind: '透针治案',
      group: '31 条透针透穴',
      title: item.title,
      text: item.case,
    })),
])
</script>

<template>
  <section class="cases" aria-labelledby="cases-title">
    <div class="cases__head">
      <div>
        <p class="eyebrow">NEEDLING CASES / 下针医案</p>
        <h2 id="cases-title">下针治疗医案</h2>
        <p class="cases__intro">
          从病症常针与透针透穴原条文中抽出医案，保留患者概况、取穴与疗程原貌；不补写原文没有的处方或疗效。
        </p>
      </div>
      <span class="chip chip--cinnabar">{{ cases.length }} 则</span>
    </div>

    <div class="cases__list">
      <article v-for="item in cases" :id="item.id" :key="item.id" class="case paper-panel">
        <header class="case__head">
          <span class="case__kind">{{ item.kind }}</span>
          <h3>{{ item.title }}</h3>
          <span class="case__group">{{ item.group }}</span>
        </header>
        <p class="case__text">{{ item.text }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.cases__head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-end;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line-strong);
}

.cases__head h2 {
  margin: 4px 0 6px;
  font-family: var(--serif);
  font-size: 1.6rem;
  font-weight: 400;
}

.cases__intro {
  max-width: 760px;
  color: var(--ink-faint);
  font-size: 0.68rem;
  line-height: 1.75;
}

.cases__list {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.case {
  padding: 16px 18px;
  scroll-margin-top: 96px;
}

.case__head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: baseline;
}

.case__kind {
  padding: 2px 6px;
  border: 1px solid var(--cinnabar);
  color: var(--cinnabar);
  font-size: 0.58rem;
  letter-spacing: 0.06em;
}

.case h3 {
  font-family: var(--serif);
  font-size: 1.02rem;
  font-weight: 500;
}

.case__group {
  margin-left: auto;
  color: var(--ink-faint);
  font-size: 0.6rem;
}

.case__text {
  margin-top: 8px;
  color: var(--ink-soft);
  font-size: 0.74rem;
  line-height: 1.9;
}

@media (max-width: 700px) {
  .cases__head {
    align-items: flex-start;
    flex-direction: column;
  }

  .case__group {
    width: 100%;
    margin-left: 0;
  }
}
</style>
