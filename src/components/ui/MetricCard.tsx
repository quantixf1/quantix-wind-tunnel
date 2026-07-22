interface MetricCardProps {
  label: string
  value: string
  unit?: string
  hint?: string
}

export function MetricCard({ label, value, unit, hint }: MetricCardProps) {
  return (
    <div className="rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="font-mono text-lg tabular-nums text-neutral-100">{value}</span>
        {unit && <span className="text-[11px] text-neutral-500">{unit}</span>}
      </div>
      {hint && <div className="mt-0.5 text-[10px] text-neutral-600">{hint}</div>}
    </div>
  )
}
