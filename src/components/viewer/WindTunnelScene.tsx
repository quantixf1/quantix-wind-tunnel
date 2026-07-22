/**
 * Main R3F canvas scene: camera, car, airflow systems, simulation tick.
 */

import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { SceneEnvironment } from './SceneEnvironment'
import { CarModel } from './CarModel'
import { AirflowParticles } from './AirflowParticles'
import { Streamlines } from './Streamlines'
import { VelocityVectors } from './VelocityVectors'
import { WakeAndEffects } from './WakeAndEffects'
import { ForceArrows } from './ForceArrows'
import { useSimulationStore } from '../../store/simulationStore'

interface SceneProps {
  model: THREE.Object3D | null
}

function SimulationTicker() {
  const tick = useSimulationStore((s) => s.tick)
  const setFps = useSimulationStore((s) => s.setFps)
  const frames = useRef(0)
  const last = useRef(performance.now())

  useFrame((_, dt) => {
    tick(dt)
    frames.current += 1
    const now = performance.now()
    if (now - last.current >= 500) {
      setFps(Math.round((frames.current * 1000) / (now - last.current)))
      frames.current = 0
      last.current = now
    }
  })

  return null
}

function CanvasCapture() {
  const { gl } = useThree()
  const setGlCanvas = useSimulationStore((s) => s.setGlCanvas)

  useEffect(() => {
    setGlCanvas(gl.domElement)
    return () => setGlCanvas(null)
  }, [gl, setGlCanvas])

  return null
}

function Cameras() {
  const mode = useSimulationStore((s) => s.cameraMode)
  return (
    <>
      {mode === 'perspective' ? (
        <PerspectiveCamera makeDefault position={[2.8, 1.6, 3.2]} fov={42} near={0.05} far={100} />
      ) : (
        <OrthographicCamera makeDefault position={[3, 2, 3]} zoom={90} near={-50} far={100} />
      )}
    </>
  )
}

function SceneContent({ model }: SceneProps) {
  return (
    <>
      <Cameras />
      <CanvasCapture />
      <SimulationTicker />
      <SceneEnvironment />
      <Suspense fallback={null}>
        <CarModel model={model} />
      </Suspense>
      <Streamlines />
      <AirflowParticles mode="particles" />
      <AirflowParticles mode="smoke" />
      <VelocityVectors />
      <WakeAndEffects />
      <ForceArrows />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={0.8}
        maxDistance={16}
        maxPolarAngle={Math.PI * 0.49}
        target={[0, 0.25, 0]}
      />
    </>
  )
}

export function WindTunnelScene({ model }: SceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true, // required for screenshots
      }}
      className="h-full w-full touch-none"
      onCreated={({ gl }) => {
        gl.setClearColor('#0a0a0b')
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
      }}
    >
      <SceneContent model={model} />
    </Canvas>
  )
}
