import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const stompMock = vi.hoisted(() => ({
  config: null as Record<string, unknown> | null,
  activate: vi.fn(),
  deactivate: vi.fn(() => Promise.resolve()),
}))

vi.mock('@stomp/stompjs', () => ({
  Client: class {
    active = true
    subscribe = vi.fn()

    constructor(config: Record<string, unknown>) {
      stompMock.config = config
    }

    activate() {
      stompMock.activate()
    }

    deactivate() {
      this.active = false
      return stompMock.deactivate()
    }
  },
}))

import { disconnectSimulationSocket, startSimulationSocket } from './simulationSocketService'

describe('simulationSocketService', () => {
  beforeEach(() => {
    stompMock.config = null
    stompMock.activate.mockClear()
    stompMock.deactivate.mockClear()
  })

  afterEach(() => {
    disconnectSimulationSocket()
  })

  it('활성 연결이 끊기면 재연결 상태를 알린다', () => {
    const onStatusChange = vi.fn()

    startSimulationSocket({
      onMessage: vi.fn(),
      onStatusChange,
    })

    const onWebSocketClose = stompMock.config?.onWebSocketClose
    expect(onWebSocketClose).toBeTypeOf('function')
    expect(stompMock.activate).toHaveBeenCalledOnce()

    ;(onWebSocketClose as () => void)()

    expect(onStatusChange).toHaveBeenLastCalledWith('reconnecting')
  })
})
