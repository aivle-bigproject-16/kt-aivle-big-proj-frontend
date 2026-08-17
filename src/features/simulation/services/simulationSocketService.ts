import { Client } from '@stomp/stompjs'
import type { WsStatus } from '../types'

interface SimulationSocketCallbacks {
  onMessage: (data: unknown) => void
  onStatusChange: (status: WsStatus) => void
}

let client: Client | null = null

export function startSimulationSocket(cb: SimulationSocketCallbacks) {
  if (client?.active) return

  /* 브라우저 자신의 주소(dev면 Vite 서버, localhost:5173)로 붙어야 vite.config.ts의
     /ws 프록시를 타고 실제 백엔드(VITE_PROXY_TARGET)로 전달된다. 이전엔 dev 모드에서
     localhost:4000(mock-server)로 직접 연결해서 프록시 설정이 무시되고 있었다 */
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const url = `${protocol}//${window.location.host}/ws/sim`

  cb.onStatusChange('connecting')

  client = new Client({
    brokerURL: url,
    reconnectDelay: 5000,
    onConnect: () => {
      console.log('[stomp] connected')
      cb.onStatusChange('open')
      client!.subscribe('/topic/sim', (message) => {
        try {
          const data = JSON.parse(message.body)
          console.log('[stomp] message:', data)
          cb.onMessage(data)
        } catch (err) {
          console.error('[stomp] parse error:', err)
        }
      })
    },
    onDisconnect: () => {
      console.log('[stomp] disconnected')
      cb.onStatusChange('reconnecting')
    },
    onWebSocketClose: () => {
      cb.onStatusChange(client?.active ? 'reconnecting' : 'closed')
    },
    onStompError: () => {
      cb.onStatusChange('closed')
    },
  })

  client.activate()
}

export function disconnectSimulationSocket() {
  if (client) {
    client.deactivate()
    client = null
  }
}
