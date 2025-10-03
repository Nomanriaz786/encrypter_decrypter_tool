import request from 'supertest'
import express from 'express'
import cryptoRoutes from '../../src/routes/crypto.js'
import authRoutes from '../../src/routes/auth.js'
import User from '../../src/models/User.js'

const app = express()
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/crypto', cryptoRoutes)

describe('Cryptography API Tests', () => {
  let token

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
  })

  describe('POST /api/crypto/encrypt', () => {
    it('should encrypt text with AES-256', async () => {
      const response = await request(app)
        .post('/api/crypto/encrypt')
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: 'Hello World',
          algorithm: 'AES',
          keySize: 256
        })
        .expect(200)

      expect(response.body).toHaveProperty('encryptedData')
      expect(response.body.encryptedData).toHaveProperty('iv')
      expect(response.body.encryptedData).toHaveProperty('encryptedText')
      expect(response.body.encryptedData).toHaveProperty('key')
    })

    it('should encrypt text with AES-128', async () => {
      const response = await request(app)
        .post('/api/crypto/encrypt')
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: 'Hello World',
          algorithm: 'AES',
          keySize: 128
        })
        .expect(200)

      expect(response.body).toHaveProperty('encryptedData')
    })

    it('should encrypt text with RSA', async () => {
      const response = await request(app)
        .post('/api/crypto/encrypt')
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: 'Hello World',
          algorithm: 'RSA',
          keySize: 2048
        })
        .expect(200)

      expect(response.body).toHaveProperty('encryptedData')
      expect(response.body.encryptedData).toHaveProperty('encryptedText')
      expect(response.body.encryptedData).toHaveProperty('privateKey')
      expect(response.body.encryptedData).toHaveProperty('publicKey')
    })

    it('should reject encryption without authentication', async () => {
      const response = await request(app)
        .post('/api/crypto/encrypt')
        .send({
          text: 'Hello World',
          algorithm: 'AES',
          keySize: 256
        })
        .expect(401)

      expect(response.body).toHaveProperty('error', 'Access token required')
    })

    it('should reject encryption with invalid algorithm', async () => {
      await request(app)
        .post('/api/crypto/encrypt')
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: 'Hello World',
          algorithm: 'INVALID',
          keySize: 256
        })
        .expect(400)
    })

    it('should reject encryption with empty text', async () => {
      await request(app)
        .post('/api/crypto/encrypt')
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: '',
          algorithm: 'AES',
          keySize: 256
        })
        .expect(400)
    })
  })

  describe('POST /api/crypto/decrypt', () => {
    let encryptedData

    beforeEach(async () => {
      // Encrypt some data first
      const encryptResponse = await request(app)
        .post('/api/crypto/encrypt')
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: 'Hello World',
          algorithm: 'AES',
          keySize: 256
        })

      encryptedData = encryptResponse.body.encryptedData
    })

    it('should decrypt AES encrypted text', async () => {
      const response = await request(app)
        .post('/api/crypto/decrypt')
        .set('Authorization', `Bearer ${token}`)
        .send({
          encryptedData: encryptedData,
          algorithm: 'AES',
          keySize: 256
        })
        .expect(200)

      expect(response.body).toHaveProperty('decryptedText', 'Hello World')
    })

    it('should reject decryption with wrong key', async () => {
      const wrongData = {
        ...encryptedData,
        key: 'wrong_key_here'
      }

      const response = await request(app)
        .post('/api/crypto/decrypt')
        .set('Authorization', `Bearer ${token}`)
        .send({
          encryptedData: wrongData,
          algorithm: 'AES',
          keySize: 256
        })
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should reject decryption without authentication', async () => {
      await request(app)
        .post('/api/crypto/decrypt')
        .send({
          encryptedData: encryptedData,
          algorithm: 'AES',
          keySize: 256
        })
        .expect(401)
    })
  })

  describe('POST /api/crypto/hash', () => {
    it('should generate MD5 hash', async () => {
      const response = await request(app)
        .post('/api/crypto/hash')
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: 'Hello World',
          algorithm: 'MD5'
        })
        .expect(200)

      expect(response.body).toHaveProperty('hash')
      expect(response.body.hash).toHaveLength(32)
    })

    it('should generate SHA-256 hash', async () => {
      const response = await request(app)
        .post('/api/crypto/hash')
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: 'Hello World',
          algorithm: 'SHA256'
        })
        .expect(200)

      expect(response.body).toHaveProperty('hash')
      expect(response.body.hash).toHaveLength(64)
    })

    it('should generate SHA-512 hash', async () => {
      const response = await request(app)
        .post('/api/crypto/hash')
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: 'Hello World',
          algorithm: 'SHA512'
        })
        .expect(200)

      expect(response.body).toHaveProperty('hash')
      expect(response.body.hash).toHaveLength(128)
    })

    it('should generate same hash for same input', async () => {
      const response1 = await request(app)
        .post('/api/crypto/hash')
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: 'Hello World',
          algorithm: 'SHA256'
        })

      const response2 = await request(app)
        .post('/api/crypto/hash')
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: 'Hello World',
          algorithm: 'SHA256'
        })

      expect(response1.body.hash).toBe(response2.body.hash)
    })

    it('should generate different hash for different input', async () => {
      const response1 = await request(app)
        .post('/api/crypto/hash')
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: 'Hello World',
          algorithm: 'SHA256'
        })

      const response2 = await request(app)
        .post('/api/crypto/hash')
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: 'Goodbye World',
          algorithm: 'SHA256'
        })

      expect(response1.body.hash).not.toBe(response2.body.hash)
    })

    it('should reject hashing without authentication', async () => {
      await request(app)
        .post('/api/crypto/hash')
        .send({
          text: 'Hello World',
          algorithm: 'SHA256'
        })
        .expect(401)
    })
  })

  describe('POST /api/crypto/verify-integrity', () => {
    let hash

    beforeEach(async () => {
      const hashResponse = await request(app)
        .post('/api/crypto/hash')
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: 'Hello World',
          algorithm: 'SHA256'
        })

      hash = hashResponse.body.hash
    })

    it('should verify matching hash', async () => {
      const response = await request(app)
        .post('/api/crypto/verify-integrity')
        .set('Authorization', `Bearer ${token}`)
        .send({
          expectedHash: hash,
          actualData: 'Hello World',
          algorithm: 'SHA256'
        })
        .expect(200)

      expect(response.body).toHaveProperty('isValid', true)
      expect(response.body).toHaveProperty('message', 'Data integrity verified')
    })

    it('should detect tampered data', async () => {
      const response = await request(app)
        .post('/api/crypto/verify-integrity')
        .set('Authorization', `Bearer ${token}`)
        .send({
          expectedHash: hash,
          actualData: 'Tampered Data',
          algorithm: 'SHA256'
        })
        .expect(200)

      expect(response.body).toHaveProperty('isValid', false)
      expect(response.body).toHaveProperty('message', 'Data has been tampered with')
    })

    it('should reject verification without authentication', async () => {
      await request(app)
        .post('/api/crypto/verify-integrity')
        .send({
          expectedHash: hash,
          actualData: 'Hello World',
          algorithm: 'SHA256'
        })
        .expect(401)
    })
  })

  describe('POST /api/crypto/generate-key', () => {
    it('should generate AES-256 key', async () => {
      const response = await request(app)
        .post('/api/crypto/generate-key')
        .set('Authorization', `Bearer ${token}`)
        .send({
          algorithm: 'AES',
          keySize: 256
        })
        .expect(200)

      expect(response.body).toHaveProperty('key')
      expect(response.body.key).toHaveLength(64) // 32 bytes = 64 hex chars
    })

    it('should generate RSA-2048 key pair', async () => {
      const response = await request(app)
        .post('/api/crypto/generate-key')
        .set('Authorization', `Bearer ${token}`)
        .send({
          algorithm: 'RSA',
          keySize: 2048
        })
        .expect(200)

      expect(response.body).toHaveProperty('publicKey')
      expect(response.body).toHaveProperty('privateKey')
      expect(response.body.publicKey).toContain('BEGIN PUBLIC KEY')
      expect(response.body.privateKey).toContain('BEGIN PRIVATE KEY')
    })

    it('should reject key generation without authentication', async () => {
      await request(app)
        .post('/api/crypto/generate-key')
        .send({
          algorithm: 'AES',
          keySize: 256
        })
        .expect(401)
    })
  })
})
