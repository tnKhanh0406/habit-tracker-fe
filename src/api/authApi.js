import api from './axios'

export const registerAccount = (data) => api.post('/auth/register', data)

export const loginAccount = (data) => api.post('/auth/login', data)

export const getCurrentUser = () => api.get('/auth/me')