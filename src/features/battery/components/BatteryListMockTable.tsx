import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useBatteryListStore } from '../store/useBatteryListStore'

const cellStyle: React.CSSProperties = {
  border: '1px solid #ccc',
  padding: '8px 12px',
  textAlign: 'left',
}

function BatteryListMockTable() {
  const list = useBatteryListStore((s) => s.list)
  const isLoading = useBatteryListStore((s) => s.isLoading)
  const error = useBatteryListStore((s) => s.error)
  const { fetchList } = useBatteryListStore((s) => s.actions)

  useEffect(() => {
    fetchList({ page: 0, size: 10000 })
  }, [fetchList])

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>배터리 목록 (목업 페이지)</h1>

      {isLoading && <p>로딩 중...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={cellStyle}>batteryCellId</th>
            <th style={cellStyle}>cellSerialNo</th>
            <th style={cellStyle}>modelName</th>
            <th style={cellStyle}>cellType</th>
            <th style={cellStyle}>latestFinalLabel</th>
            <th style={cellStyle}>latestAnalyzedAt</th>
            <th style={cellStyle}>상세</th>
          </tr>
        </thead>
        <tbody>
          {list.map((item) => (
            <tr key={item.batteryCellId}>
              <td style={cellStyle}>{item.batteryCellId}</td>
              <td style={cellStyle}>{item.cellSerialNo}</td>
              <td style={cellStyle}>{item.modelName}</td>
              <td style={cellStyle}>{item.cellType}</td>
              <td style={cellStyle}>{item.latestFinalLabel}</td>
              <td style={cellStyle}>{item.latestAnalyzedAt}</td>
              <td style={cellStyle}>
                <Link to={`/battery/${item.batteryCellId}`}>상세보기</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default BatteryListMockTable
