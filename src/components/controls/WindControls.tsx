import { useSimulationStore } from '../../store/simulationStore'
import { Panel } from '../ui/Panel'
import { SliderField } from '../ui/SliderField'

export function WindControls() {
  const wind = useSimulationStore((s) => s.wind)
  const setWind = useSimulationStore((s) => s.setWind)

  return (
    <Panel title="Wind">
      <div className="space-y-4">
        <SliderField
          label="Speed"
          value={wind.speed}
          min={0}
          max={40}
          step={0.5}
          unit="m/s"
          onChange={(speed) => setWind({ speed })}
        />
        <SliderField
          label="Direction"
          value={wind.direction}
          min={0}
          max={360}
          step={1}
          unit="°"
          onChange={(direction) => setWind({ direction })}
          format={(v) => v.toFixed(0)}
        />
        <SliderField
          label="Air density"
          value={wind.density}
          min={0.8}
          max={1.4}
          step={0.005}
          unit="kg/m³"
          onChange={(density) => setWind({ density })}
          format={(v) => v.toFixed(3)}
        />
        <SliderField
          label="Turbulence"
          value={wind.turbulence}
          min={0}
          max={1}
          step={0.01}
          onChange={(turbulence) => setWind({ turbulence })}
          format={(v) => v.toFixed(2)}
        />
        <SliderField
          label="Temperature"
          value={wind.temperature}
          min={-10}
          max={45}
          step={0.5}
          unit="°C"
          onChange={(temperature) => setWind({ temperature })}
        />
        <SliderField
          label="Viscosity"
          value={wind.viscosity}
          min={1.5e-5}
          max={2.5e-5}
          step={1e-7}
          unit="Pa·s"
          onChange={(viscosity) => setWind({ viscosity })}
          format={(v) => v.toExponential(2)}
        />
      </div>
    </Panel>
  )
}
