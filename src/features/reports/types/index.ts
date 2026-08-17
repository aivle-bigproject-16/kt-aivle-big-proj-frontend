export type ReportStatus = 'PENDING' | 'COMPLETED' | 'FAILED'
export type ImageType = 'CT' | 'RGB'
export type ImageAxis = 'x' | 'y' | 'z'
export type FailureReason =
  | 'INCOMPLETE_SET'
  | 'AI_SERVER_ERROR'
  | 'AI_SERVER_TIMEOUT'
  | 'TIMEOUT'
  | 'MALFORMED_RESPONSE'
  | 'PARTIAL_ANALYSIS_FAILURE'
  | 'WORKER_ERROR'

// ─── 공통 ────────────────────────────────────────────────────────────────────

export interface BboxCoords {
  x: number
  y: number
  width: number
  height: number
}

export interface ImageMapping {
  imageType: ImageType
  imageId: number
  imgUrl: string
  /** CT만 해당 — 슬라이스가 속한 볼륨의 총 슬라이스 수 */
  volume?: number
  /** CT만 해당 — 볼륨 내 이 슬라이스의 순번 */
  index?: number
  /** CT만 해당 — 슬라이스 축. 한 볼륨에 x/y/z 세 축이 전부 내려올 수 있다 */
  axis?: ImageAxis
  imageWidth?: number
  imageHeight?: number
  bbox: BboxCoords
}

// ─── 개별 리포트 ─────────────────────────────────────────────────────────────

// POST /reports/individual — Request
export interface IndividualReportCreateRequest {
  batteryCellId: number
  forceRegenerate?: boolean
}

// POST /reports/individual — Response
export interface IndividualReportCreateResponse {
  reportId: number
  reportDate: string
  status: ReportStatus
  message?: string
  createdAt: string
}

// GET /reports/individual/:reportId — Response
export interface IndividualReportDetail {
  reportId: number
  batteryCellId: number
  cellSerialNo: string
  status: ReportStatus
  finalLabel: 'PASS' | 'REJECT' | 'FAIL' | null
  inspectionStatus: 'COMPLETED' | 'FAILED' | null
  inspectionFailureType: string | null
  inspectionFailureReason: string | null
  title: string | null
  content: string | null
  rgbImages: string[]
  ctImages: string[]
  createdAt: string
  updatedAt: string | null
  imageMappings: ImageMapping[]
}

// GET /reports/individual — Response content[]
export interface IndividualReportListItem {
  reportId: number
  status: ReportStatus
  title: string | null
  createdAt: string
  updatedAt: string
}

// ─── 일일 리포트 ─────────────────────────────────────────────────────────────

// POST /reports/daily — Request
export interface DailyReportCreateRequest {
  reportDate: string
  forceRegenerate?: boolean
}

// POST /reports/daily — Response
export interface DailyReportCreateResponse {
  reportId: number
  reportDate: string
  status: ReportStatus
  message?: string
  createdAt: string
}

// GET /reports/daily/:id — Response
export interface DefectStat {
  defectType: string
  count: number
}

export interface DailyReportSummary {
  totalCount: number
  passCount: number
  rejectCount: number
  failedCount: number
  defects: DefectStat[]
}

export interface DailyReportDetail {
  reportId: number
  reportDate: string
  status: ReportStatus
  title: string | null
  content: string | null
  failureReason: FailureReason | null
  rgbImageUrl: string | null
  ctImageUrl: string | null
  createdAt: string
  updatedAt: string | null
  summary: DailyReportSummary
}

// ─── 일일 리포트 ─────────────────────────────────────────────────────────────

// GET /reports/daily — Response content[]
export interface DailyReportListItem {
  reportId: number
  reportDate: string
  status: ReportStatus
  title: string | null
  createdAt: string
}
