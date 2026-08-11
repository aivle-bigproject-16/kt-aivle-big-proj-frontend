import { create } from 'zustand'
import { startAiLogStream, stopAiLogStream, type AiLogEntry } from '../services/aiLogService'
import type { WsStatus } from '../types'

const MAX_ENTRIES = 500

interface AiLogState {
  status: WsStatus
  entries: AiLogEntry[]
}

interface AiLogActions {
  actions: {
    connect: (jobId: string) => void
    disconnect: () => void
    clear: () => void
  }
}

export const useAiLogStore = create<AiLogState & AiLogActions>((set) => ({
  status: 'idle',
  entries: [],
  actions: {
    connect: (jobId) => {
      set({ status: 'connecting', entries: [] })
      startAiLogStream(jobId, {
        onStatusChange: (status) => set({ status }),
        onMessage: (entry) => set((s) => ({ entries: [...s.entries, entry].slice(-MAX_ENTRIES) })),
      })
    },

    disconnect: () => {
      stopAiLogStream()
      set({ status: 'idle' })
    },

    clear: () => set({ entries: [] }),
  },
}))
