import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  login: (data) => api.post('/auth/token', new URLSearchParams(data)),
  me: () => api.get('/auth/me'),
}

export const clientApi = {
  list: (params) => api.get('/clients/', { params }),
  create: (data) => api.post('/clients/', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
}

export const inboundApi = {
  list: (params) => api.get('/inbound/', { params }),
  create: (data) => api.post('/inbound/', data),
  update: (id, data) => api.put(`/inbound/${id}`, data),
  delete: (id) => api.delete(`/inbound/${id}`),
  get: (id) => api.get(`/inbound/${id}`),
}

export const outboundApi = {
  list: (params) => api.get('/outbound/', { params }),
  create: (data) => api.post('/outbound/', data),
  update: (id, data) => api.put(`/outbound/${id}`, data),
  delete: (id) => api.delete(`/outbound/${id}`),
}

export const inventoryApi = {
  list: (params) => api.get('/inventory/', { params }),
  summary: () => api.get('/inventory/summary'),
}

export const carrierApi = {
  list: (params) => api.get('/carriers/', { params }),
  create: (data) => api.post('/carriers/', data),
  update: (id, data) => api.put(`/carriers/${id}`, data),
  delete: (id) => api.delete(`/carriers/${id}`),
}

export const dockingApi = {
  list: (params) => api.get('/docking/', { params }),
  create: (data) => api.post('/docking/', data),
  update: (id, data) => api.put(`/docking/${id}`, data),
  delete: (id) => api.delete(`/docking/${id}`),
}

export const userApi = {
  list: () => api.get('/users/'),
  create: (data) => api.post('/users/', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
}

export const dashboardApi = {
  get: () => api.get('/dashboard'),
}

export const excelApi = {
  exportInbound: () => api.get('/excel/export/inbound', { responseType: 'blob' }),
  exportOutbound: () => api.get('/excel/export/outbound', { responseType: 'blob' }),
  exportInventory: () => api.get('/excel/export/inventory', { responseType: 'blob' }),
  exportCarriers: () => api.get('/excel/export/carriers', { responseType: 'blob' }),
}

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

export default api
