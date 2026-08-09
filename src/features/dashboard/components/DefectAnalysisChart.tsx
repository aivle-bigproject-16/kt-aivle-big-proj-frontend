import { useEffect, useRef, useState } from 'react'
// 1200 기준 구 CSS는 history/DefectAnalysisChart.css로 이동됨 — 1400 기준으로 새로 만들 것
import { useDashboardStore } from '@/features/dashboard/store/useDashboardStore'
import type { GraphDataItem, GraphType } from '@/features/dashboard/types'

// 8-hue 고정 순서 카테고리 팔레트(색맹 안전성 검증됨) — slot 1부터 순서대로 배정
const SLICE_COLORS = ['#eb6834', '#eda100', '#e87ba4', '#e34948', '#2a78d6', '#1baf7a', '#008300', '#4a3aa7']
const LINE_COLOR = SLICE_COLORS[0]

function getReadableTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#191c1d' : '#ffffff'
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) }
}

function describeSlice(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle)
  const end = polarToCartesian(cx, cy, r, endAngle)
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`
}

function formatDateLabel(label: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(label) ? label.slice(5) : label
}

function DefectCausePie({ data }: { data: GraphDataItem[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const cx = 100
  const cy = 100
  const r = 96
  let cursorAngle = 0

  const slices = data.map((item, index) => {
    const ratio = total > 0 ? item.value / total : 0
    const startAngle = cursorAngle
    const endAngle = cursorAngle + ratio * 360
    cursorAngle = endAngle

    const midAngle = (startAngle + endAngle) / 2
    const labelPos = polarToCartesian(cx, cy, r * 0.7, midAngle)
    const color = SLICE_COLORS[index % SLICE_COLORS.length]

    return {
      label: item.label,
      value: item.value,
      percent: Math.round(ratio * 1000) / 10,
      color,
      path: describeSlice(cx, cy, r, startAngle, endAngle),
      labelPos,
      textColor: getReadableTextColor(color),
    }
  })

  return (
    <div className="defect-analysis-chart__body">
      <svg
        className="defect-analysis-chart__pie-svg"
        viewBox="0 0 200 200"
        role="img"
        aria-label="불량 원인별 분포 파이 차트"
      >
        {slices.map((slice) => (
          <path key={slice.label} d={slice.path} fill={slice.color} stroke="#fff" strokeWidth={2}>
            <title>{`${slice.label}: ${slice.value}건 (${slice.percent}%)`}</title>
          </path>
        ))}
        {slices.map((slice) =>
          slice.percent >= 8 ? (
            <text
              key={`${slice.label}-label`}
              x={slice.labelPos.x}
              y={slice.labelPos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="defect-analysis-chart__slice-label"
              fill={slice.textColor}
            >
              {slice.percent}%
            </text>
          ) : null,
        )}
      </svg>
      <ul className="defect-analysis-chart__legend">
        {slices.map((slice) => (
          <li key={slice.label} className="defect-analysis-chart__legend-item">
            <span className="defect-analysis-chart__legend-dot" style={{ background: slice.color }} />
            <span className="defect-analysis-chart__legend-label">{slice.label}</span>
            <span className="defect-analysis-chart__legend-value">
              {slice.value}건 ({slice.percent}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function DailyTrendLine({ data }: { data: GraphDataItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  // viewBox 폭을 실제 렌더링 폭(px)과 1:1로 맞춰서, SVG의 기본 스케일링(meet)이
  // 좌우에 여백을 만들지 않고 카드 폭에 꽉 차게 그려지도록 한다.
  const [width, setWidth] = useState(300)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      const measured = entries[0]?.contentRect.width
      if (measured) setWidth(measured)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const height = 220
  const margin = { top: 20, right: 12, bottom: 24, left: 12 }
  const plotWidth = width - margin.left - margin.right
  const plotHeight = height - margin.top - margin.bottom
  const maxValue = Math.max(...data.map((item) => item.value), 1) * 1.2
  const baselineY = margin.top + plotHeight

  const points = data.map((item, index) => {
    const x = margin.left + (data.length > 1 ? (index / (data.length - 1)) * plotWidth : plotWidth / 2)
    const y = margin.top + plotHeight - (item.value / maxValue) * plotHeight
    return { x, y, label: item.label, value: item.value }
  })

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <div className="defect-analysis-chart__body" ref={containerRef}>
      <svg
        className="defect-analysis-chart__line-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="날짜별 불량 추이 라인 차트"
      >
        <line
          x1={margin.left}
          y1={baselineY}
          x2={width - margin.right}
          y2={baselineY}
          className="defect-analysis-chart__axis-line"
        />
        <polyline points={polylinePoints} className="defect-analysis-chart__trend-line" stroke={LINE_COLOR} />
        {points.map((p) => (
          <g key={p.label}>
            <circle cx={p.x} cy={p.y} r={4} fill={LINE_COLOR} className="defect-analysis-chart__trend-dot">
              <title>{`${p.label}: ${p.value}건`}</title>
            </circle>
            <text x={p.x} y={p.y - 10} textAnchor="middle" className="defect-analysis-chart__trend-value">
              {p.value}
            </text>
            <text x={p.x} y={baselineY + 16} textAnchor="middle" className="defect-analysis-chart__trend-axis-label">
              {formatDateLabel(p.label)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function DefectAnalysisChart() {
  const [chartType, setChartType] = useState<GraphType>('DEFECT_TYPE')
  const graphData = useDashboardStore((s) => s.graphData)
  const { fetchDashboard } = useDashboardStore((s) => s.actions)

  useEffect(() => {
    const todayDate = new Date().toISOString().slice(0, 10)
    const startDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    fetchDashboard({ todayDate, startDate, size: 5, graphType: chartType })
  }, [chartType, fetchDashboard])

  return (
    <div className="defect-analysis-chart">
      <div className="defect-analysis-chart__header">
        <h4 className="defect-analysis-chart__title">불량 분석</h4>
        <select
          className="defect-analysis-chart__select"
          value={chartType}
          onChange={(e) => setChartType(e.target.value as GraphType)}
        >
          <option value="DEFECT_TYPE">불량 원인 파이 차트</option>
          <option value="DAILY_TREND">날짜별 불량 추이</option>
        </select>
      </div>
      {graphData.length === 0 ? (
        <div className="defect-analysis-chart__body defect-analysis-chart__body--empty">
          <p className="defect-analysis-chart__empty">데이터가 없습니다.</p>
        </div>
      ) : chartType === 'DEFECT_TYPE' ? (
        <DefectCausePie data={graphData} />
      ) : (
        <DailyTrendLine data={graphData} />
      )}
    </div>
  )
}

export { DefectAnalysisChart }
