import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getCurrentUser, loginAccount, registerAccount } from '@/api/authApi'
import { clearAccessToken, getAccessToken, setAccessToken } from '@/auth/authStorage'

const getErrorMessage = (error, fallback) => {
  return error.response?.data?.message || error.response?.data?.error || fallback
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const status = ref('initializing')
  const authError = ref('')
  const initialized = ref(false)

  const isAuthenticated = computed(() => status.value === 'authenticated')

  const loadCurrentUser = async (force = false) => {
    if (!force && initialized.value && !authError.value) return user.value

    authError.value = ''
    status.value = 'initializing'
    const token = getAccessToken()

    if (!token) {
      user.value = null
      status.value = 'unauthenticated'
      initialized.value = true
      return null
    }

    try {
      const response = await getCurrentUser()
      user.value = response.data
      status.value = 'authenticated'
      initialized.value = true
      return user.value
    } catch (error) {
      if (error.response?.status === 401) {
        clearAccessToken()
        user.value = null
        status.value = 'unauthenticated'
        initialized.value = true
        return null
      }

      status.value = 'initializing'
      authError.value = getErrorMessage(error, 'Could not verify your session. Check the backend and try again.')
      initialized.value = false
      return null
    }
  }

  const login = async ({ email, password }) => {
    authError.value = ''
    const response = await loginAccount({ email, password })
    const token = response.data?.accessToken

    if (!token) {
      throw new Error('The server did not return an access token.')
    }

    setAccessToken(token)
    const currentUser = await loadCurrentUser(true)

    if (!currentUser) {
      const verificationError = authError.value || 'Could not verify your account.'
      clearAccessToken()
      authError.value = ''
      status.value = 'unauthenticated'
      initialized.value = true
      throw new Error(verificationError)
    }

    return currentUser
  }

  const register = async ({ username, email, password }) => {
    return registerAccount({ username, email, password })
  }

  const logout = () => {
    clearAccessToken()
    user.value = null
    authError.value = ''
    status.value = 'unauthenticated'
    initialized.value = true
  }

  const handleUnauthorized = () => {
    clearAccessToken()
    user.value = null
    authError.value = ''
    status.value = 'unauthenticated'
    initialized.value = true
  }

  return {
    user,
    status,
    authError,
    initialized,
    isAuthenticated,
    loadCurrentUser,
    login,
    register,
    logout,
    handleUnauthorized,
  }
})