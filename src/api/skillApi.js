import api from './axios'

export const getSkills = () => api.get('/skills')

export const castSkill = (skillId, targetId = null) => {
  return api.post(`/skills/${skillId}/cast`, {
    targetId,
    idempotencyKey: crypto.randomUUID(),
  })
}
