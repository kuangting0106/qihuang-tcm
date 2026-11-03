<script setup lang="ts">
import acupuncture from '@/data/acupuncture.json'

const foundation = acupuncture.foundation
const conditions = acupuncture.conditions
</script>

<template>
  <section class="shixuemin" aria-labelledby="shixuemin-title">
    <div class="shixuemin__head">
      <div>
        <p class="eyebrow">SHI XUEMIN / 醒脑开窍</p>
        <h2 id="shixuemin-title">{{ acupuncture.title }}</h2>
        <p class="shixuemin__sub">{{ acupuncture.subtitle }}</p>
      </div>
      <span class="chip chip--cinnabar">{{ conditions.length }} 项病症</span>
    </div>
    <p class="shixuemin__source">{{ acupuncture.source }}</p>
    <p class="shixuemin__source shixuemin__source--note">{{ acupuncture.proofNote }}</p>
    <p class="shixuemin__intro">{{ acupuncture.intro }}</p>

    <h3 class="shixuemin__group">主穴、辅穴与配穴</h3>
    <div class="shixuemin__foundation">
      <article v-for="item in foundation" :id="item.id" :key="item.id" class="shixuemin__card paper-panel">
        <header>
          <span>{{ item.index }}</span>
          <h4>{{ item.title }}</h4>
        </header>
        <div v-if="item.points" class="shixuemin__points">
          <strong>腧穴组成</strong>
          <p>{{ item.points }}</p>
        </div>
        <ol>
          <li v-for="(step, index) in item.steps" :key="index">{{ step }}</li>
        </ol>
      </article>
    </div>

    <h3 class="shixuemin__group">按病症取穴与下针方法</h3>
    <article v-for="item in conditions" :id="item.id" :key="item.id" class="shixuemin__condition paper-panel">
      <header>
        <span>{{ item.index }}</span>
        <h4>{{ item.title }}</h4>
      </header>
      <div v-if="item.points" class="shixuemin__points">
        <strong>腧穴组成</strong>
        <p>{{ item.points }}</p>
      </div>
      <ol>
        <li v-for="(step, index) in item.steps" :key="index">{{ step }}</li>
      </ol>
    </article>

    <section v-if="acupuncture.timing || acupuncture.closing" class="shixuemin__foot paper-panel">
      <div v-if="acupuncture.timing">
        <span class="eyebrow">COURSE / 疗程</span>
        <p>{{ acupuncture.timing }}</p>
      </div>
      <p v-if="acupuncture.closing" class="shixuemin__closing">{{ acupuncture.closing }}</p>
    </section>
  </section>
</template>

<style scoped>
.shixuemin__head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-end;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line-strong);
}

.shixuemin__head h2 {
  margin: 4px 0 4px;
  font-family: var(--serif);
  font-size: 1.6rem;
  font-weight: 400;
}

.shixuemin__sub {
  color: var(--cinnabar);
  font-size: 0.7rem;
  letter-spacing: 0.06em;
}

.shixuemin__source {
  margin-top: 10px;
  color: var(--ink-faint);
  font-size: 0.64rem;
  line-height: 1.7;
}

.shixuemin__source--note {
  margin-top: 2px;
}

.shixuemin__intro {
  margin-top: 12px;
  color: var(--ink-soft);
  font-size: 0.8rem;
  line-height: 1.9;
}

.shixuemin__group {
  margin: 22px 0 10px;
  font-family: var(--serif);
  font-size: 1.18rem;
  font-weight: 500;
}

.shixuemin__foundation {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.shixuemin__card,
.shixuemin__condition {
  padding: 15px 17px;
  scroll-margin-top: 96px;
}

.shixuemin__condition {
  margin-top: 10px;
}

.shixuemin__card header,
.shixuemin__condition header {
  display: flex;
  gap: 9px;
  align-items: baseline;
}

.shixuemin__card header > span,
.shixuemin__condition header > span {
  flex-shrink: 0;
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.82rem;
}

.shixuemin__card h4,
.shixuemin__condition h4 {
  font-family: var(--serif);
  font-size: 1.04rem;
  font-weight: 500;
}

.shixuemin__points {
  margin-top: 8px;
  padding: 7px 9px;
  border-left: 2px solid var(--jade);
  background: rgba(228, 239, 229, 0.34);
}

.shixuemin__points strong {
  color: var(--jade);
  font-size: 0.58rem;
  font-weight: 400;
  letter-spacing: 0.1em;
}

.shixuemin__points p {
  margin-top: 2px;
  color: var(--ink-soft);
  font-size: 0.72rem;
  line-height: 1.7;
}

.shixuemin__card ol,
.shixuemin__condition ol {
  margin: 8px 0 0;
  padding-left: 1.2em;
  color: var(--ink-soft);
  font-size: 0.7rem;
  line-height: 1.8;
}

.shixuemin__card li + li,
.shixuemin__condition li + li {
  margin-top: 4px;
}

.shixuemin__foot {
  display: grid;
  gap: 8px;
  margin-top: 12px;
  padding: 16px 18px;
}

.shixuemin__foot p {
  color: var(--ink-soft);
  font-size: 0.72rem;
  line-height: 1.8;
}

.shixuemin__closing {
  padding-top: 8px;
  border-top: 1px dashed var(--line);
  color: var(--ink-faint) !important;
  font-size: 0.66rem !important;
}

@media (max-width: 900px) {
  .shixuemin__foundation {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .shixuemin__head {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
