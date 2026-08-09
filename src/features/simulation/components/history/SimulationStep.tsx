// 1200 기준 구 CSS는 history/Simulation.css로 이동됨 — 1400 기준으로 새로 만들 것

interface SimulationStepProps {
  label: string
  value: string
  valueColor?: string
  caption: string
  dotVariant: 'filled-dark' | 'filled-accent' | 'outline'
  active?: boolean
}

function SimulationStep({ label, value, valueColor, caption, dotVariant, active }: SimulationStepProps) {
  const dotClassName = `simulation-step__dot simulation-step__dot--${
    dotVariant === 'outline' ? 'outline' : dotVariant === 'filled-accent' ? 'accent' : 'dark'
  }`

  return (
    <div className={`simulation-step${active ? ' simulation-step--active' : ''}`}>
      <div className="simulation-step__header">
        <span className={dotClassName} />
        <span className="simulation-step__label">{label}</span>
      </div>
      <span className="simulation-step__value" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </span>
      <span className="simulation-step__caption">{caption}</span>
    </div>
  )
}

export { SimulationStep }
