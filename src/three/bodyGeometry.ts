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

function sphere(
  radius: number,
  position: [number, number, number],
  scale: [number, number, number],
  material: THREE.Material,
  width = 20,
  height = 14,
) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, width, height), material)
  mesh.position.set(...position)
  mesh.scale.set(...scale)
  return mesh
}

function capsuleBetween(
  a: THREE.Vector3,
  b: THREE.Vector3,
  radius: number,
  material: THREE.Material,
) {
  const direction = new THREE.Vector3().subVectors(b, a)
  const length = Math.max(0.001, direction.length() - radius * 2)
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 6, 12), material)
  mesh.position.copy(a).add(b).multiplyScalar(0.5)
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize())
  return mesh
}

function toonGradient(stops: number[]) {
  const data = new Uint8Array(stops.length * 4)
  stops.forEach((value, index) => {
    data[index * 4] = value
    data[index * 4 + 1] = value
    data[index * 4 + 2] = value
    data[index * 4 + 3] = 255
  })
  const texture = new THREE.DataTexture(data, stops.length, 1, THREE.RGBAFormat)
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return texture
}

function toonMaterial(
  color: number,
  gradient: THREE.Texture,
  options: THREE.MeshToonMaterialParameters = {},
) {
  return new THREE.MeshToonMaterial({ color, gradientMap: gradient, ...options })
}

function clothTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#819aa1'
    ctx.fillRect(0, 0, 256, 256)

    for (let i = 0; i < 9; i++) {
      const x = 14 + i * 30
      const fold = ctx.createLinearGradient(x - 13, 0, x + 13, 0)
      fold.addColorStop(0, 'rgba(47, 74, 83, 0)')
      fold.addColorStop(0.5, 'rgba(47, 74, 83, 0.18)')
      fold.addColorStop(1, 'rgba(47, 74, 83, 0)')
      ctx.fillStyle = fold
      ctx.fillRect(x - 13, 0, 26, 256)
    }

    const flower = (x: number, y: number, scale: number, color: string) => {
      ctx.save()
      ctx.translate(x, y)
      for (let petal = 0; petal < 5; petal++) {
        const angle = (petal * Math.PI * 2) / 5
        ctx.beginPath()
        ctx.ellipse(
          Math.cos(angle) * 3.2 * scale,
          Math.sin(angle) * 3.2 * scale,
          3 * scale,
          1.8 * scale,
          angle,
          0,
          Math.PI * 2,
        )
        ctx.fillStyle = color
        ctx.fill()
      }
      ctx.beginPath()
      ctx.arc(0, 0, 1.2 * scale, 0, Math.PI * 2)
      ctx.fillStyle = '#c3d2ce'
      ctx.fill()
      ctx.restore()
    }

    for (let row = 0; row < 11; row++) {
      for (let col = 0; col < 10; col++) {
        const x = 13 + col * 26 + (row % 2) * 13
        const y = 12 + row * 23
        flower(x, y, 0.75, '#6f878e')
      }
    }

    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.05})`
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 1)
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1.3, 1.05)
  texture.anisotropy = 4
  return texture
}


function addDetails(group: THREE.Group, body: THREE.Mesh, joints: Record<string, THREE.Vector3>) {
  const gradient = toonGradient([118, 152, 184, 212, 232, 246])
  const skin = toonMaterial(0xd7a47a, gradient)
  body.material = skin
  body.castShadow = true
  body.receiveShadow = true

  // A faint back-face hull gives the silhouette an ink-brush rim.
  const outline = new THREE.Mesh(
    body.geometry,
    new THREE.MeshBasicMaterial({
      color: 0x3e2b21,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    }),
  )
  outline.scale.setScalar(1.008)
  outline.position.y = 0.92 * (1 - 1.008)
  outline.renderOrder = 1
  group.add(outline)

  const clothMap = clothTexture()
  const cloth = toonMaterial(0xffffff, gradient, {
    map: clothMap,
    side: THREE.DoubleSide,
  })
  const sashMat = toonMaterial(0x2f4e67, gradient)
  const hairMat = toonMaterial(0x2c221c, gradient)

  // Blue-grey floral waist cloth, tied with a sash.
  const skirtGeometry = new THREE.CylinderGeometry(0.205, 0.245, 0.36, 40, 1, true)
  const skirtPositions = skirtGeometry.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < skirtPositions.count; i++) {
    if (skirtPositions.getY(i) < 0) {
      const angle = Math.atan2(skirtPositions.getZ(i), skirtPositions.getX(i))
      skirtPositions.setY(i, skirtPositions.getY(i) + 0.03 * Math.cos(angle - 0.6))
    }
  }
  skirtPositions.needsUpdate = true
  skirtGeometry.computeVertexNormals()
  const skirt = new THREE.Mesh(skirtGeometry, cloth)
  skirt.position.set(0, 0.845, -0.035)
  skirt.scale.z = 1.12
  group.add(skirt)

  const sash = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.012, 8, 36), sashMat)
  sash.rotation.x = Math.PI / 2
  sash.position.set(0, 1.018, -0.035)
  sash.scale.z = 1.12
  group.add(sash)

  group.add(sphere(0.026, [0.075, 1.012, 0.21], [1, 0.9, 0.66], sashMat, 12, 10))
  const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.12, 0.006), sashMat)
  ribbon.position.set(0.075, 0.956, 0.212)
  ribbon.rotation.z = 0.04
  group.add(ribbon)

  // Black cloth cap with a folded band and two hanging tails.
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.122, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.46),
    hairMat,
  )
  hairCap.position.set(0, 1.758, -0.008)
  hairCap.scale.set(1, 1, 1)
  group.add(hairCap)

  // Back hair as a half shell so it never wraps across the face.
  const backHair = new THREE.Mesh(
    new THREE.SphereGeometry(0.118, 24, 16, Math.PI * 1.15, Math.PI * 0.7, 0, Math.PI * 0.72),
    hairMat,
  )
  backHair.position.set(0, 1.7, -0.07)
  backHair.scale.set(1.02, 1.12, 1.2)
  group.add(backHair)

  group.add(sphere(0.032, [0, 1.772, -0.118], [1, 0.8, 0.82], hairMat, 14, 10))

  for (const side of [-1, 1]) {
    const sideburn = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.03, 0.012), hairMat)
    sideburn.position.set(side * 0.11, 1.71, 0.02)
    sideburn.rotation.z = side * 0.08
    group.add(sideburn)
  }

  const raycaster = new THREE.Raycaster()
  const front = new THREE.Vector3(0, 0, -1)

  // Moustache and a short chin tuft, kept clear of the facial acupoints.
  raycaster.set(new THREE.Vector3(0, 1.678, 1.2), front)
  const lipZ = raycaster.intersectObject(body, false)[0]?.point.z ?? 0.108
  for (const side of [-1, 1]) {
    group.add(
      capsuleBetween(
        new THREE.Vector3(side * 0.003, 1.684, lipZ + 0.006),
        new THREE.Vector3(side * 0.03, 1.676, lipZ + 0.002),
        0.0042,
        hairMat,
      ),
    )
  }

  raycaster.set(new THREE.Vector3(0, 1.6, 1.2), front)
  const chinZ = raycaster.intersectObject(body, false)[0]?.point.z ?? 0.095
  const goatee = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.009, 0.055, 12), hairMat)
  goatee.position.set(0, 1.575, chinZ + 0.004)
  goatee.scale.z = 0.55
  group.add(goatee)

  // Face: raycast the actual surface so the eyes sit on the head.
  const eyeY = 1.705
  for (const side of [-1, 1]) {
    const x = side * 0.036
    raycaster.set(new THREE.Vector3(x, eyeY, 1.2), front)
    const hit = raycaster.intersectObject(body, false)[0]
    const z = hit ? hit.point.z + 0.002 : 0.125
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.009, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0x1c1714 }),
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
      new THREE.BoxGeometry(0.048, 0.007, 0.008),
      new THREE.MeshBasicMaterial({ color: 0x2a211c }),
    )
    brow.position.set(side * 0.04, 1.729, z + 0.001)
    brow.rotation.z = side * -0.08
    group.add(brow)
  }

  // Keep the reference's quiet pedestal ring.
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.33, 0.336, 64),
    new THREE.MeshBasicMaterial({
      color: 0x8a6644,
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
    }),
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
        const toon = m as THREE.MeshToonMaterial
        toon.gradientMap?.dispose()
        m.dispose()
      }
    })
  }

  return { ...prepared, dispose }
}
