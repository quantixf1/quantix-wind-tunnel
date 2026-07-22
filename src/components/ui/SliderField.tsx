interface SliderFieldProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (v: number) => void
  format?: (v: number) => string
}

export function SliderField({
  label,
  value,
  min,
  max,
  step = 0.1,
  unit,
  onChange,
  format,
}: SliderFieldProps) {
  const display = format ? format(value) : value.toFixed(step < 1 ? 2 : 0)

  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[11px] text-neutral-400">{label}</span>
        <span className="font-mono text-[11px] tabular-nums text-neutral-200">
          {display}
          {unit ? ` ${unit}` : ''}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="q-slider w-full"
      />
    </label>
  )
}
