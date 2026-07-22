import { useSimulationStore } from '../../store/simulationStore'

export function Header() {
  const status = useSimulationStore((s) => s.status)
  const fps = useSimulationStore((s) => s.fps)
  const modelMeta = useSimulationStore((s) => s.modelMeta)

  const statusLabel =
    status === 'running' ? 'Running' : status === 'paused' ? 'Paused' : 'Idle'

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#09090b]/95 px-5">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-white/[0.04]">
            <span className="text-[10px] font-semibold tracking-tight text-neutral-200">Q</span>
          </div>
          <div>
            <div className="text-[13px] font-medium tracking-tight text-neutral-100">
              Quantix
            </div>
            <div className="-mt-0.5 text-[10px] tracking-[0.08em] text-neutral-500">
              VIRTUAL WIND TUNNEL
            </div>
          </div>
        </div>
        <div className="hidden h-5 w-px bg-white/[0.08] sm:block" />
        <p className="hidden max-w-md text-[11px] text-neutral-500 sm:block">
          Simplified aerodynamic estimates for F1 in Schools education
        </p>
      </div>

      <div className="flex items-center gap-4 text-[11px]">
        <div className="hidden items-center gap-2 text-neutral-500 md:flex">
          <span className="text-neutral-600">Model</span>
          <span className="max-w-[160px] truncate font-mono text-neutral-300">
            {modelMeta?.name ?? '—'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              status === 'running'
                ? 'bg-neutral-200'
                : status === 'paused'
                  ? 'bg-neutral-500'
                  : 'bg-neutral-700'
            }`}
          />
          <span className="text-neutral-400">{statusLabel}</span>
        </div>
        <div className="font-mono tabular-nums text-neutral-500">
          {fps > 0 ? `${fps} FPS` : '— FPS'}
        </div>
      </div>
    </header>
  )
}
