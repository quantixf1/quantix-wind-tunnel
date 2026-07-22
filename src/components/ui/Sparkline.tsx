interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  className?: string
  label?: string
}

/** Lightweight SVG sparkline for pressure/velocity samples */
export function Sparkline({
  data,
  width = 200,
  height = 48,
  className = '',
  label,
}: SparklineProps) {
  if (!data.length) {
    return (
      <div className={`flex h-12 items-center text-[11px] text-neutral-600 ${className}`}>
        No data
      </div>
    )
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = 2

  const points = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (width - pad * 2)
      const y = pad + (1 - (v - min) / range) * (height - pad * 2)
      return `${x},${y}`
    })
    .join(' ')

  // Area fill path
  const area = `M ${pad},${height - pad} L ${points} L ${width - pad},${height - pad} Z`

  return (
    <div className={className}>
      {label && (
        <div className="mb-1 flex justify-between text-[10px] uppercase tracking-[0.1em] text-neutral-500">
          <span>{label}</span>
          <span className="font-mono normal-case tracking-normal text-neutral-600">
            {min.toFixed(2)} … {max.toFixed(2)}
          </span>
        </div>
      )}
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
        preserveAspectRatio="none"
        style={{ height }}
      >
        <path d={area} fill="rgba(255,255,255,0.04)" />
        <polyline
          points={points}
          fill="none"
          stroke="rgba(220,220,225,0.75)"
          strokeWidth="1.25"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
