<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import type { Formula, FormulaCompositionItem, FormulaRole } from '@/types/tcm'
import { ROLE_ORDER } from '@/types/tcm'
import { useTcmData } from '@/composables/useTcmData'
import CitationBadge from './CitationBadge.vue'

const props = withDefaults(
  defineProps<{
    formula: Formula
    variant?: 'table' | 'grouped'
    selectedHerbId?: string | null
    herbNames?: Record<string, string>
  }>(),
  {
    variant: 'table',
    selectedHerbId: null,
    herbNames: undefined,
  },
)

const emit = defineEmits<{
  select: [herbId: string]
}>()

const { herbsById } = useTcmData()

const dosageMode = ref<'modern' | 'ancient'>('modern')

watch(
  () => props.formula.id,
  () => {
    dosageMode.value = 'modern'
  },
)

const rows = computed(() =>
  props.formula.composition.map((item) => ({
    ...item,
    herb: herbsById.value.get(item.herbId),
  })),
)

const groups = computed(() =>
  ROLE_ORDER.map((role) => ({
    role,
    items: rows.value.filter((r) => r.role === role),
  })).filter((g) => g.items.length > 0),
)

const roleCounts = computed(() =>
  groups.value.map((g) => ({ role: g.role, count: g.items.length })),
)

const maxRatios = computed(() => {
  const map = new Map<string, number>()
  for (const row of rows.value) {
    if (!row.ratio) continue
    map.set(row.ratio.group, Math.max(map.get(row.ratio.group) ?? 0, row.ratio.value))
  }
  return map
})

const ratioGroupCounts = computed(() => {
  const map = new Map<string, number>()
  for (const row of rows.value) {
    if (!row.ratio) continue
    map.set(row.ratio.group, (map.get(row.ratio.group) ?? 0) + 1)
  }
  return map
})

const modernMaxRatios = computed(() => {
  const map = new Map<string, number>()
  for (const row of rows.value) {
    if (!row.modernRatio) continue
    map.set(row.modernRatio.group, Math.max(map.get(row.modernRatio.group) ?? 0, row.modernRatio.value))
  }
  return map
})

const modernRatioGroupCounts = computed(() => {
  const map = new Map<string, number>()
  for (const row of rows.value) {
    if (!row.modernRatio) continue
    map.set(row.modernRatio.group, (map.get(row.modernRatio.group) ?? 0) + 1)
  }
  return map
})

function showRatioBar(item: FormulaCompositionItem) {
  return !!item.ratio && (ratioGroupCounts.value.get(item.ratio.group) ?? 0) > 1
}

function ratioWidth(item: FormulaCompositionItem) {
  if (!item.ratio) return 0
  const max = maxRatios.value.get(item.ratio.group) ?? 1
  return Math.max(8, Math.round((item.ratio.value / max) * 100))
}

function showModernRatioBar(item: FormulaCompositionItem) {
  return !!item.modernRatio && (modernRatioGroupCounts.value.get(item.modernRatio.group) ?? 0) > 1
}

function modernRatioWidth(item: FormulaCompositionItem) {
  if (!item.modernRatio) return 0
  const max = modernMaxRatios.value.get(item.modernRatio.group) ?? 1
  return Math.max(8, Math.round((item.modernRatio.value / max) * 100))
}

function activeDose(item: FormulaCompositionItem) {
  return dosageMode.value === 'modern' ? item.modernDose ?? item.dosage : item.dosage
}

function activeRatio(item: FormulaCompositionItem) {
  return dosageMode.value === 'modern' ? item.modernRatio ?? item.ratio : item.ratio
}

function showActiveRatioBar(item: FormulaCompositionItem) {
  if (dosageMode.value === 'modern') {
    return item.modernRatio ? showModernRatioBar(item) : showRatioBar(item)
  }
  return showRatioBar(item)
}

function activeRatioWidth(item: FormulaCompositionItem) {
  if (dosageMode.value === 'modern') {
    return item.modernRatio ? modernRatioWidth(item) : ratioWidth(item)
  }
  return ratioWidth(item)
}

function toggleDosageMode() {
  dosageMode.value = dosageMode.value === 'modern' ? 'ancient' : 'modern'
}

const commonRatioSummary = computed(
  () => props.formula.modernRatioSummary ?? props.formula.dosageRatioSummary ?? '',
)

const ancientDoseSummary = computed(() =>
  rows.value
    .map((row) => `${row.herbName ?? row.herb?.name ?? row.herbId}${row.dosage}`)
    .join('，'),
)

const activeDoseSummary = computed(() =>
  dosageMode.value === 'modern'
    ? props.formula.modernDoseSummary ?? ''
    : ancientDoseSummary.value,
)

const activeDoseNote = computed(() =>
  dosageMode.value === 'modern'
    ? props.formula.modernDoseNote ?? ''
    : '以下为古籍原方用量，按“两、升、枚”记录；原方比例只在同一单位组内比较。',
)

function herbName(item: FormulaCompositionItem) {
  return (
    item.herbName ??
    props.herbNames?.[item.herbId] ??
    herbsById.value.get(item.herbId)?.name ??
    item.herbId
  )
}

function herbNameById(herbId: string) {
  return (
    compositionRow(herbId)?.herbName ??
    props.herbNames?.[herbId] ??
    herbsById.value.get(herbId)?.name ??
    herbId
  )
}

function hasHerbPage(herbId: string) {
  return herbsById.value.has(herbId)
}

function compositionRow(herbId: string) {
  return rows.value.find((row) => row.herbId === herbId)
}

function meaningRole(herbId: string) {
  return compositionRow(herbId)?.role ?? '未标注'
}

function meaningDose(herbId: string) {
  const item = compositionRow(herbId)
  return item ? activeDose(item) : '—'
}

function anchor(role: FormulaRole) {
  return `role-${role}`
}
</script>

<template>
  <div class="composition" :class="`composition--${variant}`">
    <div v-if="variant === 'grouped'" class="role-summary" aria-label="按角色跳转">
      <span class="role-summary__label">按角色</span>
      <a
        v-for="r in roleCounts"
        :key="r.role"
        class="role-pill"
        :class="`role-pill--${r.role}`"
        :href="`#${anchor(r.role)}`"
      >
        {{ r.role }} {{ r.count }}
      </a>
      <span class="role-summary__note">全部分组默认展开，不折叠</span>
    </div>

    <div v-if="commonRatioSummary" class="ratio-head">
      <span class="ratio-head__title">常用组成配比</span>
      <span class="ratio-head__hint">与下方用量表对应</span>
    </div>

    <p v-if="commonRatioSummary" class="ratio-summary">
      <span class="ratio-summary__tag">常用</span>{{ commonRatioSummary }}
    </p>

    <div v-if="formula.doseConversion" class="dose-conversion">
      <div class="dose-conversion__head">
        <span class="ratio-summary__tag">换算</span>
        <strong>{{ formula.doseConversion.text }}</strong>
      </div>
      <p v-if="formula.doseConversion.note">{{ formula.doseConversion.note }}</p>
    </div>

    <div v-if="activeDoseSummary" class="modern-summary">
      <div class="modern-summary__head">
        <div class="modern-summary__title">
          <span
            class="ratio-summary__tag"
            :class="{ 'ratio-summary__tag--modern': dosageMode === 'modern' }"
          >
            {{ dosageMode === 'modern' ? '今用' : '原方' }}
          </span>
          <strong>{{ dosageMode === 'modern' ? '当今常用剂量与配比' : '古籍记载用量' }}</strong>
        </div>
        <button class="dose-toggle" type="button" :aria-pressed="dosageMode === 'ancient'" @click="toggleDosageMode">
          <span class="dose-toggle__icon" aria-hidden="true">⇄</span>
          {{ dosageMode === 'modern' ? '切换古代用量' : '切换今用用量' }}
        </button>
      </div>
      <p class="modern-summary__dose">{{ activeDoseSummary }}</p>
      <p v-if="activeDoseNote" class="modern-summary__note">{{ activeDoseNote }}</p>
    </div>

    <div class="analysis-source">
      <span>君臣佐使依据</span>
      <CitationBadge :citation-ids="['src-fangjixue']" label="后世方解" tone="muted" compact />
      <span>为后世方书归纳，不是《伤寒论》原文。</span>
    </div>

    <section v-if="formula.meaning" class="formula-meaning">
      <div class="formula-meaning__head">
        <div>
          <p class="eyebrow">EXPLANATION / 方义</p>
          <h3>方义解说</h3>
        </div>
        <p>逐味说明该药在本方中起什么作用；属后世方解，不是原书原文。</p>
      </div>

      <div class="formula-meaning__grid">
        <article
          v-for="item in formula.meaning.herbMeanings"
          :key="item.herbId"
          class="meaning-item"
        >
          <div class="meaning-item__head">
            <RouterLink v-if="hasHerbPage(item.herbId)" :to="`/herbs/${item.herbId}`">
              {{ herbNameById(item.herbId) }}
            </RouterLink>
            <span v-else>{{ herbNameById(item.herbId) }}</span>
            <span class="role-pill" :class="`role-pill--${meaningRole(item.herbId)}`">
              {{ meaningRole(item.herbId) }}
            </span>
            <span class="meaning-item__dose">{{ meaningDose(item.herbId) }}</span>
          </div>
          <p>{{ item.text }}</p>
        </article>
      </div>

      <div class="formula-meaning__summary">
        <h4>方义总结</h4>
        <p>{{ formula.meaning.summary.text }}</p>
        <CitationBadge
          :citation-ids="formula.meaning.summary.citationIds"
          label="后世方解"
          tone="muted"
          compact
        />
      </div>
    </section>

    <div v-else-if="variant === 'table'" class="composition-table" role="table" aria-label="方剂组成">
      <div class="composition-row composition-row--head" role="row">
        <span role="columnheader">药材</span>
        <span role="columnheader">{{ dosageMode === 'modern' ? '今用用量' : '原文用量' }}</span>
        <span role="columnheader">君臣佐使</span>
        <span role="columnheader">{{ dosageMode === 'modern' ? '今用比例' : '原方比例' }}</span>
        <span role="columnheader">出处 / 备注</span>
      </div>
      <div
        v-for="item in rows"
        :key="item.herbId"
        class="composition-row"
        :class="{ 'composition-row--selected': selectedHerbId === item.herbId }"
        role="row"
      >
        <span class="composition-row__herb" role="cell">
          <RouterLink v-if="hasHerbPage(item.herbId)" :to="`/herbs/${item.herbId}`">
            {{ herbName(item) }}
          </RouterLink>
          <span v-else>{{ herbName(item) }}</span>
          <button class="locate-btn" type="button" @click="emit('select', item.herbId)">定位原文</button>
        </span>
        <span role="cell" :class="{ 'modern-cell': dosageMode === 'modern' }">{{ activeDose(item) }}</span>
        <span role="cell">
          <span class="role-pill" :class="`role-pill--${item.role}`">{{ item.role }}</span>
        </span>
        <span role="cell" class="ratio-cell">
          <span v-if="activeRatio(item)" class="ratio-line">
            <span class="ratio-tag" :class="{ 'ratio-tag--modern': dosageMode === 'modern' }">
              {{ dosageMode === 'modern' ? '今用' : '原方' }}
            </span>
            <span
              v-if="showActiveRatioBar(item)"
              class="ratio-bar"
              :class="{ 'ratio-bar--modern': dosageMode === 'modern' }"
            >
              <span :style="{ width: `${activeRatioWidth(item)}%` }"></span>
            </span>
            <span class="ratio-text">
              {{ activeRatio(item)?.text }}
              <small v-if="activeRatio(item)?.note">{{ activeRatio(item)?.note }}</small>
              <small v-else-if="!showActiveRatioBar(item)">单独计量</small>
            </span>
          </span>
          <span v-else class="muted">—</span>
        </span>
        <span role="cell" class="composition-row__source">
          <span v-if="item.note" class="composition-row__note">{{ item.note }}</span>
          <span v-else class="muted">按原方组成</span>
        </span>
      </div>
    </div>

    <div v-else class="composition-groups">
      <section v-for="group in groups" :id="anchor(group.role)" :key="group.role" class="role-group">
        <header class="role-group__head">
          <h3>
            <span class="role-pill" :class="`role-pill--${group.role}`">{{ group.role }}</span>
            <span>{{ group.items.length }} 味</span>
          </h3>
          <span class="role-group__hint">全部展开</span>
        </header>
        <div class="role-group__list">
          <article
            v-for="item in group.items"
            :key="item.herbId"
            class="role-item"
            :class="{ 'role-item--selected': selectedHerbId === item.herbId }"
          >
            <div class="role-item__main">
              <RouterLink
                v-if="hasHerbPage(item.herbId)"
                class="role-item__name"
                :to="`/herbs/${item.herbId}`"
              >
                {{ herbName(item) }}
              </RouterLink>
              <span v-else class="role-item__name">{{ herbName(item) }}</span>
              <span class="role-item__dosages">
                <span
                  class="role-item__dosage"
                  :class="{ 'role-item__dosage--modern': dosageMode === 'modern' && item.modernDose }"
                >
                  {{ dosageMode === 'modern' && item.modernDose ? '今' : '原' }} {{ activeDose(item) }}
                </span>
              </span>
            </div>
            <div class="role-item__meta">
              <button class="locate-btn" type="button" @click="emit('select', item.herbId)">定位原文</button>
            </div>
            <div v-if="activeRatio(item)" class="role-item__ratio">
              <span class="ratio-line">
                <span class="ratio-tag" :class="{ 'ratio-tag--modern': dosageMode === 'modern' }">
                  {{ dosageMode === 'modern' ? '今用' : '原方' }}
                </span>
                <span
                  v-if="showActiveRatioBar(item)"
                  class="ratio-bar"
                  :class="{ 'ratio-bar--modern': dosageMode === 'modern' }"
                >
                  <span :style="{ width: `${activeRatioWidth(item)}%` }"></span>
                </span>
                <span class="ratio-text">
                  {{ activeRatio(item)?.text }}
                  <small v-if="activeRatio(item)?.note">{{ activeRatio(item)?.note }}</small>
                  <small v-else-if="!showActiveRatioBar(item)">单独计量</small>
                </span>
              </span>
            </div>
            <p v-if="item.note" class="role-item__note">{{ item.note }}</p>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.composition {
  width: 100%;
}

.role-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
  padding: 12px 14px;
  margin-bottom: 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255, 252, 245, 0.55);
}

.role-summary__label {
  margin-right: 4px;
  color: var(--ink-faint);
  font-size: 0.72rem;
}

.role-summary a {
  text-decoration: none;
}

.role-summary__note {
  margin-left: auto;
  color: var(--cinnabar);
  font-size: 0.7rem;
}

.ratio-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 10px;
  padding: 10px 2px 8px;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(47, 111, 107, 0.18);
}

.ratio-head__title {
  color: var(--jade);
  font-family: var(--serif);
  font-size: 1.06rem;
  letter-spacing: 0.06em;
}

.ratio-head__title::before {
  content: "";
  display: inline-block;
  width: 20px;
  height: 2px;
  margin-right: 8px;
  vertical-align: 4px;
  background: linear-gradient(90deg, var(--jade), transparent);
}

.ratio-head__hint {
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.ratio-summary {
  margin: 0 2px 8px;
  padding: 9px 11px;
  border: 1px solid rgba(176, 138, 74, 0.24);
  border-radius: 8px;
  background: rgba(237, 224, 200, 0.35);
  color: var(--ink);
  font-family: var(--serif);
  font-size: 0.82rem;
  line-height: 1.7;
}

.ratio-summary__tag {
  display: inline-block;
  margin-right: 7px;
  padding: 1px 6px;
  border-radius: 3px;
  background: var(--cinnabar);
  color: #fff;
  font-family: var(--sans);
  font-size: 0.62rem;
  vertical-align: 1px;
}

.ratio-summary__tag--modern {
  background: var(--jade);
}

.dose-conversion {
  margin: 0 2px 10px;
  padding: 9px 11px;
  border: 1px solid rgba(176, 138, 74, 0.28);
  border-radius: 8px;
  background: rgba(237, 224, 200, 0.24);
}

.dose-conversion__head {
  display: flex;
  align-items: center;
  color: var(--ink);
  font-family: var(--serif);
  font-size: 0.9rem;
}

.dose-conversion p {
  margin-top: 4px;
  color: var(--ink-faint);
  font-size: 0.7rem;
  line-height: 1.7;
}

.modern-summary {
  margin: 0 2px 10px;
  padding: 10px 12px;
  border: 1px solid rgba(47, 111, 107, 0.26);
  border-radius: 8px;
  background: rgba(221, 236, 232, 0.38);
}

.modern-summary__head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  color: var(--ink);
  font-family: var(--serif);
  font-size: 0.9rem;
}

.modern-summary__title {
  display: flex;
  align-items: center;
  gap: 0;
}

.dose-toggle {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border: 1px solid rgba(125, 60, 152, 0.35);
  border-radius: 999px;
  background: rgba(234, 220, 242, 0.5);
  color: #6c3483;
  cursor: pointer;
  font-size: 0.68rem;
  white-space: nowrap;
}

.dose-toggle:hover {
  border-color: #7d3c98;
  background: rgba(234, 220, 242, 0.85);
}

.dose-toggle__icon {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #7d3c98;
  color: #fff;
  font-size: 0.7rem;
  line-height: 1;
}

.modern-summary__dose {
  margin-top: 5px;
  color: var(--ink);
  font-family: var(--serif);
  font-size: 0.88rem;
  line-height: 1.75;
}

.modern-summary__note {
  margin-top: 4px;
  color: var(--ink-faint);
  font-size: 0.7rem;
  line-height: 1.7;
}

.analysis-source {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 0 2px 10px;
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.formula-meaning {
  margin-top: 4px;
}

.formula-meaning__head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-end;
  margin-bottom: 14px;
}

.formula-meaning__head h3 {
  margin-top: 2px;
  font-size: 1.35rem;
}

.formula-meaning__head > p {
  max-width: 430px;
  color: var(--ink-faint);
  font-size: 0.72rem;
  line-height: 1.7;
  text-align: right;
}

.formula-meaning__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.meaning-item {
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255, 252, 245, 0.5);
}

.meaning-item__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.meaning-item__head a {
  color: var(--ink);
  font-family: var(--serif);
  font-size: 1.05rem;
  text-decoration: underline;
  text-decoration-color: rgba(163, 58, 43, 0.28);
  text-underline-offset: 3px;
}

.meaning-item__head a:hover {
  color: var(--cinnabar);
}

.meaning-item__dose {
  margin-left: auto;
  color: var(--ink-soft);
  font-size: 0.72rem;
  white-space: nowrap;
}

.meaning-item > p {
  margin-top: 6px;
  color: var(--ink-soft);
  font-family: var(--serif);
  font-size: 0.88rem;
  line-height: 1.85;
}

.formula-meaning__summary {
  margin-top: 12px;
  padding: 16px 18px;
  border: 1px solid rgba(176, 138, 74, 0.28);
  border-radius: 12px;
  background: rgba(237, 224, 200, 0.28);
}

.formula-meaning__summary h4 {
  font-size: 0.98rem;
}

.formula-meaning__summary p {
  margin: 6px 0 8px;
  color: var(--ink);
  font-family: var(--serif);
  font-size: 0.92rem;
  line-height: 1.9;
  white-space: pre-line;
}

.composition-table {
  border: 1px solid var(--line);
  border-radius: 14px;
  overflow: hidden;
  background: rgba(255, 252, 245, 0.45);
}

.composition-row {
  display: grid;
  grid-template-columns:
    minmax(120px, 0.9fr) minmax(86px, 0.6fr) minmax(90px, 0.62fr)
    minmax(160px, 1.12fr) minmax(160px, 1.12fr);
  gap: 10px;
  align-items: center;
  padding: 11px 14px;
  border-bottom: 1px solid var(--line);
  font-size: 0.83rem;
}

.composition-row:last-child {
  border-bottom: 0;
}

.composition-row--head {
  background: rgba(235, 226, 210, 0.55);
  color: var(--ink-faint);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
}

.composition-row--selected {
  background: var(--cinnabar-pale);
}

.composition-row__herb {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.composition-row__herb a,
.role-item__name {
  font-family: var(--serif);
  font-size: 1rem;
  color: var(--ink);
  text-decoration: underline;
  text-decoration-color: rgba(163, 58, 43, 0.28);
  text-underline-offset: 3px;
}

.composition-row__herb a:hover,
.role-item__name:hover {
  color: var(--cinnabar);
}

.composition-row__source {
  color: var(--ink-soft);
  font-size: 0.75rem;
  line-height: 1.6;
}

.composition-row__note {
  display: block;
}

.ratio-cell,
.role-item__ratio {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.ratio-line {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ratio-tag {
  flex: 0 0 auto;
  padding: 0 4px;
  border-radius: 3px;
  background: rgba(163, 58, 43, 0.1);
  color: var(--cinnabar);
  font-size: 0.58rem;
}

.ratio-tag--modern {
  background: rgba(47, 111, 107, 0.12);
  color: var(--jade);
}

.ratio-bar--modern > span {
  background: linear-gradient(90deg, #1e8449, #7fb069);
}

.modern-cell {
  color: var(--jade);
  font-size: 0.8rem;
}

.ratio-bar {
  display: block;
  flex: 0 0 54px;
  height: 6px;
  border-radius: 999px;
  background: rgba(32, 37, 34, 0.09);
  overflow: hidden;
}

.ratio-bar > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #c0392b, #d68910);
}

.ratio-text {
  color: var(--ink-soft);
  font-size: 0.72rem;
  white-space: nowrap;
}

.ratio-text small {
  margin-left: 3px;
  padding: 0 4px;
  border-radius: 3px;
  background: var(--gold-pale);
  color: #7b5a26;
  font-size: 0.58rem;
}

.role-item__ratio {
  margin-top: 5px;
}

.role-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.2em;
  padding: 2px 8px;
  border-radius: 4px;
  background: #7f8c8d;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.role-pill::before {
  margin-right: 3px;
  font-size: 0.58em;
  opacity: 0.9;
}

.role-pill--君 {
  background: #c0392b;
  color: #fff;
}

.role-pill--君::before {
  content: "●";
}

.role-pill--臣 {
  background: #d68910;
  color: #fff;
}

.role-pill--臣::before {
  content: "■";
}

.role-pill--佐 {
  background: #1e8449;
  color: #fff;
}

.role-pill--佐::before {
  content: "▲";
}

.role-pill--使 {
  background: #2e5fa3;
  color: #fff;
}

.role-pill--使::before {
  content: "◆";
}

.role-pill--佐使 {
  background: #7d3c98;
  color: #fff;
}

.role-pill--佐使::before {
  content: "◈";
}

.role-pill--未标注 {
  background: #7f8c8d;
  color: #fff;
}

.locate-btn {
  padding: 1px 6px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: transparent;
  color: var(--ink-faint);
  cursor: pointer;
  font-size: 0.66rem;
}

.locate-btn:hover {
  border-color: var(--cinnabar);
  color: var(--cinnabar);
}

.composition-groups {
  display: grid;
  gap: 18px;
}

.role-group {
  scroll-margin-top: 100px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(255, 252, 245, 0.45);
  overflow: hidden;
}

.role-group__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 10px 14px;
  background: rgba(235, 226, 210, 0.45);
  border-bottom: 1px solid var(--line);
}

.role-group__head h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.98rem;
}

.role-group__head h3 > span:last-child {
  color: var(--ink-faint);
  font-family: var(--sans);
  font-size: 0.72rem;
  font-weight: 400;
}

.role-group__hint {
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.role-group__list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.role-item {
  padding: 13px 14px;
  border-bottom: 1px solid var(--line);
  border-right: 1px solid var(--line);
}

.role-item:nth-child(2n) {
  border-right: 0;
}

.role-item--selected {
  background: var(--cinnabar-pale);
}

.role-item__main {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: baseline;
}

.role-item__dosages {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.role-item__dosage {
  color: var(--ink-soft);
  font-size: 0.74rem;
  text-align: right;
}

.role-item__dosage--modern {
  color: var(--jade);
}

.role-item__meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  margin-top: 5px;
}

.role-item__note {
  margin-top: 5px;
  color: var(--ink-faint);
  font-size: 0.7rem;
}

@media (max-width: 760px) {
  .formula-meaning__head {
    flex-direction: column;
    align-items: flex-start;
  }

  .formula-meaning__head > p {
    text-align: left;
  }

  .formula-meaning__grid {
    grid-template-columns: 1fr;
  }

  .composition-row {
    grid-template-columns: 1fr 1fr;
  }

  .composition-row--head {
    display: none;
  }

  .composition-row__source,
  .composition-row > span:nth-child(4) {
    grid-column: span 2;
  }

  .role-group__list {
    grid-template-columns: 1fr;
  }

  .role-item {
    border-right: 0;
  }
}
</style>
