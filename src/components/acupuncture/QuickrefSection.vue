<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import quickref from '@/data/acupuncture-quickref.json'

const showOriginal = ref(true)
const tableColumns = [
  { key: 'jing', label: '井' },
  { key: 'ying', label: '荥' },
  { key: 'shu', label: '输' },
  { key: 'jingRiver', label: '经' },
  { key: 'he', label: '合' },
  { key: 'child', label: '子' },
  { key: 'mother', label: '母' },
  { key: 'yuan', label: '原' },
  { key: 'luo', label: '络' },
  { key: 'mu', label: '募' },
  { key: 'xi', label: '郄' },
] as const
</script>

<template>
  <section class="quickref" aria-labelledby="quickref-title">
    <div class="quickref__head">
      <div>
        <p class="eyebrow">TWELVE MERIDIANS / 十二经</p>
        <h2 id="quickref-title">十二经穴位速查</h2>
        <p class="quickref__quote">“{{ quickref.quote }}”</p>
        <p class="quickref__source">{{ quickref.source }}</p>
      </div>
      <button class="quickref__toggle" type="button" @click="showOriginal = !showOriginal">
        {{ showOriginal ? '收起原图' : '查看原图' }}
      </button>
    </div>

    <figure v-if="showOriginal" class="quickref__figure">
      <a :href="quickref.image" target="_blank" rel="noopener noreferrer">
        <img :src="quickref.image" :alt="quickref.imageAlt" />
      </a>
      <figcaption>点击原图可放大查看。表格数据按原图逐格录入。</figcaption>
    </figure>

    <div class="quickref__table-wrap">
      <table class="quickref__table">
        <thead>
          <tr>
            <th class="quickref__name">经络</th>
            <th>五行</th>
            <th>时辰</th>
            <th v-for="column in tableColumns" :key="column.key">{{ column.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in quickref.meridians" :key="row.id">
            <th class="quickref__name">
              <RouterLink :to="`/meridians/${row.id}`">{{ row.name }}</RouterLink>
            </th>
            <td>{{ row.element }}</td>
            <td class="quickref__hours">{{ row.hours }}</td>
            <td v-for="column in tableColumns" :key="column.key">{{ row[column.key] }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="quickref__grid">
      <section class="quickref__card paper-panel">
        <h3>五输穴特点</h3>
        <div class="quickref__scroll">
          <table class="quickref__mini">
            <thead>
              <tr><th>五输</th><th>特点</th><th>主治</th><th>举例</th></tr>
            </thead>
            <tbody>
              <tr v-for="item in quickref.fiveShu" :key="item.name">
                <th>{{ item.name }}</th>
                <td>{{ item.feature }}</td>
                <td>{{ item.indication }}</td>
                <td>{{ item.example }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="quickref__card paper-panel">
        <h3>十二经五输配五行</h3>
        <div class="quickref__scroll">
          <table class="quickref__mini">
            <thead>
              <tr><th>经</th><th>井</th><th>荥</th><th>输</th><th>经</th><th>合</th></tr>
            </thead>
            <tbody>
              <tr v-for="item in quickref.fiveShuElements" :key="item.yinYang">
                <th>{{ item.yinYang }}</th>
                <td>{{ item.jing }}</td>
                <td>{{ item.ying }}</td>
                <td>{{ item.shu }}</td>
                <td>{{ item.jingRiver }}</td>
                <td>{{ item.he }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="quickref__card paper-panel">
        <h3>八脉交会</h3>
        <ul class="quickref__list">
          <li v-for="item in quickref.eightVessels" :key="item.vessel">
            <strong>{{ item.vessel }}</strong>
            <span>{{ item.point }} · {{ item.meridian }}</span>
          </li>
        </ul>
      </section>

      <section class="quickref__card paper-panel">
        <h3>八会穴</h3>
        <ul class="quickref__list quickref__list--two">
          <li v-for="item in quickref.eightMeeting" :key="item.name">
            <strong>{{ item.name }}</strong>
            <span>{{ item.point }} · {{ item.note }}</span>
          </li>
        </ul>
      </section>

      <section class="quickref__card quickref__card--wide paper-panel">
        <h3>子母穴与季节</h3>
        <ul class="quickref__rules">
          <li v-for="rule in quickref.rules" :key="rule">{{ rule }}</li>
        </ul>
        <p class="quickref__cycle">
          {{ quickref.elementCycle.generating }}<br />
          {{ quickref.elementCycle.controlling }}
        </p>
      </section>
    </div>
  </section>
</template>

<style scoped>
.quickref__head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-end;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line-strong);
}

.quickref__head h2 {
  margin: 4px 0 6px;
  font-family: var(--serif);
  font-size: 1.6rem;
  font-weight: 400;
}

.quickref__quote {
  color: var(--ink-soft);
  font-family: var(--serif);
  font-size: 0.88rem;
  line-height: 1.8;
}

.quickref__source {
  margin-top: 4px;
  color: var(--ink-faint);
  font-size: 0.64rem;
  line-height: 1.7;
}

.quickref__toggle {
  flex-shrink: 0;
  padding: 7px 12px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: transparent;
  color: var(--jade);
  font: inherit;
  font-size: 0.7rem;
  cursor: pointer;
}

.quickref__figure {
  margin: 14px 0 0;
  padding: 10px;
  border: 1px solid var(--line);
  background: var(--paper-2);
}

.quickref__figure img {
  width: 100%;
  height: auto;
}

.quickref__figure figcaption {
  margin-top: 6px;
  color: var(--ink-faint);
  font-size: 0.62rem;
  text-align: center;
}

.quickref__table-wrap {
  margin-top: 14px;
  overflow-x: auto;
  border: 1px solid var(--line);
  background: rgba(255, 252, 245, 0.62);
}

.quickref__table {
  width: 100%;
  min-width: 1060px;
  border-collapse: collapse;
  font-size: 0.68rem;
  line-height: 1.5;
}

.quickref__table th,
.quickref__table td {
  padding: 7px 8px;
  border-right: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  text-align: center;
  vertical-align: middle;
  white-space: nowrap;
}

.quickref__table thead th {
  background: rgba(40, 92, 69, 0.08);
  color: var(--jade);
  font-weight: 500;
  letter-spacing: 0.04em;
}

.quickref__name {
  background: rgba(190, 92, 72, 0.06);
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.76rem;
  font-weight: 500;
  text-align: left !important;
}

.quickref__name a {
  color: inherit;
  text-decoration: none;
}

.quickref__name a:hover {
  text-decoration: underline;
}

.quickref__hours {
  color: var(--ink-soft);
  font-size: 0.64rem;
}

.quickref__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.quickref__card {
  padding: 16px 18px;
}

.quickref__card--wide {
  grid-column: span 2;
}

.quickref__card h3 {
  margin-bottom: 10px;
  font-family: var(--serif);
  font-size: 1.06rem;
  font-weight: 500;
}

.quickref__scroll {
  overflow-x: auto;
}

.quickref__mini {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.68rem;
  line-height: 1.5;
}

.quickref__mini th,
.quickref__mini td {
  padding: 5px 7px;
  border: 1px solid var(--line);
  text-align: center;
  white-space: nowrap;
}

.quickref__mini thead th {
  background: rgba(40, 92, 69, 0.07);
  color: var(--jade);
  font-weight: 500;
}

.quickref__mini tbody th {
  color: var(--cinnabar);
  font-weight: 500;
}

.quickref__list {
  display: grid;
  gap: 7px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.72rem;
}

.quickref__list--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.quickref__list li {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  padding-bottom: 6px;
  border-bottom: 1px dashed var(--line);
}

.quickref__list strong {
  color: var(--jade);
  font-weight: 500;
}

.quickref__list span {
  color: var(--ink-soft);
  text-align: right;
}

.quickref__rules {
  display: grid;
  gap: 6px;
  margin: 0;
  padding-left: 1.15em;
  color: var(--ink-soft);
  font-size: 0.72rem;
  line-height: 1.75;
}

.quickref__cycle {
  margin-top: 10px;
  padding-top: 9px;
  border-top: 1px dashed var(--line);
  color: var(--ink-faint);
  font-size: 0.68rem;
  line-height: 1.8;
}

@media (max-width: 820px) {
  .quickref__grid {
    grid-template-columns: 1fr;
  }

  .quickref__card--wide {
    grid-column: auto;
  }

  .quickref__head {
    align-items: flex-start;
    flex-direction: column;
  }

  .quickref__list--two {
    grid-template-columns: 1fr;
  }
}
</style>
