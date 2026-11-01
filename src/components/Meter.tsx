interface MeterProps {
  value: number
  max: number
  className: string
}

export function Meter({ value, max, className }: MeterProps) {
  const pct = max > 0 ? (value / max) * 100 : 0

  return (
    <div className={`meter ${className}`} aria-hidden="true">
      <div className="meter-fill" style={{ width: `${pct}%` }} />
    </div>
  )
}
