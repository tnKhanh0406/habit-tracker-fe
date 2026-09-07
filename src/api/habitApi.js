import api from "./axios";

export const getHabits = () => {
  return api.get('/habits');
}

export const createHabitWithName = (name) => {
  return api.post('/habits', {
    name: name,
    trackingType: 'CHECK',
    targetValue: null,
    targetUnit: null
  });
}

export const updateBasicHabitInformation = (id, data) => {
  return api.put(`/habits/basic/${id}`, data);
}
