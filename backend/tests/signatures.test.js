import request from 'supertest'
import express from 'express'
import signatureRoutes from '../../src/routes/signatures.js'
import authRoutes from '../../src/routes/auth.js'
import User from '../../src/models/User.js'

const app = express()
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/signatures', signatureRoutes)

describe('Digital Signature API Tests', () => {
  let token
  let rsaKeyPair

  beforeEach(async () => {
    // Create and login a test user
    await User.create({
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test123!@#'
    })

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'Test123!@#'
      })

    token = loginResponse.body.token

    // Generate RSA key pair for testing
    const crypto = await import('crypto')
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    })

    rsaKeyPair = { publicKey, privateKey }
  })

  describe('POST /api/signatures/sign', () => {
    it('should sign data with RSA private key', async () => {
      const response = await request(app)
        .post('/api/signatures/sign')
        .set('Authorization', `Bearer ${token}`)
        .send({
          data: 'Hello World',
          privateKey: rsaKeyPair.privateKey,
          algorithm: 'RSA-SHA256'
        })
        .expect(200)

      expect(response.body).toHaveProperty('signature')
      expect(response.body.signature).toBeTruthy()
      expect(typeof response.body.signature).toBe('string')
    })

    it('should sign data with default algorithm', async () => {
      const response = await request(app)
        .post('/api/signatures/sign')
        .set('Authorization', `Bearer ${token}`)
        .send({
          data: 'Hello World',
          privateKey: rsaKeyPair.privateKey
        })
        .expect(200)

      expect(response.body).toHaveProperty('signature')
    })

    it('should reject signing without authentication', async () => {
      const response = await request(app)
        .post('/api/signatures/sign')
        .send({
          data: 'Hello World',
          privateKey: rsaKeyPair.privateKey
        })
        .expect(401)

      expect(response.body).toHaveProperty('error', 'Access token required')
    })

    it('should reject signing with invalid private key', async () => {
      const response = await request(app)
        .post('/api/signatures/sign')
        .set('Authorization', `Bearer ${token}`)
        .send({
          data: 'Hello World',
          privateKey: 'invalid_private_key'
        })
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should reject signing with empty data', async () => {
      const response = await request(app)
        .post('/api/signatures/sign')
        .set('Authorization', `Bearer ${token}`)
        .send({
          data: '',
          privateKey: rsaKeyPair.privateKey
        })
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should reject signing without private key', async () => {
      const response = await request(app)
        .post('/api/signatures/sign')
        .set('Authorization', `Bearer ${token}`)
        .send({
          data: 'Hello World'
        })
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/signatures/verify', () => {
    let signature

    beforeEach(async () => {
      // Generate a signature first
      const signResponse = await request(app)
        .post('/api/signatures/sign')
        .set('Authorization', `Bearer ${token}`)
        .send({
          data: 'Hello World',
          privateKey: rsaKeyPair.privateKey
        })

      signature = signResponse.body.signature
    })

    it('should verify valid signature', async () => {
      const response = await request(app)
        .post('/api/signatures/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({
          data: 'Hello World',
          signature: signature,
          publicKey: rsaKeyPair.publicKey
        })
        .expect(200)

      expect(response.body).toHaveProperty('isValid', true)
      expect(response.body).toHaveProperty('message', 'Signature is valid')
    })

    it('should detect invalid signature', async () => {
      const response = await request(app)
        .post('/api/signatures/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({
          data: 'Tampered Data',
          signature: signature,
          publicKey: rsaKeyPair.publicKey
        })
        .expect(200)

      expect(response.body).toHaveProperty('isValid', false)
      expect(response.body).toHaveProperty('message', 'Signature is invalid')
    })

    it('should detect wrong public key', async () => {
      // Generate another key pair
      const crypto = await import('crypto')
      const { publicKey: wrongPublicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      })

      const response = await request(app)
        .post('/api/signatures/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({
          data: 'Hello World',
          signature: signature,
          publicKey: wrongPublicKey
        })
        .expect(200)

      expect(response.body).toHaveProperty('isValid', false)
    })

    it('should reject verification without authentication', async () => {
      await request(app)
        .post('/api/signatures/verify')
        .send({
          data: 'Hello World',
          signature: signature,
          publicKey: rsaKeyPair.publicKey
        })
        .expect(401)
    })

    it('should reject verification with invalid public key', async () => {
      const response = await request(app)
        .post('/api/signatures/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({
          data: 'Hello World',
          signature: signature,
          publicKey: 'invalid_public_key'
        })
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should reject verification with missing fields', async () => {
      const response = await request(app)
        .post('/api/signatures/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({
          data: 'Hello World',
          signature: signature
        })
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/signatures/sign-document', () => {
    it('should sign document with metadata', async () => {
      const response = await request(app)
        .post('/api/signatures/sign-document')
        .set('Authorization', `Bearer ${token}`)
        .send({
          document: 'Important Document Content',
          privateKey: rsaKeyPair.privateKey,
          metadata: {
            author: 'Test User',
            date: new Date().toISOString(),
            version: '1.0'
          }
        })
        .expect(200)

      expect(response.body).toHaveProperty('signature')
      expect(response.body).toHaveProperty('signedDocument')
      expect(response.body.signedDocument).toHaveProperty('document', 'Important Document Content')
      expect(response.body.signedDocument).toHaveProperty('metadata')
      expect(response.body.signedDocument).toHaveProperty('timestamp')
    })

    it('should sign document without metadata', async () => {
      const response = await request(app)
        .post('/api/signatures/sign-document')
        .set('Authorization', `Bearer ${token}`)
        .send({
          document: 'Important Document Content',
          privateKey: rsaKeyPair.privateKey
        })
        .expect(200)

      expect(response.body).toHaveProperty('signature')
      expect(response.body).toHaveProperty('signedDocument')
    })

    it('should reject document signing without authentication', async () => {
      await request(app)
        .post('/api/signatures/sign-document')
        .send({
          document: 'Important Document Content',
          privateKey: rsaKeyPair.privateKey
        })
        .expect(401)
    })

    it('should reject signing empty document', async () => {
      const response = await request(app)
        .post('/api/signatures/sign-document')
        .set('Authorization', `Bearer ${token}`)
        .send({
          document: '',
          privateKey: rsaKeyPair.privateKey
        })
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/signatures/verify-document', () => {
    let signedDocumentData

    beforeEach(async () => {
      // Sign a document first
      const signResponse = await request(app)
        .post('/api/signatures/sign-document')
        .set('Authorization', `Bearer ${token}`)
        .send({
          document: 'Important Document Content',
          privateKey: rsaKeyPair.privateKey,
          metadata: {
            author: 'Test User',
            version: '1.0'
          }
        })

      signedDocumentData = signResponse.body
    })

    it('should verify valid signed document', async () => {
      const response = await request(app)
        .post('/api/signatures/verify-document')
        .set('Authorization', `Bearer ${token}`)
        .send({
          document: signedDocumentData.signedDocument.document,
          signature: signedDocumentData.signature,
          signaturePayload: signedDocumentData.signedDocument,
          publicKey: rsaKeyPair.publicKey
        })
        .expect(200)

      expect(response.body).toHaveProperty('isValid', true)
      expect(response.body).toHaveProperty('message', 'Document signature is valid')
    })

    it('should detect tampered document', async () => {
      const response = await request(app)
        .post('/api/signatures/verify-document')
        .set('Authorization', `Bearer ${token}`)
        .send({
          document: 'Tampered Document Content',
          signature: signedDocumentData.signature,
          signaturePayload: signedDocumentData.signedDocument,
          publicKey: rsaKeyPair.publicKey
        })
        .expect(200)

      expect(response.body).toHaveProperty('isValid', false)
      expect(response.body).toHaveProperty('message', 'Document signature is invalid')
    })

    it('should detect tampered metadata', async () => {
      const tamperedPayload = {
        ...signedDocumentData.signedDocument,
        metadata: {
          author: 'Hacker',
          version: '99.0'
        }
      }

      const response = await request(app)
        .post('/api/signatures/verify-document')
        .set('Authorization', `Bearer ${token}`)
        .send({
          document: signedDocumentData.signedDocument.document,
          signature: signedDocumentData.signature,
          signaturePayload: tamperedPayload,
          publicKey: rsaKeyPair.publicKey
        })
        .expect(200)

      expect(response.body).toHaveProperty('isValid', false)
    })

    it('should reject verification without authentication', async () => {
      await request(app)
        .post('/api/signatures/verify-document')
        .send({
          document: signedDocumentData.signedDocument.document,
          signature: signedDocumentData.signature,
          signaturePayload: signedDocumentData.signedDocument,
          publicKey: rsaKeyPair.publicKey
        })
        .expect(401)
    })

    it('should reject verification with missing fields', async () => {
      const response = await request(app)
        .post('/api/signatures/verify-document')
        .set('Authorization', `Bearer ${token}`)
        .send({
          document: signedDocumentData.signedDocument.document,
          signature: signedDocumentData.signature
        })
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })
  })

  describe('GET /api/signatures/algorithms', () => {
    it('should return available signature algorithms', async () => {
      const response = await request(app)
        .get('/api/signatures/algorithms')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body).toHaveProperty('algorithms')
      expect(Array.isArray(response.body.algorithms)).toBe(true)
      expect(response.body.algorithms.length).toBeGreaterThan(0)
    })

    it('should include RSA-SHA256 algorithm', async () => {
      const response = await request(app)
        .get('/api/signatures/algorithms')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      const algorithms = response.body.algorithms
      const hasRSA = algorithms.some(alg => 
        alg.name === 'RSA-SHA256' || alg.name.includes('RSA')
      )
      expect(hasRSA).toBe(true)
    })

    it('should reject without authentication', async () => {
      await request(app)
        .get('/api/signatures/algorithms')
        .expect(401)
    })
  })

  describe('Signature Security Tests', () => {
    it('should generate different signatures for different data', async () => {
      const response1 = await request(app)
        .post('/api/signatures/sign')
        .set('Authorization', `Bearer ${token}`)
        .send({
          data: 'Message 1',
          privateKey: rsaKeyPair.privateKey
        })

      const response2 = await request(app)
        .post('/api/signatures/sign')
        .set('Authorization', `Bearer ${token}`)
        .send({
          data: 'Message 2',
          privateKey: rsaKeyPair.privateKey
        })

      expect(response1.body.signature).not.toBe(response2.body.signature)
    })

    it('should generate same signature for same data', async () => {
      const data = 'Consistent Message'

      const response1 = await request(app)
        .post('/api/signatures/sign')
        .set('Authorization', `Bearer ${token}`)
        .send({
          data: data,
          privateKey: rsaKeyPair.privateKey
        })

      const response2 = await request(app)
        .post('/api/signatures/sign')
        .set('Authorization', `Bearer ${token}`)
        .send({
          data: data,
          privateKey: rsaKeyPair.privateKey
        })

      expect(response1.body.signature).toBe(response2.body.signature)
    })

    it('should not verify signature with different key pair', async () => {
      // Generate signature with first key
      const signResponse = await request(app)
        .post('/api/signatures/sign')
        .set('Authorization', `Bearer ${token}`)
        .send({
          data: 'Secret Message',
          privateKey: rsaKeyPair.privateKey
        })

      // Generate second key pair
      const crypto = await import('crypto')
      const { publicKey: publicKey2 } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      })

      // Try to verify with different public key
      const verifyResponse = await request(app)
        .post('/api/signatures/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({
          data: 'Secret Message',
          signature: signResponse.body.signature,
          publicKey: publicKey2
        })
        .expect(200)

      expect(verifyResponse.body).toHaveProperty('isValid', false)
    })
  })
})
