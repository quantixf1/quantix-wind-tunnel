/**
 * Load and normalize 3D car models (STL, OBJ, GLB/GLTF).
 * STEP is not supported in-browser without a heavy OpenCascade build —
 * we surface a clear message instead of a silent failure.
 */

import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { ModelBounds } from '../types'

export type SupportedFormat = 'stl' | 'obj' | 'glb' | 'gltf' | 'step' | 'stp' | 'unknown'

export function detectFormat(filename: string): SupportedFormat {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'stl') return 'stl'
  if (ext === 'obj') return 'obj'
  if (ext === 'glb') return 'glb'
  if (ext === 'gltf') return 'gltf'
  if (ext === 'step' || ext === 'stp') return 'step'
  return 'unknown'
}

export interface LoadResult {
  object: THREE.Object3D
  bounds: ModelBounds
  format: SupportedFormat
  name: string
}

/** Target display length in scene units (meters-ish) */
const TARGET_LENGTH = 2.2

/**
 * Center geometry at origin and scale so longest axis ≈ TARGET_LENGTH.
 * Also compute bounding metrics used by aero estimates.
 */
export function normalizeObject(object: THREE.Object3D): ModelBounds {
  // Ensure world matrices are current
  object.updateMatrixWorld(true)

  const box = new THREE.Box3().setFromObject(object)
  const size = new THREE.Vector3()
  const center = new THREE.Vector3()
  box.getSize(size)
  box.getCenter(center)

  // Re-parent content under a pivot for clean centering
  object.position.sub(center)

  // Recompute after centering
  object.updateMatrixWorld(true)
  box.setFromObject(object)
  box.getSize(size)

  const maxDim = Math.max(size.x, size.y, size.z, 1e-6)
  const scale = TARGET_LENGTH / maxDim
  object.scale.multiplyScalar(scale)

  object.updateMatrixWorld(true)
  box.setFromObject(object)
  box.getSize(size)

  // Place car so underside sits near y = 0
  const minY = box.min.y
  object.position.y -= minY

  object.updateMatrixWorld(true)
  box.setFromObject(object)
  box.getSize(size)

  let triangleCount = 0
  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      const geo = mesh.geometry
      if (geo.index) triangleCount += geo.index.count / 3
      else if (geo.attributes.position) triangleCount += geo.attributes.position.count / 3
    }
  })

  const height = size.y
  // Prefer longest horizontal axis as streamwise length
  const streamwise = Math.max(size.x, size.z)
  const span = Math.min(size.x, size.z)

  return {
    width: span,
    height,
    length: streamwise,
    frontalArea: span * height * 0.72,
    triangleCount: Math.round(triangleCount),
  }
}

function applyDefaultMaterial(object: THREE.Object3D, wireframe = false): void {
  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      mesh.castShadow = true
      mesh.receiveShadow = true
      if (!mesh.material || Array.isArray(mesh.material)) {
        mesh.material = new THREE.MeshStandardMaterial({
          color: 0xc8c8c8,
          metalness: 0.45,
          roughness: 0.4,
          wireframe,
        })
      } else {
        const mat = mesh.material as THREE.MeshStandardMaterial
        if ('wireframe' in mat) mat.wireframe = wireframe
      }
    }
  })
}

export async function loadModelFromFile(file: File): Promise<LoadResult> {
  const format = detectFormat(file.name)
  if (format === 'step' || format === 'stp') {
    throw new Error(
      'STEP (.step/.stp) is not supported in the browser. Export as STL, OBJ, or GLB from your CAD package.',
    )
  }
  if (format === 'unknown') {
    throw new Error('Unsupported file type. Please upload STL, OBJ, or GLB.')
  }

  const buffer = await file.arrayBuffer()
  let object: THREE.Object3D

  if (format === 'stl') {
    const loader = new STLLoader()
    const geometry = loader.parse(buffer)
    geometry.computeVertexNormals()
    const material = new THREE.MeshStandardMaterial({
      color: 0xc8c8c8,
      metalness: 0.45,
      roughness: 0.4,
    })
    object = new THREE.Mesh(geometry, material)
  } else if (format === 'obj') {
    const text = new TextDecoder().decode(buffer)
    const loader = new OBJLoader()
    object = loader.parse(text)
    applyDefaultMaterial(object)
  } else {
    // glb / gltf
    const loader = new GLTFLoader()
    const gltf = await loader.parseAsync(buffer, '')
    object = gltf.scene
    applyDefaultMaterial(object)
  }

  const group = new THREE.Group()
  group.name = file.name
  group.add(object)

  const bounds = normalizeObject(group)

  return {
    object: group,
    bounds,
    format,
    name: file.name,
  }
}

/**
 * Procedural F1-in-Schools style demo car for first-run experience.
 * Approximate proportions: long nose, sidepods, rear wing, low cockpit.
 */
export function createDemoCar(): LoadResult {
  const group = new THREE.Group()
  group.name = 'Demo F1 in Schools Car'

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xd0d0d0,
    metalness: 0.55,
    roughness: 0.35,
  })
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.6,
    roughness: 0.4,
  })
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x8a8a8a,
    metalness: 0.5,
    roughness: 0.45,
  })

  // Main chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 1.6), bodyMat)
  chassis.position.set(0, 0.14, 0)
  chassis.castShadow = true
  group.add(chassis)

  // Nose cone
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.55, 12), bodyMat)
  nose.rotation.x = -Math.PI / 2
  nose.position.set(0, 0.12, 1.0)
  nose.castShadow = true
  group.add(nose)

  // Cockpit / halo area
  const cockpit = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.35), accentMat)
  cockpit.position.set(0, 0.28, 0.15)
  cockpit.castShadow = true
  group.add(cockpit)

  // Sidepods
  const leftPod = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.7), bodyMat)
  leftPod.position.set(-0.32, 0.12, -0.05)
  leftPod.castShadow = true
  group.add(leftPod)
  const rightPod = leftPod.clone()
  rightPod.position.x = 0.32
  group.add(rightPod)

  // Front wing
  const frontWing = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.03, 0.18), wingMat)
  frontWing.position.set(0, 0.05, 1.15)
  frontWing.castShadow = true
  group.add(frontWing)

  // Rear wing main plane
  const rearWing = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.04, 0.2), wingMat)
  rearWing.position.set(0, 0.38, -0.85)
  rearWing.castShadow = true
  group.add(rearWing)

  // Rear wing endplates
  const endL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.22), accentMat)
  endL.position.set(-0.38, 0.3, -0.85)
  endL.castShadow = true
  group.add(endL)
  const endR = endL.clone()
  endR.position.x = 0.38
  group.add(endR)

  // Wheels (simplified cylinders)
  const wheelGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 16)
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 })
  const wheelPositions: [number, number, number][] = [
    [-0.32, 0.1, 0.65],
    [0.32, 0.1, 0.65],
    [-0.32, 0.1, -0.55],
    [0.32, 0.1, -0.55],
  ]
  for (const [x, y, z] of wheelPositions) {
    const w = new THREE.Mesh(wheelGeo, wheelMat)
    w.rotation.z = Math.PI / 2
    w.position.set(x, y, z)
    w.castShadow = true
    group.add(w)
  }

  const bounds = normalizeObject(group)

  return {
    object: group,
    bounds,
    format: 'unknown',
    name: 'Demo F1 in Schools Car',
  }
}
