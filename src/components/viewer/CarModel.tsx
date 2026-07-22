/**
 * Renders the loaded (or demo) car mesh and applies wireframe / heatmap materials.
 */

import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { getWindBasis, sampleFlow, type FlowSample } from '../../lib/flowField'
import { useSimulationStore } from '../../store/simulationStore'
import { createDemoCar } from '../../lib/modelLoader'

interface CarModelProps {
  /** External model root; when null, demo car is used */
  model: THREE.Object3D | null
}

export function CarModel({ model }: CarModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const wireframe = useSimulationStore((s) => s.viz.wireframe)
  const pressureMap = useSimulationStore((s) => s.viz.pressureMap)
  const velocityMap = useSimulationStore((s) => s.viz.velocityMap)
  const wind = useSimulationStore((s) => s.wind)
  const bounds = useSimulationStore((s) => s.bounds)
  const setBounds = useSimulationStore((s) => s.setBounds)
  const setModelMeta = useSimulationStore((s) => s.setModelMeta)

  const demo = useMemo(() => createDemoCar(), [])

  // Install demo bounds on first mount when no external model
  useEffect(() => {
    if (!model) {
      setBounds(demo.bounds)
      setModelMeta({
        name: demo.name,
        format: 'demo',
        triangleCount: demo.bounds.triangleCount,
      })
    }
  }, [model, demo, setBounds, setModelMeta])

  const displayObject = model ?? demo.object

  // Wireframe + heatmap material updates
  useEffect(() => {
    if (!displayObject) return

    displayObject.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return
      const mesh = child as THREE.Mesh
      const applyToMat = (mat: THREE.Material) => {
        if ('wireframe' in mat) {
          ;(mat as THREE.MeshStandardMaterial).wireframe = wireframe
        }
        if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
          if (pressureMap) {
            mat.color.setHSL(0.55, 0.15, 0.55)
            mat.emissive.setHex(0x1a1a22)
            mat.emissiveIntensity = 0.15
            mat.metalness = 0.2
            mat.roughness = 0.55
          } else if (velocityMap) {
            mat.color.setHSL(0.55 + Math.min(wind.speed / 40, 1) * 0.08, 0.2, 0.5)
            mat.emissive.setHex(0x111118)
            mat.emissiveIntensity = 0.1
            mat.metalness = 0.35
            mat.roughness = 0.45
          } else {
            // Neutral minimal body
            if (!mat.userData.preservedColor) {
              mat.userData.preservedColor = mat.color.getHex()
            }
            mat.color.setHex(mat.userData.preservedColor ?? 0xc8c8c8)
            mat.emissive.setHex(0x000000)
            mat.emissiveIntensity = 0
            mat.metalness = 0.45
            mat.roughness = 0.4
          }
          mat.needsUpdate = true
        }
      }

      if (Array.isArray(mesh.material)) mesh.material.forEach(applyToMat)
      else applyToMat(mesh.material)
    })
  }, [displayObject, wireframe, pressureMap, velocityMap, wind.speed])

  // Heatmap vertex colors — pressure/velocity use the shared wind basis (not fixed +Z)
  useEffect(() => {
    if (!displayObject || (!pressureMap && !velocityMap)) return

    const basis = getWindBasis(wind.direction)
    const worldPos = new THREE.Vector3()
    const localNormal = new THREE.Vector3()
    const sample: FlowSample = {
      velocity: new THREE.Vector3(),
      speed: 0,
      pressure: 0,
      turbulence: 0,
      inWake: false,
    }

    displayObject.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return
      const mesh = child as THREE.Mesh
      const geo = mesh.geometry
      const pos = geo.attributes.position
      if (!pos) return

      const colors = new Float32Array(pos.count * 3)
      const color = new THREE.Color()
      const normal = geo.attributes.normal
      mesh.updateWorldMatrix(true, false)

      for (let i = 0; i < pos.count; i++) {
        let t = 0.5
        if (pressureMap && normal) {
          // Stagnation on faces looking into the free stream (-forward)
          localNormal.fromBufferAttribute(normal, i)
          localNormal.transformDirection(mesh.matrixWorld)
          // High when normal opposes wind (facing upstream into oncoming flow)
          const facing = -localNormal.dot(basis.forward)
          t = Math.max(0, Math.min(1, 0.45 + facing * 0.55))
          color.setHSL(0.6, 0.05, 0.25 + t * 0.55)
        } else if (velocityMap) {
          worldPos.fromBufferAttribute(pos, i)
          worldPos.applyMatrix4(mesh.matrixWorld)
          sampleFlow(worldPos, wind, bounds, sample, basis)
          t = Math.max(0, Math.min(1, sample.speed / Math.max(wind.speed * 1.2, 1e-3)))
          color.setHSL(0.55, 0.08, 0.3 + t * 0.45)
        }
        colors[i * 3] = color.r
        colors[i * 3 + 1] = color.g
        colors[i * 3 + 2] = color.b
      }

      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach((m) => {
        if ('vertexColors' in m) {
          ;(m as THREE.MeshStandardMaterial).vertexColors = true
          m.needsUpdate = true
        }
      })
    })

    return () => {
      displayObject.traverse((child) => {
        if (!(child as THREE.Mesh).isMesh) return
        const mesh = child as THREE.Mesh
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach((m) => {
          if ('vertexColors' in m) {
            ;(m as THREE.MeshStandardMaterial).vertexColors = false
            m.needsUpdate = true
          }
        })
      })
    }
  }, [displayObject, pressureMap, velocityMap, wind, bounds])

  return (
    <group ref={groupRef}>
      <primitive object={displayObject} />
    </group>
  )
}
