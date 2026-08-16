import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/core/navigation'
import { useLoginStore } from '@/features/auth'

console.log(window.innerWidth)

function App() {
  const isInitialized = useLoginStore((state) => state.isInitialized)
  const { restoreSession } = useLoginStore((state) => state.actions)

  useEffect(() => {
    void restoreSession()
  }, [restoreSession])

  if (!isInitialized) {
    return <div role="status" aria-live="polite">로그인 상태를 확인하고 있습니다.</div>
  }

  return <RouterProvider router={router} />
}

export default App
