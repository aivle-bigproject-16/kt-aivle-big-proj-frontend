import { useEffect, useRef, useState } from 'react'

interface CountUpOptions {
  duration?: number
  /** 소수 자릿수. 양품률처럼 소수가 있는 값에 사용 */
  decimals?: number
}

/**
 * 목표값까지 숫자를 점진적으로 세어 올린다.
 * 진행 중에 목표가 바뀌면 현재 표시값에서 이어서 이동하므로 값이 튀지 않는다.
 */
export function useCountUp(target: number, { duration = 600, decimals = 0 }: CountUpOptions = {}) {
  const [value, setValue] = useState(target)
  const valueRef = useRef(target)

  useEffect(() => {
    const from = valueRef.current
    if (from === target) return

    const factor = 10 ** decimals
    const startedAt = performance.now()
    let frame = 0

    const tick = (now: number) => {
      const t = Math.min((now - startedAt) / duration, 1)
      const eased = 1 - (1 - t) ** 3
      const next = Math.round((from + (target - from) * eased) * factor) / factor

      valueRef.current = next
      setValue(next)

      if (t < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration, decimals])

  return value
}
