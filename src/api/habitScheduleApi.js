import api from './axios';

export const getHabitSchedule = (habitId) => {
  return api.get(`/schedules/${habitId}`);
}

export const updateHabitSchedule = (habitId, request) => {
  return api.put(`/schedules/${habitId}`, request);
}