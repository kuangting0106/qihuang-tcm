<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { firstAidConditions, firstAidGeneralWarning, firstAidSource } from '@/data/first-aid'
</script>

<template>
  <section id="first-aid" class="first-aid container" aria-labelledby="first-aid-title">
    <div class="section-head first-aid__head">
      <div>
        <p class="eyebrow">FIRST AID / 中医急救知识</p>
        <h2 id="first-aid-title">中医急救知识</h2>
      </div>
      <p>
        摘录常见猝死病的急救与预防，按病症分类。涉及专业知识，<strong>仅作参考学习</strong>，
        不能替代 120、心肺复苏与现代急救。
      </p>
    </div>

    <aside class="first-aid__warning" role="note" aria-label="急救安全警告">
      <span class="first-aid__seal" aria-hidden="true">急</span>
      <div>
        <strong>先打 120，再谈其他</strong>
        <p>{{ firstAidGeneralWarning }}</p>
      </div>
    </aside>

    <div class="first-aid__grid" aria-label="按病症选择">
      <RouterLink
        v-for="(condition, index) in firstAidConditions"
        :key="condition.id"
        class="first-aid__card"
        :to="`/first-aid/${condition.id}`"
      >
        <span class="first-aid__card-index">{{ String(index + 1).padStart(2, '0') }}</span>
        <span class="first-aid__card-body">
          <strong>{{ condition.title }}</strong>
          <small>{{ condition.subtitle }}</small>
        </span>
        <span class="first-aid__card-arrow" aria-hidden="true">→</span>
      </RouterLink>
    </div>

    <p class="first-aid__source">
      据 {{ firstAidSource.title }}（{{ firstAidSource.edition }}）摘录整理；点击病症进入详情，查看识别要点、急救步骤与图示。
    </p>
  </section>
</template>

<style scoped>
.first-aid {
  padding-top: 8px;
  padding-bottom: 88px;
  scroll-margin-top: 90px;
}

.first-aid__head {
  padding-bottom: 20px;
  border-bottom: 1px solid var(--line-strong);
}

.first-aid__head strong {
  color: var(--cinnabar);
  font-weight: 500;
}

.first-aid__warning {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-top: 18px;
  padding: 18px 20px;
  border: 1px solid color-mix(in srgb, var(--cinnabar) 60%, var(--line));
  border-left: 5px solid var(--cinnabar);
  border-radius: 10px;
  background:
    linear-gradient(100deg, rgba(190, 78, 58, 0.1), rgba(255, 250, 242, 0.7)),
    rgba(255, 252, 245, 0.8);
}

.first-aid__seal {
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

.first-aid__warning strong {
  display: block;
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 1.08rem;
  font-weight: 500;
  letter-spacing: 0.04em;
}

.first-aid__warning p {
  margin-top: 5px;
  color: var(--ink-soft);
  font-size: 0.76rem;
  line-height: 1.8;
}

.first-aid__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;
}

.first-aid__card {
  display: flex;
  gap: 12px;
  align-items: center;
  min-height: 86px;
  padding: 16px 18px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255, 252, 245, 0.6);
  color: inherit;
  text-decoration: none;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    transform 0.18s ease;
}

.first-aid__card:hover {
  border-color: var(--cinnabar);
  background: rgba(190, 78, 58, 0.06);
  transform: translateY(-1px);
}

.first-aid__card-index {
  flex-shrink: 0;
  color: var(--ink-faint);
  font-family: var(--serif);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
}

.first-aid__card-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.first-aid__card-body strong {
  font-family: var(--serif);
  font-size: 1.28rem;
  font-weight: 400;
  letter-spacing: 0.05em;
}

.first-aid__card-body small {
  color: var(--ink-faint);
  font-size: 0.64rem;
  letter-spacing: 0.04em;
}

.first-aid__card-arrow {
  flex-shrink: 0;
  color: var(--cinnabar);
  font-size: 0.9rem;
  opacity: 0;
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.first-aid__card:hover .first-aid__card-arrow {
  opacity: 1;
  transform: translateX(2px);
}

.first-aid__source {
  margin-top: 12px;
  color: var(--ink-faint);
  font-size: 0.62rem;
  line-height: 1.7;
}

@media (max-width: 860px) {
  .first-aid__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .first-aid {
    padding-bottom: 64px;
  }

  .first-aid__warning {
    padding: 14px;
  }

  .first-aid__card {
    min-height: 78px;
    padding: 13px 14px;
  }

  .first-aid__card-body strong {
    font-size: 1.16rem;
  }

  .first-aid__card-arrow {
    opacity: 1;
  }
}
</style>
