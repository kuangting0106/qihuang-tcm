<script setup lang="ts">
import { computed } from 'vue'
import type { CaseContent, CaseItem } from '@/types/cases'

const props = defineProps<{
  caseData: CaseItem
}>()

const isJinguiLecture = computed(() => props.caseData.source.work.includes('金匮'))

const disclaimerTitle = computed(() =>
  isJinguiLecture.value ? '讲义原文照录' : '医案原文照录',
)

const disclaimerBody = computed(() =>
  isJinguiLecture.value
    ? '以下内容为倪海厦《人纪·金匮要略》临床案例部分的原文整理，保留讲述者的辨证与用药思路；不是诊断标准，也不构成用药建议。'
    : `以下内容为《${props.caseData.source.work}》所载医案的原文整理，保留原案的症状、辨证与用药记录；不是诊断标准，也不构成用药建议。`,
)

const sourceNote = computed(() =>
  isJinguiLecture.value
    ? '本页只整理讲义所述案例，不补充讲义之外的诊断、剂量或转归。涉及具体治疗，请由执业中医师辨证处理。'
    : '本页只整理原书所载医案，不补充原书之外的诊断、剂量或转归。涉及具体治疗，请由执业中医师辨证处理。',
)

function prescriptionOf(block: CaseContent) {
  return block.type === 'prescription' ? block : null
}

function paragraphOf(block: CaseContent) {
  return block.type === 'paragraph' ? block.text : ''
}
</script>

<template>
  <article class="case-article">
    <div class="case-meta">
      <span class="case-meta__category">{{ caseData.category }}</span>
      <span>{{ caseData.source.work }}</span>
    </div>

    <p class="case-disclaimer">
      <strong>{{ disclaimerTitle }}</strong>
      {{ disclaimerBody }}
    </p>

    <div class="case-body">
      <template v-for="(block, index) in caseData.content" :key="index">
        <div v-if="prescriptionOf(block)" class="case-prescription">
          <div class="case-prescription__head">
            <span>{{ isJinguiLecture ? '讲义所录处方' : '原案所录处方' }}</span>
            <span>{{ prescriptionOf(block)?.herbs.length }} 味</span>
          </div>
          <ul class="case-prescription__herbs">
            <li v-for="herb in prescriptionOf(block)?.herbs" :key="`${herb.name}-${herb.dose}`">
              <span class="case-prescription__name">{{ herb.name }}</span>
              <span class="case-prescription__dose">{{ herb.dose || '原讲义未标剂量' }}</span>
            </li>
          </ul>
          <p class="case-prescription__note">
            剂量单位依原文，未作现代折算；请勿自行照方用药。
          </p>
        </div>
        <p v-else class="case-paragraph">{{ paragraphOf(block) }}</p>
      </template>
    </div>

    <footer class="case-source">
      <span class="eyebrow">SOURCE / 出处</span>
      <p>{{ caseData.source.work }} · {{ caseData.source.locator }}</p>
      <p class="case-source__note">
        {{ sourceNote }}
      </p>
    </footer>
  </article>
</template>

<style scoped>
.case-article {
  padding-top: 28px;
}

.case-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  color: var(--ink-faint);
  font-size: 0.72rem;
}

.case-meta__category {
  padding: 3px 10px;
  border: 1px solid rgba(163, 58, 43, 0.28);
  border-radius: 999px;
  background: rgba(163, 58, 43, 0.06);
  color: var(--cinnabar);
}

.case-disclaimer {
  margin: 14px 0 0;
  padding: 12px 15px;
  border-left: 3px solid var(--gold);
  background: rgba(237, 224, 200, 0.32);
  color: var(--ink-soft);
  font-size: 0.78rem;
  line-height: 1.8;
}

.case-disclaimer strong {
  margin-right: 6px;
  color: var(--ink);
  font-family: var(--serif);
}

.case-body {
  max-width: 780px;
  margin-top: 22px;
}

.case-paragraph {
  margin: 0 0 15px;
  color: #3b3a35;
  font-family: var(--serif);
  font-size: 1rem;
  line-height: 2.05;
  text-align: justify;
}

.case-prescription {
  margin: 20px 0 24px;
  padding: 16px 18px;
  border: 1px solid rgba(176, 138, 74, 0.38);
  border-radius: 10px;
  background: rgba(255, 252, 245, 0.72);
}

.case-prescription__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 9px;
  border-bottom: 1px dashed var(--line);
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.88rem;
}

.case-prescription__head span:last-child {
  color: var(--ink-faint);
  font-family: var(--sans);
  font-size: 0.68rem;
}

.case-prescription__herbs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 7px 14px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.case-prescription__herbs li {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 5px 0;
  border-bottom: 1px solid rgba(32, 37, 34, 0.07);
}

.case-prescription__name {
  color: var(--ink);
  font-family: var(--serif);
  font-size: 0.9rem;
}

.case-prescription__dose {
  color: var(--ink-soft);
  font-size: 0.74rem;
  white-space: nowrap;
}

.case-prescription__note {
  margin: 10px 0 0;
  color: var(--ink-faint);
  font-size: 0.66rem;
  line-height: 1.6;
}

.case-source {
  max-width: 780px;
  margin-top: 30px;
  padding-top: 16px;
  border-top: 1px solid var(--line-strong);
}

.case-source p {
  margin: 5px 0 0;
  color: var(--ink-soft);
  font-size: 0.76rem;
  line-height: 1.7;
}

.case-source__note {
  color: var(--ink-faint) !important;
  font-size: 0.68rem !important;
}

@media (max-width: 680px) {
  .case-paragraph {
    font-size: 0.94rem;
    line-height: 1.95;
  }

  .case-prescription__herbs {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
