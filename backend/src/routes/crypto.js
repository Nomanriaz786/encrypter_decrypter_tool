import express from 'express'
import { body, validationResult } from 'express-validator'
import { authenticateToken } from '../middleware/auth.js'
import { CryptoService } from '../services/cryptoService.js'
import AuditLog from '../models/AuditLog.js'

const router = express.Router()

// Encrypt data
router.post('/encrypt', authenticateToken, [
  body('text').notEmpty().withMessage('Text is required'),
  body('algorithm').isIn(['AES', 'RSA']).withMessage('Algorithm must be AES or RSA'),
  body('keySize').isInt({ min: 128 }).withMessage('Invalid key size')
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { text, algorithm, keySize, key, publicKey } = req.body

    let result
    if (algorithm === 'AES') {
      if (!key) {
        return res.status(400).json({ error: 'AES key is required' })
      }
      result = CryptoService.encryptAES(text, key, keySize)
    } else if (algorithm === 'RSA') {
      if (!publicKey) {
        return res.status(400).json({ error: 'RSA public key is required' })
      }
      result = {
        encrypted: CryptoService.encryptRSA(text, publicKey),
        algorithm: `RSA-${keySize}`
      }
    }

    // Log encryption operation
    await AuditLog.create({
      userId: req.user.id,
      action: 'encrypt',
      resource: 'crypto',
      details: { algorithm, keySize },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.json({ success: true, result })
  } catch (error) {
    next(error)
  }
})

// Decrypt data
router.post('/decrypt', authenticateToken, [
  body('encryptedData').notEmpty().withMessage('Encrypted data is required'),
  body('algorithm').isIn(['AES', 'RSA']).withMessage('Algorithm must be AES or RSA')
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { encryptedData, algorithm, keySize, key, privateKey } = req.body

    let decrypted
    if (algorithm === 'AES') {
      if (!key) {
        return res.status(400).json({ error: 'AES key is required' })
      }
      decrypted = CryptoService.decryptAES(encryptedData, key, keySize)
    } else if (algorithm === 'RSA') {
      if (!privateKey) {
        return res.status(400).json({ error: 'RSA private key is required' })
      }
      decrypted = CryptoService.decryptRSA(encryptedData, privateKey)
    }

    // Log decryption operation
    await AuditLog.create({
      userId: req.user.id,
      action: 'decrypt',
      resource: 'crypto',
      details: { algorithm, keySize },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.json({ success: true, decrypted })
  } catch (error) {
    next(error)
  }
})

// Generate hash
router.post('/hash', authenticateToken, [
  body('text').notEmpty().withMessage('Text is required'),
  body('algorithm').isIn(['md5', 'sha1', 'sha256', 'sha512']).withMessage('Invalid hash algorithm')
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { text, algorithm } = req.body

    const hash = CryptoService.generateHash(text, algorithm)

    // Log hashing operation
    await AuditLog.create({
      userId: req.user.id,
      action: 'hash',
      resource: 'crypto',
      details: { algorithm },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.json({ success: true, hash, algorithm })
  } catch (error) {
    next(error)
  }
})

// Verify file integrity
router.post('/verify-integrity', authenticateToken, [
  body('expectedHash').notEmpty().withMessage('Expected hash is required'),
  body('actualData').notEmpty().withMessage('Actual data is required'),
  body('algorithm').isIn(['md5', 'sha1', 'sha256', 'sha512']).withMessage('Invalid hash algorithm')
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { expectedHash, actualData, algorithm } = req.body

    const actualHash = CryptoService.generateHash(actualData, algorithm)
    const isValid = actualHash.toLowerCase() === expectedHash.toLowerCase()

    // Log integrity check
    await AuditLog.create({
      userId: req.user.id,
      action: 'verify_integrity',
      resource: 'crypto',
      details: { algorithm, isValid },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.json({
      success: true,
      isValid,
      expectedHash: expectedHash.toLowerCase(),
      actualHash,
      algorithm
    })
  } catch (error) {
    next(error)
  }
})

// Generate random key
router.post('/generate-key', authenticateToken, [
  body('algorithm').isIn(['AES', 'RSA']).withMessage('Algorithm must be AES or RSA'),
  body('keySize').isInt({ min: 128 }).withMessage('Invalid key size')
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { algorithm, keySize } = req.body

    let keyData
    if (algorithm === 'AES') {
      keyData = {
        key: CryptoService.generateRandomKey(keySize / 8)
      }
    } else if (algorithm === 'RSA') {
      const keyPair = CryptoService.generateRSAKeyPair(keySize)
      keyData = {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey
      }
    }

    // Log key generation
    await AuditLog.create({
      userId: req.user.id,
      action: 'generate_key',
      resource: 'crypto',
      details: { algorithm, keySize },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.json({ success: true, keyData, algorithm, keySize })
  } catch (error) {
    next(error)
  }
})

export default router