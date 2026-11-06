<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { formatCharCount } from '@/composables/useBencaoLectures'
import { loadBencaoDachengEntry, loadBencaoDachengIndex } from '@/composables/useBencaoDacheng'
import type { BencaoDachengEntry, BencaoDachengIndex } from '@/types/bencao-dacheng'

const route = useRoute()
const entry = ref<BencaoDachengEntry | null>(null)
const index = ref<BencaoDachengIndex | null>(null)
const loading = ref(true)
const error = ref('')

const entryId = computed(() => String(route.params.id ?? ''))
const position = computed(() => index.value?.items.findIndex((item) => item.id === entryId.value) ?? -1)
const previous = computed(() =>
  position.value > 0 ? index.value?.items[position.value - 1] ?? null : null,
)
const next = computed(() => {
  const items = index.value?.items ?? []
  return position.value >= 0 && position.value < items.length - 1 ? items[position.value + 1] : null
})

const images = computed(() => entry.value?.images ?? [])
const aliases = computed(() => (entry.value?.aliases ?? []).filter(Boolean))

const profileRows = computed(() => {
  const profile = entry.value?.profile
  if (!profile) return []
  return [
    { label: '性味', value: [profile.flavorTags.join('、'), profile.nature].filter(Boolean).join('，') },
    { label: '归经', value: profile.meridianNames.join('、') },
    { label: '功效', value: profile.effects },
    { label: '主治', value: profile.indications },
    { label: '用法用量', value: profile.dosage },
    { label: '使用注意', value: profile.contraindications },
  ].filter((row) => row.value)
})

function load(id: string) {
  if (!id) return
  loading.value = true
  error.value = ''
  Promise.all([loadBencaoDachengIndex(), loadBencaoDachengEntry(id)])
    .then(([catalog, detail]) => {
      index.value = catalog
      entry.value = detail
    })
    .catch((err: unknown) => {
      error.value = err instanceof Error ? err.message : '药材加载失败'
    })
    .finally(() => {
      loading.value = false
    })
}

watch(entryId, (id) => load(id), { immediate: true })
</script>

<template>
  <div class="page bencao-dacheng-entry">
    <div class="container">
      <nav class="breadcrumbs" aria-label="面包屑">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/herbs">本草</RouterLink>
        <span>/</span>
        <RouterLink to="/bencao/dacheng">本草大全</RouterLink>
        <span>/</span>
        <span>{{ entry?.name ?? '药材' }}</span>
      </nav>

      <p v-if="loading" class="entry-state paper-panel">正在展开药材页…</p>
      <div v-else-if="error" class="entry-state paper-panel">
        <h1>没有找到这味药材</h1>
        <p>{{ error }}</p>
        <button class="btn btn--primary" type="button" @click="load(entryId)">重试</button>
        <RouterLink class="btn btn--ghost btn--small" to="/bencao/dacheng">返回本草大全</RouterLink>
      </div>

      <template v-else-if="entry">
        <header class="detail-head">
          <div>
            <p class="eyebrow">MATERIA MEDICA / 本草大全 · {{ entry.categoryTitle }}</p>
            <h1>{{ entry.name }}</h1>
            <p v-if="entry.pinyin" class="detail-pinyin">{{ entry.pinyin }}</p>
            <p class="name-notes">
              <span v-if="aliases.length" class="name-note">又名：{{ aliases.join('、') }}</span>
              <span class="name-note name-note--muted">第 {{ entry.number }} 条</span>
              <span class="name-note name-note--muted">{{ entry.docCount }} 种来源</span>
            </p>
            <div class="detail-tags">
              <span v-for="tag in entry.profile.flavorTags" :key="tag" class="chip chip--cinnabar">{{ tag }}</span>
              <span v-if="entry.profile.nature" class="chip chip--cinnabar">{{ entry.profile.nature }}</span>
              <span class="chip chip--gold">{{ entry.categoryTitle }}</span>
            </div>
          </div>
          <div class="detail-head__stats">
            <span>{{ entry.sections.length }} 节</span>
            <span>{{ formatCharCount(entry.charCount) }}</span>
            <small>原文照录</small>
          </div>
        </header>

        <div class="dacheng-detail-grid">
          <section class="gallery paper-panel" aria-label="药材图片">
            <div v-if="images.length" class="gallery__grid">
              <figure v-for="image in images" :key="image.url" class="gallery__item">
                <div class="gallery__main">
                  <img :src="image.url" :alt="image.alt" />
                </div>
                <figcaption class="gallery__credit">
                  <p>{{ image.alt }}</p>
                  <small>
                    {{ image.credit }}
                    <span v-if="image.license"> · {{ image.license }}</span>
                    <a v-if="image.sourceUrl" :href="image.sourceUrl" target="_blank" rel="noreferrer noopener">来源</a>
                  </small>
                </figcaption>
              </figure>
            </div>
            <div v-else class="gallery__empty">
              <span class="gallery__empty-seal" aria-hidden="true">药</span>
              <p>图片待补</p>
              <small>未找到可确认授权与物种对应的图片，不以此药相似图替代。</small>
            </div>
          </section>

          <aside class="dacheng-profile paper-panel">
            <p class="eyebrow">PROFILE / 药性概览</p>
            <dl v-if="profileRows.length" class="dacheng-profile__list">
              <div v-for="row in profileRows" :key="row.label">
                <dt>{{ row.label }}</dt>
                <dd>{{ row.value }}</dd>
              </div>
            </dl>
            <p v-else class="dacheng-profile__empty">原书未单列药性概览。</p>
            <p class="dacheng-profile__source">
              据《本草纲目》引文与《中草药大全》整理；剂量与用法依原文，未作现代换算。
            </p>
          </aside>
        </div>

        <section v-if="entry.quote" class="dacheng-quote paper-panel">
          <p class="eyebrow">ORIGINAL QUOTE / 原书引文</p>
          <blockquote>“{{ entry.quote.text }}”</blockquote>
          <p class="dacheng-quote__source">—— {{ entry.quote.source || '原书引文' }}</p>
        </section>

        <section v-if="entry.sections.length" class="dacheng-sections" aria-label="原书资料">
          <article
            v-for="section in entry.sections"
            :key="`${section.label}-${section.kind}`"
            class="dacheng-section paper-panel"
          >
            <div class="dacheng-section__head">
              <span class="eyebrow">{{ section.kind.toUpperCase() }} / {{ section.label }}</span>
              <span v-if="section.source" class="dacheng-section__source">{{ section.source }}</span>
            </div>
            <p class="dacheng-section__text">{{ section.text }}</p>
          </article>
        </section>

        <p class="dacheng-disclaimer">
          本页为原书资料整理，原文照录，未逐字校勘；其中剂量、炮制与主治均依原书，不构成现代用药建议。
          需要用药时请由中医师辨证处方。
        </p>

        <nav class="dacheng-pager" aria-label="上下一条">
          <RouterLink v-if="previous" class="dacheng-pager__link" :to="`/bencao/dacheng/${previous.id}`">
            <span>← 上一味</span>
            <strong>{{ previous.name }}</strong>
          </RouterLink>
          <span v-else class="dacheng-pager__empty">已是第一条</span>
          <RouterLink class="btn btn--ghost btn--small" to="/bencao/dacheng">返回目录</RouterLink>
          <RouterLink v-if="next" class="dacheng-pager__link dacheng-pager__link--next" :to="`/bencao/dacheng/${next.id}`">
            <span>下一味 →</span>
            <strong>{{ next.name }}</strong>
          </RouterLink>
          <span v-else class="dacheng-pager__empty">已是最后一条</span>
        </nav>
      </template>
    </div>
  </div>
</template>

<style scoped>
.dacheng-detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(320px, 1.1fr);
  gap: 18px;
  margin-bottom: 18px;
}

.gallery,
.dacheng-profile,
.dacheng-quote,
.dacheng-section {
  padding: 18px;
}

.gallery__grid {
  display: grid;
  gap: 12px;
}

.gallery__main {
  aspect-ratio: 4 / 3;
  background: rgba(235, 226, 210, 0.5);
  overflow: hidden;
}

.gallery__main img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery__credit {
  margin: 0;
}

.gallery__credit p {
  margin: 0 0 3px;
  color: var(--ink);
  font-size: 0.76rem;
}

.gallery__credit small {
  color: var(--ink-faint);
  font-size: 0.62rem;
  line-height: 1.6;
}

.gallery__credit a {
  margin-left: 6px;
  color: var(--cinnabar);
}

.gallery__empty {
  min-height: 220px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  text-align: center;
  color: var(--ink-faint);
}

.gallery__empty-seal {
  width: 64px;
  height: 64px;
  border: 1px solid rgba(163, 58, 43, 0.35);
  display: grid;
  place-items: center;
  color: rgba(163, 58, 43, 0.38);
  font-family: var(--font-serif);
  font-size: 2rem;
}

.gallery__empty p {
  margin: 0;
  color: var(--ink-soft);
}

.gallery__empty small {
  max-width: 260px;
  line-height: 1.7;
}

.dacheng-profile__list {
  display: grid;
  gap: 10px;
  margin: 12px 0 0;
}

.dacheng-profile__list div {
  display: grid;
  grid-template-columns: 78px minmax(0, 1fr);
  gap: 10px;
  padding-bottom: 9px;
  border-bottom: 1px dashed var(--line);
}

.dacheng-profile__list dt {
  color: var(--cinnabar);
  font-family: var(--font-serif);
  font-size: 0.8rem;
}

.dacheng-profile__list dd {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.78rem;
  line-height: 1.75;
}

.dacheng-profile__empty,
.dacheng-profile__source {
  color: var(--ink-faint);
  font-size: 0.68rem;
  line-height: 1.7;
}

.dacheng-profile__source {
  margin: 14px 0 0;
  padding-top: 10px;
  border-top: 1px dashed var(--line);
}

.dacheng-quote {
  margin-bottom: 18px;
}

.dacheng-quote blockquote {
  margin: 10px 0 8px;
  padding-left: 16px;
  border-left: 3px solid var(--cinnabar);
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 1.02rem;
  line-height: 1.9;
}

.dacheng-quote__source {
  margin: 0;
  text-align: right;
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.dacheng-sections {
  display: grid;
  gap: 12px;
}

.dacheng-section__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  align-items: baseline;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--line);
}

.dacheng-section__source {
  color: var(--ink-faint);
  font-size: 0.62rem;
}

.dacheng-section__text {
  margin: 10px 0 0;
  color: var(--ink-soft);
  font-size: 0.82rem;
  line-height: 1.95;
  white-space: pre-wrap;
}

.dacheng-source-note,
.dacheng-disclaimer {
  margin-top: 14px;
  padding: 12px 14px;
  border-left: 2px solid var(--line-strong);
  background: rgba(255, 255, 255, 0.42);
  color: var(--ink-faint);
  font-size: 0.68rem;
  line-height: 1.8;
}

.dacheng-disclaimer {
  border-left-color: var(--cinnabar);
}

.dacheng-pager {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin: 24px 0 8px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}

.dacheng-pager__link {
  display: grid;
  gap: 2px;
  color: inherit;
  text-decoration: none;
}

.dacheng-pager__link span {
  color: var(--ink-faint);
  font-size: 0.64rem;
}

.dacheng-pager__link strong {
  color: var(--cinnabar);
  font-family: var(--font-serif);
  font-size: 0.92rem;
}

.dacheng-pager__link--next {
  text-align: right;
}

.dacheng-pager__empty {
  color: var(--ink-faint);
  font-size: 0.7rem;
}

@media (max-width: 900px) {
  .dacheng-detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
