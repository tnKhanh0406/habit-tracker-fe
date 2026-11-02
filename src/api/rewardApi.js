import api from "./axios";

export const getRewards = () => {
  return api.get('/rewards');
}

export const createRewardWithName = (name) => {
  return api.post('/rewards/name', {
    name: name
  });
}

export const createReward = (request) => {
  return api.post('/rewards', request);
}

export const updateReward = (rewardId, request) => {
  return api.put(`/rewards/${rewardId}`, request);
}

export const deleteReward = (rewardId) => {
  return api.delete(`/rewards/${rewardId}`);
}

export const redeemReward = (rewardId) => {
  return api.post(`/character/redeem-reward/${rewardId}`);
}
