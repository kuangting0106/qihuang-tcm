<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { Acupoint, Meridian } from '@/types/tcm'
import { createBody } from '@/three/createBody'
import { createHumanModel } from '@/three/bodyGeometry'

const props = withDefaults(
  defineProps<{
    allAcupoints: Acupoint[]
    visibleIds: string[]
    activeMeridian?: Meridian | null
    selectedId?: string | null
    labelMode?: 'auto' | 'all' | 'selected'
    showThrough?: boolean
  }>(),
  {
    activeMeridian: null,
    selectedId: null,
    labelMode: 'auto',
    showThrough: true,
  },
)

const emit = defineEmits<{
  select: [id: string]
  hover: [id: string | null]
}>()

const host = ref<HTMLDivElement | null>(null)
const labelLayer = ref<HTMLDivElement | null>(null)
const labelLines = ref<SVGSVGElement | null>(null)
const webglError = ref('')
const modelLoading = ref(true)
const hoverId = ref<string | null>(null)

const visibleSet = computed(() => new Set(props.visibleIds))
const autoLabelIds = computed(() => new Set(props.activeMeridian?.acupointIds ?? []))

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let controls: OrbitControls | null = null
let bodyGroup: THREE.Group | null = null
let bodyDispose: (() => void) | null = null
let pathGroup: THREE.Group | null = null
let raf = 0
let resizeObserver: ResizeObserver | null = null
let clock: THREE.Clock | null = null
let disposed = false

const markers = new Map<string, THREE.Mesh>()
const labels = new Map<string, HTMLButtonElement>()
const labelLinesMap = new Map<string, SVGLineElement>()
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
let pointerDownAt: { x: number; y: number } | null = null
let cameraTween: number | null = null

const labelOffsets: Record<string, [number, number]> = {
  LU1: [42, -24],
  LU5: [82, -96],
  LU6: [124, -34],
  LU7: [152, 18],
  LU9: [164, 78],
  LI4: [-24, 12],
  HT7: [-28, -8],
  SI3: [-24, 16],
  PC6: [-24, -18],
  SJ5: [-24, 18],
  SP4: [-22, 16],
  LR3: [-24, 12],
  KI3: [-24, -6],
  BL62: [22, 16],
  KI6: [-22, 18],
  GB41: [22, 12],
  ST25: [24, -6],
  ST36: [24, -8],
  SP6: [-26, -6],
  GB34: [24, -8],
  GB39: [24, 0],
  BL17: [24, -8],
  BL11: [24, -10],
  LR13: [24, 0],
  REN17: [22, -14],
  REN12: [22, -6],
  REN4: [22, -6],
  DU20: [20, -20],
  DU14: [22, -12],
  GB20: [24, -6],
}

function setPointer(event: PointerEvent) {
  if (!renderer || !camera) return
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera(pointer, camera)
}

function pickMarker(event: PointerEvent): string | null {
  setPointer(event)
  const hits = raycaster.intersectObjects([...markers.values()], false)
  const hit = hits.find((h) => h.object.visible)
  return (hit?.object.userData.pointId as string | undefined) ?? null
}

function updateLabels() {
  if (!camera || !host.value) return
  const width = host.value.clientWidth
  const height = host.value.clientHeight
  const offsetScale = Math.min(1, width / 700)
  const projected = new THREE.Vector3()

  for (const p of props.allAcupoints) {
    const btn = labels.get(p.id)
    const line = labelLinesMap.get(p.id)
    if (!btn || !line) continue

    const visible = visibleSet.value.has(p.id)
    const active = props.selectedId === p.id || hoverId.value === p.id
    let show = visible && active
    if (visible && props.labelMode === 'all') show = true
    else if (visible && props.labelMode === 'auto') {
      if (props.visibleIds.length <= 12) show = true
      else if (autoLabelIds.value.has(p.id)) show = true
    }

    if (!show) {
      btn.style.display = 'none'
      line.style.display = 'none'
      continue
    }

    const marker = markers.get(p.id)
    if (!marker) {
      btn.style.display = 'none'
      line.style.display = 'none'
      continue
    }

    marker.getWorldPosition(projected).project(camera)
    if (projected.z < -1 || projected.z > 1) {
      btn.style.display = 'none'
      line.style.display = 'none'
      continue
    }

    const sx = (projected.x * 0.5 + 0.5) * width
    const sy = (-projected.y * 0.5 + 0.5) * height
    const [dx0, dy0] = labelOffsets[p.id] ?? [34, -18]
    const dx = dx0 * offsetScale
    const dy = dy0 * offsetScale
    const isRight = dx >= 0
    const labelWidth = btn.offsetWidth || 70
    let lx = sx + dx
    let ly = sy + dy
    lx = isRight
      ? Math.min(width - labelWidth - 10, Math.max(8, lx))
      : Math.max(labelWidth + 10, Math.min(width - 8, lx))
    ly = Math.min(height - 16, Math.max(18, ly))

    btn.style.display = ''
    btn.classList.toggle('point-label--left', !isRight)
    btn.classList.toggle('point-label--right', isRight)
    btn.classList.toggle('point-label--selected', props.selectedId === p.id)
    btn.classList.toggle('point-label--hover', hoverId.value === p.id)
    btn.style.left = `${lx}px`
    btn.style.top = `${ly}px`

    line.style.display = ''
    line.setAttribute('x1', sx.toFixed(1))
    line.setAttribute('y1', sy.toFixed(1))
    line.setAttribute('x2', (isRight ? lx - 3 : lx + 3).toFixed(1))
    line.setAttribute('y2', ly.toFixed(1))
    line.classList.toggle('label-line--selected', props.selectedId === p.id)
  }
}

function updateMarkers() {
  for (const [id, marker] of markers) {
    const visible = visibleSet.value.has(id)
    marker.visible = visible
    const markerGroup = marker.userData.group as THREE.Group | undefined
    if (markerGroup) markerGroup.visible = visible
    const selected = props.selectedId === id
    const hovered = hoverId.value === id
    marker.scale.setScalar(selected ? 1.65 : hovered ? 1.35 : 1)
    const mat = marker.material as THREE.MeshStandardMaterial
    if (mat) {
      mat.emissiveIntensity = selected ? 1.7 : hovered ? 1.3 : 0.9
      mat.color.set(selected ? 0xd65335 : hovered ? 0xd96b4e : 0xb23a2a)
    }
    const halo = marker.userData.halo as THREE.Sprite | undefined
    if (halo) {
      halo.material.opacity = selected ? 0.9 : hovered ? 0.72 : 0.48
      halo.scale.setScalar(selected ? 0.12 : 0.085)
    }
  }
  updateLabels()
}

function setThrough() {
  const depthTest = !props.showThrough
  for (const marker of markers.values()) {
    const mat = marker.material as THREE.MeshStandardMaterial
    mat.depthTest = depthTest
    mat.needsUpdate = true
    const halo = marker.userData.halo as THREE.Sprite | undefined
    if (halo) {
      halo.material.depthTest = depthTest
      halo.material.needsUpdate = true
    }
  }
  if (pathGroup) {
    pathGroup.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      const mat = mesh.material as THREE.Material | undefined
      if (mat && 'depthTest' in mat) {
        ;(mat as THREE.MeshStandardMaterial).depthTest = depthTest
        mat.needsUpdate = true
      }
    })
  }
}

function haloTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const gradient = ctx.createRadialGradient(64, 64, 4, 64, 64, 62)
    gradient.addColorStop(0, 'rgba(255, 225, 160, 0.95)')
    gradient.addColorStop(0.25, 'rgba(224, 170, 80, 0.55)')
    gradient.addColorStop(1, 'rgba(224, 170, 80, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 128, 128)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createMarkers() {
  if (!scene || !bodyGroup) return
  const markerGeometry = new THREE.SphereGeometry(0.014, 14, 10)
  const texture = haloTexture()

  for (const p of props.allAcupoints) {
    const group = new THREE.Group()
    group.position.set(...p.coordinates)

    const material = new THREE.MeshStandardMaterial({
      color: 0xb23a2a,
      emissive: 0x5a1c12,
      emissiveIntensity: 0.9,
      roughness: 0.3,
      metalness: 0.32,
      transparent: true,
      opacity: 0.98,
    })
    const marker = new THREE.Mesh(markerGeometry, material)
    marker.userData.pointId = p.id
    group.add(marker)

    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture,
        color: 0xd55a3a,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    )
    halo.scale.setScalar(0.085)
    group.add(halo)
    marker.userData.halo = halo
    marker.userData.group = group

    bodyGroup.add(group)
    markers.set(p.id, marker)

    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'point-label'
    btn.dataset.pointId = p.id
    const name = document.createElement('strong')
    name.textContent = p.name
    const tag = document.createElement('span')
    tag.textContent = p.annotation
    btn.append(name, tag)
    btn.addEventListener('click', (event) => {
      event.stopPropagation()
      emit('select', p.id)
    })
    btn.addEventListener('pointerenter', () => {
      hoverId.value = p.id
      emit('hover', p.id)
      updateMarkers()
    })
    btn.addEventListener('pointerleave', () => {
      if (hoverId.value === p.id) {
        hoverId.value = null
        emit('hover', null)
        updateMarkers()
      }
    })
    labelLayer.value?.appendChild(btn)
    labels.set(p.id, btn)

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line.setAttribute('class', 'label-line')
    labelLines.value?.appendChild(line)
    labelLinesMap.set(p.id, line)
  }
  setThrough()
  updateMarkers()
}

function clearPath() {
  if (!pathGroup || !bodyGroup) return
  bodyGroup.remove(pathGroup)
  pathGroup.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    mesh.geometry?.dispose()
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
    else mat?.dispose()
  })
  pathGroup = null
}

function buildPath(meridian: Meridian | null | undefined) {
  if (!bodyGroup) return
  clearPath()
  if (!meridian?.path || meridian.path.length < 2) return
  const points = meridian.path.map((p) => new THREE.Vector3(...p))
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.35)
  const geometry = new THREE.TubeGeometry(curve, 80, 0.0055, 6, false)
  const material = new THREE.MeshStandardMaterial({
    color: 0xb23a2a,
    emissive: 0x5a1c12,
    emissiveIntensity: 1.1,
    roughness: 0.3,
    metalness: 0.3,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  })
  pathGroup = new THREE.Group()
  const tube = new THREE.Mesh(geometry, material)
  tube.renderOrder = 6
  pathGroup.add(tube)

  const glowGeometry = new THREE.TubeGeometry(curve, 80, 0.013, 6, false)
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xd55a3a,
    transparent: true,
    opacity: 0.1,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const glow = new THREE.Mesh(glowGeometry, glowMaterial)
  glow.renderOrder = 5
  pathGroup.add(glow)

  for (const t of [0.25, 0.5, 0.75]) {
    const point = curve.getPointAt(t)
    const tangent = curve.getTangentAt(t).normalize()
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.0075, 0.022, 8), material)
    cone.position.copy(point)
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent)
    cone.renderOrder = 6
    pathGroup.add(cone)
  }
  pathGroup.traverse((obj) => {
    obj.renderOrder = 6
    const mesh = obj as THREE.Mesh
    const mat = mesh.material as THREE.Material | undefined
    if (mat && 'depthTest' in mat) {
      ;(mat as THREE.MeshStandardMaterial).depthTest = !props.showThrough
      mat.needsUpdate = true
    }
  })
  bodyGroup.add(pathGroup)
}

function onPointerMove(event: PointerEvent) {
  if (!renderer) return
  const id = pickMarker(event)
  if (id !== hoverId.value) {
    hoverId.value = id
    emit('hover', id)
    renderer.domElement.style.cursor = id ? 'pointer' : 'grab'
    updateMarkers()
  }
}

function onPointerDown(event: PointerEvent) {
  pointerDownAt = { x: event.clientX, y: event.clientY }
}

function onPointerUp(event: PointerEvent) {
  if (!pointerDownAt) return
  const moved = Math.hypot(event.clientX - pointerDownAt.x, event.clientY - pointerDownAt.y)
  pointerDownAt = null
  if (moved > 6) return
  const id = pickMarker(event)
  if (id) emit('select', id)
}

function onPointerLeave() {
  if (hoverId.value) {
    hoverId.value = null
    emit('hover', null)
    updateMarkers()
  }
}

function animateCamera(
  position: THREE.Vector3,
  target: THREE.Vector3,
  duration = 620,
) {
  if (!camera || !controls) return
  if (cameraTween) cancelAnimationFrame(cameraTween)
  const startPos = camera.position.clone()
  const startTarget = controls.target.clone()
  const start = performance.now()
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration)
    const k = ease(t)
    camera!.position.lerpVectors(startPos, position, k)
    controls!.target.lerpVectors(startTarget, target, k)
    controls!.update()
    if (t < 1) cameraTween = requestAnimationFrame(step)
    else cameraTween = null
  }
  cameraTween = requestAnimationFrame(step)
}

const views = {
  front: { pos: new THREE.Vector3(0, 1.18, 3.3), target: new THREE.Vector3(0, 0.95, 0) },
  back: { pos: new THREE.Vector3(0, 1.18, -3.3), target: new THREE.Vector3(0, 0.95, 0) },
  left: { pos: new THREE.Vector3(-3.3, 1.18, 0), target: new THREE.Vector3(0, 0.95, 0) },
  right: { pos: new THREE.Vector3(3.3, 1.18, 0), target: new THREE.Vector3(0, 0.95, 0) },
  threeQuarter: { pos: new THREE.Vector3(1.0, 1.28, 3.15), target: new THREE.Vector3(0, 0.95, 0) },
}

function setView(view: keyof typeof views) {
  const v = views[view]
  animateCamera(v.pos.clone(), v.target.clone())
}

function resetView() {
  setView('threeQuarter')
}

function focusPoint(id: string) {
  const p = props.allAcupoints.find((x) => x.id === id)
  if (!p || !camera || !controls) return
  const target = new THREE.Vector3(...p.coordinates)
  const direction = camera.position.clone().sub(controls.target).normalize()
  const distance = p.region === 'head-neck' ? 1.0 : 1.25
  const position = target.clone().add(direction.multiplyScalar(distance))
  animateCamera(position, target, 520)
}

function toggleAutoRotate() {
  if (!controls) return false
  controls.autoRotate = !controls.autoRotate
  return controls.autoRotate
}

function attachBody(group: THREE.Group, dispose: () => void) {
  if (disposed) {
    dispose()
    return
  }
  bodyGroup = group
  bodyDispose = dispose
  scene?.add(group)
  createMarkers()
  buildPath(props.activeMeridian)
  setThrough()
  updateMarkers()
  modelLoading.value = false
}

async function loadBodyModel() {
  try {
    const model = await createHumanModel(`${import.meta.env.BASE_URL}models/makehuman-base.obj`)
    attachBody(model.group, model.dispose)
  } catch (err) {
    console.warn('MakeHuman 模型加载失败，回退到程序化人体。', err)
    try {
      const fallback = createBody()
      attachBody(fallback.group, fallback.dispose)
    } catch (fallbackError) {
      webglError.value =
        fallbackError instanceof Error ? fallbackError.message : '人体模型加载失败'
      modelLoading.value = false
    }
  }
}

function init() {
  const el = host.value
  if (!el) return
  try {
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(38, el.clientWidth / el.clientHeight, 0.01, 30)
    camera.position.copy(views.threeQuarter.pos)
    camera.lookAt(views.threeQuarter.target)

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(el.clientWidth, el.clientHeight)
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    el.appendChild(renderer.domElement)

    controls = new OrbitControls(camera, renderer.domElement)
    controls.target.copy(views.threeQuarter.target)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.enablePan = false
    controls.minDistance = 1.2
    controls.maxDistance = 5
    controls.minPolarAngle = 0.35
    controls.maxPolarAngle = 2.78
    controls.rotateSpeed = 0.55
    controls.zoomSpeed = 0.8
    controls.autoRotateSpeed = 0.7
    controls.update()

    scene.add(new THREE.HemisphereLight(0xfff7ea, 0x3a2c21, 1.25))
    const key = new THREE.DirectionalLight(0xffe8c8, 1.7)
    key.position.set(2.2, 3.2, 3.2)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x9cc8bc, 0.9)
    rim.position.set(-2.8, 1.8, -2.4)
    scene.add(rim)
    const fill = new THREE.DirectionalLight(0xffffff, 0.95)
    fill.position.set(0, 0.6, 3)
    scene.add(fill)
    const backFill = new THREE.DirectionalLight(0xffe8c8, 1.1)
    backFill.position.set(0, 2.4, -3.2)
    scene.add(backFill)

    void loadBodyModel()

    clock = new THREE.Clock()
    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (!renderer || !scene || !camera) return
      const t = clock?.getElapsedTime() ?? 0
      for (const [id, marker] of markers) {
        if (!marker.visible) continue
        const selected = props.selectedId === id
        const hovered = hoverId.value === id
        const base = selected ? 1.65 : hovered ? 1.35 : 1
        marker.scale.setScalar(base + Math.sin(t * 2.6 + id.length) * (selected ? 0.06 : 0.025))
      }
      controls?.update()
      renderer.render(scene, camera)
      updateLabels()
    }
    tick()

    resizeObserver = new ResizeObserver(() => {
      if (!el || !renderer || !camera) return
      const width = el.clientWidth
      const height = el.clientHeight
      if (!width || !height) return
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      updateLabels()
    })
    resizeObserver.observe(el)

    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointerup', onPointerUp)
    renderer.domElement.addEventListener('pointerleave', onPointerLeave)
  } catch (err) {
    webglError.value = err instanceof Error ? err.message : 'WebGL 初始化失败'
  }
}

onMounted(async () => {
  await nextTick()
  init()
})

onBeforeUnmount(() => {
  disposed = true
  cancelAnimationFrame(raf)
  if (cameraTween) cancelAnimationFrame(cameraTween)
  resizeObserver?.disconnect()
  if (renderer) {
    renderer.domElement.removeEventListener('pointermove', onPointerMove)
    renderer.domElement.removeEventListener('pointerdown', onPointerDown)
    renderer.domElement.removeEventListener('pointerup', onPointerUp)
    renderer.domElement.removeEventListener('pointerleave', onPointerLeave)
  }
  controls?.dispose()
  bodyDispose?.()
  if (renderer) {
    renderer.dispose()
    renderer.domElement.remove()
  }
  markers.clear()
  labels.clear()
  labelLinesMap.clear()
})

watch(
  () => props.visibleIds,
  () => updateMarkers(),
  { deep: true },
)
watch(
  () => props.selectedId,
  () => updateMarkers(),
)
watch(
  () => props.labelMode,
  () => updateLabels(),
)
watch(
  () => props.showThrough,
  () => setThrough(),
)
watch(
  () => props.activeMeridian?.id,
  () => buildPath(props.activeMeridian),
)

defineExpose({ setView, resetView, focusPoint, toggleAutoRotate })
</script>

<template>
  <div ref="host" class="human-body">
    <div v-if="webglError" class="webgl-fallback">
      <strong>3D 视图没有启动</strong>
      <p>{{ webglError }}</p>
      <p>你仍然可以使用左侧穴位列表查看定位、主治与出处。</p>
    </div>
    <template v-else>
      <div ref="labelLayer" class="label-layer">
        <svg ref="labelLines" class="label-lines" aria-hidden="true"></svg>
      </div>
      <div v-if="modelLoading" class="model-loading">
        <span class="seal-loader seal-loader--small">人</span>
        <span>正在展开人体图卷…</span>
      </div>
      <div class="viewer-hint">拖动旋转 · 滚轮缩放 · 点击穴位</div>
    </template>
  </div>
</template>

<style scoped>
.human-body {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 460px;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 42%, rgba(255, 246, 226, 0.9), rgba(235, 226, 210, 0.35) 48%, rgba(244, 239, 228, 0.05) 72%),
    radial-gradient(circle at 50% 100%, rgba(176, 138, 74, 0.12), transparent 45%);
}

.human-body :deep(canvas) {
  display: block;
}

.viewer-hint {
  position: absolute;
  left: 16px;
  bottom: 14px;
  z-index: 3;
  padding: 5px 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(244, 239, 228, 0.72);
  color: var(--ink-faint);
  font-size: 0.68rem;
  backdrop-filter: blur(5px);
  pointer-events: none;
}

.model-loading {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 10px;
  color: var(--ink-soft);
  font-size: 0.8rem;
  background: rgba(244, 239, 228, 0.42);
  backdrop-filter: blur(2px);
}

.seal-loader--small {
  width: 48px;
  height: 48px;
  font-size: 1.1rem;
}

.webgl-fallback {
  position: absolute;
  inset: 20px;
  display: grid;
  place-content: center;
  text-align: center;
  color: var(--ink-soft);
  border: 1px dashed var(--line-strong);
  border-radius: 16px;
  padding: 24px;
}

.webgl-fallback strong {
  font-family: var(--serif);
  color: var(--ink);
  font-size: 1.1rem;
}

.label-layer {
  position: absolute;
  inset: 0;
  z-index: 3;
  overflow: hidden;
  pointer-events: none;
}

.label-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

:global(.label-line) {
  stroke: rgba(178, 58, 42, 0.55);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

:global(.label-line--selected) {
  stroke: var(--cinnabar);
  stroke-width: 1.5;
}

:global(.point-label) {
  position: absolute;
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  padding: 0 2px;
  border: 0;
  background: transparent;
  color: #3b2b22;
  box-shadow: none;
  cursor: pointer;
  pointer-events: auto;
  font-family: var(--serif);
  font-size: 0.72rem;
  line-height: 1.45;
  white-space: nowrap;
  text-shadow: 0 1px 0 rgba(244, 239, 228, 0.92);
  transform: translate(0, -50%);
  transition: color 0.15s ease;
}

:global(.point-label--left) {
  transform: translate(-100%, -50%);
}

:global(.point-label strong) {
  font-family: var(--serif);
  font-size: 0.82rem;
  font-weight: 600;
}

:global(.point-label span) {
  color: var(--cinnabar);
  font-family: var(--sans);
  font-size: 0.56rem;
}

:global(.point-label:hover),
:global(.point-label--hover) {
  color: var(--cinnabar);
}

:global(.point-label--selected) {
  color: var(--cinnabar);
  font-weight: 700;
}

@media (max-width: 760px) {
  .human-body {
    min-height: 400px;
  }

  .viewer-hint {
    left: 10px;
    bottom: 10px;
  }
}
</style>
