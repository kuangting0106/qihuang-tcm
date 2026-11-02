<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { findBencaoEntry, formatCharCount, loadBencaoGroup, loadBencaoIndex } from '@/composables/useBencaoLectures'
import type { BencaoEntry, BencaoGroup, BencaoLectureIndex } from '@/types/bencao'

const route = useRoute()
const index = ref<BencaoLectureIndex | null>(null)
const group = ref<BencaoGroup | null>(null)
const entry = ref<BencaoEntry | null>(null)
const position = ref(-1)
const loading = ref(true)
const error = ref('')

const groupId = computed(() => String(route.params.groupId ?? ''))
const entryId = computed(() => String(route.params.entryId ?? ''))

async function load(gid: string, eid: string) {
  loading.value = true
  error.value = ''
  entry.value = null
  try {
    const [library, payload] = await Promise.all([loadBencaoIndex(), loadBencaoGroup(gid)])
    index.value = library
    group.value = payload
    const found = findBencaoEntry(payload, eid)
    if (!found) throw new Error('没有找到这条讲义')
    entry.value = found.entry
    position.value = found.index
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : '讲义加载失败'
  } finally {
    loading.value = false
  }
}

watch(
  () => [groupId.value, entryId.value],
  ([gid, eid]) => { if (gid && eid) load(gid, eid) },
  { immediate: true },
)

const previous = computed(() =>
  group.value && position.value > 0 ? group.value.entries[position.value - 1] : null,
)
const next = computed(() =>
  group.value && position.value >= 0 ? group.value.entries[position.value + 1] ?? null : null,
)

const groupTitle = computed(() => group.value?.title ?? '')
const kindClass = (kind: string) => `entry-section--${kind}`

function sectionHeading(label: string): string {
  if (label) return label
  return group.value?.id === 'intro' ? '讲义' : '课堂讲授'
}

function isProcessingSection(label: string): boolean {
  return /炮制|泡制/.test(label)
}
</script>

<template>
  <div class="page bencao-entry">
    <div class="container">
      <nav class="breadcrumbs" aria-label="面包屑">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/herbs">本草</RouterLink>
        <span>/</span>
        <RouterLink to="/bencao">神农本草经讲义</RouterLink>
        <span>/</span>
        <RouterLink :to="`/bencao/${groupId}`">{{ groupTitle }}</RouterLink>
        <span>/</span>
        <span>{{ entry?.title ?? '正文' }}</span>
      </nav>

      <p v-if="loading" class="entry-state paper-panel">正在展开药条…</p>
      <div v-else-if="error" class="entry-state paper-panel">
        <h1>药条没有打开</h1>
        <p>{{ error }}</p>
        <RouterLink class="btn btn--primary" :to="`/bencao/${groupId}`">返回本组目录</RouterLink>
      </div>

      <template v-else-if="entry">
        <header class="entry-head">
          <div>
            <p class="eyebrow">{{ groupTitle }} / 讲义</p>
            <h1>{{ entry.title }}</h1>
            <p class="entry-head__sub">
              {{ entry.subtitle }}
              <span v-if="entry.number !== null"> · 第 {{ entry.number }} 条</span>
            </p>
          </div>
          <dl class="entry-head__stats">
            <div><dt>{{ entry.sections.length }}</dt><dd>节</dd></div>
            <div><dt>{{ formatCharCount(entry.charCount) }}</dt><dd>正文</dd></div>
          </dl>
        </header>

        <p v-if="entry.note" class="entry-correction">{{ entry.note }}</p>

        <p v-if="group?.id === 'editor'" class="entry-correction entry-correction--caution">
          本条属整理者增补，不是倪海厦原讲义正文。
        </p>

        <section v-if="entry.profile" class="entry-profile" aria-label="药性概览">
          <div class="entry-profile__item">
            <span class="entry-profile__label">性味</span>
            <p class="entry-profile__value">
              <span v-for="t in entry.profile.flavorTags" :key="t" class="chip chip--cinnabar">{{ t }}</span>
              <span v-if="entry.profile.nature" class="chip chip--cinnabar">{{ entry.profile.nature }}</span>
              <span v-if="!entry.profile.flavorTags.length && !entry.profile.nature" class="is-pending">待考</span>
            </p>
          </div>
          <div class="entry-profile__item">
            <span class="entry-profile__label">归经</span>
            <p class="entry-profile__value">
              <span v-for="m in entry.profile.meridianNames" :key="m" class="chip chip--jade">{{ m }}</span>
              <span v-if="entry.profile.meridianPending" class="is-pending">归经待考</span>
            </p>
          </div>
          <div class="entry-profile__item">
            <span class="entry-profile__label">功效</span>
            <p class="entry-profile__value entry-profile__value--text">{{ entry.profile.effects || '待考' }}</p>
          </div>
          <div class="entry-profile__item">
            <span class="entry-profile__label">主治</span>
            <p class="entry-profile__value entry-profile__value--text">{{ entry.profile.indications || '待考' }}</p>
          </div>
          <div class="entry-profile__item">
            <span class="entry-profile__label">禁忌</span>
            <p class="entry-profile__value entry-profile__value--text">{{ entry.profile.contraindications || '讲义未载，待考' }}</p>
          </div>
        </section>

        <p v-if="entry.profile?.sources.length" class="entry-profile__note">
          药性概览来源：{{ entry.profile.sources.join(' · ') }}。
          讲义未载的性味、归经与功效，仅用公开中药资料补足，不作校勘依据；用药请以原书与现行药典为准。
        </p>

        <article class="entry-body">
          <section
            v-for="(section, sectionIndex) in entry.sections"
            :key="`${section.label}-${sectionIndex}`"
            class="entry-section"
            :class="kindClass(section.kind)"
          >
            <header class="entry-section__head">
              <h2>{{ sectionHeading(section.label) }}</h2>
              <span v-if="sectionHeading(section.label) !== section.kindLabel" class="entry-section__kind">{{ section.kindLabel }}</span>
            </header>

            <p v-if="isProcessingSection(section.label)" class="entry-processing-note">
              以下为讲义所载炮制方法，未经现行炮制规范逐条核对，仅供阅读。
              <RouterLink to="/processing">到药材炮制板块查看已核条目 →</RouterLink>
            </p>

            <div class="entry-section__blocks">
              <template v-for="(block, blockIndex) in section.blocks" :key="blockIndex">
                <blockquote v-if="block.type === 'quote'" class="entry-quote">
                  <span class="entry-quote__mark" aria-hidden="true">讲</span>
                  <p>{{ block.text }}</p>
                </blockquote>
                <p v-else class="entry-paragraph">{{ block.text }}</p>
              </template>
            </div>
          </section>
        </article>

        <div class="entry-source">
          <p v-if="index">
            {{ index.source.note }}
          </p>
          <p class="entry-source__meta">
            底本：{{ index?.source.repository }} @ {{ index?.source.commit.slice(0, 7) }} ·
            {{ index?.source.sourcePath }}
          </p>
        </div>

        <nav class="entry-nav" aria-label="上下条">
          <RouterLink
            v-if="previous"
            class="entry-nav__link"
            :to="`/bencao/${groupId}/${previous.id}`"
          >
            <small>上一条</small>
            <strong>{{ previous.title }}</strong>
          </RouterLink>
          <span v-else class="entry-nav__empty">已是本组第一条</span>

          <RouterLink class="entry-nav__back" :to="`/bencao/${groupId}`">返回目录</RouterLink>

          <RouterLink
            v-if="next"
            class="entry-nav__link entry-nav__link--next"
            :to="`/bencao/${groupId}/${next.id}`"
          >
            <small>下一条</small>
            <strong>{{ next.title }}</strong>
          </RouterLink>
          <span v-else class="entry-nav__empty">已是本组最后一条</span>
        </nav>
      </template>
    </div>
  </div>
</template>

<style scoped>
.entry-head {
  display: flex;
  justify-content: space-between;
  gap: 36px;
  align-items: flex-end;
  padding: 24px 0 22px;
  border-bottom: 1px solid var(--line-strong);
}

.entry-head h1 {
  margin: 6px 0 6px;
  font-size: clamp(2.3rem, 5vw, 3.4rem);
  letter-spacing: 0.08em;
}

.entry-head__sub {
  color: var(--ink-faint);
  font-size: 0.74rem;
}

.entry-head__stats {
  display: flex;
  gap: 20px;
  flex: 0 0 auto;
  padding-left: 20px;
  border-left: 1px solid var(--line-strong);
}

.entry-head__stats dt {
  font-family: var(--serif);
  font-size: 1.35rem;
  line-height: 1.2;
}

.entry-head__stats dd {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.64rem;
}

.entry-correction {
  margin-top: 12px;
  padding: 9px 13px;
  border-left: 2px solid var(--gold);
  background: rgba(237, 224, 200, 0.3);
  color: var(--ink-soft);
  font-size: 0.72rem;
  line-height: 1.8;
}

.entry-correction--caution {
  border-left-color: var(--cinnabar);
  background: rgba(241, 221, 214, 0.3);
  color: var(--cinnabar);
}

.entry-profile {
  display: grid;
  grid-template-columns: 0.7fr 0.8fr 1fr 1.2fr 1fr;
  gap: 1px;
  margin-top: 18px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--line);
  overflow: hidden;
}

.entry-profile__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  background: rgba(255, 252, 245, 0.72);
}

.entry-profile__label {
  color: var(--ink-faint);
  font-size: 0.62rem;
  letter-spacing: 0.12em;
}

.entry-profile__value {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  color: var(--ink-soft);
  font-size: 0.74rem;
  line-height: 1.65;
}

.entry-profile__value--text {
  display: block;
}

.entry-profile__value .is-pending {
  color: var(--ink-faint);
  font-size: 0.7rem;
}

.entry-profile__note {
  margin-top: 8px;
  color: var(--ink-faint);
  font-size: 0.64rem;
  line-height: 1.7;
}

.entry-body {
  max-width: 880px;
  margin: 8px auto 0;
}

.entry-section {
  padding: 18px 0 6px;
  border-bottom: 1px dashed var(--line);
}

.entry-section__head {
  display: flex;
  gap: 10px;
  align-items: baseline;
  margin-bottom: 8px;
}

.entry-section__head h2 {
  font-size: 1.05rem;
  letter-spacing: 0.05em;
}

.entry-section__kind {
  padding: 1px 7px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  color: var(--ink-faint);
  font-size: 0.56rem;
  white-space: nowrap;
}

.entry-section--original .entry-section__head h2 {
  color: var(--cinnabar);
}

.entry-section--original .entry-section__kind {
  border-color: rgba(163, 58, 43, 0.36);
  color: var(--cinnabar);
}

.entry-section--nishi .entry-section__head h2 {
  color: var(--jade);
}

.entry-section--nishi .entry-section__kind {
  border-color: rgba(47, 93, 87, 0.36);
  color: var(--jade);
}

.entry-section--study .entry-section__head h2 {
  color: var(--gold);
}

.entry-section--study .entry-section__kind {
  border-color: rgba(176, 138, 74, 0.4);
  color: var(--gold);
}

.entry-processing-note {
  margin: 0 0 8px;
  color: var(--ink-faint);
  font-size: 0.68rem;
  line-height: 1.7;
}

.entry-processing-note a {
  color: var(--cinnabar);
  border-bottom: 1px solid rgba(163, 58, 43, 0.3);
}

.entry-section__blocks {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.entry-paragraph {
  color: var(--ink-soft);
  font-family: var(--serif);
  font-size: 0.94rem;
  line-height: 2;
  text-align: justify;
}

.entry-quote {
  position: relative;
  display: flex;
  gap: 10px;
  padding: 8px 12px 8px 10px;
  border-left: 2px solid rgba(47, 93, 87, 0.32);
  background: rgba(220, 232, 226, 0.24);
}

.entry-quote__mark {
  flex: 0 0 auto;
  color: var(--jade-2);
  font-family: var(--serif);
  font-size: 0.66rem;
  line-height: 1.9;
}

.entry-quote p {
  color: var(--ink-soft);
  font-size: 0.86rem;
  line-height: 1.95;
}

.entry-source {
  max-width: 880px;
  margin: 18px auto 0;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}

.entry-source p {
  color: var(--ink-faint);
  font-size: 0.66rem;
  line-height: 1.8;
}

.entry-source__meta {
  margin-top: 4px;
}

.entry-nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin: 24px 0 10px;
  padding-top: 16px;
  border-top: 1px solid var(--line-strong);
}

.entry-nav__link {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 40%;
}

.entry-nav__link small {
  color: var(--ink-faint);
  font-size: 0.6rem;
}

.entry-nav__link strong {
  font-family: var(--serif);
  font-size: 0.95rem;
  font-weight: 500;
}

.entry-nav__link--next {
  text-align: right;
}

.entry-nav__back {
  color: var(--jade);
  font-size: 0.74rem;
}

.entry-nav__empty {
  color: var(--ink-faint);
  font-size: 0.66rem;
}

.entry-state {
  padding: 26px;
  color: var(--ink-soft);
}

.entry-state h1 {
  margin-bottom: 8px;
}

@media (max-width: 900px) {
  .entry-profile {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .entry-profile__item:last-child {
    grid-column: 1 / -1;
  }
}

@media (max-width: 700px) {
  .entry-profile {
    grid-template-columns: 1fr;
  }

  .entry-profile__item:last-child {
    grid-column: auto;
  }

  .entry-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .entry-head__stats {
    padding-left: 0;
    border-left: 0;
  }

  .entry-paragraph {
    font-size: 0.88rem;
  }

  .entry-nav__link {
    max-width: 44%;
  }
}
</style>
