<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Acupoint } from '@/types/tcm'
import type { MeridianPlate, PlateHotspot } from '@/data/meridian-plates'
import { useTcmData } from '@/composables/useTcmData'

const props = defineProps<{
  plate: MeridianPlate
  points: Acupoint[]
  meridianName: string
  meridianDescription?: string
  selectedId?: string | null
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const frame = ref<HTMLElement | null>(null)
const hoverId = ref<string | null>(null)
const tip = ref<{ point: Acupoint; left: number; top: number; maxHeight?: number } | null>(null)
const meridianTip = ref<{ left: number; top: number } | null>(null)
const { citationsById } = useTcmData()
let hideTimer: number | null = null

const pointsById = computed(() => new Map(props.points.map((point) => [point.id, point])))

const hotspots = computed(() =>
  props.plate.hotspots.filter((hotspot) => pointsById.value.has(hotspot.id)),
)

const dotHotspots = computed(() =>
  hotspots.value.filter(
    (hotspot) =>
      hotspot.dotX != null &&
      hotspot.dotY != null &&
      // 圆点与穴名热区同位的，不再额外生成按钮，避免密集处互相遮挡。
      (Math.abs(hotspot.dotX - hotspot.x) > 0.0005 ||
        Math.abs(hotspot.dotY - hotspot.y) > 0.0005),
  ),
)

const labelHotspots = computed(() => hotspots.value.filter((hotspot) => hotspot.showLabel))
const plainHotspots = computed(() => hotspots.value.filter((hotspot) => !hotspot.showLabel))
const leaderHotspots = computed(() =>
  labelHotspots.value.filter((hotspot) => hotspot.dotX != null && hotspot.dotY != null),
)

const activeSpot = computed(() => {
  const id = hoverId.value ?? props.selectedId
  if (!id) return null
  return hotspots.value.find((spot) => spot.id === id && spot.dotX != null) ?? null
})

const activePoint = computed(() => (hoverId.value ? pointsById.value.get(hoverId.value) ?? null : null))
const activeTypes = computed(() =>
  activePoint.value ? activePoint.value.pointTypes.map((type) => type.label).join(' · ') : '',
)

function hotspotStyle(hotspot: PlateHotspot) {
  return {
    left: `${hotspot.x * 100}%`,
    top: `${hotspot.y * 100}%`,
    width: `${hotspot.w * 100}%`,
    height: `${hotspot.h * 100}%`,
  }
}

function labelStyle(hotspot: PlateHotspot) {
  return {
    left: `${hotspot.x * 100}%`,
    top: `${hotspot.y * 100}%`,
  }
}

function dotStyle(hotspot: PlateHotspot) {
  return {
    left: `${(hotspot.dotX ?? hotspot.x) * 100}%`,
    top: `${(hotspot.dotY ?? hotspot.y) * 100}%`,
  }
}

function glowStyle(hotspot: PlateHotspot) {
  const size = props.plate.glowSize ?? 9
  return { ...dotStyle(hotspot), width: `${size}px`, height: `${size}px` }
}

function routePoints(route: Array<[number, number]>) {
  return route.map(([x, y]) => `${x},${y}`).join(' ')
}

function showTip(hotspot: PlateHotspot) {
  showTipAt(hotspot, hotspot.x, hotspot.y)
}

function showDotTip(hotspot: PlateHotspot) {
  showTipAt(hotspot, hotspot.dotX ?? hotspot.x, hotspot.dotY ?? hotspot.y)
}

function citationWorks(ids: string[]) {
  const works = ids
    .map((id) => citationsById.value.get(id)?.work)
    .filter((work): work is string => Boolean(work))
  return [...new Set(works)]
}

function sourceText(point: Acupoint) {
  const locationWorks = citationWorks(point.location.citationIds)
  const indicationWorks = citationWorks(point.indications.citationIds)
  const parts: string[] = []
  if (locationWorks.length) parts.push(`定位 ${locationWorks.join('、')}`)
  if (indicationWorks.length) parts.push(`主治 ${indicationWorks.join('、')}`)
  return parts.join('；') || '出处待补'
}

function showTipAt(hotspot: PlateHotspot, anchorX: number, anchorY: number) {
  const point = pointsById.value.get(hotspot.id)
  const box = frame.value
  if (!point || !box) return
  cancelHide()
  hoverId.value = hotspot.id
  meridianTip.value = null

  const detailed = props.plate.detailedTips === true
  const width = box.clientWidth
  const height = box.clientHeight
  const wide = props.plate.width > props.plate.height
  const tipW = detailed ? 300 : 236
  const tipH = wide ? 190 : 196
  const anchor = anchorX * width
  const frameRect = box.getBoundingClientRect()
  const stage = box.closest('.meridian-stage') as HTMLElement | null
  const stageRect = stage?.getBoundingClientRect() ?? null
  const spaceBelow = stageRect ? stageRect.bottom - frameRect.bottom - 8 : 0
  const spaceAbove = stageRect ? frameRect.top - stageRect.top - 8 : 0

  let left: number
  let top: number
  let maxHeight: number | undefined

  if (detailed) {
    // 详情卡片较高，优先贴着热区左右摆放；放不下时改为上下摆放，避免盖住当前穴名。
    const gap = 24
    const anchorClear = hotspot.w * width * 0.5 + 2
    left = anchor + gap
    if (left + tipW > width - 6) left = anchor - gap - tipW
    left = Math.max(6, Math.min(left, width - tipW - 6))

    const stageTopRel = stageRect ? stageRect.top - frameRect.top : 0
    const stageBottomRel = stageRect ? stageRect.bottom - frameRect.top : height
    maxHeight = Math.max(
      240,
      Math.min(window.innerHeight * 0.7, 520, stageBottomRel - stageTopRel - 16),
    )

    const clearsAnchor = left + tipW <= anchor - anchorClear || left >= anchor + anchorClear
    if (clearsAnchor) {
      top = anchorY * height - maxHeight / 2
      top = Math.max(stageTopRel + 8, Math.min(top, stageBottomRel - maxHeight - 8))

      // 左上角是图上“督脉”标题，卡片落在该区域时下移并压缩最大高度。
      const titleRight = width * 0.22
      const titleBottom = height * 0.28
      if (left < titleRight && top < titleBottom) {
        const nudged = titleBottom + 8
        if (stageBottomRel - nudged > 240) {
          top = nudged
          maxHeight = Math.min(maxHeight, stageBottomRel - top - 8)
        }
      }
    } else {
      // 窄屏时卡片与热区横向重叠，改放到热区上方或下方。
      const aboveRoom = anchorY * height - (stageTopRel + 8) - anchorClear
      const belowRoom = stageBottomRel - 8 - anchorY * height - anchorClear
      const useBelow = belowRoom >= aboveRoom
      maxHeight = Math.min(maxHeight, Math.max(240, useBelow ? belowRoom : aboveRoom))
      top = useBelow
        ? anchorY * height + anchorClear
        : anchorY * height - anchorClear - maxHeight
      top = Math.max(stageTopRel + 8, Math.min(top, stageBottomRel - maxHeight - 8))
    }
  } else if (wide && spaceBelow + 12 >= tipH) {
    // 宽图把卡片放到图片下方，允许压住底部 12px 纸边，避免遮住标题和身体。
    left = anchor - tipW / 2
    top = height - 12
  } else if (wide && spaceAbove + 12 >= tipH) {
    left = anchor - tipW / 2
    top = -tipH + 12
  } else {
    const preferLeft = props.plate.tipSide === 'left'
    left = preferLeft ? anchor - tipW - 16 : anchor + 16
    if (left < 6) left = anchor + 16
    if (left + tipW > width - 6) left = anchor - tipW - 16
    top = anchorY * height + 14
    if (top + tipH > height - 6) {
      top = anchorY * height - tipH - 14
      if (top < 6) top = height - tipH - 6
    }
    top = Math.max(6, Math.min(top, height - tipH - 6))
  }
  left = Math.max(6, Math.min(left, width - tipW - 6))
  tip.value = { point, left, top, maxHeight }
}

function cancelHide() {
  if (hideTimer !== null) {
    window.clearTimeout(hideTimer)
    hideTimer = null
  }
}

function scheduleHide() {
  cancelHide()
  hideTimer = window.setTimeout(() => {
    hideTimer = null
    hideTip()
  }, 180)
}

function hideTip() {
  cancelHide()
  hoverId.value = null
  tip.value = null
}

function onFrameMove(event: PointerEvent) {
  if (event.pointerType === 'touch') return
  const target = event.target as HTMLElement | null
  if (target?.closest('.plate-tip')) {
    // 指针移到卡片上（含滚动）时保持卡片，不要立刻消失。
    cancelHide()
    return
  }
  if (target?.closest('.plate-hot')) {
    meridianTip.value = null
    return
  }
  const box = frame.value
  if (!box) return
  hideTip()
  const rect = box.getBoundingClientRect()
  const tipW = 302
  const tipH = 258
  let left = event.clientX - rect.left + 18
  let top = event.clientY - rect.top + 18
  if (left + tipW > rect.width - 8) left = event.clientX - rect.left - tipW - 18
  if (top + tipH > rect.height - 8) top = event.clientY - rect.top - tipH - 18
  meridianTip.value = {
    left: Math.max(8, left),
    top: Math.max(8, top),
  }
}

function onFrameLeave() {
  meridianTip.value = null
  hideTip()
}

function choose(hotspot: PlateHotspot) {
  emit('select', hotspot.id)
}
</script>

<template>
  <figure
    ref="frame"
    class="plate-frame"
    :class="{ 'plate-frame--wide': plate.width > plate.height, 'plate-frame--dense': plate.hotspots.length > 24, 'plate-frame--detailed': plate.detailedTips }"
    :style="{ aspectRatio: `${plate.width} / ${plate.height}` }"
    @pointermove="onFrameMove"
    @pointerleave="onFrameLeave"
  >
    <img
      class="plate-image"
      :src="plate.image"
      :alt="`${plate.title}，图上标注${meridianName}穴位名称`"
      draggable="false"
    />

    <svg
      v-if="plate.routes?.length"
      class="plate-routes"
      :viewBox="`0 0 ${plate.width} ${plate.height}`"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        v-for="(route, index) in plate.routes"
        :key="`route-glow-${index}`"
        class="plate-routes__glow"
        :points="routePoints(route)"
      />
      <polyline
        v-for="(route, index) in plate.routes"
        :key="`route-core-${index}`"
        class="plate-routes__core"
        :points="routePoints(route)"
      />
    </svg>

    <div v-if="plate.glowDots" class="plate-glows" aria-hidden="true">
      <span
        v-for="hotspot in hotspots"
        :key="`glow-${hotspot.id}`"
        class="plate-glow"
        :class="{
          'plate-glow--active': selectedId === hotspot.id || hoverId === hotspot.id,
          'plate-glow--small': (plate.glowSize ?? 9) < 6,
        }"
        :style="glowStyle(hotspot)"
      ></span>
    </div>

    <div v-if="plate.extraGlows?.length" class="plate-glows" aria-hidden="true">
      <span
        v-for="(glow, index) in plate.extraGlows"
        :key="`extra-glow-${index}`"
        class="plate-glow plate-glow--small"
        :style="{ left: `${glow.x * 100}%`, top: `${glow.y * 100}%` }"
      ></span>
    </div>

    <div class="plate-overlay">
      <svg
        v-if="leaderHotspots.length"
        class="plate-leaders"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <line
          v-for="hotspot in leaderHotspots"
          :key="`leader-${hotspot.id}`"
          :x1="hotspot.x * 100"
          :y1="hotspot.y * 100"
          :x2="(hotspot.dotX ?? hotspot.x) * 100"
          :y2="(hotspot.dotY ?? hotspot.y) * 100"
        />
      </svg>

      <button
        v-for="hotspot in labelHotspots"
        :key="`label-${hotspot.id}`"
        type="button"
        class="plate-hot plate-hot--label"
        :class="{ 'plate-hot--active': selectedId === hotspot.id || hoverId === hotspot.id }"
        :style="labelStyle(hotspot)"
        :aria-label="`${pointsById.get(hotspot.id)?.name ?? hotspot.id}，查看穴位资料`"
        @pointerenter="showTip(hotspot)"
        @pointerleave="scheduleHide"
        @focus="showTip(hotspot)"
        @blur="scheduleHide"
        @click="choose(hotspot)"
      >{{ pointsById.get(hotspot.id)?.name ?? hotspot.id }}</button>

      <button
        v-for="hotspot in plainHotspots"
        :key="hotspot.id"
        type="button"
        class="plate-hot"
        :class="{ 'plate-hot--active': selectedId === hotspot.id || hoverId === hotspot.id }"
        :style="hotspotStyle(hotspot)"
        :aria-label="`${pointsById.get(hotspot.id)?.name ?? hotspot.id}，查看穴位资料`"
        @pointerenter="showTip(hotspot)"
        @pointerleave="scheduleHide"
        @focus="showTip(hotspot)"
        @blur="scheduleHide"
        @click="choose(hotspot)"
      ></button>

      <button
        v-for="hotspot in dotHotspots"
        :key="`dot-${hotspot.id}`"
        type="button"
        class="plate-hot plate-hot--dot"
        :class="{ 'plate-hot--active': selectedId === hotspot.id || hoverId === hotspot.id }"
        :style="dotStyle(hotspot)"
        :aria-label="`${pointsById.get(hotspot.id)?.name ?? hotspot.id}，查看穴位资料`"
        @pointerenter="showDotTip(hotspot)"
        @pointerleave="scheduleHide"
        @focus="showDotTip(hotspot)"
        @blur="scheduleHide"
        @click="choose(hotspot)"
      ></button>

      <span
        v-for="(label, index) in plate.extraLabels ?? []"
        :key="`extra-label-${index}`"
        class="plate-extra-label"
        :style="{ left: `${label.x * 100}%`, top: `${label.y * 100}%` }"
      >{{ label.text }}</span>

      <span
        v-if="activeSpot"
        class="plate-dot"
        :style="dotStyle(activeSpot)"
        aria-hidden="true"
      ></span>
    </div>

    <div
      v-if="tip && activePoint && plate.detailedTips"
      class="plate-tip plate-tip--detailed"
      role="dialog"
      aria-label="穴位详情"
      :style="{ left: `${tip.left}px`, top: `${tip.top}px`, maxHeight: tip.maxHeight ? `${tip.maxHeight}px` : undefined }"
      @pointerenter="cancelHide"
    >
      <div class="plate-tip__head">
        <strong>{{ activePoint.name }}</strong>
        <span class="plate-tip__pinyin">{{ activePoint.pinyin }}</span>
        <span class="plate-tip__tag">{{ activePoint.annotation }}</span>
      </div>
      <p class="plate-tip__row">
        <b>穴性</b>
        <span>{{ activeTypes || activePoint.annotation }}</span>
      </p>
      <p class="plate-tip__row">
        <b>经络</b>
        <span>{{ meridianName }}（{{ activePoint.id }}）</span>
      </p>
      <p class="plate-tip__row">
        <b>定位</b>
        <span>{{ activePoint.location.text }}</span>
      </p>
      <p class="plate-tip__row">
        <b>主治</b>
        <span>{{ activePoint.indications.text }}</span>
      </p>
      <p class="plate-tip__row">
        <b>针刺</b>
        <span>{{ activePoint.needle.text }}</span>
      </p>
      <p class="plate-tip__row">
        <b>艾灸</b>
        <span>{{ activePoint.moxa.text }}</span>
      </p>
      <p v-if="activePoint.safety" class="plate-tip__row plate-tip__row--safety">
        <b>安全</b>
        <span>{{ activePoint.safety }}</span>
      </p>
      <p class="plate-tip__row">
        <b>出处</b>
        <span>{{ sourceText(activePoint) }}</span>
      </p>
      <div class="plate-tip__hint">点击查看右侧完整资料</div>
    </div>

    <div
      v-else-if="tip && activePoint"
      class="plate-tip"
      :class="{ 'plate-tip--compact': plate.width > plate.height }"
      role="tooltip"
      :style="{ left: `${tip.left}px`, top: `${tip.top}px` }"
    >
      <div class="plate-tip__head">
        <strong>{{ activePoint.name }}</strong>
        <span class="plate-tip__pinyin">{{ activePoint.pinyin }}</span>
        <span class="plate-tip__tag">{{ activePoint.annotation }}</span>
      </div>
      <div class="plate-tip__meta">
        <span>{{ meridianName }}</span>
        <span v-if="activeTypes">{{ activeTypes }}</span>
      </div>
      <p class="plate-tip__row">
        <b>定位</b>
        <span>{{ activePoint.location.text }}</span>
      </p>
      <p class="plate-tip__row">
        <b>主治</b>
        <span>{{ activePoint.indications.text }}</span>
      </p>
      <div class="plate-tip__hint">点击查看完整资料</div>
    </div>

    <div
      v-if="meridianTip"
      class="plate-tip plate-tip--meridian"
      role="tooltip"
      :style="{ left: `${meridianTip.left}px`, top: `${meridianTip.top}px` }"
    >
      <div class="plate-tip__head">
        <strong>{{ plate.label }}</strong>
        <span class="plate-tip__tag">{{ plate.countLabel }}</span>
      </div>
      <div class="plate-tip__meta">
        <span v-if="plate.flow">流注 {{ plate.flow }}</span>
        <span>悬停穴名看单穴资料</span>
      </div>
      <p v-if="meridianDescription" class="plate-tip__row">
        <b>循行</b>
        <span>{{ meridianDescription }}</span>
      </p>
      <p class="plate-tip__row">
        <b>主治</b>
        <span>{{ plate.overview.indications }}</span>
      </p>
      <div class="plate-tip__shu">
        <b>五输</b>
        <span v-for="shu in plate.overview.fiveShu" :key="shu.id">{{ shu.name }} {{ shu.label }}</span>
      </div>
      <div class="plate-tip__hint">点击图上穴位查看完整资料</div>
    </div>

    <div class="plate-piece plate-piece--seal" aria-hidden="true">
      <span class="plate-piece__seal">{{ plate.seal }}</span>
      <span class="plate-piece__meta">
        <strong>{{ plate.label }}</strong>
        <small>{{ plate.countLabel }}</small>
      </span>
    </div>

    <div class="plate-piece plate-piece--source" aria-hidden="true">
      <span>定位 GB/T 12346-2021</span>
      <span>主治《针灸学》</span>
      <span>图版：用户提供</span>
    </div>

    <figcaption class="sr-only">{{ plate.title }}。{{ plate.credit }}</figcaption>
  </figure>
</template>

<style scoped>
.plate-frame {
  position: relative;
  display: block;
  width: min(100%, 450px);
  margin: 0 auto;
  border-radius: 6px;
  overflow: visible;
  box-shadow:
    0 22px 46px rgba(66, 45, 30, 0.18),
    0 2px 0 rgba(255, 255, 255, 0.6) inset;
}

.plate-frame--wide {
  width: min(100%, 880px);
}

.plate-frame--wide .plate-piece {
  display: none;
}

.plate-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: fill;
  border-radius: inherit;
  user-select: none;
}

.plate-routes {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.plate-routes polyline {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.plate-routes__glow {
  stroke: rgba(74, 160, 255, 0.55);
  stroke-width: 8;
  filter: blur(3px);
}

.plate-routes__core {
  stroke: #a9e2ff;
  stroke-width: 2;
  filter: drop-shadow(0 0 2px rgba(90, 180, 255, 0.95));
}

.plate-glows {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.plate-glow {
  position: absolute;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: #f4fcff;
  box-shadow:
    0 0 0 1px rgba(74, 150, 225, 0.92),
    0 0 7px 3px rgba(90, 175, 255, 0.8),
    0 0 16px 6px rgba(40, 120, 255, 0.32);
}

.plate-glow--active {
  box-shadow:
    0 0 0 2px rgba(163, 58, 43, 0.75),
    0 0 10px 4px rgba(90, 175, 255, 0.9),
    0 0 20px 7px rgba(40, 120, 255, 0.38);
}

.plate-glow--small {
  box-shadow:
    0 0 0 0.5px rgba(74, 150, 225, 0.88),
    0 0 3px 1px rgba(90, 175, 255, 0.55);
}

.plate-glow--small.plate-glow--active {
  box-shadow:
    0 0 0 1px rgba(163, 58, 43, 0.7),
    0 0 4px 1px rgba(90, 175, 255, 0.75);
}

.plate-overlay {
  position: absolute;
  inset: 0;
}

.plate-hot {
  position: absolute;
  transform: translate(-50%, -50%);
  padding: 0;
  border: 0;
  border-radius: 3px;
  background: transparent;
  cursor: pointer;
  transition:
    background 0.16s ease,
    box-shadow 0.16s ease;
}

.plate-hot::before {
  content: '';
  position: absolute;
  inset: -5px;
}

/* 督脉热区直接覆盖图上已印穴名，密集排列时不扩大命中区，避免上下相邻穴名互相抢占。 */
.plate-frame--detailed .plate-hot::before {
  inset: 0;
}

.plate-hot:hover,
.plate-hot:focus-visible {
  background: rgba(163, 58, 43, 0.1);
  box-shadow: 0 0 0 1px rgba(163, 58, 43, 0.42);
  outline: none;
}

.plate-hot--active {
  background: rgba(163, 58, 43, 0.14);
  box-shadow: 0 0 0 1px rgba(163, 58, 43, 0.55);
}

.plate-leaders {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.plate-leaders line {
  stroke: rgba(58, 103, 140, 0.52);
  stroke-width: 1;
  stroke-dasharray: 3 2;
  vector-effect: non-scaling-stroke;
}

.plate-hot--label {
  z-index: 2;
  width: auto;
  height: auto;
  padding: 2px 6px;
  border: 1px solid rgba(120, 92, 62, 0.24);
  border-radius: 2px;
  background: rgba(249, 244, 232, 0.92);
  box-shadow: 0 1px 3px rgba(80, 56, 36, 0.08);
  color: #3b2b22;
  font-family: var(--serif);
  font-size: 0.6rem;
  line-height: 1.05;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.plate-frame--dense .plate-hot--label {
  padding: 0 4px;
  font-size: 0.5rem;
  line-height: 1;
  letter-spacing: 0;
}

.plate-hot--label:hover,
.plate-hot--label:focus-visible {
  border-color: rgba(163, 58, 43, 0.55);
  background: #fffaf0;
  box-shadow: 0 0 0 1px rgba(163, 58, 43, 0.22);
  color: var(--cinnabar);
}

.plate-extra-label {
  position: absolute;
  z-index: 2;
  transform: translate(-50%, -50%);
  padding: 2px 5px;
  border: 1px dashed rgba(120, 92, 62, 0.3);
  border-radius: 2px;
  background: rgba(249, 244, 232, 0.86);
  color: #6b4a38;
  font-family: var(--serif);
  font-size: 0.55rem;
  line-height: 1;
  letter-spacing: 0.03em;
  white-space: nowrap;
  pointer-events: none;
}

.plate-hot--dot {
  width: 14px;
  height: 14px;
  min-width: 14px;
  border-radius: 50%;
  background: transparent;
  box-shadow: none;
}

.plate-hot--dot:hover,
.plate-hot--dot:focus-visible {
  background: transparent;
  box-shadow: 0 0 0 2px rgba(163, 58, 43, 0.72);
}

.plate-hot--dot.plate-hot--active {
  background: transparent;
  box-shadow: 0 0 0 2px rgba(163, 58, 43, 0.5);
}

.plate-dot {
  position: absolute;
  width: 12px;
  height: 12px;
  border: 2px solid var(--cinnabar);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 0 4px rgba(163, 58, 43, 0.14);
  pointer-events: none;
  animation: plate-pulse 2.1s ease-in-out infinite;
}

@keyframes plate-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 3px rgba(163, 58, 43, 0.14);
  }
  50% {
    box-shadow: 0 0 0 7px rgba(163, 58, 43, 0.03);
  }
}

.plate-tip {
  position: absolute;
  z-index: 6;
  width: 236px;
  padding: 12px 14px 10px;
  border: 1px solid rgba(178, 58, 42, 0.26);
  border-radius: 14px;
  background: rgba(249, 244, 232, 0.97);
  box-shadow:
    0 18px 40px rgba(63, 42, 28, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  color: var(--ink);
  font-size: 0.72rem;
  line-height: 1.6;
  pointer-events: none;
  backdrop-filter: blur(8px);
}

.plate-tip--meridian {
  width: 302px;
}

.plate-tip--detailed {
  width: 300px;
  padding: 12px 14px 10px;
  font-size: 0.68rem;
  line-height: 1.58;
  pointer-events: auto;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(163, 58, 43, 0.35) transparent;
}

.plate-tip--detailed::-webkit-scrollbar {
  width: 5px;
}

.plate-tip--detailed::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(163, 58, 43, 0.32);
}

.plate-tip--detailed .plate-tip__head {
  padding-bottom: 5px;
  border-bottom: 1px dashed var(--line);
}

.plate-tip--detailed .plate-tip__row {
  grid-template-columns: 34px 1fr;
  margin: 5px 0;
}

.plate-tip--detailed .plate-tip__row span {
  display: block;
  overflow: visible;
  -webkit-line-clamp: unset;
}

.plate-tip--detailed .plate-tip__row--safety span {
  color: #7c3b30;
}

.plate-tip--compact .plate-tip__row span {
  -webkit-line-clamp: 2;
}

.plate-tip--meridian .plate-tip__row {
  grid-template-columns: 34px 1fr;
}

.plate-tip__shu {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  margin: 7px 0 0;
  color: var(--ink-soft);
  font-size: 0.64rem;
}

.plate-tip__shu b {
  color: var(--ink);
  font-family: var(--serif);
  font-weight: 600;
}

.plate-tip__shu span {
  white-space: nowrap;
}

.plate-tip__head {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px;
}

.plate-tip__head strong {
  font-family: var(--serif);
  font-size: 1.05rem;
  letter-spacing: 0.04em;
}

.plate-tip__pinyin {
  color: var(--ink-faint);
  font-size: 0.62rem;
  letter-spacing: 0.02em;
}

.plate-tip__tag {
  margin-left: auto;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(178, 58, 42, 0.1);
  color: var(--cinnabar);
  font-size: 0.6rem;
}

.plate-tip__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 3px 0 8px;
  color: var(--ink-soft);
  font-size: 0.64rem;
}

.plate-tip__row {
  display: grid;
  grid-template-columns: 30px 1fr;
  gap: 6px;
  margin: 4px 0;
  color: var(--ink-soft);
}

.plate-tip__row b {
  color: var(--ink);
  font-family: var(--serif);
  font-weight: 600;
}

.plate-tip__row span {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.plate-tip__hint {
  margin-top: 8px;
  padding-top: 7px;
  border-top: 1px dashed var(--line);
  color: var(--cinnabar);
  font-size: 0.62rem;
  letter-spacing: 0.03em;
}

.plate-piece {
  position: absolute;
  display: flex;
  color: #3b2b22;
  background: #f7f1e4;
  border: 1px solid rgba(120, 92, 62, 0.28);
  box-shadow: 0 2px 8px rgba(80, 56, 36, 0.08);
  pointer-events: none;
}

.plate-piece--seal {
  left: 1.2%;
  top: 4%;
  width: 19%;
  height: 12%;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 5px 3px;
  border-radius: 2px;
}

.plate-piece__seal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex: none;
  border-radius: 2px;
  background: #a33a2b;
  color: #f7efe1;
  font-family: var(--serif);
  font-size: 0.78rem;
  line-height: 1;
}

.plate-piece__meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-right: 2px;
  font-family: var(--serif);
  line-height: 1.15;
}

.plate-piece__meta strong {
  font-size: 0.56rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.plate-piece__meta small {
  color: #7a5b42;
  font-size: 0.48rem;
  letter-spacing: 0.04em;
}

.plate-piece--source {
  left: 1.5%;
  bottom: 1%;
  width: 24%;
  height: 12%;
  flex-direction: column;
  justify-content: flex-start;
  gap: 3px;
  padding: 9px 10px;
  border-radius: 2px;
  border-left: 2px solid rgba(163, 58, 43, 0.42);
  color: #6c5138;
  font-family: var(--serif);
  font-size: 0.48rem;
  line-height: 1.3;
  letter-spacing: 0.02em;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  border: 0;
}

@media (hover: none) {
  .plate-tip {
    display: none;
  }
}

@media (max-width: 560px) {
  .plate-frame--wide .plate-piece {
    display: none;
  }

  .plate-piece--seal {
    width: 27%;
    height: 13%;
    gap: 3px;
  }

  .plate-piece__meta strong {
    font-size: 0.5rem;
  }

  .plate-piece__meta small {
    font-size: 0.42rem;
  }

  .plate-piece--source {
    width: 31%;
    font-size: 0.42rem;
  }

  .plate-hot:not(.plate-hot--dot)::before {
    inset: -8px;
  }

  .plate-hot--label {
    padding: 1px 4px;
    font-size: 0.52rem;
  }
}
</style>
