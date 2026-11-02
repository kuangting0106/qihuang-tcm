<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useTcmData } from '@/composables/useTcmData'
import { caseTopics, methodTopics } from '@/data/topics'
import { exercises } from '@/data/exercises'

const { data } = useTcmData()

const counts = computed(() => ({
  herbs: data.value?.herbs.length ?? 0,
  formulas: data.value?.formulas.length ?? 0,
  points: data.value?.acupoints.length ?? 0,
  meridians: data.value?.meridians.length ?? 0,
  processing: data.value?.herbs.filter((h) => h.processing).length ?? 0,
}))

const modules = computed(() => [
  {
    to: '/meridians/lung',
    kicker: 'MERIDIAN / 经络',
    title: '经络图',
    desc: `在可旋转的人体上查看 ${counts.value.points} 个常用重点穴，按经络、区域、穴位类型筛选。`,
    stat: `${counts.value.points} 个穴位 · ${counts.value.meridians} 条经络`,
    tone: 'jade',
  },
  {
    to: '/herbs',
    kicker: 'MATERIA MEDICA / 本草',
    title: '本草',
    desc: '性味、归经、功效、主治与配伍关系，每一个字段都能点开看出处。',
    stat: `${counts.value.herbs} 味样例药材`,
    tone: 'gold',
  },
  {
    to: '/formulas',
    kicker: 'FORMULA / 方剂',
    title: '方剂',
    desc: '原文、症状、君臣佐使、加减与关系图谱双轨呈现，药材可跳转本草。',
    stat: `${counts.value.formulas} 首伤寒方`,
    tone: 'cinnabar',
  },
])
</script>

<template>
  <div class="home">
    <section class="hero container">
      <div class="hero__copy">
        <p class="eyebrow">TCM KNOWLEDGE ATLAS · 学习原型</p>
        <h1>岐黄图鉴</h1>
        <p class="hero__lead">
          把经络、本草、方剂放在同一张可点击的知识地图上。
          <span>先看原文，再看方解；每一条中医内容，都能找到出处。</span>
          <span class="hero__plain">小白也能看懂中医</span>
        </p>
        <div class="hero__actions">
          <RouterLink class="btn btn--primary" to="/meridians/lung">进入经络图</RouterLink>
          <RouterLink class="btn" to="/formulas/guizhi-tang">从桂枝汤开始</RouterLink>
        </div>

        <nav class="hero-index" aria-label="首页主导航">
          <span class="hero-index__label">图鉴目录</span>
          <RouterLink to="/methods">治疗法门篇</RouterLink>
          <RouterLink to="/meridians/lung">经络图</RouterLink>
          <RouterLink to="/herbs">本草</RouterLink>
          <RouterLink to="/formulas">方剂</RouterLink>
          <RouterLink to="/exercises">古法锻炼</RouterLink>
          <RouterLink to="/classics">医家经典古籍</RouterLink>
          <RouterLink to="/cases">医案</RouterLink>
        </nav>

        <dl class="hero__stats">
          <div><dt>{{ counts.points }}</dt><dd>常用重点穴</dd></div>
          <div><dt>{{ counts.herbs }}</dt><dd>样例药材</dd></div>
          <div><dt>{{ counts.formulas }}</dt><dd>伤寒方</dd></div>
          <div><dt>100%</dt><dd>内容带出处</dd></div>
        </dl>
      </div>
    </section>

    <section class="module-section container">
      <div class="section-head">
        <div>
          <p class="eyebrow">THREE ENTRANCES</p>
          <h2>从三个入口进入</h2>
        </div>
        <p>第一版用样例数据跑通闭环：可点击、可旋转、可跳转、可查出处。</p>
      </div>

      <div class="module-grid">
        <RouterLink
          v-for="(m, index) in modules"
          :key="m.to"
          :to="m.to"
          class="module-card"
          :class="`module-card--${m.tone}`"
          :style="{ '--delay': `${index * 80}ms` }"
        >
          <div class="module-card__top">
            <span class="module-card__kicker">{{ m.kicker }}</span>
            <span class="module-card__arrow" aria-hidden="true">↗</span>
          </div>
          <h3>{{ m.title }}</h3>
          <p>{{ m.desc }}</p>
          <div class="module-card__foot">
            <span>{{ m.stat }}</span>
            <span>进入</span>
          </div>
        </RouterLink>
      </div>

      <div class="extra-sections">
        <RouterLink to="/methods" class="extra-card extra-card--methods">
          <div>
            <span class="eyebrow">METHOD / 治疗法门篇</span>
            <h3>治疗法门篇</h3>
            <p>看诊十问、脉诊、望诊、听诊、治疗法门、治癌法门、治病先后主次、灸、针。</p>
          </div>
          <span class="extra-card__count">{{ methodTopics.length }} 个栏目 →</span>
        </RouterLink>
        <RouterLink to="/cases" class="extra-card extra-card--cases">
          <div>
            <span class="eyebrow">CASE / 医案</span>
            <h3>医案</h3>
            <p>按病类整理医案：风湿、表证、肠胃、肺篇、心胸、腹篇、积饮、消渴、水病、痢、脓疡、孕妇科、男科、精神。</p>
          </div>
          <span class="extra-card__count">{{ caseTopics.length }} 个栏目 →</span>
        </RouterLink>
        <RouterLink to="/exercises" class="extra-card extra-card--exercises">
          <div>
            <span class="eyebrow">PRACTICE / 古法锻炼</span>
            <h3>古法锻炼</h3>
            <p>金刚功、长寿功、五禽戏、易筋经、八段锦等；只收藏可核来源的招式视频或图片。</p>
          </div>
          <span class="extra-card__count">{{ exercises.length }} 套功法 →</span>
        </RouterLink>
        <RouterLink to="/classics" class="extra-card extra-card--classics">
          <div>
            <span class="eyebrow">CLASSICS / 医家经典古籍</span>
            <h3>医家经典古籍</h3>
            <p>《伤寒论》《灵枢》《难经》《神农本草经》《本草纲目》等已引用古籍与条文，原文与条号分开登记。</p>
          </div>
          <span class="extra-card__count">按书查阅 →</span>
        </RouterLink>
      </div>
    </section>

    <section class="collections container">
      <div class="section-head">
        <div>
          <p class="eyebrow">COLLECTIONS / 新栏目</p>
          <h2>名家讲堂与药材炮制</h2>
        </div>
        <p>视频课件与炮制方法都按“来源先于内容”收录；未核来源的条目先标待收录。</p>
      </div>

      <div class="collection-grid">
        <RouterLink to="/lectures" class="collection-card collection-card--lectures">
          <div class="collection-card__top">
            <span class="collection-card__kicker">LECTURE HALL / 名家讲堂</span>
            <span class="collection-card__status">视频待收录</span>
          </div>
          <h3>名家讲堂</h3>
          <p>
            著名医家的视频课件，以医家与典籍为线索，收集后世、当代名家的讲授版本。
            历史医家没有影像，页面只写“某某讲授版本”，不把讲授者写成原作者。
          </p>
          <ul>
            <li>伤寒论 · 金匮要略</li>
            <li>傅青主女科</li>
            <li>本草纲目 · 千金方</li>
          </ul>
          <div class="collection-card__foot">
            <span>进入讲堂</span>
            <span aria-hidden="true">→</span>
          </div>
          <span class="collection-card__seal" aria-hidden="true">讲</span>
        </RouterLink>

        <RouterLink to="/processing" class="collection-card collection-card--processing">
          <div class="collection-card__top">
            <span class="collection-card__kicker">PROCESSING / 药材的炮制</span>
            <span class="collection-card__status">{{ counts.processing }} 味已收录</span>
          </div>
          <h3>药材的炮制</h3>
          <p>
            已接入 {{ counts.processing }} 味常用药材的净制、切制、炒、炙、蒸、煮等方法。
            每法回引药典或炮制规范，毒性药材单独标注减毒与使用限制。
          </p>
          <ul>
            <li>草木类 · 根茎叶花果</li>
            <li>蛇虫类 · 蛇虫甲壳</li>
            <li>金石类 · 矿物贝壳</li>
          </ul>
          <div class="collection-card__foot">
            <span>进入炮制栏</span>
            <span aria-hidden="true">→</span>
          </div>
          <span class="collection-card__seal" aria-hidden="true">制</span>
        </RouterLink>
      </div>
    </section>

    <section class="source-strip">
      <div class="container source-strip__inner">
        <span class="eyebrow">SOURCES</span>
        <p>
          伤寒论 · 灵枢 · 难经 · 神农本草经 · 中华人民共和国药典 · GB/T 12346-2021 · 针灸学 · 方剂学 · 中药学
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  overflow: hidden;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0;
  align-items: center;
  padding-top: 74px;
  padding-bottom: 86px;
}

.hero__copy h1 {
  margin: 12px 0 18px;
  font-size: clamp(3.4rem, 8vw, 7rem);
  line-height: 0.96;
  letter-spacing: 0.08em;
  color: var(--ink);
}

.hero__lead {
  max-width: 36rem;
  color: var(--ink-soft);
  font-size: clamp(1.02rem, 1.4vw, 1.2rem);
  line-height: 1.9;
}

.hero__lead span {
  display: block;
  margin-top: 8px;
  color: var(--ink);
}

.hero__lead .hero__plain {
  margin-top: 10px;
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 1.06em;
  letter-spacing: 0.04em;
}

.hero__actions {
  margin-top: 30px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hero-index {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 6px;
  margin-top: 26px;
  padding-top: 14px;
  max-width: 840px;
  border-top: 1px solid var(--line-strong);
}

.hero-index__label {
  flex-basis: 100%;
  margin: 0 0 6px;
  color: var(--ink-faint);
  font-family: var(--serif);
  font-size: 0.68rem;
  letter-spacing: 0.16em;
}

.hero-index a {
  padding: 5px 10px;
  border-radius: 999px;
  color: var(--ink-soft);
  font-size: 0.9rem;
  transition: color 0.18s ease, background 0.18s ease;
}

.hero-index a:hover {
  color: var(--cinnabar);
  background: var(--cinnabar-pale);
}

.hero__stats {
  margin: 26px 0 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  max-width: 440px;
}

.hero__stats div {
  border-top: 1px solid var(--line-strong);
  padding-top: 10px;
}

.hero__stats dt {
  font-family: var(--serif);
  font-size: 1.12rem;
  line-height: 1;
}

.hero__stats dd {
  margin: 5px 0 0;
  color: var(--ink-soft);
  font-size: 0.66rem;
}

.module-section {
  padding-top: 30px;
  padding-bottom: 84px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 30px;
  margin-bottom: 28px;
}

.section-head h2 {
  margin-top: 4px;
}

.section-head > p {
  max-width: 360px;
  color: var(--ink-soft);
  font-size: 0.88rem;
  text-align: right;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.extra-sections {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.extra-card {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-end;
  padding: 20px 22px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: rgba(255, 252, 245, 0.48);
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.extra-card:hover {
  transform: translateY(-2px);
  border-color: var(--jade);
  background: rgba(255, 252, 245, 0.7);
}

.extra-card--cases:hover {
  border-color: var(--cinnabar);
}

.extra-card h3 {
  margin: 3px 0 5px;
  font-size: 1.35rem;
}

.extra-card p {
  max-width: 420px;
  color: var(--ink-soft);
  font-size: 0.78rem;
  line-height: 1.7;
}

.extra-card__count {
  flex-shrink: 0;
  color: var(--jade);
  font-size: 0.74rem;
  white-space: nowrap;
}

.extra-card--cases .extra-card__count {
  color: var(--cinnabar);
}

.extra-card--exercises:hover {
  border-color: var(--gold);
}

.extra-card--exercises .extra-card__count {
  color: var(--gold);
}

.extra-card--classics:hover {
  border-color: var(--jade);
}

.extra-card--classics .extra-card__count {
  color: var(--jade);
}

.module-card {
  --accent: var(--jade);
  --accent-pale: var(--jade-pale);
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 270px;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 22px;
  background: rgba(255, 252, 245, 0.62);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
  animation: card-in 0.6s ease both;
  animation-delay: var(--delay);
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

.module-card::after {
  content: "";
  position: absolute;
  width: 180px;
  height: 180px;
  right: -50px;
  bottom: -70px;
  border-radius: 50%;
  background: var(--accent-pale);
  opacity: 0.55;
  transition: transform 0.3s ease;
}

.module-card:hover {
  transform: translateY(-5px);
  border-color: var(--accent);
  box-shadow: var(--shadow);
}

.module-card:hover::after {
  transform: scale(1.18);
}

.module-card--jade {
  --accent: var(--jade);
  --accent-pale: var(--jade-pale);
}

.module-card--gold {
  --accent: var(--gold);
  --accent-pale: var(--gold-pale);
}

.module-card--cinnabar {
  --accent: var(--cinnabar);
  --accent-pale: var(--cinnabar-pale);
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.module-card__top,
.module-card__foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.module-card__kicker {
  color: var(--accent);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.module-card__arrow {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 50%;
  color: var(--accent);
}

.module-card h3 {
  margin-top: 34px;
  margin-bottom: 10px;
  font-size: 2.3rem;
  letter-spacing: 0.06em;
}

.module-card p {
  max-width: 28rem;
  color: var(--ink-soft);
  font-size: 0.88rem;
  line-height: 1.8;
}

.module-card__foot {
  margin-top: auto;
  padding-top: 24px;
  color: var(--ink-soft);
  font-size: 0.76rem;
}

.module-card__foot span:last-child {
  color: var(--accent);
}

.collections {
  padding-bottom: 92px;
}

.collection-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.collection-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px 26px 20px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background:
    linear-gradient(150deg, rgba(255, 252, 245, 0.72), rgba(235, 226, 210, 0.28)),
    rgba(255, 252, 245, 0.5);
  overflow: hidden;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.collection-card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: var(--accent);
}

.collection-card--lectures {
  --accent: var(--jade);
}

.collection-card--processing {
  --accent: var(--gold);
}

.collection-card:hover {
  transform: translateY(-3px);
  border-color: var(--accent);
  box-shadow: var(--shadow-soft);
}

.collection-card__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.collection-card__kicker {
  color: var(--accent);
  font-size: 0.66rem;
  letter-spacing: 0.12em;
}

.collection-card__status {
  padding: 3px 9px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--ink-soft);
  font-size: 0.64rem;
}

.collection-card h3 {
  margin-top: 2px;
  font-size: 2.1rem;
  letter-spacing: 0.05em;
}

.collection-card p {
  max-width: 36rem;
  color: var(--ink-soft);
  font-size: 0.86rem;
  line-height: 1.9;
}

.collection-card ul {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.collection-card li {
  padding: 5px 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--ink-soft);
  font-size: 0.72rem;
}

.collection-card__foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid var(--line);
  color: var(--accent);
  font-size: 0.78rem;
}

.collection-card__seal {
  position: absolute;
  right: 18px;
  bottom: 18px;
  color: var(--accent);
  font-family: var(--serif);
  font-size: 5.4rem;
  line-height: 1;
  opacity: 0.08;
  pointer-events: none;
}

.source-strip {
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  background: rgba(235, 226, 210, 0.36);
}

.source-strip__inner {
  min-height: 76px;
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.source-strip p {
  color: var(--ink-soft);
  font-size: 0.82rem;
  letter-spacing: 0.03em;
}

@media (max-width: 1040px) {
  .hero {
    grid-template-columns: 1fr;
    gap: 0;
    padding-top: 52px;
  }

  .module-grid {
    grid-template-columns: 1fr;
  }

  .module-card {
    min-height: 260px;
  }

  .extra-sections {
    grid-template-columns: 1fr;
  }

  .collection-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 680px) {
  .hero__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero-index__label {
    width: 100%;
    margin: 0 0 2px;
  }

  .hero-index a {
    padding: 5px 7px;
    font-size: 0.84rem;
  }

  .section-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .section-head > p {
    text-align: left;
  }
}
</style>
