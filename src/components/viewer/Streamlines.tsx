/**
 * Animated streamlines seeded on an inlet plane perpendicular to the wind.
 * Seeds and integration both use the shared wind basis (forward / right / up).
 */

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  defaultInletDistance,
  getWindBasis,
  inletSeed,
  integrateStreamline,
} from '../../lib/flowField'
import { useSimulationStore } from '../../store/simulationStore'

const LINE_COUNT = 28
const SEGMENTS = 64

export function Streamlines() {
  const groupRef = useRef<THREE.Group>(null)
  const wind = useSimulationStore((s) => s.wind)
  const bounds = useSimulationStore((s) => s.bounds)
  const enabled = useSimulationStore((s) => s.viz.streamlines)
  const status = useSimulationStore((s) => s.status)
  const resetToken = useSimulationStore((s) => s.resetToken)

  const lineObjects = useMemo(() => {
    // Single basis for seeding + integration — rotates the whole streamline field
    const basis = getWindBasis(wind.direction)
    const inletDist = defaultInletDistance(bounds)
    const result: THREE.Line[] = []
    const cols = 7
    const rows = 4
    let idx = 0
    const seed = new THREE.Vector3()

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (idx >= LINE_COUNT) break

        // Inlet plane: forward * inletDist + right * lateral + up * vertical
        const lateral = (c / Math.max(cols - 1, 1) - 0.5) * bounds.width * 2.8
        const vertical = 0.05 + (r / Math.max(rows - 1, 1)) * bounds.height * 2.2
        inletSeed(basis, inletDist, lateral, vertical, seed)

        const points = integrateStreamline(seed, wind, bounds, SEGMENTS, 0.05, basis)
        const fallbackEnd = seed.clone().addScaledVector(basis.forward, 0.15)
        const geometry = new THREE.BufferGeometry().setFromPoints(
          points.length >= 2 ? points : [seed.clone(), fallbackEnd],
        )

        const n = Math.max(points.length, 2)
        const colors = new Float32Array(n * 3)
        for (let i = 0; i < n; i++) {
          const t = i / Math.max(n - 1, 1)
          const v = 0.35 + t * 0.45
          colors[i * 3] = v
          colors[i * 3 + 1] = v
          colors[i * 3 + 2] = v + 0.05
        }
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

        const material = new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
          toneMapped: false,
        })
        result.push(new THREE.Line(geometry, material))
        idx++
      }
    }
    return result
    // Rebuild when wind direction (or other flow drivers) change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    wind.speed,
    wind.direction,
    wind.turbulence,
    bounds.width,
    bounds.height,
    bounds.length,
    resetToken,
  ])

  useEffect(() => {
    return () => {
      lineObjects.forEach((line) => {
        line.geometry.dispose()
        ;(line.material as THREE.Material).dispose()
      })
    }
  }, [lineObjects])

  useFrame(({ clock }) => {
    if (!groupRef.current || !enabled) return
    if (status === 'paused') return
    const t = clock.elapsedTime
    groupRef.current.children.forEach((child, i) => {
      const line = child as THREE.Line
      const mat = line.material as THREE.LineBasicMaterial
      if (mat) {
        mat.opacity = 0.35 + 0.25 * Math.sin(t * 1.5 + i * 0.4)
      }
    })
  })

  if (!enabled) return null

  return (
    <group ref={groupRef}>
      {lineObjects.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
    </group>
  )
}
