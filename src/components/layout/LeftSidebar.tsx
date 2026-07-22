import type * as THREE from 'three'
import { ModelUpload } from '../controls/ModelUpload'
import { WindControls } from '../controls/WindControls'
import { VisualizationControls } from '../controls/VisualizationControls'
import { SimulationControls } from '../controls/SimulationControls'

interface LeftSidebarProps {
  onModelLoaded: (object: THREE.Object3D) => void
}

export function LeftSidebar({ onModelLoaded }: LeftSidebarProps) {
  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-r border-white/[0.06] bg-[#09090b]">
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <ModelUpload onModelLoaded={onModelLoaded} />
        <WindControls />
        <VisualizationControls />
        <SimulationControls />
      </div>
    </aside>
  )
}
