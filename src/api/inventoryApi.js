import api from './axios'

export const getInventory = () => api.get('/inventory')
export const useInventoryItem = (inventoryItemId) => api.post(`/inventory/${inventoryItemId}/use`)
