/* 트윈 스테이지 좌표 파사드.
   컴포넌트에는 좌표 리터럴을 쓰지 않는다 — 위치가 필요하면 전부 이 모듈에서 가져온다.
   좌표계는 SVG user unit = 디자인 px = 0.1rem (DASHBOARD_REDESIGN.md 부록 C와 동일 규약).
   viewBox 폭 1404 = 헤더 폭 140.4rem 이므로 1920px 뷰포트에서 1 user unit = 1px 이 된다. */

export const STAGE = { width: 1404, height: 480 } as const

/** 공정 본선의 세로 중심. 스테이션·벨트·분기점이 전부 이 선을 공유한다 */
export const LINE_Y = 240

/** 셀 퍽(오브젝트) 치수와 간격 */
export const PUCK = { w: 26, h: 15, gapX: 6, gapY: 6 } as const
const PITCH_X = PUCK.w + PUCK.gapX
const PITCH_Y = PUCK.h + PUCK.gapY

export interface Point {
  x: number
  y: number
}

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

/* ── 스테이션 ─────────────────────────────────────────────── */

export const STATION_HEADER_H = 36
export const STATION_PAD = 14
/** 스테이션 푸터 텍스트 baseline — 박스 하단에서 위로 이만큼 */
export const STATION_FOOTER_OFFSET = 16

/* 스테이션 높이는 격자 12행(12×21−6=246)에 헤더·패딩을 더한 값이다.
   더 키우면 셀이 적을 때 빈 칸이 카드 대부분을 차지해 라인이 비어 보인다 */
const STATION_Y = 90
const STATION_H = 300

/**
 * 스테이션 3종.
 *
 * 촬영 스테이션은 WS `capture` 배열을 통째로 담는다 — 촬영 중(CAPTURING)과 촬영을
 * 마치고 분석을 기다리는 셀(CAPTURED)이 한 칸 안에 함께 놓이고, 둘은 색으로 구분한다.
 * 서버가 같은 배열로 내려주는 것을 화면에서 굳이 두 칸으로 쪼개지 않는다.
 */
export const STATIONS = {
  source: { x: 20, y: STATION_Y, w: 260, h: STATION_H },
  capture: { x: 320, y: STATION_Y, w: 450, h: STATION_H },
  analyze: { x: 810, y: STATION_Y, w: 260, h: STATION_H },
} as const satisfies Record<string, Box>

export type StationKey = keyof typeof STATIONS

/* ── 벨트 · 분기 ──────────────────────────────────────────── */

export const BELT_THICKNESS = 30

/** 스테이션 사이를 잇는 직선 벨트. y 는 전부 LINE_Y */
export const BELTS = [
  { id: 'source-capture', x1: STATIONS.source.x + STATIONS.source.w, x2: STATIONS.capture.x },
  { id: 'capture-analyze', x1: STATIONS.capture.x + STATIONS.capture.w, x2: STATIONS.analyze.x },
  { id: 'analyze-sorter', x1: STATIONS.analyze.x + STATIONS.analyze.w, x2: 1130 },
] as const

/** 판정에 따라 3방향으로 갈리는 분기점 */
export const SORTER: Point = { x: 1130, y: LINE_Y }

/* ── 배출함(bin) ──────────────────────────────────────────── */

export const BIN_HEADER_H = 34
export const BIN_PAD = 12
/** 배출함 좌측 판정색 액센트 바 폭 */
export const BIN_ACCENT_W = 5
export const BIN_VISIBLE_COLS = 5
export const BIN_VISIBLE_ROWS = 4

const BIN_X = 1180
const BIN_W = 204
const BIN_H = 130

/* REJECT 함의 세로 중심이 LINE_Y 와 같아야 가운데 슈트가 직선으로 이어진다 */
export const BINS = {
  PASS: { x: BIN_X, y: 20, w: BIN_W, h: BIN_H },
  REJECT: { x: BIN_X, y: LINE_Y - BIN_H / 2, w: BIN_W, h: BIN_H },
  FAIL: { x: BIN_X, y: 330, w: BIN_W, h: BIN_H },
} as const satisfies Record<string, Box>

export type BinKey = keyof typeof BINS

/** 배출함 입구 — 슈트가 도착하는 지점. 함의 세로 중심이다.
    REJECT 함의 중심은 본선(LINE_Y)과 같은 높이라 슈트가 직선으로 이어진다 */
export function binInlet(key: BinKey): Point {
  const bin = BINS[key]
  return { x: bin.x, y: bin.y + bin.h / 2 }
}

/** 분기점에서 배출함 입구까지의 슈트 경로. 수평으로 나갔다가 부드럽게 꺾인다 */
export function chutePath(key: BinKey): string {
  const inlet = binInlet(key)
  const mid = SORTER.x + (inlet.x - SORTER.x) / 2
  return `M ${SORTER.x} ${SORTER.y} C ${mid} ${SORTER.y}, ${mid} ${inlet.y}, ${inlet.x} ${inlet.y}`
}

/* ── 슬롯 격자 ────────────────────────────────────────────── */

interface GridSpec {
  origin: Point
  cols: number
  rows: number
}

/** 스테이션 격자 공통 행 수. 스테이션 높이가 같으므로 행 수도 같다.
    마지막 행 아래쪽이 푸터 텍스트와 겹치지 않는 최대값이 11이다 */
const STATION_GRID_ROWS = 11

function stationGrid(key: StationKey, cols: number): GridSpec {
  const s = STATIONS[key]
  return {
    origin: { x: s.x + STATION_PAD, y: s.y + STATION_HEADER_H },
    cols,
    rows: STATION_GRID_ROWS,
  }
}

const SOURCE_GRID = stationGrid('source', 7)
const CAPTURE_GRID = stationGrid('capture', 13)

/** 구역별로 그릴 수 있는 최대 오브젝트 수. 초과분은 수치로만 표시한다 */
export const GRID_CAPACITY = {
  source: SOURCE_GRID.cols * SOURCE_GRID.rows,
  capture: CAPTURE_GRID.cols * CAPTURE_GRID.rows,
  bin: BIN_VISIBLE_COLS * BIN_VISIBLE_ROWS,
} as const

/** 격자 i번째 칸의 퍽 중심 좌표 */
function gridSlot(grid: GridSpec, index: number): Point {
  const col = index % grid.cols
  const row = Math.floor(index / grid.cols)
  return {
    x: grid.origin.x + col * PITCH_X + PUCK.w / 2,
    y: grid.origin.y + row * PITCH_Y + PUCK.h / 2,
  }
}

export function sourceSlot(index: number): Point {
  return gridSlot(SOURCE_GRID, index)
}

export function captureSlot(index: number): Point {
  return gridSlot(CAPTURE_GRID, index)
}

/** 분석은 슬롯이 하나뿐이다. 스테이션 본문 정중앙 */
export function analyzeSlot(): Point {
  const s = STATIONS.analyze
  return {
    x: s.x + s.w / 2,
    y: s.y + STATION_HEADER_H + (s.h - STATION_HEADER_H - STATION_PAD) / 2,
  }
}

export function binSlot(key: BinKey, index: number): Point {
  const bin = BINS[key]
  /* 좌측 액센트 바를 피해 안쪽으로 더 들어간다.
     세로는 헤더 아래 8 을 띄우면 4행(3×21+15=78)이 함 바닥 안에 들어간다 */
  return gridSlot(
    {
      origin: { x: bin.x + BIN_PAD + BIN_ACCENT_W, y: bin.y + BIN_HEADER_H + 8 },
      cols: BIN_VISIBLE_COLS,
      rows: BIN_VISIBLE_ROWS,
    },
    index,
  )
}

/** 스테이션의 오브젝트 적재 영역 — 헤더 아래, 푸터 위. 장치 그래픽이 이 안에서만 움직인다 */
export function stationFloor(key: StationKey): Box {
  const s = STATIONS[key]
  return {
    x: s.x + STATION_PAD,
    y: s.y + STATION_HEADER_H,
    w: s.w - STATION_PAD * 2,
    h: STATION_GRID_ROWS * PITCH_Y - PUCK.gapY,
  }
}

/** 분석 스테이션의 검사 게이트 — 퍽을 감싸는 사각 영역 */
export function analyzeScanFrame(): Box {
  const c = analyzeSlot()
  const w = 110
  const h = 72
  return { x: c.x - w / 2, y: c.y - h / 2, w, h }
}
