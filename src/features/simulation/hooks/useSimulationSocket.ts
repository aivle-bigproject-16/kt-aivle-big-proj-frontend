import { useEffect } from 'react'
import { useLoginStore } from '@/features/auth'
import { authService } from '@/features/auth/services/authService'
import { simulationService } from '../services/simulationService'
import { disconnectSimulationSocket, startSimulationSocket } from '../services/simulationSocketService'
import { useSimulationStore } from '../store/useSimulationStore'

function isUnauthorized(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const candidate = error as { status?: unknown; response?: { status?: unknown } }
  return candidate.status === 401 || candidate.response?.status === 401
}

export function useSimulationSocket() {
  const { applyMessage, setWsStatus } = useSimulationStore((s) => s.actions)
  const resetLogin = useLoginStore((s) => s.actions.reset)

  useEffect(() => {
    let sessionCheckInFlight = false

    const expireSession = () => {
      disconnectSimulationSocket()
      resetLogin()
    }

    const reconcileSimulation = async () => {
      try {
        const response = await simulationService.getSimStatus()
        applyMessage(response.data)
      } catch (error) {
        if (isUnauthorized(error)) expireSession()
      }
    }

    const verifySession = async () => {
      if (sessionCheckInFlight) return
      sessionCheckInFlight = true
      try {
        await authService.me()
      } catch (error) {
        if (isUnauthorized(error)) expireSession()
      } finally {
        sessionCheckInFlight = false
      }
    }

    startSimulationSocket({
      onMessage: applyMessage,
      onStatusChange: (status) => {
        setWsStatus(status)
        if (status === 'open') void reconcileSimulation()
        if (status === 'reconnecting') void verifySession()
      },
    })

    // 언마운트되어도 연결은 닫지 않는다 — lifecycle은 모듈 싱글턴(simulationSocketService)이 관리.
    // 대시보드를 다시 마운트하면 이미 연결된 소켓을 그대로 재사용하고,
    // useSimulationStore에 남아있는 마지막 스냅샷으로 바로 렌더링된다.
  }, [applyMessage, resetLogin, setWsStatus])
}
