/* 트윈 스테이지 좌표 파사드.
   컴포넌트에는 좌표 리터럴을 쓰지 않는다 — 위치가 필요하면 전부 이 모듈에서 가져온다.
   좌표계는 SVG user unit = 디자인 px = 0.1rem (DASHBOARD_REDESIGN.md 부록 C와 동일 규약).
   viewBox 폭 1404 = 헤더 폭 140.4rem 이므로 1920px 뷰포트에서 1 user unit = 1px 이 된다. */

export const STAGE = { width: 1404, height: 480 } as const

/** 공정 본선의 세로 중심. 스테이션·벨트·분기점이 전부 이 선을 공유한다 */
export const LINE_Y = 240

export interface PuckSize {
  w: number
  h: number
  gapX: number
  gapY: number
}

/* 셀 퍽(오브젝트) 치수와 간격 — 컨테이너마다 따로 둔다:
   - STATION_PUCK: 대기(source)·촬영(capture)는 같은 스테이션 격자(320×340, 5열)를
     공유하니 퍽 크기도 같아야 자연스럽다.
   - ANALYZE_PUCK: 분석은 슬롯이 하나뿐이라 격자 제약이 없어 더 크게 키울 수 있다
     (검사 게이트 110×72 안에만 들어가면 된다).
   - BIN_PUCK: 정상/불량/실패 3개 배출함은 판정만 다를 뿐 같은 종류의 칸이므로
     서로 크기가 같아야 한다. 204×130 함 안에 3×3 격자로 들어가는 크기로 맞췄다. */
export const STATION_PUCK: PuckSize = { w: 70, h: 27, gapX: 5, gapY: 5 }
export const ANALYZE_PUCK: PuckSize = { w: 90, h: 35, gapX: 0, gapY: 0 }
export const BIN_PUCK: PuckSize = { w: 45, h: 20, gapX: 6, gapY: 6 }

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

/* 스테이션은 본선(LINE_Y)을 세로 중심으로 삼는다. 아래쪽에 배치 타임라인이 들어가면서
   높이를 300에서 340으로 늘렸고, 그만큼 격자가 두 행 더 들어간다 */
const STATION_H = 340
const STATION_Y = LINE_Y - STATION_H / 2

/**
 * 스테이션 3종.
 *
 * 촬영 스테이션은 WS `capture` 배열을 통째로 담는다 — 촬영 중(CAPTURING)과 촬영을
 * 마치고 분석을 기다리는 셀(CAPTURED)이 한 칸 안에 함께 놓이고, 둘은 색으로 구분한다.
 * 서버가 같은 배열로 내려주는 것을 화면에서 굳이 두 칸으로 쪼개지 않는다.
 */
/* 세 스테이션의 shell/floor 크기를 전부 동일하게 맞춘다(320 폭). capture가
   원래 450으로 제일 넓었는데, 그 폭을 나머지에 맞춰 늘리면(450×3+간격) 분기점(sorter,
   x=1130)을 넘어가 버려서 반대로 capture를 줄이는 쪽으로 통일했다 */
const STATION_W = 320
const STATION_GAP = 40

export const STATIONS = {
  source: { x: 20, y: STATION_Y, w: STATION_W, h: STATION_H },
  capture: { x: 20 + STATION_W + STATION_GAP, y: STATION_Y, w: STATION_W, h: STATION_H },
  analyze: { x: 20 + (STATION_W + STATION_GAP) * 2, y: STATION_Y, w: STATION_W, h: STATION_H },
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
/* BIN_PUCK(45×20, gap 6) 기준 — 가로 (3-1)×51+45=147≤175, 세로 (3-1)×26+20=72≤88,
   여유 있게 3×3으로 맞췄다 */
export const BIN_VISIBLE_COLS = 3
export const BIN_VISIBLE_ROWS = 3

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
  /** 있으면 열을 이 폭 안에서 space-between으로 벌린다(첫 칸 왼쪽 끝, 마지막 칸
      오른쪽 끝). 없으면 고정 PITCH_X로 왼쪽부터 채운다(bin 격자가 이 경우) */
  floorW?: number
}

/** 스테이션 세로 적재 공간 예산 — 헤더/푸터를 뺀 대략적인 가용 높이.
    스테이션 격자 공통 행 수는 여기서 STATION_PUCK 크기로 역산한다(스테이션
    높이가 같으므로 행 수도 같다) */
const STATION_GRID_H_BUDGET = 267
const STATION_PITCH_Y = STATION_PUCK.h + STATION_PUCK.gapY
const STATION_GRID_ROWS = Math.floor((STATION_GRID_H_BUDGET + STATION_PUCK.gapY) / STATION_PITCH_Y)

function stationGrid(key: StationKey, cols: number): GridSpec {
  const s = STATIONS[key]
  return {
    origin: { x: s.x + STATION_PAD, y: s.y + STATION_HEADER_H },
    cols,
    rows: STATION_GRID_ROWS,
    floorW: s.w - STATION_PAD * 2,
  }
}

/* 한 줄에 5개씩 — space-between(floorW)이 5칸을 바닥 폭 전체에 균등 배분한다 */
const SOURCE_GRID = stationGrid('source', 5)
const CAPTURE_GRID = stationGrid('capture', 5)

/** 구역별로 그릴 수 있는 최대 오브젝트 수. 초과분은 수치로만 표시한다 */
export const GRID_CAPACITY = {
  source: SOURCE_GRID.cols * SOURCE_GRID.rows,
  capture: CAPTURE_GRID.cols * CAPTURE_GRID.rows,
  bin: BIN_VISIBLE_COLS * BIN_VISIBLE_ROWS,
} as const

/** 격자 i번째 칸의 퍽 중심 좌표. 퍽 크기는 호출부가 컨테이너에 맞는 것을 넘긴다 */
function gridSlot(grid: GridSpec, index: number, puck: PuckSize): Point {
  const col = index % grid.cols
  const row = Math.floor(index / grid.cols)
  const pitchY = puck.h + puck.gapY

  const x =
    grid.floorW !== undefined && grid.cols > 1
      ? grid.origin.x + col * ((grid.floorW - puck.w) / (grid.cols - 1)) + puck.w / 2
      : grid.origin.x + col * (puck.w + puck.gapX) + puck.w / 2

  return {
    x,
    y: grid.origin.y + row * pitchY + puck.h / 2,
  }
}

export function sourceSlot(index: number): Point {
  return gridSlot(SOURCE_GRID, index, STATION_PUCK)
}

export function captureSlot(index: number): Point {
  return gridSlot(CAPTURE_GRID, index, STATION_PUCK)
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
  /* 좌측 액센트 바를 피해 안쪽으로 더 들어간다. 정상/불량/실패 3개 함이 전부
     같은 BIN_PUCK 크기를 쓰므로 셋의 격자가 완전히 동일하다 */
  return gridSlot(
    {
      origin: { x: bin.x + BIN_PAD + BIN_ACCENT_W, y: bin.y + BIN_HEADER_H + 8 },
      cols: BIN_VISIBLE_COLS,
      rows: BIN_VISIBLE_ROWS,
    },
    index,
    BIN_PUCK,
  )
}

/* ── 배치 타임라인 ───────────────────────────────────────── */

/** 스테이션 줄 아래에 놓이는 배치 진척 스트립. 가로 범위는 스테이션 줄과 정확히 맞춘다 */
export const TIMELINE = {
  x: STATIONS.source.x,
  y: 442,
  w: STATIONS.analyze.x + STATIONS.analyze.w - STATIONS.source.x,
  h: 18,
} as const

/** 스트립 위 캡션 텍스트의 baseline */
export const TIMELINE_CAPTION_BASELINE = 434

/** 이 폭보다 얇아지면 칸이 서로 붙어 개수를 셀 수 없다 — 그때는 통짜 막대로 내려간다 */
const TIMELINE_MIN_SEGMENT_W = 3

export interface TimelineSegments {
  width: number
  gap: number
}

/**
 * 배치 개수에 맞는 칸 폭과 간격. 칸이 너무 얇아지면 `null` 을 돌려주고,
 * 호출부는 배치별 칸 대신 비율만 보여주는 통짜 막대로 대체한다.
 */
export function timelineSegments(count: number): TimelineSegments | null {
  if (count <= 0) return null
  const gap = count > 40 ? 1 : 2
  const width = (TIMELINE.w - gap * (count - 1)) / count
  return width >= TIMELINE_MIN_SEGMENT_W ? { width, gap } : null
}

/** i번째 배치 칸의 좌측 x 좌표 */
export function timelineSegmentX(index: number, segments: TimelineSegments): number {
  return TIMELINE.x + index * (segments.width + segments.gap)
}

/** 스테이션의 오브젝트 적재 영역 — 헤더 아래, 푸터 위. 장치 그래픽이 이 안에서만 움직인다 */
export function stationFloor(key: StationKey): Box {
  const s = STATIONS[key]
  return {
    x: s.x + STATION_PAD,
    y: s.y + STATION_HEADER_H,
    w: s.w - STATION_PAD * 2,
    h: STATION_GRID_ROWS * STATION_PITCH_Y - STATION_PUCK.gapY,
  }
}

/** 분석 스테이션의 검사 게이트 — 퍽을 감싸는 사각 영역 */
export function analyzeScanFrame(): Box {
  const c = analyzeSlot()
  const w = 110
  const h = 72
  return { x: c.x - w / 2, y: c.y - h / 2, w, h }
}
