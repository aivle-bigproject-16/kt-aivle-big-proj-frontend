import { beforeEach, describe, expect, it } from 'vitest'
import { useSimulationStore } from './useSimulationStore'

/*
 * WS 페이로드 방어 로직 테스트.
 *
 * API_SPEC「검사 진행 상황 수신」과 현재 mock-server 의 실제 프레임이 세 군데에서
 * 어긋나 있고, 어느 쪽이 실서버 동작인지 BE 확인 전이다. 어느 쪽이 오든 화면이
 * 깨지지 않아야 하므로 양쪽을 모두 케이스로 고정한다.
 *
 *   1. 공통 응답 봉투({ success, message, data }) 유무
 *   2. status 값의 앞뒤 공백 ("CAPTURING " 처럼)
 *   3. COMPLETED 페이로드에 집계 필드가 실리는지
 */

const cell = (overrides: Record<string, unknown> = {}) => ({
  batteryCellId: 1001,
  inspectionId: 1001,
  finalLabel: null,
  batchId: 1,
  status: 'CAPTURING',
  ...overrides,
})

const progress = (overrides: Record<string, unknown> = {}) => ({
  event: 'PROGRESS',
  batchCount: 3,
  batteryCellCount: 24,
  captureSpeed: 2,
  registered: [],
  capture: [cell()],
  analyze: null,
  completed: [],
  ...overrides,
})

describe('useSimulationStore.applyMessage', () => {
  beforeEach(() => {
    useSimulationStore.getState().actions.reset()
  })

  it('봉투 없는 프레임을 반영한다 (현재 mock 동작)', () => {
    useSimulationStore.getState().actions.applyMessage(progress())

    const s = useSimulationStore.getState()
    expect(s.event).toBe('PROGRESS')
    expect(s.batteryCellCount).toBe(24)
    expect(s.capture).toHaveLength(1)
  })

  it('공통 응답 봉투에 싸여 와도 반영한다 (API_SPEC Example 형태)', () => {
    useSimulationStore.getState().actions.applyMessage({
      success: true,
      message: '검사 진행 상황 복구가 완료되었습니다.',
      data: progress(),
    })

    const s = useSimulationStore.getState()
    expect(s.event).toBe('PROGRESS')
    expect(s.batteryCellCount).toBe(24)
    expect(s.capture).toHaveLength(1)
  })

  it('status 와 finalLabel 의 앞뒤 공백을 제거한다', () => {
    useSimulationStore.getState().actions.applyMessage(
      progress({
        capture: [cell({ status: 'CAPTURING ' }), cell({ batteryCellId: 1002, status: 'CAPTURED ' })],
        analyze: cell({ batteryCellId: 1003, status: 'ANALYZING ' }),
        completed: [cell({ batteryCellId: 1004, status: 'COMPLETED ', finalLabel: 'PASS ' })],
      }),
    )

    const s = useSimulationStore.getState()
    expect(s.capture.map((c) => c.status)).toEqual(['CAPTURING', 'CAPTURED'])
    expect(s.analyze?.status).toBe('ANALYZING')
    expect(s.completed[0].status).toBe('COMPLETED')
    expect(s.completed[0].finalLabel).toBe('PASS')
  })

  it('고칠 게 없으면 셀 객체 참조를 그대로 유지한다', () => {
    const payload = progress()
    useSimulationStore.getState().actions.applyMessage(payload)

    expect(useSimulationStore.getState().capture[0]).toBe(
      (payload.capture as unknown[])[0],
    )
  })

  it('COMPLETED 가 event 만 담고 와도 집계 값을 잃지 않는다 (API_SPEC 규정 형태)', () => {
    useSimulationStore.getState().actions.applyMessage(progress({ completed: [cell({ finalLabel: 'PASS' })] }))
    useSimulationStore.getState().actions.applyMessage({ event: 'COMPLETED' })

    const s = useSimulationStore.getState()
    expect(s.simulationStatus).toBe('completed')
    expect(s.batteryCellCount).toBe(24)
    expect(s.captureSpeed).toBe(2)
    expect(s.completed).toHaveLength(1)
    expect(s.registered).toEqual([])
    expect(s.analyze).toBeNull()
  })

  it('COMPLETED 가 집계와 목록을 함께 담고 오면 그 값을 쓴다 (현재 develop 동작)', () => {
    useSimulationStore.getState().actions.applyMessage(progress())
    useSimulationStore.getState().actions.applyMessage({
      event: 'COMPLETED',
      batchCount: 3,
      batteryCellCount: 24,
      captureSpeed: 2,
      registered: [],
      capture: [],
      analyze: null,
      completed: [cell({ status: 'COMPLETED', finalLabel: 'REJECT' })],
    })

    const s = useSimulationStore.getState()
    expect(s.completed).toHaveLength(1)
    expect(s.completed[0].finalLabel).toBe('REJECT')
    expect(s.capture).toEqual([])
  })

  it('event 가 없는 메시지는 무시한다', () => {
    useSimulationStore.getState().actions.applyMessage(progress())
    useSimulationStore.getState().actions.applyMessage({ hello: 'world' })

    expect(useSimulationStore.getState().event).toBe('PROGRESS')
  })
})
