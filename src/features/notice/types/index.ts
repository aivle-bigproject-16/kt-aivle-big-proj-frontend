// ─── 공지사항 (게시판) ───────────────────────────────────────────────────────

// GET /notices — Response content[]
export interface NoticeListItem {
  id: number
  title: string
  authorName: string
  createdAt: string
  updatedAt: string
}

// GET /notices/:id — Response
// POST /notices — Response (작성 응답도 동일한 모양이다)
export interface NoticeDetail {
  id: number
  title: string
  content: string
  authorName: string
  authorEmail: string
  createdAt: string
  updatedAt: string
  fileUrl: string | null
  originalFileName: string | null
}

// POST /notices — Request
export interface NoticeCreateRequest {
  title: string
  content: string
  deleteFile?: boolean
}

// PUT /notices/:id — Request (요청 본문이 작성과 동일하다)
export type NoticeUpdateRequest = NoticeCreateRequest

export interface NoticeSavePayload {
  request: NoticeCreateRequest | NoticeUpdateRequest
  file?: File
}
