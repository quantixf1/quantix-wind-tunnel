/**
 * Lighting, grid, ground plane, and soft sky backdrop.
 */

import { Grid, SoftShadows } from '@react-three/drei'
import { useSimulationStore } from '../../store/simulationStore'

export function SceneEnvironment() {
  const showGrid = useSimulationStore((s) => s.viz.grid)

  return (
    <>
      <color attach="background" args={['#0a0a0b']} />
      <fog attach="fog" args={['#0a0a0b', 8, 28]} />

      {/* Soft engineering-bay lighting */}
      <ambientLight intensity={0.35} />
      <directionalLight
        castShadow
        position={[4, 8, 3]}
        intensity={1.1}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={30}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <directionalLight position={[-3, 4, -2]} intensity={0.25} />
      <hemisphereLight args={['#1a1a1e', '#0a0a0b', 0.4]} />

      <SoftShadows size={12} samples={8} focus={0.5} />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#0e0e10" metalness={0.1} roughness={0.9} />
      </mesh>

      {showGrid && (
        <Grid
          position={[0, 0.002, 0]}
          args={[20, 20]}
          cellSize={0.25}
          cellThickness={0.6}
          cellColor="#1c1c1f"
          sectionSize={1}
          sectionThickness={1}
          sectionColor="#2a2a2e"
          fadeDistance={18}
          fadeStrength={1.5}
          infiniteGrid
        />
      )}

      {/* Subtle horizon band */}
      <mesh position={[0, 4, -12]}>
        <planeGeometry args={[40, 10]} />
        <meshBasicMaterial color="#101012" transparent opacity={0.5} />
      </mesh>
    </>
  )
}
