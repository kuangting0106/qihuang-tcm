<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AcupunctureTopic from '@/components/AcupunctureTopic.vue'
import CaseArticle from '@/components/CaseArticle.vue'
import InspectionTopic from '@/components/InspectionTopic.vue'
import MoxibustionTopic from '@/components/MoxibustionTopic.vue'
import PulseTopic from '@/components/PulseTopic.vue'
import TenQuestionsTopic from '@/components/TenQuestionsTopic.vue'
import TreatmentPrinciplesTopic from '@/components/TreatmentPrinciplesTopic.vue'
import { useCaseApi } from '@/composables/useCaseApi'
import type { CaseItem } from '@/types/cases'
import type { Topic } from '@/data/topics'
import { findTopic, getTopicSection } from '@/data/topics'

const route = useRoute()
const section = computed(() => getTopicSection(String(route.meta.section || 'methods')))
const isCaseRoute = computed(() => section.value.key === 'cases')

const { loading: caseLoading, error: caseError, fetchCase } = useCaseApi()
const caseDetail = ref<CaseItem | null>(null)
const caseTopic = computed<Topic | null>(() =>
  caseDetail.value
    ? {
        id: caseDetail.value.id,
        title: caseDetail.value.title,
        subtitle: `${caseDetail.value.category} · ${caseDetail.value.summary}`,
      }
    : null,
)
const topic = computed<Topic | null>(() =>
  isCaseRoute.value
    ? caseTopic.value
    : findTopic(section.value.key, String(route.params.id)),
)

async function loadCase(id: string) {
  try {
    caseDetail.value = await fetchCase(id)
  } catch {
    // 错误由 useCaseApi 的 error 展示。
  }
}

watch(
  [() => section.value.key, () => String(route.params.id ?? '')] as const,
  ([key, id]) => {
    if (key === 'cases' && id) loadCase(id)
    else caseDetail.value = null
  },
  { immediate: true },
)

const isAcupuncture = computed(() => section.value.key === 'methods' && topic.value?.id === 'acupuncture')
const isMoxibustion = computed(() => section.value.key === 'methods' && topic.value?.id === 'moxibustion')
const isTenQuestions = computed(() => section.value.key === 'methods' && topic.value?.id === 'ten-questions')
const isTreatmentMethods = computed(
  () => section.value.key === 'methods' && topic.value?.id === 'treatment-methods',
)
const isInspection = computed(() => section.value.key === 'methods' && topic.value?.id === 'inspection')
const isPulse = computed(() => section.value.key === 'methods' && topic.value?.id === 'pulse')
const isClinicalTopic = computed(
  () => isTenQuestions.value || isTreatmentMethods.value || isInspection.value || isPulse.value,
)

const isCase = computed(() => isCaseRoute.value && !!caseDetail.value)
const caseData = computed(() => caseDetail.value)
const statusLabel = computed(() => {
  if (isCase.value) return '讲义医案 · 原文照录'
  if (isAcupuncture.value) return '含针刺操作 · 非专业勿试'
  if (isMoxibustion.value) return '含艾灸操作 · 非专业勿试'
  if (isClinicalTopic.value) return '经验总结 · 非诊断标准'
  return '正文待收录'
})
</script>

<template>
  <div class="page topic-detail-page">
    <div class="container">
      <nav class="breadcrumbs" aria-label="面包屑">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink :to="`/${section.key}`">{{ section.title }}</RouterLink>
        <span>/</span>
        <span>{{ topic?.title ?? '未找到' }}</span>
      </nav>

      <p v-if="isCaseRoute && caseLoading" class="topic-detail-state paper-panel">正在加载医案…</p>
      <p
        v-else-if="isCaseRoute && caseError"
        class="topic-detail-state paper-panel"
        role="alert"
      >
        {{ caseError }}
        <button class="btn btn--primary" type="button" @click="loadCase(String(route.params.id))">
          重新加载
        </button>
      </p>

      <template v-else-if="topic">
        <header class="topic-detail-head">
          <div>
            <p class="eyebrow">{{ section.eyebrow }}</p>
            <h1>{{ topic.title }}</h1>
            <p>{{ topic.subtitle }}</p>
          </div>
          <span class="chip" :class="isAcupuncture || isMoxibustion ? 'chip--cinnabar' : 'chip--gold'">
            {{ statusLabel }}
          </span>
        </header>

        <TenQuestionsTopic v-if="isTenQuestions" />
        <TreatmentPrinciplesTopic v-else-if="isTreatmentMethods" />
        <InspectionTopic v-else-if="isInspection" />
        <PulseTopic v-else-if="isPulse" />
        <AcupunctureTopic v-else-if="isAcupuncture" />
        <MoxibustionTopic v-else-if="isMoxibustion" />

        <CaseArticle v-else-if="isCase && caseData" :case-data="caseData" />

        <div v-else class="topic-detail-layout">
          <section class="empty-article paper-panel">
            <span class="empty-article__seal">{{ section.key === 'methods' ? '法' : '案' }}</span>
            <h2>这一篇还没有录入正文</h2>
            <p>
              这里先保留栏目结构。等你提供典籍原文、医案或讲义后，我会按“书名 · 卷/条 · 原文”的格式录入，
              并把每一条治法、方药、按语挂到具体出处。
            </p>
            <p class="empty-article__note">
              在正文录入前，不展示具体方药、剂量、针刺或艾灸操作，避免出现没有出处的“看起来很像”的内容。
            </p>
          </section>

          <aside class="topic-outline paper-panel">
            <span class="eyebrow">OUTLINE</span>
            <h3>这个栏目准备怎么放</h3>
            <ol>
              <li><strong>原文 / 医案</strong><span>先放原始材料，保留书名、卷次、条号。</span></li>
              <li><strong>症状与病机</strong><span>把关键症状、病程、脉象、舌象拆成可检索字段。</span></li>
              <li><strong>治法与方药</strong><span>只写有出处的治法、方名、药物与加减。</span></li>
              <li><strong>按语</strong><span>后人解说与你的整理分开标注，不冒充原文。</span></li>
            </ol>
            <RouterLink class="text-link" :to="`/${section.key}`">返回{{ section.title }} →</RouterLink>
          </aside>
        </div>
      </template>

      <div v-else class="empty-state paper-panel">
        <h2>没有这个栏目</h2>
        <p>链接里的栏目 id 可能不正确。</p>
        <RouterLink class="btn btn--primary" :to="`/${section.key}`">返回{{ section.title }}</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.topic-detail-state {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin: 18px 0;
  padding: 14px 16px;
  color: var(--ink-soft);
  font-size: 0.84rem;
}

.breadcrumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 20px 0 26px;
  color: var(--ink-faint);
  font-size: 0.78rem;
}

.breadcrumbs a:hover {
  color: var(--cinnabar);
}

.topic-detail-head {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  align-items: flex-end;
  padding-bottom: 28px;
  border-bottom: 1px solid var(--line-strong);
}

.topic-detail-head h1 {
  margin: 5px 0 10px;
  font-size: clamp(2.6rem, 6vw, 4.8rem);
  letter-spacing: 0.06em;
}

.topic-detail-head p {
  max-width: 700px;
  color: var(--ink-soft);
  font-size: 0.94rem;
  line-height: 1.9;
}

.topic-detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
  gap: 20px;
  padding-top: 30px;
}

.empty-article {
  padding: 46px 36px;
  text-align: center;
}

.empty-article__seal {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  display: grid;
  place-items: center;
  border-radius: 48% 52% 46% 54%;
  background: var(--jade);
  color: var(--paper);
  font-family: var(--serif);
  font-size: 1.7rem;
}

.topic-detail-page .empty-article__seal {
  background: var(--jade);
}

.empty-article h2 {
  margin-bottom: 10px;
  font-size: 1.5rem;
}

.empty-article p {
  max-width: 520px;
  margin: 0 auto;
  color: var(--ink-soft);
  font-size: 0.86rem;
  line-height: 1.9;
}

.empty-article__note {
  margin-top: 12px !important;
  padding-top: 12px;
  border-top: 1px dashed var(--line-strong);
  color: var(--ink-faint) !important;
  font-size: 0.76rem !important;
}

.topic-outline {
  align-self: start;
  padding: 22px 24px;
}

.topic-outline h3 {
  margin: 4px 0 14px;
  font-size: 1.1rem;
}

.topic-outline ol {
  margin: 0;
  padding-left: 18px;
  color: var(--ink-soft);
  font-size: 0.8rem;
  line-height: 1.8;
}

.topic-outline li {
  margin-bottom: 10px;
}

.topic-outline strong,
.topic-outline span {
  display: block;
}

.topic-outline strong {
  color: var(--ink);
}

.topic-outline span {
  color: var(--ink-faint);
  font-size: 0.74rem;
}

.topic-outline .text-link {
  display: inline-block;
  margin-top: 10px;
  font-size: 0.78rem;
}

@media (max-width: 820px) {
  .topic-detail-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .topic-detail-layout {
    grid-template-columns: 1fr;
  }

  .empty-article {
    padding: 32px 20px;
  }
}
</style>
