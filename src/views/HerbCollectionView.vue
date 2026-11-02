<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import HerbIndexCard, { type HerbIndexItem } from '@/components/HerbIndexCard.vue'
import { loadBencaoCatalog } from '@/composables/useBencaoLectures'
import { useTcmData } from '@/composables/useTcmData'
import type { BencaoCatalog } from '@/types/bencao'

const route = useRoute()
const { data, meridianName } = useTcmData()

const kind = computed(() => (route.meta.collectionKind === 'category' ? 'category' : 'rank'))
const key = computed(() => String(route.params.key ?? ''))
const query = ref('')
const catalog = ref<BencaoCatalog | null>(null)

onMounted(async () => {
  try {
    catalog.value = await loadBencaoCatalog()
  } catch {
    catalog.value = null
  }
})

const herbs = computed(() => data.value?.herbs ?? [])
const taxonomy = computed(() => data.value?.herbTaxonomy ?? null)

const rankMeta = computed(() => {
  if (kind.value !== 'rank') return null
  const classic = taxonomy.value?.ranks.find((rank) => rank.id === key.value)
  if (classic) return { title: classic.title, subtitle: classic.subtitle, description: classic.description }
  const extra = catalog.value?.ranks.find((rank) => rank.id === key.value)
  if (!extra) return null
  return {
    title: extra.title,
    subtitle: extra.subtitle,
    description:
      extra.id === 'nishi'
        ? '《伤寒论》《金匮要略》所用而《神农本草经》未收的药物，倪海厦另列并附使用说明。'
        : '课程整理者增补的常用药，不属于倪海厦原讲义正文；只作阅读索引。',
  }
})

const categoryMeta = computed(() => {
  if (kind.value !== 'category') return null
  return taxonomy.value?.categories.find((category) => category.id === key.value) ?? null
})

const title = computed(() => rankMeta.value?.title ?? categoryMeta.value?.title ?? '药材索引')
const subtitle = computed(() => rankMeta.value?.subtitle ?? '按功效分类阅读')
const description = computed(
  () =>
    rankMeta.value?.description ??
    categoryMeta.value?.description ??
    '功效分类是本站导航标签，不是经典原文；同一味药可以同时出现在多个分类中。',
)

const curatedMatched = computed(() => {
  const list = herbs.value
  if (kind.value === 'rank') return list.filter((herb) => herb.classicRankId === key.value)
  return list.filter((herb) => herb.therapyCategoryIds.includes(key.value))
})

const lectureMatched = computed(() => {
  const items = catalog.value?.items ?? []
  return items.filter((item) => {
    if (item.curatedId) return false
    if (kind.value === 'rank') return item.rankId === key.value
    return item.therapyCategoryIds.includes(key.value)
  })
})

function matches(text: string) {
  const q = query.value.trim().toLowerCase()
  if (!q) return true
  return text.toLowerCase().includes(q)
}

const items = computed<HerbIndexItem[]>(() => {
  const curated = curatedMatched.value
    .filter((herb) =>
      matches(
        [herb.name, herb.pinyin, ...herb.aliases, herb.properties.effects.text, herb.properties.indications.text].join(
          ' ',
        ),
      ),
    )
    .map((herb) => ({
      id: `herb-${herb.id}`,
      name: herb.name,
      pinyin: herb.pinyin,
      flavors: herb.flavorTags,
      meridians: herb.meridianIds.map((id) => meridianName(id)),
      effects: herb.properties.effects.text,
      href: `/herbs/${herb.id}`,
      cover: herb.images[0]?.url,
      coverAlt: herb.images[0]?.alt,
      seal: herb.name.slice(0, 1),
      badge: '药典依据',
      source: `中华人民共和国药典 · ${herb.name}`,
    }))

  const lecture = lectureMatched.value
    .filter((item) => matches([item.name, item.pinyin, ...item.aliases, item.effects, item.indications].join(' ')))
    .map((item) => ({
      id: item.key,
      name: item.name,
      pinyin: item.pinyin,
      flavors: [...item.flavorTags, item.nature].filter(Boolean),
      meridians: item.meridianNames,
      effects: item.summary,
      href: `/bencao/${item.groupId}/${item.entryId}`,
      seal: item.name.slice(0, 1),
      badge: item.rankId === 'nishi' ? '经方补列' : item.rankId === 'editor' ? '整理者增补' : '讲义整理',
      source: '倪海厦《神农本草经》讲义',
    }))

  return [...curated, ...lecture]
})

const totalWithoutQuery = computed(() => curatedMatched.value.length + lectureMatched.value.length)
</script>

<template>
  <div class="page collection-page">
    <div class="container">
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
          <strong>{{ totalWithoutQuery }}</strong>
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
