import axios from 'axios'
import { clearAccessToken, getAccessToken } from '@/auth/authStorage'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

const isAuthRequest = (config) => {
  const url = config?.url || ''
  return url.includes('/auth/login') || url.includes('/auth/register')
}

const isCurrentUserRequest = (config) => (config?.url || '').includes('/auth/me')

api.interceptors.request.use((config) => {
  const token = getAccessToken()

  if (token && !isAuthRequest(config)) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
    config.__authToken = token
  } else if (isAuthRequest(config) && config.headers?.Authorization) {
    delete config.headers.Authorization
  }

  return config
})

api.interceptors.response.use(
  (response) => {
    if (response.config.__authToken && response.config.__authToken !== getAccessToken()) {
      return Promise.reject(new axios.CanceledError('Session changed before the response arrived.'))
    }

    return response
  },
  (error) => {
    const token = getAccessToken()
    const status = error.response?.status

    if (status === 401 && token && !isAuthRequest(error.config) && !isCurrentUserRequest(error.config)) {
      clearAccessToken()
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }

    if (status === 403) {
      window.dispatchEvent(new CustomEvent('auth:forbidden', {
        detail: { message: error.response?.data?.message || 'You do not have permission to perform that action.' },
      }))
    }

    return Promise.reject(error)
  },
)

export default api
