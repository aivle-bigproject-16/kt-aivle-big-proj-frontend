import { spawn } from 'node:child_process'
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { WebSocketServer } from 'ws'

const RAW_PORT = 4001
const PROXY_PORT = 4000

async function readDb() {
  return JSON.parse(await readFile(new URL('./db.json', import.meta.url), 'utf-8'))
}

const child = spawn('npx', ['json-server', '--port', String(RAW_PORT), 'db.json'], {
  stdio: 'inherit',
  shell: true,
})

process.on('exit', () => child.kill())
process.on('SIGINT', () => process.exit())

function wrap(data) {
  if (Array.isArray(data)) {
    return {
      success: true,
      message: 'ok',
      data: {
        content: data,
        pageable: { page: 0, pageSize: data.length, totalElements: data.length, totalPages: 1 },
      },
    }
  }
  return { success: true, message: 'ok', data }
}

async function fetchWithRetry(url, options, retries = 20) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, options)
    } catch {
      await new Promise((r) => setTimeout(r, 200))
    }
  }
  throw new Error('upstream json-server not reachable')
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE',
      'access-control-allow-headers': 'content-type',
    })
    res.end()
    return
  }

  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const body = Buffer.concat(chunks)
  const url = new URL(req.url, `http://localhost:${PROXY_PORT}`)

  // POST /api/dashboard — 실제 API는 body(조회 조건)를 받아 KPI 데이터를 계산해 반환하는
  // 액션이라, json-server의 "레코드 생성" 의미(body 그대로 저장)와 맞지 않는다.
  // db.json에 미리 넣어둔 대시보드 데이터를 그대로 반환하도록 특수 처리한다.
  if (req.method === 'POST' && url.pathname === '/api/dashboard') {
    const { graphType } = JSON.parse(body.toString() || '{}')
    const db = await readDb()
    const dashboard = db.dashboard?.[0]
    const graphData = graphType === 'DEFECT_TYPE' ? dashboard?.defectTypeGraphData : dashboard?.graphData
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
    res.end(JSON.stringify(wrap(dashboard ? { ...dashboard, graphData } : null)))
    return
  }

  // POST /api/auth/login — users 리소스에서 email/password를 대조해 실제 로그인처럼 동작시킨다.
  if (req.method === 'POST' && url.pathname === '/api/auth/login') {
    const { email, password } = JSON.parse(body.toString() || '{}')
    const db = await readDb()
    const user = db.users?.find((u) => u.email === email && u.password === password)
    if (!user) {
      res.writeHead(401, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
      res.end(JSON.stringify({ success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.', data: null }))
      return
    }
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
    res.end(JSON.stringify(wrap({ name: user.name, role: user.role })))
    return
  }

  // POST /api/auth/signup — 실제 회원가입 로직 없이 성공만 흉내낸다.
  if (req.method === 'POST' && url.pathname === '/api/auth/signup') {
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
    res.end(JSON.stringify(wrap({})))
    return
  }

  // POST /api/sim — 요청받은 batchSize/batteryCellCount/captureSpeed로 셀·배치를 생성하고 진행을 시작한다.
  if (req.method === 'POST' && url.pathname === '/api/sim') {
    const { batchSize, batteryCellCount, captureSpeed } = JSON.parse(body.toString() || '{}')
    if (!batchSize || !batteryCellCount || !captureSpeed) {
      res.writeHead(400, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
      res.end(JSON.stringify({ success: false, message: 'batchSize, batteryCellCount, captureSpeed는 필수입니다.', data: null }))
      return
    }
    startSimulation({ batchSize, batteryCellCount, captureSpeed })
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
    res.end(JSON.stringify(wrap(snapshot())))
    return
  }

  // GET /api/sim — 진행 상황 복구용. 시작된 적이 없으면 COMPLETED로 응답한다.
  if (req.method === 'GET' && url.pathname === '/api/sim') {
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
    res.end(JSON.stringify(wrap(snapshot())))
    return
  }

  // GET /api/battery/:batteryCellId — 상세 조회. batteryDetail 컬렉션에서 찾아 반환한다.
  const batteryDetailMatch = url.pathname.match(/^\/api\/battery\/(\d+)$/)
  if (req.method === 'GET' && batteryDetailMatch) {
    const batteryCellId = Number(batteryDetailMatch[1])
    const db = await readDb()
    const item = db.batteryDetail?.find((b) => b.batteryCellId === batteryCellId)
    if (!item) {
      res.writeHead(404, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
      res.end(JSON.stringify({ success: false, message: '해당 배터리가 존재하지 않습니다.', data: null }))
      return
    }
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
    res.end(JSON.stringify({ success: true, message: '배터리 상세 조회가 완료되었습니다.', data: item }))
    return
  }

  // GET /api/reports/individual/:reportId/cell-view
  const cellViewMatch = url.pathname.match(/^\/api\/reports\/individual\/(\d+)\/cell-view$/)
  if (req.method === 'GET' && cellViewMatch) {
    const reportId = Number(cellViewMatch[1])
    const db = await readDb()
    const item = db.cellDefectViews?.find((v) => v.reportId === reportId)
    if (!item) {
      res.writeHead(404, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
      res.end(JSON.stringify({ success: false, message: '해당 셀 결함 뷰 데이터가 없습니다.', data: null }))
      return
    }
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
    res.end(JSON.stringify(wrap(item)))
    return
  }

  // GET /api/reports/individual/:reportId, GET /api/reports/daily/:reportId
  // 3단계 경로라 json-server의 /:name/:id 라우트가 못 잡는다.
  // db.json의 reports[].content 배열에서 직접 항목을 찾아 반환한다.
  const individualDetailMatch = url.pathname.match(/^\/api\/reports\/individual\/(\d+)$/)
  const dailyDetailMatch = url.pathname.match(/^\/api\/reports\/daily\/(\d+)$/)

  if (req.method === 'GET' && individualDetailMatch) {
    const reportId = Number(individualDetailMatch[1])
    const db = await readDb()
    const item = db.reports
      ?.find((r) => r.id === 'individual')
      ?.content?.find((r) => r.reportId === reportId)
    if (!item) {
      res.writeHead(404, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
      res.end(JSON.stringify({ success: false, message: '해당 개별 리포트가 없습니다.', data: null }))
      return
    }
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
    res.end(JSON.stringify(wrap(item)))
    return
  }

  if (req.method === 'GET' && dailyDetailMatch) {
    const reportId = Number(dailyDetailMatch[1])
    const db = await readDb()
    const item = db.reports
      ?.find((r) => r.id === 'daily')
      ?.content?.find((r) => r.reportId === reportId)
    if (!item) {
      res.writeHead(404, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
      res.end(JSON.stringify({ success: false, message: '해당 일일 리포트가 없습니다.', data: null }))
      return
    }
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
    res.end(JSON.stringify(wrap(item)))
    return
  }

  try {
    // json-server는 db.json의 리소스 키(예: /battery, /users)로 라우팅하므로 /api 프리픽스를 모른다.
    const upstreamPath = req.url.replace(/^\/api(?=\/|$)/, '')
    const upstream = await fetchWithRetry(`http://localhost:${RAW_PORT}${upstreamPath}`, {
      method: req.method,
      headers: { 'content-type': 'application/json' },
      body: ['GET', 'HEAD'].includes(req.method ?? 'GET') ? undefined : body,
    })

    const status = upstream.status
    const contentType = upstream.headers.get('content-type') ?? ''

    if (!contentType.includes('application/json')) {
      res.writeHead(status, { 'access-control-allow-origin': '*' })
      res.end(await upstream.text())
      return
    }

    const json = await upstream.json()
    res.writeHead(status, {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
    })
    res.end(JSON.stringify(wrap(json)))
  } catch (err) {
    res.writeHead(502, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
    res.end(JSON.stringify({ success: false, message: String(err), data: null }))
  }
})

// --- /ws/sim, /api/sim — 검사 진행 상황(simulation.progress) mock ---
// 셀 단위로 진행 상황을 관리한다. 촬영(capture)은 배치 단위로, 분석(analyze)은 셀 단위로 진행한다.
let registered = []   // CellProgress[] — 대기 중인 셀
let capture = []      // CellProgress[] — 현재 촬영 배치의 셀들 (CAPTURING | CAPTURED)
let analyze = null    // CellProgress | null — 분석 중인 단일 셀
let completed = []    // CellProgress[] — 공정 완료 셀
let captureSpeedSec = null
let hasStartedOnce = false
let totalCellCount = 0
let totalBatchCount = 0
let runId = 0

function snapshot(forceProgress = false) {
  if (!hasStartedOnce) return { event: 'COMPLETED' }

  if (
    !forceProgress &&
    completed.length === totalCellCount &&
    totalCellCount > 0 &&
    analyze === null &&
    capture.length === 0
  ) {
    console.log(`[snap] COMPLETED`)
    return { event: 'COMPLETED' }
  }

  console.log(`[snap] PROGRESS: registered=${registered.length}, capture=${capture.length}, analyze=${analyze ? analyze.batteryCellId : 'null'}, completed=${completed.length}/${totalCellCount}`)
  return {
    event: 'PROGRESS',
    batchCount: totalBatchCount,
    batteryCellCount: totalCellCount,
    captureSpeed: captureSpeedSec,
    registered,
    capture,
    analyze,
    completed,
  }
}

// ── 최소 STOMP 프레임 파서 / 빌더 ──
function parseStompFrame(raw) {
  const text = raw.toString().replace(/\0$/, '')
  const lines = text.split('\n')
  const command = lines[0].trim()
  const headers = {}
  let i = 1
  while (i < lines.length && lines[i].trim() !== '') {
    const colon = lines[i].indexOf(':')
    if (colon >= 0) headers[lines[i].slice(0, colon).trim()] = lines[i].slice(colon + 1).trim()
    i++
  }
  const body = lines.slice(i + 1).join('\n').replace(/\0$/, '')
  return { command, headers, body }
}

function buildStompFrame(command, headers = {}, body = '') {
  const h = Object.entries(headers).map(([k, v]) => `${k}:${v}`).join('\n')
  return `${command}\n${h}\n\n${body}\0`
}

function sendStompMessage(socket, body) {
  if (socket.readyState !== socket.OPEN) return
  const subs = socket._stompSubs ?? {}
  for (const [id, dest] of Object.entries(subs)) {
    if (dest === '/topic/sim') {
      socket.send(buildStompFrame('MESSAGE', {
        subscription: id,
        'message-id': Date.now(),
        destination: '/topic/sim',
        'content-type': 'application/json',
      }, body))
    }
  }
}

function broadcastSnapshot(forceProgress = false) {
  const payload = JSON.stringify(snapshot(forceProgress))
  for (const client of wss.clients) {
    sendStompMessage(client, payload)
  }
}

function makeCells(batchSize, batteryCellCount) {
  const cells = []
  let remaining = batteryCellCount
  let batchId = 1

  while (remaining > 0) {
    const cellCount = Math.min(batchSize, remaining)
    for (let i = 1; i <= cellCount; i++) {
      const cellId = Number(`${batchId}${String(i).padStart(3, '0')}`)
      cells.push({
        batteryCellId: cellId,
        inspectionId: cellId,
        finalLabel: null,
        batchId,
        status: 'REGISTERED',
      })
    }
    remaining -= cellCount
    batchId += 1
  }

  return cells
}

const ANALYZE_DELAY_MIN_MS = 1000
const ANALYZE_DELAY_MAX_MS = 5000

function randomAnalyzeDelayMs() {
  return Math.floor(Math.random() * (ANALYZE_DELAY_MAX_MS - ANALYZE_DELAY_MIN_MS + 1)) + ANALYZE_DELAY_MIN_MS
}

// 캡처 완료 셀 하나를 분석 슬롯으로 이동한다.
function analyzeCell(cell, myRunId) {
  if (myRunId !== runId) return

  capture = capture.filter((c) => c.batteryCellId !== cell.batteryCellId)
  cell.status = 'ANALYZING'
  analyze = cell
  broadcastSnapshot()
  console.log(`[sim] cell ${cell.batteryCellId} (batch ${cell.batchId}) → ANALYZING`)

  const analyzeDelayMs = randomAnalyzeDelayMs()
  setTimeout(() => {
    if (myRunId !== runId) return

    const r = Math.random()
    cell.finalLabel = r < 0.75 ? 'PASS' : r < 0.95 ? 'REJECT' : 'FAIL'
    cell.status = 'COMPLETED'
    analyze = null
    completed = [cell, ...completed]
    broadcastSnapshot(true)
    console.log(`[sim] cell ${cell.batteryCellId} → COMPLETED (${cell.finalLabel})`)

    // 다음 CAPTURED 셀 분석 — 없으면 완료 체크
    const nextCapture = capture.find((c) => c.status === 'CAPTURED')
    if (nextCapture) {
      analyzeCell(nextCapture, myRunId)
    } else if (registered.length === 0 && !capture.some((c) => c.status === 'CAPTURING')) {
      broadcastSnapshot()
      console.log('[sim] all cells completed')
    }
  }, analyzeDelayMs)
}

// registered에서 다음 배치의 셀을 꺼내 capture에 추가한다.
// CAPTURED 셀이 남아 있어도 CAPTURING 배치가 없으면 즉시 다음 배치를 시작한다.
function processNextBatch(myRunId) {
  if (myRunId !== runId) return
  // 이미 촬영 중인 배치가 있으면 대기
  if (capture.some((c) => c.status === 'CAPTURING')) return

  if (registered.length === 0) return

  const nextBatchId = registered[0].batchId
  const batchCells = []
  while (registered.length > 0 && registered[0].batchId === nextBatchId) {
    const cell = registered.shift()
    cell.status = 'CAPTURING'
    batchCells.push(cell)
  }
  // 기존 CAPTURED 셀에 새 CAPTURING 셀을 추가 (적재와 촬영 동시)
  capture = [...capture, ...batchCells]
  broadcastSnapshot()
  console.log(`[sim] batch ${nextBatchId} → CAPTURING (${captureSpeedSec}s), cells=${batchCells.length}, capture총=${capture.length}`)

  setTimeout(() => {
    if (myRunId !== runId) return

    for (const cell of capture.filter((c) => c.batchId === nextBatchId && c.status === 'CAPTURING')) {
      cell.status = 'CAPTURED'
    }
    broadcastSnapshot()
    console.log(`[sim] batch ${nextBatchId} → CAPTURED`)

    // CAPTURED 즉시 다음 배치 촬영 시작
    processNextBatch(myRunId)

    // 분석 슬롯이 비어 있으면 첫 번째 CAPTURED 셀 분석 시작
    if (analyze === null) {
      const firstCapture = capture.find((c) => c.status === 'CAPTURED')
      if (firstCapture) analyzeCell(firstCapture, myRunId)
    }
  }, captureSpeedSec * 1000)
}

function startSimulation({ batchSize, batteryCellCount, captureSpeed }) {
  runId += 1
  const myRunId = runId

  const cells = makeCells(batchSize, batteryCellCount)
  totalCellCount = cells.length
  totalBatchCount = Math.ceil(batteryCellCount / batchSize)
  registered = cells
  capture = []
  analyze = null
  completed = []
  captureSpeedSec = captureSpeed
  hasStartedOnce = true

  console.log(`[sim] started: batchSize=${batchSize} batteryCellCount=${batteryCellCount} captureSpeed=${captureSpeed}s, totalCells=${totalCellCount}, totalBatches=${totalBatchCount}`)
  setTimeout(() => processNextBatch(myRunId), 0)
}

const wss = new WebSocketServer({ server, path: '/ws/sim' })

wss.on('connection', (socket) => {
  socket._stompSubs = {}

  socket.on('message', (raw) => {
    const frame = parseStompFrame(raw.toString())

    if (frame.command === 'CONNECT' || frame.command === 'STOMP') {
      socket.send(buildStompFrame('CONNECTED', {
        version: '1.2',
        'heart-beat': '0,0',
        server: 'mock/1.0',
      }))
      // 연결 즉시 현재 스냅샷 전송은 SUBSCRIBE 후에 한다
      return
    }

    if (frame.command === 'SUBSCRIBE') {
      const id = frame.headers.id ?? 'sub-0'
      const dest = frame.headers.destination ?? ''
      socket._stompSubs[id] = dest
      console.log(`[stomp] SUBSCRIBE id=${id} dest=${dest}`)
      // 구독 즉시 현재 스냅샷 전송
      if (dest === '/topic/sim') {
        sendStompMessage(socket, JSON.stringify(snapshot()))
      }
      return
    }

    if (frame.command === 'UNSUBSCRIBE') {
      delete socket._stompSubs[frame.headers.id]
      return
    }

    if (frame.command === 'DISCONNECT') {
      socket.send(buildStompFrame('RECEIPT', { 'receipt-id': frame.headers.receipt ?? '' }))
      socket.close()
      return
    }
  })
})

server.listen(PROXY_PORT, () => {
  console.log(`mock API wrapper listening on http://localhost:${PROXY_PORT} (upstream json-server on ${RAW_PORT})`)
  console.log(`mock WS listening on ws://localhost:${PROXY_PORT}/ws/sim`)
  console.log('POST /api/sim { batchSize, batteryCellCount, captureSpeed } 요청으로 시뮬레이션을 시작합니다.')
})
