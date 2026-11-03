<script setup lang="ts">
import { RouterLink } from 'vue-router'
import ClinicalNotice from '@/components/ClinicalNotice.vue'
import {
  inspectionIntro,
  inspectionSections,
  inspectionTemplate,
} from '@/data/clinical-methods'
</script>

<template>
  <section class="inspection">
    <ClinicalNotice />

    <header class="inspection-hero">
      <div>
        <p class="eyebrow">{{ inspectionIntro.eyebrow }}</p>
        <h2>{{ inspectionIntro.title }}</h2>
        <p class="inspection-hero__lede">{{ inspectionIntro.lede }}</p>
      </div>
      <span class="inspection-hero__seal" aria-hidden="true">望</span>
    </header>

    <nav class="inspection-nav" aria-label="望诊页内目录">
      <a v-for="section in inspectionSections" :key="section.id" :href="`#${section.id}`">
        {{ section.title }}
      </a>
    </nav>

    <section
      v-for="(section, index) in inspectionSections"
      :id="section.id"
      :key="section.id"
      class="inspection-section"
    >
      <header class="inspection-section__head">
        <span class="inspection-section__no">{{ String(index + 1).padStart(2, '0') }}</span>
        <div>
          <h3>{{ section.title }}</h3>
          <p>{{ section.subtitle }}</p>
        </div>
      </header>

      <div class="finding-list">
        <article v-for="entry in section.entries" :key="entry.id" class="finding">
          <div class="finding__main">
            <span class="finding__sign">{{ entry.finding }}</span>
            <span class="finding__arrow" aria-hidden="true">→</span>
            <strong class="finding__association">{{ entry.association }}</strong>
          </div>
          <p class="finding__note">{{ entry.note }}</p>
          <p v-if="entry.source" class="finding__source">
            {{ entry.source }}
            <RouterLink v-if="entry.href" :to="entry.href">对照原文 →</RouterLink>
          </p>
        </article>
      </div>

      <p v-if="section.note" class="inspection-section__note">{{ section.note }}</p>
    </section>

    <section class="inspection-template paper-panel">
      <div>
        <p class="eyebrow">RECORD / 记录模板</p>
        <h3>望诊记录，先写“看见什么”</h3>
        <p>
          先记录部位、颜色、形态、润燥、温度，再写经验提示。不要在记录栏直接写病名，更不要用一张照片替代面诊。
        </p>
      </div>
      <dl>
        <div v-for="item in inspectionTemplate" :key="item.label">
          <dt>{{ item.label }}</dt>
          <dd>{{ item.hint }}</dd>
        </div>
      </dl>
    </section>

    <footer class="inspection-foot">
      <p>望诊要与问诊、闻诊、切诊互参；单看一处，容易把经验当成结论。</p>
      <div>
        <RouterLink class="text-link" to="/methods/ten-questions">回到看诊十问 →</RouterLink>
        <RouterLink class="text-link" to="/methods/treatment-methods">看治疗法门 →</RouterLink>
      </div>
    </footer>
  </section>
</template>

<style scoped>
.inspection {
  display: grid;
  gap: 24px;
  min-width: 0;
}

.inspection-hero {
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

.inspection-hero::after {
  content: '望';
  position: absolute;
  right: 24px;
  bottom: -46px;
  color: rgba(244, 239, 228, 0.05);
  font-family: var(--serif);
  font-size: 12rem;
  line-height: 1;
  pointer-events: none;
}

.inspection-hero .eyebrow {
  color: #d8bc87;
}

.inspection-hero h2 {
  margin: 10px 0 14px;
  color: #fbf7ee;
  font-family: var(--serif);
  font-size: clamp(1.9rem, 3.6vw, 2.8rem);
  font-weight: 500;
  letter-spacing: 0.05em;
}

.inspection-hero__lede {
  max-width: 66ch;
  margin: 0;
  color: rgba(244, 239, 228, 0.82);
  font-size: 0.94rem;
  line-height: 1.9;
}

.inspection-hero__seal {
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

.inspection-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 2px 0;
}

.inspection-nav a {
  padding: 6px 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--ink-soft);
  font-size: 0.75rem;
  text-decoration: none;
  transition: border-color 0.18s ease, color 0.18s ease;
}

.inspection-nav a:hover {
  border-color: var(--jade);
  color: var(--jade);
}

.inspection-section {
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

.inspection-section__head {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);
}

.inspection-section__no {
  color: rgba(176, 138, 74, 0.55);
  font-family: var(--serif);
  font-size: 2.2rem;
  line-height: 0.9;
}

.inspection-section__head h3 {
  margin: 2px 0 5px;
  font-family: var(--serif);
  font-size: 1.5rem;
  font-weight: 500;
}

.inspection-section__head p {
  margin: 0;
  color: var(--ink-faint);
  font-size: 0.82rem;
  line-height: 1.7;
}

.finding-list {
  display: grid;
  gap: 10px;
}

.finding {
  min-width: 0;
  padding: 15px 16px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: rgba(255, 253, 247, 0.55);
}

.finding__main {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: baseline;
}

.finding__sign {
  color: var(--ink);
  font-family: var(--serif);
  font-size: 1.02rem;
}

.finding__arrow {
  color: var(--gold);
  font-size: 0.82rem;
}

.finding__association {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 1rem;
  font-weight: 500;
}

.finding__note {
  margin: 8px 0 0;
  color: var(--ink-soft);
  font-size: 0.82rem;
  line-height: 1.75;
}

.finding__source {
  margin: 8px 0 0;
  padding-top: 8px;
  border-top: 1px dashed var(--line);
  color: var(--ink-faint);
  font-size: 0.72rem;
  line-height: 1.6;
}

.finding__source a {
  margin-left: 6px;
  color: var(--jade);
  text-decoration: none;
}

.finding__source a:hover {
  color: var(--cinnabar);
}

.inspection-section__note {
  margin: 0;
  padding: 10px 12px;
  border-left: 2px solid var(--gold);
  background: rgba(176, 138, 74, 0.06);
  color: var(--ink-soft);
  font-size: 0.78rem;
  line-height: 1.7;
}

.inspection-template {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: 30px;
  padding: 24px 26px;
}

.inspection-template h3 {
  margin: 5px 0 10px;
  font-family: var(--serif);
  font-size: 1.3rem;
  font-weight: 500;
}

.inspection-template p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.84rem;
  line-height: 1.8;
}

.inspection-template dl {
  display: grid;
  gap: 9px;
  margin: 0;
}

.inspection-template dl > div {
  display: grid;
  grid-template-columns: 68px minmax(0, 1fr);
  gap: 12px;
  padding-bottom: 9px;
  border-bottom: 1px dashed var(--line);
}

.inspection-template dl > div:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.inspection-template dt {
  color: var(--jade);
  font-family: var(--serif);
  font-size: 0.86rem;
}

.inspection-template dd {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.8rem;
  line-height: 1.65;
}

.inspection-foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  padding-top: 4px;
}

.inspection-foot p {
  margin: 0;
  color: var(--ink-faint);
  font-size: 0.78rem;
}

.inspection-foot div {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.inspection-foot .text-link {
  font-size: 0.8rem;
}

@media (max-width: 900px) {
  .inspection-hero {
    grid-template-columns: minmax(0, 1fr);
  }

  .inspection-hero__seal {
    display: none;
  }

  .inspection-template {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .inspection {
    gap: 18px;
  }

  .inspection-hero {
    padding: 24px 20px;
  }

  .inspection-section {
    padding: 20px 18px;
  }

  .inspection-section__head {
    grid-template-columns: 42px minmax(0, 1fr);
    gap: 10px;
  }

  .inspection-section__no {
    font-size: 1.9rem;
  }

  .inspection-section__head h3 {
    font-size: 1.3rem;
  }

  .inspection-template {
    padding: 20px 18px;
  }
}
</style>
