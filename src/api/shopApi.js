import api from './axios'

export const getShopListings = () => api.get('/shop')
export const purchaseShopItem = (listingId, quantity, idempotencyKey) =>
  api.post(`/shop/${listingId}/purchase`, { quantity, idempotencyKey })
