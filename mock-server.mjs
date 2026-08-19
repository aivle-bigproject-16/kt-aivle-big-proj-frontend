import { spawn } from 'node:child_process'
import http from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { WebSocketServer } from 'ws'

const RAW_PORT = 4001
const PROXY_PORT = 8080
const emailCodes = new Map()

async function readDb() {
  return JSON.parse(await readFile(new URL('./db.json', import.meta.url), 'utf-8'))
}

// 공지사항은 작성·수정·삭제가 있어 db.json에 다시 써야 한다.
// (/notices 경로는 모두 아래에서 직접 처리하므로 json-server와 충돌하지 않는다)
async function writeDb(db) {
  await writeFile(new URL('./db.json', import.meta.url), JSON.stringify(db, null, 2))
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

async function parseNoticeRequest(req, body) {
  const contentType = req.headers['content-type'] ?? ''
  if (contentType.includes('application/json')) {
    return { request: JSON.parse(body.toString() || '{}'), file: null }
  }

  const formData = await new Request('http://localhost/notices', {
    method: req.method,
    headers: { 'content-type': contentType },
    body,
  }).formData()
  const filePart = formData.get('file')

  return {
    request: {
      title: String(formData.get('title') ?? ''),
      content: String(formData.get('content') ?? ''),
      deleteFile: formData.get('deleteFile') === 'true',
    },
    file: typeof filePart === 'string' ? null : filePart,
  }
}

/* db.json의 batteryDetail[].inspections[]는 원시 형태(inspectionId 단수, image 단수)라
   프런트 Inspection 타입(batchId/inspectionIds 배치 묶음, images 복수)과 안 맞는다 —
   실제 백엔드는 여러 inspectionId를 하나의 배치(batchId)로 묶어 내려주지만, 목 데이터는
   그 배치 개념이 없으니 raw inspection 하나를 배치 하나로 취급해 변환한다 */
function toBatchedInspections(rawInspections) {
  return (rawInspections ?? []).map((insp) => ({
    batchId: insp.inspectionId,
    inspectionIds: [insp.inspectionId],
    finalLabel: insp.finalLabel,
    analyzedAt: insp.analyzedAt,
    images: (insp.image ?? []).map((img) => ({
      imageId: img.imageId,
      inspectionId: insp.inspectionId,
      inspectionType: img.imageType,
      imageType: img.imageType,
      imageUrl: img.imageUrl,
    })),
    defectResults: (insp.defectResults ?? []).map((d) => ({
      defectResultId: d.defectResultId,
      inspectionId: insp.inspectionId,
      attemptNo: 1,
      label: d.label,
      imageId: d.imageId,
      imageType: d.imageType,
      defectType: d.defectType,
      imageUrl: d.imageUrl,
      confidence: d.confidence,
      bbox: d.bbox,
    })),
  }))
}

// sort=createdAt,desc|asc 형식을 해석해 정렬한다. 파라미터가 없으면 desc(최신순) 기본값.
function sortByCreatedAt(items, sortParam) {
  const order = sortParam?.split(',')[1] === 'asc' ? 'asc' : 'desc'
  const sorted = [...items].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  return order === 'desc' ? sorted.reverse() : sorted
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

  // POST /dashboard — 실제 API는 body(조회 조건)를 받아 KPI 데이터를 계산해 반환하는
  // 액션이라, json-server의 "레코드 생성" 의미(body 그대로 저장)와 맞지 않는다.
  // db.json에 미리 넣어둔 대시보드 데이터를 그대로 반환하도록 특수 처리한다.
  if (req.method === 'POST' && url.pathname === '/dashboard') {
    const { graphType } = JSON.parse(body.toString() || '{}')
    const db = await readDb()
    const dashboard = db.dashboard?.[0]
    const graphData = graphType === 'DEFECT_TYPE' ? dashboard?.defectTypeGraphData : dashboard?.graphData
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
    res.end(JSON.stringify(wrap(dashboard ? { ...dashboard, graphData } : null)))
    return
  }

  // POST /auth/login — users 리소스에서 email/password를 대조해 실제 로그인처럼 동작시킨다.
  if (req.method === 'POST' && url.pathname === '/auth/login') {
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

  // POST /auth/signup — 실제 회원가입 로직 없이 성공만 흉내낸다.
  if (req.method === 'POST' && url.pathname === '/auth/email/send') {
    const { email } = JSON.parse(body.toString() || '{}')
    emailCodes.set(email, '123456')
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
    res.end()
    return
  }

  if (req.method === 'POST' && url.pathname === '/auth/email/verify') {
    const { email, code } = JSON.parse(body.toString() || '{}')
    if (emailCodes.get(email) !== code) {
      res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8', 'access-control-allow-origin': '*' })
      res.end('인증번호가 일치하지 않거나 만료되었습니다.')
      return
    }
    emailCodes.delete(email)
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8', 'access-control-allow-origin': '*' })
    res.end('인증이 완료되었습니다.')
    return
  }

  if (req.method === 'POST' && url.pathname === '/auth/signup') {
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
    res.end(JSON.stringify(wrap({})))
    return
  }

  // POST /sim — 요청받은 batchSize/batteryCellCount/captureSpeed로 셀·배치를 생성하고 진행을 시작한다.
  if (req.method === 'POST' && url.pathname === '/sim') {
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

  // GET /sim — 진행 상황 복구용. 시작된 적이 없으면 COMPLETED로 응답한다.
  if (req.method === 'GET' && url.pathname === '/sim') {
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
    res.end(JSON.stringify(wrap(snapshot())))
    return
  }

  // GET /battery/:batteryCellId — 상세 조회. batteryDetail 컬렉션에서 찾아 반환한다.
  const batteryDetailMatch = url.pathname.match(/^\/battery\/(\d+)$/)
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
    res.end(
      JSON.stringify({
        success: true,
        message: '배터리 상세 조회가 완료되었습니다.',
        data: { ...item, inspections: toBatchedInspections(item.inspections) },
      }),
    )
    return
  }

  // GET /reports/individual/:reportId, GET /reports/daily/:reportId
  // 3단계 경로라 json-server의 /:name/:id 라우트가 못 잡는다.
  // db.json의 reports[].content 배열에서 직접 항목을 찾아 반환한다.
  const individualDetailMatch = url.pathname.match(/^\/reports\/individual\/(\d+)$/)
  const dailyDetailMatch = url.pathname.match(/^\/reports\/daily\/(\d+)$/)

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

  // GET /reports/individual, GET /reports/daily — 목록 조회.
  // json-server는 이 경로를 reports 컬렉션의 id="individual"/id="daily" 레코드 조회로 해석해버리므로
  // (해당 문서 자체를 반환) 직접 가로채 list-item 형태로 매핑하고 sort 파라미터를 적용한다.
  if (req.method === 'GET' && url.pathname === '/reports/individual') {
    const db = await readDb()
    const content = db.reports?.find((r) => r.id === 'individual')?.content ?? []
    const sorted = sortByCreatedAt(content, url.searchParams.get('sort'))
    const listItems = sorted.map((r) => ({
      reportId: r.reportId,
      status: r.status,
      title: r.title,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }))
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
    res.end(JSON.stringify(wrap(listItems)))
    return
  }

  if (req.method === 'GET' && url.pathname === '/reports/daily') {
    const db = await readDb()
    const content = db.reports?.find((r) => r.id === 'daily')?.content ?? []
    const sorted = sortByCreatedAt(content, url.searchParams.get('sort'))
    const listItems = sorted.map((r) => ({
      reportId: r.reportId,
      reportDate: r.reportDate,
      status: r.status,
      title: r.title,
      createdAt: r.createdAt,
    }))
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
    res.end(JSON.stringify(wrap(listItems)))
    return
  }

  // ── 공지사항(게시판) ──────────────────────────────────────────────────────
  // 목록은 명세서의 list-item 형태(본문 content 제외)로 매핑해 최신순으로 반환한다.
  if (req.method === 'GET' && url.pathname === '/notices') {
    const db = await readDb()
    const sorted = sortByCreatedAt(db.notices ?? [], null)
    const listItems = sorted.map((n) => ({
      id: n.id,
      title: n.title,
      authorName: n.authorName,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    }))
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
    res.end(JSON.stringify(wrap(listItems)))
    return
  }

  const noticeDetailMatch = url.pathname.match(/^\/notices\/(\d+)$/)

  if (req.method === 'GET' && noticeDetailMatch) {
    const db = await readDb()
    const notice = db.notices?.find((n) => n.id === Number(noticeDetailMatch[1]))
    if (!notice) {
      res.writeHead(404, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
      res.end(JSON.stringify({ success: false, message: '해당 공지사항이 없습니다.', data: null }))
      return
    }
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
    res.end(JSON.stringify(wrap(notice)))
    return
  }

  // 작성자 정보와 일시는 실제 서버가 세션·DB에서 채우는 값이라 mock이 대신 만들어 준다.
  if (req.method === 'POST' && url.pathname === '/notices') {
    const { request, file } = await parseNoticeRequest(req, body)
    const { title, content } = request
    if (!title || !content) {
      res.writeHead(400, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
      res.end(JSON.stringify({ success: false, message: '제목과 내용은 필수입니다.', data: null }))
      return
    }
    const db = await readDb()
    db.notices = db.notices ?? []
    const now = new Date().toISOString().slice(0, 19)
    const created = {
      id: db.notices.reduce((max, n) => Math.max(max, n.id), 0) + 1,
      title,
      content,
      authorName: '관리자',
      authorEmail: 'admin@test.com',
      createdAt: now,
      updatedAt: now,
      fileUrl: file ? `https://example.com/mock-files/${encodeURIComponent(file.name)}` : null,
      originalFileName: file?.name ?? null,
    }
    db.notices.push(created)
    await writeDb(db)
    res.writeHead(201, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
    res.end(JSON.stringify({ success: true, message: '공지사항 작성이 완료되었습니다.', data: created }))
    return
  }

  if (req.method === 'PUT' && noticeDetailMatch) {
    const { request, file } = await parseNoticeRequest(req, body)
    const { title, content, deleteFile } = request
    if (!title || !content) {
      res.writeHead(400, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
      res.end(JSON.stringify({ success: false, message: '제목과 내용은 필수입니다.', data: null }))
      return
    }
    const db = await readDb()
    const notice = db.notices?.find((n) => n.id === Number(noticeDetailMatch[1]))
    if (!notice) {
      res.writeHead(404, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
      res.end(JSON.stringify({ success: false, message: '해당 공지사항이 없습니다.', data: null }))
      return
    }
    notice.title = title
    notice.content = content
    if (file) {
      notice.fileUrl = `https://example.com/mock-files/${encodeURIComponent(file.name)}`
      notice.originalFileName = file.name
    } else if (deleteFile) {
      notice.fileUrl = null
      notice.originalFileName = null
    }
    notice.updatedAt = new Date().toISOString().slice(0, 19)
    await writeDb(db)
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
    res.end(JSON.stringify({ success: true, message: '공지사항 수정이 완료되었습니다.', data: notice }))
    return
  }

  // 명세서에는 204로 적혀 있으나 204는 본문을 보낼 수 없어, 공통 응답 형식을 유지하려면 200이어야 한다.
  // (BE 확인 대기 중 — 204로 확정되면 이 응답에서 본문을 빼고 FE도 함께 맞춘다)
  if (req.method === 'DELETE' && noticeDetailMatch) {
    const db = await readDb()
    const index = db.notices?.findIndex((n) => n.id === Number(noticeDetailMatch[1])) ?? -1
    if (index === -1) {
      res.writeHead(404, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
      res.end(JSON.stringify({ success: false, message: '해당 공지사항이 없습니다.', data: null }))
      return
    }
    db.notices.splice(index, 1)
    await writeDb(db)
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
    res.end(JSON.stringify({ success: true, message: '공지사항 삭제가 완료되었습니다.', data: null }))
    return
  }

  try {
    // json-server는 db.json의 리소스 키(예: /battery, /users)로 그대로 라우팅한다.
    // 이 서버로 들어오는 요청은 이미 /api 접두어가 없으므로 req.url을 그대로 넘긴다.
    const upstream = await fetchWithRetry(`http://localhost:${RAW_PORT}${req.url}`, {
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

// --- /ws/sim, /sim — 검사 진행 상황(simulation.progress) mock ---
// 셀 단위로 진행 상황을 관리한다. 촬영(capture)은 배치 단위로, 분석(analyze)은 셀 단위로 진행한다.
let registered = []   // CellProgress[] — 대기 중인 셀
let capture = []      // CellProgress[] — 현재 촬영 배치의 셀들 (CAPTURING | CAPTURED)
let analyze = null    // CellProgress | null — 분석 중인 단일 셀
/* analyzeCell 체인이 진행 중인지 여부 — analyze는 완료 직전 연출용으로 잠깐 null이
   되므로(ANALYZE_TO_COMPLETED_GAP_MS) "분석 중이 아님"의 신호로 쓸 수 없다.
   그 null 공백 동안 processNextBatch가 analyze===null만 보고 새 analyzeCell을
   또 시작해버리는 레이스가 있었다 — 두 셀이 동시에 분석되며 완료가 몰아서 나왔다.
   이 락은 체인이 완전히 idle(다음 CAPTURED 셀이 없음)해질 때만 풀린다 */
let analyzing = false
let completed = []    // CellProgress[] — 공정 완료 셀
let captureSpeedSec = null
let hasStartedOnce = false
let totalCellCount = 0
let totalBatchCount = 0
let runId = 0

function snapshot(forceProgress = false) {
  if (!hasStartedOnce) {
    return {
      event: 'COMPLETED',
      batchCount: 0,
      batteryCellCount: 0,
      captureSpeed: null,
      registered: [],
      capture: [],
      analyze: null,
      completed: [],
    }
  }

  if (
    !forceProgress &&
    completed.length === totalCellCount &&
    totalCellCount > 0 &&
    analyze === null &&
    capture.length === 0
  ) {
    console.log(`[snap] COMPLETED`)
    return {
      event: 'COMPLETED',
      batchCount: totalBatchCount,
      batteryCellCount: totalCellCount,
      captureSpeed: captureSpeedSec,
      registered,
      capture,
      analyze,
      completed,
    }
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

const ANALYZE_DELAY_MS = 10000
const ANALYZE_TO_COMPLETED_GAP_MS = 300 // analyze가 null이 된 뒤 completed가 채워지기까지의 공백 재현용

function randomAnalyzeDelayMs() {
  return ANALYZE_DELAY_MS
}

// 캡처 완료 셀 하나를 분석 슬롯으로 이동한다.
function analyzeCell(cell, myRunId) {
  if (myRunId !== runId) return

  analyzing = true
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

    // 1단계 — analyze만 먼저 null로 비우고 broadcast. 실제 백엔드에서 분석 중이던
    // 셀이 완료로 넘어갈 때 잠깐 analyze가 비는 구간을 재현한다(completed는 아직 안 채움)
    analyze = null
    broadcastSnapshot(true)
    console.log(`[sim] cell ${cell.batteryCellId} → ANALYZE 비움 (완료 반영 대기 중)`)

    setTimeout(() => {
      if (myRunId !== runId) return

      // 2단계 — 공백 이후 completed에 반영
      completed = [cell, ...completed]
      broadcastSnapshot(true)
      console.log(`[sim] cell ${cell.batteryCellId} → COMPLETED (${cell.finalLabel})`)

      // 다음 CAPTURED 셀 분석 — 없으면 락을 풀고 완료 체크.
      // analyzeCell을 다시 부를 거면 그 안에서 바로 analyzing=true로 재설정되니
      // 여기서 먼저 풀었다가 다시 잠그는 중간 틈을 만들지 않는다
      const nextCapture = capture.find((c) => c.status === 'CAPTURED')
      if (nextCapture) {
        analyzeCell(nextCapture, myRunId)
      } else {
        analyzing = false
        if (registered.length === 0 && !capture.some((c) => c.status === 'CAPTURING')) {
          broadcastSnapshot()
          console.log('[sim] all cells completed')
        }
      }
    }, ANALYZE_TO_COMPLETED_GAP_MS)
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

    // 분석 체인이 idle일 때만 첫 번째 CAPTURED 셀 분석 시작 (analyze===null은
    // 완료 직전 잠깐도 참이라 락으로 쓸 수 없다 — analyzing 참고)
    if (!analyzing) {
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
  analyzing = false
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
  console.log('POST /sim { batchSize, batteryCellCount, captureSpeed } 요청으로 시뮬레이션을 시작합니다.')
})
