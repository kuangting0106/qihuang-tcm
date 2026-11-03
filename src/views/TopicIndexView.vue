<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { clinicalDisclaimer } from '@/data/clinical-methods'
import { getTopicSection } from '@/data/topics'

const route = useRoute()
const section = computed(() => getTopicSection(String(route.meta.section || 'methods')))
const basePath = computed(() => `/${section.value.key}`)

const readyTopicIds = new Set(['acupuncture', 'moxibustion', 'ten-questions', 'treatment-methods', 'inspection'])
const clinicalTopicIds = new Set(['ten-questions', 'treatment-methods', 'inspection'])

function isReady(id: string) {
  return readyTopicIds.has(id)
}

function isClinical(id: string) {
  return clinicalTopicIds.has(id)
}

function topicStatus(id: string) {
  if (id === 'acupuncture' || id === 'moxibustion') return '已收录 · 非专业勿试'
  if (isClinical(id)) return '已收录 · 经验总结'
  return '待收录'
}
</script>

<template>
  <div class="page topic-index-page" :class="`topic-index-page--${section.key}`">
    <div class="container">
      <section class="clinical-banner" role="note">
        <span class="clinical-banner__mark">慎</span>
        <div>
          <strong>{{ clinicalDisclaimer.title }}</strong>
          <p>{{ clinicalDisclaimer.body }}</p>
        </div>
      </section>

      <header class="topic-hero">
        <div>
          <p class="eyebrow">{{ section.eyebrow }}</p>
          <h1>{{ section.title }}</h1>
          <p class="topic-hero__lead">{{ section.lead }}</p>
          <div class="topic-hero__meta">
            <span class="chip chip--cinnabar">{{ section.topics.length }} 个栏目</span>
            <span class="chip">经验总结 · 非诊断标准</span>
            <span class="chip chip--gold">先出处，后内容</span>
          </div>
        </div>
        <div class="topic-hero__seal" aria-hidden="true">{{ section.key === 'methods' ? '法' : '案' }}</div>
      </header>

      <section class="topic-grid" aria-label="栏目列表">
        <RouterLink
          v-for="(topic, index) in section.topics"
          :key="topic.id"
          :to="`${basePath}/${topic.id}`"
          class="topic-card"
        >
          <div class="topic-card__top">
            <span class="topic-card__num">{{ String(index + 1).padStart(2, '0') }}</span>
            <span
              class="topic-card__status"
              :class="{
                'topic-card__status--ready': isReady(topic.id),
                'topic-card__status--clinical': isClinical(topic.id),
              }"
            >
              {{ topicStatus(topic.id) }}
            </span>
          </div>
          <h2>{{ topic.title }}</h2>
          <p>{{ topic.subtitle }}</p>
          <div class="topic-card__foot">
            <span>进入栏目</span>
            <span aria-hidden="true">→</span>
          </div>
        </RouterLink>
      </section>

      <section class="topic-principles paper-panel">
        <div>
          <span class="eyebrow">EDITORIAL RULE</span>
          <h2>经验与原文分开</h2>
        </div>
        <div>
          <p>
            看诊十问、治疗法门与望诊经验，都是传统中医的经验整理，不是绝对诊断标准。
            页面把“经验条目”和“经典/讲义出处”分开标注；具体方药、剂量与操作，仍以原书和执业医师判断为准。
          </p>
          <p class="topic-principles__links">
            <RouterLink class="text-link" to="/classics">查看医家经典书籍 →</RouterLink>
            <RouterLink class="text-link" to="/">返回首页 →</RouterLink>
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.clinical-banner {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin-top: 22px;
  padding: 16px 18px;
  border: 1px solid rgba(163, 58, 43, 0.32);
  border-left: 4px solid var(--cinnabar);
  border-radius: 4px;
  background: rgba(163, 58, 43, 0.055);
}

.clinical-banner__mark {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  border: 1px solid var(--cinnabar);
  border-radius: 50%;
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.95rem;
}

.clinical-banner strong {
  display: block;
  margin-bottom: 3px;
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.98rem;
}

.clinical-banner p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.86rem;
  line-height: 1.75;
}

.topic-hero {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  align-items: center;
  padding: 30px 0 38px;
  border-bottom: 1px solid var(--line-strong);
}

.topic-hero h1 {
  margin: 6px 0 12px;
  font-size: clamp(3rem, 7vw, 5.4rem);
  letter-spacing: 0.08em;
}

.topic-hero__lead {
  max-width: 720px;
  color: var(--ink-soft);
  font-size: 0.95rem;
  line-height: 1.9;
}

.topic-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 16px;
}

.topic-hero__seal {
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

.topic-index-page--cases .topic-hero__seal {
  background: var(--cinnabar);
}

.topic-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  padding: 30px 0 36px;
}

.topic-card {
  display: flex;
  flex-direction: column;
  min-height: 220px;
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: rgba(255, 252, 245, 0.55);
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.topic-card:hover {
  transform: translateY(-3px);
  border-color: var(--jade);
  box-shadow: var(--shadow-soft);
}

.topic-index-page--cases .topic-card:hover {
  border-color: var(--cinnabar);
}

.topic-card__top,
.topic-card__foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.topic-card__num {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.76rem;
}

.topic-card__status {
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--paper-2);
  color: var(--ink-faint);
  font-size: 0.62rem;
}

.topic-card__status--ready {
  background: rgba(190, 78, 58, 0.1);
  color: var(--cinnabar);
}

.topic-card__status--clinical {
  background: rgba(176, 138, 74, 0.12);
  color: #8a6a35;
}

.topic-card h2 {
  margin: 22px 0 8px;
  font-size: 1.45rem;
}

.topic-card p {
  color: var(--ink-soft);
  font-size: 0.8rem;
  line-height: 1.8;
}

.topic-card__foot {
  margin-top: auto;
  padding-top: 18px;
  color: var(--jade);
  font-size: 0.72rem;
}

.topic-index-page--cases .topic-card__foot {
  color: var(--cinnabar);
}

.topic-principles {
  display: grid;
  grid-template-columns: minmax(0, 0.55fr) minmax(0, 1.45fr);
  gap: 30px;
  padding: 22px 24px;
  margin-bottom: 40px;
}

.topic-principles h2 {
  margin-top: 3px;
  font-size: 1.3rem;
}

.topic-principles p {
  color: var(--ink-soft);
  font-size: 0.82rem;
  line-height: 1.9;
}

.topic-principles__links {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 8px;
}

@media (max-width: 960px) {
  .topic-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .topic-hero {
    align-items: flex-start;
  }

  .topic-hero__seal {
    width: 74px;
    height: 74px;
    font-size: 1.6rem;
  }

  .topic-grid {
    grid-template-columns: 1fr;
  }

  .topic-principles {
    grid-template-columns: 1fr;
  }
}
</style>
