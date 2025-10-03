import { describe, it, expect, jest } from '@jest/globals'
import express from 'express'
import request from 'supertest'

// Create a test app with mock signatures routes
const app = express()
app.use(express.json())

// Mock middleware
const authenticateToken = (req, res, next) => {
  req.user = { id: 1, username: 'testuser' }
  next()
}

// Mock crypto service
const mockCryptoService = {
  signData: jest.fn(),
  verifySignature: jest.fn(),
  generateHash: jest.fn()
}

// Mock audit log
const mockAuditLog = {
  create: jest.fn().mockResolvedValue({})
}

// Mock signatures routes
app.post('/signatures/sign', authenticateToken, (req, res) => {
  const { data, privateKey, algorithm = 'RSA-SHA256' } = req.body

  if (!data) {
    return res.status(400).json({ errors: [{ msg: 'Data to sign is required' }] })
  }
  if (!privateKey) {
    return res.status(400).json({ errors: [{ msg: 'Private key is required' }] })
  }
  if (!['RSA-SHA256', 'RSA-SHA512', 'ECDSA-SHA256'].includes(algorithm)) {
    return res.status(400).json({ errors: [{ msg: 'Invalid signature algorithm' }] })
  }

  const signature = mockCryptoService.signData(data, privateKey, algorithm)

  mockAuditLog.create({
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
})

app.post('/signatures/verify', authenticateToken, (req, res) => {
  const { data, signature, publicKey, algorithm = 'RSA-SHA256' } = req.body

  if (!data) {
    return res.status(400).json({ errors: [{ msg: 'Original data is required' }] })
  }
  if (!signature) {
    return res.status(400).json({ errors: [{ msg: 'Signature is required' }] })
  }
  if (!publicKey) {
    return res.status(400).json({ errors: [{ msg: 'Public key is required' }] })
  }

  const isValid = mockCryptoService.verifySignature(data, signature, publicKey, algorithm)

  mockAuditLog.create({
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
})

app.post('/signatures/sign-document', authenticateToken, (req, res) => {
  const { document, privateKey, algorithm = 'RSA-SHA256', metadata = {} } = req.body

  if (!document) {
    return res.status(400).json({ errors: [{ msg: 'Document content is required' }] })
  }
  if (!privateKey) {
    return res.status(400).json({ errors: [{ msg: 'Private key is required' }] })
  }
  if (typeof metadata !== 'object') {
    return res.status(400).json({ errors: [{ msg: 'Metadata must be an object' }] })
  }

  const documentHash = mockCryptoService.generateHash(document, 'sha256')
  const signaturePayload = {
    documentHash,
    algorithm,
    timestamp: new Date().toISOString(),
    signer: req.user.username,
    metadata
  }

  const payloadString = JSON.stringify(signaturePayload)
  const signature = mockCryptoService.signData(payloadString, privateKey, algorithm)

  mockAuditLog.create({
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
})

app.post('/signatures/verify-document', authenticateToken, (req, res) => {
  const { document, signature, signaturePayload, publicKey } = req.body

  if (!document) {
    return res.status(400).json({ errors: [{ msg: 'Original document is required' }] })
  }
  if (!signature) {
    return res.status(400).json({ errors: [{ msg: 'Signature is required' }] })
  }
  if (!signaturePayload) {
    return res.status(400).json({ errors: [{ msg: 'Signature payload is required' }] })
  }
  if (!publicKey) {
    return res.status(400).json({ errors: [{ msg: 'Public key is required' }] })
  }

  const actualDocumentHash = mockCryptoService.generateHash(document, 'sha256')
  const payloadObj = typeof signaturePayload === 'string'
    ? JSON.parse(signaturePayload)
    : signaturePayload

  const documentIntegrityValid = actualDocumentHash === payloadObj.documentHash
  const signatureValid = mockCryptoService.verifySignature(
    JSON.stringify(payloadObj),
    signature,
    publicKey,
    payloadObj.algorithm
  )

  const isValid = documentIntegrityValid && signatureValid

  mockAuditLog.create({
    userId: req.user.id,
    action: 'verify_document',
    resource: 'signature',
    details: {
      algorithm: payloadObj.algorithm,
      isValid,
      documentIntegrityValid,
      signatureValid,
      documentLength: document.length
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
})

app.get('/signatures/algorithms', authenticateToken, (req, res) => {
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

describe('Signatures Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /signatures/sign', () => {
    it('should sign data successfully', async () => {
      const mockSignature = 'mock-signature'
      mockCryptoService.signData.mockReturnValue(mockSignature)

      const response = await request(app)
        .post('/signatures/sign')
        .send({
          data: 'test data',
          privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----',
          algorithm: 'RSA-SHA256'
        })

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        success: true,
        signature: mockSignature,
        algorithm: 'RSA-SHA256'
      })
      expect(mockCryptoService.signData).toHaveBeenCalledWith('test data', expect.any(String), 'RSA-SHA256')
      expect(mockAuditLog.create).toHaveBeenCalledWith({
        userId: 1,
        action: 'sign_data',
        resource: 'signature',
        details: { algorithm: 'RSA-SHA256', dataLength: 9 },
        ipAddress: '::ffff:127.0.0.1',
        userAgent: undefined
      })
    })

    it('should use default algorithm when not specified', async () => {
      const mockSignature = 'mock-signature'
      mockCryptoService.signData.mockReturnValue(mockSignature)

      const response = await request(app)
        .post('/signatures/sign')
        .send({
          data: 'test data',
          privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----'
        })

      expect(response.status).toBe(200)
      expect(response.body.algorithm).toBe('RSA-SHA256')
      expect(mockCryptoService.signData).toHaveBeenCalledWith('test data', expect.any(String), 'RSA-SHA256')
    })

    it('should reject missing data', async () => {
      const response = await request(app)
        .post('/signatures/sign')
        .send({
          privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----'
        })

      expect(response.status).toBe(400)
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Data to sign is required' })
        ])
      )
    })

    it('should reject missing private key', async () => {
      const response = await request(app)
        .post('/signatures/sign')
        .send({
          data: 'test data'
        })

      expect(response.status).toBe(400)
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Private key is required' })
        ])
      )
    })

    it('should reject invalid algorithm', async () => {
      const response = await request(app)
        .post('/signatures/sign')
        .send({
          data: 'test data',
          privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----',
          algorithm: 'INVALID-ALGO'
        })

      expect(response.status).toBe(400)
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Invalid signature algorithm' })
        ])
      )
    })
  })

  describe('POST /signatures/verify', () => {
    it('should verify signature successfully', async () => {
      mockCryptoService.verifySignature.mockReturnValue(true)

      const response = await request(app)
        .post('/signatures/verify')
        .send({
          data: 'test data',
          signature: 'mock-signature',
          publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----',
          algorithm: 'RSA-SHA256'
        })

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        success: true,
        isValid: true,
        algorithm: 'RSA-SHA256'
      })
      expect(mockCryptoService.verifySignature).toHaveBeenCalledWith('test data', 'mock-signature', expect.any(String), 'RSA-SHA256')
      expect(mockAuditLog.create).toHaveBeenCalledWith({
        userId: 1,
        action: 'verify_signature',
        resource: 'signature',
        details: { algorithm: 'RSA-SHA256', isValid: true, dataLength: 9 },
        ipAddress: '::ffff:127.0.0.1',
        userAgent: undefined
      })
    })

    it('should handle invalid signature', async () => {
      mockCryptoService.verifySignature.mockReturnValue(false)

      const response = await request(app)
        .post('/signatures/verify')
        .send({
          data: 'test data',
          signature: 'invalid-signature',
          publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----',
          algorithm: 'RSA-SHA256'
        })

      expect(response.status).toBe(200)
      expect(response.body.isValid).toBe(false)
      expect(mockAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({ isValid: false })
        })
      )
    })

    it('should reject missing data', async () => {
      const response = await request(app)
        .post('/signatures/verify')
        .send({
          signature: 'mock-signature',
          publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----'
        })

      expect(response.status).toBe(400)
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Original data is required' })
        ])
      )
    })

    it('should reject missing signature', async () => {
      const response = await request(app)
        .post('/signatures/verify')
        .send({
          data: 'test data',
          publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----'
        })

      expect(response.status).toBe(400)
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Signature is required' })
        ])
      )
    })

    it('should reject missing public key', async () => {
      const response = await request(app)
        .post('/signatures/verify')
        .send({
          data: 'test data',
          signature: 'mock-signature'
        })

      expect(response.status).toBe(400)
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Public key is required' })
        ])
      )
    })
  })

  describe('POST /signatures/sign-document', () => {
    it('should sign document successfully', async () => {
      const mockSignature = 'document-signature'
      mockCryptoService.signData.mockReturnValue(mockSignature)
      mockCryptoService.generateHash.mockReturnValue('mock-hash')

      const response = await request(app)
        .post('/signatures/sign-document')
        .send({
          document: 'document content',
          privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----',
          algorithm: 'RSA-SHA256',
          metadata: { title: 'Test Document', version: '1.0' }
        })

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        success: true,
        signature: mockSignature,
        algorithm: 'RSA-SHA256'
      })
      expect(response.body.signaturePayload).toMatchObject({
        documentHash: 'mock-hash',
        algorithm: 'RSA-SHA256',
        signer: 'testuser',
        metadata: { title: 'Test Document', version: '1.0' }
      })
      expect(mockCryptoService.generateHash).toHaveBeenCalledWith('document content', 'sha256')
      expect(mockAuditLog.create).toHaveBeenCalledWith({
        userId: 1,
        action: 'sign_document',
        resource: 'signature',
        details: { algorithm: 'RSA-SHA256', documentLength: 16, hasMetadata: true },
        ipAddress: '::ffff:127.0.0.1',
        userAgent: undefined
      })
    })

    it('should sign document without metadata', async () => {
      const mockSignature = 'document-signature'
      mockCryptoService.signData.mockReturnValue(mockSignature)
      mockCryptoService.generateHash.mockReturnValue('mock-hash')

      const response = await request(app)
        .post('/signatures/sign-document')
        .send({
          document: 'document content',
          privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----'
        })

      expect(response.status).toBe(200)
      expect(response.body.signaturePayload.metadata).toEqual({})
      expect(mockAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({ hasMetadata: false })
        })
      )
    })

    it('should reject missing document', async () => {
      const response = await request(app)
        .post('/signatures/sign-document')
        .send({
          privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----'
        })

      expect(response.status).toBe(400)
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Document content is required' })
        ])
      )
    })

    it('should reject invalid metadata format', async () => {
      const response = await request(app)
        .post('/signatures/sign-document')
        .send({
          document: 'document content',
          privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----',
          metadata: 'invalid-metadata'
        })

      expect(response.status).toBe(400)
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Metadata must be an object' })
        ])
      )
    })
  })

  describe('POST /signatures/verify-document', () => {
    it('should verify document signature successfully', async () => {
      mockCryptoService.generateHash.mockReturnValue('mock-hash')
      mockCryptoService.verifySignature.mockReturnValue(true)

      const signaturePayload = {
        documentHash: 'mock-hash',
        algorithm: 'RSA-SHA256',
        timestamp: '2024-01-01T00:00:00.000Z',
        signer: 'testuser',
        metadata: { title: 'Test Document' }
      }

      const response = await request(app)
        .post('/signatures/verify-document')
        .send({
          document: 'document content',
          signature: 'document-signature',
          signaturePayload: signaturePayload,
          publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----'
        })

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        success: true,
        isValid: true,
        documentIntegrityValid: true,
        signatureValid: true
      })
      expect(response.body.signatureDetails).toMatchObject({
        algorithm: 'RSA-SHA256',
        timestamp: '2024-01-01T00:00:00.000Z',
        signer: 'testuser',
        metadata: { title: 'Test Document' }
      })
      expect(mockCryptoService.generateHash).toHaveBeenCalledWith('document content', 'sha256')
      expect(mockAuditLog.create).toHaveBeenCalledWith({
        userId: 1,
        action: 'verify_document',
        resource: 'signature',
        details: {
          algorithm: 'RSA-SHA256',
          isValid: true,
          documentIntegrityValid: true,
          signatureValid: true,
          documentLength: 16
        },
        ipAddress: '::ffff:127.0.0.1',
        userAgent: undefined
      })
    })

    it('should handle tampered document', async () => {
      mockCryptoService.generateHash.mockReturnValue('different-hash')
      mockCryptoService.verifySignature.mockReturnValue(true)

      const signaturePayload = {
        documentHash: 'original-hash',
        algorithm: 'RSA-SHA256',
        timestamp: '2024-01-01T00:00:00.000Z',
        signer: 'testuser'
      }

      const response = await request(app)
        .post('/signatures/verify-document')
        .send({
          document: 'tampered content',
          signature: 'document-signature',
          signaturePayload: signaturePayload,
          publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----'
        })

      expect(response.status).toBe(200)
      expect(response.body.isValid).toBe(false)
      expect(response.body.documentIntegrityValid).toBe(false)
      expect(response.body.signatureValid).toBe(true)
    })

    it('should handle invalid signature', async () => {
      mockCryptoService.generateHash.mockReturnValue('mock-hash')
      mockCryptoService.verifySignature.mockReturnValue(false)

      const signaturePayload = {
        documentHash: 'mock-hash',
        algorithm: 'RSA-SHA256',
        timestamp: '2024-01-01T00:00:00.000Z',
        signer: 'testuser'
      }

      const response = await request(app)
        .post('/signatures/verify-document')
        .send({
          document: 'document content',
          signature: 'invalid-signature',
          signaturePayload: signaturePayload,
          publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----'
        })

      expect(response.status).toBe(200)
      expect(response.body.isValid).toBe(false)
      expect(response.body.documentIntegrityValid).toBe(true)
      expect(response.body.signatureValid).toBe(false)
    })

    it('should handle string signature payload', async () => {
      mockCryptoService.generateHash.mockReturnValue('mock-hash')
      mockCryptoService.verifySignature.mockReturnValue(true)

      const signaturePayload = {
        documentHash: 'mock-hash',
        algorithm: 'RSA-SHA256',
        timestamp: '2024-01-01T00:00:00.000Z',
        signer: 'testuser'
      }

      const response = await request(app)
        .post('/signatures/verify-document')
        .send({
          document: 'document content',
          signature: 'document-signature',
          signaturePayload: JSON.stringify(signaturePayload),
          publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----'
        })

      expect(response.status).toBe(200)
      expect(response.body.isValid).toBe(true)
    })

    it('should reject missing document', async () => {
      const response = await request(app)
        .post('/signatures/verify-document')
        .send({
          signature: 'document-signature',
          signaturePayload: {},
          publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----'
        })

      expect(response.status).toBe(400)
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Original document is required' })
        ])
      )
    })

    it('should reject missing signature', async () => {
      const response = await request(app)
        .post('/signatures/verify-document')
        .send({
          document: 'document content',
          signaturePayload: {},
          publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----'
        })

      expect(response.status).toBe(400)
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Signature is required' })
        ])
      )
    })

    it('should reject missing signature payload', async () => {
      const response = await request(app)
        .post('/signatures/verify-document')
        .send({
          document: 'document content',
          signature: 'document-signature',
          publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----'
        })

      expect(response.status).toBe(400)
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Signature payload is required' })
        ])
      )
    })

    it('should reject missing public key', async () => {
      const response = await request(app)
        .post('/signatures/verify-document')
        .send({
          document: 'document content',
          signature: 'document-signature',
          signaturePayload: {}
        })

      expect(response.status).toBe(400)
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Public key is required' })
        ])
      )
    })
  })

  describe('GET /signatures/algorithms', () => {
    it('should return available signature algorithms', async () => {
      const response = await request(app)
        .get('/signatures/algorithms')

      expect(response.status).toBe(200)
      expect(response.body.algorithms).toHaveLength(3)
      expect(response.body.algorithms).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'RSA-SHA256',
            name: 'RSA with SHA-256',
            keyType: 'RSA',
            hashFunction: 'SHA-256'
          }),
          expect.objectContaining({
            id: 'RSA-SHA512',
            name: 'RSA with SHA-512',
            keyType: 'RSA',
            hashFunction: 'SHA-512'
          }),
          expect.objectContaining({
            id: 'ECDSA-SHA256',
            name: 'ECDSA with SHA-256',
            keyType: 'ECDSA',
            hashFunction: 'SHA-256'
          })
        ])
      )
    })
  })
})