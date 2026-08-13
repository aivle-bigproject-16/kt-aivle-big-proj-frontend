import { create } from 'zustand'
import { noticeService } from '../services/noticeService'
import type { NoticeDetail, NoticeSavePayload } from '../types'
import type { AsyncState } from '@/shared/types/store'

interface NoticeDetailState extends AsyncState {
  detail: NoticeDetail | null
}

interface NoticeDetailActions {
  actions: {
    fetchDetail: (id: number) => Promise<void>
    create: (payload: NoticeSavePayload) => Promise<number>
    update: (id: number, payload: NoticeSavePayload) => Promise<void>
    remove: (id: number) => Promise<void>
    reset: () => void
  }
}

const initialState: NoticeDetailState = {
  detail: null,
  isLoading: false,
  error: null,
}

export const useNoticeDetailStore = create<NoticeDetailState & NoticeDetailActions>((set) => ({
  ...initialState,
  actions: {
    fetchDetail: async (id) => {
      set({ isLoading: true, error: null })
      try {
        const res = await noticeService.getNotice(id)
        set({ detail: res.data, isLoading: false })
      } catch {
        set({ error: '공지사항 조회에 실패했습니다.', isLoading: false })
      }
    },

    // 작성·수정·삭제는 조회와 달리 에러를 스토어에 담지 않고 그대로 던진다.
    // 저장에 실패하면 화면을 이동시키지 않고 폼에 머물러야 하는데,
    // 그 판단은 호출한 컴포넌트가 해야 하기 때문이다.
    create: async (payload) => {
      const res = await noticeService.createNotice(payload)
      return res.data.id
    },

    update: async (id, payload) => {
      await noticeService.updateNotice(id, payload)
    },

    remove: async (id) => {
      await noticeService.deleteNotice(id)
    },

    reset: () => set(initialState),
  },
}))
