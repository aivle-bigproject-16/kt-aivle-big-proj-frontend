import { useEffect, useState } from 'react'

/** .dashboard__panels 의 슬라이드 전환 시간과 동일하게 유지할 것 */
export const PANEL_SLIDE_DURATION = 350

/**
 * active가 true가 되면 즉시 true, false가 되면 delay 후에 false를 반환한다.
 *
 * 탭이 바뀌는 순간 바로 끄면 아직 화면을 빠져나가는 중인 패널에서
 * 장식 애니메이션이 툭 사라지는 게 보인다. 슬라이드가 끝난 뒤에 끈다.
 */
export function useLingeringActive(active: boolean, delay = PANEL_SLIDE_DURATION) {
  const [lingering, setLingering] = useState(active)

  useEffect(() => {
    if (active) {
      setLingering(true)
      return
    }
    const t = setTimeout(() => setLingering(false), delay)
    return () => clearTimeout(t)
  }, [active, delay])

  return lingering
}
