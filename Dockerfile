# syntax=docker/dockerfile:1
#
# 화면 이미지. Vite 번들을 굽고 nginx 로 서빙한다.
#
#   docker build --build-arg VITE_API_BASE_URL=/api -t battery-frontend .
#
# VITE_* 는 번들 시점에 문자열로 치환된다. 컨테이너 환경변수로는 절대 주입되지 않는다.
# 값을 바꾸려면 이미지를 다시 구워야 한다.
#
# nginx 는 세 가지를 한다. 배선 정의는 docker/nginx.conf 에 있다.
#   1) 정적 번들 서빙   2) /api → backend:8080   3) /ws → backend:8080 (WebSocket 업그레이드)

# --- 빌드 -------------------------------------------------------------------
FROM oven/bun:1 AS build
WORKDIR /app

# 잠금 파일을 먼저 복사한다. 소스만 바뀌었을 때 의존성 설치를 건너뛰기 위함이다.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# 기본값은 계약 [실행/환경변수]의 API 기본 경로다.
# 실시간 채널은 변수를 두지 않는다. socketClient 가 접속한 호스트에서 직접 만든다.
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# tsc -b 로 타입을 먼저 검사한 뒤 번들한다. 타입 오류가 있으면 이미지가 만들어지지 않는다.
RUN bun run build

# --- 실행 -------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

# 기본 설정을 지우고 우리 것만 남긴다. 두 개가 공존하면 어느 쪽이 먹는지 헷갈린다.
RUN rm -f /etc/nginx/conf.d/default.conf
COPY docker/nginx.conf /etc/nginx/conf.d/app.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
