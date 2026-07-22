interface ToggleProps {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}

export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-md px-1 py-1.5 text-left transition-colors hover:bg-white/[0.03]"
    >
      <span className="text-[12px] text-neutral-300">{label}</span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors ${
          checked
            ? 'border-neutral-400 bg-neutral-200'
            : 'border-white/10 bg-white/[0.06]'
        }`}
      >
        <span
          className={`absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all ${
            checked ? 'left-[18px] bg-neutral-900' : 'left-0.5 bg-neutral-500'
          }`}
        />
      </span>
    </button>
  )
}
