import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLoginStore } from '@/features/auth/store/useLoginStore'
import { simulationService } from '../services/simulationService'
import { useSimulationStore } from '../store/useSimulationStore'
import { SimControl } from './SimControl'

vi.mock('../services/simulationService', () => ({
  simulationService: {
    startSimulation: vi.fn().mockResolvedValue({ data: { event: 'COMPLETED' } }),
  },
}))

describe('SimControl', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(async () => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    useLoginStore.setState({ role: 'ADMIN' })
    useSimulationStore.getState().actions.reset()
    vi.mocked(simulationService.startSimulation).mockClear()

    await act(async () => {
      root.render(<SimControl />)
    })

    await act(async () => {
      getButton('Sim Control').click()
    })
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    useLoginStore.getState().actions.reset()
    await act(async () => {
      root.unmount()
    })
    container.remove()
  })

  const getButton = (label: string) => {
    const button = Array.from(container.querySelectorAll('button')).find((item) =>
      item.textContent?.includes(label),
    )
    if (!button) throw new Error(`${label} 버튼을 찾을 수 없습니다.`)
    return button
  }

  it('초기화 기본값 false를 POST /sim 요청에 전달한다', async () => {
    const checkbox = container.querySelector<HTMLInputElement>('input[type="checkbox"]')
    expect(checkbox?.checked).toBe(false)

    const confirm = vi.spyOn(window, 'confirm')
    await act(async () => {
      getButton('시뮬레이션 시작').click()
    })

    expect(confirm).not.toHaveBeenCalled()
    expect(simulationService.startSimulation).toHaveBeenCalledWith({
      batchSize: 5,
      batteryCellCount: 20,
      captureSpeed: 5,
      resetBeforeStart: false,
    })
  })

  it('초기화 선택 시 확인 후에만 true 요청을 전송한다', async () => {
    const checkbox = container.querySelector<HTMLInputElement>('input[type="checkbox"]')
    if (!checkbox) throw new Error('초기화 체크박스를 찾을 수 없습니다.')

    await act(async () => {
      checkbox.click()
    })

    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    await act(async () => {
      getButton('시뮬레이션 시작').click()
    })
    expect(simulationService.startSimulation).not.toHaveBeenCalled()

    confirm.mockReturnValue(true)
    await act(async () => {
      getButton('시뮬레이션 시작').click()
    })
    expect(simulationService.startSimulation).toHaveBeenCalledWith({
      batchSize: 5,
      batteryCellCount: 20,
      captureSpeed: 5,
      resetBeforeStart: true,
    })
  })

  it('관리자가 아니면 초기화 선택을 노출하지 않고 false를 전송한다', async () => {
    await act(async () => {
      useLoginStore.setState({ role: 'USER' })
    })

    expect(container.querySelector('input[type="checkbox"]')).toBeNull()

    await act(async () => {
      getButton('시뮬레이션 시작').click()
    })
    expect(simulationService.startSimulation).toHaveBeenCalledWith({
      batchSize: 5,
      batteryCellCount: 20,
      captureSpeed: 5,
      resetBeforeStart: false,
    })
  })
})
