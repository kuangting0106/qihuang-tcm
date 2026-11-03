<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  firstAidConditions,
  firstAidGeneralWarning,
  firstAidSource,
  type FirstAidFigure,
} from '@/data/first-aid'

const route = useRoute()

const condition = computed(
  () => firstAidConditions.find((item) => item.id === String(route.params.id)) ?? null,
)
const position = computed(() =>
  firstAidConditions.findIndex((item) => item.id === String(route.params.id)),
)
const previous = computed(() =>
  position.value > 0 ? firstAidConditions[position.value - 1] : null,
)
const next = computed(() =>
  position.value >= 0 && position.value < firstAidConditions.length - 1
    ? firstAidConditions[position.value + 1]
    : null,
)

const dialog = ref<HTMLDialogElement | null>(null)
const preview = ref<FirstAidFigure | null>(null)

function openFigure(figure: FirstAidFigure) {
  preview.value = figure
  dialog.value?.showModal()
}

function closeFigure() {
  dialog.value?.close()
  preview.value = null
}

watch(
  () => route.params.id,
  () => {
    if (dialog.value?.open) dialog.value.close()
    preview.value = null
  },
)
</script>

<template>
  <div class="page first-aid-detail">
    <div class="container">
      <nav class="breadcrumbs" aria-label="面包屑">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink :to="{ path: '/', hash: '#first-aid' }">中医急救知识</RouterLink>
        <span>/</span>
        <span>{{ condition?.title ?? '未找到' }}</span>
      </nav>

      <template v-if="condition">
        <header class="first-aid-detail__head">
          <div>
            <p class="eyebrow">FIRST AID / 中医急救知识</p>
            <h1>{{ condition.title }}</h1>
            <p class="first-aid-detail__sub">{{ condition.subtitle }}</p>
            <div class="first-aid-detail__meta">
              <span class="chip chip--gold">原书 {{ condition.pages }}</span>
              <span class="chip chip--cinnabar">仅作参考学习</span>
            </div>
          </div>
          <div class="first-aid-detail__seal" aria-hidden="true">急</div>
        </header>

        <aside class="first-aid-detail__warning" role="note" aria-label="急救安全警告">
          <span class="first-aid-detail__warning-mark" aria-hidden="true">急</span>
          <div>
            <strong>先打 120，再谈其他</strong>
            <p>{{ firstAidGeneralWarning }}</p>
          </div>
        </aside>

        <article class="first-aid-detail__panel">
          <p class="first-aid-detail__summary">{{ condition.summary }}</p>

          <div class="first-aid-detail__layout">
            <div class="first-aid-detail__body">
              <section class="first-aid-detail__block">
                <h2>症状与识别</h2>
                <ul class="first-aid-detail__list">
                  <li v-for="(line, index) in condition.symptoms" :key="index">{{ line }}</li>
                </ul>
              </section>

              <section class="first-aid-detail__block">
                <h2>急救方法</h2>
                <div
                  v-for="group in condition.rescue"
                  :key="group.title"
                  class="first-aid-detail__group"
                >
                  <h3>{{ group.title }}</h3>
                  <ol class="first-aid-detail__list first-aid-detail__list--steps">
                    <li v-for="(item, index) in group.items" :key="index">{{ item }}</li>
                  </ol>
                </div>
              </section>

              <section v-if="condition.care?.length" class="first-aid-detail__block">
                <h2>预防与调理</h2>
                <div
                  v-for="group in condition.care"
                  :key="group.title"
                  class="first-aid-detail__group"
                >
                  <h3>{{ group.title }}</h3>
                  <ul class="first-aid-detail__list">
                    <li v-for="(item, index) in group.items" :key="index">{{ item }}</li>
                  </ul>
                </div>
              </section>

              <p v-if="condition.caution" class="first-aid-detail__caution">
                <span aria-hidden="true">!</span>
                {{ condition.caution }}
              </p>
            </div>

            <aside class="first-aid-detail__figures" aria-label="本症穴位图">
              <p class="first-aid-detail__figures-title">穴位与手法图示 · 点击放大</p>
              <div class="first-aid-detail__figure-grid">
                <button
                  v-for="figure in condition.figures"
                  :key="figure.src"
                  type="button"
                  class="first-aid-detail__figure"
                  @click="openFigure(figure)"
                >
                  <img
                    :src="figure.src"
                    :alt="figure.caption"
                    loading="lazy"
                    width="560"
                    height="420"
                  />
                  <span>
                    {{ figure.caption }}
                    <small>p.{{ figure.page }}</small>
                  </span>
                </button>
              </div>
            </aside>
          </div>

          <footer class="first-aid-detail__foot">
            <p>{{ firstAidSource.note }}</p>
            <p>来源：{{ firstAidSource.title }} · {{ firstAidSource.edition }}</p>
          </footer>
        </article>

        <nav class="first-aid-detail__nav" aria-label="病症翻页">
          <RouterLink
            v-if="previous"
            class="first-aid-detail__nav-link"
            :to="`/first-aid/${previous.id}`"
          >
            <small>上一症</small>
            <strong>{{ previous.title }}</strong>
          </RouterLink>
          <span v-else class="first-aid-detail__nav-empty">已经是第一症</span>

          <RouterLink class="first-aid-detail__nav-back" :to="{ path: '/', hash: '#first-aid' }">
            返回「中医急救知识」
          </RouterLink>

          <RouterLink
            v-if="next"
            class="first-aid-detail__nav-link first-aid-detail__nav-link--next"
            :to="`/first-aid/${next.id}`"
          >
            <small>下一症</small>
            <strong>{{ next.title }}</strong>
          </RouterLink>
          <span v-else class="first-aid-detail__nav-empty">已经是最后一症</span>
        </nav>

        <dialog
          ref="dialog"
          class="first-aid-detail__lightbox"
          @close="preview = null"
          @click.self="closeFigure"
        >
          <figure v-if="preview">
            <img :src="preview.src" :alt="preview.caption" />
            <figcaption>
              <span>{{ preview.caption }}</span>
              <small>{{ firstAidSource.title }} 第 {{ preview.page }} 页</small>
            </figcaption>
          </figure>
          <button
            type="button"
            class="first-aid-detail__lightbox-close"
            aria-label="关闭"
            @click="closeFigure"
          >
            ×
          </button>
        </dialog>
      </template>

      <div v-else class="first-aid-detail__empty paper-panel">
        <h1>没有找到这个病症</h1>
        <p>可能是链接里的病症 id 不正确。</p>
        <RouterLink class="btn btn--primary" to="/">返回首页</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.first-aid-detail {
  padding-bottom: 80px;
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

.first-aid-detail__head {
  display: flex;
  justify-content: space-between;
  gap: 32px;
  align-items: flex-end;
  padding: 28px 0 22px;
  border-bottom: 1px solid var(--line-strong);
}

.first-aid-detail__head h1 {
  margin: 6px 0 4px;
  font-family: var(--serif);
  font-size: clamp(2.8rem, 6vw, 4.6rem);
  font-weight: 400;
  letter-spacing: 0.06em;
  line-height: 1.1;
}

.first-aid-detail__sub {
  color: var(--ink-soft);
  font-size: 0.82rem;
}

.first-aid-detail__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.first-aid-detail__seal {
  flex-shrink: 0;
  display: grid;
  place-content: center;
  width: 68px;
  height: 68px;
  margin-bottom: 6px;
  border: 1px solid var(--cinnabar);
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 2rem;
  line-height: 1;
}

.first-aid-detail__warning {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-top: 18px;
  padding: 18px 20px;
  border: 1px solid color-mix(in srgb, var(--cinnabar) 60%, var(--line));
  border-left: 5px solid var(--cinnabar);
  border-radius: 10px;
  background:
    linear-gradient(100deg, rgba(190, 78, 58, 0.1), rgba(255, 250, 242, 0.7)),
    rgba(255, 252, 245, 0.8);
}

.first-aid-detail__warning-mark {
  flex-shrink: 0;
  display: grid;
  place-content: center;
  width: 42px;
  height: 42px;
  border: 1px solid var(--cinnabar);
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 1.36rem;
}

.first-aid-detail__warning strong {
  display: block;
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 1.04rem;
  font-weight: 500;
  letter-spacing: 0.04em;
}

.first-aid-detail__warning p {
  margin-top: 4px;
  color: var(--ink-soft);
  font-size: 0.74rem;
  line-height: 1.78;
}

.first-aid-detail__panel {
  margin-top: 18px;
  padding: 26px 28px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background:
    linear-gradient(150deg, rgba(255, 252, 245, 0.78), rgba(235, 226, 210, 0.26)),
    rgba(255, 252, 245, 0.6);
}

.first-aid-detail__summary {
  padding-bottom: 16px;
  border-bottom: 1px dashed var(--line-strong);
  color: var(--ink-soft);
  font-size: 0.88rem;
  line-height: 1.85;
}

.first-aid-detail__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 30px;
  align-items: start;
  margin-top: 20px;
}

.first-aid-detail__body {
  min-width: 0;
}

.first-aid-detail__block + .first-aid-detail__block {
  margin-top: 26px;
}

.first-aid-detail__block h2 {
  padding-bottom: 8px;
  border-bottom: 1px solid var(--line);
  font-family: var(--serif);
  font-size: 1.22rem;
  font-weight: 500;
  letter-spacing: 0.08em;
}

.first-aid-detail__group {
  margin-top: 16px;
}

.first-aid-detail__group h3 {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.98rem;
  font-weight: 500;
  letter-spacing: 0.03em;
}

.first-aid-detail__list {
  margin: 7px 0 0;
  padding-left: 1.2em;
  color: var(--ink-soft);
  font-size: 0.8rem;
  line-height: 1.9;
}

.first-aid-detail__list li + li {
  margin-top: 5px;
}

.first-aid-detail__list--steps {
  padding-left: 1.4em;
}

.first-aid-detail__list--steps li::marker {
  color: var(--cinnabar);
  font-family: var(--serif);
}

.first-aid-detail__caution {
  display: flex;
  gap: 9px;
  align-items: flex-start;
  margin-top: 22px;
  padding: 13px 15px;
  border: 1px solid rgba(190, 78, 58, 0.32);
  border-radius: 8px;
  background: rgba(190, 78, 58, 0.06);
  color: var(--ink-soft);
  font-size: 0.76rem;
  line-height: 1.78;
}

.first-aid-detail__caution span {
  flex-shrink: 0;
  display: grid;
  place-content: center;
  width: 18px;
  height: 18px;
  margin-top: 1px;
  border-radius: 50%;
  background: var(--cinnabar);
  color: #fff;
  font-size: 0.66rem;
  font-weight: 700;
}

.first-aid-detail__figures {
  position: sticky;
  top: 90px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255, 252, 245, 0.55);
}

.first-aid-detail__figures-title {
  margin-bottom: 10px;
  color: var(--ink-faint);
  font-size: 0.62rem;
  letter-spacing: 0.1em;
}

.first-aid-detail__figure-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.first-aid-detail__figure {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  text-align: left;
  transition: border-color 0.18s ease, background 0.18s ease;
}

.first-aid-detail__figure:hover {
  border-color: var(--line-strong);
  background: rgba(255, 252, 245, 0.9);
}

.first-aid-detail__figure img {
  width: 100%;
  height: 104px;
  border-radius: 5px;
  background: #fff;
  object-fit: contain;
}

.first-aid-detail__figure span {
  display: flex;
  justify-content: space-between;
  gap: 4px;
  color: var(--ink-soft);
  font-size: 0.64rem;
  line-height: 1.4;
}

.first-aid-detail__figure small {
  flex-shrink: 0;
  color: var(--ink-faint);
  font-size: 0.56rem;
}

.first-aid-detail__foot {
  display: grid;
  gap: 4px;
  margin-top: 24px;
  padding-top: 12px;
  border-top: 1px dashed var(--line);
}

.first-aid-detail__foot p {
  color: var(--ink-faint);
  font-size: 0.62rem;
  line-height: 1.7;
}

.first-aid-detail__nav {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
}

.first-aid-detail__nav-link {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 30%;
  color: inherit;
  text-decoration: none;
}

.first-aid-detail__nav-link small {
  color: var(--ink-faint);
  font-size: 0.6rem;
  letter-spacing: 0.1em;
}

.first-aid-detail__nav-link strong {
  font-family: var(--serif);
  font-size: 1rem;
  font-weight: 400;
}

.first-aid-detail__nav-link:hover strong {
  color: var(--cinnabar);
}

.first-aid-detail__nav-link--next {
  align-items: flex-end;
  text-align: right;
}

.first-aid-detail__nav-back {
  color: var(--ink-faint);
  font-size: 0.7rem;
  text-decoration: none;
}

.first-aid-detail__nav-back:hover {
  color: var(--cinnabar);
}

.first-aid-detail__nav-empty {
  color: var(--ink-faint);
  font-size: 0.66rem;
}

.first-aid-detail__lightbox {
  width: min(720px, 92vw);
  max-height: 90vh;
  padding: 14px;
  border: 1px solid var(--line-strong);
  border-radius: 14px;
  background: var(--paper);
}

.first-aid-detail__lightbox::backdrop {
  background: rgba(30, 26, 22, 0.66);
}

.first-aid-detail__lightbox figure {
  margin: 0;
}

.first-aid-detail__lightbox img {
  display: block;
  width: 100%;
  max-height: 72vh;
  border-radius: 8px;
  background: #fff;
  object-fit: contain;
}

.first-aid-detail__lightbox figcaption {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-top: 10px;
  color: var(--ink);
  font-family: var(--serif);
  font-size: 1rem;
}

.first-aid-detail__lightbox figcaption small {
  color: var(--ink-faint);
  font-family: inherit;
  font-size: 0.66rem;
}

.first-aid-detail__lightbox-close {
  position: absolute;
  top: 6px;
  right: 10px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--paper);
  color: var(--ink-soft);
  font-size: 1.3rem;
  line-height: 1;
}

.first-aid-detail__empty {
  margin-top: 32px;
  padding: 40px;
  text-align: center;
}

.first-aid-detail__empty h1 {
  font-family: var(--serif);
  font-size: 1.8rem;
  font-weight: 400;
}

.first-aid-detail__empty p {
  margin: 10px 0 18px;
  color: var(--ink-soft);
}

@media (max-width: 1040px) {
  .first-aid-detail__layout {
    grid-template-columns: 1fr;
  }

  .first-aid-detail__figures {
    position: static;
    order: -1;
  }

  .first-aid-detail__figure-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .first-aid-detail__figure img {
    height: 92px;
  }
}

@media (max-width: 680px) {
  .first-aid-detail {
    padding-bottom: 60px;
  }

  .first-aid-detail__head {
    align-items: flex-start;
    padding: 20px 0 16px;
  }

  .first-aid-detail__seal {
    width: 52px;
    height: 52px;
    font-size: 1.5rem;
  }

  .first-aid-detail__warning {
    padding: 14px;
  }

  .first-aid-detail__panel {
    padding: 18px 16px;
  }

  .first-aid-detail__figure-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .first-aid-detail__figure img {
    height: 104px;
  }

  .first-aid-detail__nav {
    flex-wrap: wrap;
  }

  .first-aid-detail__nav-back {
    order: -1;
    width: 100%;
    text-align: center;
  }

  .first-aid-detail__nav-link {
    max-width: 45%;
  }
}
</style>
