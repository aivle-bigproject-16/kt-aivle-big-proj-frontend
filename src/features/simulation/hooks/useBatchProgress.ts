import { useMemo } from 'react'
import { useSimulationStore } from '../store/useSimulationStore'
import type { CellProgress } from '../types'

/** 배치 하나의 진척 단계. `active` 는 촬영·분석 중이거나 일부만 끝난 상태를 함께 가리킨다 */
export type BatchPhase = 'pending' | 'active' | 'done'

export interface BatchProgress {
  batchId: number
  phase: BatchPhase
  /** 이 배치에 속한 셀 수 — 네 구역에 흩어진 셀을 모두 세어 얻는다 */
  total: number
  completed: number
}

export interface BatchProgressResult {
  batches: BatchProgress[]
  doneCount: number
}

interface Tally {
  registered: number
  active: number
  completed: number
}

function bump(tallies: Map<number, Tally>, cell: CellProgress, key: keyof Tally): void {
  const tally = tallies.get(cell.batchId) ?? { registered: 0, active: 0, completed: 0 }
  tally[key] += 1
  tallies.set(cell.batchId, tally)
}

/**
 * 배치 단위 진척.
 *
 * 화면에는 셀 단위(퍽)와 결과 단위(배출함)만 있고 그 사이의 배치 축이 비어 있었다.
 * "지금 몇 번째 배치까지 갔는지"는 라인 전체가 어디쯤 왔는지를 한눈에 보여주는
 * 유일한 지표다.
 *
 * 배치 크기는 페이로드에 없지만 모든 셀이 네 구역 중 정확히 한 곳에 있으므로,
 * 같은 batchId 를 가진 셀을 전부 세면 그 배치의 크기가 된다.
 */
export function useBatchProgress(): BatchProgressResult {
  const registered = useSimulationStore((s) => s.registered)
  const capture = useSimulationStore((s) => s.capture)
  const analyze = useSimulationStore((s) => s.analyze)
  const completed = useSimulationStore((s) => s.completed)

  return useMemo(() => {
    const tallies = new Map<number, Tally>()

    for (const cell of registered) bump(tallies, cell, 'registered')
    for (const cell of capture) bump(tallies, cell, 'active')
    if (analyze) bump(tallies, analyze, 'active')
    for (const cell of completed) bump(tallies, cell, 'completed')

    const batches: BatchProgress[] = [...tallies.entries()]
      .map(([batchId, tally]) => {
        const total = tally.registered + tally.active + tally.completed
        /* 아직 손대지 않은 배치만 대기다. 하나라도 촬영에 들어갔거나 일부가 끝났으면
           그 배치는 진행 중이다 — 부분 완료를 대기로 보면 진척이 멈춘 것처럼 읽힌다 */
        const phase: BatchPhase =
          tally.completed === total ? 'done' : tally.active > 0 || tally.completed > 0 ? 'active' : 'pending'

        return { batchId, phase, total, completed: tally.completed }
      })
      .sort((a, b) => a.batchId - b.batchId)

    return { batches, doneCount: batches.filter((b) => b.phase === 'done').length }
  }, [registered, capture, analyze, completed])
}
