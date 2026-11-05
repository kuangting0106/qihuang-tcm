<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import HumanBody from '@/components/HumanBody.vue'
import CitationBadge from '@/components/CitationBadge.vue'
import SourcedText from '@/components/SourcedText.vue'
import { fetchMeridianData } from '@/composables/useMeridianApi'
import type { Acupoint, Meridian, Region } from '@/types/tcm'
import { REGION_LABELS } from '@/types/tcm'

const route = useRoute()
const router = useRouter()
const meridianList = ref<Meridian[]>([])
const acupointList = ref<Acupoint[]>([])
const loading = ref(true)
const loadError = ref('')
const meridiansById = computed(
  () => new Map(meridianList.value.map((meridian) => [meridian.id, meridian])),
)
const acupointsById = computed(
  () => new Map(acupointList.value.map((acupoint) => [acupoint.id, acupoint])),
)
function meridianName(id: string) {
  return meridiansById.value.get(id)?.name ?? id
}

const bodyRef = ref<{
  setView: (view: 'front' | 'back' | 'left' | 'right' | 'threeQuarter') => void
  resetView: () => void
  focusPoint: (id: string) => void
  toggleAutoRotate: () => boolean
} | null>(null)

const routeId = computed(() => String(route.params.id || 'all'))
const allPoints = computed(() => acupointList.value)
const activeMeridian = computed<Meridian | null>(() =>
  routeId.value === 'all' ? null : meridiansById.value.get(routeId.value) ?? null,
)
const invalidMeridian = computed(() => routeId.value !== 'all' && !activeMeridian.value)

const region = ref<Region | ''>('')
const typeFilter = ref('')
const query = ref('')
const labelMode = ref<'auto' | 'all' | 'selected'>('auto')
const showThrough = ref(true)
const autoRotating = ref(false)

const selectedPointId = computed(() => {
  const id = route.query.point
  return typeof id === 'string' ? id : null
})

const selectedPoint = computed<Acupoint | null>(() =>
  selectedPointId.value ? acupointsById.value.get(selectedPointId.value) ?? null : null,
)

const selectedMeridian = computed<Meridian | null>(() =>
  selectedPoint.value ? meridiansById.value.get(selectedPoint.value.meridianId) ?? null : null,
)

const typeKeys = computed(() => {
  const set = new Set<string>()
  for (const p of allPoints.value) for (const t of p.pointTypes) set.add(typeKey(t.label))
  return [...set]
})

function typeKey(label: string) {
  if (label.startsWith('八会穴')) return '八会穴'
  if (label.startsWith('八脉交会穴')) return '八脉交会穴'
  if (label.startsWith('交会穴')) return '交会穴'
  return label
}

const visiblePoints = computed(() => {
  let points = allPoints.value
  if (activeMeridian.value) {
    const m = activeMeridian.value
    points = points.filter((p) =>
      m.hasOwnPoints ? p.meridianId === m.id : p.extraordinaryConnections.some((c) => c.vesselId === m.id),
    )
  }
  if (region.value) points = points.filter((p) => p.region === region.value)
  if (typeFilter.value) {
    points = points.filter((p) => p.pointTypes.some((t) => typeKey(t.label) === typeFilter.value))
  }
  const q = query.value.trim().toLowerCase()
  if (q) {
    points = points.filter((p) =>
      [p.name, p.pinyin, p.id, p.annotation, ...p.pointTypes.map((t) => t.label)]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }
  return points
})

const visibleIds = computed(() => visiblePoints.value.map((p) => p.id))

const regionGroups = computed(() => {
  const order: Region[] = ['head-neck', 'trunk', 'upper-limb', 'lower-limb']
  return order
    .map((r) => ({
      region: r,
      label: REGION_LABELS[r],
      points: visiblePoints.value
        .filter((p) => p.region === r)
        .sort((a, b) => {
          if (a.region !== 'trunk' && a.region !== 'head-neck') {
            return (a.orderFromDistal ?? 99) - (b.orderFromDistal ?? 99)
          }
          return a.id.localeCompare(b.id)
        }),
    }))
    .filter((g) => g.points.length > 0)
})

const regionCounts = computed(() => {
  const order: Region[] = ['head-neck', 'trunk', 'upper-limb', 'lower-limb']
  return order.map((r) => ({
    region: r,
    label: REGION_LABELS[r],
    count: visiblePoints.value.filter((p) => p.region === r).length,
  }))
})

const activeDescription = computed(() =>
  activeMeridian.value ? activeMeridian.value.description : null,
)

const TUTORIAL_MERIDIAN_IDS = new Set([
  'ren',
  'du',
  'lung',
  'large-intestine',
  'stomach',
  'spleen',
  'heart',
  'small-intestine',
  'bladder',
  'kidney',
  'pericardium',
  'triple-burner',
  'gallbladder',
  'liver',
])

const tutorialSectionId = computed(() =>
  TUTORIAL_MERIDIAN_IDS.has(routeId.value) ? routeId.value : '',
)

const armRail = computed(() => {
  if (activeMeridian.value?.id !== 'lung') return []
  return visiblePoints.value
    .filter((p) => p.region === 'upper-limb')
    .sort((a, b) => (a.orderFromDistal ?? 99) - (b.orderFromDistal ?? 99))
})

const meridianOptions = computed(() => {
  const regular = meridianList.value.filter((m) => m.category === 'regular')
  const extra = meridianList.value.filter((m) => m.category === 'extraordinary')
  return { regular, extra }
})

const selectedPointIndex = computed(() =>
  selectedPoint.value
    ? visiblePoints.value.findIndex((p) => p.id === selectedPoint.value?.id) + 1
    : 0,
)

function setDefaultViewForMeridian(meridianId?: string | null) {
  const backView = new Set(['bladder', 'du', 'small-intestine'])
  if (!meridianId || meridianId === 'all') bodyRef.value?.setView('threeQuarter')
  else bodyRef.value?.setView(backView.has(meridianId) ? 'back' : 'front')
}

function selectPoint(id: string, focus = true) {
  router.replace({ query: { ...route.query, point: id } })
  if (focus) bodyRef.value?.focusPoint(id)
}

function closePanel() {
  const nextQuery = { ...route.query }
  delete nextQuery.point
  router.replace({ query: nextQuery })
}

function changeMeridian(value: string) {
  const nextQuery = { ...route.query }
  delete nextQuery.point
  router.push({ path: `/meridians/${value}`, query: nextQuery })
}

function resetFilters() {
  region.value = ''
  typeFilter.value = ''
  query.value = ''
}

function resetView() {
  bodyRef.value?.resetView()
}

function toggleAuto() {
  autoRotating.value = bodyRef.value?.toggleAutoRotate() ?? false
}

function view(v: 'front' | 'back' | 'left' | 'right') {
  bodyRef.value?.setView(v)
}

watch(
  () => [routeId.value, selectedPointId.value] as const,
  async ([, pointId]) => {
    if (pointId) {
      await nextTick()
      bodyRef.value?.focusPoint(pointId)
    }
  },
  { immediate: true },
)

onMounted(async () => {
  try {
    const payload = await fetchMeridianData()
    meridianList.value = payload.meridians
    acupointList.value = payload.acupoints
  } catch (err: unknown) {
    loadError.value = err instanceof Error ? err.message : '经络数据加载失败'
  } finally {
    loading.value = false
  }
  await nextTick()
  setDefaultViewForMeridian(activeMeridian.value?.id)
  if (selectedPointId.value) bodyRef.value?.focusPoint(selectedPointId.value)
})

watch(
  () => activeMeridian.value?.id,
  (id) => {
    setDefaultViewForMeridian(id)
  },
)
</script>

<template>
  <div class="page meridian-page">
    <div class="container--wide container">
      <nav class="breadcrumbs" aria-label="面包屑">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/meridians/lung">经络图</RouterLink>
        <span>/</span>
        <span>{{ activeMeridian?.name ?? '全身重点穴' }}</span>
      </nav>

      <p v-if="loading" class="paper-panel">正在加载经络数据…</p>
      <p v-else-if="loadError" class="paper-panel" role="alert">{{ loadError }}</p>

      <header class="meridian-head">
        <div>
          <p class="eyebrow">ACUPOINT ATLAS / 经络图</p>
          <h1>{{ activeMeridian?.name ?? '全身重点穴' }}</h1>
          <p class="meridian-head__lead">
            <template v-if="activeMeridian">
              {{ activeMeridian.description.text }}
            </template>
            <template v-else>
              {{ allPoints.length }} 个常用重点穴，覆盖头颈、躯干、四肢；按经络、区域、穴位类型筛选。
              3D 只读离线坐标表，拖动旋转、滚轮缩放、点击穴位看详情。
            </template>
          </p>
          <div class="meridian-head__meta">
            <span v-if="activeMeridian" class="chip chip--jade">{{ activeMeridian.flowLabel }}</span>
            <span
              v-if="activeMeridian?.totalPoints"
              class="chip"
              :class="activeMeridian.acupointIds.length >= activeMeridian.totalPoints ? 'chip--jade' : 'chip--gold'"
            >
              收录 {{ activeMeridian.acupointIds.length }} / {{ activeMeridian.totalPoints }} 穴
            </span>
            <span class="chip">{{ visiblePoints.length }} 个穴位在当前视图</span>
            <RouterLink
              v-if="tutorialSectionId"
              class="chip chip--cinnabar"
              :to="`/methods/acupuncture/tutorial/chapter-4/${tutorialSectionId}`"
            >
              倪海厦针灸教程
            </RouterLink>
            <CitationBadge
              v-if="activeDescription"
              :citation-ids="activeDescription.citationIds"
              :locator="activeDescription.locator"
              label="经络出处"
              compact
            />
            <span v-else class="chip chip--gold">离线坐标 · 只读数据</span>
          </div>
        </div>
        <label class="meridian-select">
          <span>切换经络</span>
          <select :value="routeId" @change="changeMeridian(($event.target as HTMLSelectElement).value)">
            <option value="all">全身重点穴</option>
            <optgroup label="十二正经">
              <option v-for="m in meridianOptions.regular" :key="m.id" :value="m.id">{{ m.name }}</option>
            </optgroup>
            <optgroup label="奇经八脉">
              <option v-for="m in meridianOptions.extra" :key="m.id" :value="m.id">
                {{ m.name }}{{ m.hasOwnPoints ? '' : ' · 八脉交会' }}
              </option>
            </optgroup>
          </select>
        </label>
      </header>

      <div v-if="invalidMeridian" class="empty-state paper-panel">
        <h2>没有这条经络</h2>
        <p>链接里的经络 id 可能不正确。</p>
        <RouterLink class="btn btn--primary" to="/meridians/all">返回全身重点穴</RouterLink>
      </div>

      <template v-else>
        <section class="meridian-filters paper-panel" aria-label="穴位筛选">
          <label class="filter-search">
            <span aria-hidden="true">⌕</span>
            <input v-model="query" type="search" placeholder="搜索穴名、拼音、类型…" />
          </label>
          <div class="filter-chips" role="group" aria-label="区域">
            <button class="chip" :class="{ 'chip--cinnabar': !region }" type="button" @click="region = ''">
              全部区域
            </button>
            <button
              v-for="r in regionCounts"
              :key="r.region"
              class="chip"
              :class="{ 'chip--cinnabar': region === r.region }"
              type="button"
              :disabled="r.count === 0"
              @click="region = region === r.region ? '' : r.region"
            >
              {{ r.label }} {{ r.count }}
            </button>
          </div>
          <label class="filter-select">
            <span>类型</span>
            <select v-model="typeFilter">
              <option value="">全部</option>
              <option v-for="t in typeKeys" :key="t" :value="t">{{ t }}</option>
            </select>
          </label>
          <button v-if="region || typeFilter || query" class="btn btn--ghost btn--small" type="button" @click="resetFilters">
            清除
          </button>
        </section>

        <div v-if="armRail.length" class="arm-rail paper-panel">
          <span class="arm-rail__label">上肢 · 末端 → 肘部</span>
          <button
            v-for="p in armRail"
            :key="p.id"
            type="button"
            class="arm-rail__point"
            :class="{ 'arm-rail__point--active': selectedPointId === p.id }"
            @click="selectPoint(p.id)"
          >
            <span>{{ p.orderFromDistal }}</span>
            <strong>{{ p.name }}</strong>
            <small>{{ p.annotation }}</small>
          </button>
          <span class="arm-rail__note">经络走向仍按《灵枢》从胸走手；此处仅按穴位位置排序。</span>
        </div>

        <div class="meridian-layout">
          <aside class="point-sidebar" aria-label="穴位列表">
            <div class="point-sidebar__head">
              <div>
                <span class="eyebrow">POINTS</span>
                <h2>穴位目录</h2>
              </div>
              <span>{{ visiblePoints.length }} / {{ activeMeridian?.acupointIds.length ?? allPoints.length }}</span>
            </div>

            <div v-if="visiblePoints.length" class="point-groups">
              <section v-for="group in regionGroups" :key="group.region" class="point-group">
                <h3>{{ group.label }} <span>{{ group.points.length }}</span></h3>
                <button
                  v-for="p in group.points"
                  :key="p.id"
                  type="button"
                  class="point-row"
                  :class="{ 'point-row--active': selectedPointId === p.id }"
                  @click="selectPoint(p.id)"
                >
                  <span class="point-row__id">{{ p.id }}</span>
                  <span class="point-row__main">
                    <strong>{{ p.name }}</strong>
                    <small>{{ p.annotation }}</small>
                  </span>
                  <span class="point-row__meridian">{{ meridianName(p.meridianId) }}</span>
                </button>
              </section>
            </div>
            <p v-else class="empty-inline">没有符合筛选的穴位。</p>

            <div v-if="activeMeridian" class="sidebar-note">
              <span class="eyebrow">MERIDIAN NOTE</span>
              <p>{{ activeMeridian.description.text }}</p>
              <CitationBadge :citation-ids="activeMeridian.description.citationIds" label="出处" compact />
              <p
                v-if="activeMeridian.totalPoints && activeMeridian.acupointIds.length < activeMeridian.totalPoints"
                class="sidebar-note__pending"
              >
                标准共 {{ activeMeridian.totalPoints }} 穴，当前展示 {{ activeMeridian.acupointIds.length }} 穴；其余穴位待逐条补入。
              </p>
            </div>
          </aside>

          <section class="meridian-stage">
            <HumanBody
              ref="bodyRef"
              :all-acupoints="allPoints"
              :visible-ids="visibleIds"
              :active-meridian="activeMeridian"
              :selected-id="selectedPointId"
              :label-mode="labelMode"
              :show-through="showThrough"
              @select="selectPoint"
            />

            <div class="stage-top">
              <div class="stage-title">
                <span class="eyebrow">{{ activeMeridian ? activeMeridian.abbr : 'ALL POINTS' }}</span>
                <strong>{{ activeMeridian?.name ?? '全身重点穴' }}</strong>
                <small v-if="activeMeridian">{{ activeMeridian.flowLabel }}</small>
              </div>
              <div class="stage-controls">
                <button type="button" title="正面" @click="view('front')">正</button>
                <button type="button" title="背面" @click="view('back')">背</button>
                <button type="button" title="左侧" @click="view('left')">左</button>
                <button type="button" title="右侧" @click="view('right')">右</button>
                <span class="stage-controls__sep"></span>
                <button type="button" title="重置视角" @click="resetView">↺</button>
                <button
                  type="button"
                  :class="{ 'stage-control--active': autoRotating }"
                  title="360° 自动展示"
                  @click="toggleAuto"
                >
                  360°
                </button>
              </div>
            </div>

            <div class="stage-bottom">
              <div class="stage-options">
                <label class="switch">
                  <input v-model="showThrough" type="checkbox" />
                  <span>透视穴位</span>
                </label>
                <label class="switch">
                  <span>标签</span>
                  <select v-model="labelMode">
                    <option value="auto">自动</option>
                    <option value="all">全部</option>
                    <option value="selected">仅选中</option>
                  </select>
                </label>
              </div>
              <div class="stage-legend">
                <span v-for="t in ['原穴', '募穴', '会穴', '输穴', '络穴', '郄穴', '母穴', '子穴']" :key="t">
                  {{ t }}
                </span>
              </div>
            </div>
          </section>

          <div v-if="selectedPoint" class="panel-scrim" aria-hidden="true" @click="closePanel"></div>

          <aside class="point-panel" :class="{ 'point-panel--open': !!selectedPoint }">
            <template v-if="selectedPoint">
              <header class="point-panel__head">
                <div>
                  <span class="eyebrow">{{ selectedPoint.id }} · {{ REGION_LABELS[selectedPoint.region] }}</span>
                  <h2>{{ selectedPoint.name }}</h2>
                  <p>{{ selectedPoint.pinyin }}</p>
                </div>
                <button class="icon-btn" type="button" aria-label="关闭穴位详情" @click="closePanel">×</button>
              </header>

              <div class="point-panel__body">
                <div class="point-meta">
                  <RouterLink class="chip chip--jade" :to="`/meridians/${selectedPoint.meridianId}`">
                    {{ meridianName(selectedPoint.meridianId) }} →
                  </RouterLink>
                  <span v-for="t in selectedPoint.pointTypes" :key="t.label" class="chip chip--cinnabar">
                    {{ t.label }}
                  </span>
                </div>

                <section class="panel-section">
                  <h3>定位</h3>
                  <SourcedText :claim="selectedPoint.location" block />
                </section>

                <section class="panel-section">
                  <h3>主治</h3>
                  <SourcedText :claim="selectedPoint.indications" block />
                </section>

                <section class="panel-section">
                  <h3>针刺</h3>
                  <SourcedText :claim="selectedPoint.needle" block />
                </section>

                <section class="panel-section">
                  <h3>艾灸</h3>
                  <SourcedText :claim="selectedPoint.moxa" block />
                </section>

                <section v-if="selectedPoint.extraordinaryConnections.length" class="panel-section">
                  <h3>通奇经</h3>
                  <div class="connection-list">
                    <RouterLink
                      v-for="c in selectedPoint.extraordinaryConnections"
                      :key="c.vesselId"
                      class="connection-chip"
                      :to="`/meridians/${c.vesselId}`"
                    >
                      <span>{{ c.label }}</span>
                      <CitationBadge :citation-ids="c.citationIds" label="出处" compact />
                    </RouterLink>
                  </div>
                </section>

                <section class="panel-section">
                  <h3>穴位类型</h3>
                  <div class="point-type-list">
                    <div v-for="t in selectedPoint.pointTypes" :key="t.label" class="point-type">
                      <strong>{{ t.label }}</strong>
                      <span v-if="t.note">{{ t.note }}</span>
                      <CitationBadge :citation-ids="t.citationIds" label="出处" compact />
                    </div>
                  </div>
                </section>

                <p v-if="selectedPoint.safety" class="safety-note">{{ selectedPoint.safety }}</p>
                <p class="panel-disclaimer">仅供学习，不构成诊疗建议；针刺、艾灸须由执业中医师操作。</p>
              </div>

              <footer class="point-panel__foot">
                <span>{{ selectedPointIndex }} / {{ visiblePoints.length }}</span>
                <button
                  v-if="visiblePoints.length > 1"
                  class="btn btn--ghost btn--small"
                  type="button"
                  @click="selectPoint(visiblePoints[(selectedPointIndex % visiblePoints.length)]!.id)"
                >
                  下一个穴位 →
                </button>
              </footer>
            </template>

            <template v-else>
              <div class="panel-empty">
                <div class="panel-empty__seal">穴</div>
                <p class="eyebrow">SELECT A POINT</p>
                <h2>点一个穴位</h2>
                <p>
                  点击 3D 上的发光点，或左侧目录里的穴位，查看定位、主治、针刺、艾灸与出处。
                </p>
                <div class="panel-empty__hints">
                  <span>拖动旋转</span>
                  <span>滚轮缩放</span>
                  <span>透视可看背面穴位</span>
                </div>
              </div>
            </template>
          </aside>
        </div>

        <p class="model-disclaimer">
          3D 模型为针灸铜人风格人体：青色腰布与头巾、裸露上身、无性器官细节，仅用于经络穴位学习；穴位坐标来自离线坐标表，运行时不做人体表面映射。
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.breadcrumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 18px 0 20px;
  color: var(--ink-faint);
  font-size: 0.76rem;
}

.breadcrumbs a:hover {
  color: var(--cinnabar);
}

.meridian-head {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  align-items: flex-end;
  padding-bottom: 22px;
}

.meridian-head h1 {
  margin: 4px 0 8px;
  font-size: clamp(2.2rem, 4.5vw, 3.8rem);
  letter-spacing: 0.06em;
}

.meridian-head__lead {
  max-width: 760px;
  color: var(--ink-soft);
  font-size: 0.88rem;
  line-height: 1.8;
}

.meridian-head__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-top: 10px;
}

.meridian-select {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 220px;
  color: var(--ink-faint);
  font-size: 0.7rem;
}

.meridian-select select {
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  background: rgba(255, 252, 245, 0.7);
  color: var(--ink);
  cursor: pointer;
}

.meridian-filters {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  padding: 10px 12px;
  margin-bottom: 12px;
}

.filter-search {
  flex: 1 1 220px;
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 38px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.42);
  color: var(--ink-faint);
}

.filter-search input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--ink);
}

.filter-chips {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.filter-chips .chip {
  cursor: pointer;
}

.filter-chips .chip:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.filter-select {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 38px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--ink-soft);
  font-size: 0.76rem;
}

.filter-select select {
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
}

.arm-rail {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 12px;
  margin-bottom: 12px;
}

.arm-rail__label {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.78rem;
  white-space: nowrap;
}

.arm-rail__point {
  display: inline-flex;
  align-items: baseline;
  gap: 5px;
  padding: 4px 8px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  font-size: 0.72rem;
}

.arm-rail__point > span {
  color: var(--cinnabar);
  font-size: 0.62rem;
}

.arm-rail__point strong {
  font-family: var(--serif);
  font-size: 0.82rem;
}

.arm-rail__point small {
  color: var(--ink-faint);
  font-size: 0.62rem;
}

.arm-rail__point--active {
  border-color: var(--cinnabar);
  background: var(--cinnabar-pale);
}

.arm-rail__note {
  margin-left: auto;
  color: var(--ink-faint);
  font-size: 0.64rem;
}

.meridian-layout {
  display: grid;
  grid-template-columns: 276px minmax(0, 1fr) 360px;
  gap: 12px;
  align-items: stretch;
  min-height: 660px;
}

.point-sidebar,
.point-panel {
  border: 1px solid var(--line);
  border-radius: 16px;
  background: rgba(255, 252, 245, 0.55);
  overflow: hidden;
}

.point-sidebar {
  display: flex;
  flex-direction: column;
  max-height: 760px;
}

.point-sidebar__head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: baseline;
  padding: 14px 14px 10px;
  border-bottom: 1px solid var(--line);
}

.point-sidebar__head h2 {
  margin-top: 2px;
  font-size: 1.05rem;
}

.point-sidebar__head > span {
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.point-groups {
  overflow: auto;
  padding: 6px 8px 12px;
}

.point-group {
  padding-top: 10px;
}

.point-group h3 {
  padding: 0 7px 5px;
  color: var(--ink-faint);
  font-family: var(--sans);
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.08em;
}

.point-group h3 span {
  color: var(--cinnabar);
}

.point-row {
  width: 100%;
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  gap: 7px;
  align-items: center;
  padding: 7px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.point-row:hover {
  background: rgba(255, 255, 255, 0.5);
}

.point-row--active {
  border-color: rgba(163, 58, 43, 0.28);
  background: var(--cinnabar-pale);
}

.point-row__id {
  color: var(--cinnabar);
  font-size: 0.62rem;
  letter-spacing: 0.04em;
}

.point-row__main {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.point-row__main strong {
  font-family: var(--serif);
  font-size: 0.92rem;
}

.point-row__main small {
  color: var(--ink-faint);
  font-size: 0.6rem;
}

.point-row__meridian {
  max-width: 66px;
  color: var(--ink-faint);
  font-size: 0.58rem;
  text-align: right;
  line-height: 1.3;
}

.sidebar-note {
  margin-top: auto;
  padding: 12px 14px;
  border-top: 1px solid var(--line);
  background: rgba(235, 226, 210, 0.28);
}

.sidebar-note p {
  margin: 5px 0 7px;
  color: var(--ink-soft);
  font-size: 0.7rem;
  line-height: 1.7;
}

.sidebar-note__pending {
  margin-top: 8px !important;
  padding-top: 7px;
  border-top: 1px dashed var(--line);
  color: var(--cinnabar) !important;
  font-size: 0.66rem !important;
}

.meridian-stage {
  position: relative;
  min-height: 660px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background:
    radial-gradient(circle at 50% 42%, rgba(255, 246, 226, 0.9), rgba(235, 226, 210, 0.3) 48%, rgba(244, 239, 228, 0.05) 72%),
    var(--paper);
  overflow: hidden;
}

.stage-top {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  z-index: 4;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  pointer-events: none;
}

.stage-title {
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: rgba(244, 239, 228, 0.74);
  backdrop-filter: blur(5px);
}

.stage-title strong {
  font-family: var(--serif);
  font-size: 0.96rem;
}

.stage-title small {
  color: var(--ink-faint);
  font-size: 0.66rem;
}

.stage-controls {
  display: flex;
  gap: 3px;
  padding: 4px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: rgba(244, 239, 228, 0.74);
  backdrop-filter: blur(5px);
  pointer-events: auto;
}

.stage-controls button {
  min-width: 32px;
  height: 28px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--ink-soft);
  cursor: pointer;
  font-size: 0.7rem;
}

.stage-controls button:hover {
  border-color: var(--line);
  background: rgba(255, 255, 255, 0.55);
  color: var(--cinnabar);
}

.stage-control--active {
  background: var(--cinnabar-pale) !important;
  color: var(--cinnabar) !important;
}

.stage-controls__sep {
  width: 1px;
  margin: 4px 2px;
  background: var(--line);
}

.stage-bottom {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 10px;
  z-index: 4;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-end;
  pointer-events: none;
}

.stage-options {
  display: flex;
  gap: 10px;
  padding: 6px 10px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: rgba(244, 239, 228, 0.74);
  backdrop-filter: blur(5px);
  pointer-events: auto;
}

.switch {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--ink-soft);
  font-size: 0.66rem;
}

.switch input {
  accent-color: var(--cinnabar);
}

.switch select {
  border: 0;
  background: transparent;
  color: var(--ink);
  font-size: 0.66rem;
}

.stage-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 3px 8px;
  max-width: 45%;
  padding: 6px 9px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: rgba(244, 239, 228, 0.68);
  color: var(--ink-faint);
  font-size: 0.6rem;
  pointer-events: auto;
}

.point-panel {
  display: flex;
  flex-direction: column;
  max-height: 760px;
}

.panel-scrim {
  display: none;
}

.point-panel__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--line);
}

.point-panel__head h2 {
  margin: 2px 0 0;
  font-size: 1.7rem;
}

.point-panel__head p {
  color: var(--ink-faint);
  font-family: var(--serif);
  font-size: 0.72rem;
  letter-spacing: 0.06em;
}

.point-panel__body {
  flex: 1;
  overflow: auto;
  padding: 12px 16px 18px;
}

.point-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 12px;
}

.panel-section {
  padding: 11px 0;
  border-top: 1px solid var(--line);
}

.panel-section:first-of-type {
  border-top: 0;
}

.panel-section h3 {
  margin-bottom: 4px;
  color: var(--ink);
  font-size: 0.92rem;
}

.panel-section :deep(.sourced-text__content) {
  color: var(--ink-soft);
  font-size: 0.78rem;
  line-height: 1.8;
}

.connection-list {
  display: grid;
  gap: 5px;
}

.connection-chip {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  padding: 5px 8px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.38);
  font-size: 0.74rem;
}

.connection-chip:hover {
  border-color: var(--cinnabar);
}

.point-type-list {
  display: grid;
  gap: 5px;
}

.point-type {
  padding: 6px 8px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.34);
}

.point-type strong {
  display: block;
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.8rem;
}

.point-type span {
  display: block;
  color: var(--ink-faint);
  font-size: 0.66rem;
}

.safety-note {
  margin-top: 10px;
  padding: 8px 10px;
  border-left: 2px solid var(--cinnabar-2);
  background: var(--cinnabar-pale);
  color: #7c3b30;
  font-size: 0.7rem;
  line-height: 1.7;
}

.panel-disclaimer {
  margin-top: 12px;
  color: var(--ink-faint);
  font-size: 0.66rem;
  line-height: 1.6;
}

.point-panel__foot {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  padding: 9px 16px;
  border-top: 1px solid var(--line);
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.panel-empty {
  padding: 40px 24px;
  text-align: center;
  color: var(--ink-soft);
}

.panel-empty__seal {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  display: grid;
  place-items: center;
  border-radius: 48% 52% 46% 54%;
  background: var(--cinnabar);
  color: var(--paper);
  font-family: var(--serif);
  font-size: 1.4rem;
}

.panel-empty h2 {
  margin: 3px 0 8px;
  font-size: 1.4rem;
}

.panel-empty p {
  font-size: 0.8rem;
  line-height: 1.8;
}

.panel-empty__hints {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 5px;
  margin-top: 16px;
}

.panel-empty__hints span {
  padding: 3px 8px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--ink-faint);
  font-size: 0.64rem;
}

.model-disclaimer {
  margin-top: 12px;
  color: var(--ink-faint);
  font-size: 0.68rem;
  line-height: 1.7;
}

.empty-inline {
  padding: 16px;
  color: var(--ink-soft);
  font-size: 0.78rem;
}

@media (max-width: 1220px) {
  .meridian-layout {
    grid-template-columns: 240px minmax(0, 1fr) 330px;
  }
}

@media (max-width: 1040px) {
  .meridian-layout {
    grid-template-columns: 240px minmax(0, 1fr);
    min-height: 0;
  }

  .point-panel {
    grid-column: 1 / -1;
    max-height: none;
  }

  .point-panel__body {
    max-height: 420px;
  }
}

@media (max-width: 760px) {
  .meridian-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .meridian-select {
    width: 100%;
  }

  .meridian-layout {
    grid-template-columns: 1fr;
  }

  .point-sidebar {
    max-height: 300px;
    order: 2;
  }

  .meridian-stage {
    min-height: 470px;
    order: 1;
  }

  .point-panel {
    order: 3;
  }

  .panel-scrim {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 70;
    background: rgba(20, 24, 22, 0.28);
    backdrop-filter: blur(2px);
  }

  .point-panel--open {
    position: fixed;
    left: 8px;
    right: 8px;
    bottom: 8px;
    z-index: 80;
    max-height: 72vh;
    border-radius: 18px;
    background: var(--paper);
    box-shadow: 0 24px 70px rgba(20, 24, 22, 0.28);
  }

  .point-panel--open .point-panel__body {
    max-height: none;
  }

  .arm-rail__note,
  .stage-legend {
    display: none;
  }

  .stage-bottom {
    align-items: flex-start;
  }

  .stage-options {
    flex-wrap: wrap;
  }
}
</style>
