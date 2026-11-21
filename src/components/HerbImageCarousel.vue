<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { BencaoImage } from '@/types/bencao'

const props = defineProps<{ images: BencaoImage[] }>()

const active = ref(0)
const pointerStartX = ref<number | null>(null)

watch(
  () => props.images,
  () => {
    active.value = 0
  },
)

const current = computed(() => props.images[active.value] ?? null)
const multiple = computed(() => props.images.length > 1)

function go(step: number) {
  const total = props.images.length
  if (!total) return
  active.value = (active.value + step + total) % total
}

function select(index: number) {
  active.value = index
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    go(-1)
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    go(1)
  }
}

function onPointerDown(event: PointerEvent) {
  if (!multiple.value) return
  pointerStartX.value = event.clientX
}

function onPointerUp(event: PointerEvent) {
  if (pointerStartX.value === null) return
  const delta = event.clientX - pointerStartX.value
  pointerStartX.value = null
  if (Math.abs(delta) < 40) return
  go(delta > 0 ? -1 : 1)
}
</script>

<template>
  <div v-if="current" class="carousel" role="group" aria-roledescription="图片轮播" aria-label="药材图片">
    <div
      class="carousel__stage"
      tabindex="0"
      @keydown="onKeydown"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
    >
      <img :src="current.url" :alt="current.alt" />

      <button
        v-if="multiple"
        class="carousel__nav carousel__nav--prev"
        type="button"
        aria-label="上一张图片"
        @click="go(-1)"
      >
        ‹
      </button>
      <button
        v-if="multiple"
        class="carousel__nav carousel__nav--next"
        type="button"
        aria-label="下一张图片"
        @click="go(1)"
      >
        ›
      </button>

      <p v-if="multiple" class="carousel__counter" aria-live="polite">
        {{ active + 1 }} / {{ images.length }}
      </p>
    </div>

    <div v-if="multiple" class="carousel__thumbs" role="tablist" aria-label="图片缩略图">
      <button
        v-for="(image, index) in images"
        :key="image.url"
        class="carousel__thumb"
        :class="{ 'is-active': index === active }"
        type="button"
        role="tab"
        :aria-selected="index === active"
        :aria-label="`查看第 ${index + 1} 张：${image.alt}`"
        @click="select(index)"
      >
        <img :src="image.url" :alt="''" loading="lazy" />
      </button>
    </div>

    <figcaption class="carousel__credit">
      <p>
        <span v-if="current.kind" class="carousel__kind">{{ current.kind }}</span>
        {{ current.alt }}
      </p>
      <small>
        {{ current.credit }}
        <span v-if="current.license"> · {{ current.license }}</span>
        <a v-if="current.sourceUrl" :href="current.sourceUrl" target="_blank" rel="noopener noreferrer">来源</a>
      </small>
      <small v-if="current.latin">学名：{{ current.latin }}</small>
    </figcaption>
  </div>
</template>

<style scoped>
.carousel {
  display: grid;
  gap: 10px;
}

.carousel__stage {
  position: relative;
  aspect-ratio: 4 / 3;
  background: rgba(235, 226, 210, 0.5);
  overflow: hidden;
  outline: none;
  touch-action: pan-y;
}

.carousel__stage:focus-visible {
  box-shadow: 0 0 0 2px rgba(163, 58, 43, 0.45);
}

.carousel__stage img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: rgba(246, 241, 231, 0.5);
}

.carousel__nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 34px;
  height: 46px;
  border: 1px solid rgba(163, 58, 43, 0.28);
  background: rgba(250, 246, 238, 0.86);
  color: var(--cinnabar);
  font-family: var(--font-serif);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  transition: background 0.2s ease;
}

.carousel__nav:hover {
  background: rgba(163, 58, 43, 0.12);
}

.carousel__nav--prev {
  left: 8px;
}

.carousel__nav--next {
  right: 8px;
}

.carousel__counter {
  position: absolute;
  right: 10px;
  bottom: 8px;
  margin: 0;
  padding: 2px 8px;
  background: rgba(30, 24, 18, 0.55);
  color: #f7f1e4;
  font-size: 0.64rem;
  letter-spacing: 0.08em;
}

.carousel__thumbs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.carousel__thumb {
  flex: 0 0 auto;
  width: 58px;
  height: 58px;
  padding: 0;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  opacity: 0.68;
  transition: opacity 0.2s ease, border-color 0.2s ease;
}

.carousel__thumb:hover {
  opacity: 0.9;
}

.carousel__thumb.is-active {
  border-color: var(--cinnabar);
  opacity: 1;
  box-shadow: inset 0 0 0 1px rgba(163, 58, 43, 0.5);
}

.carousel__thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carousel__credit {
  margin: 0;
}

.carousel__credit p {
  margin: 0 0 3px;
  color: var(--ink);
  font-size: 0.76rem;
  line-height: 1.6;
}

.carousel__credit small {
  display: block;
  color: var(--ink-faint);
  font-size: 0.62rem;
  line-height: 1.6;
}

.carousel__credit a {
  margin-left: 6px;
  color: var(--cinnabar);
}

.carousel__kind {
  display: inline-block;
  margin-right: 6px;
  padding: 1px 6px;
  border: 1px solid rgba(163, 58, 43, 0.35);
  color: var(--cinnabar);
  font-size: 0.58rem;
  letter-spacing: 0.08em;
}
</style>
