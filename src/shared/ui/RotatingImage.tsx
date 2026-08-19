import { useState, type CSSProperties, type SyntheticEvent } from 'react'

interface RotatingImageProps {
  src: string
  alt: string
  className?: string
  objectFit?: 'cover' | 'contain'
}

/** 마커 오버레이가 없는 단순 썸네일용 — 컨테이너(부모)는 position:relative(또는 absolute)에
   overflow:hidden 이어야 한다. 세로로 긴(portrait) 원본이면 90도 돌려서 항상 긴 쪽이
   가로가 되게 한다. 회전 전 이미지 박스를 컨테이너의 가로/세로를 맞바꾼 크기로 잡고
   그 상태로 90도 돌리면, 다시 원래 컨테이너 크기에 정확히 맞아떨어진다 —
   원본 픽셀로 스케일을 계산할 필요 없이 컨테이너 크기만 알면 된다 */
function RotatingImage({ src, alt, className, objectFit = 'cover' }: RotatingImageProps) {
  const [rotatedStyle, setRotatedStyle] = useState<CSSProperties | null>(null)

  const handleLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const container = img.parentElement
    if (!container || !img.naturalWidth) return

    const portrait = img.naturalHeight > img.naturalWidth
    if (!portrait) {
      setRotatedStyle(null)
      return
    }

    const cw = container.clientWidth
    const ch = container.clientHeight
    setRotatedStyle({
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: ch,
      height: cw,
      objectFit,
      transform: 'translate(-50%, -50%) rotate(90deg)',
    })
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <img
        src={src}
        alt={alt}
        className={rotatedStyle ? undefined : className}
        style={rotatedStyle ?? undefined}
        onLoad={handleLoad}
      />
    </div>
  )
}

export { RotatingImage }
