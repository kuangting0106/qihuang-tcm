<script setup lang="ts">
import { computed, ref } from 'vue'
import FormulaCard from '@/components/FormulaCard.vue'
import { useTcmData } from '@/composables/useTcmData'

const { data, herbName } = useTcmData()
const query = ref('')

const formulas = computed(() => data.value?.formulas ?? [])

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return formulas.value
  return formulas.value.filter((f) => {
    const herbNames = f.composition.map((c) => c.herbName ?? herbName(c.herbId))
    const haystack = [f.name, f.pinyin, f.effects.text, ...herbNames].join(' ').toLowerCase()
    return haystack.includes(q)
  })
})
</script>

<template>
  <div class="page formula-list-page">
    <div class="container">
      <header class="page-hero">
        <div>
          <p class="eyebrow">FORMULA / 方剂</p>
          <h1>方剂</h1>
          <p class="page-hero__lead">
            原文、症状、组成、君臣佐使与加减放在同一页。
            图谱和原文证据双轨呈现；桂枝汤没有加减，就写“原文未列”，不硬编。
          </p>
        </div>
        <div class="page-hero__stat">
          <span>{{ formulas.length }}</span>
          <small>首方剂</small>
          <span>{{ formulas.reduce((n, f) => n + f.composition.length, 0) }}</span>
          <small>条组成记录</small>
        </div>
      </header>

      <section class="filter-bar paper-panel" aria-label="方剂搜索">
        <label class="search-field">
          <span class="search-field__icon" aria-hidden="true">⌕</span>
          <input v-model="query" type="search" placeholder="搜索方名、药材…" />
        </label>
        <p class="filter-hint">伤寒论方与后世方解分栏呈现；未收录药材只显示方中名称，不跳转药材页。</p>
      </section>

      <div class="result-line">
        <p>共 <strong>{{ filtered.length }}</strong> 首</p>
        <RouterLink class="text-link tiny" to="/lab/formula-scale">查看 21 味以上布局演示 →</RouterLink>
      </div>

      <div v-if="filtered.length" class="formula-grid">
        <FormulaCard v-for="f in filtered" :key="f.id" :formula="f" />
      </div>

      <div v-else class="empty-state paper-panel">
        <h2>没有找到这首方</h2>
        <p>试试方名或其中一味药。</p>
        <button class="btn btn--primary" type="button" @click="query = ''">清除搜索</button>
      </div>

      <aside class="list-note paper-panel">
        <span class="list-note__mark">方</span>
        <div>
          <strong>为什么强调“原文证据”？</strong>
          <p>
            《伤寒论》原文只列症状、药味与用量，不标君臣佐使。页面把“原文”和“后世方解”分开，
            点击出处能看到书名、条号与原文；方剂加减也逐条回到原条。
            详情页另按“一两 = 现今的一钱”列今用参考剂量，可一键切换古籍原方；方义解说逐味说明该药在方中作用。
          </p>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.page-hero {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  align-items: flex-end;
  padding: 26px 0 34px;
}

.page-hero h1 {
  margin: 6px 0 12px;
  font-size: clamp(3rem, 7vw, 5.6rem);
  letter-spacing: 0.08em;
}

.page-hero__lead {
  max-width: 680px;
  color: var(--ink-soft);
  font-size: 0.98rem;
  line-height: 1.9;
}

.page-hero__stat {
  display: grid;
  grid-template-columns: auto auto;
  gap: 0 12px;
  align-items: baseline;
  padding-left: 24px;
  border-left: 1px solid var(--line-strong);
}

.page-hero__stat span {
  font-family: var(--serif);
  font-size: 2.2rem;
  line-height: 1.2;
}

.page-hero__stat small {
  color: var(--ink-soft);
  font-size: 0.76rem;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  flex-wrap: wrap;
}

.search-field {
  flex: 1 1 280px;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.45);
}

.search-field__icon {
  color: var(--ink-faint);
  font-size: 1.1rem;
}

.search-field input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--ink);
}

.filter-hint {
  color: var(--ink-faint);
  font-size: 0.76rem;
}

.result-line {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: baseline;
  padding: 20px 2px 16px;
  color: var(--ink-soft);
  font-size: 0.82rem;
}

.result-line strong {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 1.2rem;
}

.formula-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.list-note {
  margin-top: 36px;
  padding: 20px 22px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.list-note__mark {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--cinnabar-pale);
  color: var(--cinnabar);
  font-family: var(--serif);
}

.list-note strong {
  font-family: var(--serif);
  font-size: 0.98rem;
}

.list-note p {
  margin-top: 4px;
  color: var(--ink-soft);
  font-size: 0.82rem;
  line-height: 1.8;
}

@media (max-width: 960px) {
  .page-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-hero__stat {
    border-left: 0;
    padding-left: 0;
  }

  .formula-grid {
    grid-template-columns: 1fr;
  }
}
</style>
