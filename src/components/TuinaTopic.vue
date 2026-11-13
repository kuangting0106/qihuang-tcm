<script setup lang="ts">
import { RouterLink } from 'vue-router'

const chapters = [
  {
    id: '卷一·辨证',
    label: '卷一',
    title: '辨证',
    summary: '先辨体质、证候与部位，再定手法；原文保留按诊、望诊与辨证要点。',
  },
  {
    id: '卷二·立法',
    label: '卷二',
    title: '立法',
    summary: '以手法为治，分缓急、定次序；原文保留推、拿、按、摩等法及施用原则。',
  },
  {
    id: '卷三·取穴',
    label: '卷三',
    title: '取穴',
    summary: '按经取穴、循经施术；原文保留穴位、部位与取穴方法。',
  },
  {
    id: '卷四·列证',
    label: '卷四',
    title: '列证',
    summary: '分证论治，随证选法；原文保留各病证的推拿治法与操作记录。',
  },
]
</script>

<template>
  <section class="tuina">
    <div class="tuina-warning paper-panel">
      <strong>阅读提示</strong>
      <p>
        推拿属中医外治法，手法、力度与取穴均需专业训练。本页只整理原书文字，供文献学习；
        不要仅凭文字自行操作，尤其儿童、孕妇、骨质疏松及急性损伤者，应先由执业医师评估。
      </p>
    </div>

    <header class="tuina-hero paper-panel">
      <p class="eyebrow">TUINA / 推拿</p>
      <h2>推拿：以手法治外，以辨证定法</h2>
      <p class="tuina-lede">
        推拿以手法作用于体表，调畅气血、舒筋通络。本站以清·张振鉴（张筱衫）《厘正按摩要术》为纲，
        按辨证、立法、取穴、列证四卷整理，原文照录，不加今人推演。
      </p>
      <p class="tuina-source">
        底本：《厘正按摩要术》，清·张振鉴（张筱衫）撰，光绪十六年述古斋医书。
        源文为整理稿，个别字有缺误，以原书为准。
      </p>
      <RouterLink class="tuina-link" to="/classics/liming-tuina">
        读《厘正按摩要术》全文 →
      </RouterLink>
    </header>

    <div class="tuina-grid">
      <article v-for="chapter in chapters" :key="chapter.id" class="tuina-card paper-panel">
        <span class="tuina-card__label">{{ chapter.label }}</span>
        <h3>{{ chapter.title }}</h3>
        <p>{{ chapter.summary }}</p>
        <RouterLink :to="`/classics/liming-tuina`">查看原文 →</RouterLink>
      </article>
    </div>

    <div class="tuina-note paper-panel">
      <h3>怎么读</h3>
      <p>
        先读卷一辨证，明白先辨后治；再读卷二立法，了解手法与次序；卷三取穴用于定位；
        卷四列证按病证对照。四卷合看，才是一套完整的推拿思路，不宜只取一方一法。
      </p>
    </div>
  </section>
</template>

<style scoped>
.tuina {
  display: grid;
  gap: 18px;
}

.tuina-warning {
  padding: 16px 18px;
  border-color: rgba(176, 116, 58, 0.35);
  background: rgba(255, 247, 232, 0.72);
}

.tuina-warning strong {
  display: block;
  margin-bottom: 4px;
  color: var(--clay);
  font-size: 0.82rem;
  letter-spacing: 0.08em;
}

.tuina-warning p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.86rem;
  line-height: 1.8;
}

.tuina-hero {
  padding: 28px 30px;
}

.tuina-hero h2 {
  margin-top: 4px;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
}

.tuina-lede {
  max-width: 760px;
  margin-top: 10px;
  color: var(--ink-soft);
  line-height: 1.9;
}

.tuina-source {
  margin-top: 10px;
  color: var(--ink-faint);
  font-size: 0.78rem;
  line-height: 1.7;
}

.tuina-link {
  display: inline-flex;
  margin-top: 16px;
  padding: 9px 16px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  color: var(--jade-deep);
  font-size: 0.82rem;
  transition: background 0.18s ease, border-color 0.18s ease;
}

.tuina-link:hover {
  border-color: var(--jade);
  background: rgba(45, 92, 74, 0.06);
}

.tuina-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.tuina-card {
  padding: 20px 20px 18px;
}

.tuina-card__label {
  color: var(--clay);
  font-size: 0.7rem;
  letter-spacing: 0.14em;
}

.tuina-card h3 {
  margin-top: 4px;
  font-size: 1.15rem;
}

.tuina-card p {
  margin-top: 8px;
  color: var(--ink-soft);
  font-size: 0.84rem;
  line-height: 1.75;
}

.tuina-card a {
  display: inline-block;
  margin-top: 12px;
  color: var(--jade-deep);
  font-size: 0.78rem;
}

.tuina-note {
  padding: 20px 24px;
}

.tuina-note h3 {
  font-size: 1.05rem;
}

.tuina-note p {
  margin-top: 8px;
  color: var(--ink-soft);
  font-size: 0.86rem;
  line-height: 1.85;
}

@media (max-width: 700px) {
  .tuina-hero {
    padding: 22px 20px;
  }

  .tuina-grid {
    grid-template-columns: 1fr;
  }
}
</style>
