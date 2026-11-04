import api from './axios'

export const updateProfile = (data) => api.put('/profile', data)

export const uploadProfileAvatar = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
