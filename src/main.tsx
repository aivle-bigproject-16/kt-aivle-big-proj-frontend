import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 임시 디버그 로그 — 모니터별 실제 CSS 뷰포트 폭 확인용. 확인 후 제거할 것.
console.log('window.innerWidth', window.innerWidth)
window.addEventListener('resize', () => {
  console.log('window.innerWidth', window.innerWidth)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
