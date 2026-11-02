<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { formatCharCount, loadBencaoGroup, loadBencaoIndex } from '@/composables/useBencaoLectures'
import type { BencaoGroup, BencaoLectureIndex } from '@/types/bencao'

const route = useRoute()
const index = ref<BencaoLectureIndex | null>(null)
const group = ref<BencaoGroup | null>(null)
const loading = ref(true)
const error = ref('')
const query = ref('')

const groupId = computed(() => String(route.params.groupId ?? ''))

async function load(id: string) {
  loading.value = true
  error.value = ''
  group.value = null
  query.value = ''
  try {
    const [library, payload] = await Promise.all([loadBencaoIndex(), loadBencaoGroup(id)])
    index.value = library
    group.value = payload
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : '讲义目录加载失败'
  } finally {
    loading.value = false
  }
}

watch(groupId, (id) => { if (id) load(id) }, { immediate: true })

const filtered = computed(() => {
  const entries = group.value?.entries ?? []
  const q = query.value.trim()
  if (!q) return entries
  return entries.filter(
    (entry) => entry.title.includes(q) || entry.subtitle.includes(q) || entry.note?.includes(q),
  )
})

const totalChars = computed(() =>
  (group.value?.entries ?? []).reduce((sum, entry) => sum + entry.charCount, 0),
)
</script>

<template>
  <div class="page bencao-group">
    <div class="container">
      <nav class="breadcrumbs" aria-label="面包屑">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/herbs">本草</RouterLink>
        <span>/</span>
        <RouterLink to="/bencao">神农本草经讲义</RouterLink>
        <span>/</span>
        <span>{{ group?.title ?? '目录' }}</span>
      </nav>

      <p v-if="loading" class="group-state paper-panel">正在展开目录…</p>
      <div v-else-if="error" class="group-state paper-panel">
        <h1>目录没有打开</h1>
        <p>{{ error }}</p>
        <RouterLink class="btn btn--primary" to="/bencao">返回讲义首页</RouterLink>
      </div>

      <template v-else-if="group">
        <header class="group-head">
          <div>
            <p class="eyebrow">LECTURE GROUP / 讲义分组</p>
            <h1>{{ group.title }}</h1>
            <p class="group-head__subtitle">{{ group.subtitle }}</p>
            <p class="group-head__desc">{{ group.description }}</p>
          </div>
          <dl class="group-head__stats">
            <div><dt>{{ group.entries.length }}</dt><dd>条</dd></div>
            <div><dt>{{ formatCharCount(totalChars) }}</dt><dd>讲义</dd></div>
          </dl>
        </header>

        <p v-if="group.id === 'editor'" class="group-caution">
          本组为课程整理者增补的常用药，不是倪海厦原讲义正文；请与「倪师补充药物」及三经正文分开阅读。
        </p>

        <nav class="group-switch" aria-label="切换讲义分组">
          <RouterLink
            v-for="item in index?.groups ?? []"
            :key="item.id"
            :to="`/bencao/${item.id}`"
            :class="{ 'is-active': item.id === group.id }"
          >
            {{ item.title }}
            <small>{{ item.count }}</small>
          </RouterLink>
        </nav>

        <div class="group-tools">
          <label class="group-search">
            <span class="visually-hidden">搜索本组药名</span>
            <input v-model="query" type="search" :placeholder="`在「${group.title}」中搜索药名`" />
          </label>
          <p class="group-tools__count">
            共 <strong>{{ filtered.length }}</strong> 条
            <span v-if="query.trim()">· 已筛选</span>
          </p>
        </div>

        <div v-if="filtered.length" class="entry-grid">
          <RouterLink
            v-for="entry in filtered"
            :key="entry.id"
            class="entry-card paper-panel"
            :to="`/bencao/${group.id}/${entry.id}`"
          >
            <span class="entry-card__number">{{ entry.number !== null ? String(entry.number).padStart(3, '0') : '导读' }}</span>
            <span class="entry-card__body">
              <span class="entry-card__title">{{ entry.title }}</span>
              <span class="entry-card__meta">
                {{ entry.sections.length }} 节 · {{ formatCharCount(entry.charCount) }}
              </span>
            </span>
            <span class="entry-card__arrow" aria-hidden="true">→</span>
          </RouterLink>
        </div>

        <div v-else class="group-state paper-panel">
          <h2>没有找到这味药</h2>
          <p>试试只输入一个字，或清除搜索。</p>
          <button class="btn btn--ghost btn--small" type="button" @click="query = ''">清除搜索</button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.group-head {
  display: flex;
  justify-content: space-between;
  gap: 36px;
  align-items: flex-end;
  padding: 24px 0 28px;
}

.group-head h1 {
  margin: 6px 0 8px;
  font-size: clamp(2.4rem, 5vw, 3.8rem);
  letter-spacing: 0.06em;
}

.group-head__subtitle {
  color: var(--jade);
  font-family: var(--serif);
  font-size: 1rem;
}

.group-head__desc {
  max-width: 700px;
  margin-top: 10px;
  color: var(--ink-soft);
  font-size: 0.82rem;
  line-height: 1.9;
  white-space: pre-line;
}

.group-head__stats {
  display: flex;
  gap: 22px;
  flex: 0 0 auto;
  padding-left: 22px;
  border-left: 1px solid var(--line-strong);
}

.group-head__stats dt {
  font-family: var(--serif);
  font-size: 1.5rem;
  line-height: 1.2;
}

.group-head__stats dd {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.66rem;
}

.group-caution {
  margin-bottom: 14px;
  padding: 10px 14px;
  border: 1px dashed var(--cinnabar);
  border-radius: 10px;
  background: rgba(241, 221, 214, 0.32);
  color: var(--cinnabar);
  font-size: 0.72rem;
  line-height: 1.8;
}

.group-switch {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.group-switch a {
  display: inline-flex;
  gap: 6px;
  align-items: baseline;
  padding: 5px 11px;
  border-radius: 999px;
  color: var(--ink-soft);
  font-size: 0.76rem;
}

.group-switch a small {
  color: var(--ink-faint);
  font-size: 0.6rem;
}

.group-switch a:hover {
  background: rgba(47, 93, 87, 0.06);
}

.group-switch a.is-active {
  background: var(--jade);
  color: var(--paper);
}

.group-switch a.is-active small {
  color: rgba(244, 239, 228, 0.72);
}

.group-tools {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
  margin: 18px 0 14px;
}

.group-search input {
  width: min(280px, 60vw);
  padding: 7px 12px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: rgba(255, 252, 245, 0.7);
  font-size: 0.78rem;
  outline: none;
}

.group-search input:focus {
  border-color: var(--jade-2);
}

.group-tools__count {
  color: var(--ink-soft);
  font-size: 0.72rem;
}

.group-tools__count strong {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 1rem;
}

.entry-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.entry-card {
  display: flex;
  gap: 9px;
  align-items: center;
  padding: 10px 12px;
  transition: border-color 0.16s ease, background 0.16s ease;
}

.entry-card:hover {
  border-color: var(--jade-2);
  background: rgba(255, 252, 245, 0.9);
}

.entry-card__number {
  flex: 0 0 auto;
  color: var(--gold);
  font-family: var(--serif);
  font-size: 0.68rem;
  letter-spacing: 0.04em;
}

.entry-card__body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.entry-card__title {
  overflow: hidden;
  font-family: var(--serif);
  font-size: 0.95rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-card__meta {
  color: var(--ink-faint);
  font-size: 0.6rem;
}

.entry-card__arrow {
  margin-left: auto;
  color: var(--ink-faint);
  font-size: 0.7rem;
}

.group-state {
  padding: 26px;
  color: var(--ink-soft);
}

.group-state h1,
.group-state h2 {
  margin-bottom: 8px;
}

@media (max-width: 1000px) {
  .entry-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .group-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }

  .group-head__stats {
    padding-left: 0;
    border-left: 0;
  }

  .entry-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  .entry-grid {
    grid-template-columns: 1fr;
  }

  .group-tools {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .group-search input {
    width: 100%;
  }
}
</style>
