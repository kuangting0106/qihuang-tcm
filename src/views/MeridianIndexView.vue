<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchMeridianData } from '@/composables/useMeridianApi'
import { meridianPlates } from '@/data/meridian-plates'
import type { Meridian } from '@/types/tcm'

const meridians = ref<Meridian[]>([])
const loading = ref(true)
const error = ref('')

const groups = [
  {
    id: 'hand-yin',
    title: '手三阴经',
    note: '胸 → 手，主胸、肺、心',
    ids: ['lung', 'pericardium', 'heart'],
  },
  {
    id: 'hand-yang',
    title: '手三阳经',
    note: '手 → 头，主头面、耳目、咽喉',
    ids: ['large-intestine', 'triple-burner', 'small-intestine'],
  },
  {
    id: 'foot-yang',
    title: '足三阳经',
    note: '头 → 足，主头面、躯干、下肢外侧',
    ids: ['stomach', 'bladder', 'gallbladder'],
  },
  {
    id: 'foot-yin',
    title: '足三阴经',
    note: '足 → 腹胸，主脾胃、肝肾、前阴',
    ids: ['spleen', 'kidney', 'liver'],
  },
  {
    id: 'extraordinary',
    title: '奇经八脉',
    note: '任、督二脉已有图版；其余六脉待补',
    ids: ['ren', 'du', 'chong', 'dai', 'yinwei', 'yangwei', 'yinqiao', 'yangqiao'],
  },
] as const

const byId = computed(() => new Map(meridians.value.map((meridian) => [meridian.id, meridian])))

const grouped = computed(() =>
  groups.map((group) => ({
    ...group,
    items: group.ids
      .map((id) => byId.value.get(id))
      .filter((meridian): meridian is Meridian => Boolean(meridian)),
  })),
)

const readyCount = computed(
  () => meridians.value.filter((meridian) => Boolean(meridianPlates[meridian.id])).length,
)

function plateFor(id: string) {
  return meridianPlates[id] ?? null
}

function pointLabel(meridian: Meridian) {
  const collected = meridian.acupointIds.length
  const total = meridian.totalPoints
  if (!collected) return '穴位待补'
  if (total && collected < total) return `已收录 ${collected} / ${total} 穴`
  return `${collected} 穴`
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const payload = await fetchMeridianData()
    meridians.value = payload.meridians
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : '经络数据加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <main class="meridian-index">
    <header class="meridian-hero">
      <p class="eyebrow">MERIDIAN ATLAS / 经络图</p>
      <h1>经络图</h1>
      <p class="meridian-hero__lead">
        以人体图版呈现十二正经与奇经八脉的循行路线、穴位定位与主治资料。悬停图上空白查看整条经络，悬停穴名查看单穴简介，点击打开完整资料。
      </p>
      <div class="meridian-hero__stats" aria-live="polite">
        <span><strong>{{ readyCount }}</strong> 条图版</span>
        <span><strong>{{ meridians.length || 20 }}</strong> 条经络</span>
        <span>定位 GB/T 12346-2021 · 主治《针灸学》</span>
      </div>
    </header>

    <p v-if="loading" class="meridian-state">正在载入经络图…</p>
    <p v-else-if="error" class="meridian-state meridian-state--error">{{ error }}</p>

    <template v-else>
      <section
        v-for="group in grouped"
        :id="group.id"
        :key="group.id"
        class="meridian-group"
      >
        <header class="meridian-group__head">
          <div>
            <p class="meridian-group__eyebrow">{{ group.id.toUpperCase() }}</p>
            <h2>{{ group.title }}</h2>
          </div>
          <p>{{ group.note }}</p>
        </header>

        <div class="meridian-grid">
          <template v-for="meridian in group.items" :key="meridian.id">
            <RouterLink
              v-if="plateFor(meridian.id)"
              class="meridian-card"
              :to="`/meridians/${meridian.id}`"
            >
              <div class="meridian-card__thumb">
                <img
                  :src="plateFor(meridian.id)?.image"
                  :alt="`${meridian.name}经络图`"
                  loading="eager"
                />
                <span class="meridian-card__seal">{{ plateFor(meridian.id)?.seal }}</span>
              </div>
              <div class="meridian-card__body">
                <p class="meridian-card__abbr">{{ meridian.abbr }} · {{ meridian.flowLabel }}</p>
                <h3>{{ meridian.name }}</h3>
                <p class="meridian-card__meta">
                  {{ plateFor(meridian.id)?.countLabel }} · {{ pointLabel(meridian) }}
                </p>
                <span class="meridian-card__link">查看经络图 <span aria-hidden="true">→</span></span>
              </div>
            </RouterLink>

            <div v-else class="meridian-card meridian-card--pending">
              <div class="meridian-card__thumb meridian-card__thumb--empty">
                <span>图版待补</span>
              </div>
              <div class="meridian-card__body">
                <p class="meridian-card__abbr">{{ meridian.abbr }} · {{ meridian.flowLabel }}</p>
                <h3>{{ meridian.name }}</h3>
                <p class="meridian-card__meta">暂未收录平面图版</p>
                <span class="meridian-card__link meridian-card__link--muted">待补</span>
              </div>
            </div>
          </template>
        </div>
      </section>

      <footer class="meridian-index__note">
        <p>
          图版由用户自制或提供，仅用于本站学习展示；穴位定位以 GB/T 12346-2021 为准，主治参考《针灸学》。图上线路为示意线，不代表针刺路径。
        </p>
        <RouterLink class="meridian-index__back" to="/">← 返回首页</RouterLink>
      </footer>
    </template>
  </main>
</template>

<style scoped>
.meridian-index {
  max-width: 1280px;
  margin: 0 auto;
  padding: 46px 24px 76px;
  color: var(--ink, #2f261f);
  font-family: var(--serif, 'Noto Serif SC', serif);
}

.meridian-hero {
  padding: 10px 4px 30px;
  border-bottom: 1px solid var(--line, rgba(86, 64, 45, 0.16));
}

.meridian-hero h1 {
  margin: 8px 0 12px;
  font-size: clamp(2.2rem, 4vw, 3.2rem);
  font-weight: 500;
  letter-spacing: 0.08em;
}

.meridian-hero__lead {
  max-width: 760px;
  margin: 0;
  color: var(--ink-soft, #675548);
  font-size: 0.95rem;
  line-height: 1.9;
}

.meridian-hero__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 24px;
  margin-top: 18px;
  color: var(--ink-soft, #675548);
  font-size: 0.78rem;
}

.meridian-hero__stats strong {
  color: var(--cinnabar, #a33a2b);
  font-size: 1.05rem;
  font-weight: 500;
}

.eyebrow,
.meridian-group__eyebrow {
  margin: 0;
  color: var(--cinnabar, #a33a2b);
  font-family: var(--sans, sans-serif);
  font-size: 0.62rem;
  letter-spacing: 0.2em;
}

.meridian-state {
  padding: 48px 0;
  color: var(--ink-soft, #675548);
}

.meridian-state--error {
  color: var(--cinnabar, #a33a2b);
}

.meridian-group {
  padding: 34px 0 6px;
}

.meridian-group__head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 16px;
}

.meridian-group__head h2 {
  margin: 4px 0 0;
  font-size: 1.35rem;
  font-weight: 500;
  letter-spacing: 0.08em;
}

.meridian-group__head > p {
  margin: 0;
  color: var(--ink-soft, #675548);
  font-size: 0.76rem;
}

.meridian-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.meridian-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--line, rgba(86, 64, 45, 0.16));
  border-radius: 14px;
  background: rgba(255, 252, 246, 0.72);
  color: inherit;
  text-decoration: none;
  box-shadow: 0 10px 24px rgba(74, 52, 34, 0.06);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.meridian-card:hover {
  transform: translateY(-3px);
  border-color: rgba(163, 58, 43, 0.38);
  box-shadow: 0 16px 30px rgba(74, 52, 34, 0.12);
}

.meridian-card__thumb {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #f4eee2;
}

.meridian-card__thumb img {
  width: 100%;
  height: 100%;
  padding: 8px 10px;
  object-fit: contain;
  object-position: center;
  transition: transform 0.35s ease;
}

.meridian-card:hover .meridian-card__thumb img {
  transform: scale(1.035);
}

.meridian-card__seal {
  position: absolute;
  right: 10px;
  bottom: 10px;
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 3px;
  background: rgba(163, 58, 43, 0.9);
  color: #fff8ee;
  font-size: 0.7rem;
}

.meridian-card__thumb--empty {
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 50% 40%, rgba(255, 255, 255, 0.7), transparent 60%),
    #f2ebde;
  color: #9b8875;
  font-size: 0.8rem;
  letter-spacing: 0.12em;
}

.meridian-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px 16px;
}

.meridian-card__abbr {
  margin: 0;
  color: var(--ink-soft, #8a7564);
  font-family: var(--sans, sans-serif);
  font-size: 0.66rem;
  letter-spacing: 0.08em;
}

.meridian-card__body h3 {
  margin: 2px 0 2px;
  font-size: 1.08rem;
  font-weight: 500;
  letter-spacing: 0.05em;
}

.meridian-card__meta {
  margin: 0;
  color: var(--ink-soft, #675548);
  font-size: 0.74rem;
}

.meridian-card__link {
  margin-top: 8px;
  color: var(--cinnabar, #a33a2b);
  font-size: 0.76rem;
  letter-spacing: 0.04em;
}

.meridian-card__link--muted {
  color: #a08c78;
}

.meridian-card--pending {
  opacity: 0.72;
}

.meridian-index__note {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 24px;
  margin-top: 38px;
  padding-top: 18px;
  border-top: 1px solid var(--line, rgba(86, 64, 45, 0.16));
  color: var(--ink-soft, #675548);
  font-size: 0.72rem;
  line-height: 1.8;
}

.meridian-index__note p {
  max-width: 820px;
  margin: 0;
}

.meridian-index__back {
  flex: none;
  color: var(--cinnabar, #a33a2b);
  text-decoration: none;
}

@media (max-width: 960px) {
  .meridian-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .meridian-index {
    padding: 30px 16px 54px;
  }

  .meridian-group__head {
    align-items: start;
    flex-direction: column;
    gap: 6px;
  }

  .meridian-grid {
    grid-template-columns: 1fr;
  }

  .meridian-index__note {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
