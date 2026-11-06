<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { clinicalDisclaimer } from '@/data/clinical-methods'
import { doctorProfiles } from '@/data/doctor-profiles'
import { useCaseApi } from '@/composables/useCaseApi'
import type { CaseSummary } from '@/types/cases'

const route = useRoute()
const { loading, error, fetchCases } = useCaseApi()
const caseList = ref<CaseSummary[]>([])

const kind = computed(() => {
  if (route.name === 'cases-doctor') return 'doctor'
  if (route.name === 'cases-category') return 'category'
  return 'all'
})

const rawKey = computed(() =>
  String(route.params.doctor ?? route.params.category ?? ''),
)

const key = computed(() => {
  try {
    return decodeURIComponent(rawKey.value)
  } catch {
    return rawKey.value
  }
})

const title = computed(() => {
  if (kind.value === 'doctor') return `${key.value}医案`
  if (kind.value === 'category') return `${key.value}医案`
  return '全部医案'
})

const lead = computed(() => {
  if (kind.value === 'doctor') {
    return doctorProfiles[key.value]?.bio ?? '按医家查看所收医案与经验论述；原文照录，不补写原书之外的诊断或剂量。'
  }
  if (kind.value === 'category') {
    return `按病症分类查看「${key.value}」相关医案；同一条目只按原书归类，不跨类重复。`
  }
  return '全部医案按医家与病症分类归档；现代医案排在同类之前，古代医案随后。'
})

const filteredCases = computed(() =>
  caseList.value.filter((item) => {
    if (kind.value === 'doctor') return item.doctor === key.value
    if (kind.value === 'category') return item.category === key.value
    return true
  }),
)

const summaryText = computed(() => {
  const doctor = doctorProfiles[key.value]
  return kind.value === 'doctor' && doctor ? doctor.source : ''
})

async function loadCases() {
  try {
    caseList.value = await fetchCases()
  } catch {
    // 错误由 useCaseApi 的 error 展示。
  }
}

onMounted(loadCases)
watch([kind, key], loadCases)
</script>

<template>
  <div class="page case-collection-page">
    <div class="container">
      <section class="clinical-banner" role="note">
        <span class="clinical-banner__mark">慎</span>
        <div>
          <strong>{{ clinicalDisclaimer.title }}</strong>
          <p>{{ clinicalDisclaimer.body }}</p>
        </div>
      </section>

      <header class="collection-hero">
        <RouterLink class="collection-back" to="/cases">← 返回医案</RouterLink>
        <p class="eyebrow">CASE COLLECTION / 医案合集</p>
        <h1>{{ title }}</h1>
        <p class="collection-lead">{{ lead }}</p>
        <div class="collection-meta">
          <span class="chip chip--cinnabar">{{ filteredCases.length }} 则</span>
          <span class="chip">原文照录 · 非诊断标准</span>
          <span v-if="summaryText" class="chip chip--gold">{{ summaryText }}</span>
        </div>
      </header>

      <p v-if="loading && !caseList.length" class="collection-state paper-panel">正在加载医案…</p>
      <p v-else-if="error && !caseList.length" class="collection-state paper-panel" role="alert">{{ error }}</p>
      <p v-else-if="!filteredCases.length" class="collection-state paper-panel">这一类还没有收录医案。</p>

      <section v-else class="collection-grid" aria-label="医案列表">
        <RouterLink
          v-for="item in filteredCases"
          :key="item.id"
          :to="`/cases/${item.id}`"
          class="collection-card paper-panel"
        >
          <div class="collection-card__meta">
            <span class="collection-card__category">{{ item.category }}</span>
            <span v-if="item.doctor" class="collection-card__doctor">{{ item.doctor }}</span>
            <span class="collection-card__mode">{{ item.mode === 'thought' ? '经验集' : '医案' }}</span>
          </div>
          <h2>{{ item.title }}</h2>
          <p>{{ item.summary }}</p>
          <span class="collection-card__foot">阅读全文 →</span>
        </RouterLink>
      </section>
    </div>
  </div>
</template>

<style scoped>
.case-collection-page {
  padding-bottom: 56px;
}

.collection-hero {
  padding: 18px 0 8px;
}

.collection-back {
  display: inline-block;
  margin-bottom: 16px;
  color: var(--ink-faint);
  font-size: 0.76rem;
  text-decoration: none;
}

.collection-back:hover {
  color: var(--cinnabar);
}

.collection-hero h1 {
  margin: 6px 0 10px;
  font-family: var(--serif);
  font-size: clamp(1.9rem, 3.6vw, 2.8rem);
  font-weight: 500;
}

.collection-lead {
  max-width: 720px;
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.9rem;
  line-height: 1.9;
}

.collection-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.collection-state {
  margin-top: 20px;
  padding: 18px;
  color: var(--ink-faint);
}

.collection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(258px, 1fr));
  gap: 14px;
  margin-top: 22px;
}

.collection-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 168px;
  padding: 16px 17px;
  border: 1px solid var(--line);
  color: inherit;
  text-decoration: none;
  transition: border-color 160ms ease, transform 160ms ease;
}

.collection-card:hover {
  border-color: rgba(163, 58, 43, 0.42);
  transform: translateY(-2px);
}

.collection-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  font-size: 0.68rem;
}

.collection-card__category {
  padding: 2px 8px;
  border: 1px solid rgba(163, 58, 43, 0.24);
  border-radius: 999px;
  color: var(--cinnabar);
}

.collection-card__doctor {
  color: var(--ink);
  border-bottom: 1px dotted rgba(163, 58, 43, 0.4);
}

.collection-card__mode {
  color: var(--ink-faint);
  border: 1px solid rgba(176, 138, 74, 0.34);
  border-radius: 999px;
  padding: 1px 7px;
  font-size: 0.62rem;
}

.collection-card h2 {
  margin: 2px 0 0;
  font-family: var(--serif);
  font-size: 1.08rem;
  font-weight: 500;
  line-height: 1.45;
}

.collection-card p {
  flex: 1;
  margin: 0;
  color: var(--ink-faint);
  font-size: 0.76rem;
  line-height: 1.75;
}

.collection-card__foot {
  color: var(--cinnabar);
  font-size: 0.7rem;
}

@media (max-width: 640px) {
  .collection-grid {
    grid-template-columns: 1fr;
  }
}
</style>
