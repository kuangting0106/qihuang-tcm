<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { formatCharCount, loadBencaoIndex } from '@/composables/useBencaoLectures'
import type { BencaoLectureIndex } from '@/types/bencao'

const index = ref<BencaoLectureIndex | null>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    index.value = await loadBencaoIndex()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : '讲义目录加载失败'
  } finally {
    loading.value = false
  }
})

const mainGroups = computed(() =>
  (index.value?.groups ?? []).filter((item) => ['shangjing', 'zhongjing', 'xiajing'].includes(item.id)),
)
const supplementGroups = computed(() =>
  (index.value?.groups ?? []).filter((item) => ['nishi', 'editor'].includes(item.id)),
)

const totalEntries = computed(() =>
  (index.value?.groups ?? []).reduce((sum, item) => sum + item.count, 0),
)
const totalChars = computed(() =>
  (index.value?.groups ?? []).reduce((sum, item) => sum + item.charCount, 0),
)
</script>

<template>
  <div class="page bencao-library">
    <div class="container">
      <nav class="breadcrumbs" aria-label="面包屑">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/herbs">本草</RouterLink>
        <span>/</span>
        <span>神农本草经讲义</span>
      </nav>

      <header class="library-hero">
        <div>
          <p class="eyebrow">BENCAO LECTURES / 本草讲记</p>
          <h1>神农本草经<br />讲义</h1>
          <p class="library-hero__lead">
            倪海厦「人纪」课程第三部，按《神农本草经》上经、中经、下经逐味讲解，
            并补入《伤寒论》《金匮要略》所用而《本经》未收的药物。
          </p>
          <div class="library-hero__meta">
            <span class="chip chip--jade">{{ totalEntries }} 条</span>
            <span class="chip">6 组</span>
            <span class="chip chip--gold">{{ formatCharCount(totalChars) }}</span>
          </div>
        </div>
        <div class="library-hero__seal" aria-hidden="true">本</div>
      </header>

      <p v-if="loading" class="library-state paper-panel">正在展开讲义…</p>
      <div v-else-if="error" class="library-state paper-panel">
        <h2>讲义没有打开</h2>
        <p>{{ error }}</p>
        <RouterLink class="btn btn--primary" to="/herbs">返回本草</RouterLink>
      </div>

      <template v-else-if="index">
        <aside class="source-note paper-panel">
          <span class="source-note__mark">源</span>
          <div>
            <strong>{{ index.source.title }}</strong>
            <p>{{ index.source.note }}</p>
            <p class="source-note__meta">
              讲授：{{ index.source.author }} · {{ index.source.course }} ·
              底本：{{ index.source.repository }} @ {{ index.source.commit.slice(0, 7) }}
            </p>
          </div>
        </aside>

        <section class="library-section" aria-labelledby="intro-title">
          <div class="library-section__head">
            <div>
              <p class="eyebrow">OPENING / 开篇</p>
              <h2 id="intro-title">课程导读</h2>
            </div>
            <p>先读自序、前言与药性总义，再进入逐味讲解。</p>
          </div>

          <div class="intro-list">
            <RouterLink
              v-for="item in index.intro"
              :key="item.id"
              class="intro-card paper-panel"
              :to="`/bencao/intro/${item.id}`"
            >
              <span class="intro-card__title">{{ item.title }}</span>
              <span class="intro-card__meta">{{ item.subtitle }} · {{ formatCharCount(item.charCount) }}</span>
              <span class="intro-card__arrow" aria-hidden="true">→</span>
            </RouterLink>
          </div>
        </section>

        <section class="library-section" aria-labelledby="three-ranks">
          <div class="library-section__head">
            <div>
              <p class="eyebrow">THREE RANKS / 三品</p>
              <h2 id="three-ranks">上经 · 中经 · 下经</h2>
            </div>
            <p>上药养命，中药遏病，下药除邪；逐味讲义保留底稿条文与课堂讲授的分层。</p>
          </div>

          <div class="group-grid">
            <RouterLink
              v-for="item in mainGroups"
              :key="item.id"
              class="group-card paper-panel"
              :to="`/bencao/${item.id}`"
            >
              <span class="group-card__top">
                <span class="group-card__title">{{ item.title }}</span>
                <span class="group-card__count">{{ item.count }} 味</span>
              </span>
              <span class="group-card__subtitle">{{ item.subtitle }}</span>
              <span class="group-card__desc">{{ item.description }}</span>
              <span class="group-card__meta">{{ formatCharCount(item.charCount) }} · 查看目录 →</span>
            </RouterLink>
          </div>
        </section>

        <section class="library-section" aria-labelledby="supplements">
          <div class="library-section__head">
            <div>
              <p class="eyebrow">SUPPLEMENTS / 补列</p>
              <h2 id="supplements">经方所用与整理者增补</h2>
            </div>
            <p>「倪师补充」与「小编补充」来源不同，阅读时分开看待。</p>
          </div>

          <div class="group-grid group-grid--two">
            <RouterLink
              v-for="item in supplementGroups"
              :key="item.id"
              class="group-card paper-panel"
              :class="{ 'group-card--caution': item.id === 'editor' }"
              :to="`/bencao/${item.id}`"
            >
              <span class="group-card__top">
                <span class="group-card__title">{{ item.title }}</span>
                <span class="group-card__count">{{ item.count }} 味</span>
              </span>
              <span class="group-card__subtitle">{{ item.subtitle }}</span>
              <span class="group-card__desc">{{ item.description }}</span>
              <span class="group-card__meta">{{ formatCharCount(item.charCount) }} · 查看目录 →</span>
            </RouterLink>
          </div>
        </section>

        <div class="library-foot">
          <p>
            讲义条目按「本经原文 / 后世注家 / 讲义归纳 / 倪师按 / 课堂讲授」分层标注；
            条文未经校勘，引用请回原书核对。
          </p>
          <RouterLink class="btn btn--ghost btn--small" to="/herbs">
            返回本草 · 药性基础法则
          </RouterLink>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.library-hero {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  align-items: flex-end;
  padding: 26px 0 34px;
}

.library-hero h1 {
  margin: 6px 0 14px;
  font-size: clamp(2.6rem, 6vw, 4.6rem);
  letter-spacing: 0.06em;
}

.library-hero__lead {
  max-width: 660px;
  color: var(--ink-soft);
  font-size: 0.98rem;
  line-height: 1.9;
}

.library-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.library-hero__seal {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 96px;
  height: 96px;
  border: 1px solid var(--cinnabar);
  border-radius: 6px;
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 2.4rem;
  transform: rotate(-4deg);
  opacity: 0.72;
}

.library-state {
  padding: 28px;
  color: var(--ink-soft);
}

.source-note {
  display: flex;
  gap: 16px;
  padding: 16px 18px;
  border-left: 3px solid var(--gold);
  background: rgba(237, 224, 200, 0.32);
}

.source-note__mark {
  flex: 0 0 auto;
  color: var(--gold);
  font-family: var(--serif);
  font-size: 1.5rem;
  line-height: 1.2;
}

.source-note strong {
  font-size: 0.9rem;
}

.source-note p {
  margin-top: 4px;
  color: var(--ink-soft);
  font-size: 0.78rem;
  line-height: 1.8;
}

.source-note__meta {
  color: var(--ink-faint) !important;
  font-size: 0.68rem !important;
}

.library-section {
  margin-top: 34px;
  padding-top: 24px;
  border-top: 1px solid var(--line-strong);
}

.library-section__head {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  align-items: flex-end;
  margin-bottom: 16px;
}

.library-section__head h2 {
  margin-top: 4px;
  font-size: 1.55rem;
}

.library-section__head > p {
  max-width: 460px;
  color: var(--ink-soft);
  font-size: 0.76rem;
  line-height: 1.8;
  text-align: right;
}

.intro-list {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.intro-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 15px;
  transition: border-color 0.18s ease, transform 0.18s ease;
}

.intro-card:hover {
  border-color: var(--jade-2);
  transform: translateY(-2px);
}

.intro-card__title {
  font-family: var(--serif);
  font-size: 1.02rem;
}

.intro-card__meta {
  color: var(--ink-faint);
  font-size: 0.64rem;
  line-height: 1.6;
}

.intro-card__arrow {
  margin-top: auto;
  color: var(--jade);
  font-size: 0.8rem;
}

.group-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.group-grid--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.group-card {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 18px 18px 16px;
  transition: border-color 0.18s ease, transform 0.18s ease;
}

.group-card:hover {
  border-color: var(--jade-2);
  transform: translateY(-2px);
}

.group-card--caution {
  border-style: dashed;
}

.group-card__top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: baseline;
}

.group-card__title {
  font-family: var(--serif);
  font-size: 1.35rem;
  letter-spacing: 0.04em;
}

.group-card__count {
  color: var(--cinnabar);
  font-size: 0.7rem;
  white-space: nowrap;
}

.group-card__subtitle {
  color: var(--jade);
  font-size: 0.7rem;
}

.group-card__desc {
  color: var(--ink-soft);
  font-size: 0.74rem;
  line-height: 1.75;
}

.group-card__meta {
  margin-top: auto;
  padding-top: 6px;
  color: var(--ink-faint);
  font-size: 0.64rem;
}

.library-foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-top: 30px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}

.library-foot p {
  max-width: 720px;
  color: var(--ink-faint);
  font-size: 0.68rem;
  line-height: 1.8;
}

@media (max-width: 1000px) {
  .intro-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .group-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .library-hero {
    gap: 20px;
    align-items: flex-start;
  }

  .library-hero__seal {
    width: 64px;
    height: 64px;
    font-size: 1.6rem;
  }

  .library-section__head {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .library-section__head > p {
    text-align: left;
  }

  .intro-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .group-grid,
  .group-grid--two {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .intro-list {
    grid-template-columns: 1fr;
  }
}
</style>
