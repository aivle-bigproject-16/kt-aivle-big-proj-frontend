export type CellType = 'POUCH' | 'CYLINDRICAL' | 'PRISMATIC'
export type FinalLabel = 'PASS' | 'REJECT' | 'FAIL'
export type ImageType = 'CT' | 'RGB'
export type ReportStatus = 'COMPLETED' | 'PENDING' | 'FAILED'

// GET /battery
export interface BatteryListItem {
  inspectionId: number | null
  batchId: number | null
  batteryCellId: number
  cellSerialNo: string | null
  modelName: string | null
  cellType: CellType | null
  latestFinalLabel: FinalLabel | null
  latestAnalyzedAt: string | null
}

// GET /battery/:batteryCellId
export interface InspectionImage {
  imageId: number
  inspectionId: number
  inspectionType: ImageType
  imageType: ImageType
  imageUrl: string
}

export interface Bbox {
  x: number
  y: number
  width: number
  height: number
}

export interface DefectResult {
  defectResultId: number
  inspectionId: number
  attemptNo: number
  label: FinalLabel
  imageId: number
  imageType: ImageType
  defectType: string
  imageUrl: string
  confidence: number
  bbox: Bbox | null
}

export interface Inspection {
  batchId: number
  inspectionIds: number[]
  finalLabel: FinalLabel
  analyzedAt: string
  images: InspectionImage[]
  defectResults: DefectResult[]
}

export interface BatteryDetailReport {
  reportId: number
  inspectionId: number
  status: ReportStatus
  title: string
  createdAt: string
  updatedAt: string | null
}

export interface BatteryDetail {
  batteryCellId: number
  cellSerialNo: string
  purchaseId: string | null
  productId: string | null
  modelName: string | null
  cellType: CellType | null
  manufacturedDate: string | null
  createdAt: string
  updatedAt: string | null
  inspections: Inspection[]
  reports: BatteryDetailReport[]
}
