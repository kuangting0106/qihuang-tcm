<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { lectureTracks } from '@/data/lectures'
</script>

<template>
  <div class="page lecture-page">
    <div class="container">
      <header class="lecture-hero">
        <div>
          <p class="eyebrow">LECTURE HALL / 名家讲堂</p>
          <h1>名家讲堂</h1>
          <p class="lecture-hero__lead">
            收藏著名医家的视频课件：以医家与典籍为线索，收集后世、当代名家的讲授版本。
            历史医家没有留下影像，页面只写“某某讲授版本”，不把讲授者写成原作者。
          </p>
          <div class="lecture-hero__meta">
            <span class="chip chip--jade">{{ lectureTracks.length }} 个专题</span>
            <span class="chip">视频课件待收录</span>
            <span class="chip chip--gold">授权与版本待核</span>
          </div>
        </div>
        <div class="lecture-hero__seal" aria-hidden="true">讲</div>
      </header>

      <section class="lecture-grid" aria-label="名家讲堂专题">
        <article v-for="track in lectureTracks" :key="track.id" class="lecture-card">
          <div class="lecture-card__top">
            <span>{{ track.era }}</span>
            <span class="lecture-card__status">{{ track.status }}</span>
          </div>
          <h2>{{ track.title }}</h2>
          <p class="lecture-card__author">{{ track.author }} · {{ track.work }}</p>
          <p class="lecture-card__focus">{{ track.focus }}</p>
          <p class="lecture-card__note">{{ track.note }}</p>
          <div class="lecture-card__placeholder">
            <span aria-hidden="true">▷</span>
            <span>视频课件待收录 · {{ track.videoCount }} 讲</span>
          </div>
        </article>
      </section>

      <section class="lecture-rules paper-panel">
        <div>
          <span class="eyebrow">COLLECTION RULE</span>
          <h2>只收能说清来源的课件</h2>
        </div>
        <div>
          <ul>
            <li><strong>历史医家</strong>：张仲景、孙思邈、李时珍、傅青主没有影像；本栏收后世名家讲授其典籍的课程。</li>
            <li><strong>讲授者与版本</strong>：写清“某某讲授版本”、课程名称与录制年份，不把讲授者写成原作者。</li>
            <li><strong>授权</strong>：只嵌入自有、授权或官方公开视频；来源不明不嵌入，也不提供下载。</li>
            <li><strong>原文优先</strong>：课程是理解入口，具体方药与条文仍回引原书，不用视频替代原文。</li>
          </ul>
          <RouterLink class="text-link" to="/classics">查看医家经典古籍 →</RouterLink>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.lecture-hero {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  align-items: center;
  padding: 30px 0 36px;
  border-bottom: 1px solid var(--line-strong);
}

.lecture-hero h1 {
  margin: 6px 0 12px;
  font-size: clamp(3rem, 7vw, 5.4rem);
  letter-spacing: 0.08em;
}

.lecture-hero__lead {
  max-width: 800px;
  color: var(--ink-soft);
  font-size: 0.95rem;
  line-height: 1.9;
}

.lecture-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 16px;
}

.lecture-hero__seal {
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

.lecture-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  padding: 30px 0 36px;
}

.lecture-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 20px 18px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: rgba(255, 252, 245, 0.55);
}

.lecture-card__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.lecture-card__status {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(237, 224, 200, 0.55);
  color: var(--ink-soft);
}

.lecture-card h2 {
  margin-top: 2px;
  font-size: 1.45rem;
}

.lecture-card__author {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.82rem;
}

.lecture-card__focus {
  color: var(--ink);
  font-size: 0.82rem;
  line-height: 1.8;
}

.lecture-card__note {
  color: var(--ink-faint);
  font-size: 0.74rem;
  line-height: 1.75;
}

.lecture-card__placeholder {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid var(--line);
  color: var(--jade);
  font-size: 0.76rem;
}

.lecture-card__placeholder span:first-child {
  font-size: 1.1rem;
}

.lecture-rules {
  display: grid;
  grid-template-columns: minmax(0, 0.5fr) minmax(0, 1.5fr);
  gap: 30px;
  padding: 22px 24px;
  margin-bottom: 40px;
}

.lecture-rules h2 {
  margin-top: 3px;
  font-size: 1.3rem;
}

.lecture-rules ul {
  margin: 0;
  padding-left: 18px;
  color: var(--ink-soft);
  font-size: 0.8rem;
  line-height: 1.9;
}

.lecture-rules strong {
  color: var(--ink);
}

.lecture-rules .text-link {
  display: inline-block;
  margin-top: 8px;
  font-size: 0.78rem;
}

@media (max-width: 960px) {
  .lecture-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .lecture-hero {
    align-items: flex-start;
  }

  .lecture-hero__seal {
    width: 74px;
    height: 74px;
    font-size: 1.6rem;
  }

  .lecture-grid {
    grid-template-columns: 1fr;
  }

  .lecture-rules {
    grid-template-columns: 1fr;
  }
}
</style>
