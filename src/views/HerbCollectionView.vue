<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import HerbIndexCard, { type HerbIndexItem } from '@/components/HerbIndexCard.vue'
import { useHerbApi, type HerbCollectionPayload } from '@/composables/useHerbApi'

const route = useRoute()
const { loading, error, fetchHerbCollection } = useHerbApi()

const kind = computed(() => (route.meta.collectionKind === 'category' ? 'category' : 'rank'))
const key = computed(() => String(route.params.key ?? ''))
const query = ref('')
const payload = ref<HerbCollectionPayload | null>(null)

async function load() {
  payload.value = null
  query.value = ''
  try {
    payload.value = await fetchHerbCollection(kind.value, key.value)
  } catch {
    // 错误信息由 composable 的 error 展示。
  }
}

watch([kind, key], load, { immediate: true })

const title = computed(() => payload.value?.title ?? '药材索引')
const subtitle = computed(() => payload.value?.subtitle ?? '按功效分类阅读')
const description = computed(
  () =>
    payload.value?.description ??
    '功效分类是本站导航标签，不是经典原文；同一味药可以同时出现在多个分类中。',
)

function matches(item: HerbIndexItem) {
  const q = query.value.trim().toLowerCase()
  if (!q) return true
  return [item.name, item.pinyin, item.effects, ...item.flavors, ...item.meridians]
    .join(' ')
    .toLowerCase()
    .includes(q)
}

const items = computed<HerbIndexItem[]>(() => (payload.value?.items ?? []).filter(matches))
</script>

<template>
  <div class="page collection-page">
    <div class="container">
      <div v-if="error" class="data-error paper-panel">
        <p>{{ error }}</p>
        <button class="btn btn--primary" type="button" @click="load">重新加载</button>
      </div>
      <p v-else-if="loading && !payload" class="data-loading">正在加载分类药材…</p>

      <nav class="crumbs" aria-label="面包屑">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/herbs">本草</RouterLink>
        <span>/</span>
        <strong>{{ title }}</strong>
      </nav>

      <header class="collection-head">
        <div>
          <p class="eyebrow">{{ kind === 'rank' ? 'THREE RANKS / 三经' : 'THERAPY / 功效分类' }}</p>
          <h1>{{ title }}</h1>
          <p class="collection-head__subtitle">{{ subtitle }}</p>
          <p class="collection-head__desc">{{ description }}</p>
        </div>
        <div class="collection-head__count">
          <strong>{{ payload?.count ?? 0 }}</strong>
          <span>味可查</span>
        </div>
      </header>

      <div class="collection-tools paper-panel">
        <label class="search-field">
          <span class="search-field__icon" aria-hidden="true">⌕</span>
          <input v-model="query" type="search" :placeholder="`在${title}中搜索药名、拼音、功效…`" />
        </label>
        <p>
          共 <strong>{{ items.length }}</strong> 味
          <span v-if="query.trim()">· 已筛选</span>
        </p>
      </div>

      <div v-if="items.length" class="collection-grid">
        <HerbIndexCard v-for="item in items" :key="item.id" :item="item" />
      </div>

      <div v-else class="empty-state paper-panel">
        <h2>没有找到这味药</h2>
        <p>换个药名或清除搜索词再试。</p>
        <button class="btn btn--primary" type="button" @click="query = ''">清除搜索</button>
      </div>

      <nav class="collection-foot" aria-label="返回本草索引">
        <RouterLink class="text-link" to="/herbs">← 返回本草总览</RouterLink>
        <p>
          同一味药在三经与功效分类中各有一条索引；进入药页后，可再从页首索引跳到另一套分类。
          分类只作阅读标签，不是经典原文。
        </p>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.data-error {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-top: 18px;
  padding: 14px 16px;
  color: var(--cinnabar);
  font-size: 0.82rem;
}

.data-loading {
  margin-top: 18px;
  color: var(--ink-faint);
  font-size: 0.78rem;
}

.collection-page {
  padding-bottom: 64px;
}

.crumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  align-items: baseline;
  padding: 22px 0 0;
  color: var(--ink-faint);
  font-size: 0.72rem;
}

.crumbs a {
  color: inherit;
  text-decoration: none;
}

.crumbs a:hover {
  color: var(--cinnabar);
}

.collection-head {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  align-items: flex-end;
  padding: 28px 0 30px;
  border-bottom: 1px solid var(--line-strong);
}

.collection-head h1 {
  margin: 6px 0 8px;
  font-family: var(--serif);
  font-size: clamp(2.4rem, 5.4vw, 4.2rem);
  font-weight: 400;
  letter-spacing: 0.06em;
}

.collection-head__subtitle {
  color: var(--cinnabar);
  font-size: 0.82rem;
  letter-spacing: 0.08em;
}

.collection-head__desc {
  max-width: 760px;
  margin-top: 10px;
  color: var(--ink-soft);
  font-size: 0.82rem;
  line-height: 1.85;
}

.collection-head__count {
  flex-shrink: 0;
  display: grid;
  justify-items: end;
  padding-left: 24px;
  border-left: 1px solid var(--line-strong);
}

.collection-head__count strong {
  font-family: var(--serif);
  font-size: 2.1rem;
  font-weight: 400;
  line-height: 1.1;
}

.collection-head__count span {
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.collection-tools {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
  margin: 20px 0 18px;
  padding: 12px 16px;
}

.collection-tools p {
  color: var(--ink-faint);
  font-size: 0.72rem;
  white-space: nowrap;
}

.collection-tools strong {
  color: var(--ink);
  font-family: var(--serif);
  font-size: 1rem;
}

.collection-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

.collection-foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px 28px;
  margin-top: 28px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
  color: var(--ink-faint);
  font-size: 0.7rem;
  line-height: 1.8;
}

.collection-foot p {
  max-width: 620px;
}

.collection-foot a {
  color: inherit;
}

@media (max-width: 1240px) {
  .collection-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .collection-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .collection-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .collection-head__count {
    justify-items: start;
    padding-left: 0;
    border-left: 0;
  }
}

@media (max-width: 700px) {
  .collection-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .collection-tools {
    align-items: stretch;
    flex-direction: column;
  }
}

@media (max-width: 520px) {
  .collection-grid {
    grid-template-columns: 1fr;
  }
}
</style>
