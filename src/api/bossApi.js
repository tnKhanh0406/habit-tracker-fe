import api from './axios'

export const getPartyBosses = () => api.get('/party/bosses')
export const getActiveBossBattle = () => api.get('/party/boss-battles/active')
export const startBossBattle = (bossDefinitionId) => api.post('/party/boss-battles', { bossDefinitionId })
