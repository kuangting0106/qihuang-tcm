<script setup lang="ts">
import { ref } from 'vue'
import acupuncture from '@/data/acupuncture.json'
import quickref from '@/data/acupuncture-quickref.json'
import TutorialEntry from '@/components/acupuncture/TutorialEntry.vue'
import QuickrefSection from '@/components/acupuncture/QuickrefSection.vue'
import ConditionsSection from '@/components/acupuncture/ConditionsSection.vue'
import PenetrationsSection from '@/components/acupuncture/PenetrationsSection.vue'
import CasesSection from '@/components/acupuncture/CasesSection.vue'
import ShixueminSection from '@/components/acupuncture/ShixueminSection.vue'

type TabId = 'quickref' | 'conditions' | 'penetrations' | 'cases' | 'shixuemin'

const tabs: Array<{ id: TabId; label: string; note: string }> = [
  { id: 'quickref', label: '十二经速查', note: '图与表' },
  { id: 'conditions', label: '病症常针', note: `${quickref.conditionCount} 条 · 原题 215` },
  { id: 'penetrations', label: '透针透穴', note: `${quickref.penetrations.length} 条` },
  { id: 'cases', label: '下针医案', note: `${quickref.conditionCaseCount + quickref.penetrationCaseCount} 则` },
  { id: 'shixuemin', label: '醒脑开窍', note: `${acupuncture.conditions.length} 项` },
]
const activeTab = ref<TabId>('quickref')
</script>

<template>
  <div class="acu-page">
    <section class="acu-warning" role="note" aria-label="安全警告">
      <span class="acu-warning__seal" aria-hidden="true">针</span>
      <div>
        <strong>{{ acupuncture.warning }}</strong>
        <p>{{ acupuncture.warningNote }}</p>
      </div>
    </section>

    <TutorialEntry class="acu-tutorial-entry" />

    <nav class="acu-tabs paper-panel" aria-label="针法内容分类">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        :class="{ active: activeTab === tab.id }"
        :aria-selected="activeTab === tab.id"
        role="tab"
        @click="activeTab = tab.id"
      >
        <span>{{ tab.label }}</span>
        <small>{{ tab.note }}</small>
      </button>
    </nav>

    <div class="acu-panel">
      <QuickrefSection v-if="activeTab === 'quickref'" />
      <ConditionsSection v-else-if="activeTab === 'conditions'" />
      <PenetrationsSection v-else-if="activeTab === 'penetrations'" />
      <CasesSection v-else-if="activeTab === 'cases'" />
      <ShixueminSection v-else />
    </div>
  </div>
</template>

<style scoped>
.acu-page {
  padding-top: 26px;
}

.acu-warning {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 18px 20px;
  border: 1px solid color-mix(in srgb, var(--cinnabar) 62%, var(--line));
  border-left: 5px solid var(--cinnabar);
  border-radius: 10px;
  background:
    linear-gradient(100deg, rgba(190, 78, 58, 0.1), rgba(255, 250, 242, 0.7)),
    rgba(255, 252, 245, 0.8);
}

.acu-warning__seal {
  flex-shrink: 0;
  display: grid;
  place-content: center;
  width: 46px;
  height: 46px;
  border: 1px solid var(--cinnabar);
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 1.5rem;
}

.acu-warning strong {
  display: block;
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 1.08rem;
  font-weight: 500;
  letter-spacing: 0.04em;
}

.acu-warning p {
  margin-top: 5px;
  color: var(--ink-soft);
  font-size: 0.76rem;
  line-height: 1.75;
}

.acu-tutorial-entry {
  margin-top: 14px;
}

.acu-tabs {
  position: sticky;
  top: var(--header-h);
  z-index: 30;
  display: flex;
  gap: 4px;
  margin-top: 16px;
  padding: 6px;
  overflow-x: auto;
  background: rgba(244, 239, 228, 0.94);
  backdrop-filter: blur(14px);
}

.acu-tabs button {
  flex: 1 0 auto;
  display: grid;
  gap: 1px;
  justify-items: center;
  min-width: 106px;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: var(--ink-soft);
  font: inherit;
  cursor: pointer;
}

.acu-tabs button span {
  font-family: var(--serif);
  font-size: 0.9rem;
  letter-spacing: 0.04em;
}

.acu-tabs button small {
  color: var(--ink-faint);
  font-size: 0.56rem;
  letter-spacing: 0.06em;
}

.acu-tabs button.active {
  border-color: color-mix(in srgb, var(--jade) 45%, var(--line));
  background: rgba(40, 92, 69, 0.08);
  color: var(--jade);
}

.acu-tabs button.active small {
  color: var(--jade);
}

.acu-panel {
  margin-top: 20px;
}

@media (max-width: 700px) {
  .acu-warning {
    padding: 14px;
  }

  .acu-tabs {
    top: var(--header-h);
    margin-left: -4px;
    margin-right: -4px;
  }

  .acu-tabs button {
    min-width: 96px;
  }
}
</style>
