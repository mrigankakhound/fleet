import api from './axiosInstance'

export const getVehicles = (params) => api.get('/vehicles', { params })
export const createVehicle = (data) => api.post('/vehicles', data)
export const getVehicle = (id) => api.get(`/vehicles/${id}`)
export const updateVehicle = (id, data) => api.put(`/vehicles/${id}`, data)
export const deleteVehicle = (id) => api.delete(`/vehicles/${id}`)
export const renewDocument = (id, data) => api.patch(`/vehicles/${id}/renew`, data)

export const exportVehicles = (params) =>
  api.get('/export/vehicles', { params, responseType: 'blob' })
