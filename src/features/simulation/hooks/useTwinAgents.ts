import { useMemo } from 'react'
import { useSimulationStore } from '../store/useSimulationStore'
import { GRID_CAPACITY } from '../components/twin/twinLayout'
import type { CellProgress, CellStatus } from '../types'
import type { FinalLabel } from '@/features/battery/types'

/** 셀 오브젝트가 놓일 수 있는 구역. 배출함 3종은 판정 라벨과 1:1.
    `buffer` 는 촬영을 마치고 분석을 기다리는 CAPTURED 셀이 쌓이는 큐다 */
export type TwinZone = 'source' | 'capture' | 'buffer' | 'analyze' | 'PASS' | 'REJECT' | 'FAIL'

export interface TwinAgent {
  /** React key. 셀 id 를 그대로 쓴다 — 노드가 재사용되어야 CSS transition 이 걸린다 */
  id: number
  zone: TwinZone
  /** 구역 내 슬롯 번호. 구역이 그대로여도 이 값이 바뀌면 줄이 앞으로 당겨진다 */
  slot: number
  status: CellStatus
  finalLabel: FinalLabel | null
  batchId: number
}

export interface TwinAgentsResult {
  agents: TwinAgent[]
  /** 격자 용량을 넘어 그리지 못한 셀 수. 스테이션 푸터에 `+N` 으로 표기한다 */
  overflow: { source: number; buffer: number }
}

/** 완료 셀은 판정 라벨이 곧 배출함이다. 라벨이 비어 오면 검사 실패로 본다 */
function binOf(cell: CellProgress): FinalLabel {
  return cell.finalLabel ?? 'FAIL'
}

/**
 * WS 스냅샷을 트윈 오브젝트 목록으로 바꾼다.
 *
 * 전이(transition)를 따로 합성하지 않는다. 셀 id 를 React key 로 고정해두면
 * 스냅샷이 바뀔 때 같은 DOM 노드의 좌표만 바뀌고, 이동 자체는 CSS transition 이
 * 만든다. 즉 화면이 움직이는 시점 = 서버가 상태 변화를 알린 시점이며,
 * 데이터에 없는 중간 위치를 프론트가 지어내지 않는다.
 */
export function useTwinAgents(): TwinAgentsResult {
  /* 스토어의 각 배열은 참조가 안정적이라 셀렉터로 그대로 꺼내도 안전하다.
     여기서 새 배열을 만들어 반환하면 매 렌더 새 참조가 되어 구독이 계속 깨진다 */
  const registered = useSimulationStore((s) => s.registered)
  const capture = useSimulationStore((s) => s.capture)
  const analyze = useSimulationStore((s) => s.analyze)
  const completed = useSimulationStore((s) => s.completed)

  return useMemo(() => {
    const agents: TwinAgent[] = []

    registered.slice(0, GRID_CAPACITY.source).forEach((cell, i) => {
      agents.push({
        id: cell.batteryCellId,
        zone: 'source',
        slot: i,
        status: cell.status,
        finalLabel: cell.finalLabel,
        batchId: cell.batchId,
      })
    })

    /* capture 배열에는 촬영 중(CAPTURING)과 촬영 완료(CAPTURED)가 섞여 온다.
       두 상태는 물리적으로 다른 자리에 있다 — 하나는 챔버 안, 하나는 분석 대기 큐다 */
    let captureSlot = 0
    let bufferSlot = 0
    let bufferOverflow = 0

    for (const cell of capture) {
      const inChamber = cell.status === 'CAPTURING'
      const slot = inChamber ? captureSlot++ : bufferSlot++
      const capacity = inChamber ? GRID_CAPACITY.capture : GRID_CAPACITY.buffer

      if (slot >= capacity) {
        if (!inChamber) bufferOverflow += 1
        continue
      }

      agents.push({
        id: cell.batteryCellId,
        zone: inChamber ? 'capture' : 'buffer',
        slot,
        status: cell.status,
        finalLabel: cell.finalLabel,
        batchId: cell.batchId,
      })
    }

    if (analyze) {
      agents.push({
        id: analyze.batteryCellId,
        zone: 'analyze',
        slot: 0,
        status: analyze.status,
        finalLabel: analyze.finalLabel,
        batchId: analyze.batchId,
      })
    }

    /* completed 는 최신 셀이 배열 앞에 붙는다(서버가 prepend). 그대로 슬롯을 주면
       새 셀이 항상 배출함 첫 칸에 들어가고 나머지가 한 칸씩 밀린다 */
    const binFilled: Record<FinalLabel, number> = { PASS: 0, REJECT: 0, FAIL: 0 }

    for (const cell of completed) {
      const bin = binOf(cell)
      const slot = binFilled[bin]
      binFilled[bin] += 1

      /* 함이 꽉 차면 더 그리지 않는다. 카운트는 헤더 숫자가 이미 전량을 말하고 있다 */
      if (slot >= GRID_CAPACITY.bin) continue

      agents.push({
        id: cell.batteryCellId,
        zone: bin,
        slot,
        status: cell.status,
        finalLabel: cell.finalLabel,
        batchId: cell.batchId,
      })
    }

    /* 그리는 순서를 셀 id 로 고정한다. 구역이 바뀌어도 DOM 순서가 유지되어야
       React 가 노드를 재사용하고 이동 transition 이 끊기지 않는다 */
    agents.sort((a, b) => a.id - b.id)

    return {
      agents,
      overflow: {
        source: Math.max(0, registered.length - GRID_CAPACITY.source),
        buffer: bufferOverflow,
      },
    }
  }, [registered, capture, analyze, completed])
}
