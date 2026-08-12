import { useCallback, useState } from 'react'

/** 전체탭 본문을 어느 형태로 볼지. `line` = 디지털 트윈 공정 라인, `card` = 구 요약 카드 */
export type OverviewView = 'line' | 'card'

const STORAGE_KEY = 'sim.overview.view'
const DEFAULT_VIEW: OverviewView = 'line'

function isOverviewView(value: unknown): value is OverviewView {
  return value === 'line' || value === 'card'
}

function readStored(): OverviewView {
  /* 저장소를 못 읽는 환경(사파리 프라이빗, SSR, 테스트)이 있어 실패해도 기본값으로 넘어간다 */
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return isOverviewView(stored) ? stored : DEFAULT_VIEW
  } catch {
    return DEFAULT_VIEW
  }
}

/**
 * 전체탭 본문 뷰 선택.
 *
 * 두 형태를 함께 남기는 이유는 재설계가 시연 도중에 검증되지 않았기 때문이다.
 * 구 카드 뷰는 이미 팀이 눈으로 확인한 화면이고, 트윈 라인은 새로 얹은 것이다.
 * 선택은 브라우저에 남겨 새로고침해도 유지한다.
 */
export function useOverviewView() {
  const [view, setView] = useState<OverviewView>(readStored)

  const changeView = useCallback((next: OverviewView) => {
    setView(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* 저장에 실패해도 이번 세션 동안은 선택이 유지된다 */
    }
  }, [])

  return { view, changeView }
}
