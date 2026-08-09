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

**정책 변경 (2026-08-07): col-main 기준을 1200px에서 1400px로 되돌림.** `:root`에 아래를 설정한다:

```css
:root {
  font-size: clamp(4px, calc(100vw / 192), 10px);
  --col-main: 140rem;
  --col-side: 26rem;
}
```

**레이아웃 총 폭**은 `col-side×2 + col-main = 192rem`이며, 이는 정확히 1920px 프레임과 같다. 그래서 뷰포트 1920px(=192rem×10px)에서 1rem이 정확히 `10px`이 되고, 사이드 여백 없이 레이아웃이 화면에 꽉 찬다.

| 뷰포트 폭 | 1rem |
|---|---|
| `< 768px` | 하한 `4px`에 고정 (`192 × 4 = 768px`) |
| `768px ~ 1920px` | `100vw / 192`로 연속 변화 |
| `≥ 1920px` | 상한 `10px`에 고정 — 1920px보다 넓은 화면은 레이아웃이 더 커지지 않고 배경 여백만 늘어난다 |

**모든 컴포넌트의 rem 값은 이제 col-main = 1400px(140rem) 기준, 즉 피그마 프레임과 1:1이다.** 컴포넌트별 rem 값은 **피그마 px ÷ 10 = rem** 그대로 쓴다 — 더 이상 축소 계수(예전의 `6/7`)가 필요 없다.

**기존 1200 기준으로 만들어진 컴포넌트 CSS는 폐기한다.** 각 feature의 `components/history/` 폴더로 옮겨 참고용으로만 보관하고, import에서 제거한다. 새 CSS는 새 Figma 프레임(1400 기준)이 주어질 때 1400 기준으로 새로 작성한다 — 기존 값을 재계산해서 재사용하지 않는다.

### CSS 값 입력 규칙

| 대상 | 규칙 | 이유 |
|---|---|---|
| 크기 / 간격 / 둥근 모서리 | 피그마 px ÷ 10 → rem | rem 스케일에 따라 자동 조정 |
| `border` 두께 | px 고정 | 선은 뷰포트 크기와 무관하게 항상 얇아야 함 |
| `box-shadow` 값 | px 고정, **모든 디자인 컴포넌트 공통 고정값** | 시각적 디테일 — 비례 축소 불필요, 레이아웃에도 영향 없음. 컴포넌트마다 다르게 만들지 않는다 |

**카드형 디자인 컴포넌트(패널/카드/서브카드 등)의 표준 그림자**는 `index.css`의 `:root`에 CSS 변수로 공통화되어 있다. 새 컴포넌트를 만들 때도 리터럴로 반복하지 말고 이 변수를 쓴다 — 크기와 무관하게 전부 동일.

```css
/* index.css :root */
--shadow-card: 0 2px 8px rgba(0, 0, 0, 0.25);
```

```css
/* 올바른 예 — 피그마 430px 요소, 1400 기준 1:1 반영 */
.card {
  width: 43rem;                  /* 430px ÷ 10 */
  border-radius: 2.8rem;         /* 28px ÷ 10 */
  border: 1px solid #e9ecef;     /* px 고정 — 축소 대상 아님 */
  box-shadow: var(--shadow-card); /* 공통 변수, 리터럴 반복 금지 */
}
```

### 레이아웃 구조

`.root-layout`은 `justify-content: center`로 전체 콘텐츠를 수평 중앙 정렬한다.

```
root-layout  (justify-content: center)
├── .root-layout__left   — 26rem
├── .root-layout__center — 140rem  (--col-main)
└── .root-layout__right  — 26rem
```

### 섹션(section)과 디자인 컴포넌트 구분

| 구분 | 역할 | 크기 규칙 |
|---|---|---|
| **섹션** | 특정 UI 영역 확보 | `flex-shrink: 0` + rem 고정 |
| **래퍼(wrapper)** | 자식 요소 배치·정렬 | 크기 없음 — `display: flex` + 정렬 속성만 |
| **디자인 컴포넌트** | 화면에 보이는 카드·패널 등 | `flex-shrink: 0` + rem 고정 |

래퍼에 `flex: 1` / `flex-grow` 사용은 허용. 섹션·디자인 컴포넌트에는 금지.

**정책 변경: 모든 영역은 값이 주어져야 한다 — 임의의 넓이를 갖는 영역은 없다.** 섹션과 디자인 컴포넌트는 `width`/`height`를 반드시 명시적 rem 값으로 지정한다. `width: auto`, `flex: 1`로 알아서 채워지는 크기, 퍼센트만으로 정해지는 크기(부모도 명시적 rem이 아니라면) 등 "정해지지 않은" 크기는 섹션·디자인 컴포넌트에 금지된다. 크기가 정해지지 않은 자식이 필요하면 그건 래퍼이지 섹션/디자인 컴포넌트가 아니다 — 역할을 다시 나눠라.

**정책 변경 (재변경): `display: flex`가 기본 배치 방식이다.** 절대 위치(`position: absolute`)는 다른 요소 위에 겹쳐야 하는 오버레이/배지 등 특수한 경우에만 쓴다. 대신 **flex를 쓰더라도 모든 영역과 컴포넌트는 고정 크기를 가진다** — 자식은 항상 `flex-grow: 0` + `flex-shrink: 0` + 명시적 rem `width`/`height`를 유지한다. flex는 정렬/간격 계산만 대신할 뿐, 크기를 결정하게 두지 않는다. 컨테이너 크기·자식 크기·DOM 순서가 전부 고정이면, flex를 써도 각 자식의 렌더링 위치는 콘텐츠 변화와 무관하게 항상 동일하게 결정된다 — 절대 위치와 실질적으로 같은 안정성을 갖는다.

```css
/* 기본 배치 — flex, 자식은 항상 고정 크기 */
.simulation-nav__tabs {
  display: flex;
  width: 45rem;
  height: 5rem;
}

.simulation-nav__tab {
  flex-grow: 0;
  flex-shrink: 0;
  width: 9rem;
  height: 5rem;
}
```

**대시보드 섹션 크기 (구 1200 기준 — 아직 1400 정책으로 마이그레이션 전)**

대시보드/시뮬레이션 컴포넌트는 아직 옛 1200 기준 CSS를 그대로 쓰고 있다 (`history/`로 옮기지 않음). 아래 표와 예시 코드는 섹션/래퍼/디자인 컴포넌트 구분 패턴을 보여주기 위한 참고용이며, 수치 자체는 새로 이 영역을 작업할 때 1400 기준으로 다시 잡아야 한다.

| 섹션 | 클래스 | 크기 (구) |
|---|---|---|
| 시뮬레이션 네비 | `.dashboard__sim-nav` | `120rem × 4.2857rem` |
| 시뮬레이션 패널 | `.dashboard__simulation` | `120rem × 42.8571rem` |
| KPI | `.dashboard__kpi` | `120rem × 17.1429rem` |
| 결과 요약 | `.dashboard__result` | `120rem × 25.7143rem` |

```css
/* 섹션/래퍼/디자인 컴포넌트 구분 패턴 예시 (수치는 구 1200 기준) */
.dashboard__kpi {
  flex-shrink: 0;
  width: 120rem;
  height: 17.1429rem;
  padding: 0 8.5714rem;
  box-sizing: border-box;
}

.kpi-cards {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.7143rem;
}

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
