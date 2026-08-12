/* 트윈 스테이지 좌표 파사드.
   컴포넌트에는 좌표 리터럴을 쓰지 않는다 — 위치가 필요하면 전부 이 모듈에서 가져온다.
   좌표계는 디자인 px = 0.1rem (DASHBOARD_REDESIGN.md 부록 C와 동일 규약) — 예전엔 SVG
   viewBox의 user unit이었지만, 스테이지 전체가 HTML/CSS(div 절대 위치)로 바뀌면서
   이제는 그냥 "px 값을 10으로 나눈 rem"이라는 숫자 표기 규약만 남았다. 슈트(배출함
   곡선)만 예외로 SVG로 남아 있다 — HTML/CSS로는 베지어 곡선을 그릴 수 없어서다. */

export const STAGE = { width: 1404, height: 480 } as const

/** 좌표 리터럴(디자인 px 단위 숫자)을 rem 문자열로 바꾼다 — 1 unit = 0.1rem */
export function rem(n: number): string {
  return `${n / 10}rem`
}

/** 공정 본선의 세로 중심. 스테이션·벨트·분기점이 전부 이 선을 공유한다 */
export const LINE_Y = 240

export interface PuckSize {
  w: number
  h: number
  gapX: number
  gapY: number
}

/* 퍽 박스(w×h, 가로가 긴 landscape)는 안에 담기는 배터리 아이콘(portrait, viewBox 17×31)을
   -90도로 눕힌 모양과 같은 비율이어야 한다 — 즉 w:h = 31:17(아이콘의 세로:가로, ≈1.8235)를
   지켜야 아이콘이 박스에 꽉 차면서도 비율이 일그러지지 않는다. 컨테이너마다 이 비율을
   유지한 채 크기만 따로 둔다:
   - STATION_PUCK: 대기(source)·촬영(capture)는 같은 스테이션 격자(320×340, 5열)를
     공유하니 퍽 크기도 같아야 자연스럽다. 격자 바닥 폭(floorW = 320 − STATION_PAD×2 = 292)에
     5칸이 실제 간격을 두고 겹치지 않게 들어가는 한도(54×29.6)에서 0.95를 곱해 축소하고
     (비율은 그대로 31:17), 줄어든 만큼(w는 2.7, h는 1.48)을 그대로 gapX/gapY에 더해
     칸 사이가 더 벌어지게 했다.
   - ANALYZE_PUCK: 분석은 슬롯이 하나뿐이라 격자 제약이 없어 더 크게 키울 수 있다
     (검사 게이트 안에만 들어가면 된다). 게이트를 1.5배(165×108)로 키우면서 퍽도
     같은 1.5배로 키워 게이트 대비 비율을 유지했다.
   - BIN_PUCK: 정상/불량/실패 3개 배출함은 판정만 다를 뿐 같은 종류의 칸이므로
     서로 크기가 같아야 한다. 214×140 함 안에 4×4(16칸) 격자로 들어가는 크기로
     맞췄다 — 세로 예산이 더 빡빡해(4행이 정확히 86에 꽉 참) h=17로 먼저 정하고,
     w=31은 그 비율(31:17)로 나온 값을 그대로 썼다(아이콘 viewBox 17×31과 숫자가
     같은 건 우연이 아니라 비율이 정확히 31:17이기 때문이다). */
export const STATION_PUCK: PuckSize = { w: 51.3, h: 28.12, gapX: 7.7, gapY: 6.48 }
export const ANALYZE_PUCK: PuckSize = { w: 135, h: 74.1, gapX: 0, gapY: 0 }
export const BIN_PUCK: PuckSize = { w: 31, h: 17, gapX: 6, gapY: 6 }

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

export const STATION_HEADER_H = 50
export const STATION_PAD = 14
/** 스테이션 푸터 높이 — Twin.css의 .twin-station__footer height와 같다 */
export const STATION_FOOTER_H = 24

/* 스테이션 세로 공간을 헤더/바디/푸터로 명시적으로 나눈다. 바디(퍽 격자) 예산은
   "5×8칸이 실제 간격을 두고 정확히 들어가는 최소 높이"로 역산하고, 스테이션
   전체 높이는 헤더+바디+푸터를 그대로 더해서 만든다 — 매직 넘버로 340을 박아두지 않는다.
   스테이션은 본선(LINE_Y)을 세로 중심으로 삼는다 */
const STATION_BODY_ROWS = 8
const STATION_PITCH_Y = STATION_PUCK.h + STATION_PUCK.gapY
const STATION_GRID_H_BUDGET = STATION_BODY_ROWS * STATION_PITCH_Y - STATION_PUCK.gapY
const STATION_H = STATION_HEADER_H + STATION_GRID_H_BUDGET + STATION_FOOTER_H
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
/* BIN_PUCK(31×17, gap 6) 기준 — 가로 (5-1)×37+31=179≤185, 세로 (4-1)×23+17=86≤86,
   5×4(20칸)으로 맞췄다. 세로가 딱 맞게 꽉 차서(86=86) BIN_H를 더 줄이면 넘친다 */
export const BIN_VISIBLE_COLS = 5
export const BIN_VISIBLE_ROWS = 4

const BIN_X = 1180
const BIN_W = 214
const BIN_H = 140

/* 배출함 3개가 세로로 쌓이는 전체 예산은 STAGE.height(480) 뿐이라, 카드 하나만
   따로 늘릴 수 없다 — 위/아래 여백과 함 사이 간격을 15로 맞추고
   (15 + 140×3 + 15×2 + 15 = 480) 그 안에서 REJECT 함의 세로 중심이 LINE_Y 와
   같아야 가운데 슈트가 직선으로 이어진다 */
const BIN_MARGIN = 15
const BIN_GAP = 15
export const BINS = {
  PASS: { x: BIN_X, y: BIN_MARGIN, w: BIN_W, h: BIN_H },
  REJECT: { x: BIN_X, y: LINE_Y - BIN_H / 2, w: BIN_W, h: BIN_H },
  FAIL: { x: BIN_X, y: BIN_MARGIN + BIN_H + BIN_GAP + BIN_H + BIN_GAP, w: BIN_W, h: BIN_H },
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

/* 스테이션 격자 공통 행 수 — 헤더/바디/푸터 분리(위 STATION_BODY_ROWS)에서 그대로 가져온다.
   스테이션 높이가 셋 다 같으므로 행 수도 같다 */
const STATION_GRID_ROWS = STATION_BODY_ROWS

function stationGrid(key: StationKey, cols: number): GridSpec {
  const s = STATIONS[key]
  return {
    origin: { x: s.x + STATION_PAD + 2, y: s.y + STATION_HEADER_H },
    cols,
    rows: STATION_GRID_ROWS,
  }
}

/* 한 줄에 5개씩 — floorW를 안 줬으니 고정 pitch(퍽 실제 폭 + gapX)로 왼쪽부터 채운다.
   남는 공간은 늘려 붙이지 않고 그대로 오른쪽 끝 여백으로 남는다 */
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

/** 분석 스테이션의 검사 게이트 — 퍽을 감싸는 사각 영역.
    원래 110×72였던 걸 1.5배(165×108)로 키웠다 — ANALYZE_PUCK도 같은 배율로
    커져서 게이트 대비 퍽 비율(가로 0.818, 세로 0.686)은 그대로다 */
export function analyzeScanFrame(): Box {
  const c = analyzeSlot()
  const w = 165
  const h = 108
  return { x: c.x - w / 2, y: c.y - h / 2, w, h }
}
