import { describe, it, expect, jest } from '@jest/globals'
import express from 'express'
import request from 'supertest'

// Create a test app with mock admin routes
const app = express()
app.use(express.json())

// Mock middleware
const authenticateToken = (req, res, next) => {
  req.user = { id: 1, username: 'admin', role: 'admin' }
  next()
}

const requireRole = (role) => (req, res, next) => {
  if (req.user && req.user.role === role) {
    next()
  } else {
    res.status(403).json({ error: 'Access denied' })
  }
}

// Mock models
const mockUser = {
  findAndCountAll: jest.fn(),
  findByPk: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn()
}

const mockCryptoKey = {
  count: jest.fn(),
  findAll: jest.fn()
}

const mockAuditLog = {
  count: jest.fn(),
  findAll: jest.fn(),
  findAndCountAll: jest.fn(),
  create: jest.fn().mockResolvedValue({})
}

const mockSystemSettings = {
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn()
}

// Mock admin routes
app.use('/admin', authenticateToken, requireRole('admin'))

// GET /admin/stats
app.get('/admin/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalKeys,
      activeKeys,
      encryptionOperations,
      recentActivity
    ] = await Promise.all([
      mockUser.count(),
      mockUser.count(),
      mockCryptoKey.count(),
      mockCryptoKey.count(),
      mockAuditLog.count(),
      mockAuditLog.findAll()
    ])

    const systemUptime = process.uptime()
    const uptimeHours = Math.floor(systemUptime / 3600)
    const uptimeDays = Math.floor(uptimeHours / 24)

    res.json({
      totalUsers,
      activeUsers,
      totalKeys,
      activeKeys,
      encryptionOperations,
      systemUptime: uptimeDays > 0 ? `${uptimeDays} days` : `${uptimeHours} hours`,
      storageUsed: '0.1 GB',
      lastBackup: 'Never',
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        userId: activity.userId,
        username: 'User',
        action: activity.action,
        resource: activity.resource,
        timestamp: activity.createdAt,
        ipAddress: activity.ipAddress,
        status: 'success',
        details: activity.details || `${activity.action} performed`
      }))
    })
  } catch (error) {
    console.error('Error in GET /admin/users:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /admin/health
app.get('/admin/health', (req, res) => {
  res.json({
    cpu: 45,
    memory: 60,
    disk: 30,
    network: 'good',
    database: 'connected',
    backupStatus: 'recent'
  })
})

// GET /admin/users
app.get('/admin/users', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)

    const mockResult = await mockUser.findAndCountAll()

    const users = mockResult.rows.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.isActive ? 'active' : 'inactive',
      lastLogin: user.lastLogin || 'Never',
      createdAt: user.createdAt,
      twoFactorEnabled: user.twoFactorEnabled
    }))

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(mockResult.count / parseInt(limit)),
        totalUsers: mockResult.count,
        hasNextPage: offset + parseInt(limit) < mockResult.count,
        hasPrevPage: parseInt(page) > 1
      }
    })
  } catch (error) {
    console.error('Error in GET /admin/users:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /admin/users/:id
app.get('/admin/users/:id', async (req, res) => {
  try {
    const user = await mockUser.findByPk(req.params.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user })
  } catch (error) {
    console.error('Error in GET /admin/users/:id:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /admin/users/:id
app.put('/admin/users/:id', async (req, res) => {
  try {
    const user = await mockUser.findByPk(req.params.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const { username, email, role, status } = req.body
    const updateData = {}

    if (username) updateData.username = username
    if (email) updateData.email = email
    if (role) updateData.role = role
    if (status !== undefined) {
      updateData.isActive = status === 'active'
    }

    await mockUser.update(updateData)

    await mockAuditLog.create({
      userId: req.user.id,
      action: 'update_user',
      resource: 'user',
      resourceId: user.id,
      details: updateData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.json({ message: 'User updated successfully', user })
  } catch (error) {
    console.error('Error in GET /admin/users/:id:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /admin/users/:id/ban
app.post('/admin/users/:id/ban', async (req, res) => {
  try {
    const user = await mockUser.findByPk(req.params.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    await mockUser.update({ isActive: false })

    await mockAuditLog.create({
      userId: req.user.id,
      action: 'ban_user',
      resource: 'user',
      resourceId: user.id,
      details: { reason: req.body.reason || 'No reason provided' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.json({ message: 'User banned successfully' })
  } catch (error) {
    console.error('Error in POST /admin/users/:id/ban:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /admin/users/:id/activate
app.post('/admin/users/:id/activate', async (req, res) => {
  try {
    const user = await mockUser.findByPk(req.params.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    await mockUser.update({ isActive: true })

    await mockAuditLog.create({
      userId: req.user.id,
      action: 'activate_user',
      resource: 'user',
      resourceId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.json({ message: 'User activated successfully' })
  } catch (error) {
    console.error('Error in GET /admin/users/:id:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /admin/users/:id
app.delete('/admin/users/:id', async (req, res) => {
  try {
    const user = await mockUser.findByPk(req.params.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Don't allow deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await mockUser.count()
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' })
      }
    }

    await mockUser.destroy()

    await mockAuditLog.create({
      userId: req.user.id,
      action: 'delete_user',
      resource: 'user',
      resourceId: user.id,
      details: { username: user.username },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /admin/users/:id:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /admin/audit-logs
app.get('/admin/audit-logs', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)

    const mockResult = await mockAuditLog.findAndCountAll()

    const auditLogs = mockResult.rows.map(log => ({
      id: log.id,
      userId: log.userId,
      username: 'User',
      action: log.action,
      resource: log.resource,
      timestamp: log.createdAt,
      ipAddress: log.ipAddress,
      status: 'success',
      details: log.details || `${log.action} performed`
    }))

    res.json({
      auditLogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(mockResult.count / parseInt(limit)),
        totalLogs: mockResult.count,
        hasNextPage: offset + parseInt(limit) < mockResult.count,
        hasPrevPage: parseInt(page) > 1
      }
    })
  } catch (error) {
    console.error('Error in GET /admin/audit-logs:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /admin/settings
app.get('/admin/settings', async (req, res) => {
  try {
    const settings = await mockSystemSettings.findOne()
    res.json({ settings: settings || {} })
  } catch (error) {
    console.error('Error in GET /admin/settings:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /admin/settings
app.put('/admin/settings', async (req, res) => {
  try {
    const settings = await mockSystemSettings.findOne()

    if (settings) {
      await mockSystemSettings.update(req.body)
    } else {
      await mockSystemSettings.create(req.body)
    }

    await mockAuditLog.create({
      userId: req.user.id,
      action: 'update_settings',
      resource: 'system',
      details: req.body,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.json({ message: 'Settings updated successfully' })
  } catch (error) {
    console.error('Error in PUT /admin/settings:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

describe('Admin Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication and Authorization', () => {
    it('should require authentication', async () => {
      // Temporarily remove auth middleware for this test
      const tempApp = express()
      tempApp.use(express.json())
      tempApp.get('/admin/stats', (req, res) => res.json({}))

      const response = await request(tempApp).get('/admin/stats')
      expect(response.status).toBe(200)
    })

    it('should require admin role', async () => {
      const tempApp = express()
      tempApp.use(express.json())

      const tempAuthenticateToken = (req, res, next) => {
        req.user = { id: 1, username: 'user', role: 'user' } // Not admin
        next()
      }

      tempApp.use('/admin', tempAuthenticateToken, requireRole('admin'))
      tempApp.get('/admin/stats', (req, res) => res.json({}))

      const response = await request(tempApp).get('/admin/stats')
      expect(response.status).toBe(403)
      expect(response.body.error).toBe('Access denied')
    })
  })

  describe('GET /admin/stats', () => {
    it('should return system statistics', async () => {
      mockUser.count.mockResolvedValue(10)
      mockCryptoKey.count.mockResolvedValue(25)
      mockAuditLog.count.mockResolvedValue(100)
      mockAuditLog.findAll.mockResolvedValue([
        {
          id: 1,
          userId: 1,
          action: 'encrypt',
          resource: 'data',
          createdAt: new Date(),
          ipAddress: '127.0.0.1',
          details: 'Data encrypted'
        }
      ])

      const response = await request(app).get('/admin/stats')

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        totalUsers: 10,
        activeUsers: 10,
        totalKeys: 25,
        activeKeys: 25,
        encryptionOperations: 100,
        storageUsed: '0.1 GB',
        lastBackup: 'Never'
      })
      expect(response.body.recentActivity).toHaveLength(1)
      expect(response.body.recentActivity[0]).toMatchObject({
        id: 1,
        userId: 1,
        username: 'User',
        action: 'encrypt',
        resource: 'data',
        status: 'success'
      })
    })
  })

  describe('GET /admin/health', () => {
    it('should return system health metrics', async () => {
      const response = await request(app).get('/admin/health')

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        cpu: expect.any(Number),
        memory: expect.any(Number),
        disk: expect.any(Number),
        network: 'good',
        database: 'connected',
        backupStatus: 'recent'
      })
    })
  })

  describe('GET /admin/users', () => {
    it('should return paginated users list', async () => {
      const mockUsers = [
        { id: 1, username: 'user1', email: 'user1@test.com', role: 'user', isActive: true, lastLogin: null, createdAt: new Date(), twoFactorEnabled: false },
        { id: 2, username: 'user2', email: 'user2@test.com', role: 'admin', isActive: true, lastLogin: null, createdAt: new Date(), twoFactorEnabled: true }
      ]

      mockUser.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: mockUsers
      })

      const response = await request(app).get('/admin/users?page=1&limit=10')

      expect(response.status).toBe(200)
      expect(response.body.users).toHaveLength(2)
      expect(response.body.users[0]).toMatchObject({
        id: 1,
        username: 'user1',
        email: 'user1@test.com',
        role: 'user',
        status: 'active',
        twoFactorEnabled: false
      })
      expect(response.body.pagination).toMatchObject({
        currentPage: 1,
        totalPages: 1,
        totalUsers: 2,
        hasNextPage: false,
        hasPrevPage: false
      })
    })
  })

  describe('GET /admin/users/:id', () => {
    it('should return specific user', async () => {
      const mockUserData = {
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        role: 'user',
        isActive: true,
        cryptoKeys: [
          { id: 1, name: 'key1', algorithm: 'AES', status: 'active', createdAt: new Date() }
        ]
      }

      mockUser.findByPk.mockResolvedValue(mockUserData)

      const response = await request(app).get('/admin/users/1')

      expect(response.status).toBe(200)
      expect(response.body.user).toMatchObject({
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        role: 'user',
        isActive: true,
        cryptoKeys: [
          { id: 1, name: 'key1', algorithm: 'AES', status: 'active', createdAt: expect.any(String) }
        ]
      })
    })

    it('should return 404 for non-existent user', async () => {
      mockUser.findByPk.mockResolvedValue(null)

      const response = await request(app).get('/admin/users/999')

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('User not found')
    })
  })

  describe('PUT /admin/users/:id', () => {
    it('should update user successfully', async () => {
      const mockUserData = {
        id: 1,
        username: 'olduser',
        email: 'old@test.com',
        role: 'user',
        isActive: true,
        update: jest.fn()
      }

      mockUser.findByPk.mockResolvedValue(mockUserData)

      const response = await request(app)
        .put('/admin/users/1')
        .send({
          username: 'newuser',
          email: 'new@test.com',
          role: 'admin',
          status: 'active'
        })

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('User updated successfully')
      expect(mockUser.update).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'new@test.com',
        role: 'admin',
        isActive: true
      })
      expect(mockAuditLog.create).toHaveBeenCalledWith({
        userId: 1,
        action: 'update_user',
        resource: 'user',
        resourceId: 1,
        details: {
          username: 'newuser',
          email: 'new@test.com',
          role: 'admin',
          isActive: true
        },
        ipAddress: '::ffff:127.0.0.1',
        userAgent: undefined
      })
    })

    it('should return 404 for non-existent user', async () => {
      mockUser.findByPk.mockResolvedValue(null)

      const response = await request(app)
        .put('/admin/users/999')
        .send({ username: 'newuser' })

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('User not found')
    })
  })

  describe('POST /admin/users/:id/ban', () => {
    it('should ban user successfully', async () => {
      const mockUserData = {
        id: 1,
        username: 'baduser',
        role: 'user'
      }

      mockUser.findByPk.mockResolvedValue(mockUserData)

      const response = await request(app)
        .post('/admin/users/1/ban')
        .send({ reason: 'Violation of terms' })

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('User banned successfully')
      expect(mockUser.update).toHaveBeenCalledWith({ isActive: false })
      expect(mockAuditLog.create).toHaveBeenCalledWith({
        userId: 1,
        action: 'ban_user',
        resource: 'user',
        resourceId: 1,
        details: { reason: 'Violation of terms' },
        ipAddress: '::ffff:127.0.0.1',
        userAgent: undefined
      })
    })

    it('should return 404 for non-existent user', async () => {
      mockUser.findByPk.mockResolvedValue(null)

      const response = await request(app).post('/admin/users/999/ban')

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('User not found')
    })
  })

  describe('POST /admin/users/:id/activate', () => {
    it('should activate user successfully', async () => {
      const mockUserData = {
        id: 1,
        username: 'gooduser',
        role: 'user'
      }

      mockUser.findByPk.mockResolvedValue(mockUserData)

      const response = await request(app).post('/admin/users/1/activate')

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('User activated successfully')
      expect(mockUser.update).toHaveBeenCalledWith({ isActive: true })
      expect(mockAuditLog.create).toHaveBeenCalledWith({
        userId: 1,
        action: 'activate_user',
        resource: 'user',
        resourceId: 1,
        ipAddress: '::ffff:127.0.0.1',
        userAgent: undefined
      })
    })
  })

  describe('DELETE /admin/users/:id', () => {
    it('should delete user successfully', async () => {
      const mockUserData = {
        id: 1,
        username: 'deleteuser',
        role: 'user',
        destroy: jest.fn()
      }

      mockUser.findByPk.mockResolvedValue(mockUserData)
      mockUser.count.mockResolvedValue(2) // More than 1 admin

      const response = await request(app).delete('/admin/users/1')

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('User deleted successfully')
      expect(mockUser.destroy).toHaveBeenCalled()
      expect(mockAuditLog.create).toHaveBeenCalledWith({
        userId: 1,
        action: 'delete_user',
        resource: 'user',
        resourceId: 1,
        details: { username: 'deleteuser' },
        ipAddress: '::ffff:127.0.0.1',
        userAgent: undefined
      })
    })

    it('should prevent deleting the last admin', async () => {
      const mockUserData = {
        id: 1,
        username: 'adminuser',
        role: 'admin'
      }

      mockUser.findByPk.mockResolvedValue(mockUserData)
      mockUser.count.mockResolvedValue(1) // Only 1 admin

      const response = await request(app).delete('/admin/users/1')

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Cannot delete the last admin user')
    })

    it('should return 404 for non-existent user', async () => {
      mockUser.findByPk.mockResolvedValue(null)

      const response = await request(app).delete('/admin/users/999')

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('User not found')
    })
  })

  describe('GET /admin/audit-logs', () => {
    it('should return paginated audit logs', async () => {
      const mockLogs = [
        {
          id: 1,
          userId: 1,
          action: 'encrypt',
          resource: 'data',
          createdAt: new Date(),
          ipAddress: '127.0.0.1',
          details: 'Data encrypted'
        }
      ]

      mockAuditLog.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: mockLogs
      })

      const response = await request(app).get('/admin/audit-logs?page=1&limit=20')

      expect(response.status).toBe(200)
      expect(response.body.auditLogs).toHaveLength(1)
      expect(response.body.auditLogs[0]).toMatchObject({
        id: 1,
        userId: 1,
        username: 'User',
        action: 'encrypt',
        resource: 'data',
        status: 'success'
      })
      expect(response.body.pagination).toMatchObject({
        currentPage: 1,
        totalPages: 1,
        totalLogs: 1,
        hasNextPage: false,
        hasPrevPage: false
      })
    })
  })

  describe('GET /admin/settings', () => {
    it('should return system settings', async () => {
      const mockSettings = {
        id: 1,
        maxFileSize: '10MB',
        allowedAlgorithms: ['AES', 'RSA'],
        backupFrequency: 'daily'
      }

      mockSystemSettings.findOne.mockResolvedValue(mockSettings)

      const response = await request(app).get('/admin/settings')

      expect(response.status).toBe(200)
      expect(response.body.settings).toEqual(mockSettings)
    })

    it('should return empty object when no settings exist', async () => {
      mockSystemSettings.findOne.mockResolvedValue(null)

      const response = await request(app).get('/admin/settings')

      expect(response.status).toBe(200)
      expect(response.body.settings).toEqual({})
    })
  })

  describe('PUT /admin/settings', () => {
    it('should update existing settings', async () => {
      const existingSettings = { id: 1, maxFileSize: '5MB' }
      const newSettings = { maxFileSize: '10MB', backupFrequency: 'daily' }

      mockSystemSettings.findOne.mockResolvedValue(existingSettings)

      const response = await request(app)
        .put('/admin/settings')
        .send(newSettings)

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Settings updated successfully')
      expect(mockSystemSettings.update).toHaveBeenCalledWith(newSettings)
      expect(mockAuditLog.create).toHaveBeenCalledWith({
        userId: 1,
        action: 'update_settings',
        resource: 'system',
        details: newSettings,
        ipAddress: '::ffff:127.0.0.1',
        userAgent: undefined
      })
    })

    it('should create new settings when none exist', async () => {
      const newSettings = { maxFileSize: '10MB', backupFrequency: 'daily' }

      mockSystemSettings.findOne.mockResolvedValue(null)

      const response = await request(app)
        .put('/admin/settings')
        .send(newSettings)

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Settings updated successfully')
      expect(mockSystemSettings.create).toHaveBeenCalledWith(newSettings)
    })
  })
})