<script setup lang="ts">
import acupuncture from '@/data/acupuncture.json'

const foundation = acupuncture.foundation
const conditions = acupuncture.conditions
</script>

<template>
  <div class="acu-page">
    <section class="acu-warning" role="note" aria-label="安全警告">
      <span class="acu-warning__seal" aria-hidden="true">慎</span>
      <div>
        <strong>{{ acupuncture.warning }}</strong>
        <p>{{ acupuncture.warningNote }}</p>
      </div>
    </section>

    <p class="acu-source">{{ acupuncture.source }}</p>
    <p class="acu-source acu-source--note">{{ acupuncture.proofNote }}</p>

    <div class="acu-layout">
      <div class="acu-main">
        <section class="acu-intro paper-panel">
          <span class="eyebrow">METHOD / 针法</span>
          <h2>{{ acupuncture.title }}</h2>
          <p class="acu-intro__sub">{{ acupuncture.subtitle }}</p>
          <p>{{ acupuncture.intro }}</p>
        </section>

        <section class="acu-block" aria-labelledby="acu-foundation-title">
          <div class="acu-block__head">
            <div>
              <p class="eyebrow">BASE PRESCRIPTION / 基础穴方</p>
              <h2 id="acu-foundation-title">主穴、辅穴与配穴</h2>
            </div>
            <span class="chip chip--gold">{{ foundation.length }} 组</span>
          </div>

          <div class="acu-foundation-grid">
            <article v-for="item in foundation" :id="item.id" :key="item.id" class="acu-card paper-panel">
              <header class="acu-card__head">
                <span class="acu-card__index">{{ item.index }}</span>
                <h3>{{ item.title }}</h3>
              </header>
              <div v-if="item.points" class="acu-points">
                <span>腧穴组成</span>
                <p>{{ item.points }}</p>
              </div>
              <ol class="acu-steps">
                <li v-for="(step, index) in item.steps" :key="index">{{ step }}</li>
              </ol>
            </article>
          </div>
        </section>

        <section class="acu-block" aria-labelledby="acu-conditions-title">
          <div class="acu-block__head">
            <div>
              <p class="eyebrow">CONDITIONS / 病症分项</p>
              <h2 id="acu-conditions-title">按病症取穴与下针方法</h2>
            </div>
            <span class="chip chip--cinnabar">{{ conditions.length }} 项</span>
          </div>

          <article v-for="item in conditions" :id="item.id" :key="item.id" class="acu-condition paper-panel">
            <header class="acu-condition__head">
              <span class="acu-condition__index">{{ item.index }}</span>
              <h3>{{ item.title }}</h3>
            </header>
            <div v-if="item.points" class="acu-points">
              <span>腧穴组成</span>
              <p>{{ item.points }}</p>
            </div>
            <ol class="acu-steps">
              <li v-for="(step, index) in item.steps" :key="index">{{ step }}</li>
            </ol>
          </article>
        </section>

        <section v-if="acupuncture.timing || acupuncture.closing" class="acu-foot paper-panel">
          <div v-if="acupuncture.timing">
            <span class="eyebrow">COURSE / 疗程</span>
            <p>{{ acupuncture.timing }}</p>
          </div>
          <p v-if="acupuncture.closing" class="acu-foot__closing">{{ acupuncture.closing }}</p>
        </section>
      </div>

      <aside class="acu-toc paper-panel" aria-label="本页目录">
        <span class="eyebrow">CONTENTS</span>
        <h3>本页目录</h3>
        <p class="acu-toc__group">基础穴方</p>
        <ol>
          <li v-for="item in foundation" :key="item.id">
            <a :href="`#${item.id}`">{{ item.title }}</a>
          </li>
        </ol>
        <p class="acu-toc__group">病症分项</p>
        <ol>
          <li v-for="item in conditions" :key="item.id">
            <a :href="`#${item.id}`">{{ item.title }}</a>
          </li>
        </ol>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.acu-page {
  padding-top: 26px;
}

.acu-warning {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 18px 20px;
  border: 1px solid color-mix(in srgb, var(--cinnabar) 62%, var(--line));
  border-left: 5px solid var(--cinnabar);
  border-radius: 10px;
  background:
    linear-gradient(100deg, rgba(190, 78, 58, 0.1), rgba(255, 250, 242, 0.7)),
    rgba(255, 252, 245, 0.8);
}

.acu-warning__seal {
  flex-shrink: 0;
  display: grid;
  place-content: center;
  width: 46px;
  height: 46px;
  border: 1px solid var(--cinnabar);
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 1.5rem;
}

.acu-warning strong {
  display: block;
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 1.08rem;
  font-weight: 500;
  letter-spacing: 0.04em;
}

.acu-warning p {
  margin-top: 5px;
  color: var(--ink-soft);
  font-size: 0.76rem;
  line-height: 1.75;
}

.acu-source {
  margin: 10px 0 0;
  color: var(--ink-faint);
  font-size: 0.64rem;
  line-height: 1.7;
}

.acu-source--note {
  margin-top: 2px;
}

.acu-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 250px;
  gap: 22px;
  align-items: start;
  margin-top: 20px;
}

.acu-main {
  display: grid;
  gap: 24px;
  min-width: 0;
}

.acu-intro {
  padding: 24px 26px;
}

.acu-intro h2 {
  margin: 6px 0 4px;
  font-family: var(--serif);
  font-size: 2rem;
  font-weight: 400;
  letter-spacing: 0.06em;
}

.acu-intro__sub {
  color: var(--cinnabar);
  font-size: 0.74rem;
  letter-spacing: 0.08em;
}

.acu-intro > p:last-child {
  margin-top: 12px;
  color: var(--ink-soft);
  font-size: 0.82rem;
  line-height: 1.9;
}

.acu-block__head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-end;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line-strong);
}

.acu-block__head h2 {
  margin-top: 3px;
  font-family: var(--serif);
  font-size: 1.5rem;
  font-weight: 400;
  letter-spacing: 0.04em;
}

.acu-foundation-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.acu-card {
  padding: 16px 18px;
}

.acu-card__head,
.acu-condition__head {
  display: flex;
  gap: 10px;
  align-items: baseline;
}

.acu-card__index,
.acu-condition__index {
  flex-shrink: 0;
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.82rem;
}

.acu-card h3,
.acu-condition h3 {
  font-family: var(--serif);
  font-size: 1.18rem;
  font-weight: 500;
  letter-spacing: 0.03em;
}

.acu-points {
  margin-top: 10px;
  padding: 9px 11px;
  border-left: 2px solid var(--jade);
  background: rgba(228, 239, 229, 0.36);
}

.acu-points span {
  color: var(--jade);
  font-size: 0.62rem;
  letter-spacing: 0.12em;
}

.acu-points p {
  margin-top: 3px;
  color: var(--ink-soft);
  font-size: 0.76rem;
  line-height: 1.75;
}

.acu-steps {
  margin: 10px 0 0;
  padding-left: 1.2em;
  color: var(--ink-soft);
  font-size: 0.76rem;
  line-height: 1.85;
}

.acu-steps li + li {
  margin-top: 4px;
}

.acu-condition {
  margin-top: 12px;
  padding: 18px 20px;
  scroll-margin-top: 96px;
}

.acu-condition__index {
  color: var(--cinnabar);
  font-size: 0.9rem;
}

.acu-condition h3 {
  font-size: 1.32rem;
}

.acu-foot {
  display: grid;
  gap: 10px;
  padding: 18px 20px;
}

.acu-foot p {
  color: var(--ink-soft);
  font-size: 0.78rem;
  line-height: 1.85;
}

.acu-foot__closing {
  padding-top: 9px;
  border-top: 1px dashed var(--line);
  color: var(--ink-faint);
  font-size: 0.68rem !important;
}

.acu-toc {
  position: sticky;
  top: 92px;
  padding: 18px;
}

.acu-toc h3 {
  margin: 4px 0 10px;
  font-family: var(--serif);
  font-size: 1.1rem;
  font-weight: 400;
}

.acu-toc__group {
  margin: 12px 0 5px;
  color: var(--ink-faint);
  font-size: 0.62rem;
  letter-spacing: 0.12em;
}

.acu-toc ol {
  display: grid;
  gap: 3px;
  margin: 0;
  padding-left: 1.15em;
  color: var(--ink-soft);
  font-size: 0.68rem;
  line-height: 1.6;
}

.acu-toc a {
  color: inherit;
  text-decoration: none;
}

.acu-toc a:hover {
  color: var(--cinnabar);
}

@media (max-width: 960px) {
  .acu-layout {
    grid-template-columns: 1fr;
  }

  .acu-toc {
    position: static;
    order: -1;
  }

  .acu-foundation-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .acu-warning {
    padding: 14px;
  }

  .acu-intro,
  .acu-condition {
    padding: 16px;
  }
}
</style>
