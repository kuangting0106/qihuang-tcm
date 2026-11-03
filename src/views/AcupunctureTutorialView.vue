<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import rawTutorial from '@/data/acupuncture-tutorial.json'
import type {
  AcupunctureTutorial,
  AcupunctureTutorialChapter,
  AcupunctureTutorialSection,
} from '@/types/acupuncture'

const tutorial = rawTutorial as unknown as AcupunctureTutorial
const route = useRoute()
const router = useRouter()

const chapterId = computed(() => String(route.params.chapterId ?? ''))
const sectionId = computed(() => String(route.params.sectionId ?? ''))
const currentChapter = computed<AcupunctureTutorialChapter | null>(
  () => tutorial.chapters.find((chapter) => chapter.id === chapterId.value) ?? null,
)
const currentSection = computed<AcupunctureTutorialSection | null>(
  () => currentChapter.value?.sections.find((section) => section.id === sectionId.value) ?? null,
)
const isIndex = computed(() => !chapterId.value)
const isChapterFour = computed(() => currentChapter.value?.id === 'chapter-4')
const meridianSections = computed(() =>
  (currentChapter.value?.sections ?? []).filter((section) => section.meridianId),
)
const selectedMeridian = computed(() => currentSection.value?.meridianId ?? '')

const chapterTopicCount = (chapter: AcupunctureTutorialChapter) =>
  chapter.sections.reduce((sum, section) => sum + section.topics.length, 0)

const sectionStatus = (section: AcupunctureTutorialSection) => {
  const status = section.meridianStatus
  if (!status) return '经络图入口已建立'
  if (!status.total) return '360° 经络图待完善'
  return status.complete
    ? `已收录 ${status.collected} / ${status.total} 穴`
    : `已收录 ${status.collected} / ${status.total} 穴 · 360° 经络图待完善`
}

function changeChapter(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  router.push(value ? `/methods/acupuncture/tutorial/${value}` : '/methods/acupuncture/tutorial')
}

function changeMeridian(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (!value) return
  router.push(`/methods/acupuncture/tutorial/chapter-4/${value}`)
}

function scrollToTopic(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="tutorial-page">
    <header class="tutorial-bar">
      <div class="tutorial-bar__inner">
        <RouterLink class="tutorial-bar__back" to="/methods/acupuncture">← 返回针法</RouterLink>
        <div class="tutorial-bar__title">
          <strong>倪海厦人纪系列之针灸教程</strong>
          <span>章节 / 小目录 / 经络教程</span>
        </div>
        <div class="tutorial-bar__controls">
          <label>
            <span>章节</span>
            <select :value="chapterId" @change="changeChapter">
              <option value="">总目录</option>
              <option v-for="chapter in tutorial.chapters" :key="chapter.id" :value="chapter.id">
                第{{ chapter.order }}章 · {{ chapter.title }}
              </option>
            </select>
          </label>
          <label v-if="isChapterFour" class="tutorial-bar__meridian">
            <span>经络</span>
            <select :value="selectedMeridian" @change="changeMeridian">
              <option value="">选择经络</option>
              <option v-for="section in meridianSections" :key="section.id" :value="section.id">
                {{ section.title }}
              </option>
            </select>
          </label>
        </div>
      </div>

      <nav v-if="currentSection?.topics.length" class="tutorial-topics" aria-label="本页小目录">
        <span>小目录</span>
        <a
          v-for="topic in currentSection.topics"
          :key="topic.id"
          :href="`#${topic.id}`"
          @click.prevent="scrollToTopic(topic.id)"
        >
          {{ topic.order }}. {{ topic.title }}
        </a>
      </nav>
    </header>

    <div class="tutorial-body container">
      <aside class="tutorial-side paper-panel" aria-label="教程章节导航">
        <p class="eyebrow">CHAPTERS / 章节</p>
        <nav>
          <div v-for="chapter in tutorial.chapters" :key="chapter.id" class="tutorial-side__group">
            <RouterLink
              :to="`/methods/acupuncture/tutorial/${chapter.id}`"
              class="tutorial-side__chapter"
              :class="{ active: currentChapter?.id === chapter.id }"
            >
              <span>{{ String(chapter.order).padStart(2, '0') }}</span>
              <strong>{{ chapter.title }}</strong>
              <small>{{ chapter.sections.length }} 节</small>
            </RouterLink>
            <ol v-if="currentChapter?.id === chapter.id">
              <li v-for="section in chapter.sections" :key="section.id">
                <RouterLink
                  :to="`/methods/acupuncture/tutorial/${chapter.id}/${section.id}`"
                  :class="{ active: currentSection?.id === section.id }"
                >
                  {{ section.title }}
                  <small v-if="section.topics.length">{{ section.topics.length }}</small>
                </RouterLink>
              </li>
            </ol>
          </div>
        </nav>
      </aside>

      <main class="tutorial-main">
        <p class="tutorial-warning" role="note">
          非专业人士不要尝试。本教程只作学习与文献整理，不构成操作指导；针刺深度、角度、手法与急救处理必须由具备资质的执业中医师在合规场所完成。
        </p>
        <template v-if="isIndex">
          <section class="tutorial-hero paper-panel">
            <p class="eyebrow">NIH AIXIA · ACUPUNCTURE</p>
            <h1>倪海厦人纪系列之针灸教程</h1>
            <p>
              教程按原 PDF 的章节层级整理：每一章下有小目录，第四章按经络分节，每条经络再细分为具体穴位与专题。
              先选章节，再选小节；第四章可直接在右上角切换经络，页面上方保持不变。
            </p>
            <div class="tutorial-hero__stats">
              <span><strong>{{ tutorial.stats.chapters }}</strong> 章</span>
              <span><strong>{{ tutorial.stats.sections }}</strong> 节</span>
              <span><strong>{{ tutorial.stats.topics }}</strong> 个小目录</span>
              <span><strong>{{ tutorial.stats.pages }}</strong> 页正文</span>
            </div>
            <p class="tutorial-hero__source">{{ tutorial.source }}</p>
          </section>

          <div class="tutorial-chapters">
            <RouterLink
              v-for="chapter in tutorial.chapters"
              :key="chapter.id"
              :to="`/methods/acupuncture/tutorial/${chapter.id}`"
              class="tutorial-chapter-card paper-panel"
            >
              <span class="tutorial-chapter-card__order">第 {{ chapter.order }} 章</span>
              <h2>{{ chapter.title }}</h2>
              <p>
                {{ chapter.sections.length }} 节 · {{ chapterTopicCount(chapter) }} 个小目录 ·
                第 {{ chapter.page }}–{{ chapter.endPage }} 页
              </p>
              <ul>
                <li v-for="section in chapter.sections.slice(0, 5)" :key="section.id">
                  {{ section.title }}
                </li>
                <li v-if="chapter.sections.length > 5" class="more">
                  另有 {{ chapter.sections.length - 5 }} 节…
                </li>
              </ul>
            </RouterLink>
          </div>
        </template>

        <template v-else-if="currentChapter && !currentSection">
          <section class="chapter-overview">
            <header class="chapter-overview__head">
              <p class="eyebrow">CHAPTER {{ String(currentChapter.order).padStart(2, '0') }}</p>
              <h1>{{ currentChapter.title }}</h1>
              <p>
                {{ currentChapter.sections.length }} 节 · {{ chapterTopicCount(currentChapter) }} 个小目录 ·
                第 {{ currentChapter.page }}–{{ currentChapter.endPage }} 页
                <span v-if="currentChapter.time"> · {{ currentChapter.time }}</span>
              </p>
            </header>

            <p v-if="isChapterFour" class="chapter-overview__hint paper-panel">
              本章按经络分节。使用右上角“经络”选择器切换，教程页上方保持不变，只替换下方经络正文；
              每一节都可以继续跳到对应的 3D 经络图。
            </p>

            <div class="chapter-sections">
              <RouterLink
                v-for="section in currentChapter.sections"
                :key="section.id"
                :to="`/methods/acupuncture/tutorial/${currentChapter.id}/${section.id}`"
                class="chapter-section paper-panel"
              >
                <span class="chapter-section__index">{{ String(section.order).padStart(2, '0') }}</span>
                <div>
                  <h2>{{ section.title }}</h2>
                  <p>
                    {{ section.topics.length ? `${section.topics.length} 个小目录` : '专题正文' }} ·
                    第 {{ section.page }}–{{ section.endPage }} 页
                  </p>
                  <small v-if="section.meridianId">{{ sectionStatus(section) }}</small>
                </div>
                <span class="chapter-section__arrow" aria-hidden="true">→</span>
              </RouterLink>
            </div>
          </section>
        </template>

        <template v-else-if="currentSection && currentChapter">
          <article class="tutorial-section">
            <header class="tutorial-section__head">
              <p class="eyebrow">
                第 {{ currentChapter.order }} 章 · {{ currentChapter.title }}
              </p>
              <h1>{{ currentSection.title }}</h1>
              <p class="tutorial-section__meta">
                第 {{ currentSection.page }}–{{ currentSection.endPage }} 页
                <span v-if="currentSection.time"> · {{ currentSection.time }}</span>
                <span v-if="currentSection.topics.length"> · {{ currentSection.topics.length }} 个小目录</span>
              </p>
            </header>

            <div v-if="currentSection.meridianId" class="meridian-link paper-panel">
              <div>
                <span class="eyebrow">MERIDIAN ATLAS / 经络图</span>
                <strong>{{ currentSection.meridianName || currentSection.title }}</strong>
                <small>{{ sectionStatus(currentSection) }}</small>
              </div>
              <RouterLink :to="`/meridians/${currentSection.meridianId}`">
                查看经络图 <span aria-hidden="true">→</span>
              </RouterLink>
            </div>

            <div v-if="currentSection.intro.length" class="tutorial-section__intro">
              <p v-for="(paragraph, index) in currentSection.intro" :key="index">{{ paragraph }}</p>
            </div>

            <section
              v-for="topic in currentSection.topics"
              :id="topic.id"
              :key="topic.id"
              class="tutorial-topic"
            >
              <header class="tutorial-topic__head">
                <span class="tutorial-topic__index">{{ String(topic.order).padStart(2, '0') }}</span>
                <div>
                  <h2>{{ topic.title }}</h2>
                  <p>
                    第 {{ topic.page }} 页
                    <span v-if="topic.time"> · {{ topic.time }}</span>
                  </p>
                </div>
              </header>
              <p v-for="(paragraph, index) in topic.paragraphs" :key="index">{{ paragraph }}</p>
            </section>

            <section v-if="!currentSection.topics.length && currentSection.body?.length" class="tutorial-body-text">
              <p v-for="(paragraph, index) in currentSection.body" :key="index">{{ paragraph }}</p>
            </section>

            <RouterLink
              v-if="currentSection.meridianId"
              class="tutorial-section__meridian-link"
              :to="`/meridians/${currentSection.meridianId}`"
            >
              查看 {{ currentSection.meridianName || currentSection.title }} 经络图
              <span aria-hidden="true">→</span>
            </RouterLink>

            <p class="tutorial-section__source">{{ tutorial.source }}</p>
          </article>
        </template>

        <section v-else class="tutorial-missing paper-panel">
          <h1>没有找到这一节教程</h1>
          <p>链接里的章节或小节目录可能不正确。</p>
          <RouterLink class="btn btn--primary" to="/methods/acupuncture/tutorial">返回教程总目录</RouterLink>
        </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
.tutorial-page {
  padding-bottom: 90px;
}

.tutorial-bar {
  position: sticky;
  top: var(--header-h);
  z-index: 40;
  border-bottom: 1px solid var(--line-strong);
  background: rgba(244, 239, 228, 0.96);
  backdrop-filter: blur(16px);
}

.tutorial-bar__inner {
  display: flex;
  gap: 16px;
  align-items: center;
  width: min(1180px, calc(100% - 48px));
  margin: 0 auto;
  padding: 9px 0;
}

.tutorial-bar__back {
  flex-shrink: 0;
  color: var(--jade);
  font-size: 0.68rem;
  text-decoration: none;
}

.tutorial-bar__title {
  display: grid;
  min-width: 0;
  line-height: 1.35;
}

.tutorial-bar__title strong {
  overflow: hidden;
  font-family: var(--serif);
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tutorial-bar__title span {
  color: var(--ink-faint);
  font-size: 0.58rem;
  letter-spacing: 0.1em;
}

.tutorial-bar__controls {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-left: auto;
}

.tutorial-bar__controls label {
  display: flex;
  gap: 5px;
  align-items: center;
}

.tutorial-bar__controls label > span {
  flex-shrink: 0;
  color: var(--ink-faint);
  font-size: 0.6rem;
  letter-spacing: 0.06em;
}

.tutorial-bar__controls select {
  max-width: 190px;
  padding: 6px 8px;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  background: rgba(255, 252, 245, 0.84);
  color: var(--ink);
  font: inherit;
  font-size: 0.68rem;
}

.tutorial-bar__meridian select {
  max-width: 150px;
  border-color: color-mix(in srgb, var(--jade) 52%, var(--line));
  color: var(--jade);
}

.tutorial-topics {
  display: flex;
  gap: 5px;
  align-items: center;
  width: min(1180px, calc(100% - 48px));
  margin: 0 auto;
  padding: 0 0 8px;
  overflow-x: auto;
  white-space: nowrap;
}

.tutorial-topics > span {
  flex-shrink: 0;
  color: var(--ink-faint);
  font-size: 0.56rem;
  letter-spacing: 0.1em;
}

.tutorial-topics a {
  flex-shrink: 0;
  padding: 2px 7px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--ink-soft);
  font-size: 0.58rem;
  text-decoration: none;
}

.tutorial-topics a:hover {
  border-color: var(--jade);
  color: var(--jade);
}

.tutorial-body {
  display: grid;
  grid-template-columns: 230px minmax(0, 1fr);
  gap: 22px;
  align-items: start;
  padding-top: 22px;
}

.tutorial-side {
  position: sticky;
  top: calc(var(--header-h) + 116px);
  max-height: calc(100vh - var(--header-h) - 136px);
  overflow-y: auto;
  padding: 16px;
}

.tutorial-side nav {
  display: grid;
  gap: 5px;
}

.tutorial-side__chapter {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto;
  gap: 5px;
  align-items: baseline;
  padding: 5px 4px;
  border-radius: 5px;
  color: var(--ink-soft);
  text-decoration: none;
}

.tutorial-side__chapter > span {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.66rem;
}

.tutorial-side__chapter strong {
  font-size: 0.68rem;
  font-weight: 400;
  line-height: 1.45;
}

.tutorial-side__chapter small {
  color: var(--ink-faint);
  font-size: 0.54rem;
}

.tutorial-side__chapter.active {
  background: rgba(40, 92, 69, 0.08);
  color: var(--jade);
}

.tutorial-side ol {
  display: grid;
  gap: 1px;
  margin: 2px 0 6px 18px;
  padding: 0 0 0 8px;
  border-left: 1px solid var(--line-strong);
  list-style: none;
}

.tutorial-side ol a {
  display: flex;
  gap: 6px;
  justify-content: space-between;
  padding: 3px 4px;
  border-radius: 4px;
  color: var(--ink-faint);
  font-size: 0.6rem;
  line-height: 1.45;
  text-decoration: none;
}

.tutorial-side ol a.active {
  background: rgba(190, 92, 72, 0.07);
  color: var(--cinnabar);
}

.tutorial-side ol small {
  color: var(--ink-faint);
  font-size: 0.54rem;
}

.tutorial-main {
  min-width: 0;
}

.tutorial-warning {
  margin-bottom: 12px;
  padding: 9px 12px;
  border-left: 3px solid var(--cinnabar);
  background: rgba(190, 92, 72, 0.06);
  color: var(--cinnabar);
  font-size: 0.66rem;
  line-height: 1.75;
}

.tutorial-hero {
  padding: 28px 30px;
}

.tutorial-hero h1 {
  margin: 5px 0 10px;
  font-size: clamp(1.7rem, 4vw, 2.7rem);
  letter-spacing: 0.04em;
}

.tutorial-hero > p {
  max-width: 780px;
  color: var(--ink-soft);
  font-size: 0.82rem;
  line-height: 1.95;
}

.tutorial-hero__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
  color: var(--ink-faint);
  font-size: 0.66rem;
}

.tutorial-hero__stats strong {
  margin-right: 3px;
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 1.15rem;
  font-weight: 500;
}

.tutorial-hero__source {
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px dashed var(--line);
  color: var(--ink-faint) !important;
  font-size: 0.62rem !important;
}

.tutorial-chapters {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.tutorial-chapter-card {
  padding: 18px 20px;
  color: inherit;
  text-decoration: none;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.tutorial-chapter-card:hover {
  border-color: var(--jade);
  transform: translateY(-1px);
}

.tutorial-chapter-card__order {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.66rem;
  letter-spacing: 0.08em;
}

.tutorial-chapter-card h2 {
  margin: 4px 0 6px;
  font-family: var(--serif);
  font-size: 1.18rem;
  font-weight: 500;
}

.tutorial-chapter-card > p {
  color: var(--ink-faint);
  font-size: 0.64rem;
}

.tutorial-chapter-card ul {
  margin: 10px 0 0;
  padding-left: 1.05em;
  color: var(--ink-soft);
  font-size: 0.66rem;
  line-height: 1.7;
}

.tutorial-chapter-card li.more {
  color: var(--ink-faint);
  list-style: none;
}

.chapter-overview__head {
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line-strong);
}

.chapter-overview__head h1 {
  margin: 4px 0 6px;
  font-size: clamp(1.8rem, 4.4vw, 2.8rem);
}

.chapter-overview__head > p {
  color: var(--ink-faint);
  font-size: 0.66rem;
}

.chapter-overview__hint {
  margin-top: 12px;
  padding: 12px 14px;
  color: var(--ink-soft);
  font-size: 0.7rem;
  line-height: 1.8;
}

.chapter-sections {
  display: grid;
  gap: 8px;
  margin-top: 14px;
}

.chapter-section {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) 20px;
  gap: 8px;
  align-items: center;
  padding: 13px 16px;
  color: inherit;
  text-decoration: none;
  transition: border-color 0.2s ease;
}

.chapter-section:hover {
  border-color: var(--jade);
}

.chapter-section__index {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.7rem;
}

.chapter-section h2 {
  font-family: var(--serif);
  font-size: 1.02rem;
  font-weight: 500;
}

.chapter-section p {
  margin-top: 1px;
  color: var(--ink-faint);
  font-size: 0.6rem;
}

.chapter-section small {
  color: var(--jade);
  font-size: 0.58rem;
}

.chapter-section__arrow {
  color: var(--jade);
}

.tutorial-section__head {
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line-strong);
}

.tutorial-section__head h1 {
  margin: 4px 0 5px;
  font-size: clamp(1.8rem, 4.4vw, 2.8rem);
}

.tutorial-section__meta {
  color: var(--ink-faint);
  font-size: 0.64rem;
}

.meridian-link {
  display: flex;
  gap: 14px;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding: 12px 15px;
  border-color: color-mix(in srgb, var(--jade) 36%, var(--line));
}

.meridian-link > div {
  display: grid;
  gap: 1px;
}

.meridian-link strong {
  font-family: var(--serif);
  font-size: 1rem;
  font-weight: 500;
}

.meridian-link small {
  color: var(--ink-faint);
  font-size: 0.6rem;
}

.meridian-link > a {
  flex-shrink: 0;
  padding: 7px 11px;
  border: 1px solid var(--jade);
  border-radius: 999px;
  color: var(--jade);
  font-size: 0.66rem;
  text-decoration: none;
}

.meridian-link > a:hover {
  background: rgba(40, 92, 69, 0.08);
}

.tutorial-section__intro {
  margin-top: 14px;
  padding: 16px 18px;
  border-left: 3px solid var(--gold);
  background: rgba(214, 184, 122, 0.08);
}

.tutorial-section__intro p,
.tutorial-topic p,
.tutorial-body-text p {
  color: var(--ink-soft);
  font-size: 0.82rem;
  line-height: 2;
}

.tutorial-section__intro p + p,
.tutorial-topic p + p {
  margin-top: 8px;
}

.tutorial-topic {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
  scroll-margin-top: calc(var(--header-h) + 142px);
}

.tutorial-topic__head {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 10px;
}

.tutorial-topic__index {
  flex-shrink: 0;
  display: grid;
  place-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--cinnabar);
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.72rem;
}

.tutorial-topic__head h2 {
  font-family: var(--serif);
  font-size: 1.34rem;
  font-weight: 500;
  line-height: 1.45;
}

.tutorial-topic__head p {
  margin-top: 1px;
  color: var(--ink-faint);
  font-size: 0.58rem;
}

.tutorial-body-text {
  margin-top: 14px;
}

.tutorial-section__source {
  margin-top: 28px;
  padding-top: 10px;
  border-top: 1px dashed var(--line);
  color: var(--ink-faint);
  font-size: 0.6rem;
  line-height: 1.7;
}

.tutorial-section__meridian-link {
  display: inline-flex;
  gap: 7px;
  align-items: center;
  margin-top: 26px;
  padding: 9px 13px;
  border: 1px solid var(--jade);
  border-radius: 999px;
  color: var(--jade);
  font-size: 0.7rem;
  text-decoration: none;
}

.tutorial-section__meridian-link:hover {
  background: rgba(40, 92, 69, 0.08);
}

.tutorial-missing {
  padding: 30px;
  text-align: center;
}

.tutorial-missing h1 {
  font-size: 1.6rem;
}

.tutorial-missing p {
  margin: 8px 0 16px;
  color: var(--ink-faint);
  font-size: 0.76rem;
}

@media (max-width: 980px) {
  .tutorial-body {
    grid-template-columns: 1fr;
  }

  .tutorial-side {
    position: static;
    max-height: none;
  }

  .tutorial-side nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .tutorial-side ol {
    display: none;
  }
}

@media (max-width: 760px) {
  .tutorial-bar__inner {
    flex-wrap: wrap;
    gap: 7px;
    width: calc(100% - 28px);
    padding: 7px 0;
  }

  .tutorial-bar__title {
    flex: 1;
  }

  .tutorial-bar__title strong {
    font-size: 0.86rem;
  }

  .tutorial-bar__controls {
    width: 100%;
    margin-left: 0;
  }

  .tutorial-bar__controls label {
    flex: 1;
  }

  .tutorial-bar__controls select {
    width: 100%;
    max-width: none;
  }

  .tutorial-topics,
  .tutorial-body {
    width: calc(100% - 28px);
  }

  .tutorial-chapters {
    grid-template-columns: 1fr;
  }

  .tutorial-hero {
    padding: 20px;
  }

  .tutorial-side nav {
    grid-template-columns: 1fr;
  }

  .tutorial-section__intro,
  .tutorial-topic p,
  .tutorial-body-text p {
    font-size: 0.78rem;
  }
}
</style>
