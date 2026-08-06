import { RouterProvider } from 'react-router-dom'
import { router } from '@/core/navigation'

console.log(window.innerWidth)

function App() {
  return <RouterProvider router={router} />
}

export default App
