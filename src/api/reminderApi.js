import api from './axios';

export const getReminders = (habitId) => {
  return api.get(`/reminders/${habitId}`);
}

export const updateReminders = (habitId, requests) => {
  return api.put(`/reminders/habit/${habitId}`, requests);
}