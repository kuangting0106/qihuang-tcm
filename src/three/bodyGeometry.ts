import * as THREE from 'three'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'

export interface PreparedHuman {
  group: THREE.Group
  body: THREE.Mesh
  joints: Record<string, THREE.Vector3>
  dispose: () => void
}

const HEIGHT = 1.84

function smoothBump(y: number, center: number, width: number) {
  const t = (y - center) / width
  return Math.exp(-0.5 * t * t)
}

function deformPoint(
  x: number,
  y: number,
  z: number,
  minY: number,
  centerX: number,
  centerZ: number,
  scale: number,
): [number, number, number] {
  let nx = (x - centerX) * scale
  let ny = (y - minY) * scale
  let nz = (z - centerZ) * scale

  // Masculine silhouette: broader shoulders/chest, slightly narrower waist.
  const shoulder = smoothBump(ny, 1.44, 0.13)
  const waist = smoothBump(ny, 1.03, 0.09)
  nx *= 1 + 0.1 * shoulder - 0.045 * waist

  // Bring the wide stance slightly inward without crossing the legs.
  if (ny < 0.9) nx *= 1 - 0.16 * (1 - Math.max(0, ny) / 0.9)

  // Flatten the chest only on the torso; do not touch face, arms, or hands.
  if (ny > 1.24 && ny < 1.52 && nz > 0.015 && Math.abs(nx) < 0.27) {
    nz = 0.015 + (nz - 0.015) * 0.55
  }

  return [nx, ny, nz]
}

function disposeObject(root: THREE.Object3D, keep?: THREE.Object3D) {
  root.traverse((obj) => {
    if (keep && obj === keep) return
    const mesh = obj as THREE.Mesh
    if (mesh.geometry) mesh.geometry.dispose()
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined
    if (Array.isArray(material)) material.forEach((m) => m.dispose())
    else material?.dispose()
  })
}

export function prepareHumanObject(obj: THREE.Group): PreparedHuman {
  const body = obj.getObjectByName('body') as THREE.Mesh | undefined
  if (!body) throw new Error('OBJ 中没有找到 body 网格')

  body.geometry.computeBoundingBox()
  const bb = body.geometry.boundingBox!
  const scale = HEIGHT / (bb.max.y - bb.min.y)
  const centerX = (bb.min.x + bb.max.x) / 2
  const centerZ = (bb.min.z + bb.max.z) / 2
  const minY = bb.min.y

  const position = body.geometry.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < position.count; i++) {
    const [x, y, z] = deformPoint(
      position.getX(i),
      position.getY(i),
      position.getZ(i),
      minY,
      centerX,
      centerZ,
      scale,
    )
    position.setXYZ(i, x, y, z)
  }
  position.needsUpdate = true

  // OBJLoader de-indexes the mesh; merge duplicate positions so smooth normals
  // are shared across the body instead of showing faceted seams.
  body.geometry.deleteAttribute('normal')
  body.geometry.deleteAttribute('uv')
  const merged = mergeVertices(body.geometry, 1e-4)
  merged.computeVertexNormals()
  merged.computeBoundingSphere()
  body.geometry.dispose()
  body.geometry = merged

  const joints: Record<string, THREE.Vector3> = {}
  obj.traverse((child) => {
    if (!child.name?.startsWith('joint-')) return
    const mesh = child as THREE.Mesh
    if (!mesh.geometry) return
    mesh.geometry.computeBoundingBox()
    const c = mesh.geometry.boundingBox!.getCenter(new THREE.Vector3())
    const [x, y, z] = deformPoint(c.x, c.y, c.z, minY, centerX, centerZ, scale)
    joints[child.name] = new THREE.Vector3(x, y, z)
  })

  body.removeFromParent()
  body.position.set(0, 0, 0)
  body.rotation.set(0, 0, 0)
  body.scale.set(1, 1, 1)

  const group = new THREE.Group()
  group.name = 'makehuman-body-v2'
  group.add(body)

  // Dispose all helper meshes; we only keep the body surface.
  disposeObject(obj, body)

  const disposer = () => {
    body.geometry.dispose()
    const material = body.material as THREE.Material | THREE.Material[] | undefined
    if (Array.isArray(material)) material.forEach((m) => m.dispose())
    else material?.dispose()
  }

  return { group, body, joints, dispose: disposer }
}

function clothMaterial(color: number) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.78,
    metalness: 0.02,
    side: THREE.DoubleSide,
  })
}

function addDetails(group: THREE.Group, body: THREE.Mesh, joints: Record<string, THREE.Vector3>) {
  const skin = new THREE.MeshStandardMaterial({
    color: 0xdfb08c,
    roughness: 0.62,
    metalness: 0.0,
  })
  body.material = skin
  body.castShadow = true
  body.receiveShadow = true

  const teal = clothMaterial(0x2f6f6b)
  const tealLight = clothMaterial(0x4b9490)

  // Minimal fitted briefs: much closer to an anatomical model than a barrel skirt.
  const brief = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.205, 0.19, 28, 1, true), teal)
  brief.position.set(0, 0.91, 0)
  brief.scale.z = 0.72
  group.add(brief)

  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.006, 8, 28), tealLight)
  belt.rotation.x = Math.PI / 2
  belt.position.set(0, 1.005, 0)
  belt.scale.z = 0.72
  group.add(belt)

  // Dark short hair instead of a teal cap; keep a thin headband for the reference cue.
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x2a211c, roughness: 0.78 })
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.122, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.46),
    hairMat,
  )
  hairCap.position.set(0, 1.737, -0.008)
  hairCap.scale.set(1.02, 1.02, 1)
  group.add(hairCap)

  const backHair = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 14), hairMat)
  backHair.position.set(0, 1.69, -0.045)
  backHair.scale.set(1.0, 1.08, 0.62)
  group.add(backHair)

  const fringe = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 10), hairMat)
  fringe.position.set(0, 1.748, 0.072)
  fringe.scale.set(1.55, 0.3, 0.36)
  group.add(fringe)

  for (const side of [-1, 1]) {
    const sideburn = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.055, 0.012), hairMat)
    sideburn.position.set(side * 0.112, 1.7, 0.018)
    sideburn.rotation.z = side * 0.08
    group.add(sideburn)
  }

  // Face: raycast the actual surface so the eyes sit on the head.
  const raycaster = new THREE.Raycaster()
  const front = new THREE.Vector3(0, 0, -1)
  const eyeY = 1.705
  for (const side of [-1, 1]) {
    const x = side * 0.036
    raycaster.set(new THREE.Vector3(x, eyeY, 1.2), front)
    const hit = raycaster.intersectObject(body, false)[0]
    const z = hit ? hit.point.z + 0.002 : 0.125
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.009, 12, 8),
      new THREE.MeshStandardMaterial({ color: 0x1c1714, roughness: 0.3 }),
    )
    eye.position.set(x, eyeY, z + 0.003)
    eye.scale.set(1.15, 0.78, 0.42)
    group.add(eye)

    const catchlight = new THREE.Mesh(
      new THREE.SphereGeometry(0.0022, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xfff8ee }),
    )
    catchlight.position.set(x + 0.003, eyeY + 0.003, z + 0.009)
    group.add(catchlight)

    const brow = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 0.006, 0.008),
      new THREE.MeshStandardMaterial({ color: 0x2a211c, roughness: 0.7 }),
    )
    brow.position.set(side * 0.04, 1.728, z + 0.001)
    brow.rotation.z = side * -0.08
    group.add(brow)
  }

  // Keep the reference's quiet pedestal ring.
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.33, 0.336, 64),
    new THREE.MeshBasicMaterial({ color: 0xb08a4a, transparent: true, opacity: 0.45, side: THREE.DoubleSide }),
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.002
  group.add(ring)

  // A soft contact shadow under the feet.
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 120)
    g.addColorStop(0, 'rgba(32, 37, 34, 0.26)')
    g.addColorStop(1, 'rgba(32, 37, 34, 0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 256)
  }
  const shadowTex = new THREE.CanvasTexture(canvas)
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 1.2),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.003
  group.add(shadow)
}

export async function createHumanModel(url: string): Promise<PreparedHuman> {
  const loader = new OBJLoader()
  const obj = await loader.loadAsync(url)
  const prepared = prepareHumanObject(obj)
  addDetails(prepared.group, prepared.body, prepared.joints)

  const dispose = () => {
    prepared.group.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      mesh.geometry?.dispose()
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined
      const materials = Array.isArray(material) ? material : material ? [material] : []
      for (const m of materials) {
        const map = (m as THREE.MeshStandardMaterial).map
        map?.dispose()
        m.dispose()
      }
    })
  }

  return { ...prepared, dispose }
}
