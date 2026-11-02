<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  lectureCourses,
  lectureEpisodeSrc,
  type LectureCourse,
  type LectureEpisode,
} from '@/data/lectures'

const activeEpisodeIds = ref<Record<string, string>>(
  Object.fromEntries(lectureCourses.map((course) => [course.id, course.episodes[0]?.id ?? ''])),
)

function activeEpisode(course: LectureCourse): LectureEpisode {
  return (
    course.episodes.find((episode) => episode.id === activeEpisodeIds.value[course.id]) ??
    course.episodes[0]
  )
}

function selectEpisode(course: LectureCourse, episode: LectureEpisode) {
  activeEpisodeIds.value = { ...activeEpisodeIds.value, [course.id]: episode.id }
}

function durationSeconds(duration: string): number {
  const parts = duration.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return parts[0] * 60 + parts[1]
}

const totalEpisodes = computed(() =>
  lectureCourses.reduce((sum, course) => sum + course.episodes.length, 0),
)

function formatMinutes(minutes: number): string {
  return `${Math.floor(minutes / 60)} 小时 ${String(minutes % 60).padStart(2, '0')} 分`
}

function courseDuration(course: LectureCourse): string {
  const minutes = Math.round(
    course.episodes.reduce((sum, episode) => sum + durationSeconds(episode.duration), 0) / 60,
  )
  return formatMinutes(minutes)
}

function compactNumbers(course: LectureCourse): string {
  const numbers = [...course.episodes.map((episode) => episode.number)].sort((a, b) => a - b)
  const ranges: string[] = []
  let start = numbers[0]
  let previous = numbers[0]
  for (const number of numbers.slice(1)) {
    if (number === previous + 1) {
      previous = number
      continue
    }
    ranges.push(
      start === previous
        ? String(start).padStart(2, '0')
        : `${String(start).padStart(2, '0')}–${String(previous).padStart(2, '0')}`,
    )
    start = number
    previous = number
  }
  ranges.push(
    start === previous
      ? String(start).padStart(2, '0')
      : `${String(start).padStart(2, '0')}–${String(previous).padStart(2, '0')}`,
  )
  return ranges.join('、')
}

const totalDuration = computed(() => {
  const minutes = Math.round(
    lectureCourses.reduce(
      (sum, course) =>
        sum + course.episodes.reduce((episodeSum, episode) => episodeSum + durationSeconds(episode.duration), 0),
      0,
    ) / 60,
  )
  return formatMinutes(minutes)
})
</script>

<template>
  <div class="page lecture-page">
    <div class="container">
      <header class="lecture-hero">
        <div>
          <p class="eyebrow">LECTURE HALL / 名家讲堂</p>
          <h1>名家讲堂</h1>
          <p class="lecture-hero__lead">
            按“医家 + 课程”收录视频课件。视频标题或下方直接注明是哪位医家的什么课程，
            不再拆成伤寒论、傅青主女科、本草纲目等小类。
          </p>
          <div class="lecture-hero__meta">
            <span class="chip chip--jade">{{ lectureCourses.length }} 门课程</span>
            <span class="chip">{{ totalEpisodes }} 集已收录</span>
            <span class="chip chip--gold">{{ totalDuration }}</span>
          </div>
        </div>
        <div class="lecture-hero__seal" aria-hidden="true">讲</div>
      </header>

      <section
        v-for="course in lectureCourses"
        :key="course.id"
        class="lecture-course"
        :aria-label="`${course.lecturer}${course.work}课程`"
      >
        <header class="lecture-course__head">
          <div>
            <p class="eyebrow">{{ course.collection }} / 课程</p>
            <h2>{{ course.lecturer }} · {{ course.work }}</h2>
            <p>{{ course.description }}</p>
          </div>
          <div class="lecture-course__stats">
            <span><strong>{{ course.episodes.length }}</strong> 集已收录</span>
            <span><strong>{{ compactNumbers(course) }}</strong> 集</span>
          </div>
        </header>

        <div class="lecture-player-layout">
          <div class="lecture-player">
            <div class="lecture-player__frame">
              <video
                :key="`${course.id}-${activeEpisode(course).id}`"
                :src="lectureEpisodeSrc(course, activeEpisode(course))"
                controls
                controlslist="nodownload"
                preload="metadata"
                playsinline
              ></video>
            </div>
            <div class="lecture-now">
              <div>
                <span class="eyebrow">NOW PLAYING</span>
                <h3>{{ activeEpisode(course).title }}</h3>
              </div>
              <span class="lecture-now__duration">{{ activeEpisode(course).duration }}</span>
            </div>
            <p class="lecture-source">{{ course.sourceNote }}</p>
          </div>

          <aside class="lecture-playlist paper-panel" aria-label="课程选集">
            <div class="lecture-playlist__head">
              <span class="eyebrow">EPISODES</span>
              <h3>课程选集</h3>
              <p>{{ course.episodes.length }} 集 · 共 {{ courseDuration(course) }}</p>
            </div>
            <ol class="episode-list">
              <li v-for="episode in course.episodes" :key="episode.id">
                <button
                  type="button"
                  class="episode-button"
                  :class="{ 'episode-button--active': activeEpisode(course).id === episode.id }"
                  @click="selectEpisode(course, episode)"
                >
                  <span class="episode-button__number">{{ String(episode.number).padStart(2, '0') }}</span>
                  <span class="episode-button__title">{{ episode.title }}</span>
                  <span class="episode-button__duration">{{ episode.duration }}</span>
                </button>
              </li>
            </ol>
            <p class="episode-missing">第 08–11 集未在提供的文件夹中，待补。</p>
          </aside>
        </div>
      </section>

      <section class="lecture-rules paper-panel">
        <div>
          <span class="eyebrow">COLLECTION RULE</span>
          <h2>按医家与课程收录</h2>
        </div>
        <div>
          <ul>
            <li><strong>不再设小类</strong>：伤寒论、金匮要略、傅青主女科、本草纲目、千金方等旧分类已移除。</li>
            <li><strong>标注方式</strong>：每个视频标题或下方写明“某医家《某书》课程”，不把讲授者写成原作者。</li>
            <li><strong>来源与授权</strong>：只收自有、授权或官方公开视频；来源不明不嵌入，也不提供下载。</li>
            <li><strong>原文优先</strong>：课程是理解入口，具体方药与条文仍回引原书，不用视频替代原文。</li>
          </ul>
          <RouterLink class="text-link" to="/classics">查看医家经典古籍 →</RouterLink>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.lecture-hero {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  align-items: center;
  padding: 30px 0 36px;
  border-bottom: 1px solid var(--line-strong);
}

.lecture-hero h1 {
  margin: 6px 0 12px;
  font-size: clamp(3rem, 7vw, 5.4rem);
  letter-spacing: 0.08em;
}

.lecture-hero__lead {
  max-width: 940px;
  color: var(--ink-soft);
  font-size: 0.95rem;
  line-height: 1.9;
}

.lecture-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 16px;
}

.lecture-hero__seal {
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 48% 52% 46% 54%;
  background: var(--jade);
  color: var(--paper);
  font-family: var(--serif);
  font-size: 2.8rem;
  transform: rotate(-4deg);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.22);
}

.lecture-course {
  padding: 34px 0 8px;
}

.lecture-course__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 30px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line);
}

.lecture-course__head h2 {
  margin: 4px 0 8px;
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  letter-spacing: 0.04em;
}

.lecture-course__head p {
  max-width: 720px;
  color: var(--ink-soft);
  font-size: 0.84rem;
  line-height: 1.9;
}

.lecture-course__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  flex-shrink: 0;
  color: var(--ink-faint);
  font-size: 0.72rem;
}

.lecture-course__stats strong {
  color: var(--jade);
  font-family: var(--serif);
  font-size: 1.1rem;
}

.lecture-player-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 0.4fr);
  gap: 18px;
  align-items: start;
  padding-top: 20px;
}

.lecture-player__frame {
  position: relative;
  aspect-ratio: 16 / 9;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: #14110d;
  overflow: hidden;
}

.lecture-player__frame video {
  width: 100%;
  height: 100%;
  display: block;
  background: #14110d;
}

.lecture-now {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-end;
  padding: 14px 2px 0;
}

.lecture-now h3 {
  margin-top: 3px;
  font-size: 1.25rem;
}

.lecture-now__duration {
  color: var(--ink-faint);
  font-size: 0.76rem;
  white-space: nowrap;
}

.lecture-source {
  margin-top: 8px;
  color: var(--ink-faint);
  font-size: 0.72rem;
  line-height: 1.8;
}

.lecture-playlist {
  padding: 18px;
}

.lecture-playlist__head {
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line);
}

.lecture-playlist__head h3 {
  margin: 3px 0 2px;
  font-size: 1.15rem;
}

.lecture-playlist__head p {
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.episode-list {
  display: grid;
  gap: 2px;
  max-height: 360px;
  margin: 8px 0 0;
  padding: 0;
  overflow: auto;
  list-style: none;
}

.episode-button {
  width: 100%;
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  padding: 8px 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--ink-soft);
  text-align: left;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease;
}

.episode-button:hover {
  background: var(--jade-pale);
  color: var(--jade);
}

.episode-button--active {
  background: var(--jade-pale);
  color: var(--jade);
}

.episode-button__number {
  color: var(--ink-faint);
  font-family: var(--serif);
  font-size: 0.82rem;
}

.episode-button__title {
  overflow: hidden;
  font-size: 0.76rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.episode-button__duration {
  color: var(--ink-faint);
  font-size: 0.66rem;
  white-space: nowrap;
}

.episode-missing {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--line);
  color: var(--cinnabar);
  font-size: 0.68rem;
  line-height: 1.7;
}

.lecture-rules {
  display: grid;
  grid-template-columns: minmax(0, 0.5fr) minmax(0, 1.5fr);
  gap: 30px;
  padding: 22px 24px;
  margin: 30px 0 40px;
}

.lecture-rules h2 {
  margin-top: 3px;
  font-size: 1.3rem;
}

.lecture-rules ul {
  margin: 0;
  padding-left: 18px;
  color: var(--ink-soft);
  font-size: 0.8rem;
  line-height: 1.9;
}

.lecture-rules strong {
  color: var(--ink);
}

.lecture-rules .text-link {
  display: inline-block;
  margin-top: 8px;
  font-size: 0.78rem;
}

@media (max-width: 960px) {
  .lecture-player-layout {
    grid-template-columns: 1fr;
  }

  .episode-list {
    max-height: 300px;
  }
}

@media (max-width: 700px) {
  .lecture-hero {
    align-items: flex-start;
  }

  .episode-list {
    max-height: none;
  }

  .lecture-hero__seal {
    width: 74px;
    height: 74px;
    font-size: 1.6rem;
  }

  .lecture-course__head {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .lecture-rules {
    grid-template-columns: 1fr;
  }
}
</style>
