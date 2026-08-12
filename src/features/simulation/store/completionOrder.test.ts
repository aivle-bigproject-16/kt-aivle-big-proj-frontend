import { beforeEach, describe, expect, it } from 'vitest'
import {
  getCompletionDirection,
  observeCompletions,
  orderNewestFirst,
  resetCompletionOrder,
} from './completionOrder'
import type { CellProgress } from '../types'

/*
 * `completed[]` 의 정렬 방향은 계약에 규정돼 있지 않다. 서버가 새 셀을 배열 앞에
 * 붙이든 뒤에 붙든 화면이 같은 순서를 얻어야 하므로, 양쪽 관례를 모두 케이스로 둔다.
 */

const cell = (batteryCellId: number, batchId: number): CellProgress => ({
  batteryCellId,
  inspectionId: batteryCellId,
  finalLabel: 'PASS',
  batchId,
  status: 'COMPLETED',
})

const ids = (cells: CellProgress[]) => cells.map((c) => c.batteryCellId)

describe('completionOrder', () => {
  beforeEach(() => {
    resetCompletionOrder()
  })

  it('새 셀이 배열 앞에 붙는 서버(prepend)에서 최신순을 만든다', () => {
    let completed = [cell(1001, 1)]
    observeCompletions(completed)

    completed = [cell(1002, 1), ...completed]
    observeCompletions(completed)

    completed = [cell(1003, 1), ...completed]
    observeCompletions(completed)

    expect(getCompletionDirection().direction).toBe('head')
    expect(ids(orderNewestFirst(completed))).toEqual([1003, 1002, 1001])
  })

  it('새 셀이 배열 뒤에 붙는 서버(append)에서도 같은 최신순을 만든다', () => {
    let completed = [cell(1001, 1)]
    observeCompletions(completed)

    completed = [...completed, cell(1002, 1)]
    observeCompletions(completed)

    completed = [...completed, cell(1003, 1)]
    observeCompletions(completed)

    expect(getCompletionDirection().direction).toBe('tail')
    expect(ids(orderNewestFirst(completed))).toEqual([1003, 1002, 1001])
  })

  it('첫 스냅샷에 여러 셀이 한꺼번에 와도 배치 번호로 순서를 잡는다', () => {
    /* 새로고침으로 진행 중인 시뮬레이션에 붙는 상황. 관측 이력이 없다 */
    const completed = [cell(3001, 3), cell(2001, 2), cell(1001, 1)]
    observeCompletions(completed)

    expect(ids(orderNewestFirst(completed))).toEqual([3001, 2001, 1001])
  })

  it('한 번 판별한 방향은 바꾸지 않는다', () => {
    let completed = [cell(1001, 1)]
    observeCompletions(completed)

    completed = [cell(1002, 1), ...completed]
    observeCompletions(completed)
    expect(getCompletionDirection()).toEqual({ direction: 'head', locked: true })

    /* 한 스냅샷에 여러 개가 몰려 위치 평균이 흔들려도 판별을 뒤집지 않는다 */
    completed = [cell(1003, 1), ...completed, cell(1004, 1)]
    observeCompletions(completed)
    expect(getCompletionDirection()).toEqual({ direction: 'head', locked: true })
  })

  it('이미 순번을 받은 셀은 다시 봐도 순번이 바뀌지 않는다', () => {
    let completed = [cell(1001, 1)]
    observeCompletions(completed)
    completed = [cell(1002, 1), ...completed]
    observeCompletions(completed)

    const before = ids(orderNewestFirst(completed))
    observeCompletions(completed)
    observeCompletions(completed)

    expect(ids(orderNewestFirst(completed))).toEqual(before)
  })

  it('완료 목록이 비면 순번을 버린다 (시뮬레이션 재시작)', () => {
    observeCompletions([cell(1001, 1)])
    observeCompletions([])

    expect(getCompletionDirection()).toEqual({ direction: 'head', locked: false })

    /* 새 판의 첫 셀이 이전 판의 순번에 밀리지 않는다 */
    const next = [cell(9001, 1)]
    observeCompletions(next)
    expect(ids(orderNewestFirst(next))).toEqual([9001])
  })

  it('원본 배열을 바꾸지 않는다', () => {
    const completed = [cell(1001, 1), cell(1002, 1)]
    observeCompletions(completed)
    orderNewestFirst(completed)

    expect(ids(completed)).toEqual([1001, 1002])
  })
})
