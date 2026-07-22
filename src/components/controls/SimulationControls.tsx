import { exportResultsCsv, exportResultsJson, exportScreenshot } from '../../lib/exportUtils'
import { useSimulationStore } from '../../store/simulationStore'
import { Panel } from '../ui/Panel'

export function SimulationControls() {
  const status = useSimulationStore((s) => s.status)
  const start = useSimulationStore((s) => s.start)
  const pause = useSimulationStore((s) => s.pause)
  const reset = useSimulationStore((s) => s.reset)
  const wind = useSimulationStore((s) => s.wind)
  const results = useSimulationStore((s) => s.results)
  const history = useSimulationStore((s) => s.history)
  const modelMeta = useSimulationStore((s) => s.modelMeta)
  const glCanvas = useSimulationStore((s) => s.glCanvas)

  const onExportResults = (format: 'json' | 'csv') => {
    const payload = {
      app: 'Quantix Virtual Wind Tunnel',
      disclaimer:
        'Estimates only — simplified educational CFD approximations, not engineering-grade Navier–Stokes solutions.',
      exportedAt: new Date().toISOString(),
      model: modelMeta,
      wind,
      results,
      history,
    }
    if (format === 'json') exportResultsJson(payload)
    else exportResultsCsv(payload)
  }

  const btn =
    'rounded border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-neutral-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <Panel title="Simulation">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={btn}
          disabled={status === 'running'}
          onClick={start}
        >
          Start
        </button>
        <button
          type="button"
          className={btn}
          disabled={status !== 'running'}
          onClick={pause}
        >
          Pause
        </button>
        <button type="button" className={btn} onClick={reset}>
          Reset
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-white/[0.06] pt-3">
        <button
          type="button"
          className={btn}
          onClick={() => exportScreenshot(glCanvas)}
        >
          Screenshot
        </button>
        <button type="button" className={btn} onClick={() => onExportResults('json')}>
          Export JSON
        </button>
        <button type="button" className={btn} onClick={() => onExportResults('csv')}>
          Export CSV
        </button>
      </div>
    </Panel>
  )
}
