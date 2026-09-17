import api from "./axios";

export const getHabits = () => {
  return api.get('/habits');
}

export const getHabitDetail = (id) => {
  return api.get(`/habits/${id}`);
}

export const createHabitWithName = (name) => {
  return api.post('/habits/name', {
    name: name,
    trackingType: 'CHECK',
    targetValue: null,
    targetUnit: null
  });
}

export const createHabit = (data) => {
  return api.post('/habits', data);
}

export const deleteHabit = (id) => {
  return api.delete(`/habits/${id}`);
}

export const updateBasicHabitInformation = (id, data) => {
  return api.put(`/habits/basic/${id}`, data);
}
