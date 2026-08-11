import './BatteryInfoHeader.css'

interface BatteryInfoHeaderBadge {
  text: string
  tone?: 'accent' | 'neutral' | 'plain'
}

interface BatteryInfoHeaderMetaItem {
  label: string
  value: string
}

interface BatteryInfoHeaderProps {
  title: string
  idLabel?: string
  badges?: BatteryInfoHeaderBadge[]
  metaItems?: BatteryInfoHeaderMetaItem[]
}

function BatteryInfoHeader({ title, idLabel, badges, metaItems }: BatteryInfoHeaderProps) {
  return (
    <div className="battery-info-header">
      <div className="battery-info-header__left">
        <div className="battery-info-header__title-row">
          <h1 className="battery-info-header__title">{title}</h1>
          {idLabel && <span className="battery-info-header__id-label">{idLabel}</span>}
        </div>
        {badges && badges.length > 0 && (
          <div className="battery-info-header__badges">
            {badges.map((badge) => (
              <span
                key={badge.text}
                className={`battery-info-header__badge battery-info-header__badge--${badge.tone ?? 'neutral'}`}
              >
                {badge.text}
              </span>
            ))}
          </div>
        )}
      </div>

      {metaItems && metaItems.length > 0 && (
        <div className="battery-info-header__meta">
          {metaItems.map((item) => (
            <div key={item.label} className="battery-info-header__meta-item">
              <span className="battery-info-header__meta-label">{item.label}</span>
              <span className="battery-info-header__meta-val">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export { BatteryInfoHeader }
