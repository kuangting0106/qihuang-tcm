<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import tutorial from '@/data/acupuncture-tutorial.json'

const stats = computed(() => tutorial.stats)
const chapters = computed(() => tutorial.chapters)
</script>

<template>
  <section class="tutorial-entry" aria-labelledby="tutorial-entry-title">
    <div class="tutorial-entry__body">
      <p class="eyebrow">NIH AIXIA · 人纪针灸</p>
      <h2 id="tutorial-entry-title">倪海厦人纪系列之针灸教程</h2>
      <p class="tutorial-entry__lead">
        按原教程章节整理：先看章节与小目录，再进入每条经络的具体穴位讲解。第四章切换经络时，
        页面上方保持不动，只替换下方教程内容；每条经络都可跳到对应经络图，方便对照穴位在人体上的位置。
      </p>
      <div class="tutorial-entry__stats">
        <span><strong>{{ stats.chapters }}</strong> 章</span>
        <span><strong>{{ stats.sections }}</strong> 节</span>
        <span><strong>{{ stats.topics }}</strong> 个小目录</span>
        <span><strong>{{ stats.pages }}</strong> 页正文</span>
      </div>
      <div class="tutorial-entry__chapters" aria-label="教程章节">
        <RouterLink
          v-for="chapter in chapters"
          :key="chapter.id"
          :to="`/methods/acupuncture/tutorial/${chapter.id}`"
        >
          {{ chapter.title }}
        </RouterLink>
      </div>
    </div>
    <div class="tutorial-entry__action">
      <span class="tutorial-entry__seal" aria-hidden="true">针</span>
      <RouterLink class="tutorial-entry__button" to="/methods/acupuncture/tutorial">
        点击进入学习
        <span aria-hidden="true">→</span>
      </RouterLink>
      <small>原 PDF 文本层整理 · 保留章节层级</small>
    </div>
  </section>
</template>

<style scoped>
.tutorial-entry {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 210px;
  gap: 22px;
  align-items: center;
  padding: 24px 26px;
  border: 1px solid color-mix(in srgb, var(--jade) 45%, var(--line));
  border-radius: 14px;
  background:
    radial-gradient(circle at 88% 20%, rgba(255, 255, 255, 0.5), transparent 40%),
    linear-gradient(135deg, rgba(40, 92, 69, 0.96), rgba(29, 70, 53, 0.94));
  color: #f6f1e4;
  box-shadow: 0 16px 38px rgba(26, 56, 43, 0.16);
}

.tutorial-entry__body {
  min-width: 0;
}

.tutorial-entry .eyebrow {
  color: rgba(246, 241, 228, 0.66);
}

.tutorial-entry h2 {
  margin: 4px 0 8px;
  font-family: var(--serif);
  font-size: clamp(1.4rem, 3.4vw, 2.1rem);
  font-weight: 400;
  letter-spacing: 0.05em;
}

.tutorial-entry__lead {
  max-width: 760px;
  color: rgba(246, 241, 228, 0.78);
  font-size: 0.8rem;
  line-height: 1.85;
}

.tutorial-entry__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 14px;
  color: rgba(246, 241, 228, 0.72);
  font-size: 0.68rem;
  letter-spacing: 0.06em;
}

.tutorial-entry__stats strong {
  margin-right: 3px;
  color: #f3d9a6;
  font-family: var(--serif);
  font-size: 1rem;
  font-weight: 500;
}

.tutorial-entry__chapters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
}

.tutorial-entry__chapters a {
  padding: 3px 8px;
  border: 1px solid rgba(246, 241, 228, 0.24);
  border-radius: 999px;
  color: rgba(246, 241, 228, 0.82);
  font-size: 0.64rem;
  text-decoration: none;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.tutorial-entry__chapters a:hover {
  border-color: rgba(243, 217, 166, 0.7);
  background: rgba(255, 255, 255, 0.08);
  color: #fff8e8;
}

.tutorial-entry__action {
  display: grid;
  justify-items: center;
  gap: 10px;
  text-align: center;
}

.tutorial-entry__seal {
  display: grid;
  place-content: center;
  width: 58px;
  height: 58px;
  border: 1px solid rgba(243, 217, 166, 0.72);
  color: #f3d9a6;
  font-family: var(--serif);
  font-size: 1.8rem;
}

.tutorial-entry__button {
  display: inline-flex;
  gap: 9px;
  align-items: center;
  justify-content: center;
  padding: 11px 16px;
  border: 1px solid #f3d9a6;
  border-radius: 999px;
  background: #f3d9a6;
  color: #1d4635;
  font-family: var(--serif);
  font-size: 0.88rem;
  letter-spacing: 0.06em;
  text-decoration: none;
  transition: transform 0.2s ease, background 0.2s ease;
}

.tutorial-entry__button:hover {
  transform: translateY(-1px);
  background: #fff1cc;
}

.tutorial-entry__action small {
  color: rgba(246, 241, 228, 0.56);
  font-size: 0.58rem;
  line-height: 1.6;
}

@media (max-width: 760px) {
  .tutorial-entry {
    grid-template-columns: 1fr;
    padding: 20px;
  }

  .tutorial-entry__action {
    grid-template-columns: auto 1fr;
    justify-items: start;
    text-align: left;
  }

  .tutorial-entry__seal {
    grid-row: span 2;
  }

  .tutorial-entry__action small {
    grid-column: 2;
  }
}
</style>
