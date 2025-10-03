import express from 'express'
import { body, validationResult } from 'express-validator'
import { authenticateToken } from '../middleware/auth.js'
import { CryptoService } from '../services/cryptoService.js'
import CryptoKey from '../models/CryptoKey.js'
import AuditLog from '../models/AuditLog.js'

const router = express.Router()

// Get all user keys
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const keys = await CryptoKey.findAll({
      where: { userId: req.user.id },
      attributes: { exclude: ['keyData'] }, // Don't return sensitive key data
      order: [['createdAt', 'DESC']]
    })

    res.json({ keys })
  } catch (error) {
    next(error)
  }
})

// Get specific key
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const key = await CryptoKey.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    })

    if (!key) {
      return res.status(404).json({ error: 'Key not found' })
    }

    // Log key access
    await AuditLog.create({
      userId: req.user.id,
      action: 'access_key',
      resource: 'key',
      resourceId: key.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.json({ key })
  } catch (error) {
    next(error)
  }
})

// Create/Save new key
router.post('/', authenticateToken, [
  body('name').notEmpty().withMessage('Key name is required'),
  body('algorithm').isIn(['AES', 'RSA']).withMessage('Algorithm must be AES or RSA'),
  body('keySize').isInt({ min: 128 }).withMessage('Invalid key size'),
  body('keyData').notEmpty().withMessage('Key data is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { name, algorithm, keySize, keyData, publicKey, expiresAt } = req.body

    const key = await CryptoKey.create({
      userId: req.user.id,
      name,
      algorithm,
      keySize,
      keyData,
      publicKey: publicKey || null,
      expiresAt: expiresAt || null
    })

    // Log key creation
    await AuditLog.create({
      userId: req.user.id,
      action: 'create_key',
      resource: 'key',
      resourceId: key.id,
      details: { name, algorithm, keySize },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.status(201).json({
      message: 'Key saved successfully',
      key: {
        id: key.id,
        name: key.name,
        algorithm: key.algorithm,
        keySize: key.keySize,
        status: key.status,
        createdAt: key.createdAt
      }
    })
  } catch (error) {
    next(error)
  }
})

// Generate and save new key
router.post('/generate', authenticateToken, [
  body('name').notEmpty().withMessage('Key name is required'),
  body('algorithm').isIn(['AES', 'RSA']).withMessage('Algorithm must be AES or RSA'),
  body('keySize').isInt({ min: 128 }).withMessage('Invalid key size')
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { name, algorithm, keySize, expiresAt } = req.body

    let keyData, publicKey = null

    if (algorithm === 'AES') {
      keyData = CryptoService.generateRandomKey(keySize / 8)
    } else if (algorithm === 'RSA') {
      const keyPair = CryptoService.generateRSAKeyPair(keySize)
      keyData = keyPair.privateKey
      publicKey = keyPair.publicKey
    }

    const key = await CryptoKey.create({
      userId: req.user.id,
      name,
      algorithm,
      keySize,
      keyData,
      publicKey,
      expiresAt: expiresAt || null
    })

    // Log key generation
    await AuditLog.create({
      userId: req.user.id,
      action: 'generate_key',
      resource: 'key',
      resourceId: key.id,
      details: { name, algorithm, keySize },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.status(201).json({
      message: 'Key generated and saved successfully',
      key: {
        id: key.id,
        name: key.name,
        algorithm: key.algorithm,
        keySize: key.keySize,
        status: key.status,
        createdAt: key.createdAt,
        ...(algorithm === 'RSA' && { publicKey })
      }
    })
  } catch (error) {
    next(error)
  }
})

// Update key
router.put('/:id', authenticateToken, [
  body('name').optional().notEmpty().withMessage('Key name cannot be empty')
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const key = await CryptoKey.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    })

    if (!key) {
      return res.status(404).json({ error: 'Key not found' })
    }

    const { name, expiresAt } = req.body

    await key.update({
      ...(name && { name }),
      ...(expiresAt !== undefined && { expiresAt })
    })

    // Log key update
    await AuditLog.create({
      userId: req.user.id,
      action: 'update_key',
      resource: 'key',
      resourceId: key.id,
      details: { name, expiresAt },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.json({ message: 'Key updated successfully', key })
  } catch (error) {
    next(error)
  }
})

// Revoke key
router.post('/:id/revoke', authenticateToken, async (req, res, next) => {
  try {
    const key = await CryptoKey.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    })

    if (!key) {
      return res.status(404).json({ error: 'Key not found' })
    }

    if (key.status === 'revoked') {
      return res.status(400).json({ error: 'Key is already revoked' })
    }

    await key.update({ status: 'revoked' })

    // Log key revocation
    await AuditLog.create({
      userId: req.user.id,
      action: 'revoke_key',
      resource: 'key',
      resourceId: key.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.json({ message: 'Key revoked successfully' })
  } catch (error) {
    next(error)
  }
})

// Delete key
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const key = await CryptoKey.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    })

    if (!key) {
      return res.status(404).json({ error: 'Key not found' })
    }

    await key.destroy()

    // Log key deletion
    await AuditLog.create({
      userId: req.user.id,
      action: 'delete_key',
      resource: 'key',
      resourceId: key.id,
      details: { name: key.name },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.json({ message: 'Key deleted successfully' })
  } catch (error) {
    next(error)
  }
})

// Export key
router.get('/:id/export', authenticateToken, async (req, res, next) => {
  try {
    const key = await CryptoKey.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    })

    if (!key) {
      return res.status(404).json({ error: 'Key not found' })
    }

    if (key.status === 'revoked') {
      return res.status(400).json({ error: 'Cannot export revoked key' })
    }

    // Log key export
    await AuditLog.create({
      userId: req.user.id,
      action: 'export_key',
      resource: 'key',
      resourceId: key.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    const exportData = {
      name: key.name,
      algorithm: key.algorithm,
      keySize: key.keySize,
      keyData: key.keyData,
      ...(key.publicKey && { publicKey: key.publicKey }),
      exportedAt: new Date().toISOString()
    }

    res.setHeader('Content-Disposition', `attachment; filename="${key.name}.json"`)
    res.setHeader('Content-Type', 'application/json')
    res.json(exportData)
  } catch (error) {
    next(error)
  }
})

export default router