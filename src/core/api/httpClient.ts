import axios from 'axios'

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
})

httpClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message ?? '알 수 없는 오류가 발생했습니다.'
    return Promise.reject({ ...error, message })
  },
)

export { httpClient }
