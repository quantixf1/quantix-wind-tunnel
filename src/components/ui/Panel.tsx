import type { ReactNode } from 'react'

interface PanelProps {
  title?: string
  children: ReactNode
  className?: string
  action?: ReactNode
}

/** Minimal bordered panel with optional title row */
export function Panel({ title, children, className = '', action }: PanelProps) {
  return (
    <section
      className={`rounded-lg border border-white/[0.08] bg-[#0c0c0e]/90 ${className}`}
    >
      {title && (
        <header className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">
            {title}
          </h2>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}
