<script setup lang="ts">
import { RouterLink } from 'vue-router'
import ClinicalNotice from '@/components/ClinicalNotice.vue'
import {
  causeQuestion,
  recordTemplate,
  specialQuestionGroups,
  tenQuestions,
  tenQuestionsIntro,
} from '@/data/clinical-methods'
</script>

<template>
  <section class="ten">
    <ClinicalNotice />

    <header class="ten-hero">
      <div class="ten-hero__copy">
        <p class="eyebrow">{{ tenQuestionsIntro.eyebrow }}</p>
        <h2>{{ tenQuestionsIntro.title }}</h2>
        <p class="ten-hero__lede">{{ tenQuestionsIntro.lede }}</p>
        <div class="ten-hero__meta">
          <span v-for="item in tenQuestionsIntro.meta" :key="item">{{ item }}</span>
        </div>
      </div>
      <span class="ten-hero__seal" aria-hidden="true">问</span>
    </header>

    <section class="ten-grid" aria-label="看诊十问">
      <article v-for="question in tenQuestions" :id="question.id" :key="question.id" class="ten-card">
        <div class="ten-card__top">
          <span class="ten-card__no">{{ question.no }}</span>
          <span class="ten-card__tag">问</span>
        </div>
        <h3>{{ question.title }}</h3>
        <p class="ten-card__summary">{{ question.summary }}</p>
        <ul>
          <li v-for="prompt in question.prompts" :key="prompt">{{ prompt }}</li>
        </ul>
        <p v-if="question.note" class="ten-card__note">{{ question.note }}</p>
      </article>
    </section>

    <section id="cause" class="cause paper-panel">
      <div class="cause__head">
        <span class="cause__mark">因</span>
        <div>
          <p class="eyebrow">CAUSE / 病因与诱因</p>
          <h3>{{ causeQuestion.title }}</h3>
          <p class="cause__summary">{{ causeQuestion.summary }}</p>
        </div>
      </div>
      <ul class="cause__list">
        <li v-for="prompt in causeQuestion.prompts" :key="prompt">{{ prompt }}</li>
      </ul>
    </section>

    <section class="special" aria-label="女性与儿童附问">
      <article v-for="group in specialQuestionGroups" :id="group.id" :key="group.id" class="special-card">
        <header>
          <p class="eyebrow">{{ group.id === 'women' ? 'WOMEN / 女性' : 'CHILDREN / 儿童' }}</p>
          <h3>{{ group.title }}</h3>
          <p>{{ group.subtitle }}</p>
        </header>
        <div class="special-card__items">
          <div v-for="item in group.items" :key="item.title" class="special-item">
            <h4>{{ item.title }}</h4>
            <ul>
              <li v-for="prompt in item.prompts" :key="prompt">{{ prompt }}</li>
            </ul>
          </div>
        </div>
        <p class="special-card__note">{{ group.note }}</p>
      </article>
    </section>

    <section class="record paper-panel">
      <div>
        <p class="eyebrow">RECORD / 记录模板</p>
        <h3>问完以后，怎么落笔</h3>
        <p>
          问诊的价值在“能复核”。把患者原话、时间线、诱因和加重缓解因素写清楚，再写你的经验判断与依据；
          不要把推测写成事实。
        </p>
      </div>
      <dl class="record-list">
        <div v-for="item in recordTemplate" :key="item.label">
          <dt>{{ item.label }}</dt>
          <dd>{{ item.hint }}</dd>
        </div>
      </dl>
    </section>

    <footer class="ten-foot">
      <p>问诊是入口，不是结论。下一步可对照治法顺序与望诊记录。</p>
      <div>
        <RouterLink class="text-link" to="/methods/treatment-methods">看治疗法门 →</RouterLink>
        <RouterLink class="text-link" to="/methods/inspection">看望诊经验 →</RouterLink>
      </div>
    </footer>
  </section>
</template>

<style scoped>
.ten {
  display: grid;
  gap: 24px;
  min-width: 0;
}

.ten-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 120px;
  gap: 28px;
  align-items: center;
  overflow: hidden;
  padding: 34px 36px;
  border-radius: 6px;
  background:
    radial-gradient(circle at 88% 18%, rgba(176, 138, 74, 0.26), transparent 34%),
    linear-gradient(135deg, #1d2b26 0%, #294842 58%, #315b53 100%);
  color: #f4efe4;
}

.ten-hero::after {
  content: '十问';
  position: absolute;
  right: 24px;
  bottom: -34px;
  color: rgba(244, 239, 228, 0.055);
  font-family: var(--serif);
  font-size: 8rem;
  line-height: 1;
  pointer-events: none;
}

.ten-hero .eyebrow {
  color: #d8bc87;
}

.ten-hero h2 {
  margin: 10px 0 14px;
  color: #fbf7ee;
  font-family: var(--serif);
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 500;
  letter-spacing: 0.05em;
}

.ten-hero__lede {
  max-width: 68ch;
  margin: 0;
  color: rgba(244, 239, 228, 0.82);
  font-size: 0.94rem;
  line-height: 1.9;
}

.ten-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin-top: 20px;
  color: rgba(244, 239, 228, 0.68);
  font-size: 0.78rem;
}

.ten-hero__meta span + span::before {
  content: '/';
  margin-right: 18px;
  color: rgba(216, 188, 135, 0.5);
}

.ten-hero__seal {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 112px;
  height: 112px;
  border: 1px solid rgba(216, 188, 135, 0.45);
  border-radius: 48% 52% 46% 54%;
  color: #d8bc87;
  font-family: var(--serif);
  font-size: 2.8rem;
  transform: rotate(-4deg);
}

.ten-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.ten-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 20px 22px 18px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background:
    linear-gradient(180deg, rgba(255, 253, 247, 0.9), rgba(247, 242, 231, 0.66)),
    var(--paper);
}

.ten-card__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ten-card__no {
  color: rgba(176, 138, 74, 0.7);
  font-family: var(--serif);
  font-size: 1.05rem;
}

.ten-card__tag {
  padding: 2px 7px;
  border: 1px solid var(--line);
  border-radius: 2px;
  color: var(--ink-faint);
  font-size: 0.64rem;
}

.ten-card h3 {
  margin: 12px 0 6px;
  font-family: var(--serif);
  font-size: 1.35rem;
  font-weight: 500;
}

.ten-card__summary {
  margin: 0 0 12px;
  color: var(--ink-soft);
  font-size: 0.83rem;
  line-height: 1.7;
}

.ten-card ul,
.cause__list,
.special-item ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.ten-card li,
.cause__list li,
.special-item li {
  position: relative;
  padding-left: 14px;
  color: var(--ink-soft);
  font-size: 0.82rem;
  line-height: 1.75;
}

.ten-card li::before,
.cause__list li::before,
.special-item li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.72em;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--gold);
}

.ten-card__note {
  margin: 12px 0 0;
  padding-top: 10px;
  border-top: 1px dashed var(--line);
  color: var(--ink-faint);
  font-size: 0.75rem;
  line-height: 1.65;
}

.cause {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 28px;
  padding: 26px 28px;
  border-color: rgba(176, 138, 74, 0.35);
  background:
    linear-gradient(135deg, rgba(176, 138, 74, 0.08), transparent 60%),
    var(--paper);
}

.cause__head {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.cause__mark {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  border: 1px solid var(--gold);
  border-radius: 50%;
  color: var(--gold);
  font-family: var(--serif);
  font-size: 1.15rem;
}

.cause h3 {
  margin: 5px 0 6px;
  font-family: var(--serif);
  font-size: 1.3rem;
  font-weight: 500;
}

.cause__summary {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.84rem;
  line-height: 1.7;
}

.special {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.special-card {
  min-width: 0;
  padding: 22px 24px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: rgba(255, 252, 245, 0.55);
}

.special-card h3 {
  margin: 5px 0 5px;
  font-family: var(--serif);
  font-size: 1.35rem;
  font-weight: 500;
}

.special-card header > p:last-child {
  margin: 0;
  color: var(--ink-faint);
  font-size: 0.8rem;
  line-height: 1.65;
}

.special-card__items {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.special-item {
  padding-top: 12px;
  border-top: 1px dashed var(--line);
}

.special-item h4 {
  margin: 0 0 6px;
  color: var(--jade);
  font-family: var(--serif);
  font-size: 1rem;
  font-weight: 500;
}

.special-card__note {
  margin: 14px 0 0;
  padding-top: 12px;
  border-top: 1px dashed var(--line);
  color: var(--ink-faint);
  font-size: 0.75rem;
  line-height: 1.65;
}

.record {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: 30px;
  padding: 24px 26px;
}

.record h3 {
  margin: 5px 0 10px;
  font-family: var(--serif);
  font-size: 1.3rem;
  font-weight: 500;
}

.record p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.84rem;
  line-height: 1.8;
}

.record-list {
  display: grid;
  gap: 9px;
  margin: 0;
}

.record-list > div {
  display: grid;
  grid-template-columns: 82px minmax(0, 1fr);
  gap: 12px;
  padding-bottom: 9px;
  border-bottom: 1px dashed var(--line);
}

.record-list > div:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.record-list dt {
  color: var(--jade);
  font-family: var(--serif);
  font-size: 0.86rem;
}

.record-list dd {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.8rem;
  line-height: 1.65;
}

.ten-foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  padding-top: 4px;
}

.ten-foot p {
  margin: 0;
  color: var(--ink-faint);
  font-size: 0.78rem;
}

.ten-foot div {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.ten-foot .text-link {
  font-size: 0.8rem;
}

@media (max-width: 900px) {
  .ten-hero {
    grid-template-columns: minmax(0, 1fr);
  }

  .ten-hero__seal {
    display: none;
  }

  .cause,
  .record {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 700px) {
  .ten-grid,
  .special {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .ten {
    gap: 18px;
  }

  .ten-hero {
    padding: 24px 20px;
  }

  .ten-card,
  .special-card {
    padding: 18px;
  }

  .cause,
  .record {
    padding: 20px 18px;
  }
}
</style>
