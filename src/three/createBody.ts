import * as THREE from 'three'

export interface BodyModel {
  group: THREE.Group
  dispose: () => void
}

const skinMaterial = new THREE.MeshStandardMaterial({
  color: 0xc89470,
  roughness: 0.62,
  metalness: 0.05,
  flatShading: false,
})

const skinDeep = new THREE.MeshStandardMaterial({
  color: 0xb77a58,
  roughness: 0.68,
  metalness: 0.035,
  flatShading: false,
})

const hairMaterial = new THREE.MeshStandardMaterial({
  color: 0x2a211c,
  roughness: 0.66,
  metalness: 0.05,
  flatShading: false,
})

const eyeMaterial = new THREE.MeshStandardMaterial({
  color: 0x171412,
  roughness: 0.35,
  metalness: 0.1,
})

const lipMaterial = new THREE.MeshStandardMaterial({
  color: 0x8e4e40,
  roughness: 0.6,
  metalness: 0.04,
})

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
  const geometry = new THREE.CapsuleGeometry(radius, length, 6, 12)
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.copy(a).add(b).multiplyScalar(0.5)
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize())
  return mesh
}

function addLimb(
  group: THREE.Group,
  points: [number, number, number][],
  radii: number[],
  material: THREE.Material,
) {
  for (let i = 0; i < points.length - 1; i++) {
    group.add(
      capsuleBetween(
        new THREE.Vector3(...points[i]),
        new THREE.Vector3(...points[i + 1]),
        radii[i] ?? 0.04,
        material,
      ),
    )
  }
}

export function createBody(): BodyModel {
  const group = new THREE.Group()
  group.name = 'bronze-body-v1'

  // Head and face
  const head = sphere(0.115, [0, 1.7, 0], [1, 1.16, 0.96], skinMaterial, 24, 18)
  group.add(head)
  group.add(sphere(0.09, [0, 1.638, 0.018], [0.98, 0.72, 0.9], skinMaterial, 18, 12))

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.046, 8), skinDeep)
  nose.position.set(0, 1.706, 0.112)
  nose.rotation.x = Math.PI / 2
  group.add(nose)

  for (const side of [-1, 1]) {
    const eye = sphere(0.011, [side * 0.039, 1.724, 0.108], [1, 0.72, 0.55], eyeMaterial, 12, 8)
    group.add(eye)
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.009, 0.012), hairMaterial)
    brow.position.set(side * 0.04, 1.748, 0.108)
    brow.rotation.z = side * -0.1
    group.add(brow)
    const ear = sphere(0.02, [side * 0.118, 1.7, 0], [0.7, 1.2, 0.55], skinMaterial, 10, 8)
    group.add(ear)
  }

  const lips = sphere(0.03, [0, 1.664, 0.11], [1, 0.24, 0.28], lipMaterial, 12, 8)
  group.add(lips)

  // Hair: a high cap plus a back mass, so it never covers the eyes
  group.add(sphere(0.112, [0, 1.71, -0.035], [1.0, 1.08, 0.72], hairMaterial, 20, 14))
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.42),
    hairMaterial,
  )
  hairCap.position.set(0, 1.725, -0.008)
  hairCap.scale.set(1.02, 1.02, 1)
  group.add(hairCap)
  const topknot = sphere(0.044, [0, 1.855, -0.012], [1, 0.82, 1], hairMaterial, 14, 10)
  group.add(topknot)
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.007, 6, 14), hairMaterial)
  band.position.set(0, 1.825, -0.012)
  band.rotation.x = Math.PI / 2
  group.add(band)

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.063, 0.13, 14), skinMaterial)
  neck.position.set(0, 1.595, 0)
  group.add(neck)

  // Torso
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.14, 0.43, 18, 1), skinMaterial)
  torso.position.set(0, 1.29, 0)
  torso.scale.z = 0.66
  group.add(torso)

  // Chest and abdomen: broad, flat pectorals rather than rounded forms
  for (const side of [-1, 1]) {
    group.add(sphere(0.068, [side * 0.075, 1.375, 0.085], [1.45, 0.58, 0.22], skinMaterial, 20, 12))
  }
  for (let row = 0; row < 3; row++) {
    for (const side of [-1, 1]) {
      group.add(
        sphere(
          0.021,
          [side * 0.028, 1.21 - row * 0.05, 0.118 - row * 0.005],
          [1.15, 0.48, 0.18],
          skinDeep,
          12,
          8,
        ),
      )
    }
  }

  // Shoulders and pelvis
  for (const side of [-1, 1]) {
    group.add(sphere(0.067, [side * 0.19, 1.43, 0], [1, 1, 0.9], skinMaterial, 16, 12))
  }
  group.add(sphere(0.145, [0, 1.0, 0], [1, 0.72, 0.68], skinMaterial, 18, 12))

  // Arms: A-pose, slightly away from body
  for (const side of [-1, 1]) {
    addLimb(
      group,
      [
        [side * 0.2, 1.43, 0],
        [side * 0.31, 1.1, 0.02],
        [side * 0.35, 0.82, 0.04],
      ],
      [0.055, 0.04],
      skinMaterial,
    )
    group.add(sphere(0.036, [side * 0.35, 0.8, 0.04], [1, 1, 1], skinMaterial, 12, 10))
    const hand = sphere(0.034, [side * 0.352, 0.755, 0.04], [0.82, 1.5, 0.58], skinMaterial, 14, 10)
    hand.rotation.z = side * -0.1
    group.add(hand)
  }

  // Legs
  for (const side of [-1, 1]) {
    addLimb(
      group,
      [
        [side * 0.09, 1.02, 0],
        [side * 0.11, 0.55, 0.02],
        [side * 0.12, 0.1, 0],
      ],
      [0.075, 0.05],
      skinMaterial,
    )
    group.add(sphere(0.044, [side * 0.12, 0.11, 0], [1, 0.9, 0.9], skinMaterial, 12, 10))
    const foot = sphere(0.052, [side * 0.12, 0.05, 0.07], [1.08, 0.55, 2.15], skinMaterial, 14, 10)
    group.add(foot)
  }

  // A quiet pedestal ring: visual anchor, not part of the body
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.32, 0.325, 64),
    new THREE.MeshBasicMaterial({ color: 0xb08a4a, transparent: true, opacity: 0.45, side: THREE.DoubleSide }),
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.002
  group.add(ring)

  const dispose = () => {
    group.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined
      if (Array.isArray(material)) material.forEach((m) => m.dispose())
      else material?.dispose()
    })
  }

  return { group, dispose }
}
