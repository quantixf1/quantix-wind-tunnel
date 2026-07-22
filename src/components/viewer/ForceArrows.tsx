/**
 * Drag / downforce arrows overlaid on the car for teaching force balance.
 */

import { useMemo } from 'react'
import * as THREE from 'three'
import { getWindBasis } from '../../lib/flowField'
import { useSimulationStore } from '../../store/simulationStore'

export function ForceArrows() {
  const enabled = useSimulationStore((s) => s.viz.forceArrows)
  const results = useSimulationStore((s) => s.results)
  const bounds = useSimulationStore((s) => s.bounds)
  const wind = useSimulationStore((s) => s.wind)

  const { dragLen, liftLen, dragDir, liftDir, origin } = useMemo(() => {
    const maxF = Math.max(Math.abs(results.dragForce), Math.abs(results.liftForce), 0.01)
    const scale = 0.6 / maxF
    // Drag aligns with free-stream via shared wind basis (no duplicated yaw math)
    const { forward } = getWindBasis(wind.direction)
    const dragDir = forward.clone()
    const liftDir = new THREE.Vector3(0, results.liftForce >= 0 ? 1 : -1, 0)
    return {
      dragLen: Math.min(1.2, Math.max(0.12, results.dragForce * scale)),
      liftLen: Math.min(1.0, Math.max(0.1, Math.abs(results.liftForce) * scale)),
      dragDir,
      liftDir,
      origin: new THREE.Vector3(0, bounds.height * 0.6, 0),
    }
  }, [results, bounds, wind.direction])

  if (!enabled || wind.speed < 0.1) return null

  return (
    <group>
      {/* Drag — streamwise */}
      <arrowHelper
        args={[dragDir, origin, dragLen, 0xb0b0b8, dragLen * 0.22, dragLen * 0.12]}
      />
      {/* Lift / downforce — vertical */}
      <arrowHelper
        args={[liftDir, origin, liftLen, 0x888890, liftLen * 0.22, liftLen * 0.12]}
      />
    </group>
  )
}
