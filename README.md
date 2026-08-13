# KT AIVLE Big Project — Frontend

React 19 기반 배터리 검사 및 대시보드 웹 애플리케이션.

> **AI 또는 새 기여자에게**: 설계 원칙, 스토어 분리 정책, WS 연결 규칙, CSS 전략, API 엔드포인트 전체 목록 등 상세 내용은 [`ARCHITECTURE.md`](./ARCHITECTURE.md)를 참고하라.

---

## 기술 스택

| 구분 | 기술 |
|---|---|
| UI | React 19 + TypeScript |
| 번들러 | Vite |
| 패키지 매니저 | Bun |
| 상태관리 | Zustand |
| 컴파일러 | React Compiler (자동 메모이제이션) |
| Lint | ESLint 10 + typescript-eslint |

---

## 시작하기

```bash
# 의존성 설치
bun install

# 개발 서버 실행 (http://localhost:5173)
bun dev

# 타입 체크 + 프로덕션 빌드
bun build

# 빌드 결과 미리보기
bun preview

# 린트
bun lint
```

### mock 서버 실행 (백엔드 없이 개발 시)

```bash
bun mock
```

목 API wrapper는 `http://localhost:8080`, 내부 json-server는 `http://localhost:4001`을 사용한다. 실제 백엔드도 8080을 사용하므로 둘을 동시에 실행하지 않는다. 데이터 소스는 `db.json`이다.

목 로그인 계정:

|이메일|비밀번호|권한|
|---|---|---|
|`test@123.com`|`1234`|일반 사용자|

운영 배포 전 `.env.example`의 개인정보 보호책임자 관련 환경변수를 실제 값으로 설정한다. 값이 없으면 `/privacy` 화면에 배포 경고가 표시된다.

---

## 폴더 구조

```
src/
├── features/          # 비즈니스 도메인별 코드
│   ├── header/        # 사이드바, TopAppBar
│   ├── auth/          # 로그인, 회원가입
│   ├── battery/       # 배터리 목록 / 상세
│   ├── dashboard/     # KPI 차트 (HTTP)
│   ├── simulation/    # 실시간 시뮬레이션 (WS)
│   └── reports/       # 개별 / 일일 리포트
├── pages/             # 라우트 1:1 페이지 컴포넌트
├── core/
│   ├── api/           # axios 인스턴스, WebSocket 팩토리
│   └── navigation/    # Router, PrivateRoute, RootLayout
└── shared/
    ├── ui/            # Pagination, DetailLinkButton, Modal
    ├── hooks/
    ├── utils/
    └── types/         # ApiResponse<T>, Pageable, AsyncState
```

---

## 페이지 목록

| 페이지 | 라우트 | 스토어 연결 |
|---|---|---|
| 로그인 | `/auth/login` | ✅ |
| 회원가입 | `/auth/signup` | ✅ |
| 개인정보처리방침 | `/privacy` | 공개 페이지 |
| 접근 권한 없음 | `/forbidden` | 인증 필요 |
| 대시보드 | `/dashboard` | ✅ |
| 배터리 목록 | `/battery` | ✅ |
| 배터리 상세 | `/battery/:batteryCellId` | ✅ |
| 개별 리포트 목록 | `/reports/individual` | ✅ |
| 개별 리포트 상세 | `/reports/individual/:reportId` | ✅ |
| 일일 리포트 목록 | `/reports/daily` | ✅ |
| 일일 리포트 상세 | `/reports/daily/:reportId` | ✅ |

> ✅ 스토어 연결 완료 &nbsp;|&nbsp; 🔧 컴포넌트 구현 완료, 스토어 미연결

---

## 아키텍처 요약

- **의존성 방향**: `shared/` → `features/` → `pages/` (단방향)
- **스토어**: 라우트 단위로 분리 (`use<Domain>ListStore` / `use<Domain>DetailStore`)
- **인증**: httpOnly 쿠키 + `withCredentials`. FE는 토큰을 직접 저장하지 않음
- **WebSocket**: `simulationSocketService` 싱글턴, 지수 백오프 재연결

> 자세한 내용은 [`ARCHITECTURE.md`](./ARCHITECTURE.md) 참고.

---

## 네이밍 컨벤션

| 대상 | 규칙 | 예시 |
|---|---|---|
| 컴포넌트 | PascalCase | `BatteryList.tsx` |
| 페이지 | PascalCase + `Page` 접미사 | `DashboardPage.tsx` |
| 훅 | `use` 접두사 + camelCase | `useDefects.ts` |
| 스토어 | `use` + PascalCase + `(List\|Detail)Store` | `useBatteryListStore.ts` |
| 서비스 (HTTP) | camelCase + `Service` 접미사 | `batteryService.ts` |
| 서비스 (WS) | camelCase + `SocketService` 접미사 | `simulationSocketService.ts` |
| 타입/인터페이스 | PascalCase | `BatteryDetail` |
| 폴더 | 소문자 camelCase | `battery`, `reports` |
| 상수 | UPPER_SNAKE_CASE | `API_BASE_URL` |

---

## 커밋 컨벤션

```
feat:     새 기능
fix:      버그 수정
refactor: 리팩토링
style:    코드 스타일 변경
docs:     문서 수정
chore:    빌드/설정 변경
```
