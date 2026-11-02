import fs from 'node:fs'
import * as THREE from 'three'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { prepareHumanObject } from '../src/three/bodyGeometry'

type Vec3 = [number, number, number]
type RayKind = 'front' | 'back' | 'left' | 'right' | 'inside-left' | 'inside-right' | 'top'

interface Guide {
  id: string
  x: number
  y: number
  z: number
  ray: RayKind
}

const modelPath = 'public/models/makehuman-base.obj'
const obj = new OBJLoader().parse(fs.readFileSync(modelPath, 'utf8'))
const prepared = prepareHumanObject(obj)
const body = prepared.body
body.updateMatrixWorld(true)
const raycaster = new THREE.Raycaster()
const down = new THREE.Vector3(0, -1, 0)
const up = new THREE.Vector3(0, 1, 0)
const forward = new THREE.Vector3(0, 0, 1)
const backward = new THREE.Vector3(0, 0, -1)

function rayFor(kind: RayKind, x: number, y: number, z: number) {
  switch (kind) {
    case 'front':
      return { origin: new THREE.Vector3(x, y, 2.4), direction: backward.clone() }
    case 'back':
      return { origin: new THREE.Vector3(x, y, -2.4), direction: forward.clone() }
    case 'right':
      return { origin: new THREE.Vector3(2.4, y, z), direction: new THREE.Vector3(-1, 0, 0) }
    case 'left':
      return { origin: new THREE.Vector3(-2.4, y, z), direction: new THREE.Vector3(1, 0, 0) }
    case 'inside-left':
      return { origin: new THREE.Vector3(0, y, z), direction: new THREE.Vector3(1, 0, 0) }
    case 'inside-right':
      return { origin: new THREE.Vector3(0, y, z), direction: new THREE.Vector3(-1, 0, 0) }
    case 'top':
      return { origin: new THREE.Vector3(x, 2.6, z), direction: down.clone() }
  }
}

function nearestSurface(target: THREE.Vector3) {
  const pos = body.geometry.attributes.position
  let best = Infinity
  let bestPoint = target.clone()
  for (let i = 0; i < pos.count; i++) {
    const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i))
    const d = v.distanceToSquared(target)
    if (d < best) {
      best = d
      bestPoint = v
    }
  }
  return bestPoint
}

function surfaceAt(g: Guide): Vec3 {
  const { origin, direction } = rayFor(g.ray, g.x, g.y, g.z)
  raycaster.set(origin, direction)
  const hit = raycaster.intersectObject(body, false)[0]
  if (hit) {
    const normal = hit.face?.normal.clone() ?? up.clone()
    if (normal.dot(direction) > 0) normal.negate()
    const p = hit.point.clone().add(normal.multiplyScalar(0.005))
    return [round(p.x), round(p.y), round(p.z)]
  }
  console.warn(`Ray missed ${g.id}; falling back to nearest surface vertex.`)
  const p = nearestSurface(new THREE.Vector3(g.x, g.y, g.z))
  return [round(p.x), round(p.y), round(p.z)]
}

function round(n: number) {
  return Number(n.toFixed(3))
}

const guides: Guide[] = [
  // Chest / abdomen (front)
  { id: 'LU1', x: 0.14, y: 1.4, z: 0, ray: 'front' },
  { id: 'LU2', x: 0.18, y: 1.44, z: 0, ray: 'front' },
  { id: 'LU3', x: 0.26, y: 1.35, z: 0, ray: 'front' },
  { id: 'LU4', x: 0.29, y: 1.27, z: 0, ray: 'front' },
  { id: 'LU8', x: 0.46, y: 1.18, z: 0, ray: 'front' },
  { id: 'LU10', x: 0.49, y: 1.1, z: 0, ray: 'front' },
  { id: 'LU11', x: 0.515, y: 1.05, z: 0, ray: 'front' },
  { id: 'REN17', x: 0, y: 1.34, z: 0, ray: 'front' },
  { id: 'REN12', x: 0, y: 1.16, z: 0, ray: 'front' },
  { id: 'REN4', x: 0, y: 0.96, z: 0, ray: 'front' },
  { id: 'ST25', x: 0.07, y: 1.1, z: 0, ray: 'front' },
  { id: 'LR13', x: 0.2, y: 1.12, z: -0.02, ray: 'right' },
  // Back
  { id: 'BL17', x: 0.06, y: 1.28, z: 0, ray: 'back' },
  { id: 'BL11', x: 0.06, y: 1.43, z: 0, ray: 'back' },
  // Head / neck
  { id: 'DU20', x: 0, y: 0, z: 0, ray: 'top' },
  { id: 'DU14', x: 0, y: 1.52, z: 0, ray: 'back' },
  { id: 'GB20', x: 0.05, y: 1.58, z: 0, ray: 'back' },
  // Left arm: lung
  { id: 'LU5', x: 0.36, y: 1.285, z: 0, ray: 'front' },
  { id: 'LU6', x: 0.42, y: 1.235, z: 0, ray: 'front' },
  { id: 'LU7', x: 0.455, y: 1.19, z: 0, ray: 'front' },
  { id: 'LU9', x: 0.472, y: 1.17, z: 0, ray: 'front' },
  // Right arm: other channels
  { id: 'PC6', x: -0.43, y: 1.2, z: 0, ray: 'front' },
  { id: 'HT7', x: -0.472, y: 1.17, z: 0, ray: 'front' },
  { id: 'SJ5', x: -0.44, y: 1.2, z: 0, ray: 'back' },
  { id: 'SI3', x: -0.49, y: 1.1, z: 0, ray: 'back' },
  { id: 'LI4', x: -0.49, y: 1.1, z: 0, ray: 'front' },
  // Left leg / foot
  { id: 'ST36', x: 0.2, y: 0.36, z: 0, ray: 'front' },
  { id: 'SP6', x: 0.18, y: 0.24, z: 0, ray: 'front' },
  { id: 'GB34', x: 0.2, y: 0.44, z: 0, ray: 'front' },
  { id: 'GB39', x: 0.22, y: 0.2, z: 0, ray: 'front' },
  { id: 'SP4', x: 0.19, y: 0.035, z: 0, ray: 'front' },
  { id: 'LR3', x: 0.22, y: 0.03, z: 0, ray: 'front' },
  { id: 'KI3', x: 0.16, y: 0.08, z: -0.1, ray: 'inside-left' },
  { id: 'BL62', x: 0.3, y: 0.08, z: -0.1, ray: 'right' },
  { id: 'KI6', x: 0.16, y: 0.06, z: -0.05, ray: 'inside-left' },
  { id: 'GB41', x: 0.24, y: 0.03, z: 0, ray: 'front' },
]

const points: Record<string, Vec3> = {}
for (const g of guides) points[g.id] = surfaceAt(g)

function path(guides: Guide[]) {
  return guides.map(surfaceAt)
}

const paths: Record<string, Vec3[]> = {
  lung: path([
    { id: 'p', x: 0, y: 1.34, z: 0, ray: 'front' },
    { id: 'p', x: 0.14, y: 1.4, z: 0, ray: 'front' },
    { id: 'p', x: 0.18, y: 1.44, z: 0, ray: 'front' },
    { id: 'p', x: 0.26, y: 1.35, z: 0, ray: 'front' },
    { id: 'p', x: 0.29, y: 1.27, z: 0, ray: 'front' },
    { id: 'p', x: 0.36, y: 1.285, z: 0, ray: 'front' },
    { id: 'p', x: 0.42, y: 1.235, z: 0, ray: 'front' },
    { id: 'p', x: 0.455, y: 1.19, z: 0, ray: 'front' },
    { id: 'p', x: 0.46, y: 1.18, z: 0, ray: 'front' },
    { id: 'p', x: 0.472, y: 1.17, z: 0, ray: 'front' },
    { id: 'p', x: 0.49, y: 1.1, z: 0, ray: 'front' },
    { id: 'p', x: 0.515, y: 1.05, z: 0, ray: 'front' },
  ]),
  ren: path([
    { id: 'p', x: 0, y: 0.9, z: 0, ray: 'front' },
    { id: 'p', x: 0, y: 0.96, z: 0, ray: 'front' },
    { id: 'p', x: 0, y: 1.1, z: 0, ray: 'front' },
    { id: 'p', x: 0, y: 1.16, z: 0, ray: 'front' },
    { id: 'p', x: 0, y: 1.34, z: 0, ray: 'front' },
    { id: 'p', x: 0, y: 1.46, z: 0, ray: 'front' },
    { id: 'p', x: 0, y: 1.56, z: 0, ray: 'front' },
  ]),
  du: path([
    { id: 'p', x: 0, y: 0.9, z: 0, ray: 'back' },
    { id: 'p', x: 0, y: 1.05, z: 0, ray: 'back' },
    { id: 'p', x: 0, y: 1.2, z: 0, ray: 'back' },
    { id: 'p', x: 0, y: 1.35, z: 0, ray: 'back' },
    { id: 'p', x: 0, y: 1.52, z: 0, ray: 'back' },
    { id: 'p', x: 0, y: 1.65, z: 0, ray: 'back' },
    { id: 'p', x: 0, y: 1.78, z: 0, ray: 'top' },
  ]),
  kidney: path([
    { id: 'p', x: 0.2, y: 0.03, z: 0, ray: 'front' },
    { id: 'p', x: 0.18, y: 0.06, z: 0, ray: 'front' },
    { id: 'p', x: 0.16, y: 0.12, z: 0, ray: 'inside-left' },
    { id: 'p', x: 0.15, y: 0.24, z: 0, ray: 'front' },
    { id: 'p', x: 0.16, y: 0.36, z: 0, ray: 'front' },
    { id: 'p', x: 0.17, y: 0.48, z: 0, ray: 'front' },
    { id: 'p', x: 0.16, y: 0.62, z: 0, ray: 'front' },
    { id: 'p', x: 0.12, y: 0.8, z: 0, ray: 'front' },
    { id: 'p', x: 0.09, y: 0.94, z: 0, ray: 'front' },
    { id: 'p', x: 0.07, y: 1.06, z: 0, ray: 'front' },
    { id: 'p', x: 0.06, y: 1.18, z: 0, ray: 'front' },
    { id: 'p', x: 0.05, y: 1.3, z: 0, ray: 'front' },
    { id: 'p', x: 0.04, y: 1.42, z: 0, ray: 'front' },
    { id: 'p', x: 0.03, y: 1.5, z: 0, ray: 'front' },
  ]),
  bladder: path([
    { id: 'p', x: 0.03, y: 1.75, z: 0, ray: 'front' },
    { id: 'p', x: 0.04, y: 1.82, z: 0, ray: 'top' },
    { id: 'p', x: 0.03, y: 1.77, z: -0.05, ray: 'back' },
    { id: 'p', x: 0.05, y: 1.65, z: -0.05, ray: 'back' },
    { id: 'p', x: 0.06, y: 1.5, z: -0.05, ray: 'back' },
    { id: 'p', x: 0.06, y: 1.38, z: -0.05, ray: 'back' },
    { id: 'p', x: 0.06, y: 1.24, z: -0.05, ray: 'back' },
    { id: 'p', x: 0.06, y: 1.1, z: -0.05, ray: 'back' },
    { id: 'p', x: 0.06, y: 0.96, z: -0.05, ray: 'back' },
    { id: 'p', x: 0.09, y: 0.8, z: -0.05, ray: 'back' },
    { id: 'p', x: 0.12, y: 0.62, z: -0.05, ray: 'back' },
    { id: 'p', x: 0.15, y: 0.44, z: -0.05, ray: 'back' },
    { id: 'p', x: 0.18, y: 0.26, z: -0.05, ray: 'back' },
    { id: 'p', x: 0.2, y: 0.11, z: -0.05, ray: 'back' },
    { id: 'p', x: 0.23, y: 0.04, z: 0, ray: 'top' },
    { id: 'p', x: 0.25, y: 0.02, z: 0.06, ray: 'top' },
  ]),
  'small-intestine': path([
    { id: 'p', x: -0.51, y: 1.02, z: 0, ray: 'back' },
    { id: 'p', x: -0.48, y: 1.1, z: 0, ray: 'back' },
    { id: 'p', x: -0.45, y: 1.18, z: 0, ray: 'back' },
    { id: 'p', x: -0.4, y: 1.27, z: 0, ray: 'back' },
    { id: 'p', x: -0.34, y: 1.36, z: 0, ray: 'back' },
    { id: 'p', x: -0.26, y: 1.44, z: 0, ray: 'back' },
    { id: 'p', x: -0.18, y: 1.5, z: 0, ray: 'back' },
    { id: 'p', x: -0.1, y: 1.56, z: 0, ray: 'back' },
    { id: 'p', x: -0.02, y: 1.62, z: 0, ray: 'back' },
    { id: 'p', x: 0.06, y: 1.66, z: 0, ray: 'front' },
    { id: 'p', x: 0.08, y: 1.7, z: 0, ray: 'right' },
    { id: 'p', x: 0.09, y: 1.72, z: 0, ray: 'right' },
  ]),
}

const payload = {
  model: 'makehuman-base',
  coordinateFrame: 'makehuman-body-v2',
  height: 1.84,
  generatedAt: new Date().toISOString(),
  points,
  paths,
}

fs.writeFileSync('scripts/content/body_points.json', JSON.stringify(payload, null, 2), 'utf8')
console.log(`Wrote body_points.json: ${Object.keys(points).length} points, ${Object.keys(paths).length} paths.`)
