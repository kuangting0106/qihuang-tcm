<script setup lang="ts">
import { computed, ref } from 'vue'
import CitationBadge from './CitationBadge.vue'
import type { HerbPrinciples } from '@/types/tcm'

const props = defineProps<{ principles: HerbPrinciples | null }>()
const principles = computed(() => props.principles)

const canHover =
  typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches
const hovered = ref(false)
const pinned = ref(false)
const expanded = computed(() => hovered.value || pinned.value)

const triggerHint = computed(() => {
  if (pinned.value) return '已展开 · 点击收起'
  if (canHover && hovered.value) return '悬停预览 · 点击固定'
  return canHover ? '悬停预览 / 点击展开' : '点击展开'
})

function onHoverIn() {
  if (canHover) hovered.value = true
}

function onHoverOut() {
  if (canHover) hovered.value = false
}

function toggle() {
  pinned.value = !pinned.value
}
</script>

<template>
  <section
    v-if="principles"
    id="herb-principles"
    class="principles"
    :class="{ 'principles--open': expanded }"
    @mouseenter="onHoverIn"
    @mouseleave="onHoverOut"
  >
    <button
      class="principles__trigger"
      type="button"
      :aria-expanded="expanded"
      aria-controls="herb-principles-panel"
      @click="toggle"
    >
      <span class="principles__kicker">FOUNDATION / 药性</span>
      <span class="principles__title">{{ principles.title }}</span>
      <span class="principles__hint">{{ triggerHint }}</span>
      <span class="principles__arrow" :class="{ 'is-open': expanded }" aria-hidden="true">⌄</span>
    </button>

    <div v-show="expanded" id="herb-principles-panel" class="principles__panel">
      <p class="principles__lead">{{ principles.intro }}</p>

      <div class="mindmap">
        <div class="mindmap__root">
          <span class="eyebrow">HERB PROPERTIES</span>
          <strong>药性<br />总纲</strong>
          <p>三品 · 气味 · 升降 · 部位 · 七情</p>
        </div>

        <div class="mindmap__branches">
          <article
            v-for="branch in principles.branches"
            :key="branch.id"
            class="principle-branch"
            :class="`principle-branch--${branch.tone}`"
          >
            <header class="principle-branch__head">
              <span class="principle-branch__index">{{ branch.index }}</span>
              <div>
                <h3>{{ branch.title }}</h3>
                <p>{{ branch.subtitle }}</p>
              </div>
            </header>

            <p class="principle-branch__summary">{{ branch.summary }}</p>

            <dl class="principle-branch__items">
              <div v-for="item in branch.items" :key="item.label">
                <dt>{{ item.label }}</dt>
                <dd>{{ item.text }}</dd>
              </div>
            </dl>

            <footer class="principle-branch__foot">
              <span class="principle-branch__kind">{{ branch.kindLabel }}</span>
              <CitationBadge :citation-ids="branch.citationIds" label="依据" compact />
            </footer>

            <p class="principle-branch__note">{{ branch.note }}</p>
          </article>
        </div>
      </div>

      <p class="principles__closing">{{ principles.closing }}</p>
    </div>
  </section>
</template>

<style scoped>
.principles {
  scroll-margin-top: 92px;
  margin: 2px 0 22px;
  border-top: 1px solid var(--line-strong);
  border-bottom: 1px solid var(--line);
  background:
    linear-gradient(90deg, rgba(224, 236, 226, 0.42), transparent 34%),
    rgba(255, 252, 245, 0.32);
}

.principles__trigger {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto 18px;
  gap: 14px;
  align-items: center;
  width: 100%;
  padding: 13px 2px;
  border: 0;
  background: none;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.principles__kicker {
  color: var(--ink-faint);
  font-size: 0.6rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  white-space: nowrap;
}

.principles__title {
  font-family: var(--serif);
  font-size: 1.14rem;
  letter-spacing: 0.06em;
}

.principles__hint {
  color: var(--ink-faint);
  font-size: 0.68rem;
  white-space: nowrap;
}

.principles__arrow {
  color: var(--cinnabar);
  font-size: 1rem;
  transition: transform 0.2s ease;
}

.principles__arrow.is-open {
  transform: rotate(180deg);
}

.principles__panel {
  padding: 4px 0 18px;
  border-top: 1px dashed var(--line);
}

.principles__lead {
  max-width: 900px;
  margin: 14px 0 18px;
  color: var(--ink-soft);
  font-size: 0.82rem;
  line-height: 1.85;
}

.mindmap {
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr);
  gap: 34px;
  align-items: start;
}

.mindmap__root {
  position: sticky;
  top: 92px;
  padding: 18px 18px 16px;
  border: 1px solid var(--line-strong);
  border-radius: 18px;
  background:
    radial-gradient(circle at 18% 12%, rgba(255, 255, 255, 0.9), transparent 44%),
    rgba(247, 242, 231, 0.9);
  box-shadow: var(--shadow-soft);
}

.mindmap__root::after {
  content: '';
  position: absolute;
  top: 50%;
  right: -35px;
  width: 35px;
  border-top: 1px solid var(--line-strong);
}

.mindmap__root strong {
  display: block;
  margin: 8px 0 10px;
  font-family: var(--serif);
  font-size: 1.8rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  line-height: 1.18;
}

.mindmap__root p {
  color: var(--ink-faint);
  font-size: 0.68rem;
  line-height: 1.7;
}

.mindmap__branches {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 30px;
}

.mindmap__branches::before {
  content: '';
  position: absolute;
  top: 26px;
  bottom: 26px;
  left: 9px;
  border-left: 1px solid var(--line-strong);
}

.principle-branch {
  --branch-color: var(--jade);
  position: relative;
  padding: 14px 16px 13px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(255, 252, 245, 0.62);
  transition: border-color 0.18s ease, background 0.18s ease;
}

.principle-branch::before {
  content: '';
  position: absolute;
  top: 28px;
  left: -21px;
  width: 21px;
  border-top: 1px solid var(--line-strong);
}

.principle-branch:hover {
  border-color: var(--branch-color);
  background: rgba(255, 252, 245, 0.9);
}

.principle-branch--gold {
  --branch-color: var(--gold);
}

.principle-branch--cinnabar {
  --branch-color: var(--cinnabar);
}

.principle-branch--plum {
  --branch-color: #7d5d74;
}

.principle-branch--stone {
  --branch-color: #66706d;
}

.principle-branch--moss {
  --branch-color: #6d7752;
}

.principle-branch__head {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.principle-branch__index {
  flex-shrink: 0;
  color: var(--branch-color);
  font-family: var(--serif);
  font-size: 0.82rem;
  line-height: 1.35;
}

.principle-branch__head h3 {
  font-size: 1rem;
  letter-spacing: 0.04em;
}

.principle-branch__head p {
  margin-top: 2px;
  color: var(--ink-faint);
  font-size: 0.68rem;
  line-height: 1.55;
}

.principle-branch__summary {
  margin-top: 8px;
  color: var(--ink-soft);
  font-size: 0.76rem;
  line-height: 1.7;
}

.principle-branch__items {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px 18px;
  margin-top: 9px;
}

.principle-branch__items > div {
  display: grid;
  grid-template-columns: 4.6em minmax(0, 1fr);
  gap: 8px;
  align-items: baseline;
  padding-top: 5px;
  border-top: 1px dashed var(--line);
}

.principle-branch__items dt {
  color: var(--branch-color);
  font-size: 0.68rem;
  font-weight: 600;
  line-height: 1.6;
}

.principle-branch__items dd {
  color: var(--ink-soft);
  font-size: 0.7rem;
  line-height: 1.65;
}

.principle-branch__foot {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 10px;
}

.principle-branch__kind {
  padding: 2px 7px;
  border: 1px solid color-mix(in srgb, var(--branch-color) 42%, transparent);
  border-radius: 999px;
  color: var(--branch-color);
  font-size: 0.58rem;
  line-height: 1.5;
}

.principle-branch__note {
  margin-top: 7px;
  color: var(--ink-faint);
  font-size: 0.64rem;
  line-height: 1.65;
}

.principles__closing {
  margin-top: 14px;
  color: var(--ink-faint);
  font-size: 0.68rem;
  line-height: 1.7;
}

@media (max-width: 900px) {
  .mindmap {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .mindmap__root {
    position: static;
  }

  .mindmap__root::after {
    display: none;
  }

  .mindmap__root strong {
    display: inline;
    margin: 0 0 0 8px;
    font-size: 1.35rem;
  }

  .mindmap__root p {
    margin-top: 6px;
  }
}

@media (max-width: 700px) {
  .principles__trigger {
    grid-template-columns: minmax(0, 1fr) 18px;
    gap: 2px 10px;
  }

  .principles__kicker {
    grid-column: 1 / -1;
  }

  .principles__hint {
    grid-column: 1 / 2;
    font-size: 0.62rem;
  }

  .principles__arrow {
    grid-column: 2 / 3;
    grid-row: 2 / 4;
  }

  .principle-branch__items {
    grid-template-columns: 1fr;
  }
}
</style>
