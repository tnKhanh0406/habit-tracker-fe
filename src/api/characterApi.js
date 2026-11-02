import api from './axios'

export const getCharacter = () => {
  return api.get('/character')
}

export const allocateCharacterStat = (stat, points = 1) => {
  return api.post('/character/allocate-stat', { stat, points })
}

export const selectCharacterClass = (characterClass) => {
  return api.post('/character/class', { characterClass })
}
