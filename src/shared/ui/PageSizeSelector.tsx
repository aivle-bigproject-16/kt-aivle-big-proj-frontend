import { useState, useRef, useEffect } from 'react'
import './PageSizeSelector.css'

interface PageSizeSelectorProps {
  value: number
  onChange: (size: number) => void
  options?: number[]
}

function PageSizeSelector({ value, onChange, options = [20, 50, 100] }: PageSizeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="page-size-selector" ref={containerRef}>
      <button 
        type="button" 
        className="page-size-selector__trigger" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{value}개씩 보기</span>
        <svg 
          className={`page-size-selector__icon ${isOpen ? 'page-size-selector__icon--open' : ''}`} 
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      
      {isOpen && (
        <div className="page-size-selector__dropdown">
          {options.map((size) => (
            <button
              key={size}
              type="button"
              className={`page-size-selector__option ${value === size ? 'page-size-selector__option--active' : ''}`}
              onClick={() => {
                onChange(size)
                setIsOpen(false)
              }}
            >
              {size}개씩 보기
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export { PageSizeSelector }
