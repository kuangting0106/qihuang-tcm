<script setup lang="ts">
import { RouterLink } from 'vue-router'
import ClinicalNotice from '@/components/ClinicalNotice.vue'
import {
  commonPulses,
  dangerPulses,
  formulaPatterns,
  pulseBoundary,
  pulseCases,
  pulseDynamics,
  pulseIntro,
  pulseOverview,
} from '@/data/pulse-diagnosis'
import { pulseMedia, pulseMediaHref } from '@/data/pulse-media'
</script>

<template>
  <section class="pulse">
    <ClinicalNotice />

    <header class="pulse-hero">
      <div>
        <p class="eyebrow">{{ pulseIntro.eyebrow }}</p>
        <h2>{{ pulseIntro.title }}</h2>
        <p class="pulse-hero__lede">{{ pulseIntro.lede }}</p>
        <div class="pulse-hero__meta">
          <span v-for="item in pulseIntro.meta" :key="item">{{ item }}</span>
        </div>
      </div>
      <span class="pulse-hero__seal" aria-hidden="true">脉</span>
    </header>

    <nav class="pulse-nav" aria-label="脉诊页内目录">
      <a href="#overview">总论</a>
      <a href="#media">图示资料</a>
      <a href="#common">常见脉象</a>
      <a href="#danger">危重脉象</a>
      <a href="#formulas">方证对应</a>
      <a href="#dynamics">动态观察</a>
      <a href="#cases">医案</a>
      <a href="#boundary">边界</a>
    </nav>

    <section id="media" class="pulse-media" aria-labelledby="pulse-media-title">
      <div v-for="item in pulseMedia" :key="item.id" class="pulse-media__item">
        <span class="pulse-media__mark" aria-hidden="true">图</span>
        <div class="pulse-media__body">
          <p class="eyebrow">MEDIA / 图示资料</p>
          <h3 id="pulse-media-title">{{ item.title }}</h3>
          <p>{{ item.description }}</p>
          <div class="pulse-media__meta">
            <span>{{ item.subtitle }}</span>
            <span>{{ item.format }}</span>
            <span>{{ item.credit }}</span>
          </div>
          <p class="pulse-media__note">{{ item.note }}</p>
        </div>
        <a
          class="pulse-media__link"
          :href="pulseMediaHref(item.file)"
          target="_blank"
          rel="noopener"
        >
          打开视频 ↗
        </a>
      </div>
    </section>

    <section id="overview" class="pulse-section">
      <header class="pulse-section__head">
        <span class="pulse-section__no">01</span>
        <div>
          <h3>李可脉诊总论</h3>
          <p>先立态度，再谈具体脉象。</p>
        </div>
      </header>

      <div class="overview-grid">
        <article class="overview-card">
          <span class="overview-card__label">脉诊的重要性</span>
          <ul>
            <li v-for="item in pulseOverview.importance" :key="item">{{ item }}</li>
          </ul>
        </article>
        <article class="overview-card overview-card--jade">
          <span class="overview-card__label">李可的脉诊特色</span>
          <ul>
            <li v-for="item in pulseOverview.features" :key="item">{{ item }}</li>
          </ul>
        </article>
      </div>
    </section>

    <section id="common" class="pulse-section">
      <header class="pulse-section__head">
        <span class="pulse-section__no">02</span>
        <div>
          <h3>常见脉象辨析</h3>
          <p>同一种脉象，传统含义与李可经验并不总是一致。</p>
        </div>
      </header>

      <p class="pulse-section__note">
        原稿把“传统观点”和“李可经验”并列。两者都是整理，不等同于原书原文；临证仍需结合体质、症状、舌象与病程。
      </p>

      <div class="pulse-grid">
        <article v-for="pulse in commonPulses" :key="pulse.id" class="pulse-card">
          <header class="pulse-card__head">
            <h4>{{ pulse.name }}</h4>
            <span>常见脉象</span>
          </header>
          <dl class="pulse-facts">
            <div>
              <dt>传统观点</dt>
              <dd>{{ pulse.traditional }}</dd>
            </div>
            <div class="pulse-facts__accent">
              <dt>李可经验</dt>
              <dd>{{ pulse.experience }}</dd>
            </div>
            <div v-if="pulse.significance">
              <dt>临床意义</dt>
              <dd>{{ pulse.significance }}</dd>
            </div>
            <div v-if="pulse.differentiation">
              <dt>鉴别</dt>
              <dd>{{ pulse.differentiation }}</dd>
            </div>
          </dl>
          <p v-if="pulse.treatment" class="pulse-card__treatment">
            <span>治法</span>
            {{ pulse.treatment }}
          </p>
        </article>
      </div>
    </section>

    <section id="danger" class="pulse-section">
      <header class="pulse-section__head">
        <span class="pulse-section__no">03</span>
        <div>
          <h3>危重脉象</h3>
          <p>看见这些脉象，先按急危重症处理，不要只凭脉象试方。</p>
        </div>
      </header>

      <div class="pulse-alert" role="note">
        <strong>急症提醒</strong>
        <span>脉微细欲绝、浮大无根、测不到血压或意识改变，应立即急救并送医；不要自行照方用药。</span>
      </div>

      <div class="danger-grid">
        <article v-for="item in dangerPulses" :key="item.id" class="danger-card">
          <header class="danger-card__head">
            <h4>{{ item.name }}</h4>
            <span>危重</span>
          </header>
          <ul class="danger-card__features">
            <li v-for="feature in item.features" :key="feature">{{ feature }}</li>
          </ul>
          <p class="danger-card__line">
            <strong>临床意义</strong>
            {{ item.significance }}
          </p>
          <p v-if="item.treatment" class="danger-card__line danger-card__line--action">
            <strong>处理</strong>
            {{ item.treatment }}
          </p>
        </article>
      </div>
    </section>

    <section id="formulas" class="pulse-section">
      <header class="pulse-section__head">
        <span class="pulse-section__no">04</span>
        <div>
          <h3>脉象与方证对应</h3>
          <p>按六经病把脉象与方名并排，方便回看，不是处方依据。</p>
        </div>
      </header>

      <p class="pulse-section__note">
        以下是整理稿的经验索引。具体用药需执业医师辨证；附子等有毒药物不可自行使用。
      </p>

      <div class="formula-grid">
        <article v-for="group in formulaPatterns" :key="group.id" class="formula-card">
          <header>
            <h4>{{ group.name }}</h4>
            <span>{{ group.items.length }} 组</span>
          </header>
          <div v-for="item in group.items" :key="`${group.id}-${item.pulse}`" class="formula-row">
            <span class="formula-row__pulse">{{ item.pulse }}</span>
            <span class="formula-row__arrow" aria-hidden="true">→</span>
            <strong>{{ item.formula }}</strong>
          </div>
        </article>
      </div>
    </section>

    <section id="dynamics" class="pulse-section">
      <header class="pulse-section__head">
        <span class="pulse-section__no">05</span>
        <div>
          <h3>脉诊的动态观察</h3>
          <p>脉象不是一张静态照片；服药前后的变化，往往比单次脉象更有信息。</p>
        </div>
      </header>

      <div class="dynamics-grid">
        <article v-for="group in pulseDynamics" :key="group.id" class="dynamics-card">
          <h4>{{ group.title }}</h4>
          <ul>
            <li v-for="item in group.items" :key="item.label">
              <span>{{ item.label }}</span>
              <p>{{ item.description }}</p>
            </li>
          </ul>
        </article>
      </div>
    </section>

    <section id="cases" class="pulse-section">
      <header class="pulse-section__head">
        <span class="pulse-section__no">06</span>
        <div>
          <h3>李可脉诊医案</h3>
          <p>三则短案，展示脉象如何落到辨证与治法。</p>
        </div>
      </header>

      <div class="case-grid">
        <article v-for="(item, index) in pulseCases" :key="item.id" class="pulse-case">
          <header class="pulse-case__head">
            <span class="pulse-case__no">CASE {{ String(index + 1).padStart(2, '0') }}</span>
            <h4>{{ item.title }}</h4>
          </header>
          <dl class="pulse-case__facts">
            <div>
              <dt>患者</dt>
              <dd>{{ item.patient }}</dd>
            </div>
            <div>
              <dt>症状</dt>
              <dd>{{ item.symptoms }}</dd>
            </div>
            <div class="pulse-case__pulse">
              <dt>脉象</dt>
              <dd>{{ item.pulse }}</dd>
            </div>
            <div>
              <dt>辨证</dt>
              <dd>{{ item.pattern }}</dd>
            </div>
            <div>
              <dt>治法</dt>
              <dd>{{ item.treatment }}</dd>
            </div>
            <div>
              <dt>疗效</dt>
              <dd>{{ item.outcome }}</dd>
            </div>
          </dl>
        </article>
      </div>
    </section>

    <section id="boundary" class="pulse-boundary paper-panel">
      <div class="pulse-boundary__intro">
        <span class="pulse-boundary__seal" aria-hidden="true">界</span>
        <div>
          <p class="eyebrow">BOUNDARY / 诚实边界</p>
          <h3>经验有边界，脉象不是结论</h3>
          <p>{{ pulseBoundary.sourceStatement }}</p>
        </div>
      </div>
      <div class="pulse-boundary__body">
        <h4>这份整理稿的局限</h4>
        <ul>
          <li v-for="item in pulseBoundary.limitations" :key="item">{{ item }}</li>
        </ul>
      </div>
    </section>

    <footer class="pulse-foot">
      <p>脉诊要与问诊、望诊、闻诊互参；单凭一个脉象，容易把经验当成结论。</p>
      <div>
        <RouterLink class="text-link" to="/methods/ten-questions">回到看诊十问 →</RouterLink>
        <RouterLink class="text-link" to="/methods/inspection">看望诊经验 →</RouterLink>
        <RouterLink class="text-link" to="/methods/treatment-methods">看治疗法门 →</RouterLink>
      </div>
    </footer>
  </section>
</template>

<style scoped>
.pulse {
  display: grid;
  gap: 24px;
  min-width: 0;
}

.pulse-hero {
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

.pulse-hero::after {
  content: '脉';
  position: absolute;
  right: 24px;
  bottom: -46px;
  color: rgba(244, 239, 228, 0.05);
  font-family: var(--serif);
  font-size: 12rem;
  line-height: 1;
  pointer-events: none;
}

.pulse-hero .eyebrow {
  color: #d8bc87;
}

.pulse-hero h2 {
  margin: 10px 0 14px;
  color: #fbf7ee;
  font-family: var(--serif);
  font-size: clamp(1.9rem, 3.6vw, 2.8rem);
  font-weight: 500;
  letter-spacing: 0.05em;
}

.pulse-hero__lede {
  max-width: 66ch;
  margin: 0;
  color: rgba(244, 239, 228, 0.82);
  font-size: 0.94rem;
  line-height: 1.9;
}

.pulse-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 16px;
}

.pulse-hero__meta span {
  padding: 3px 9px;
  border: 1px solid rgba(216, 188, 135, 0.34);
  border-radius: 999px;
  color: #e2cda2;
  font-size: 0.68rem;
}

.pulse-hero__seal {
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

.pulse-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 2px 0;
}

.pulse-nav a {
  padding: 6px 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--ink-soft);
  font-size: 0.75rem;
  text-decoration: none;
  transition: border-color 0.18s ease, color 0.18s ease;
}

.pulse-nav a:hover {
  border-color: var(--jade);
  color: var(--jade);
}

.pulse-media {
  display: grid;
  gap: 10px;
}

.pulse-media__item {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 16px 18px;
  border: 1px solid rgba(47, 93, 87, 0.24);
  border-radius: 6px;
  background:
    radial-gradient(circle at 100% 0%, rgba(216, 188, 135, 0.16), transparent 18rem),
    linear-gradient(135deg, rgba(220, 232, 226, 0.78), rgba(255, 252, 245, 0.62));
}

.pulse-media__mark {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 1px solid var(--jade);
  border-radius: 48% 52% 46% 54%;
  color: var(--jade);
  font-family: var(--serif);
  font-size: 1.2rem;
  transform: rotate(-4deg);
}

.pulse-media__body h3 {
  margin: 3px 0 5px;
  font-family: var(--serif);
  font-size: 1.2rem;
  font-weight: 500;
}

.pulse-media__body > p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.8rem;
  line-height: 1.75;
}

.pulse-media__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin-top: 6px;
  color: var(--jade);
  font-size: 0.68rem;
}

.pulse-media__note {
  margin-top: 5px;
  color: var(--ink-faint) !important;
  font-size: 0.7rem !important;
}

.pulse-media__link {
  flex-shrink: 0;
  padding: 8px 14px;
  border-radius: 999px;
  background: var(--jade);
  color: var(--paper);
  font-size: 0.76rem;
  text-decoration: none;
  transition: background 0.16s ease;
}

.pulse-media__link:hover {
  background: var(--cinnabar);
}

.pulse-section {
  scroll-margin-top: calc(var(--header-h) + 20px);
  display: grid;
  gap: 14px;
  padding: 26px 28px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background:
    linear-gradient(180deg, rgba(255, 253, 247, 0.9), rgba(247, 242, 231, 0.66)),
    var(--paper);
}

.pulse-section__head {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);
}

.pulse-section__no {
  color: rgba(176, 138, 74, 0.55);
  font-family: var(--serif);
  font-size: 2.2rem;
  line-height: 0.9;
}

.pulse-section__head h3 {
  margin: 2px 0 5px;
  font-family: var(--serif);
  font-size: 1.5rem;
  font-weight: 500;
}

.pulse-section__head p {
  margin: 0;
  color: var(--ink-faint);
  font-size: 0.82rem;
  line-height: 1.7;
}

.pulse-section__note {
  margin: 0;
  padding: 10px 12px;
  border-left: 2px solid var(--gold);
  background: rgba(176, 138, 74, 0.06);
  color: var(--ink-soft);
  font-size: 0.78rem;
  line-height: 1.7;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.overview-card {
  padding: 18px 18px 14px;
  border: 1px solid var(--line);
  border-top: 3px solid var(--gold);
  border-radius: 4px;
  background: rgba(255, 253, 247, 0.55);
}

.overview-card--jade {
  border-top-color: var(--jade);
}

.overview-card__label {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 1.05rem;
}

.overview-card--jade .overview-card__label {
  color: var(--jade);
}

.overview-card ul {
  margin: 10px 0 0;
  padding-left: 18px;
  color: var(--ink-soft);
  font-size: 0.83rem;
  line-height: 1.85;
}

.overview-card li + li {
  margin-top: 4px;
}

.pulse-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.pulse-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 16px 17px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: rgba(255, 253, 247, 0.55);
}

.pulse-card__head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: baseline;
  padding-bottom: 9px;
  border-bottom: 1px dashed var(--line);
}

.pulse-card__head h4 {
  margin: 0;
  color: var(--ink);
  font-family: var(--serif);
  font-size: 1.28rem;
  font-weight: 500;
}

.pulse-card__head span {
  color: var(--ink-faint);
  font-size: 0.64rem;
}

.pulse-facts {
  display: grid;
  gap: 7px;
  margin: 11px 0 0;
}

.pulse-facts > div {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 10px;
}

.pulse-facts dt {
  color: var(--ink-faint);
  font-size: 0.7rem;
  line-height: 1.65;
}

.pulse-facts dd {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.8rem;
  line-height: 1.65;
}

.pulse-facts__accent dt {
  color: var(--jade);
}

.pulse-facts__accent dd {
  color: var(--ink);
}

.pulse-card__treatment {
  margin: auto 0 0;
  padding-top: 10px;
  color: var(--cinnabar);
  font-size: 0.78rem;
  line-height: 1.6;
}

.pulse-card__treatment span {
  display: inline-block;
  margin-right: 6px;
  padding: 1px 7px;
  border: 1px solid rgba(163, 58, 43, 0.3);
  border-radius: 999px;
  font-size: 0.64rem;
}

.pulse-alert {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  align-items: baseline;
  padding: 11px 14px;
  border: 1px solid rgba(163, 58, 43, 0.32);
  border-left: 3px solid var(--cinnabar);
  border-radius: 3px;
  background: rgba(163, 58, 43, 0.055);
  color: var(--ink-soft);
  font-size: 0.78rem;
  line-height: 1.65;
}

.pulse-alert strong {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.9rem;
}

.danger-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.danger-card {
  padding: 16px 17px;
  border: 1px solid rgba(163, 58, 43, 0.26);
  border-top: 3px solid var(--cinnabar);
  border-radius: 4px;
  background: rgba(163, 58, 43, 0.035);
}

.danger-card__head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: baseline;
  margin-bottom: 9px;
}

.danger-card__head h4 {
  margin: 0;
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 1.12rem;
  font-weight: 500;
}

.danger-card__head span {
  padding: 1px 7px;
  border: 1px solid rgba(163, 58, 43, 0.34);
  border-radius: 999px;
  color: var(--cinnabar);
  font-size: 0.62rem;
}

.danger-card__features {
  margin: 0;
  padding-left: 16px;
  color: var(--ink-soft);
  font-size: 0.79rem;
  line-height: 1.7;
}

.danger-card__features li + li {
  margin-top: 3px;
}

.danger-card__line {
  margin: 10px 0 0;
  padding-top: 9px;
  border-top: 1px dashed rgba(163, 58, 43, 0.18);
  color: var(--ink-soft);
  font-size: 0.77rem;
  line-height: 1.65;
}

.danger-card__line strong {
  display: block;
  margin-bottom: 2px;
  color: var(--ink-faint);
  font-size: 0.66rem;
  font-weight: 400;
}

.danger-card__line--action {
  color: var(--cinnabar);
}

.formula-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.formula-card {
  padding: 15px 16px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: rgba(255, 253, 247, 0.55);
}

.formula-card header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: baseline;
  padding-bottom: 9px;
  border-bottom: 1px dashed var(--line);
}

.formula-card h4 {
  margin: 0;
  color: var(--jade);
  font-family: var(--serif);
  font-size: 1rem;
  font-weight: 500;
}

.formula-card header span {
  color: var(--ink-faint);
  font-size: 0.64rem;
}

.formula-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 18px minmax(0, 1.1fr);
  gap: 6px;
  align-items: baseline;
  padding: 8px 0;
  border-bottom: 1px dotted var(--line);
  font-size: 0.79rem;
}

.formula-row:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.formula-row__pulse {
  color: var(--ink-soft);
}

.formula-row__arrow {
  color: var(--gold);
  text-align: center;
}

.formula-row strong {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-weight: 500;
}

.dynamics-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.dynamics-card {
  padding: 17px 18px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: rgba(255, 253, 247, 0.55);
}

.dynamics-card h4 {
  margin: 0 0 10px;
  color: var(--ink);
  font-family: var(--serif);
  font-size: 1.05rem;
  font-weight: 500;
}

.dynamics-card ul {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.dynamics-card li {
  display: grid;
  grid-template-columns: 74px minmax(0, 1fr);
  gap: 10px;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--line);
}

.dynamics-card li:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.dynamics-card li > span {
  color: var(--cinnabar);
  font-size: 0.76rem;
}

.dynamics-card li p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.78rem;
  line-height: 1.65;
}

.case-grid {
  display: grid;
  gap: 12px;
}

.pulse-case {
  padding: 18px 20px;
  border: 1px solid var(--line);
  border-left: 3px solid var(--gold);
  border-radius: 4px;
  background: rgba(255, 253, 247, 0.55);
}

.pulse-case__head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  align-items: baseline;
  padding-bottom: 10px;
  border-bottom: 1px dashed var(--line);
}

.pulse-case__no {
  color: var(--gold);
  font-family: var(--serif);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
}

.pulse-case__head h4 {
  margin: 0;
  color: var(--ink);
  font-family: var(--serif);
  font-size: 1.12rem;
  font-weight: 500;
}

.pulse-case__facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 24px;
  margin: 12px 0 0;
}

.pulse-case__facts > div {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 8px;
}

.pulse-case__facts dt {
  color: var(--ink-faint);
  font-size: 0.7rem;
  line-height: 1.7;
}

.pulse-case__facts dd {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.8rem;
  line-height: 1.7;
}

.pulse-case__pulse dd {
  color: var(--cinnabar);
  font-family: var(--serif);
}

.pulse-boundary {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: 28px;
  padding: 26px 28px;
  border-left: 4px solid var(--gold);
}

.pulse-boundary__intro {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.pulse-boundary__seal {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
  border: 1px solid var(--gold);
  border-radius: 48% 52% 46% 54%;
  color: var(--gold);
  font-family: var(--serif);
  font-size: 1.3rem;
  transform: rotate(-4deg);
}

.pulse-boundary h3 {
  margin: 4px 0 8px;
  font-family: var(--serif);
  font-size: 1.35rem;
  font-weight: 500;
}

.pulse-boundary p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.82rem;
  line-height: 1.8;
}

.pulse-boundary__body h4 {
  margin: 0 0 9px;
  color: var(--ink);
  font-family: var(--serif);
  font-size: 0.95rem;
  font-weight: 500;
}

.pulse-boundary__body ul {
  margin: 0;
  padding-left: 17px;
  color: var(--ink-soft);
  font-size: 0.78rem;
  line-height: 1.75;
}

.pulse-boundary__body li + li {
  margin-top: 5px;
}

.pulse-foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  padding-top: 4px;
}

.pulse-foot p {
  margin: 0;
  color: var(--ink-faint);
  font-size: 0.78rem;
}

.pulse-foot div {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.pulse-foot .text-link {
  font-size: 0.8rem;
}

@media (max-width: 900px) {
  .pulse-hero {
    grid-template-columns: minmax(0, 1fr);
  }

  .pulse-hero__seal {
    display: none;
  }

  .danger-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .pulse-boundary {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 700px) {
  .pulse-grid,
  .overview-grid,
  .dynamics-grid,
  .pulse-case__facts {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .pulse {
    gap: 18px;
  }

  .pulse-media__item {
    grid-template-columns: 40px minmax(0, 1fr);
    gap: 10px;
    padding: 14px;
  }

  .pulse-media__link {
    grid-column: 1 / -1;
    justify-self: start;
  }

  .pulse-hero {
    padding: 24px 20px;
  }

  .pulse-section {
    padding: 20px 18px;
  }

  .pulse-section__head {
    grid-template-columns: 42px minmax(0, 1fr);
    gap: 10px;
  }

  .pulse-section__no {
    font-size: 1.9rem;
  }

  .pulse-section__head h3 {
    font-size: 1.3rem;
  }

  .pulse-boundary {
    padding: 20px 18px;
  }

  .pulse-boundary__intro {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
