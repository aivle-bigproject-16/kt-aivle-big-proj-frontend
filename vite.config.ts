import { defineConfig } from 'vitest/config'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // 개발 서버(vite dev) 전용 설정 — 프로덕션 빌드(vite build)에는 적용되지 않음.
    // 실제 백엔드는 /api 접두어 없이 라우트가 매핑돼 있어(/sim, /battery 등) rewrite로 벗겨서 전달한다.
    // mock-server.mjs는 반대로 /api 접두어를 그대로 기대하므로, mock으로 되돌아갈 경우
    // 이 rewrite를 잠시 빼거나 VITE_PROXY_TARGET을 mock으로 돌리는 것만으로는 부족하다.
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET ?? 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/ws': {
        target: process.env.VITE_PROXY_TARGET ?? 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
      },
      // AI 서버(FastAPI)는 메인 백엔드와 별도 호스트/포트 — SSE 로그 스트림용.
      // 일반 HTTP GET의 응답이 안 끊기고 이어지는 것뿐이라 ws:true는 필요 없다.
      '/ai': {
        target: process.env.VITE_AI_PROXY_TARGET ?? 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ai/, ''),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
