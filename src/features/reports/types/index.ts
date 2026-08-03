export type ReportStatus = 'PENDING' | 'COMPLETED' | 'FAILED'
export type ImageType = 'CT' | 'RGB'
export type FailureReason =
  | 'INCOMPLETE_SET'
  | 'AI_SERVER_ERROR'
  | 'TIMEOUT'
  | 'MALFORMED_RESPONSE'
  | 'PARTIAL_ANALYSIS_FAILURE'

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

// ─── 셀 3D 결함 뷰 ───────────────────────────────────────────────────────────

export type DefectPattern = 'LOCAL_CLUSTER' | 'AXIAL_PENETRATING' | 'VOLUMETRIC' | 'NONE'
export type Severity = 'HIGH' | 'MEDIUM' | 'LOW'

export interface DefectCloud {
  bounds: { a: number; b: number; c: number }
  points: [number, number, number, number][] // [a, b, c, area]
  metrics: { dvfPpm: number; posSliceRate: number; defectCount: number }
}

export interface VlmAnnotation {
  pattern: DefectPattern
  severity: Severity
  highlights: { zone: string; note: string }[]
  recommendedView: { azimuth: number; elevation: number }
  caption: string
  citedMetrics: string[]
}

// GET /reports/individual/:reportId/cell-view — Response
export interface CellDefectView {
  reportId: number
  cellId: number
  cloud: DefectCloud
  annotation: VlmAnnotation | null
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
