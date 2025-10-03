import express from 'express'
import { body, validationResult } from 'express-validator'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import User from '../models/User.js'
import CryptoKey from '../models/CryptoKey.js'
import AuditLog from '../models/AuditLog.js'
import SystemSettings from '../models/SystemSettings.js'
import { Op } from 'sequelize'

const router = express.Router()

// Apply authentication and admin role requirement to all routes
router.use(authenticateToken, requireRole('admin'))

// Get system statistics
router.get('/stats', async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalKeys,
      activeKeys,
      encryptionOperations,
      recentActivity
    ] = await Promise.all([
      User.count(),
      User.count({ where: { isActive: true } }),
      CryptoKey.count(),
      CryptoKey.count({ where: { status: 'active' } }),
      AuditLog.count({ 
        where: { 
          action: { [Op.in]: ['encrypt', 'decrypt'] } 
        } 
      }),
      AuditLog.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']]
      })
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
      storageUsed: '0.1 GB', // This would be calculated from actual storage
      lastBackup: 'Never', // This would come from backup system
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        userId: activity.userId,
        username: 'User', // We'll get username separately if needed
        action: activity.action,
        resource: activity.resource,
        timestamp: activity.createdAt,
        ipAddress: activity.ipAddress,
        status: 'success',
        details: activity.details || `${activity.action} performed`
      }))
    })
  } catch (error) {
    next(error)
  }
})

// Get system health
router.get('/health', async (req, res, next) => {
  try {
    // Simulate system health metrics
    // In a real application, these would come from actual system monitoring
    res.json({
      cpu: Math.floor(Math.random() * 100),
      memory: Math.floor(Math.random() * 100),
      disk: Math.floor(Math.random() * 100),
      network: 'good',
      database: 'connected',
      backupStatus: 'recent'
    })
  } catch (error) {
    next(error)
  }
})

// Get all users with filtering and pagination
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, role, status } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)

    const whereClause = {}
    if (search) {
      whereClause[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ]
    }
    if (role) {
      whereClause.role = role
    }
    if (status === 'active') {
      whereClause.isActive = true
    } else if (status === 'inactive') {
      whereClause.isActive = false
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password', 'twoFactorSecret'] }
    })

    const users = rows.map(user => ({
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
        totalPages: Math.ceil(count / parseInt(limit)),
        totalUsers: count,
        hasNextPage: offset + parseInt(limit) < count,
        hasPrevPage: parseInt(page) > 1
      }
    })
  } catch (error) {
    next(error)
  }
})

// Get specific user
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'twoFactorSecret'] },
      include: [{
        model: CryptoKey,
        as: 'cryptoKeys',
        attributes: ['id', 'name', 'algorithm', 'status', 'createdAt']
      }]
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user })
  } catch (error) {
    next(error)
  }
})

// Update user
router.put('/users/:id', [
  body('username').optional().isLength({ min: 3, max: 50 }).trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['admin', 'user']),
  body('status').optional().isIn(['active', 'inactive', 'banned'])
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const user = await User.findByPk(req.params.id)
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

    await user.update(updateData)

    // Log user update
    await AuditLog.create({
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
    next(error)
  }
})

// Ban user
router.post('/users/:id/ban', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    await user.update({ isActive: false })

    // Log user ban
    await AuditLog.create({
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
    next(error)
  }
})

// Activate user
router.post('/users/:id/activate', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    await user.update({ isActive: true })

    // Log user activation
    await AuditLog.create({
      userId: req.user.id,
      action: 'activate_user',
      resource: 'user',
      resourceId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.json({ message: 'User activated successfully' })
  } catch (error) {
    next(error)
  }
})

// Delete user
router.delete('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Don't allow deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.count({ where: { role: 'admin' } })
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' })
      }
    }

    await user.destroy()

    // Log user deletion
    await AuditLog.create({
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
    next(error)
  }
})

// Get audit logs
router.get('/audit-logs', async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      userId, 
      action, 
      resource, 
      status, 
      startDate, 
      endDate 
    } = req.query

    const offset = (parseInt(page) - 1) * parseInt(limit)
    const whereClause = {}

    if (userId) whereClause.userId = userId
    if (action) whereClause.action = action
    if (resource) whereClause.resource = resource
    if (startDate || endDate) {
      whereClause.createdAt = {}
      if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate)
      if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate)
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    })

    const auditLogs = rows.map(log => ({
      id: log.id,
      userId: log.userId,
      username: 'User', // We'll get username separately if needed
      action: log.action,
      resource: log.resource,
      timestamp: log.createdAt,
      ipAddress: log.ipAddress,
      status: 'success', // Assuming success unless we track failures
      details: log.details || `${log.action} performed`
    }))

    res.json({
      auditLogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        totalLogs: count,
        hasNextPage: offset + parseInt(limit) < count,
        hasPrevPage: parseInt(page) > 1
      }
    })
  } catch (error) {
    next(error)
  }
})

// Get system settings
router.get('/settings', async (req, res, next) => {
  try {
    const settings = await SystemSettings.findOne()
    res.json({ settings: settings || {} })
  } catch (error) {
    next(error)
  }
})

// Update system settings
router.put('/settings', async (req, res, next) => {
  try {
    const settings = await SystemSettings.findOne()
    
    if (settings) {
      await settings.update(req.body)
    } else {
      await SystemSettings.create(req.body)
    }

    // Log settings update
    await AuditLog.create({
      userId: req.user.id,
      action: 'update_settings',
      resource: 'system',
      details: req.body,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.json({ message: 'Settings updated successfully' })
  } catch (error) {
    next(error)
  }
})

export default router