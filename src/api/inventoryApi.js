import api from './axios'

export const getInventory = () => api.get('/inventory')
export const useInventoryItem = (inventoryItemId) => api.post(`/inventory/${inventoryItemId}/use`)
export const equipInventoryItem = (inventoryItemId) => api.post(`/inventory/${inventoryItemId}/equip`)
export const unequipInventoryItem = (inventoryItemId) => api.post(`/inventory/${inventoryItemId}/unequip`)
