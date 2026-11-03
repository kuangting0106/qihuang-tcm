<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { findBencaoEntry, formatCharCount, loadBencaoGroup, loadBencaoIndex } from '@/composables/useBencaoLectures'
import { useTcmData } from '@/composables/useTcmData'
import type { BencaoEntry, BencaoGroup, BencaoLectureIndex, BencaoSection } from '@/types/bencao'

const route = useRoute()
const router = useRouter()
const { data } = useTcmData()

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
    if (!found) {
      const redirect = library.entryRedirects?.[`${gid}:${eid}`]
      if (redirect) {
        await router.replace(`/bencao/${redirect.groupId}/${redirect.entryId}`)
        return
      }
      throw new Error('没有找到这条讲义')
    }
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
  ([gid, eid]) => {
    if (gid && eid) load(gid, eid)
  },
  { immediate: true },
)

const previous = computed(() =>
  group.value && position.value > 0 ? group.value.entries[position.value - 1] : null,
)
const next = computed(() =>
  group.value && position.value >= 0 ? group.value.entries[position.value + 1] ?? null : null,
)

const groupTitle = computed(() => group.value?.title ?? '')

const rankId = computed(() => {
  const map: Record<string, string> = {
    shangjing: 'upper',
    zhongjing: 'middle',
    xiajing: 'lower',
    nishi: 'nishi',
    editor: 'editor',
  }
  return map[groupId.value] ?? ''
})

const rankTitle = computed(
  () => data.value?.herbTaxonomy.ranks.find((rank) => rank.id === rankId.value)?.title ?? groupTitle.value,
)

const therapyCategories = computed(() => {
  const taxonomy = data.value?.herbTaxonomy
  if (!taxonomy) return []
  const ids = entry.value?.profile?.therapyCategoryIds ?? []
  return taxonomy.categories.filter((category) => ids.includes(category.id))
})

const otherNames = computed(() => {
  const name = entry.value?.title
  const ancient = entry.value?.ancientName
  return (entry.value?.alsoKnownAs ?? []).filter((item) => item && item !== name && item !== ancient)
})

function isProcessingSection(section: BencaoSection) {
  return /炮制|泡制/.test(section.label)
}

const processingSection = computed(() => entry.value?.sections.find(isProcessingSection) ?? null)

function isCovered(label: string) {
  const profile = entry.value?.profile
  if (!profile) return false
  if (label === '性味') return profile.flavorTags.length > 0 || Boolean(profile.nature)
  if (label === '归经') return profile.meridianNames.length > 0
  if (label === '主治' || label === '主冶') return Boolean(profile.indications)
  if (label === '禁忌') return Boolean(profile.contraindications)
  if (label === '效用') return Boolean(profile.effects)
  return false
}

const bodySections = computed(() =>
  (entry.value?.sections ?? []).filter(
    (section) => !isProcessingSection(section) && !isCovered(section.label),
  ),
)

// 功效与主治常来自同一句讲义归纳；完全包含时不重复排版。
const indicationsDuplicate = computed(() => {
  const effects = entry.value?.profile?.effects?.trim()
  const indications = entry.value?.profile?.indications?.trim()
  if (!effects || !indications) return false
  return effects === indications || effects.includes(indications) || indications.includes(effects)
})

function sectionHeading(label: string): string {
  if (label) return label
  return group.value?.id === 'intro' ? '讲义' : '课堂讲授'
}

const kindClass = (kind: string) => `entry-section--${kind}`

function isLectureSection(section: BencaoSection) {
  return section.kind === 'lecture' || section.kind === 'nishi'
}

const originalSections = computed(() =>
  bodySections.value.filter((section) => section.kind === 'original' || section.kind === 'commentary'),
)
const lectureSections = computed(() => bodySections.value.filter(isLectureSection))
const studySections = computed(() =>
  bodySections.value.filter(
    (section) => section.kind === 'study' || section.kind === 'lesson',
  ),
)
</script>

<template>
  <div class="page herb-detail bencao-entry">
    <div class="container">
      <nav class="breadcrumbs" aria-label="面包屑">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/herbs">本草</RouterLink>
        <span>/</span>
        <RouterLink :to="`/bencao/${groupId}`">{{ groupTitle }}</RouterLink>
        <span>/</span>
        <span>{{ entry?.title ?? '正文' }}</span>
      </nav>

      <p v-if="loading" class="entry-state paper-panel">正在展开药材页…</p>
      <div v-else-if="error" class="entry-state paper-panel">
        <h1>药材没有找到</h1>
        <p>{{ error }}</p>
        <RouterLink class="btn btn--primary" :to="`/bencao/${groupId}`">返回本组目录</RouterLink>
      </div>

      <template v-else-if="entry">
        <header class="detail-head">
          <div>
            <p class="eyebrow">HERB / 本草 · {{ groupTitle }}</p>
            <h1>{{ entry.title }}</h1>
            <p v-if="entry.pinyin" class="detail-pinyin">{{ entry.pinyin }}</p>
            <p class="name-notes">
              <span v-if="entry.ancientName" class="name-note name-note--ancient">
                古籍名：{{ entry.ancientName }}
              </span>
              <span v-if="otherNames.length" class="name-note">又名：{{ otherNames.join('、') }}</span>
              <span v-if="entry.number !== null" class="name-note name-note--muted">第 {{ entry.number }} 条</span>
            </p>

            <div class="detail-tags">
              <span v-for="t in entry.profile?.flavorTags ?? []" :key="t" class="chip chip--cinnabar">{{ t }}</span>
              <span v-if="entry.profile?.nature" class="chip chip--cinnabar">{{ entry.profile.nature }}</span>
              <span class="chip chip--gold">讲义整理</span>
            </div>

            <nav class="taxonomy-links" aria-label="三经与功效分类索引">
              <span class="taxonomy-links__label">索引</span>
              <RouterLink v-if="rankId" class="chip chip--gold" :to="`/herbs/rank/${rankId}`">
                {{ rankTitle }}全部药材
              </RouterLink>
              <RouterLink
                v-for="cat in therapyCategories"
                :key="cat.id"
                class="chip"
                :to="`/herbs/category/${cat.id}`"
              >
                {{ cat.title }}全部药材
              </RouterLink>
              <span v-if="!therapyCategories.length" class="taxonomy-links__pending">功效分类待考</span>
            </nav>
          </div>

          <div class="detail-head__stats">
            <span>{{ entry.sections.length }} 节</span>
            <span>{{ formatCharCount(entry.charCount) }}</span>
            <small>{{ entry.profile?.sources.join(' · ') }}</small>
          </div>
        </header>

        <p v-if="entry.note" class="entry-correction">{{ entry.note }}</p>
        <p v-if="group?.id === 'editor'" class="entry-correction entry-correction--caution">
          本条属整理者增补，不是倪海厦原讲义正文。
        </p>

        <div class="detail-grid">
          <section class="gallery paper-panel" aria-label="药材图片">
            <div v-if="entry.image" class="gallery__main">
              <img :src="entry.image.url" :alt="entry.image.alt" loading="lazy" />
            </div>
            <div v-else class="gallery__empty">
              <span class="gallery__seal" aria-hidden="true">{{ entry.title.slice(0, 1) }}</span>
              <strong>图片待补</strong>
              <p>尚未找到可核实的基原照片，暂以印章占位，不拿相似药材替代。</p>
            </div>

            <div v-if="entry.image" class="gallery__credit">
              <p>{{ entry.image.alt }}</p>
              <small>
                {{ entry.image.credit }} · {{ entry.image.license }} ·
                <a :href="entry.image.sourceUrl" target="_blank" rel="noopener noreferrer">iNaturalist</a>
              </small>
              <small v-if="entry.image.latin">学名：{{ entry.image.latin }}</small>
            </div>
          </section>

          <div class="property-stack">
            <section class="property-card paper-panel">
              <div class="property-card__head">
                <span class="property-card__index">01</span>
                <h2>性味</h2>
              </div>
              <div class="property-card__chips">
                <span v-for="t in entry.profile?.flavorTags ?? []" :key="t" class="chip chip--cinnabar">{{ t }}</span>
                <span v-if="entry.profile?.nature" class="chip chip--cinnabar">{{ entry.profile.nature }}</span>
                <span v-if="!entry.profile?.flavorTags.length && !entry.profile?.nature" class="is-pending">待考</span>
              </div>
              <p v-if="entry.profile?.sourceCategory" class="property-card__hint">
                {{ entry.profile.sourceCategory.startsWith('本站') ? '分类：' : '公开资料分类：' }}{{ entry.profile.sourceCategory }}
              </p>
            </section>

            <section class="property-card paper-panel">
              <div class="property-card__head">
                <span class="property-card__index">02</span>
                <h2>归经</h2>
              </div>
              <div class="property-card__chips">
                <span v-for="m in entry.profile?.meridianNames ?? []" :key="m" class="chip chip--jade">{{ m }}</span>
                <span v-if="entry.profile?.meridianPending" class="is-pending">归经待考</span>
              </div>
            </section>

            <section class="property-card paper-panel">
              <div class="property-card__head">
                <span class="property-card__index">03</span>
                <h2>功效</h2>
              </div>
              <p class="property-card__text">{{ entry.profile?.effects || '讲义未载，待考。' }}</p>
            </section>

            <section class="property-card paper-panel">
              <div class="property-card__head">
                <span class="property-card__index">04</span>
                <h2>主治</h2>
              </div>
              <p v-if="indicationsDuplicate" class="property-card__text property-card__text--muted">
                同「功效」条，不重复。
              </p>
              <p v-else class="property-card__text">{{ entry.profile?.indications || '讲义未载，待考。' }}</p>
            </section>

            <section class="property-card paper-panel">
              <div class="property-card__head">
                <span class="property-card__index">05</span>
                <h2>禁忌</h2>
              </div>
              <p class="property-card__text">{{ entry.profile?.contraindications || '讲义未载，待考。' }}</p>
            </section>
          </div>
        </div>

        <p v-if="entry.profile?.sources.length" class="profile-note">
          药性概览来源：{{ entry.profile.sources.join(' · ') }}。讲义未载的性味、归经与功效，用公开中药资料补足，
          只作阅读参考，不作校勘依据；用药以原书与现行药典为准。
        </p>

        <section v-if="originalSections.length" class="lecture-block">
          <div class="section-head">
            <div>
              <p class="eyebrow">TEXT &amp; COMMENTARY / 原文与注家</p>
              <h2>本经原文与诸家注解</h2>
            </div>
            <p>保留讲义所引《本经》条文与历代注家文字；原文、注家分层标注，不改字。</p>
          </div>
          <article
            v-for="section in originalSections"
            :key="`${section.label}-${section.kind}`"
            class="entry-section"
            :class="kindClass(section.kind)"
          >
            <header class="entry-section__head">
              <h3>{{ sectionHeading(section.label) }}</h3>
              <span v-if="sectionHeading(section.label) !== section.kindLabel" class="entry-section__kind">
                {{ section.kindLabel }}
              </span>
            </header>
            <template v-for="(block, blockIndex) in section.blocks" :key="blockIndex">
              <blockquote v-if="block.type === 'quote'" class="entry-quote">
                <span class="entry-quote__mark" aria-hidden="true">讲</span>
                <p>{{ block.text }}</p>
              </blockquote>
              <p v-else class="entry-paragraph">{{ block.text }}</p>
            </template>
          </article>
        </section>

        <section v-if="lectureSections.length || studySections.length" class="lecture-block">
          <div class="section-head">
            <div>
              <p class="eyebrow">LECTURE / 讲义与讲授</p>
              <h2>讲义归纳与课堂讲授</h2>
            </div>
            <p>倪海厦按语、课堂讲解与用量、产地、炮制等归纳文字，按原节保留。</p>
          </div>
          <article
            v-for="section in [...lectureSections, ...studySections]"
            :key="`${section.label}-${section.kind}`"
            class="entry-section"
            :class="kindClass(section.kind)"
          >
            <header class="entry-section__head">
              <h3>{{ sectionHeading(section.label) }}</h3>
              <span v-if="sectionHeading(section.label) !== section.kindLabel" class="entry-section__kind">
                {{ section.kindLabel }}
              </span>
            </header>
            <template v-for="(block, blockIndex) in section.blocks" :key="blockIndex">
              <blockquote v-if="block.type === 'quote'" class="entry-quote">
                <span class="entry-quote__mark" aria-hidden="true">讲</span>
                <p>{{ block.text }}</p>
              </blockquote>
              <p v-else class="entry-paragraph">{{ block.text }}</p>
            </template>
          </article>
        </section>

        <section v-if="processingSection" class="processing-detail paper-panel">
          <div class="processing-detail__head">
            <div>
              <p class="eyebrow">PROCESSING / 炮制</p>
              <h2>讲义所载炮制</h2>
            </div>
            <RouterLink class="text-link" to="/processing">到炮制板块查看已核条目 →</RouterLink>
          </div>
          <template v-for="(block, blockIndex) in processingSection.blocks" :key="blockIndex">
            <p v-if="block.type === 'p'" class="processing-detail__text">{{ block.text }}</p>
            <blockquote v-else class="entry-quote">
              <span class="entry-quote__mark" aria-hidden="true">讲</span>
              <p>{{ block.text }}</p>
            </blockquote>
          </template>
          <p class="processing-detail__note">
            以上为讲义摘录，未经现行炮制规范逐条核对，仅供阅读；具体工艺、辅料与成品性状以现行药典及当地规范为准。
          </p>
        </section>

        <nav class="entry-nav" aria-label="讲义翻页">
          <RouterLink v-if="previous" class="entry-nav__link" :to="`/bencao/${groupId}/${previous.id}`">
            <small>上一条</small>
            <strong>{{ previous.title }}</strong>
          </RouterLink>
          <span v-else class="entry-nav__empty">已经是本组第一条</span>

          <RouterLink class="entry-nav__back" :to="`/bencao/${groupId}`">返回目录</RouterLink>

          <RouterLink
            v-if="next"
            class="entry-nav__link entry-nav__link--next"
            :to="`/bencao/${groupId}/${next.id}`"
          >
            <small>下一条</small>
            <strong>{{ next.title }}</strong>
          </RouterLink>
          <span v-else class="entry-nav__empty">已经是本组最后一条</span>
        </nav>
      </template>
    </div>
  </div>
</template>

<style scoped>
.bencao-entry {
  padding-bottom: 72px;
}

.breadcrumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  align-items: baseline;
  padding: 22px 0 0;
  color: var(--ink-faint);
  font-size: 0.72rem;
}

.breadcrumbs a {
  color: inherit;
  text-decoration: none;
}

.breadcrumbs a:hover {
  color: var(--cinnabar);
}

.entry-state {
  margin-top: 24px;
  padding: 40px;
  text-align: center;
}

.detail-head {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  align-items: flex-end;
  padding: 34px 0 28px;
  border-bottom: 1px solid var(--line-strong);
}

.detail-head h1 {
  margin: 6px 0 6px;
  font-family: var(--serif);
  font-size: clamp(3rem, 7vw, 5.4rem);
  font-weight: 400;
  letter-spacing: 0.06em;
  line-height: 1.08;
}

.detail-pinyin {
  color: var(--ink-faint);
  font-size: 0.86rem;
  letter-spacing: 0.18em;
}

.name-notes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin-top: 10px;
  font-size: 0.72rem;
}

.name-note {
  color: var(--ink-soft);
}

.name-note--ancient {
  color: var(--cinnabar);
}

.name-note--muted {
  color: var(--ink-faint);
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
  gap: 6px 8px;
  align-items: center;
  margin-top: 12px;
}

.taxonomy-links__label {
  color: var(--ink-faint);
  font-size: 0.62rem;
  letter-spacing: 0.14em;
}

.taxonomy-links a {
  text-decoration: none;
}

.taxonomy-links__pending {
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.detail-head__stats {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 2px;
  align-items: flex-end;
  color: var(--ink-soft);
  font-size: 0.72rem;
  text-align: right;
}

.detail-head__stats small {
  max-width: 210px;
  color: var(--ink-faint);
  font-size: 0.62rem;
  line-height: 1.6;
}

.entry-correction {
  margin-top: 12px;
  padding: 8px 12px;
  border-left: 2px solid var(--gold);
  background: rgba(190, 160, 90, 0.08);
  color: var(--ink-soft);
  font-size: 0.7rem;
  line-height: 1.7;
}

.entry-correction--caution {
  border-left-color: var(--cinnabar);
  background: rgba(190, 92, 72, 0.07);
}

.detail-grid {
  display: grid;
  grid-template-columns: minmax(300px, 0.82fr) minmax(0, 1.18fr);
  gap: 26px;
  margin-top: 26px;
  align-items: start;
}

.gallery {
  overflow: hidden;
}

.gallery__main {
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #ece7da;
}

.gallery__main img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery__empty {
  display: grid;
  aspect-ratio: 4 / 3;
  place-content: center;
  justify-items: center;
  gap: 10px;
  padding: 24px;
  background:
    radial-gradient(circle at 26% 18%, rgba(255, 255, 255, 0.8), transparent 46%),
    repeating-linear-gradient(135deg, rgba(122, 145, 123, 0.08) 0 1px, transparent 1px 12px),
    linear-gradient(150deg, #e9f0e8, #f5efe2 60%, #ecdfcd);
  text-align: center;
}

.gallery__seal {
  display: grid;
  place-content: center;
  width: 72px;
  height: 72px;
  border: 1px solid var(--cinnabar);
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 2.4rem;
  line-height: 1;
}

.gallery__empty strong {
  font-family: var(--serif);
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0.08em;
}

.gallery__empty p {
  max-width: 230px;
  color: var(--ink-faint);
  font-size: 0.68rem;
  line-height: 1.7;
}

.gallery__credit {
  padding: 12px 16px 14px;
  border-top: 1px solid var(--line);
}

.gallery__credit p {
  font-size: 0.72rem;
  line-height: 1.6;
}

.gallery__credit small {
  display: block;
  margin-top: 4px;
  color: var(--ink-faint);
  font-size: 0.62rem;
  line-height: 1.6;
}

.gallery__credit a {
  color: inherit;
}

.property-stack {
  display: grid;
  gap: 10px;
}

.property-card {
  padding: 15px 18px 16px;
}

.property-card__head {
  display: flex;
  gap: 9px;
  align-items: baseline;
}

.property-card__index {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.72rem;
}

.property-card__head h2 {
  font-family: var(--serif);
  font-size: 1.02rem;
  font-weight: 400;
  letter-spacing: 0.08em;
}

.property-card__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 8px;
}

.property-card__text {
  margin-top: 7px;
  color: var(--ink-soft);
  font-size: 0.8rem;
  line-height: 1.85;
}

.property-card__text--muted {
  color: var(--ink-faint);
  font-size: 0.76rem;
}

.property-card__hint {
  margin-top: 6px;
  color: var(--ink-faint);
  font-size: 0.62rem;
}

.is-pending {
  color: var(--ink-faint);
  font-size: 0.7rem;
}

.profile-note {
  margin-top: 10px;
  color: var(--ink-faint);
  font-size: 0.64rem;
  line-height: 1.75;
}

.lecture-block {
  margin-top: 38px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 28px;
  align-items: flex-end;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line-strong);
}

.section-head h2 {
  margin-top: 4px;
  font-family: var(--serif);
  font-size: clamp(1.4rem, 2.6vw, 1.9rem);
  font-weight: 400;
  letter-spacing: 0.05em;
}

.section-head > p {
  max-width: 420px;
  color: var(--ink-faint);
  font-size: 0.7rem;
  line-height: 1.8;
}

.entry-section {
  margin-top: 18px;
  padding: 18px 20px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(255, 252, 245, 0.56);
}

.entry-section--original {
  border-left: 3px solid var(--cinnabar);
}

.entry-section--commentary {
  border-left: 3px solid var(--line-strong);
}

.entry-section--nishi {
  border-left: 3px solid var(--jade);
}

.entry-section--study {
  border-left: 3px solid var(--gold);
}

.entry-section--lecture,
.entry-section--lesson {
  border-left: 3px solid color-mix(in srgb, var(--jade) 55%, var(--line));
}

.entry-section__head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: baseline;
  margin-bottom: 8px;
}

.entry-section__head h3 {
  font-family: var(--serif);
  font-size: 1.06rem;
  font-weight: 400;
  letter-spacing: 0.06em;
}

.entry-section__kind {
  padding: 1px 7px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  color: var(--ink-faint);
  font-size: 0.56rem;
}

.entry-paragraph {
  margin-top: 7px;
  color: var(--ink-soft);
  font-size: 0.84rem;
  line-height: 1.95;
}

.entry-quote {
  display: flex;
  gap: 10px;
  margin-top: 9px;
  padding: 10px 14px;
  border-left: 2px solid color-mix(in srgb, var(--jade) 50%, var(--line));
  background: rgba(228, 239, 229, 0.45);
}

.entry-quote__mark {
  flex-shrink: 0;
  color: var(--jade);
  font-size: 0.62rem;
  line-height: 1.9;
}

.entry-quote p {
  color: var(--ink-soft);
  font-size: 0.84rem;
  line-height: 1.95;
}

.processing-detail {
  margin-top: 38px;
  padding: 20px 22px;
}

.processing-detail__head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-end;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line);
}

.processing-detail__head h2 {
  margin-top: 3px;
  font-family: var(--serif);
  font-size: 1.35rem;
  font-weight: 400;
}

.processing-detail__text {
  margin-top: 10px;
  color: var(--ink-soft);
  font-size: 0.84rem;
  line-height: 1.95;
  white-space: pre-line;
}

.processing-detail__note {
  margin-top: 12px;
  color: var(--ink-faint);
  font-size: 0.64rem;
  line-height: 1.75;
}

.entry-nav {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 12px;
  align-items: center;
  margin-top: 40px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
}

.entry-nav__link {
  display: grid;
  gap: 2px;
  padding: 10px 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  color: inherit;
  text-decoration: none;
}

.entry-nav__link--next {
  justify-items: end;
  text-align: right;
}

.entry-nav__link small {
  color: var(--ink-faint);
  font-size: 0.6rem;
}

.entry-nav__link strong {
  font-family: var(--serif);
  font-size: 0.94rem;
  font-weight: 400;
}

.entry-nav__back {
  color: var(--ink-soft);
  font-size: 0.72rem;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.entry-nav__empty {
  color: var(--ink-faint);
  font-size: 0.68rem;
}

@media (max-width: 900px) {
  .detail-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 16px;
  }

  .detail-head__stats {
    align-items: flex-start;
    text-align: left;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .section-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }
}

@media (max-width: 700px) {
  .entry-nav {
    grid-template-columns: 1fr;
  }

  .entry-nav__link--next {
    justify-items: start;
    text-align: left;
  }

  .processing-detail__head {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
