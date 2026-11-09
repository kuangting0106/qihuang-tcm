<script setup lang="ts">
import { RouterLink } from 'vue-router'
import {
  liKeBoundaries,
  liKeOutlineIntro,
  liKeReadingSteps,
  liKeStages,
  liKeStudyGates,
} from '@/data/li-ke-outline'
import { pulseMediaHref } from '@/data/pulse-media'
</script>

<template>
  <div class="page like-page">
    <div class="container">
      <header class="like-hero">
        <div class="like-hero__copy">
          <p class="eyebrow">{{ liKeOutlineIntro.eyebrow }}</p>
          <h1>{{ liKeOutlineIntro.title }}</h1>
          <p class="like-hero__lead">{{ liKeOutlineIntro.lede }}</p>
          <div class="like-hero__meta">
            <span v-for="item in liKeOutlineIntro.meta" :key="item" class="chip">{{ item }}</span>
          </div>
        </div>
        <div class="like-hero__mark" aria-hidden="true">
          <span class="like-hero__seal">李</span>
          <span class="like-hero__caption">读书地图<br />非方书</span>
        </div>
      </header>

      <p class="like-source-note">{{ liKeOutlineIntro.note }}</p>

      <nav class="like-nav" aria-label="李可医书经验提纲页内目录">
        <a v-for="stage in liKeStages" :key="stage.id" :href="`#${stage.id}`">
          <span>{{ stage.order }}</span>
          {{ stage.title }}
          <small>{{ stage.subtitle }}</small>
        </a>
        <a href="#reading">
          <span>读</span>
          怎么读
          <small>顺序与三关</small>
        </a>
        <a href="#boundary">
          <span>界</span>
          边界
          <small>先读再信</small>
        </a>
      </nav>

      <section v-for="stage in liKeStages" :id="stage.id" :key="stage.id" class="like-stage">
        <header class="like-stage__head">
          <span class="like-stage__order">{{ stage.order }}</span>
          <div>
            <p class="eyebrow">STAGE {{ stage.order }} / {{ stage.title }}</p>
            <h2>{{ stage.title }} · {{ stage.subtitle }}</h2>
            <p>{{ stage.description }}</p>
          </div>
        </header>

        <div class="module-grid" :class="{ 'module-grid--single': stage.modules.length === 1 }">
          <article v-for="module in stage.modules" :key="module.id" class="module-card">
            <header class="module-card__head">
              <span class="module-card__number">{{ module.number }}</span>
              <div>
                <h3>{{ module.title }}</h3>
                <p>{{ module.kind }}</p>
              </div>
            </header>

            <p class="module-card__source">{{ module.source }}</p>
            <p class="module-card__summary">{{ module.summary }}</p>

            <ul class="module-card__points">
              <li v-for="point in module.points" :key="point">{{ point }}</li>
            </ul>

            <p v-if="module.caution" class="module-card__caution">{{ module.caution }}</p>

            <footer class="module-card__foot">
              <div class="module-card__tags">
                <span v-for="tag in module.tags" :key="tag">{{ tag }}</span>
              </div>
              <div class="module-card__links">
                <RouterLink v-if="module.href" class="module-card__link" :to="module.href">
                  {{ module.hrefLabel }} →
                </RouterLink>
                <a
                  v-if="module.attachment"
                  class="module-card__link module-card__link--media"
                  :href="pulseMediaHref(module.attachment.file)"
                  target="_blank"
                  rel="noopener"
                >
                  {{ module.attachment.label }} ↗
                </a>
              </div>
            </footer>
          </article>
        </div>
      </section>

      <section id="reading" class="reading-section">
        <div class="reading-section__aside">
          <p class="eyebrow">READING ORDER / 读法</p>
          <h2>先立框架，<br />再入方药。</h2>
          <p>
            这 12 篇不是并列的“资料包”。先读什么、后读什么，决定了你是在建立辨证思维，
            还是在背零散方名。
          </p>
          <div class="reading-section__seal" aria-hidden="true">读</div>
        </div>

        <ol class="reading-steps">
          <li v-for="step in liKeReadingSteps" :key="step.number">
            <span class="reading-steps__number">{{ step.number }}</span>
            <div>
              <h3>{{ step.title }}</h3>
              <p>{{ step.detail }}</p>
              <span class="reading-steps__modules">{{ step.modules }}</span>
            </div>
          </li>
        </ol>
      </section>

      <section class="gates-section">
        <header class="gates-section__head">
          <div>
            <p class="eyebrow">THREE GATES / 三关</p>
            <h2>李可说：进中医之门，要闯三关</h2>
          </div>
          <p>
            明理关、剂量关、毒药关。整理稿把“明理”放在第一关：先换思维，再谈剂量与用药。
          </p>
        </header>

        <div class="gates-grid">
          <article v-for="(gate, index) in liKeStudyGates" :key="gate.name" class="gate-card">
            <span class="gate-card__no">0{{ index + 1 }}</span>
            <h3>{{ gate.name }}</h3>
            <p>{{ gate.detail }}</p>
          </article>
        </div>
      </section>

      <section id="boundary" class="boundary-section">
        <header class="boundary-section__head">
          <span class="boundary-section__seal" aria-hidden="true">界</span>
          <div>
            <p class="eyebrow">BOUNDARY / 诚实边界</p>
            <h2>先知道它不能做什么</h2>
            <p>
              这份提纲是学习索引，不是诊断标准、处方集或急症处理手册。以下四条，比任何一条方剂都更重要。
            </p>
          </div>
        </header>

        <div class="boundary-grid">
          <article v-for="item in liKeBoundaries" :key="item.title">
            <h3>{{ item.title }}</h3>
            <p>{{ item.detail }}</p>
          </article>
        </div>
      </section>

      <footer class="like-foot">
        <p>
          继续读：
          <RouterLink to="/lectures">名家讲堂</RouterLink>
          <span>·</span>
          <RouterLink to="/methods/pulse">脉诊篇</RouterLink>
          <span>·</span>
          <RouterLink to="/methods">治疗法门篇</RouterLink>
          <span>·</span>
          <RouterLink to="/formulas">方剂</RouterLink>
        </p>
        <p class="like-foot__note">原稿为 OCR/蒸馏整理；引用请回《李可老中医急危重症疑难病经验专辑》《李可医论专辑》《李可六经辨证学》等原书核对。</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.like-page {
  padding-top: 34px;
}

.like-hero {
  display: flex;
  justify-content: space-between;
  gap: 48px;
  align-items: center;
  padding: 18px 0 30px;
  border-bottom: 1px solid var(--line-strong);
}

.like-hero__copy {
  max-width: 880px;
}

.like-hero h1 {
  margin: 6px 0 14px;
  font-size: clamp(2.7rem, 6vw, 5rem);
  letter-spacing: 0.06em;
}

.like-hero__lead {
  max-width: 860px;
  color: var(--ink-soft);
  font-size: 0.98rem;
  line-height: 1.95;
}

.like-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 18px;
}

.like-hero__mark {
  width: 150px;
  flex-shrink: 0;
  display: grid;
  justify-items: center;
  gap: 12px;
}

.like-hero__seal {
  width: 118px;
  height: 118px;
  display: grid;
  place-items: center;
  border-radius: 48% 52% 46% 54%;
  background: var(--cinnabar);
  color: #f8efe3;
  font-family: var(--serif);
  font-size: 3rem;
  transform: rotate(-4deg);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.24);
}

.like-hero__caption {
  color: var(--ink-faint);
  font-family: var(--serif);
  font-size: 0.78rem;
  line-height: 1.6;
  letter-spacing: 0.18em;
  text-align: center;
}

.like-source-note {
  max-width: 960px;
  margin: 14px 0 0;
  color: var(--ink-faint);
  font-size: 0.78rem;
  line-height: 1.85;
}

.like-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 22px 0 8px;
}

.like-nav a {
  display: inline-grid;
  grid-template-columns: 24px auto;
  gap: 0 7px;
  align-items: center;
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 252, 245, 0.46);
  color: var(--ink-soft);
  font-size: 0.78rem;
  transition: border-color 0.16s ease, background 0.16s ease, color 0.16s ease;
}

.like-nav a:hover {
  border-color: var(--cinnabar-2);
  background: var(--cinnabar-pale);
  color: var(--cinnabar);
}

.like-nav a span {
  grid-row: span 2;
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 1rem;
  text-align: center;
}

.like-nav small {
  color: var(--ink-faint);
  font-size: 0.64rem;
  font-weight: 400;
  letter-spacing: 0;
}

.like-stage {
  padding: 42px 0 12px;
}

.like-stage + .like-stage {
  border-top: 1px solid var(--line);
}

.like-stage__head {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr);
  gap: 18px;
  align-items: start;
  margin-bottom: 20px;
}

.like-stage__order {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 3.1rem;
  line-height: 0.9;
  opacity: 0.9;
}

.like-stage__head h2 {
  margin: 3px 0 8px;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
}

.like-stage__head p:last-child {
  max-width: 780px;
  color: var(--ink-soft);
  font-size: 0.84rem;
  line-height: 1.9;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.module-grid--single {
  grid-template-columns: minmax(0, 1fr);
}

.module-card {
  display: flex;
  flex-direction: column;
  padding: 20px 20px 16px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background:
    linear-gradient(rgba(255, 252, 245, 0.76), rgba(255, 252, 245, 0.58)),
    repeating-linear-gradient(0deg, transparent 0 31px, rgba(32, 37, 34, 0.035) 31px 32px);
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.module-card:hover {
  transform: translateY(-2px);
  border-color: var(--line-strong);
  box-shadow: var(--shadow-soft);
}

.module-card__head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.module-card__number {
  min-width: 38px;
  color: var(--jade);
  font-family: var(--serif);
  font-size: 1.35rem;
  line-height: 1.2;
}

.module-card__head h3 {
  margin: 0;
  font-size: 1.18rem;
}

.module-card__head p {
  margin-top: 2px;
  color: var(--cinnabar);
  font-size: 0.68rem;
  letter-spacing: 0.12em;
}

.module-card__source {
  margin-top: 10px;
  padding-left: 50px;
  color: var(--ink-faint);
  font-size: 0.68rem;
  line-height: 1.65;
}

.module-card__summary {
  margin-top: 12px;
  color: var(--ink);
  font-size: 0.88rem;
  line-height: 1.8;
}

.module-card__points {
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 7px;
}

.module-card__points li {
  position: relative;
  padding-left: 14px;
  color: var(--ink-soft);
  font-size: 0.8rem;
  line-height: 1.75;
}

.module-card__points li::before {
  content: "◆";
  position: absolute;
  left: 0;
  top: 0;
  color: var(--gold);
  font-size: 0.52rem;
  line-height: 1.95;
}

.module-card__caution {
  margin-top: 12px;
  padding: 9px 11px;
  border-left: 2px solid var(--cinnabar-2);
  background: rgba(241, 221, 214, 0.5);
  color: var(--cinnabar);
  font-size: 0.74rem;
  line-height: 1.7;
}

.module-card__foot {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  margin-top: auto;
  padding-top: 14px;
}

.module-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.module-card__tags span {
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--paper-2);
  color: var(--ink-faint);
  font-size: 0.64rem;
}

.module-card__links {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
  flex-shrink: 0;
}

.module-card__link {
  flex-shrink: 0;
  color: var(--cinnabar);
  font-size: 0.76rem;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.module-card__link--media {
  color: var(--jade);
}

.module-card__link:hover {
  color: var(--ink);
}

.reading-section {
  display: grid;
  grid-template-columns: minmax(0, 0.72fr) minmax(0, 1.28fr);
  gap: 44px;
  align-items: start;
  margin-top: 50px;
  padding: 36px 0 42px;
  border-top: 1px solid var(--line-strong);
}

.reading-section__aside {
  position: sticky;
  top: calc(var(--header-h) + 24px);
}

.reading-section__aside h2 {
  margin: 4px 0 12px;
  font-size: clamp(1.8rem, 3vw, 2.6rem);
}

.reading-section__aside p:last-of-type {
  color: var(--ink-soft);
  font-size: 0.85rem;
  line-height: 1.9;
}

.reading-section__seal {
  width: 66px;
  height: 66px;
  display: grid;
  place-items: center;
  margin-top: 20px;
  border-radius: 48% 52% 46% 54%;
  background: var(--jade);
  color: var(--paper);
  font-family: var(--serif);
  font-size: 1.7rem;
  transform: rotate(-5deg);
}

.reading-steps {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0;
}

.reading-steps li {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 14px;
  padding: 16px 0 18px;
  border-top: 1px dashed var(--line);
}

.reading-steps li:first-child {
  border-top: 0;
  padding-top: 0;
}

.reading-steps__number {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 1.25rem;
  line-height: 1.3;
}

.reading-steps h3 {
  font-size: 1.06rem;
}

.reading-steps p {
  margin-top: 4px;
  color: var(--ink-soft);
  font-size: 0.82rem;
  line-height: 1.8;
}

.reading-steps__modules {
  display: inline-block;
  margin-top: 7px;
  color: var(--jade);
  font-family: var(--serif);
  font-size: 0.74rem;
  letter-spacing: 0.08em;
}

.gates-section {
  padding: 30px 0 38px;
  border-top: 1px solid var(--line-strong);
}

.gates-section__head {
  display: flex;
  justify-content: space-between;
  gap: 36px;
  align-items: flex-end;
  margin-bottom: 18px;
}

.gates-section__head h2 {
  margin-top: 4px;
  font-size: clamp(1.5rem, 3vw, 2.1rem);
}

.gates-section__head > p {
  max-width: 420px;
  color: var(--ink-soft);
  font-size: 0.8rem;
  line-height: 1.8;
}

.gates-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.gate-card {
  position: relative;
  overflow: hidden;
  padding: 18px 18px 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255, 252, 245, 0.58);
}

.gate-card__no {
  position: absolute;
  right: 10px;
  top: -8px;
  color: var(--gold);
  font-family: var(--serif);
  font-size: 3.2rem;
  opacity: 0.18;
}

.gate-card h3 {
  position: relative;
  font-size: 1.08rem;
}

.gate-card p {
  position: relative;
  margin-top: 7px;
  color: var(--ink-soft);
  font-size: 0.78rem;
  line-height: 1.8;
}

.boundary-section {
  margin-top: 26px;
  padding: 26px 28px 24px;
  border: 1px solid rgba(163, 58, 43, 0.26);
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(241, 221, 214, 0.58), rgba(255, 252, 245, 0.5));
}

.boundary-section__head {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.boundary-section__seal {
  width: 58px;
  height: 58px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 48% 52% 46% 54%;
  background: var(--cinnabar);
  color: #f8efe3;
  font-family: var(--serif);
  font-size: 1.5rem;
  transform: rotate(-4deg);
}

.boundary-section__head h2 {
  margin: 3px 0 6px;
  font-size: clamp(1.5rem, 3vw, 2rem);
}

.boundary-section__head p:last-child {
  max-width: 780px;
  color: var(--ink-soft);
  font-size: 0.82rem;
  line-height: 1.85;
}

.boundary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 28px;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid rgba(163, 58, 43, 0.2);
}

.boundary-grid h3 {
  font-size: 0.98rem;
  color: var(--cinnabar);
}

.boundary-grid p {
  margin-top: 4px;
  color: var(--ink-soft);
  font-size: 0.78rem;
  line-height: 1.8;
}

.like-foot {
  margin-top: 30px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
  color: var(--ink-soft);
  font-size: 0.8rem;
  line-height: 1.9;
}

.like-foot a {
  color: var(--cinnabar);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.like-foot a:hover {
  color: var(--ink);
}

.like-foot span {
  margin: 0 6px;
  color: var(--ink-faint);
}

.like-foot__note {
  margin-top: 6px;
  color: var(--ink-faint);
  font-size: 0.7rem;
}

@media (max-width: 960px) {
  .module-grid {
    grid-template-columns: 1fr;
  }

  .reading-section {
    grid-template-columns: 1fr;
    gap: 26px;
  }

  .reading-section__aside {
    position: static;
  }

  .reading-section__seal {
    display: none;
  }

  .gates-section__head {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}

@media (max-width: 700px) {
  .like-hero {
    align-items: flex-start;
    gap: 18px;
  }

  .like-hero__mark {
    width: 64px;
  }

  .like-hero__seal {
    width: 62px;
    height: 62px;
    font-size: 1.5rem;
  }

  .like-hero__caption {
    display: none;
  }

  .like-stage__head {
    grid-template-columns: 48px minmax(0, 1fr);
    gap: 10px;
  }

  .like-stage__order {
    font-size: 2.1rem;
  }

  .module-card__source {
    padding-left: 0;
  }

  .module-card__foot {
    flex-direction: column;
    align-items: flex-start;
  }

  .module-card__links {
    align-items: flex-start;
  }

  .gates-grid,
  .boundary-grid {
    grid-template-columns: 1fr;
  }

  .boundary-section {
    padding: 20px 18px;
  }

  .boundary-section__head {
    gap: 11px;
  }

  .boundary-section__seal {
    width: 44px;
    height: 44px;
    font-size: 1.15rem;
  }
}
</style>
