import { formatArea, formatCd, formatForce } from '../../lib/aeroCalculations'
import { useSimulationStore } from '../../store/simulationStore'
import { MetricCard } from '../ui/MetricCard'
import { Panel } from '../ui/Panel'
import { Sparkline } from '../ui/Sparkline'

export function ResultsDashboard() {
  const wind = useSimulationStore((s) => s.wind)
  const results = useSimulationStore((s) => s.results)
  const fps = useSimulationStore((s) => s.fps)
  const elapsed = useSimulationStore((s) => s.elapsed)
  const history = useSimulationStore((s) => s.history)

  const dragHistory = history.map((h) => h.drag)
  const cdHistory = history.map((h) => h.cd)

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-3">
      <Panel title="Results">
        <p className="mb-3 text-[10px] leading-relaxed text-neutral-600">
          Educational estimates only — not full CFD.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <MetricCard label="Wind speed" value={wind.speed.toFixed(1)} unit="m/s" />
          <MetricCard label="Cd" value={formatCd(results.dragCoefficient)} />
          <MetricCard
            label="Drag force"
            value={formatForce(results.dragForce)}
            unit="N"
          />
          <MetricCard
            label="Lift force"
            value={formatForce(results.liftForce)}
            unit="N"
            hint={results.liftForce < 0 ? 'Downforce' : undefined}
          />
          <MetricCard
            label="Downforce"
            value={formatForce(results.downforce)}
            unit="N"
          />
          <MetricCard
            label="Frontal area"
            value={formatArea(results.frontalArea)}
            unit="m²"
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-3 text-[11px]">
          <div className="flex justify-between text-neutral-500">
            <span>Re</span>
            <span className="font-mono text-neutral-300">
              {results.reynoldsNumber > 0
                ? results.reynoldsNumber.toExponential(2)
                : '—'}
            </span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span>q</span>
            <span className="font-mono text-neutral-300">
              {results.dynamicPressure.toFixed(1)} Pa
            </span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span>Time</span>
            <span className="font-mono text-neutral-300">{elapsed.toFixed(1)} s</span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span>FPS</span>
            <span className="font-mono text-neutral-300">{fps || '—'}</span>
          </div>
        </div>
      </Panel>

      <Panel title="Pressure">
        <Sparkline data={results.pressureSamples} label="Cp proxy (nose → tail)" height={52} />
      </Panel>

      <Panel title="Velocity">
        <Sparkline data={results.velocitySamples} label="V / V∞ along stream" height={52} />
      </Panel>

      {(dragHistory.length > 1 || cdHistory.length > 1) && (
        <Panel title="History">
          <Sparkline data={dragHistory} label="Drag (N)" height={44} />
          <div className="mt-3">
            <Sparkline data={cdHistory} label="Cd" height={44} />
          </div>
        </Panel>
      )}
    </div>
  )
}
