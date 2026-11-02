<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import CitationBadge from '@/components/CitationBadge.vue'
import SourcedText from '@/components/SourcedText.vue'
import { HERB_IMAGE_SLOT_LABELS } from '@/types/tcm'
import type { BencaoCatalogItem } from '@/types/bencao'
import { formatCharCount, loadBencaoCatalog } from '@/composables/useBencaoLectures'
import { useTcmData } from '@/composables/useTcmData'

const route = useRoute()
const { data, herbsById, meridianName } = useTcmData()

const herb = computed(() => herbsById.value.get(String(route.params.id)) ?? null)
const activeImage = ref(0)

const taxonomy = computed(() => data.value?.herbTaxonomy ?? null)
const rank = computed(() =>
  taxonomy.value?.ranks.find((r) => r.id === herb.value?.classicRankId) ?? null,
)
const categories = computed(() =>
  (herb.value?.therapyCategoryIds ?? [])
    .map((id) => taxonomy.value?.categories.find((c) => c.id === id))
    .filter((c) => !!c),
)

watch(
  () => route.params.id,
  () => {
    activeImage.value = 0
  },
)

const lectureItem = ref<BencaoCatalogItem | null>(null)

watch(
  () => herb.value?.name,
  async (name) => {
    lectureItem.value = null
    if (!name) return
    try {
      const catalog = await loadBencaoCatalog()
      lectureItem.value = catalog.items.find((item) => item.name === name) ?? null
    } catch {
      lectureItem.value = null
    }
  },
  { immediate: true },
)

const meridianLinks = computed(() =>
  (herb.value?.meridianIds ?? []).map((id) => ({
    id,
    name: meridianName(id),
  })),
)

const pairings = computed(() =>
  (herb.value?.pairings ?? [])
    .map((p) => ({
      ...p,
      herb: herbsById.value.get(p.herbId),
    }))
    .filter((p) => !!p.herb),
)

const currentImage = computed(() => herb.value?.images[activeImage.value] ?? herb.value?.images[0])

const slotLabels = HERB_IMAGE_SLOT_LABELS
const currentSlotLabel = computed(() => {
  const slot = currentImage.value?.slot
  return slot ? slotLabels[slot] : '全图'
})
</script>

<template>
  <div v-if="herb" class="page herb-detail-page">
    <div class="container">
      <nav class="breadcrumbs" aria-label="面包屑">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/herbs">本草</RouterLink>
        <span>/</span>
        <span>{{ herb.name }}</span>
      </nav>

      <header class="detail-head">
        <div>
          <p class="eyebrow">HERB / 本草</p>
          <div class="detail-title-row">
            <h1>{{ herb.name }}</h1>
            <span class="detail-pinyin">{{ herb.pinyin }}</span>
          </div>
          <p class="detail-aliases">
            现代别名：{{ herb.aliases.length ? herb.aliases.join('、') : '暂无' }}
          </p>
          <div class="name-notes">
            <p>
              <strong>古籍名</strong>
              <span>{{ herb.names.ancient.text }}</span>
              <CitationBadge :citation-ids="herb.names.ancient.citationIds" label="名字出处" compact />
            </p>
            <p>
              <strong>地域名</strong>
              <span>{{ herb.names.regional.text }}</span>
              <CitationBadge :citation-ids="herb.names.regional.citationIds" label="名字出处" compact />
            </p>
          </div>
          <div class="detail-tags">
            <span v-for="t in herb.flavorTags" :key="t" class="chip chip--cinnabar">{{ t }}</span>
            <span class="chip chip--gold">{{ herb.verification === 'reference' ? '药典依据' : '待核验' }}</span>
          </div>
          <div class="taxonomy-links">
            <span class="taxonomy-links__label">分类</span>
            <RouterLink v-if="rank" class="chip chip--gold" :to="`/herbs?rank=${rank.id}`">
              {{ rank.title }} · {{ rank.subtitle }}
            </RouterLink>
            <RouterLink
              v-for="cat in categories"
              :key="cat.id"
              class="chip"
              :to="`/herbs?category=${cat.id}`"
            >
              {{ cat.title }}
            </RouterLink>
          </div>
        </div>
        <div class="detail-head__source">
          <span class="muted tiny">主要出处</span>
          <CitationBadge :citation-ids="herb.properties.effects.citationIds" />
        </div>
      </header>

      <div class="herb-detail-grid">
        <section class="gallery paper-panel">
          <div class="gallery__main" :class="{ 'gallery__main--pending': currentImage?.pending }">
            <img :src="currentImage?.url" :alt="currentImage?.alt" />
            <span class="gallery__slot">{{ currentSlotLabel }}</span>
          </div>
          <div class="gallery__thumbs">
            <button
              v-for="(im, index) in herb.images"
              :key="im.url"
              type="button"
              class="gallery__thumb"
              :class="{ 'gallery__thumb--active': index === activeImage }"
              :aria-label="im.caption"
              @click="activeImage = index"
            >
              <img :src="im.url" :alt="im.alt" loading="lazy" />
              <span class="gallery__thumb-label">{{ im.slot ? slotLabels[im.slot] : '图' }}</span>
              <span v-if="im.pending" class="gallery__thumb-pending">待补</span>
            </button>
          </div>
          <div v-if="currentImage" class="gallery__caption">
            <span>{{ currentImage.caption }} · {{ currentImage.license }}</span>
            <a
              v-if="currentImage.sourceUrl"
              class="text-link"
              :href="currentImage.sourceUrl"
              target="_blank"
              rel="noreferrer"
            >查看原图与作者</a>
            <small>{{ currentImage.credit }}</small>
          </div>
          <p class="gallery__note">
            三格固定为“全图 / 入药部位图 / 药材高清切片图”。个别药材的切片图暂未找到可授权实拍，
            标为“待补”，没有拿相似图片替代。
          </p>
        </section>

        <div class="property-stack">
          <section class="property-card">
            <div class="property-card__head">
              <span class="property-card__index">01</span>
              <h2>性味</h2>
            </div>
            <SourcedText :claim="herb.properties.natureFlavor" block />
          </section>

          <section class="property-card">
            <div class="property-card__head">
              <span class="property-card__index">02</span>
              <h2>归经</h2>
            </div>
            <SourcedText :claim="herb.properties.meridians" block />
            <div class="meridian-links">
              <RouterLink
                v-for="m in meridianLinks"
                :key="m.id"
                class="chip chip--jade"
                :to="`/meridians/${m.id}`"
              >
                {{ m.name }} →
              </RouterLink>
            </div>
          </section>

          <section class="property-card">
            <div class="property-card__head">
              <span class="property-card__index">03</span>
              <h2>功效</h2>
            </div>
            <SourcedText :claim="herb.properties.effects" block />
          </section>

          <section class="property-card">
            <div class="property-card__head">
              <span class="property-card__index">04</span>
              <h2>主治</h2>
            </div>
            <SourcedText :claim="herb.properties.indications" block />
          </section>

          <section class="property-card property-card--contra">
            <div class="property-card__head">
              <span class="property-card__index">05</span>
              <h2>禁忌</h2>
              <span class="chip chip--cinnabar">使用注意</span>
            </div>
            <SourcedText :claim="herb.properties.contraindications" block />
          </section>
        </div>
      </div>

      <p v-if="herb.note" class="herb-note paper-panel">{{ herb.note }}</p>

      <section class="detail-section">
        <div class="section-head">
          <div>
            <p class="eyebrow">PAIRINGS / 配伍</p>
            <h2>配伍关系</h2>
          </div>
          <p>关系标签来自后世方书与教材归纳，标为“后世方解”，不是《伤寒论》原文。</p>
        </div>
        <div v-if="pairings.length" class="pairing-list">
          <RouterLink
            v-for="p in pairings"
            :key="p.herbId + p.label"
            :to="`/herbs/${p.herbId}`"
            class="pairing-card"
          >
            <div class="pairing-card__head">
              <strong>{{ herb.name }} × {{ p.herb?.name }}</strong>
              <span class="kind-badge" :class="`kind-badge--${p.kind}`">后世方解</span>
            </div>
            <p class="pairing-card__label">{{ p.label }}</p>
            <p v-if="p.note" class="pairing-card__note">{{ p.note }}</p>
            <CitationBadge :citation-ids="p.citationIds" label="后世方解" tone="muted" compact />
          </RouterLink>
        </div>
        <p v-else class="empty-inline">本样例暂未收录该药的配伍关系。</p>
      </section>

      <section class="detail-section processing-section">
        <div class="section-head">
          <div>
            <p class="eyebrow">PROCESSING / 炮制</p>
            <h2>炮制方法</h2>
          </div>
          <p>
            本栏与首页「药材的炮制」共用同一份数据；标为“摘录”的方法据药典【炮制】项归纳，
            不是逐字原文，也不构成自行炮制建议。
          </p>
        </div>

        <div v-if="herb.processing" class="processing-detail paper-panel">
          <div class="processing-detail__top">
            <p class="processing-detail__summary">{{ herb.processing.summary }}</p>
            <RouterLink class="text-link" to="/processing">查看全部炮制条目 →</RouterLink>
          </div>

          <ol class="processing-methods">
            <li v-for="(m, index) in herb.processing.methods" :key="m.label">
              <span class="processing-methods__num">{{ String(index + 1).padStart(2, '0') }}</span>
              <div>
                <div class="processing-methods__head">
                  <h3>{{ m.label }}</h3>
                  <span class="kind-badge kind-badge--paraphrase">摘录</span>
                  <CitationBadge :citation-ids="m.citationIds" label="炮制出处" tone="muted" compact />
                </div>
                <p>{{ m.text }}</p>
              </div>
            </li>
          </ol>

          <dl class="processing-meta">
            <div>
              <dt>成品性状</dt>
              <dd>{{ herb.processing.product }}</dd>
            </div>
            <div v-if="herb.processing.cautions.length">
              <dt>使用注意</dt>
              <dd>
                <ul>
                  <li v-for="caution in herb.processing.cautions" :key="caution">{{ caution }}</li>
                </ul>
              </dd>
            </div>
          </dl>

          <p v-if="herb.processing.note" class="processing-detail__note">{{ herb.processing.note }}</p>
        </div>
        <p v-else class="empty-inline">
          该药炮制方法待核，暂不写操作步骤。可先查看
          <RouterLink class="text-link" to="/processing">药材的炮制</RouterLink>。
        </p>
      </section>

      <RouterLink
        v-if="lectureItem"
        class="lecture-link"
        :to="`/bencao/${lectureItem.groupId}/${lectureItem.entryId}`"
      >
        <span class="lecture-link__seal" aria-hidden="true">讲</span>
        <span class="lecture-link__body">
          <span class="eyebrow">LECTURE / 讲义</span>
          <strong>《神农本草经》讲义：{{ lectureItem.name }}</strong>
          <span>
            倪海厦讲授整理 · {{ formatCharCount(lectureItem.charCount) }}；
            原文、历代注家与课堂讲授分层标注。
          </span>
        </span>
        <span class="lecture-link__arrow" aria-hidden="true">→</span>
      </RouterLink>

      <section class="coverage paper-panel">
        <div>
          <span class="eyebrow">SOURCE COVERAGE</span>
          <h3>本页内容均有出处</h3>
        </div>
        <p>
          性味、归经、功效、主治按药典该药条目摘录；配伍关系按后世方书与教材归纳，标为“后世方解”。
          点击任意“出处”可查看书名、版次、条号与原文。
        </p>
      </section>
    </div>
  </div>

  <div v-else class="page container">
    <div class="empty-state paper-panel">
      <h2>没有这味药</h2>
      <p>可能是链接里的药材 id 不正确。</p>
      <RouterLink class="btn btn--primary" to="/herbs">返回本草列表</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.breadcrumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 20px 0 28px;
  color: var(--ink-faint);
  font-size: 0.78rem;
}

.breadcrumbs a:hover {
  color: var(--cinnabar);
}

.detail-head {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  align-items: flex-end;
  padding-bottom: 30px;
  border-bottom: 1px solid var(--line-strong);
}

.detail-title-row {
  display: flex;
  align-items: baseline;
  gap: 18px;
  flex-wrap: wrap;
}

.detail-title-row h1 {
  font-size: clamp(3rem, 7vw, 5.4rem);
  letter-spacing: 0.08em;
}

.detail-pinyin {
  color: var(--ink-faint);
  font-family: var(--serif);
  font-size: 1.1rem;
  letter-spacing: 0.1em;
}

.detail-aliases {
  margin-top: 6px;
  color: var(--ink-soft);
  font-size: 0.85rem;
}

.name-notes {
  display: grid;
  gap: 4px;
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: rgba(255, 252, 245, 0.46);
}

.name-notes p {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
  color: var(--ink-soft);
  font-size: 0.8rem;
  line-height: 1.7;
}

.name-notes strong {
  flex-shrink: 0;
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.78rem;
}

.name-notes span {
  color: var(--ink);
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
}

.taxonomy-links {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-top: 9px;
}

.taxonomy-links__label {
  color: var(--ink-faint);
  font-size: 0.68rem;
  letter-spacing: 0.08em;
}

.taxonomy-links .chip {
  font-size: 0.68rem;
}

.detail-head__source {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  max-width: 360px;
}

.herb-detail-grid {
  display: grid;
  grid-template-columns: minmax(300px, 0.82fr) minmax(0, 1.18fr);
  gap: 26px;
  padding: 32px 0 12px;
}

.gallery {
  align-self: start;
  padding: 12px;
}

.gallery__main {
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: 10px;
  overflow: hidden;
  background: var(--paper-2);
}

.gallery__main--pending {
  border: 1px dashed var(--line-strong);
  background: rgba(244, 239, 228, 0.6);
}

.gallery__slot {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(244, 239, 228, 0.9);
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.7rem;
  backdrop-filter: blur(4px);
}

.gallery__main img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery__thumbs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 8px;
}

.gallery__thumb {
  position: relative;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 0;
  background: transparent;
  overflow: hidden;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.18s ease, border-color 0.18s ease;
}

.gallery__thumb img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}

.gallery__thumb-label {
  position: absolute;
  left: 5px;
  bottom: 5px;
  padding: 1px 5px;
  border-radius: 3px;
  background: rgba(32, 37, 34, 0.62);
  color: #f4efe4;
  font-size: 0.58rem;
}

.gallery__thumb-pending {
  position: absolute;
  right: 5px;
  top: 5px;
  padding: 1px 5px;
  border-radius: 3px;
  background: var(--cinnabar);
  color: #fff;
  font-size: 0.55rem;
}

.gallery__thumb--active,
.gallery__thumb:hover {
  opacity: 1;
  border-color: var(--cinnabar);
}

.gallery__caption {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 10px 4px 2px;
  color: var(--ink-faint);
  font-size: 0.7rem;
  line-height: 1.6;
}

.gallery__caption .text-link {
  font-size: 0.68rem;
}

.gallery__caption small {
  color: var(--ink-faint);
  font-size: 0.62rem;
  line-height: 1.5;
}

.gallery__note {
  margin-top: 8px;
  padding: 8px 10px;
  border-left: 2px solid var(--gold);
  background: rgba(237, 224, 200, 0.32);
  color: var(--ink-faint);
  font-size: 0.68rem;
  line-height: 1.7;
}

.property-stack {
  display: grid;
  gap: 12px;
}

.property-card {
  padding: 20px 22px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(255, 252, 245, 0.52);
}

.property-card__head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 8px;
}

.property-card__index {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.8rem;
}

.property-card h2 {
  font-size: 1.1rem;
}

.property-card :deep(.sourced-text__content) {
  color: var(--ink);
  line-height: 1.9;
}

.property-card--contra {
  border-color: rgba(163, 58, 43, 0.3);
  background: linear-gradient(rgba(241, 221, 214, 0.34), rgba(255, 252, 245, 0.5));
}

.property-card--contra .property-card__head h2 {
  color: var(--cinnabar);
}

.meridian-links {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.herb-note {
  margin-top: 14px;
  padding: 14px 18px;
  color: var(--ink-soft);
  font-size: 0.82rem;
  border-left: 2px solid var(--cinnabar-2);
}

.detail-section {
  padding-top: 52px;
}

.pairing-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.pairing-card {
  padding: 16px 18px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(255, 252, 245, 0.5);
  transition: border-color 0.18s ease, transform 0.18s ease;
}

.pairing-card:hover {
  border-color: var(--cinnabar);
  transform: translateY(-2px);
}

.pairing-card__head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.pairing-card__head strong {
  font-family: var(--serif);
  font-size: 1rem;
}

.pairing-card__label {
  margin-top: 8px;
  color: var(--cinnabar);
  font-size: 0.86rem;
}

.pairing-card__note {
  margin-top: 4px;
  color: var(--ink-soft);
  font-size: 0.76rem;
}

.related-formulas {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.related-formula {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 20px 22px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(255, 252, 245, 0.56);
  transition: border-color 0.18s ease, transform 0.18s ease;
}

.related-formula:hover {
  border-color: var(--jade);
  transform: translateY(-2px);
}

.related-formula h3 {
  margin: 3px 0 4px;
  font-size: 1.3rem;
}

.related-formula p {
  color: var(--ink-soft);
  font-size: 0.82rem;
}

.related-formula__arrow {
  color: var(--cinnabar);
}

.processing-detail {
  padding: 22px 24px;
}

.processing-detail__top {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);
}

.processing-detail__summary {
  max-width: 760px;
  color: var(--ink);
  font-family: var(--serif);
  font-size: 1.02rem;
  line-height: 1.8;
}

.processing-detail__top .text-link {
  flex-shrink: 0;
  font-size: 0.78rem;
}

.processing-methods {
  display: grid;
  gap: 16px;
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
}

.processing-methods li {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 12px;
}

.processing-methods__num {
  color: var(--gold);
  font-family: var(--serif);
  font-size: 0.98rem;
}

.processing-methods__head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.processing-methods__head h3 {
  font-size: 0.98rem;
}

.processing-methods p {
  margin-top: 5px;
  color: var(--ink-soft);
  font-size: 0.84rem;
  line-height: 1.85;
}

.processing-meta {
  display: grid;
  gap: 10px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}

.processing-meta > div {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: 12px;
}

.processing-meta dt {
  color: var(--ink-faint);
  font-size: 0.74rem;
  letter-spacing: 0.08em;
}

.processing-meta dd {
  color: var(--ink-soft);
  font-size: 0.84rem;
  line-height: 1.8;
}

.processing-meta ul {
  margin: 0;
  padding-left: 16px;
}

.processing-detail__note {
  margin-top: 14px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(237, 224, 200, 0.3);
  color: var(--ink-faint);
  font-size: 0.74rem;
  line-height: 1.75;
}

.lecture-link {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-top: 28px;
  padding: 18px 22px;
  border: 1px solid color-mix(in srgb, var(--jade) 38%, var(--line));
  border-radius: 14px;
  background:
    linear-gradient(90deg, rgba(224, 236, 226, 0.52), transparent 62%),
    rgba(255, 252, 245, 0.72);
  color: inherit;
  text-decoration: none;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.lecture-link:hover {
  transform: translateY(-2px);
  border-color: var(--jade);
  box-shadow: var(--shadow-soft);
}

.lecture-link__seal {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 1px solid var(--cinnabar);
  border-radius: 8px;
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 1.2rem;
}

.lecture-link__body {
  display: grid;
  flex: 1;
  gap: 3px;
  min-width: 0;
}

.lecture-link__body strong {
  font-family: var(--serif);
  font-size: 1.05rem;
  font-weight: 500;
  letter-spacing: 0.04em;
}

.lecture-link__body > span:last-child {
  color: var(--ink-faint);
  font-size: 0.74rem;
  line-height: 1.65;
}

.lecture-link__arrow {
  flex-shrink: 0;
  color: var(--jade);
  font-size: 1.1rem;
}

.coverage {
  margin-top: 52px;
  padding: 22px 24px;
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr) auto;
  gap: 22px;
  align-items: center;
}

.coverage h3 {
  margin-top: 4px;
  font-size: 1.05rem;
}

.coverage p {
  color: var(--ink-soft);
  font-size: 0.8rem;
}

.coverage .text-link {
  white-space: nowrap;
  font-size: 0.8rem;
}

.empty-inline {
  padding: 20px;
  border: 1px dashed var(--line-strong);
  border-radius: 12px;
  color: var(--ink-soft);
  font-size: 0.84rem;
}

@media (max-width: 900px) {
  .detail-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .detail-head__source {
    align-items: flex-start;
  }

  .herb-detail-grid {
    grid-template-columns: 1fr;
  }

  .pairing-list,
  .related-formulas {
    grid-template-columns: 1fr;
  }

  .coverage {
    grid-template-columns: 1fr;
  }
}
</style>
