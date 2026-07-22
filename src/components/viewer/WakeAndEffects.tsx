/**
 * Wake volume, separation markers, and turbulence region indicators.
 * All placed with the shared wind basis so the wake stays downstream of the wind.
 */

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getWindBasis, inletSeed } from '../../lib/flowField'
import { useSimulationStore } from '../../store/simulationStore'

export function WakeAndEffects() {
  const wakeRef = useRef<THREE.Mesh>(null)
  const turbRef = useRef<THREE.Points>(null)
  const bounds = useSimulationStore((s) => s.bounds)
  const wind = useSimulationStore((s) => s.wind)
  const viz = useSimulationStore((s) => s.viz)
  const status = useSimulationStore((s) => s.status)

  const basis = useMemo(() => getWindBasis(wind.direction), [wind.direction])

  // Align cone default +Y with wind forward (downstream)
  const wakeQuaternion = useMemo(() => {
    const q = new THREE.Quaternion()
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), basis.forward)
    return q
  }, [basis])

  const wakePosition = useMemo(() => {
    // Downstream of car centre, raised slightly
    return inletSeed(
      basis,
      bounds.length * 0.55,
      0,
      bounds.height * 0.45,
    )
  }, [basis, bounds])

  const separationAnchors = useMemo(() => {
    const rear = bounds.length * 0.42
    const y = bounds.height * 0.5
    const halfW = bounds.width * 0.4
    return [
      inletSeed(basis, rear, -halfW, y),
      inletSeed(basis, rear, halfW, y),
      inletSeed(basis, rear, 0, y + bounds.height * 0.15),
    ]
  }, [basis, bounds])

  const turbPositions = useMemo(() => {
    const n = 120
    const arr = new Float32Array(n * 3)
    const p = new THREE.Vector3()
    for (let i = 0; i < n; i++) {
      const stream = bounds.length * 0.35 + Math.random() * bounds.length * 0.95
      const lateral = (Math.random() - 0.5) * bounds.width * 1.4
      const vertical = 0.05 + Math.random() * bounds.height * 1.5
      inletSeed(basis, stream, lateral, vertical, p)
      arr[i * 3] = p.x
      arr[i * 3 + 1] = p.y
      arr[i * 3 + 2] = p.z
    }
    return arr
  }, [basis, bounds])

  useFrame(({ clock }) => {
    if (status === 'paused') return
    const t = clock.elapsedTime
    if (wakeRef.current) {
      wakeRef.current.scale.x = 1 + Math.sin(t * 1.2) * 0.04 * wind.turbulence
      wakeRef.current.scale.z = 1 + Math.cos(t * 0.9) * 0.05
      const mat = wakeRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.06 + wind.turbulence * 0.08 + Math.sin(t * 2) * 0.015
    }
    if (turbRef.current && viz.turbulence) {
      const pos = turbRef.current.geometry.attributes.position as THREE.BufferAttribute
      // Gentle jitter in world Y / along right — stays near wake
      for (let i = 0; i < pos.count; i++) {
        pos.setX(i, pos.getX(i) + Math.sin(t * 3 + i) * 0.001 * basis.right.x)
        pos.setY(i, pos.getY(i) + Math.cos(t * 2.5 + i * 0.5) * 0.002)
        pos.setZ(i, pos.getZ(i) + Math.sin(t * 3 + i) * 0.001 * basis.right.z)
      }
      pos.needsUpdate = true
    }
  })

  return (
    <group>
      {viz.wake && (
        <mesh
          ref={wakeRef}
          position={wakePosition}
          quaternion={wakeQuaternion}
        >
          <coneGeometry args={[bounds.width * 0.55, bounds.length * 1.1, 16, 1, true]} />
          <meshBasicMaterial
            color="#6a6a72"
            transparent
            opacity={0.1}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {viz.separation && (
        <group>
          {separationAnchors.map((pos, i) => (
            <mesh key={i} position={pos}>
              <sphereGeometry args={[i === 2 ? 0.05 : 0.06, 12, 12]} />
              <meshBasicMaterial
                color={i === 2 ? '#8a8a92' : '#9a9aa2'}
                transparent
                opacity={0.7}
              />
            </mesh>
          ))}
        </group>
      )}

      {viz.turbulence && (
        <points ref={turbRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[turbPositions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={0.035}
            color="#7a7a84"
            transparent
            opacity={0.55}
            depthWrite={false}
            sizeAttenuation
          />
        </points>
      )}
    </group>
  )
}
