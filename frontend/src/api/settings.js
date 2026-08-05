import api from './axiosInstance'

export const getSettings = () => api.get('/settings')
export const updateSettings = (data) => api.put('/settings', data)
export const testTelegram = () => api.post('/settings/test-telegram')
export const testEmail = () => api.post('/settings/test-email')
export const downloadBackup = () =>
  api.get('/settings/backup', { responseType: 'blob' })
export const triggerReminders = () => api.post('/settings/trigger-reminders')
