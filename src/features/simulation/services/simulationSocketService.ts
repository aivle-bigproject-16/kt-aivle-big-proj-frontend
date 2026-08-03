import { Client } from '@stomp/stompjs'
import type { WsStatus } from '../types'

interface SimulationSocketCallbacks {
  onMessage: (data: unknown) => void
  onStatusChange: (status: WsStatus) => void
}

let client: Client | null = null

export function startSimulationSocket(cb: SimulationSocketCallbacks) {
  if (client?.active) return

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = import.meta.env.DEV ? 'localhost:4000' : window.location.host
  const url = `${protocol}//${host}/ws/sim`

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
