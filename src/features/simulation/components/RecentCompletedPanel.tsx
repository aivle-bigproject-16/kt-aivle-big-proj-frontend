import { useMemo } from 'react'
import { useSimulationStore } from '../store/useSimulationStore'
import { CompletedCellList } from './CompletedCellList'
import './RecentCompletedPanel.css'

/**
 * 최근 완료 셀 — 어느 셀이 방금 끝났는지 보여준다.
 *
 * 트윈의 배출함은 판정별로 "몇 개"인지만 말하고 "어느 셀"인지는 말하지 않는다.
 * 셀 단위 진입점이 필요해 `CompletedCellList` 를 그대로 쓴다 — 완료 탭이 쓰는 것과
 * 같은 컴포넌트라 행 모양과 이동 동작이 두 화면에서 어긋나지 않는다.
 */
function RecentCompletedPanel() {
  const completed = useSimulationStore((s) => s.completed)
  const completedCount = completed.length

  /* 완료 목록의 정렬 방향이 서버 구현에 달려 있어(§주의) 여기서는 배열 순서를
     그대로 쓴다. 뒤집는 쪽은 완료 탭과 구 OverviewResult 가 하고 있다 */
  const rows = useMemo(() => completed.slice(0, 12), [completed])

  return (
    <section className="recent-completed">
      <header className="recent-completed__header">
        <div className="recent-completed__title-group">
          <h3 className="recent-completed__title">최근 완료</h3>
          <span className="recent-completed__subtitle">COMPLETED</span>
        </div>
        <span className="recent-completed__count">{completedCount}</span>
      </header>

      {rows.length === 0 ? (
        <p className="recent-completed__empty">완료된 셀이 없습니다.</p>
      ) : (
        <CompletedCellList cells={rows} />
      )}
    </section>
  )
}

export { RecentCompletedPanel }
