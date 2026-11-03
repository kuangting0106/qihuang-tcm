<script setup lang="ts">
import quickref from '@/data/acupuncture-quickref.json'
</script>

<template>
  <section class="penetrations" aria-labelledby="penetrations-title">
    <div class="penetrations__head">
      <div>
        <p class="eyebrow">THROUGH NEEDLING / 透针</p>
        <h2 id="penetrations-title">31 条透针透穴</h2>
        <p class="penetrations__intro">{{ quickref.penetrationIntro }}</p>
        <p class="penetrations__source">
          来源：《215条针灸经验穴位和31条透针透穴》；保留各条治症、来源与治案。
        </p>
      </div>
      <span class="chip chip--gold">{{ quickref.penetrations.length }} 条</span>
    </div>

    <div class="penetrations__list">
      <article
        v-for="item in quickref.penetrations"
        :id="item.id"
        :key="item.id"
        class="penetration paper-panel"
      >
        <header class="penetration__head">
          <span class="penetration__index">{{ String(item.order).padStart(2, '0') }}</span>
          <h3>{{ item.title }}</h3>
        </header>
        <div class="penetration__field">
          <span>治症</span>
          <p>{{ item.indications }}</p>
        </div>
        <div class="penetration__field">
          <span>来源</span>
          <p>{{ item.source }}</p>
        </div>
        <div v-if="item.notes" class="penetration__field penetration__field--note">
          <span>临证心悟</span>
          <p>{{ item.notes }}</p>
        </div>
        <blockquote v-if="item.case" class="penetration__case">
          <span>治案</span>
          <p>{{ item.case }}</p>
        </blockquote>
      </article>
    </div>
  </section>
</template>

<style scoped>
.penetrations__head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-end;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line-strong);
}

.penetrations__head h2 {
  margin: 4px 0 6px;
  font-family: var(--serif);
  font-size: 1.6rem;
  font-weight: 400;
}

.penetrations__intro {
  max-width: 800px;
  color: var(--ink-soft);
  font-size: 0.74rem;
  line-height: 1.85;
}

.penetrations__source {
  margin-top: 5px;
  color: var(--ink-faint);
  font-size: 0.62rem;
  line-height: 1.7;
}

.penetrations__list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.penetration {
  padding: 16px 17px;
  scroll-margin-top: 96px;
}

.penetration__head {
  display: flex;
  gap: 9px;
  align-items: baseline;
}

.penetration__index {
  flex-shrink: 0;
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.78rem;
}

.penetration h3 {
  font-family: var(--serif);
  font-size: 1.08rem;
  font-weight: 500;
  line-height: 1.5;
}

.penetration__field {
  margin-top: 9px;
}

.penetration__field span {
  color: var(--jade);
  font-size: 0.58rem;
  letter-spacing: 0.1em;
}

.penetration__field p {
  margin-top: 2px;
  color: var(--ink-soft);
  font-size: 0.7rem;
  line-height: 1.75;
}

.penetration__field--note {
  padding-top: 8px;
  border-top: 1px dashed var(--line);
}

.penetration__field--note span {
  color: var(--cinnabar);
}

.penetration__case {
  margin: 9px 0 0;
  padding: 8px 10px;
  border: 1px dashed var(--line-strong);
  background: rgba(190, 92, 72, 0.035);
}

.penetration__case span {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.64rem;
}

.penetration__case p {
  margin-top: 3px;
  color: var(--ink-soft);
  font-size: 0.68rem;
  line-height: 1.75;
}

@media (max-width: 900px) {
  .penetrations__list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .penetrations__head {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
