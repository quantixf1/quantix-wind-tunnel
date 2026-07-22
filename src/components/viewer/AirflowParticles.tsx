/**
 * GPU-instanced particle field for airflow / smoke visualization.
 * Particles spawn on the rotating inlet plane and advect with the wind basis.
 */

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  getWindBasis,
  isOutsideDomain,
  randomInletSeed,
  sampleFlow,
  type FlowSample,
  type WindBasis,
} from '../../lib/flowField'
import { useSimulationStore } from '../../store/simulationStore'
import type { ModelBounds } from '../../types'

const PARTICLE_COUNT = 1800
const SMOKE_COUNT = 900

function seedAllOnInlet(
  count: number,
  basis: WindBasis,
  bounds: ModelBounds,
  out: Float32Array,
): void {
  const p = new THREE.Vector3()
  for (let i = 0; i < count; i++) {
    randomInletSeed(basis, bounds, p)
    const i3 = i * 3
    out[i3] = p.x
    out[i3 + 1] = p.y
    out[i3 + 2] = p.z
  }
}

interface Props {
  mode?: 'particles' | 'smoke'
}

export function AirflowParticles({ mode = 'particles' }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const wind = useSimulationStore((s) => s.wind)
  const bounds = useSimulationStore((s) => s.bounds)
  const status = useSimulationStore((s) => s.status)
  const resetToken = useSimulationStore((s) => s.resetToken)
  const showParticles = useSimulationStore((s) => s.viz.particles)
  const showSmoke = useSimulationStore((s) => s.viz.smoke)

  const count = mode === 'smoke' ? SMOKE_COUNT : PARTICLE_COUNT
  const visible = mode === 'smoke' ? showSmoke : showParticles

  // Reseed when direction, bounds, or reset change so the inlet plane rotates
  const { positions, ages, dummy, sample } = useMemo(() => {
    const basis = getWindBasis(wind.direction)
    const positions = new Float32Array(count * 3)
    const ages = new Float32Array(count)
    seedAllOnInlet(count, basis, bounds, positions)
    for (let i = 0; i < count; i++) ages[i] = Math.random()
    return {
      positions,
      ages,
      dummy: new THREE.Object3D(),
      sample: {
        velocity: new THREE.Vector3(),
        speed: 0,
        pressure: 0,
        turbulence: 0,
        inWake: false,
      } as FlowSample,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, resetToken, bounds.width, bounds.height, bounds.length, wind.direction])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const color = new THREE.Color(0x888890)
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      dummy.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2])
      const s = mode === 'smoke' ? 0.04 + Math.random() * 0.06 : 0.018
      dummy.scale.setScalar(s)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      mesh.setColorAt(i, color)
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [count, positions, dummy, mode, resetToken, wind.direction])

  useFrame((_, dt) => {
    if (!meshRef.current || !visible) return
    const running = status === 'running' || status === 'idle'
    if (!running && status === 'paused') return

    // Recompute basis every frame so mid-slide direction changes advect correctly
    const basis = getWindBasis(wind.direction)
    const clampedDt = Math.min(dt, 0.05)
    const p = new THREE.Vector3()
    const color = new THREE.Color()

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      p.set(positions[i3], positions[i3 + 1], positions[i3 + 2])

      // sampleFlow: world → wind-space → analytic field → world velocity
      sampleFlow(p, wind, bounds, sample, basis)

      const scale = mode === 'smoke' ? 0.35 : 0.55
      p.addScaledVector(sample.velocity, clampedDt * scale)

      ages[i] += clampedDt * (mode === 'smoke' ? 0.15 : 0.25)

      // Respawn on the rotating inlet plane (not a fixed world-Z plane)
      if (isOutsideDomain(p, basis, bounds) || ages[i] > 1 || p.y < 0) {
        randomInletSeed(basis, bounds, p)
        ages[i] = 0
      }

      positions[i3] = p.x
      positions[i3 + 1] = p.y
      positions[i3 + 2] = p.z

      dummy.position.copy(p)
      if (mode === 'smoke') {
        dummy.scale.setScalar(0.05 + ages[i] * 0.1 + sample.turbulence * 0.04)
      } else {
        dummy.scale.setScalar(0.014 + (sample.speed / Math.max(wind.speed, 1)) * 0.012)
      }
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      if (meshRef.current.instanceColor) {
        if (mode === 'smoke') {
          const a = 1 - ages[i]
          color.setRGB(0.55 * a, 0.55 * a, 0.58 * a)
        } else {
          const t = Math.min(1, sample.speed / Math.max(wind.speed * 1.2, 1))
          if (sample.inWake) color.setRGB(0.45, 0.45, 0.5)
          else color.setRGB(0.35 + t * 0.5, 0.4 + t * 0.45, 0.5 + t * 0.4)
        }
        meshRef.current.setColorAt(i, color)
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  })

  if (!visible) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        transparent
        opacity={mode === 'smoke' ? 0.22 : 0.85}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  )
}
