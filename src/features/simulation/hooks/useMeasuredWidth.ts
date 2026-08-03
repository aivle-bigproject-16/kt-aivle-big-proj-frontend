import { useEffect, useRef, useState } from 'react'

/**
 * 요소의 실제 폭을 실측해 반환한다.
 *
 * CSS transition은 계산값 사이를 보간하는데 `fit-content`나 `100%`는
 * 부모 폭이 바뀌어도 계산값이 그대로라 애니메이션이 걸리지 않는다.
 * 폭 변화를 애니메이션하려면 이렇게 실측한 px을 명시 폭으로 넘겨야 한다.
 *
 * 관측 대상은 내용 폭으로 줄어 있어야(`width: fit-content`) 의미 있는 값이 나온다.
 */
export function useMeasuredWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState<number>()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, width] as const
}
