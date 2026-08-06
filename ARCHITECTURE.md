# Architecture

## 기술 스택

- React 19 + TypeScript + React Compiler
- Vite (번들러)
- Bun (패키지 매니저)
- Zustand (상태관리)

## 폴더 구조

```
src/
├── features/
│     ├── header/
│     ├── auth/
│     ├── battery/
│     ├── dashboard/
│     ├── simulation/
│     └── reports/
│           각 feature: components/ hooks/ types/ store/ services/ index.ts
├── pages/
├── core/
│     ├── api/          (httpClient.ts, socketClient.ts, axios.d.ts)
│     ├── auth/         (현재 빈 폴더 — 쿠키 방식이라 토큰 저장 불필요)
│     └── navigation/   (router.tsx, PrivateRoute.tsx, RootLayout.tsx, routes.ts)
└── shared/
      ├── ui/
      ├── hooks/
      ├── utils/
      └── types/        (api.ts, store.ts)
```

### features/

비즈니스 도메인별 코드 모음. 각 feature는 독립적으로 동작.

| 폴더 | 역할 |
|---|---|
| `components/` | 해당 도메인 전용 UI 컴포넌트 |
| `hooks/` | 해당 도메인 전용 커스텀 훅 |
| `types/` | 해당 도메인 TypeScript 타입 |
| `store/` | Zustand 스토어 (state + actions) |
| `services/` | API 호출 함수 (httpClient / socketClient 사용) |
| `index.ts` | public API 진입점 — 외부 노출 항목만 export |

### pages/

라우트와 1:1 대응하는 페이지 컴포넌트. features를 조합해서 화면 구성.

| 파일 | 라우트 | 스토어 |
|---|---|---|
| `LoginPage.tsx` | `/auth/login` | `useLoginStore` |
| `SignupPage.tsx` | `/auth/signup` | `useSignupStore` |
| `DashboardPage.tsx` | `/dashboard` | `useSimulationStore` |
| `BatteryPage.tsx` | `/battery` | `useBatteryListStore` |
| `BatteryDetailPage.tsx` | `/battery/:batteryCellId` | `useBatteryDetailStore` |
| `IndividualReportPage.tsx` | `/reports/individual` | `useIndividualReportListStore` |
| `IndividualReportDetailPage.tsx` | `/reports/individual/:reportId` | `useIndividualReportDetailStore` |
| `DailyReportPage.tsx` | `/reports/daily` | `useDailyReportListStore` |
| `DailyReportDetailPage.tsx` | `/reports/daily/:reportId` | `useDailyReportDetailStore` |

### core/

| 파일 | 역할 |
|---|---|
| `api/httpClient.ts` | axios 인스턴스 + 인터셉터. response interceptor에서 `response.data` 반환해 `AxiosResponse` 래핑 제거 |
| `api/socketClient.ts` | `createSocket(path)` 단일 팩토리 — 비즈니스 로직 없음 |
| `api/axios.d.ts` | axios 반환 타입 재정의 (`Promise<AxiosResponse<T>>` → `Promise<T>`) |
| `navigation/` | Router, PrivateRoute, RootLayout, routes 상수, useLogout |

### 인증 (auth)

httpOnly 쿠키 기반. 로그인 응답 바디는 `{ name, role }`만 오고 세션은 `Set-Cookie`로 유지된다. FE는 토큰을 직접 저장하지 않는다 — `httpClient`가 `withCredentials: true`로 쿠키를 자동 첨부하며, 인증 여부는 `useLoginStore`의 `isAuthenticated` 플래그로만 추적한다.

**알려진 한계**: `isAuthenticated`는 메모리 상태라 새로고침 시 초기화된다. 세션 복구 로직은 미구현.

### shared/

2개 이상 feature에서 실제로 쓰이는 공통 코드만 위치.

| 컴포넌트 | 사용처 |
|---|---|
| `Pagination` | 배터리 목록, 리포트 목록 |
| `DetailLinkButton` | 배터리 목록, 리포트 목록 상세 이동 |
| `Modal` | 시뮬레이션 카드 모달 |

---

## 아키텍처 원칙

### 의존성 방향

```
shared/ → features/ → pages/
```

단방향. 역방향 및 features 간 직접 import 금지. 두 feature가 같은 코드를 필요로 하면 shared/로 이동. 각 feature는 index.ts로만 외부 노출.

### Zustand 스토어 방침

**스토어는 라우트 단위로 분리한다.** 같은 feature라도 목록/상세처럼 라우트가 다르면 스토어를 나눈다. 이유: 갱신 시점이 다른 데이터를 한 스토어에 묶으면 `reset()` 하나가 무관한 두 화면의 데이터를 동시에 지우는 등 모호함이 생긴다.

- 목록 → `use<Domain>ListStore`
- 상세 → `use<Domain>DetailStore`
- 같은 라우트라도 HTTP(KPI)와 WS(실시간)처럼 갱신 주기가 다르면 스토어를 나눈다
- 생성 액션은 **데이터가 최종 표시되는 라우트의 스토어**에 둔다
- state와 actions를 분리. actions는 객체로 묶어 관리
- 컴포넌트에서는 셀렉터로 필요한 값만 구독

```typescript
// 스토어 예시
const useBatteryListStore = create<State & Actions>((set) => ({
  list: [],
  pageable: null,
  isLoading: false,
  error: null,
  actions: {
    fetchList: async (page, size) => { ... },
    reset: () => set(initialState),
  },
}))

// 사용 예시
const list = useBatteryListStore(s => s.list)
const { fetchList } = useBatteryListStore(s => s.actions)
```

**라우트별 스토어 목록**

| 라우트 | 스토어 | 주요 state |
|---|---|---|
| 배터리 목록 | `useBatteryListStore` | `list[]`, `pageable` |
| 배터리 상세 | `useBatteryDetailStore` | `detail` |
| 개별 리포트 목록 | `useIndividualReportListStore` | `list[]`, `pageable` |
| 개별 리포트 상세 | `useIndividualReportDetailStore` | `detail` (리포트 생성 액션 포함) |
| 일일 리포트 목록 | `useDailyReportListStore` | `list[]`, `pageable` |
| 일일 리포트 상세 | `useDailyReportDetailStore` | `detail` (리포트 생성 액션 포함) |
| 로그인 | `useLoginStore` | `name`, `role`, `isAuthenticated` |
| 대시보드 KPI (HTTP) | `useDashboardStore` | `kpiData`, `summaryData`, `graphData` |
| 대시보드 시뮬레이션 (WS) | `useSimulationStore` | `registered[]`, `capture`, `analyze`, `completed[]`, `wsStatus`, `simulationStatus` |

### WebSocket 연결 정책

소켓은 feature의 `services/*SocketService.ts`에 **모듈 싱글턴**으로 둔다. 컴포넌트/훅은 콜백만 등록하고 연결·재연결·핸들러 배선은 서비스가 캡슐화한다. 컴포넌트 언마운트 시 연결을 끊지 않으며, 명시적 종료만 `disconnect*Socket()`으로 트리거한다.

- **연결 상태와 도메인 상태 분리**: `WsStatus`(idle/connecting/open/closed)와 `SimulationRunStatus`(idle/running/completed)는 별개 축
- **재연결**: 지수 백오프. 기본 1초, 실패 시 2배, 상한 30초, 20% jitter. 연결 성공 시 카운터 리셋
- **세대 가드**: 핸들러 안에서 `socket === ws` 비교로 옛 소켓 이벤트 무시
- **메세지 분기**: `event` 봉투 필드로 명시적 분기
- **서버 데이터 신뢰**: `slice` 등으로 임의로 자르지 않는다

**WS 채널**

| 채널 | 서비스 | 스토어 |
|---|---|---|
| `/ws/sim` | `simulationSocketService.ts` | `useSimulationStore` |

### API 엔드포인트 요약

| feature | 서비스 파일 | 메서드 + 경로 |
|---|---|---|
| auth | `authService.ts` | `POST /auth/login`, `POST /auth/signup` |
| battery | `batteryService.ts` | `GET /battery`, `GET /battery/:batteryCellId` |
| dashboard | `dashboardService.ts` | `POST /dashboard` |
| simulation (HTTP) | `simulationService.ts` | `POST /sim`, `GET /sim` |
| simulation (WS) | `simulationSocketService.ts` | `WS /ws/sim` |
| report (개별) | `individualReportService.ts` | `POST /reports/individual`, `GET /reports/individual`, `GET /reports/individual/:reportId` |
| report (일일) | `dailyReportService.ts` | `POST /reports/daily`, `GET /reports/daily`, `GET /reports/daily/:reportId` |

---

## CSS 디자인 전략

### rem 스케일링

**4K 해상도 기준으로 1rem = 10px** — 피그마 px÷10=rem 환산이 정확히 맞는 지점은 4K다. FHD(1920px)는 그보다 작은 `8.7px/rem`로 축소되어 보인다. `:root`에 아래를 설정한다:

```css
:root {
  font-size: clamp(4px, calc(100vw / 220.6897), 10px);
  --col-main: 120rem;
  --col-side: 22.2857rem;
}
```

| 뷰포트 폭 | 1rem |
|---|---|
| `< 882.8px` | 하한 `4px`에 고정 |
| `882.8px ~ 2206.9px` | `100vw / 220.6897`로 연속 변화 (FHD 1920px → `8.7px`) |
| `≥ 2206.9px` (4K 이상) | 상한 `10px`에 고정 (정확히) |

**레이아웃 총 폭**은 `col-side×2 + col-main = 164.5714rem`이다. 하한(`4px`)에서 실제 픽셀 폭은 `164.5714 × 4 ≈ 658px` — 뷰포트가 이보다 좁아지기 전까지는 `.root-layout`의 `overflow:hidden`에 잘리지 않고 계속 비례해서 줄어든다. 하한을 더 낮추면 이 잘림 시작점도 그만큼 더 좁은 화면까지 미뤄진다.

**모든 컴포넌트의 rem 값은 col-main = 1200px(120rem) 기준으로 설계됐다.** 피그마 프레임 자체는 1920px(col-main 1400px)로 그려지므로, 컴포넌트별 rem 값을 작성할 때는 **피그마 px ÷ 10 × 6/7 = rem**이다. `6/7`은 `1200/1400`에서 나온 축소 비율이다 — 이건 각 컴포넌트의 rem 수치를 정하는 규칙이고, 위 `clamp()`의 하한/분모/상한은 반응형 스케일 자체를 조정한 것이라 서로 독립적이다.

### CSS 값 입력 규칙

| 대상 | 규칙 | 이유 |
|---|---|---|
| 크기 / 간격 / 둥근 모서리 | 피그마 px ÷ 10 → rem | rem 스케일에 따라 자동 조정 |
| `border` 두께 | px 고정 | 선은 뷰포트 크기와 무관하게 항상 얇아야 함 |
| `box-shadow` 값 | px 고정, **모든 디자인 컴포넌트 공통 고정값** | 시각적 디테일 — 비례 축소 불필요, 레이아웃에도 영향 없음. 컴포넌트마다 다르게 만들지 않는다 |

**카드형 디자인 컴포넌트(패널/카드/서브카드 등)의 표준 그림자**는 아래 값으로 고정한다. 새 컴포넌트를 만들 때도 이 값을 그대로 쓴다 — 크기와 무관하게 전부 동일.

```css
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
```

```css
/* 올바른 예 — 피그마 430px 요소, 6/7 축소 반영 */
.card {
  width: 36.8571rem;                        /* 430px ÷ 10 × 6/7 */
  border-radius: 2.4rem;                    /* 28px ÷ 10 × 6/7 */
  border: 1px solid #e9ecef;                /* px 고정 — 축소 대상 아님 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25); /* px 고정, 표준값 그대로 */
}
```

### 레이아웃 구조

`.root-layout`은 `justify-content: center`로 전체 콘텐츠를 수평 중앙 정렬한다.

```
root-layout  (justify-content: center)
├── .root-layout__left   — 22.2857rem
├── .root-layout__center — 120rem  (--col-main)
└── .root-layout__right  — 22.2857rem
```

### 섹션(section)과 디자인 컴포넌트 구분

| 구분 | 역할 | 크기 규칙 |
|---|---|---|
| **섹션** | 특정 UI 영역 확보 | `flex-shrink: 0` + rem 고정 |
| **래퍼(wrapper)** | 자식 요소 배치·정렬 | 크기 없음 — `display: flex` + 정렬 속성만 |
| **디자인 컴포넌트** | 화면에 보이는 카드·패널 등 | `flex-shrink: 0` + rem 고정 |

래퍼에 `flex: 1` / `flex-grow` 사용은 허용. 섹션·디자인 컴포넌트에는 금지.

**대시보드 섹션 크기**

| 섹션 | 클래스 | 크기 |
|---|---|---|
| 시뮬레이션 네비 | `.dashboard__sim-nav` | `120rem × 4.2857rem` |
| 시뮬레이션 패널 | `.dashboard__simulation` | `120rem × 42.8571rem` |
| KPI | `.dashboard__kpi` | `120rem × 17.1429rem` |
| 결과 요약 | `.dashboard__result` | `120rem × 25.7143rem` |

```css
/* 섹션 — 영역만 확보 */
.dashboard__kpi {
  flex-shrink: 0;
  width: 120rem;
  height: 17.1429rem;
  padding: 0 8.5714rem;
  box-sizing: border-box;
}

/* 래퍼 — 정렬만 */
.kpi-cards {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.7143rem;
}

/* 디자인 컴포넌트 — rem 고정 */
.kpi-card {
  flex-shrink: 0;
  width: 36.8571rem;
  height: 13.7143rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}
```

### 스크롤바 레이아웃 안정화

`overflow-y: auto` 컨테이너는 `scrollbar-gutter: stable`을 함께 적용해 스크롤바 표시 시 레이아웃 시프트를 방지한다.

```css
.scrollable {
  overflow-y: auto;
  scrollbar-gutter: stable;
}
```

### CSS 애니메이션 정책

**DOM 삽입 시 자동 재생이 필요한 요소는 수정자 클래스(`.--enter`) 방식 금지. 해당 클래스에 직접 `animation`을 선언한다.**

React는 `key` 기준으로 기존 DOM 노드를 재사용한다. 신규 셀(새 key)은 새 DOM 노드가 삽입되어 자동으로 애니메이션이 재생되고, 기존 셀은 노드 재사용이므로 재생되지 않는다.

```css
/* 신규 DOM 노드 삽입 시에만 재생 */
.complete-cell {
  animation: complete-cell-enter 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes complete-cell-enter {
  from { opacity: 0; transform: scale(0.5); }
  to   { opacity: 1; transform: scale(1); }
}
```

`useEffect` + 수정자 클래스 방식은 deps 변경 시 cleanup이 setTimeout을 취소해 재생이 불안정해지므로 사용하지 않는다.

---

## 네이밍 컨벤션

| 대상 | 규칙 | 예시 |
|---|---|---|
| 컴포넌트 | PascalCase | `BatteryCard.tsx` |
| 페이지 | PascalCase + `Page` 접미사 | `DashboardPage.tsx` |
| 훅 | `use` 접두사 + camelCase | `useDefects.ts` |
| 스토어 | `use` + PascalCase + (`List`\|`Detail`) + `Store` | `useBatteryListStore.ts` |
| 서비스 (HTTP) | camelCase + `Service` | `batteryService.ts` |
| 서비스 (WS) | camelCase + `SocketService` | `simulationSocketService.ts` |
| 타입/인터페이스 | PascalCase | `BatteryDetail` |
| 폴더 | 소문자 camelCase | `battery`, `dashboard` |
| 상수 | UPPER_SNAKE_CASE | `API_BASE_URL` |

## 커밋 컨벤션

```
feat:     새 기능
fix:      버그 수정
refactor: 리팩토링
style:    코드 스타일 변경
docs:     문서 수정
chore:    빌드/설정 변경
```
