import { useCallback, useState } from 'react'
import type * as THREE from 'three'
import { Header } from './components/layout/Header'
import { LeftSidebar } from './components/layout/LeftSidebar'
import { ResultsDashboard } from './components/layout/ResultsDashboard'
import { WindTunnelScene } from './components/viewer/WindTunnelScene'
import { LevaSync } from './components/controls/LevaSync'

/**
 * Quantix Virtual Wind Tunnel
 * Browser-based educational aero visualizer for F1 in Schools cars.
 */
export default function App() {
  const [model, setModel] = useState<THREE.Object3D | null>(null)

  const onModelLoaded = useCallback((object: THREE.Object3D) => {
    setModel(object)
  }, [])

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-[#08080a] text-neutral-200 antialiased">
      <LevaSync />
      <Header />

      <div className="flex min-h-0 flex-1">
        <LeftSidebar onModelLoaded={onModelLoaded} />

        <main className="relative min-w-0 flex-1 bg-[#0a0a0b]">
          <WindTunnelScene model={model} />

          {/* Viewport hint */}
          <div className="pointer-events-none absolute bottom-3 left-3 rounded border border-white/[0.06] bg-[#0c0c0e]/80 px-2.5 py-1.5 text-[10px] text-neutral-500 backdrop-blur-sm">
            Orbit · Scroll zoom · Right-drag pan
          </div>
        </main>

        <aside className="hidden h-full w-[280px] shrink-0 border-l border-white/[0.06] bg-[#09090b] lg:block">
          <ResultsDashboard />
        </aside>
      </div>

      {/* Mobile results strip */}
      <div className="border-t border-white/[0.06] bg-[#09090b] lg:hidden">
        <div className="max-h-40 overflow-y-auto">
          <ResultsDashboard />
        </div>
      </div>
    </div>
  )
}
