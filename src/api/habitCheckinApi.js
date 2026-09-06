import api from "./axios";

export const addProgress = (habitId, amount) => {
  return api.post(`/checkins/${habitId}/progress`, {  amount  });
}

export const updateProgress = (habitId, progress) => {
  return api.put(`/checkins/${habitId}/progress`, {  progress  });
}

export const updateCompletion = (habitId, completed) => {
  return api.put(`/checkins/${habitId}/completion`, {  completed  });
}