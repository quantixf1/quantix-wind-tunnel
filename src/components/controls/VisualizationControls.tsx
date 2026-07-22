import { useSimulationStore } from '../../store/simulationStore'
import { Panel } from '../ui/Panel'
import { Toggle } from '../ui/Toggle'

export function VisualizationControls() {
  const viz = useSimulationStore((s) => s.viz)
  const setViz = useSimulationStore((s) => s.setViz)
  const cameraMode = useSimulationStore((s) => s.cameraMode)
  const setCameraMode = useSimulationStore((s) => s.setCameraMode)

  return (
    <Panel title="Visualization">
      <div className="mb-3 flex gap-1 rounded-md border border-white/[0.06] bg-white/[0.02] p-0.5">
        {(['perspective', 'orthographic'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setCameraMode(mode)}
            className={`flex-1 rounded px-2 py-1.5 text-[11px] capitalize transition ${
              cameraMode === mode
                ? 'bg-white/[0.08] text-neutral-100'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="divide-y divide-white/[0.04]">
        <Toggle
          label="Streamlines"
          checked={viz.streamlines}
          onChange={(streamlines) => setViz({ streamlines })}
        />
        <Toggle
          label="Particles"
          checked={viz.particles}
          onChange={(particles) => setViz({ particles })}
        />
        <Toggle
          label="Velocity vectors"
          checked={viz.vectors}
          onChange={(vectors) => setViz({ vectors })}
        />
        <Toggle
          label="Pressure map"
          checked={viz.pressureMap}
          onChange={(pressureMap) => setViz({ pressureMap, velocityMap: pressureMap ? false : viz.velocityMap })}
        />
        <Toggle
          label="Velocity map"
          checked={viz.velocityMap}
          onChange={(velocityMap) => setViz({ velocityMap, pressureMap: velocityMap ? false : viz.pressureMap })}
        />
        <Toggle
          label="Wake"
          checked={viz.wake}
          onChange={(wake) => setViz({ wake })}
        />
        <Toggle
          label="Separation"
          checked={viz.separation}
          onChange={(separation) => setViz({ separation })}
        />
        <Toggle
          label="Turbulence regions"
          checked={viz.turbulence}
          onChange={(turbulence) => setViz({ turbulence })}
        />
        <Toggle
          label="Smoke mode"
          checked={viz.smoke}
          onChange={(smoke) => setViz({ smoke })}
        />
        <Toggle
          label="Force arrows"
          checked={viz.forceArrows}
          onChange={(forceArrows) => setViz({ forceArrows })}
        />
        <Toggle
          label="Wireframe"
          checked={viz.wireframe}
          onChange={(wireframe) => setViz({ wireframe })}
        />
        <Toggle
          label="Grid"
          checked={viz.grid}
          onChange={(grid) => setViz({ grid })}
        />
      </div>
    </Panel>
  )
}
