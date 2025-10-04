import express from 'express'
import { body, validationResult } from 'express-validator'
import { authenticateToken } from '../middleware/auth.js'
import { CryptoService } from '../services/cryptoService.js'
import AuditLog from '../models/AuditLog.js'

const router = express.Router()

// Sign data
router.post('/sign', authenticateToken, [
  body('data').notEmpty().withMessage('Data to sign is required'),
  body('privateKey').notEmpty().withMessage('Private key is required'),
  body('algorithm').optional().isIn(['RSA-SHA256', 'RSA-SHA512', 'ECDSA-SHA256']).withMessage('Invalid signature algorithm')
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { data, privateKey, algorithm = 'RSA-SHA256' } = req.body

    const signature = CryptoService.signData(data, privateKey, algorithm)

    // Log signing operation
    await AuditLog.create({
      userId: req.user.id,
      action: 'sign_data',
      resource: 'signature',
      details: { algorithm, dataLength: data.length },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.json({
      success: true,
      signature,
      algorithm,
      signedAt: new Date().toISOString()
    })
  } catch (error) {
    next(error)
  }
})

// Verify signature
router.post('/verify', authenticateToken, [
  body('data').notEmpty().withMessage('Original data is required'),
  body('signature').notEmpty().withMessage('Signature is required'),
  body('publicKey').notEmpty().withMessage('Public key is required'),
  body('algorithm').optional().isIn(['RSA-SHA256', 'RSA-SHA512', 'ECDSA-SHA256']).withMessage('Invalid signature algorithm')
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { data, signature, publicKey, algorithm = 'RSA-SHA256' } = req.body

    const isValid = CryptoService.verifySignature(data, signature, publicKey, algorithm)

    // Log verification operation
    await AuditLog.create({
      userId: req.user.id,
      action: 'verify_signature',
      resource: 'signature',
      details: { algorithm, isValid, dataLength: data.length },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.json({
      success: true,
      isValid,
      algorithm,
      verifiedAt: new Date().toISOString()
    })
  } catch (error) {
    next(error)
  }
})

// Sign document (with metadata)
router.post('/sign-document', authenticateToken, [
  body('document').notEmpty().withMessage('Document content is required'),
  body('privateKey').notEmpty().withMessage('Private key is required'),
  body('algorithm').optional().isIn(['RSA-SHA256', 'RSA-SHA512', 'ECDSA-SHA256']).withMessage('Invalid signature algorithm'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object')
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { document, privateKey, algorithm = 'RSA-SHA256', metadata = {} } = req.body

    // Create document hash
    const documentHash = CryptoService.generateHash(document, 'sha256')
    
    // Create signature payload with consistent property order
    const signaturePayload = {
      algorithm,
      documentHash,
      metadata: metadata || {},
      signer: req.user.username,
      timestamp: new Date().toISOString()
    }

    // Ensure consistent JSON serialization
    const payloadString = JSON.stringify(signaturePayload, Object.keys(signaturePayload).sort())
    const signature = CryptoService.signData(payloadString, privateKey, algorithm)

    // Log document signing
    await AuditLog.create({
      userId: req.user.id,
      action: 'sign_document',
      resource: 'signature',
      details: { 
        algorithm, 
        documentLength: document.length,
        hasMetadata: Object.keys(metadata).length > 0
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.json({
      success: true,
      signature,
      signaturePayload,
      documentHash,
      algorithm
    })
  } catch (error) {
    next(error)
  }
})

// Verify document signature
router.post('/verify-document', authenticateToken, [
  body('document').notEmpty().withMessage('Original document is required'),
  body('signature').notEmpty().withMessage('Signature is required'),
  body('signaturePayload').notEmpty().withMessage('Signature payload is required'),
  body('publicKey').notEmpty().withMessage('Public key is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { document, signature, signaturePayload, publicKey } = req.body

    // Parse signature payload
    let payloadObj
    try {
      payloadObj = typeof signaturePayload === 'string' ? JSON.parse(signaturePayload) : signaturePayload
    } catch (error) {
      console.error('Invalid signature payload format', error)
      return res.status(400).json({ error: 'Invalid signature payload format' })
    }

    // Verify document integrity
    const actualDocumentHash = CryptoService.generateHash(document, 'sha256')
    const documentIntegrityValid = actualDocumentHash === payloadObj.documentHash

    // Verify signature - ensure consistent JSON serialization with same property order
    const verificationPayload = {
      algorithm: payloadObj.algorithm,
      documentHash: payloadObj.documentHash,
      metadata: payloadObj.metadata || {},
      signer: payloadObj.signer,
      timestamp: payloadObj.timestamp
    }
    const payloadString = JSON.stringify(verificationPayload, Object.keys(verificationPayload).sort())

    const signatureValid = CryptoService.verifySignature(
      payloadString, 
      signature, 
      publicKey, 
      payloadObj.algorithm || 'RSA-SHA256'
    )

    const isValid = documentIntegrityValid && signatureValid

    // Log document verification
    await AuditLog.create({
      userId: req.user.id,
      action: 'verify_document',
      resource: 'signature',
      details: { 
        algorithm: payloadObj.algorithm,
        isValid,
        documentIntegrityValid,
        signatureValid,
        documentLength: document.length,
        actualHash: actualDocumentHash,
        expectedHash: payloadObj.documentHash
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.json({
      success: true,
      isValid,
      documentIntegrityValid,
      signatureValid,
      signatureDetails: {
        algorithm: payloadObj.algorithm,
        timestamp: payloadObj.timestamp,
        signer: payloadObj.signer,
        metadata: payloadObj.metadata
      },
      verifiedAt: new Date().toISOString()
    })
  } catch (error) {
    next(error)
  }
})

// Get signature algorithms
router.get('/algorithms', authenticateToken, (req, res) => {
  res.json({
    algorithms: [
      {
        id: 'RSA-SHA256',
        name: 'RSA with SHA-256',
        description: 'Most commonly used signature algorithm',
        keyType: 'RSA',
        hashFunction: 'SHA-256'
      },
      {
        id: 'RSA-SHA512',
        name: 'RSA with SHA-512',
        description: 'RSA with stronger SHA-512 hash',
        keyType: 'RSA',
        hashFunction: 'SHA-512'
      },
      {
        id: 'ECDSA-SHA256',
        name: 'ECDSA with SHA-256',
        description: 'Elliptic Curve Digital Signature Algorithm',
        keyType: 'ECDSA',
        hashFunction: 'SHA-256'
      }
    ]
  })
})

export default router