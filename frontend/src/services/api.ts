import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  register: (userData: { username: string; email: string; password: string }) =>
    api.post('/auth/register', userData),
  
  login: (credentials: { username: string; password: string; totpCode?: string }) =>
    api.post('/auth/login', credentials),
  
  setup2FA: () => api.post('/auth/2fa/setup'),
  
  verify2FA: (token: string) => api.post('/auth/2fa/verify', { token }),
  
  disable2FA: (password: string, token: string) =>
    api.post('/auth/2fa/disable', { password, token }),
  
  getProfile: () => api.get('/auth/profile'),
  
  updateProfile: (data: {
    firstName?: string
    lastName?: string
    phoneNumber?: string
    department?: string
  }) => api.put('/auth/profile', data),
  
  updateProfilePicture: (formData: FormData) =>
    api.post('/auth/profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),
  
  deleteProfilePicture: () => api.delete('/auth/profile/picture'),
  
  changePassword: (data: {
    currentPassword: string
    newPassword: string
  }) => api.put('/auth/profile/password', data)
}

export const cryptoAPI = {
  encrypt: (data: {
    text: string
    algorithm: string
    keySize: number
    key?: string
    publicKey?: string
  }) => api.post('/crypto/encrypt', data),
  
  decrypt: (data: {
    encryptedData: any
    algorithm: string
    keySize?: number
    key?: string
    privateKey?: string
  }) => api.post('/crypto/decrypt', data),
  
  hash: (data: { text: string; algorithm: string }) =>
    api.post('/crypto/hash', data),
  
  verifyIntegrity: (data: {
    expectedHash: string
    actualData: string
    algorithm: string
  }) => api.post('/crypto/verify-integrity', data),
  
  generateKey: (data: { algorithm: string; keySize: number }) =>
    api.post('/crypto/generate-key', data)
}

export const keyAPI = {
  getKeys: () => api.get('/keys'),
  
  getKey: (id: string) => api.get(`/keys/${id}`),
  
  saveKey: (data: {
    name: string
    algorithm: string
    keySize: number
    keyData: string
    publicKey?: string
    expiresAt?: string
  }) => api.post('/keys', data),
  
  generateKey: (data: {
    name: string
    algorithm: string
    keySize: number
    expiresAt?: string
  }) => api.post('/keys/generate', data),
  
  updateKey: (id: string, data: { name?: string; expiresAt?: string }) =>
    api.put(`/keys/${id}`, data),
  
  revokeKey: (id: string) => api.post(`/keys/${id}/revoke`),
  
  deleteKey: (id: string) => api.delete(`/keys/${id}`),
  
  exportKey: (id: string) => api.get(`/keys/${id}/export`)
}

export const signatureAPI = {
  sign: (data: {
    data: string
    privateKey: string
    algorithm?: string
  }) => api.post('/signatures/sign', data),
  
  verify: (data: {
    data: string
    signature: string
    publicKey: string
    algorithm?: string
  }) => api.post('/signatures/verify', data),
  
  signDocument: (data: {
    document: string
    privateKey: string
    algorithm?: string
    metadata?: any
  }) => api.post('/signatures/sign-document', data),
  
  verifyDocument: (data: {
    document: string
    signature: string
    signaturePayload: any
    publicKey: string
  }) => api.post('/signatures/verify-document', data),
  
  getAlgorithms: () => api.get('/signatures/algorithms')
}

export const adminAPI = {
  // User Management
  getUsers: (params?: { page?: number; limit?: number; search?: string; role?: string; status?: string }) =>
    api.get('/admin/users', { params }),
  
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  
  createUser: (data: {
    username: string
    email: string
    password: string
    role: string
  }) => api.post('/admin/users', data),
  
  updateUser: (id: string, data: {
    username?: string
    email?: string
    role?: string
    status?: string
  }) => api.put(`/admin/users/${id}`, data),
  
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  
  activateUser: (id: string) => api.post(`/admin/users/${id}/activate`),
  
  deactivateUser: (id: string) => api.post(`/admin/users/${id}/deactivate`),
  
  banUser: (id: string, reason?: string) => api.post(`/admin/users/${id}/ban`, { reason }),
  
  unbanUser: (id: string) => api.post(`/admin/users/${id}/unban`),
  
  resetUserPassword: (id: string) => api.post(`/admin/users/${id}/reset-password`),
  
  // System Statistics
  getSystemStats: () => api.get('/admin/stats'),
  
  getSystemHealth: () => api.get('/admin/health'),
  
  getDashboardMetrics: (period?: '24h' | '7d' | '30d' | '90d') =>
    api.get('/admin/metrics', { params: { period } }),
  
  // Audit Logs
  getAuditLogs: (params?: {
    page?: number
    limit?: number
    userId?: string
    action?: string
    resource?: string
    status?: string
    startDate?: string
    endDate?: string
  }) => api.get('/admin/audit-logs', { params }),
  
  exportAuditLogs: (params?: {
    userId?: string
    action?: string
    resource?: string
    status?: string
    startDate?: string
    endDate?: string
    format?: 'csv' | 'json'
  }) => api.get('/admin/audit-logs/export', { params }),
  
  // System Settings
  getSystemSettings: () => api.get('/admin/settings'),
  
  updateSystemSettings: (settings: {
    requireTwoFactor?: boolean
    sessionTimeout?: number
    keyRotationInterval?: number
    maxFailedLogins?: number
    accountLockoutDuration?: number
    passwordMinLength?: number
    passwordRequireSpecialChars?: boolean
    passwordRequireNumbers?: boolean
    passwordRequireUppercase?: boolean
    backupEnabled?: boolean
    backupFrequency?: 'daily' | 'weekly' | 'monthly'
    auditLogRetention?: number
  }) => api.put('/admin/settings', settings),
  
  // Backup Management
  createBackup: () => api.post('/admin/backup'),
  
  getBackups: () => api.get('/admin/backups'),
  
  restoreBackup: (backupId: string) => api.post(`/admin/backups/${backupId}/restore`),
  
  deleteBackup: (backupId: string) => api.delete(`/admin/backups/${backupId}`),
  
  // Key Management (Admin)
  getAllKeys: (params?: {
    page?: number
    limit?: number
    userId?: string
    algorithm?: string
    status?: string
  }) => api.get('/admin/keys', { params }),
  
  revokeUserKey: (keyId: string, reason?: string) =>
    api.post(`/admin/keys/${keyId}/revoke`, { reason }),
  
  forceKeyRotation: (userId?: string) => api.post('/admin/keys/rotate', { userId }),
  
  // System Maintenance
  clearCache: () => api.post('/admin/maintenance/clear-cache'),
  
  optimizeDatabase: () => api.post('/admin/maintenance/optimize-db'),
  
  getSystemLogs: (params?: {
    level?: 'error' | 'warn' | 'info' | 'debug'
    startDate?: string
    endDate?: string
    limit?: number
  }) => api.get('/admin/logs', { params }),
  
  // Monitoring & Alerts
  getAlerts: () => api.get('/admin/alerts'),
  
  acknowledgeAlert: (alertId: string) => api.post(`/admin/alerts/${alertId}/acknowledge`),
  
  dismissAlert: (alertId: string) => api.post(`/admin/alerts/${alertId}/dismiss`),
  
  updateAlertSettings: (settings: {
    emailNotifications?: boolean
    smsNotifications?: boolean
    webhookUrl?: string
    alertThresholds?: {
      failedLogins?: number
      systemLoad?: number
      diskUsage?: number
      memoryUsage?: number
    }
  }) => api.put('/admin/alert-settings', settings)
}

export const dashboardAPI = {
  // User Dashboard specific endpoints
  getQuickStats: () => api.get('/dashboard/stats'),
  
  getRecentActivity: (limit?: number) => api.get('/dashboard/activity', { params: { limit } }),
  
  getUsageMetrics: (period?: '24h' | '7d' | '30d') =>
    api.get('/dashboard/usage', { params: { period } }),
  
  // Favorite/Pinned items
  pinItem: (type: 'key' | 'signature', itemId: string) =>
    api.post('/dashboard/pins', { type, itemId }),
  
  unpinItem: (type: 'key' | 'signature', itemId: string) =>
    api.delete(`/dashboard/pins/${type}/${itemId}`),
  
  getPinnedItems: () => api.get('/dashboard/pins')
}

export default api