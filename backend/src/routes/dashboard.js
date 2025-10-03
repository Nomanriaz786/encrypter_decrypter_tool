import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import CryptoKey from '../models/CryptoKey.js'
import AuditLog from '../models/AuditLog.js'
import { Op } from 'sequelize'

const router = express.Router()

// Apply authentication to all routes
router.use(authenticateToken)

// Get user dashboard statistics
router.get('/stats', async (req, res, next) => {
  try {
    const userId = req.user.id

    const [
      totalKeys,
      activeKeys,
      recentActivity
    ] = await Promise.all([
      CryptoKey.count({ where: { userId } }),
      CryptoKey.count({ where: { userId, status: 'active' } }),
      AuditLog.findAll({
        where: { userId },
        limit: 5,
        order: [['createdAt', 'DESC']]
      })
    ])

    const encryptionSessions = await AuditLog.count({
      where: {
        userId,
        action: { [Op.in]: ['encrypt', 'decrypt'] }
      }
    })

    const lastActivity = recentActivity.length > 0 
      ? recentActivity[0].createdAt.toLocaleString()
      : 'Never'

    res.json({
      totalKeys,
      activeKeys,
      encryptionSessions,
      lastActivity
    })
  } catch (error) {
    next(error)
  }
})

// Get recent activity for user
router.get('/activity', async (req, res, next) => {
  try {
    const { limit = 10 } = req.query
    const userId = req.user.id

    const activities = await AuditLog.findAll({
      where: { userId },
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    })

    const recentActivity = activities.map(activity => ({
      id: activity.id,
      type: getActivityType(activity.action),
      description: getActivityDescription(activity.action, activity.resource, activity.details),
      timestamp: activity.createdAt.toLocaleTimeString(),
      status: 'success'
    }))

    res.json({ recentActivity })
  } catch (error) {
    next(error)
  }
})

// Get usage metrics for user
router.get('/usage', async (req, res, next) => {
  try {
    const { period = '7d' } = req.query
    const userId = req.user.id

    let startDate = new Date()
    switch (period) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24)
        break
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
    }

    const [
      encryptionCount,
      decryptionCount,
      keyOperations,
      signatureOperations
    ] = await Promise.all([
      AuditLog.count({
        where: {
          userId,
          action: 'encrypt',
          createdAt: { [Op.gte]: startDate }
        }
      }),
      AuditLog.count({
        where: {
          userId,
          action: 'decrypt',
          createdAt: { [Op.gte]: startDate }
        }
      }),
      AuditLog.count({
        where: {
          userId,
          action: { [Op.in]: ['create_key', 'generate_key', 'revoke_key'] },
          createdAt: { [Op.gte]: startDate }
        }
      }),
      AuditLog.count({
        where: {
          userId,
          action: { [Op.in]: ['sign', 'verify'] },
          createdAt: { [Op.gte]: startDate }
        }
      })
    ])

    res.json({
      period,
      encryptionCount,
      decryptionCount,
      keyOperations,
      signatureOperations,
      totalOperations: encryptionCount + decryptionCount + keyOperations + signatureOperations
    })
  } catch (error) {
    next(error)
  }
})

// Helper functions
function getActivityType(action) {
  const typeMap = {
    'encrypt': 'encryption',
    'decrypt': 'decryption',
    'create_key': 'key_generation',
    'generate_key': 'key_generation',
    'revoke_key': 'key_generation',
    'sign': 'signing',
    'verify': 'signing',
    'login': 'authentication'
  }
  return typeMap[action] || 'other'
}

function getActivityDescription(action, resource, details) {
  const descriptions = {
    'encrypt': 'Encrypted data',
    'decrypt': 'Decrypted data',
    'create_key': 'Created encryption key',
    'generate_key': 'Generated encryption key',
    'revoke_key': 'Revoked encryption key',
    'sign': 'Signed document',
    'verify': 'Verified signature',
    'login': 'Logged into system'
  }
  
  return descriptions[action] || `Performed ${action} on ${resource}`
}

export default router