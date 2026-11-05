import api from './axios'

export const getCurrentParty = () => api.get('/parties/me')
export const createParty = (name) => api.post('/parties', { name })
export const joinParty = (inviteCode) => api.post('/parties/join', { inviteCode })
export const updateParty = (name) => api.patch('/parties/me', { name })
export const refreshPartyInviteCode = () => api.post('/parties/invite-code/refresh')
export const kickPartyMember = (userId) => api.delete(`/parties/members/${userId}`)
export const transferPartyLeadership = (userId) => api.post('/parties/transfer-leadership', { userId })
export const leaveParty = () => api.post('/parties/leave')
export const disbandParty = () => api.delete('/parties/me')
