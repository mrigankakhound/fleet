import api from './axiosInstance'

export const getDashboardStats = () => api.get('/dashboard/stats')
export const getTodayWidget = () => api.get('/dashboard/today')
export const getCalendar = (params) => api.get('/dashboard/calendar', { params })
export const getMonthlyChart = (params) => api.get('/dashboard/chart/monthly', { params })
export const getDistributionChart = () => api.get('/dashboard/chart/distribution')
export const getActivity = (params) => api.get('/dashboard/activity', { params })
export const getReminderStats = () => api.get('/dashboard/reminder-stats')
