<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { loadBencaoDachengEntry, loadBencaoDachengIndex } from '@/composables/useBencaoDacheng'
import HerbImageCarousel from '@/components/HerbImageCarousel.vue'
import type {
  BencaoDachengEntry,
  BencaoDachengIndex,
  BencaoDachengProfile,
  BencaoDachengVariant,
} from '@/types/bencao-dacheng'

const route = useRoute()
const router = useRouter()
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
const variants = computed(() => entry.value?.variants ?? [])

function rowsOf(profile: BencaoDachengProfile | undefined) {
  if (!profile) return []
  return [
    { label: '性味', value: [profile.flavorTags.join('、'), profile.nature].filter(Boolean).join('，') },
    { label: '归经', value: profile.meridianNames.join('、') },
    { label: '功效', value: profile.effects },
    { label: '主治', value: profile.indications },
    { label: '用法用量', value: profile.dosage },
    { label: '使用注意', value: profile.contraindications },
  ].filter((row) => row.value)
}

const profileRows = computed(() => rowsOf(entry.value?.profile))
const variantRows = (variant: BencaoDachengVariant) => rowsOf(variant.profile)

function load(id: string) {
  if (!id) return
  let redirected = false
  loading.value = true
  error.value = ''
  Promise.all([loadBencaoDachengIndex(), loadBencaoDachengEntry(id)])
    .then(([catalog, detail]) => {
      index.value = catalog
      if (detail.mergedInto) {
        redirected = true
        router.replace(`/bencao/dacheng/${detail.mergedInto}`)
        return
      }
      entry.value = detail
    })
    .catch((err: unknown) => {
      error.value = err instanceof Error ? err.message : '药材加载失败'
    })
    .finally(() => {
      if (!redirected) loading.value = false
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
            <small>原文照录</small>
          </div>
        </header>

        <div class="dacheng-detail-grid">
          <section class="gallery paper-panel" aria-label="药材图片">
            <HerbImageCarousel v-if="images.length" :images="images" />
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
              {{ entry.sourceNote || '据《本草纲目》引文与《中草药大全》整理；剂量与用法依原文，未作现代换算。' }}
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

        <section v-if="variants.length" class="dacheng-variants" aria-label="同源药材">
          <div class="dacheng-variants__head">
            <p class="eyebrow">SAME SOURCE / 同源药材</p>
            <p class="dacheng-variants__note">
              以下为同一基源的不同药用部位、炮制品或近缘同名药材，已并入本页；各条原文、出处与图片分别保留。
              <span v-if="entry.basis">基源：{{ entry.basis }}。</span>
            </p>
          </div>
          <details v-for="variant in variants" :key="variant.id" class="dacheng-variant paper-panel">
            <summary class="dacheng-variant__summary">
              <span class="dacheng-variant__name">{{ variant.name }}</span>
              <span v-if="variant.aliases.length" class="dacheng-variant__alias">
                又名：{{ variant.aliases.join('、') }}
              </span>
              <span class="dacheng-variant__meta">
                {{ variant.categoryTitle }}<template v-if="variant.summary"> · {{ variant.summary }}</template>
              </span>
            </summary>
            <div class="dacheng-variant__body">
              <div v-if="variant.images.length" class="dacheng-variant__gallery">
                <figure v-for="image in variant.images" :key="image.url">
                  <img :src="image.url" :alt="image.alt" loading="lazy" />
                  <figcaption>
                    {{ image.credit }}<span v-if="image.license"> · {{ image.license }}</span>
                  </figcaption>
                </figure>
              </div>
              <dl v-if="variantRows(variant).length" class="dacheng-profile__list">
                <div v-for="row in variantRows(variant)" :key="row.label">
                  <dt>{{ row.label }}</dt>
                  <dd>{{ row.value }}</dd>
                </div>
              </dl>
              <div v-if="variant.sections.length" class="dacheng-variant__sections">
                <article v-for="section in variant.sections" :key="`${section.label}-${section.kind}`">
                  <div class="dacheng-section__head">
                    <span class="eyebrow">{{ section.kind.toUpperCase() }} / {{ section.label }}</span>
                    <span v-if="section.source" class="dacheng-section__source">{{ section.source }}</span>
                  </div>
                  <p class="dacheng-section__text">{{ section.text }}</p>
                </article>
              </div>
              <p class="dacheng-profile__source">
                {{ variant.sourceNote || '据原书资料整理；剂量与用法依原文，未作现代换算。' }}
              </p>
            </div>
          </details>
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

.dacheng-variants {
  display: grid;
  gap: 12px;
  margin-top: 22px;
}

.dacheng-variants__head {
  display: grid;
  gap: 5px;
}

.dacheng-variants__note {
  max-width: 72ch;
  margin: 0;
  color: var(--ink-faint);
  font-size: 0.7rem;
  line-height: 1.8;
}

.dacheng-variant {
  padding: 0;
}

.dacheng-variant__summary {
  display: grid;
  gap: 4px;
  padding: 14px 18px;
  cursor: pointer;
  list-style: none;
}

.dacheng-variant__summary::-webkit-details-marker {
  display: none;
}

.dacheng-variant__summary::before {
  content: '＋';
  float: right;
  color: var(--cinnabar);
  font-family: var(--font-serif);
}

.dacheng-variant[open] .dacheng-variant__summary::before {
  content: '－';
}

.dacheng-variant__name {
  color: var(--cinnabar);
  font-family: var(--font-serif);
  font-size: 1.02rem;
}

.dacheng-variant__alias {
  color: var(--ink-soft);
  font-size: 0.72rem;
}

.dacheng-variant__meta {
  color: var(--ink-faint);
  font-size: 0.66rem;
  line-height: 1.6;
}

.dacheng-variant__body {
  display: grid;
  gap: 12px;
  padding: 0 18px 18px;
  border-top: 1px dashed var(--line);
}

.dacheng-variant__gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
  padding-top: 12px;
}

.dacheng-variant__gallery figure {
  margin: 0;
}

.dacheng-variant__gallery img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}

.dacheng-variant__gallery figcaption {
  margin-top: 3px;
  color: var(--ink-faint);
  font-size: 0.6rem;
  line-height: 1.5;
}

.dacheng-variant__sections {
  display: grid;
}

.dacheng-variant__sections article {
  padding: 10px 0;
  border-top: 1px dashed var(--line);
}

.dacheng-variant__sections article:first-child {
  border-top: 0;
}

@media (max-width: 900px) {
  .dacheng-detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
