const ACCESS_TOKEN_KEY = 'habit_tracker_access_token'

export const getAccessToken = () => {
  if (typeof window === 'undefined') return null
  return window.sessionStorage.getItem(ACCESS_TOKEN_KEY)
}

export const setAccessToken = (token) => {
  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export const clearAccessToken = () => {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  }
}