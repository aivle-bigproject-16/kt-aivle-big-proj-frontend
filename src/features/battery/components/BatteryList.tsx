import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
// 1200 기준 구 CSS는 history/BatteryList.css로 이동됨 — 1400 기준으로 새로 만들 것
import { DownloadIcon, CalendarIcon } from './BatteryListIcons'
import { useBatteryListStore } from '../store/useBatteryListStore'
import { ROUTES } from '@/core/navigation/routes'
import { Pagination } from '@/shared/ui/Pagination'
import { DetailLinkButton } from '@/shared/ui/DetailLinkButton'

const PAGE_SIZE = 20

function formatDateTime(value: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

type HistoryTab = 'ALL' | 'DEFECT' | 'INSPECTION_FAIL'

function BatteryList() {
  const navigate = useNavigate()
  const list = useBatteryListStore((s) => s.list)
  const isLoading = useBatteryListStore((s) => s.isLoading)
  const error = useBatteryListStore((s) => s.error)
  const { fetchList } = useBatteryListStore((s) => s.actions)

  const [activeTab, setActiveTab] = useState<HistoryTab>('ALL')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const filteredList = list.filter((item) => {
    if (activeTab === 'DEFECT') return item.latestFinalLabel === 'REJECT'
    if (activeTab === 'INSPECTION_FAIL') return item.latestFinalLabel === 'FAIL'
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE))
  const pagedList = filteredList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const rangeStart = filteredList.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filteredList.length)

  const handleTabChange = (tab: HistoryTab) => {
    setActiveTab(tab)
    setCurrentPage(1)
  }

  return (
    <div className="battery-list">
      <div className="battery-list__header">
        <div>
          <h1 className="battery-list__title">
            배터리별 점검 기록 <span className="battery-list__title-en">(Battery History)</span>
          </h1>
          <p className="battery-list__subtitle">
            Track and analyze individual battery cell inspection results across all production lines.
          </p>
        </div>
        <div className="battery-list__header-actions">
          <button type="button" className="battery-list__btn battery-list__btn--outline">
            <DownloadIcon />
            Export CSV
          </button>
          <button type="button" className="battery-list__btn battery-list__btn--primary">
            + New Query
          </button>
        </div>
      </div>

      <div className="battery-list__toolbar">
        <div className="battery-list__tabs">
          <button
            type="button"
            className={
              activeTab === 'ALL'
                ? 'battery-list__tab battery-list__tab--active'
                : 'battery-list__tab'
            }
            onClick={() => handleTabChange('ALL')}
          >
            전체 이력 (All History)
          </button>
          <button
            type="button"
            className={
              activeTab === 'DEFECT'
                ? 'battery-list__tab battery-list__tab--active'
                : 'battery-list__tab'
            }
            onClick={() => handleTabChange('DEFECT')}
          >
            불량 이력 (Reject History)
          </button>
          <button
            type="button"
            className={
              activeTab === 'INSPECTION_FAIL'
                ? 'battery-list__tab battery-list__tab--active'
                : 'battery-list__tab'
            }
            onClick={() => handleTabChange('INSPECTION_FAIL')}
          >
            검사 실패 이력 (Fail History)
          </button>
        </div>
        <div className="battery-list__filters">
          <button type="button" className="battery-list__filter">
            <CalendarIcon />
            2024-05-12 - Today
          </button>
        </div>
      </div>

      <div className="battery-list__table-card">
        {isLoading && <p className="battery-list__status">로딩 중...</p>}
        {error && <p className="battery-list__status battery-list__status--error">{error}</p>}

        <table className="battery-list__table">
          <colgroup>
            <col className="battery-list__col-index" />
            <col className="battery-list__col-id" />
            <col className="battery-list__col-model" />
            <col className="battery-list__col-date" />
            <col className="battery-list__col-result" />
            <col className="battery-list__col-detail" />
          </colgroup>
          <thead>
            <tr>
              <th>#</th>
              <th>배터리 ID (Battery ID)</th>
              <th>모델 (Model)</th>
              <th>최종 점검일 (Last Inspection)</th>
              <th>판정 결과 (Result)</th>
              <th>상세 보기 (Detail)</th>
            </tr>
          </thead>
          <tbody>
            {pagedList.map((item, index) => {
              const isFail = item.latestFinalLabel === 'FAIL'
              const isReject = item.latestFinalLabel === 'REJECT' || isFail
              return (
                <tr
                  key={item.batteryCellId}
                  onClick={() => navigate(ROUTES.BATTERY_DETAIL(item.batteryCellId))}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                  <td
                    className={
                      isReject
                        ? 'battery-list__id battery-list__id--reject'
                        : 'battery-list__id'
                    }
                  >
                    {item.cellSerialNo ?? `CELL-${item.batteryCellId}`}
                  </td>
                  <td>{item.modelName ?? '-'}</td>
                  <td>{formatDateTime(item.latestAnalyzedAt)}</td>
                  <td>
                    <span className="battery-list__result">
                      <span className="battery-list__result-icon">
                        <span
                          className={
                            isFail
                              ? 'battery-list__dot battery-list__dot--fail'
                              : isReject
                                ? 'battery-list__dot battery-list__dot--reject'
                                : 'battery-list__dot battery-list__dot--pass'
                          }
                        />
                      </span>
                      {item.latestFinalLabel ?? '-'}
                    </span>
                  </td>
                  <td>
                    <DetailLinkButton to={ROUTES.BATTERY_DETAIL(item.batteryCellId)} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="battery-list__footer">
          <span className="battery-list__footer-text">
            Showing {rangeStart} to {rangeEnd} of {filteredList.length} entries
          </span>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </div>
    </div>
  )
}

export { BatteryList }
