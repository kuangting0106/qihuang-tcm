<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { exercises } from '@/data/exercises'
</script>

<template>
  <div class="page exercise-index-page">
    <div class="container">
      <header class="exercise-hero">
        <div>
          <p class="eyebrow">TRADITIONAL PRACTICE / 古法锻炼</p>
          <h1>古法锻炼</h1>
          <p class="exercise-hero__lead">
            收藏传统导引与功法：金刚功、长寿功、五禽戏、易筋经、八段锦等。
            每一套只收可核来源的招式视频或图片；师承、版本和注意事项分开写。
          </p>
          <div class="exercise-hero__meta">
            <span class="chip chip--jade">{{ exercises.length }} 套功法</span>
            <span class="chip">视频 / 图片待收录</span>
            <span class="chip chip--gold">来源与版本待核</span>
          </div>
        </div>
        <div class="exercise-hero__seal" aria-hidden="true">炼</div>
      </header>

      <section class="exercise-grid" aria-label="古法锻炼收藏">
        <RouterLink
          v-for="item in exercises"
          :key="item.id"
          :to="`/exercises/${item.id}`"
          class="exercise-card"
        >
          <div class="exercise-card__media">
            <img :src="item.poster" :alt="`${item.title}视频/图片占位`" loading="lazy" />
            <span class="exercise-card__play" aria-hidden="true">▷</span>
            <span class="exercise-card__status">{{ item.status }}</span>
          </div>
          <div class="exercise-card__body">
            <div class="exercise-card__meta">
              <span>{{ item.category }}</span>
              <span>{{ item.tradition }}</span>
            </div>
            <h2>{{ item.title }}</h2>
            <p class="exercise-card__teacher">{{ item.teacher }}</p>
            <p class="exercise-card__summary">{{ item.summary }}</p>
            <div class="exercise-card__foot">
              <span>查看收藏页</span>
              <span aria-hidden="true">→</span>
            </div>
          </div>
        </RouterLink>
      </section>

      <section class="exercise-principles paper-panel">
        <div>
          <span class="eyebrow">COLLECTION RULE</span>
          <h2>只收能说清来源的素材</h2>
        </div>
        <div>
          <ul>
            <li><strong>视频/图片</strong>：优先自有、授权或官方公开素材；来源不明不嵌入。</li>
            <li><strong>师承与版本</strong>：张至顺、倪海厦等只写“所传/讲授版本”，不写成原作者。</li>
            <li><strong>五禽戏</strong>：传统上多记于华佗；孙思邈的导引养生单列，不混成同一作者。</li>
            <li><strong>安全</strong>：只做练习参考，不替代医生、康复师或专业老师。</li>
          </ul>
          <RouterLink class="text-link" to="/sources">查看现有出处索引 →</RouterLink>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.exercise-hero {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  align-items: center;
  padding: 30px 0 36px;
  border-bottom: 1px solid var(--line-strong);
}

.exercise-hero h1 {
  margin: 6px 0 12px;
  font-size: clamp(3rem, 7vw, 5.4rem);
  letter-spacing: 0.08em;
}

.exercise-hero__lead {
  max-width: 760px;
  color: var(--ink-soft);
  font-size: 0.95rem;
  line-height: 1.9;
}

.exercise-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 16px;
}

.exercise-hero__seal {
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 48% 52% 46% 54%;
  background: var(--jade);
  color: var(--paper);
  font-family: var(--serif);
  font-size: 2.8rem;
  transform: rotate(-4deg);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.22);
}

.exercise-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  padding: 30px 0 36px;
}

.exercise-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: rgba(255, 252, 245, 0.55);
  overflow: hidden;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.exercise-card:hover {
  transform: translateY(-3px);
  border-color: var(--jade);
  box-shadow: var(--shadow-soft);
}

.exercise-card__media {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: var(--paper-2);
}

.exercise-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.exercise-card__play {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: rgba(47, 111, 107, 0.8);
  font-size: 2rem;
  pointer-events: none;
}

.exercise-card__status {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(244, 239, 228, 0.9);
  color: var(--ink-soft);
  font-size: 0.62rem;
}

.exercise-card__body {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 16px 18px 14px;
}

.exercise-card__meta {
  display: flex;
  gap: 6px;
  color: var(--ink-faint);
  font-size: 0.66rem;
}

.exercise-card h2 {
  font-size: 1.5rem;
}

.exercise-card__teacher {
  color: var(--cinnabar);
  font-size: 0.76rem;
}

.exercise-card__summary {
  color: var(--ink-soft);
  font-size: 0.8rem;
  line-height: 1.8;
}

.exercise-card__foot {
  display: flex;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--line);
  color: var(--jade);
  font-size: 0.72rem;
}

.exercise-principles {
  display: grid;
  grid-template-columns: minmax(0, 0.5fr) minmax(0, 1.5fr);
  gap: 30px;
  padding: 22px 24px;
  margin-bottom: 40px;
}

.exercise-principles h2 {
  margin-top: 3px;
  font-size: 1.3rem;
}

.exercise-principles ul {
  margin: 0;
  padding-left: 18px;
  color: var(--ink-soft);
  font-size: 0.8rem;
  line-height: 1.9;
}

.exercise-principles strong {
  color: var(--ink);
}

.exercise-principles .text-link {
  display: inline-block;
  margin-top: 8px;
  font-size: 0.78rem;
}

@media (max-width: 960px) {
  .exercise-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .exercise-hero {
    align-items: flex-start;
  }

  .exercise-hero__seal {
    width: 74px;
    height: 74px;
    font-size: 1.6rem;
  }

  .exercise-grid {
    grid-template-columns: 1fr;
  }

  .exercise-principles {
    grid-template-columns: 1fr;
  }
}
</style>
