import { create } from 'zustand'
import { noticeService } from '../services/noticeService'
import type { NoticeListItem } from '../types'
import type { Pageable } from '@/shared/types/api'
import { normalizeListResponse } from '@/shared/types/api'
import type { AsyncState } from '@/shared/types/store'

interface NoticeListState extends AsyncState {
  list: NoticeListItem[]
  pageable: Pageable | null
}

interface NoticeListActions {
  actions: {
    fetchList: (page: number, size: number) => Promise<void>
    reset: () => void
  }
}

const initialState: NoticeListState = {
  list: [],
  pageable: null,
  isLoading: false,
  error: null,
}

export const useNoticeListStore = create<NoticeListState & NoticeListActions>((set) => ({
  ...initialState,
  actions: {
    fetchList: async (page, size) => {
      set({ isLoading: true, error: null })
      try {
        const res = await noticeService.getNoticeList({ page, size })
        const { content, pageable } = normalizeListResponse(res.data)
        set({ list: content, pageable, isLoading: false })
      } catch {
        set({ error: '공지사항 목록 조회에 실패했습니다.', isLoading: false })
      }
    },

    reset: () => set(initialState),
  },
}))
