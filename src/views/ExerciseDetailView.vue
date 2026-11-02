<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { findExercise } from '@/data/exercises'

const route = useRoute()
const item = computed(() => findExercise(String(route.params.id)))
</script>

<template>
  <div class="page exercise-detail-page">
    <div class="container">
      <nav class="breadcrumbs" aria-label="面包屑">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/exercises">古法锻炼</RouterLink>
        <span>/</span>
        <span>{{ item?.title ?? '未找到' }}</span>
      </nav>

      <template v-if="item">
        <header class="exercise-detail-head">
          <div>
            <p class="eyebrow">TRADITIONAL PRACTICE / 古法锻炼</p>
            <h1>{{ item.title }}</h1>
            <p class="exercise-detail-head__teacher">{{ item.teacher }} · {{ item.tradition }}</p>
            <div class="exercise-detail-head__meta">
              <span class="chip chip--jade">{{ item.category }}</span>
              <span class="chip">{{ item.status }}</span>
            </div>
          </div>
          <RouterLink class="btn btn--ghost btn--small" to="/exercises">返回收藏页</RouterLink>
        </header>

        <div class="exercise-detail-layout">
          <section class="exercise-media paper-panel">
            <div class="exercise-media__frame">
              <img :src="item.poster" :alt="`${item.title}视频/图片占位`" />
              <span class="exercise-media__play" aria-hidden="true">▷</span>
            </div>
            <div class="exercise-media__caption">
              <strong>视频 / 图片待收录</strong>
              <p>只嵌入自有、授权或官方公开素材；来源不明的视频不放进页面。</p>
            </div>
          </section>

          <aside class="exercise-info">
            <section class="exercise-info__block paper-panel">
              <span class="eyebrow">LINEAGE / 师承与版本</span>
              <p>{{ item.lineageNote }}</p>
            </section>
            <section class="exercise-info__block paper-panel exercise-info__block--safety">
              <span class="eyebrow">SAFETY / 练习提示</span>
              <p>{{ item.safetyNote }}</p>
            </section>
          </aside>
        </div>

        <section class="exercise-outline paper-panel">
          <div>
            <span class="eyebrow">COLLECTION OUTLINE</span>
            <h2>这个收藏页会放什么</h2>
          </div>
          <ol>
            <li><strong>师承与版本</strong><span>张至顺、倪海厦等只写“所传/讲授版本”，不写成原作者。</span></li>
            <li><strong>招式目录</strong><span>按招式顺序列名称、要点与常见错误。</span></li>
            <li><strong>视频或图片</strong><span>收藏页展示授权视频、分段动图或清晰姿势图。</span></li>
            <li><strong>注意事项</strong><span>只做练习参考，不替代医生、康复师或专业老师。</span></li>
          </ol>
        </section>

        <p class="exercise-disclaimer">
          古法锻炼内容仅供学习参考，不构成医疗建议；有基础疾病、骨关节问题或孕期情况者，请先咨询医生与专业老师。
        </p>
      </template>

      <div v-else class="empty-state paper-panel">
        <h2>没有这套功法</h2>
        <p>链接里的功法 id 可能不正确。</p>
        <RouterLink class="btn btn--primary" to="/exercises">返回古法锻炼</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.breadcrumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 20px 0 26px;
  color: var(--ink-faint);
  font-size: 0.78rem;
}

.breadcrumbs a:hover {
  color: var(--cinnabar);
}

.exercise-detail-head {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  align-items: flex-end;
  padding-bottom: 28px;
  border-bottom: 1px solid var(--line-strong);
}

.exercise-detail-head h1 {
  margin: 5px 0 8px;
  font-size: clamp(2.8rem, 6vw, 4.8rem);
  letter-spacing: 0.06em;
}

.exercise-detail-head__teacher {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 1rem;
}

.exercise-detail-head__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.exercise-detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
  gap: 20px;
  padding-top: 28px;
}

.exercise-media {
  padding: 14px;
}

.exercise-media__frame {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 10px;
  background: var(--paper-2);
}

.exercise-media__frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.exercise-media__play {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: rgba(47, 111, 107, 0.75);
  font-size: 2.6rem;
}

.exercise-media__caption {
  padding: 12px 6px 2px;
}

.exercise-media__caption strong {
  font-family: var(--serif);
  font-size: 0.96rem;
}

.exercise-media__caption p {
  margin-top: 3px;
  color: var(--ink-soft);
  font-size: 0.76rem;
  line-height: 1.7;
}

.exercise-info {
  display: grid;
  gap: 12px;
  align-content: start;
}

.exercise-info__block {
  padding: 18px 20px;
}

.exercise-info__block p {
  margin-top: 6px;
  color: var(--ink-soft);
  font-size: 0.82rem;
  line-height: 1.9;
}

.exercise-info__block--safety {
  border-left: 2px solid var(--cinnabar-2);
  background: rgba(241, 221, 214, 0.28);
}

.exercise-outline {
  margin-top: 22px;
  padding: 22px 24px;
  display: grid;
  grid-template-columns: minmax(0, 0.55fr) minmax(0, 1.45fr);
  gap: 30px;
}

.exercise-outline h2 {
  margin-top: 3px;
  font-size: 1.25rem;
}

.exercise-outline ol {
  margin: 0;
  padding-left: 18px;
  color: var(--ink-soft);
  font-size: 0.8rem;
  line-height: 1.9;
}

.exercise-outline li {
  margin-bottom: 8px;
}

.exercise-outline strong,
.exercise-outline span {
  display: block;
}

.exercise-outline strong {
  color: var(--ink);
}

.exercise-outline span {
  color: var(--ink-faint);
  font-size: 0.74rem;
}

.exercise-disclaimer {
  margin-top: 16px;
  color: var(--ink-faint);
  font-size: 0.7rem;
  line-height: 1.7;
}

@media (max-width: 900px) {
  .exercise-detail-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .exercise-detail-layout {
    grid-template-columns: 1fr;
  }

  .exercise-outline {
    grid-template-columns: 1fr;
  }
}
</style>
