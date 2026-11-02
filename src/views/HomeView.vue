<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useTcmData } from '@/composables/useTcmData'
import { caseTopics, methodTopics } from '@/data/topics'
import { exercises } from '@/data/exercises'

const { data, acupointsById } = useTcmData()

const counts = computed(() => ({
  herbs: data.value?.herbs.length ?? 0,
  formulas: data.value?.formulas.length ?? 0,
  points: data.value?.acupoints.length ?? 0,
  meridians: data.value?.meridians.length ?? 0,
}))

const featuredPoints = computed(() =>
  ['LU9', 'REN17', 'REN4', 'ST36', 'GB20']
    .map((id) => acupointsById.value.get(id))
    .filter((p) => !!p),
)

const modules = computed(() => [
  {
    to: '/meridians/lung',
    kicker: 'MERIDIAN / 经络',
    title: '经络图',
    desc: '在可旋转的人体上查看 30 个常用重点穴，按经络、区域、穴位类型筛选。',
    stat: `${counts.value.points} 个穴位 · ${counts.value.meridians} 条经络`,
    tone: 'jade',
    icon: 'meridian',
  },
  {
    to: '/herbs',
    kicker: 'MATERIA MEDICA / 本草',
    title: '本草',
    desc: '性味、归经、功效、主治与配伍关系，每一个字段都能点开看出处。',
    stat: `${counts.value.herbs} 味样例药材`,
    tone: 'gold',
    icon: 'herb',
  },
  {
    to: '/formulas',
    kicker: 'FORMULA / 方剂',
    title: '方剂',
    desc: '原文、症状、君臣佐使、加减与关系图谱双轨呈现，药材可跳转本草。',
    stat: `${counts.value.formulas} 首伤寒方`,
    tone: 'cinnabar',
    icon: 'formula',
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
        <dl class="hero__stats">
          <div><dt>{{ counts.points }}</dt><dd>常用重点穴</dd></div>
          <div><dt>{{ counts.herbs }}</dt><dd>样例药材</dd></div>
          <div><dt>{{ counts.formulas }}</dt><dd>伤寒方</dd></div>
          <div><dt>100%</dt><dd>内容带出处</dd></div>
        </dl>
      </div>

      <div class="hero__visual" aria-hidden="true">
        <div class="figure-card">
          <div class="figure-card__head">
            <span>正面 · 经络示意</span>
            <span class="figure-card__dot"></span>
          </div>
          <svg viewBox="0 0 300 520" class="body-figure">
            <defs>
              <linearGradient id="bodyWash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#d8c6a8" stop-opacity="0.62" />
                <stop offset="100%" stop-color="#b08a4a" stop-opacity="0.12" />
              </linearGradient>
              <linearGradient id="meridianGold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#a33a2b" />
                <stop offset="100%" stop-color="#b08a4a" />
              </linearGradient>
            </defs>
            <path
              d="M150 28 C132 28 120 42 120 58 C120 72 128 84 138 88 L136 96 C122 100 106 110 98 128 L78 190 L64 250 L78 255 L98 205 L108 230 L110 300 L102 380 L96 450 L122 452 L134 380 L142 320 L150 300 L158 320 L166 380 L178 452 L204 450 L198 380 L190 300 L192 230 L202 205 L222 255 L236 250 L222 190 L202 128 C194 110 178 100 164 96 L162 88 C172 84 180 72 180 58 C180 42 168 28 150 28Z"
              fill="url(#bodyWash)"
              stroke="#6f5a3d"
              stroke-opacity="0.4"
              stroke-width="1.2"
            />
            <path
              d="M150 132 C136 138 118 146 106 162 L88 206 L82 246"
              fill="none"
              stroke="url(#meridianGold)"
              stroke-width="2.4"
              stroke-linecap="round"
            />
            <path
              d="M150 132 L150 168 L150 220 L150 270"
              fill="none"
              stroke="#a33a2b"
              stroke-opacity="0.55"
              stroke-width="1.5"
              stroke-dasharray="4 5"
            />
            <g class="figure-dots">
              <circle cx="112" cy="152" r="4.5" />
              <circle cx="150" cy="160" r="4.5" />
              <circle cx="150" cy="222" r="4.5" />
              <circle cx="150" cy="274" r="4.5" />
              <circle cx="88" cy="224" r="4.5" />
              <circle cx="82" cy="250" r="3.5" />
              <circle cx="205" cy="138" r="4.5" />
            </g>
            <g class="figure-labels" font-family="var(--serif)" font-size="11" fill="#5b625d">
              <text x="122" y="146">中府</text>
              <text x="160" y="158">膻中</text>
              <text x="160" y="220">中脘</text>
              <text x="160" y="272">关元</text>
              <text x="42" y="228">尺泽</text>
              <text x="216" y="134">风池</text>
            </g>
          </svg>
          <div class="figure-card__foot">
            <span>3D 针灸铜人 · 离线坐标</span>
            <span>30 穴</span>
          </div>
        </div>
        <div class="float-note float-note--top">
          <span class="float-note__mark">原</span>
          <div><strong>太渊</strong><small>原 · 输 · 脉会 · 母</small></div>
        </div>
        <div class="float-note float-note--bottom">
          <span class="float-note__mark">会</span>
          <div><strong>八会穴</strong><small>脏、腑、气、血、筋、脉、骨、髓</small></div>
        </div>
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
          <div class="module-card__icon" aria-hidden="true">
            <svg v-if="m.icon === 'meridian'" viewBox="0 0 64 64">
              <circle cx="32" cy="13" r="7" fill="none" stroke="currentColor" stroke-width="2" />
              <path d="M32 20v10M32 30c-8 0-11 6-11 12M32 30c8 0 11 6 11 12M21 42l-6 14M43 42l6 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <circle cx="32" cy="30" r="2.5" fill="currentColor" />
              <circle cx="21" cy="42" r="2.5" fill="currentColor" />
              <circle cx="43" cy="42" r="2.5" fill="currentColor" />
            </svg>
            <svg v-else-if="m.icon === 'herb'" viewBox="0 0 64 64">
              <path d="M32 57c0-18 0-28 0-40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <path d="M32 33c-12 0-18-7-18-15 10 0 18 5 18 15Z" fill="none" stroke="currentColor" stroke-width="2" />
              <path d="M32 22c10 0 16-6 16-13-9 0-16 4-16 13Z" fill="none" stroke="currentColor" stroke-width="2" />
              <circle cx="32" cy="15" r="4" fill="none" stroke="currentColor" stroke-width="2" />
            </svg>
            <svg v-else viewBox="0 0 64 64">
              <rect x="14" y="10" width="36" height="44" rx="3" fill="none" stroke="currentColor" stroke-width="2" />
              <path d="M22 22h20M22 30h20M22 38h12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <path d="M42 48c4-3 7-7 7-12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
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
            <p>看诊十问、脉诊、望诊、听诊、治疗法门、治癌法门、治病先后主次。</p>
          </div>
          <span class="extra-card__count">{{ methodTopics.length }} 个栏目 →</span>
        </RouterLink>
        <RouterLink to="/cases" class="extra-card extra-card--cases">
          <div>
            <span class="eyebrow">CASE / 案列篇</span>
            <h3>案列篇</h3>
            <p>按病类整理医案：风湿、表证、肠胃、肺篇、心胸、腹篇、积饮、消渴、水病、痢、脓疡、孕妇科、男科。</p>
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
      </div>
    </section>

    <section class="principles container">
      <div class="principles__intro">
        <p class="eyebrow">HOW TO READ</p>
        <h2>这不是一份“看起来很像”的中医文案</h2>
        <p>
          原型里的每一条内容都挂在来源上。经典原文、药典/标准、教材归纳分别标注；
          查不到确切出处的字段宁可不写。
        </p>
        <RouterLink class="text-link" to="/sources">查看全部出处 →</RouterLink>
      </div>
      <div class="principle-list">
        <article>
          <span class="principle-list__num">01</span>
          <h3>原文与方解分开</h3>
          <p>“桂枝为君”不是《伤寒论》原文，而是后世方书归纳，页面会明确标成“后世方解”。</p>
        </article>
        <article>
          <span class="principle-list__num">02</span>
          <h3>穴位坐标离线预计算</h3>
          <p>3D 只读 JSON 坐标表，不在运行时把点贴到人体表面，换模型必须换坐标版本。</p>
        </article>
        <article>
          <span class="principle-list__num">03</span>
          <h3>方剂大方不画成乱麻</h3>
          <p>1～8 味用同心环；21 味以上默认按角色分组列表，全部展开，不折叠。</p>
        </article>
      </div>
    </section>

    <section class="featured container">
      <div class="section-head">
        <div>
          <p class="eyebrow">START HERE</p>
          <h2>先点开一个穴位</h2>
        </div>
        <p>从四肢到躯干、头颈，看看不同类型落在哪里。</p>
      </div>
      <div class="featured-points">
        <RouterLink
          v-for="p in featuredPoints"
          :key="p!.id"
          class="featured-point"
          :to="{ path: '/meridians/all', query: { point: p!.id } }"
        >
          <span class="featured-point__id">{{ p!.id }}</span>
          <strong>{{ p!.name }}</strong>
          <span>{{ p!.annotation }}</span>
        </RouterLink>
      </div>
    </section>

    <section class="source-strip">
      <div class="container source-strip__inner">
        <span class="eyebrow">SOURCES</span>
        <p>
          伤寒论 · 灵枢 · 难经 · 中华人民共和国药典 · GB/T 12346-2021 · 针灸学 · 方剂学 · 中药学
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
  grid-template-columns: minmax(0, 1.04fr) minmax(360px, 0.96fr);
  gap: 56px;
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

.hero__stats {
  margin: 42px 0 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  max-width: 520px;
}

.hero__stats div {
  border-top: 1px solid var(--line-strong);
  padding-top: 12px;
}

.hero__stats dt {
  font-family: var(--serif);
  font-size: 1.7rem;
  line-height: 1;
}

.hero__stats dd {
  margin: 6px 0 0;
  color: var(--ink-soft);
  font-size: 0.76rem;
}

.hero__visual {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 560px;
}

.hero__visual::before {
  content: "";
  position: absolute;
  width: 470px;
  height: 470px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(176, 138, 74, 0.18), transparent 68%);
  filter: blur(4px);
}

.figure-card {
  position: relative;
  width: min(400px, 100%);
  border: 1px solid var(--line);
  border-radius: 26px;
  background:
    linear-gradient(160deg, rgba(255, 252, 245, 0.82), rgba(235, 226, 210, 0.54)),
    repeating-linear-gradient(90deg, transparent 0 39px, rgba(32, 37, 34, 0.03) 39px 40px);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.figure-card__head,
.figure-card__foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 15px 20px;
  color: var(--ink-soft);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
}

.figure-card__head {
  border-bottom: 1px solid var(--line);
}

.figure-card__foot {
  border-top: 1px solid var(--line);
}

.figure-card__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cinnabar);
  box-shadow: 0 0 0 4px rgba(163, 58, 43, 0.12);
}

.body-figure {
  display: block;
  width: 100%;
  height: auto;
  padding: 10px 12px 0;
}

.figure-dots circle {
  fill: var(--cinnabar);
  stroke: #f8efe3;
  stroke-width: 2;
  animation: dot-pulse 3.6s ease-in-out infinite;
}

.figure-dots circle:nth-child(2n) {
  animation-delay: 0.8s;
}

.figure-dots circle:nth-child(3n) {
  animation-delay: 1.5s;
}

@keyframes dot-pulse {
  0%,
  100% {
    filter: drop-shadow(0 0 0 rgba(163, 58, 43, 0));
  }
  50% {
    filter: drop-shadow(0 0 5px rgba(163, 58, 43, 0.55));
  }
}

.float-note {
  position: absolute;
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255, 252, 245, 0.9);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(8px);
}

.float-note--top {
  top: 76px;
  right: -10px;
}

.float-note--bottom {
  bottom: 72px;
  left: -12px;
}

.float-note__mark {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--cinnabar-pale);
  color: var(--cinnabar);
  font-family: var(--serif);
}

.float-note strong,
.float-note small {
  display: block;
}

.float-note strong {
  font-family: var(--serif);
  font-size: 0.9rem;
}

.float-note small {
  color: var(--ink-soft);
  font-size: 0.68rem;
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
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

.module-card {
  --accent: var(--jade);
  --accent-pale: var(--jade-pale);
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 330px;
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

.module-card__icon {
  width: 62px;
  height: 62px;
  margin: 30px 0 18px;
  color: var(--accent);
}

.module-card__icon svg {
  width: 100%;
  height: 100%;
}

.module-card h3 {
  font-size: 1.7rem;
  margin-bottom: 8px;
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

.principles {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 56px;
  padding-bottom: 90px;
}

.principles__intro h2 {
  margin: 4px 0 14px;
}

.principles__intro p {
  color: var(--ink-soft);
  line-height: 1.9;
}

.principles__intro .text-link {
  display: inline-block;
  margin-top: 18px;
  font-size: 0.86rem;
}

.principle-list {
  display: grid;
  gap: 12px;
}

.principle-list article {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 12px 16px;
  padding: 18px 20px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(255, 252, 245, 0.46);
}

.principle-list__num {
  grid-row: span 2;
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 1.05rem;
}

.principle-list h3 {
  font-size: 1rem;
}

.principle-list p {
  color: var(--ink-soft);
  font-size: 0.84rem;
}

.featured {
  padding-bottom: 92px;
}

.featured-points {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.featured-point {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(255, 252, 245, 0.5);
  transition: border-color 0.18s ease, transform 0.18s ease;
}

.featured-point:hover {
  border-color: var(--cinnabar);
  transform: translateY(-2px);
}

.featured-point__id {
  color: var(--cinnabar);
  font-size: 0.68rem;
  letter-spacing: 0.08em;
}

.featured-point strong {
  font-family: var(--serif);
  font-size: 1.18rem;
}

.featured-point span:last-child {
  color: var(--ink-soft);
  font-size: 0.74rem;
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
    gap: 30px;
    padding-top: 52px;
  }

  .hero__visual {
    min-height: 480px;
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

  .principles {
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .featured-points {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .hero__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero__visual {
    min-height: 420px;
  }

  .float-note {
    display: none;
  }

  .section-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .section-head > p {
    text-align: left;
  }

  .featured-points {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
