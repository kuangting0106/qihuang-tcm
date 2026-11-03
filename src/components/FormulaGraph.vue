<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import type { Formula, FormulaRole } from '@/types/tcm'
import { ROLE_ORDER } from '@/types/tcm'
import { useTcmData } from '@/composables/useTcmData'

const props = withDefaults(
  defineProps<{
    formula: Formula
    selectedHerbId?: string | null
    showPairs?: boolean
    herbNotes?: Record<string, string>
    herbRoles?: Record<string, FormulaRole>
  }>(),
  {
    selectedHerbId: null,
    showPairs: true,
    herbNotes: () => ({}),
    herbRoles: () => ({}),
  },
)

const emit = defineEmits<{
  select: [herbId: string]
  'update-role': [herbId: string, role: FormulaRole]
  'update-note': [herbId: string, note: string]
  reset: [herbId: string]
}>()

const { herbsById } = useTcmData()

const W = 760
const H = 620
const CX = W / 2
const CY = H / 2

const scale = ref(1)
const tx = ref(0)
const ty = ref(0)
const dragging = ref(false)
const dragMoved = ref(false)
const dragStart = ref({ x: 0, y: 0, tx: 0, ty: 0 })
const graphCanvas = ref<HTMLElement | null>(null)
const hoveredNode = ref<GraphNode | null>(null)
const tip = ref({ x: 0, y: 0, width: 240 })

const roleColors: Record<FormulaRole, { strong: string; pale: string }> = {
  君: { strong: '#c0392b', pale: '#f5d6d1' },
  臣: { strong: '#d68910', pale: '#fae5c5' },
  佐: { strong: '#1e8449', pale: '#d5efdf' },
  使: { strong: '#2e5fa3', pale: '#d6e4f5' },
  佐使: { strong: '#7d3c98', pale: '#eadcf2' },
  未标注: { strong: '#7f8c8d', pale: '#e5e7e7' },
}

interface GraphNode {
  herbId: string
  name: string
  role: FormulaRole
  x: number
  y: number
  action?: string
}

function roleFor(item: Formula['composition'][number]): FormulaRole {
  return props.herbRoles?.[item.herbId] ?? item.role
}

const groups = computed(() =>
  ROLE_ORDER.map((role) => ({
    role,
    items: props.formula.composition.filter((c) => roleFor(c) === role),
  })).filter((g) => g.items.length > 0),
)

const nodes = computed<GraphNode[]>(() => {
  const out: GraphNode[] = []
  groups.value.forEach((group, groupIndex) => {
    const count = group.items.length
    const radius = 100 + groupIndex * 48
    const offset = -Math.PI / 2 + groupIndex * 0.42
    group.items.forEach((item, index) => {
      const angle = count === 1 ? offset : offset + (Math.PI * 2 * index) / count
      const herb = herbsById.value.get(item.herbId)
      out.push({
        herbId: item.herbId,
        name: item.herbName ?? herb?.name ?? item.herbId,
        role: roleFor(item),
        x: CX + Math.cos(angle) * radius,
        y: CY + Math.sin(angle) * radius,
        action: item.action?.text,
      })
    })
  })
  return out
})

const nodeMap = computed(() => new Map(nodes.value.map((n) => [n.herbId, n])))

const selectedNode = computed(() =>
  props.selectedHerbId ? nodeMap.value.get(props.selectedHerbId) ?? null : null,
)

const pairEdges = computed(() => {
  if (!props.showPairs) return []
  return props.formula.corePairs
    .map((pair) => {
      const a = nodeMap.value.get(pair.from)
      const b = nodeMap.value.get(pair.to)
      if (!a || !b) return null
      const mx = (a.x + b.x) / 2
      const my = (a.y + b.y) / 2
      const dx = b.x - a.x
      const dy = b.y - a.y
      const len = Math.hypot(dx, dy) || 1
      const nx = -dy / len
      const ny = dx / len
      const curve = 34
      const cx = mx + nx * curve
      const cy = my + ny * curve
      return {
        ...pair,
        a,
        b,
        path: `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`,
        active:
          !props.selectedHerbId || pair.from === props.selectedHerbId || pair.to === props.selectedHerbId,
      }
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
})

function roleColor(role: FormulaRole) {
  return roleColors[role] ?? roleColors['未标注']
}

function herbNote(herbId: string) {
  return props.herbNotes?.[herbId]?.trim() ?? ''
}

function summaryText(text: string, limit = 4) {
  const first = text.split(/[，。；、,;]/)[0]?.trim() ?? ''
  return first.length > limit ? first.slice(0, limit) : first
}

function nodeRoleText(node: GraphNode) {
  const detail = summaryText(herbNote(node.herbId) || node.action || '')
  const role = node.role === '未标注' ? (herbNote(node.herbId) ? '补充' : '待补') : node.role
  return detail ? `${role} · ${detail}` : role
}

function nodeActionText(node: GraphNode) {
  return herbNote(node.herbId) || node.action || '教材未逐味说明，点击节点补充方中作用'
}

function nodeNoteSource(node: GraphNode) {
  if (herbNote(node.herbId)) return '访客补充的方中作用'
  if (node.action) return '后世方解，该药材在方中作用思路'
  return '教材未逐味说明，可点节点补充'
}

function nodeRoleBadge(node: GraphNode) {
  if (props.herbRoles?.[node.herbId]) return `${node.role}（补充）`
  return node.role
}

function isDimmed(node: GraphNode) {
  if (!props.selectedHerbId) return false
  if (node.herbId === props.selectedHerbId) return false
  return !props.formula.corePairs.some(
    (p) =>
      (p.from === props.selectedHerbId && p.to === node.herbId) ||
      (p.to === props.selectedHerbId && p.from === node.herbId),
  )
}

function onNodeClick(herbId: string) {
  if (dragMoved.value) return
  emit('select', herbId)
}

function placeTip(event: MouseEvent) {
  const canvas = graphCanvas.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const width = Math.min(250, Math.max(180, rect.width - 16))
  let x = event.clientX - rect.left + 16
  let y = event.clientY - rect.top + 16
  if (x + width > rect.width - 8) {
    x = event.clientX - rect.left - width - 16
  }
  if (y + 118 > rect.height) {
    y = Math.max(8, event.clientY - rect.top - 118)
  }
  x = Math.max(8, Math.min(x, rect.width - width - 8))
  y = Math.max(8, y)
  tip.value = { x, y, width }
}

function onNodeEnter(node: GraphNode, event: MouseEvent) {
  if (dragging.value) return
  hoveredNode.value = node
  placeTip(event)
}

function onNodeMove(event: MouseEvent) {
  if (!hoveredNode.value || dragging.value) return
  placeTip(event)
}

function onWheel(event: WheelEvent) {
  const factor = event.deltaY > 0 ? 0.92 : 1.08
  scale.value = Math.min(2.4, Math.max(0.6, scale.value * factor))
}

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0) return
  // 节点自身负责点击选择；不要在这里捕获指针，否则真实点击会被拖拽逻辑吞掉。
  if ((event.target as Element | null)?.closest?.('.graph-node')) return
  dragging.value = true
  dragMoved.value = false
  dragStart.value = { x: event.clientX, y: event.clientY, tx: tx.value, ty: ty.value }
  ;(event.currentTarget as Element).setPointerCapture?.(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value) return
  hoveredNode.value = null
  const dx = event.clientX - dragStart.value.x
  const dy = event.clientY - dragStart.value.y
  if (Math.abs(dx) + Math.abs(dy) > 4) dragMoved.value = true
  tx.value = dragStart.value.tx + dx
  ty.value = dragStart.value.ty + dy
}

function onPointerUp(event: PointerEvent) {
  dragging.value = false
  ;(event.currentTarget as Element).releasePointerCapture?.(event.pointerId)
  window.setTimeout(() => {
    dragMoved.value = false
  }, 0)
}

function zoomBy(factor: number) {
  scale.value = Math.min(2.4, Math.max(0.6, scale.value * factor))
}

function resetView() {
  scale.value = 1
  tx.value = 0
  ty.value = 0
}

watch(
  () => props.formula.id,
  () => resetView(),
)

const selectedHerb = computed(() =>
  props.selectedHerbId ? herbsById.value.get(props.selectedHerbId) ?? null : null,
)

const editorRole = ref<FormulaRole>('未标注')
const editorNote = ref('')

watch(
  selectedNode,
  (node) => {
    if (!node) return
    editorRole.value = node.role
    editorNote.value = herbNote(node.herbId)
  },
  { immediate: true },
)

function saveEditor() {
  const node = selectedNode.value
  if (!node) return
  emit('update-role', node.herbId, editorRole.value)
  emit('update-note', node.herbId, editorNote.value)
}

function cancelEditor() {
  const node = selectedNode.value
  if (!node) return
  editorRole.value = node.role
  editorNote.value = herbNote(node.herbId)
}

function resetEditor() {
  const node = selectedNode.value
  if (!node) return
  emit('reset', node.herbId)
}
</script>

<template>
  <div class="formula-graph">
    <div class="graph-toolbar">
      <div class="graph-legend">
        <span v-for="role in ROLE_ORDER" :key="role" class="graph-legend__item">
          <i :style="{ background: roleColor(role).strong }"></i>{{ role === '未标注' ? '待补 / 补充' : role }}
        </span>
        <span class="graph-legend__item graph-legend__item--dash"><i></i>方解药对</span>
      </div>
      <div class="graph-zoom">
        <button type="button" aria-label="缩小" @click="zoomBy(0.9)">−</button>
        <button type="button" aria-label="重置视图" @click="resetView">1:1</button>
        <button type="button" aria-label="放大" @click="zoomBy(1.1)">＋</button>
      </div>
    </div>

    <p class="graph-source-note">
      君臣佐使据《方剂学》教材通例归纳，非讲义原文；点击图中药材名，可填写方中作用与角色。
    </p>

    <div ref="graphCanvas" class="graph-canvas">
      <svg
        :viewBox="`0 0 ${W} ${H}`"
        class="graph-svg"
        role="img"
        :aria-label="`${formula.name}配伍关系图`"
        @wheel.prevent="onWheel"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointerleave="onPointerUp"
      >
        <g :transform="`translate(${tx} ${ty}) scale(${scale})`">
          <circle :cx="CX" :cy="CY" r="248" fill="none" stroke="rgba(32,37,34,.08)" stroke-dasharray="3 8" />
          <circle :cx="CX" :cy="CY" r="196" fill="none" stroke="rgba(32,37,34,.06)" stroke-dasharray="3 8" />
          <circle :cx="CX" :cy="CY" r="144" fill="none" stroke="rgba(32,37,34,.05)" stroke-dasharray="3 8" />

          <g class="graph-edges">
            <line
              v-for="node in nodes"
              :key="`edge-${node.herbId}`"
              :x1="CX"
              :y1="CY"
              :x2="node.x"
              :y2="node.y"
              :stroke="roleColor(node.role).strong"
              stroke-width="1.4"
              :opacity="isDimmed(node) ? 0.14 : 0.5"
            />
          </g>

          <g class="graph-pairs" :class="{ 'graph-pairs--dim': !!selectedHerbId }">
            <g v-for="edge in pairEdges" :key="`${edge.from}-${edge.to}`" :opacity="edge.active ? 0.9 : 0.2">
              <path :d="edge.path" fill="none" stroke="#b08a4a" stroke-width="1.6" stroke-dasharray="5 5" />
              <path :d="edge.path" fill="none" stroke="transparent" stroke-width="14" class="graph-pair-hit">
                <title>{{ edge.label }}</title>
              </path>
            </g>
          </g>

          <g class="graph-center">
            <circle :cx="CX" :cy="CY" r="50" fill="#202522" />
            <circle :cx="CX" :cy="CY" r="56" fill="none" stroke="rgba(176,138,74,.45)" stroke-width="1" />
            <text :x="CX" :y="CY - 5" text-anchor="middle" class="graph-center__name">{{ formula.name }}</text>
            <text :x="CX" :y="CY + 16" text-anchor="middle" class="graph-center__sub">
              {{ formula.composition.length }} 味
            </text>
          </g>

          <g
            v-for="node in nodes"
            :key="node.herbId"
            class="graph-node"
            :class="{ 'graph-node--selected': selectedHerbId === node.herbId, 'graph-node--dim': isDimmed(node) }"
            role="button"
            tabindex="0"
            :aria-label="`${node.name}，${nodeRoleText(node)}${nodeActionText(node) ? `，${nodeActionText(node)}` : ''}`"
            @click="onNodeClick(node.herbId)"
            @keydown.enter="onNodeClick(node.herbId)"
            @mouseenter="onNodeEnter(node, $event)"
            @mousemove="onNodeMove"
            @mouseleave="hoveredNode = null"
          >
            <circle
              :cx="node.x"
              :cy="node.y"
              r="30"
              :fill="roleColor(node.role).pale"
              :stroke="roleColor(node.role).strong"
              stroke-width="1.6"
            />
            <circle
              v-if="selectedHerbId === node.herbId"
              :cx="node.x"
              :cy="node.y"
              r="37"
              fill="none"
              :stroke="roleColor(node.role).strong"
              stroke-width="1.2"
              stroke-dasharray="3 4"
            />
            <text :x="node.x" :y="node.y + 5" text-anchor="middle" class="graph-node__name">{{ node.name }}</text>
            <text :x="node.x" :y="node.y + 46" text-anchor="middle" class="graph-node__role">{{ nodeRoleText(node) }}</text>
          </g>
        </g>
      </svg>

      <div
        v-if="hoveredNode"
        class="graph-tip"
        :style="{ left: `${tip.x}px`, top: `${tip.y}px`, width: `${tip.width}px` }"
      >
        <div class="graph-tip__head">
          <strong>{{ hoveredNode.name }}</strong>
          <span class="graph-tip__role" :style="{ background: roleColor(hoveredNode.role).strong }">
            {{ nodeRoleBadge(hoveredNode) }}
          </span>
        </div>
        <p class="graph-tip__action">{{ nodeActionText(hoveredNode) }}</p>
        <p v-if="hoveredNode.action && herbNote(hoveredNode.herbId)" class="graph-tip__local">
          原方解：{{ hoveredNode.action }}
        </p>
        <span class="graph-tip__note">{{ nodeNoteSource(hoveredNode) }}</span>
      </div>
    </div>

    <div v-if="selectedNode" class="graph-editor">
      <div class="graph-editor__head">
        <strong>{{ selectedHerb?.name ?? selectedNode.name }}</strong>
        <span class="graph-editor__badge">{{ nodeRoleBadge(selectedNode) }}</span>
        <button type="button" class="graph-editor__reset" @click="resetEditor">清除已发布修改</button>
      </div>
      <div class="graph-editor__grid">
        <label class="graph-editor__field">
          <span>方中角色</span>
          <select v-model="editorRole">
            <option v-for="role in ROLE_ORDER" :key="role" :value="role">{{ role }}</option>
          </select>
        </label>
        <label class="graph-editor__field graph-editor__field--wide">
          <span>方中作用（可自行填写）</span>
          <textarea
            v-model="editorNote"
            rows="2"
            maxlength="240"
            placeholder="例如：解肌发表，温通卫阳"
          ></textarea>
        </label>
      </div>
      <div class="graph-editor__actions">
        <button type="button" class="graph-editor__save" @click="saveEditor">保存并发布</button>
        <button type="button" @click="cancelEditor">取消</button>
        <span>输入编辑口令后发布给所有访客；无口令仅存本机。</span>
      </div>
    </div>

    <div class="graph-foot">
      <p v-if="selectedNode">
        已选 <strong>{{ selectedHerb?.name ?? selectedNode.name }}</strong>
        <span v-if="selectedNode.action || herbNote(selectedNode.herbId)" class="graph-foot__action">
          {{ selectedNode.action || herbNote(selectedNode.herbId) }}
        </span>
        <span v-else class="graph-foot__empty">教材未逐味说明，可点击药材名填写方中作用</span>
        <RouterLink v-if="selectedHerb" class="text-link" :to="`/herbs/${selectedHerb.id}`">查看药材 →</RouterLink>
      </p>
      <p v-else class="muted">点击药材名填写方中作用 · 拖动平移 · 滚轮缩放</p>
      <span class="graph-hint">实线 = 组成；虚线 = 后世方解</span>
    </div>
  </div>
</template>

<style scoped>
.formula-graph {
  border: 1px solid var(--line);
  border-radius: 18px;
  background:
    radial-gradient(circle at 50% 45%, rgba(176, 138, 74, 0.06), transparent 55%),
    rgba(255, 252, 245, 0.5);
  overflow: hidden;
}

.graph-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid var(--line);
}

.graph-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  color: var(--ink-soft);
  font-size: 0.68rem;
}

.graph-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.graph-legend__item i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.graph-legend__item--dash i {
  width: 13px;
  height: 0;
  border-radius: 0;
  border-top: 1.5px dashed var(--gold);
}

.graph-zoom {
  display: flex;
  gap: 3px;
}

.graph-zoom button {
  min-width: 30px;
  height: 28px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.4);
  color: var(--ink-soft);
  cursor: pointer;
  font-size: 0.72rem;
}

.graph-zoom button:hover {
  border-color: var(--cinnabar);
  color: var(--cinnabar);
}

.graph-source-note {
  margin: 0;
  padding: 7px 14px;
  border-bottom: 1px solid var(--line);
  color: var(--ink-faint);
  font-size: 0.66rem;
  line-height: 1.6;
}

.graph-canvas {
  position: relative;
  aspect-ratio: 760 / 620;
  min-height: 360px;
  max-height: 620px;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.graph-tip {
  position: absolute;
  z-index: 5;
  padding: 10px 12px;
  border: 1px solid rgba(176, 138, 74, 0.4);
  border-radius: 10px;
  background: rgba(255, 252, 245, 0.97);
  box-shadow: 0 8px 24px rgba(32, 37, 34, 0.14);
  pointer-events: none;
}

.graph-tip__head {
  display: flex;
  align-items: center;
  gap: 7px;
}

.graph-tip__head strong {
  font-family: var(--serif);
  font-size: 0.98rem;
  color: var(--ink);
}

.graph-tip__role {
  padding: 1px 6px;
  border-radius: 4px;
  color: #fff;
  font-size: 0.6rem;
  line-height: 1.5;
}

.graph-tip__action {
  margin-top: 5px;
  color: var(--ink);
  font-family: var(--serif);
  font-size: 0.86rem;
  line-height: 1.65;
}

.graph-tip__local {
  margin-top: 4px;
  color: var(--jade);
  font-size: 0.7rem;
  line-height: 1.55;
}

.graph-tip__note {
  display: block;
  margin-top: 5px;
  padding-top: 5px;
  border-top: 1px dashed var(--line);
  color: var(--ink-faint);
  font-size: 0.62rem;
}

.graph-canvas:active {
  cursor: grabbing;
}

.graph-svg {
  display: block;
  width: 100%;
  height: 100%;
}

.graph-center__name {
  fill: #f4efe4;
  font-family: var(--serif);
  font-size: 14px;
  letter-spacing: 0.06em;
}

.graph-center__sub {
  fill: rgba(244, 239, 228, 0.68);
  font-size: 9px;
}

.graph-node {
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.graph-node--dim {
  opacity: 0.32;
}

.graph-node__name {
  fill: var(--ink);
  font-family: var(--serif);
  font-size: 13px;
  pointer-events: none;
}

.graph-node__role {
  fill: var(--ink-soft);
  font-size: 8.5px;
  pointer-events: none;
}

.graph-node--selected .graph-node__name {
  fill: var(--cinnabar);
}

.graph-pair-label {
  fill: #8a6a32;
  font-size: 8px;
  opacity: 0.8;
}

.graph-pair-hit {
  cursor: help;
}

.graph-foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 9px 14px;
  border-top: 1px solid var(--line);
  color: var(--ink-soft);
  font-size: 0.7rem;
}

.graph-foot p {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.graph-foot__action {
  padding: 1px 7px;
  border-radius: 4px;
  background: rgba(47, 111, 107, 0.1);
  color: var(--jade);
  font-size: 0.68rem;
}

.graph-foot__empty {
  color: var(--ink-faint);
  font-size: 0.66rem;
}

.graph-editor {
  padding: 12px 14px;
  border-top: 1px solid var(--line);
  background: rgba(247, 241, 230, 0.72);
}

.graph-editor__head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.graph-editor__head strong {
  font-family: var(--serif);
  font-size: 0.92rem;
}

.graph-editor__badge {
  padding: 1px 7px;
  border-radius: 4px;
  background: rgba(47, 111, 107, 0.12);
  color: var(--jade);
  font-size: 0.62rem;
}

.graph-editor__reset {
  margin-left: auto;
}

.graph-editor__reset,
.graph-editor__actions button {
  padding: 3px 9px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.5);
  color: var(--ink-soft);
  cursor: pointer;
  font-size: 0.66rem;
}

.graph-editor__reset:hover,
.graph-editor__actions button:hover {
  border-color: var(--cinnabar);
  color: var(--cinnabar);
}

.graph-editor__grid {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 10px;
  margin-top: 9px;
}

.graph-editor__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--ink-soft);
  font-size: 0.64rem;
}

.graph-editor__field select,
.graph-editor__field textarea {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: rgba(255, 252, 245, 0.86);
  color: var(--ink);
  font-family: inherit;
  font-size: 0.76rem;
}

.graph-editor__field select {
  height: 32px;
  padding: 0 8px;
}

.graph-editor__field textarea {
  padding: 7px 9px;
  line-height: 1.6;
  resize: vertical;
}

.graph-editor__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 9px;
}

.graph-editor__actions button.graph-editor__save {
  border-color: var(--cinnabar);
  background: var(--cinnabar);
  color: #fff;
}

.graph-editor__actions span {
  color: var(--ink-faint);
  font-size: 0.62rem;
}

.graph-hint {
  color: var(--ink-faint);
  white-space: nowrap;
}

@media (max-width: 680px) {
  .graph-toolbar {
    align-items: flex-start;
  }

  .graph-legend {
    max-width: 70%;
  }

  .graph-foot {
    flex-direction: column;
    align-items: flex-start;
  }

  .graph-canvas {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    min-height: 300px;
  }

  .graph-editor__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .graph-editor__reset {
    margin-left: 0;
  }
}
</style>
