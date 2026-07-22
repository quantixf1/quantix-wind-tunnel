/**
 * Sparse velocity vector field sampled on a wind-aligned grid.
 * Sample points and velocities both follow the shared wind basis.
 */

import { useMemo } from 'react'
import * as THREE from 'three'
import {
  getWindBasis,
  sampleFlow,
  windGridToWorld,
} from '../../lib/flowField'
import { useSimulationStore } from '../../store/simulationStore'

export function VelocityVectors() {
  const wind = useSimulationStore((s) => s.wind)
  const bounds = useSimulationStore((s) => s.bounds)
  const enabled = useSimulationStore((s) => s.viz.vectors)

  const arrows = useMemo(() => {
    const basis = getWindBasis(wind.direction)
    const items: {
      origin: THREE.Vector3
      dir: THREE.Vector3
      length: number
      color: THREE.Color
    }[] = []

    const nLat = 5
    const nVert = 3
    const nStream = 6
    const sample = {
      velocity: new THREE.Vector3(),
      speed: 0,
      pressure: 0,
      turbulence: 0,
      inWake: false,
    }
    const origin = new THREE.Vector3()

    for (let il = 0; il < nLat; il++) {
      for (let iv = 0; iv < nVert; iv++) {
        for (let is = 0; is < nStream; is++) {
          const lateral = (il / Math.max(nLat - 1, 1) - 0.5) * bounds.width * 2.4
          const vertical = 0.08 + (iv / Math.max(nVert - 1, 1)) * bounds.height * 2
          // Streamwise along forward: slightly upstream → downstream
          const streamwise =
            -bounds.length * 0.7 + (is / Math.max(nStream - 1, 1)) * bounds.length * 1.6

          windGridToWorld(basis, lateral, vertical, streamwise, origin)
          sampleFlow(origin, wind, bounds, sample, basis)
          if (sample.speed < 0.05) continue

          // Velocity already transformed to world space by sampleFlow
          const dir = sample.velocity.clone().normalize()
          const length = 0.08 + (sample.speed / Math.max(wind.speed, 1)) * 0.18
          const t = Math.min(1, sample.speed / Math.max(wind.speed * 1.2, 1))
          const color = new THREE.Color().setRGB(
            0.4 + t * 0.4,
            0.42 + t * 0.35,
            0.48 + t * 0.35,
          )
          items.push({ origin: origin.clone(), dir, length, color })
        }
      }
    }
    return items
  }, [wind, bounds])

  if (!enabled) return null

  return (
    <group>
      {arrows.map((a, i) => (
        <arrowHelper
          key={i}
          args={[a.dir, a.origin, a.length, a.color.getHex(), a.length * 0.35, a.length * 0.2]}
        />
      ))}
    </group>
  )
}
