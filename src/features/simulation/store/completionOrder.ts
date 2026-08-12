import type { CellProgress } from '../types'

/*
 * 완료 셀의 실제 완료 순서를 추적한다.
 *
 * WS 페이로드에는 시각 필드가 없고, `completed[]` 의 정렬 방향도 계약에 규정돼 있지
 * 않다. 실제로 코드베이스 안에서도 가정이 갈려 있었다 — mock-server 는 새 셀을 배열
 * 앞에 붙이고(`[cell, ...completed]`), 완료 탭은 배열을 뒤집어 쓰고 있다. 어느 쪽이
 * 맞는지 서버에 물어보지 않고도 화면이 옳게 나오도록, 배열 방향을 가정하지 않고
 * 스냅샷 관측으로 알아낸다.
 *
 * 판별 방법은 단순하다. 새로 나타난 셀이 배열 앞쪽에 꽂히면 최신이 앞(head)이고,
 * 뒤쪽에 붙으면 최신이 뒤(tail)다. 한 번 판별하면 그대로 고정한다.
 *
 * 판별 전(첫 스냅샷)에는 `batchId` 를 쓴다. 배치는 번호 순서대로 처리되므로 배치
 * 번호가 작을수록 먼저 끝난 셀이다. 같은 배치 안의 순서만 배열에 의존하는데, 이때는
 * 기본값으로 "최신이 앞"을 쓴다 — mock-server 와 API_SPEC Example 이 모두 그 형태다
 * (Example 의 completed 는 batch 2005 항목이 1004 항목보다 앞에 온다).
 */

type Direction = 'head' | 'tail'

let seq = new Map<number, number>()
let counter = 0
let direction: Direction = 'head'
let directionLocked = false

export function resetCompletionOrder(): void {
  seq = new Map()
  counter = 0
  direction = 'head'
  directionLocked = false
}

/** 관측된 방향. 진단용 — 화면 로직은 이 값을 보지 않는다 */
export function getCompletionDirection(): { direction: Direction; locked: boolean } {
  return { direction, locked: directionLocked }
}

/**
 * 스냅샷의 완료 목록을 관측해 새로 들어온 셀에 완료 순번을 매긴다.
 * 같은 셀을 다시 봐도 순번은 바뀌지 않는다.
 */
export function observeCompletions(cells: CellProgress[]): void {
  /* 완료 목록이 비면 새 시뮬레이션이 시작된 것이다 — 지난 판의 순번을 끌고 가지 않는다 */
  if (cells.length === 0) {
    resetCompletionOrder()
    return
  }

  const fresh = cells.filter((cell) => !seq.has(cell.batteryCellId))
  if (fresh.length === 0) return

  const hadHistory = seq.size > 0

  /* 이미 보고 있던 목록에 새 셀이 끼어든 위치가 곧 서버의 정렬 방향이다.
     첫 스냅샷은 비교 대상이 없어 판별할 수 없으므로 기본값을 그대로 둔다 */
  if (hadHistory && !directionLocked) {
    const ids = cells.map((c) => c.batteryCellId)
    const positions = fresh.map((c) => ids.indexOf(c.batteryCellId))
    const average = positions.reduce((sum, p) => sum + p, 0) / positions.length
    direction = average <= (ids.length - 1) / 2 ? 'head' : 'tail'
    directionLocked = true
  }

  const lastIndex = cells.length - 1
  const positionOf = new Map(cells.map((c, i) => [c.batteryCellId, i]))

  /* 배치 번호가 1순위, 배열 위치가 2순위. 위치는 방향에 따라 뒤집어 읽는다 —
     최신이 앞이면 인덱스가 클수록 먼저 끝난 셀이다 */
  const chronological = [...fresh].sort((a, b) => {
    if (a.batchId !== b.batchId) return a.batchId - b.batchId
    const pa = positionOf.get(a.batteryCellId) ?? 0
    const pb = positionOf.get(b.batteryCellId) ?? 0
    return direction === 'head' ? lastIndex - pa - (lastIndex - pb) : pa - pb
  })

  for (const cell of chronological) {
    counter += 1
    seq.set(cell.batteryCellId, counter)
  }
}

/**
 * 최근 완료가 앞에 오도록 정렬한 새 배열을 돌려준다.
 * 순번을 모르는 셀(관측 전)은 뒤로 밀린다.
 */
export function orderNewestFirst(cells: CellProgress[]): CellProgress[] {
  return [...cells].sort(
    (a, b) => (seq.get(b.batteryCellId) ?? 0) - (seq.get(a.batteryCellId) ?? 0),
  )
}
