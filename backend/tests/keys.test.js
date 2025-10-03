import request from 'supertest'
import express from 'express'
import keyRoutes from '../../src/routes/keys.js'
import authRoutes from '../../src/routes/auth.js'
import User from '../../src/models/User.js'
import CryptoKey from '../../src/models/CryptoKey.js'

const app = express()
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/keys', keyRoutes)

describe('Key Management API Tests', () => {
  let token
  let userId

  beforeEach(async () => {
    // Create and login a test user
    const user = await User.create({
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test123!@#'
    })

    userId = user.id

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'Test123!@#'
      })

    token = loginResponse.body.token
  })

  describe('POST /api/keys', () => {
    it('should save a new AES key', async () => {
      const response = await request(app)
        .post('/api/keys')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test AES Key',
          algorithm: 'AES',
          keySize: 256,
          keyData: 'a'.repeat(64)
        })
        .expect(201)

      expect(response.body).toHaveProperty('message', 'Key saved successfully')
      expect(response.body.key).toHaveProperty('name', 'Test AES Key')
      expect(response.body.key).toHaveProperty('algorithm', 'AES')
      expect(response.body.key).toHaveProperty('keySize', 256)
      expect(response.body.key).toHaveProperty('status', 'active')
    })

    it('should save a new RSA key pair', async () => {
      const response = await request(app)
        .post('/api/keys')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test RSA Key',
          algorithm: 'RSA',
          keySize: 2048,
          keyData: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
          publicKey: '-----BEGIN PUBLIC KEY-----\ntest\n-----END PUBLIC KEY-----'
        })
        .expect(201)

      expect(response.body.key).toHaveProperty('name', 'Test RSA Key')
      expect(response.body.key).toHaveProperty('algorithm', 'RSA')
    })

    it('should reject saving key without authentication', async () => {
      await request(app)
        .post('/api/keys')
        .send({
          name: 'Test Key',
          algorithm: 'AES',
          keySize: 256,
          keyData: 'a'.repeat(64)
        })
        .expect(401)
    })

    it('should reject saving key with missing required fields', async () => {
      await request(app)
        .post('/api/keys')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Key'
        })
        .expect(400)
    })
  })

  describe('POST /api/keys/generate', () => {
    it('should generate and save AES key', async () => {
      const response = await request(app)
        .post('/api/keys/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Generated AES Key',
          algorithm: 'AES',
          keySize: 256
        })
        .expect(201)

      expect(response.body.key).toHaveProperty('name', 'Generated AES Key')
      expect(response.body.key).toHaveProperty('algorithm', 'AES')
      expect(response.body.key).toHaveProperty('keySize', 256)
    })

    it('should generate and save RSA key pair', async () => {
      const response = await request(app)
        .post('/api/keys/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Generated RSA Key',
          algorithm: 'RSA',
          keySize: 2048
        })
        .expect(201)

      expect(response.body.key).toHaveProperty('name', 'Generated RSA Key')
      expect(response.body.key).toHaveProperty('algorithm', 'RSA')
    })

    it('should reject generation without authentication', async () => {
      await request(app)
        .post('/api/keys/generate')
        .send({
          name: 'Test Key',
          algorithm: 'AES',
          keySize: 256
        })
        .expect(401)
    })
  })

  describe('GET /api/keys', () => {
    beforeEach(async () => {
      // Create some test keys
      await CryptoKey.create({
        userId: userId,
        name: 'Key 1',
        algorithm: 'AES',
        keySize: 256,
        keyData: 'a'.repeat(64),
        status: 'active'
      })

      await CryptoKey.create({
        userId: userId,
        name: 'Key 2',
        algorithm: 'RSA',
        keySize: 2048,
        keyData: 'test',
        publicKey: 'test',
        status: 'active'
      })
    })

    it('should get all user keys', async () => {
      const response = await request(app)
        .get('/api/keys')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body.keys).toHaveLength(2)
      expect(response.body.keys[0]).toHaveProperty('name')
      expect(response.body.keys[0]).toHaveProperty('algorithm')
    })

    it('should reject getting keys without authentication', async () => {
      await request(app)
        .get('/api/keys')
        .expect(401)
    })
  })

  describe('GET /api/keys/:id', () => {
    let keyId

    beforeEach(async () => {
      const key = await CryptoKey.create({
        userId: userId,
        name: 'Test Key',
        algorithm: 'AES',
        keySize: 256,
        keyData: 'a'.repeat(64),
        status: 'active'
      })

      keyId = key.id
    })

    it('should get specific key by ID', async () => {
      const response = await request(app)
        .get(`/api/keys/${keyId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body.key).toHaveProperty('name', 'Test Key')
      expect(response.body.key).toHaveProperty('algorithm', 'AES')
    })

    it('should reject getting non-existent key', async () => {
      const response = await request(app)
        .get('/api/keys/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .expect(404)

      expect(response.body).toHaveProperty('error', 'Key not found')
    })

    it('should reject getting key without authentication', async () => {
      await request(app)
        .get(`/api/keys/${keyId}`)
        .expect(401)
    })
  })

  describe('PUT /api/keys/:id', () => {
    let keyId

    beforeEach(async () => {
      const key = await CryptoKey.create({
        userId: userId,
        name: 'Test Key',
        algorithm: 'AES',
        keySize: 256,
        keyData: 'a'.repeat(64),
        status: 'active'
      })

      keyId = key.id
    })

    it('should update key name', async () => {
      const response = await request(app)
        .put(`/api/keys/${keyId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Key Name'
        })
        .expect(200)

      expect(response.body.key).toHaveProperty('name', 'Updated Key Name')
    })

    it('should update key expiration', async () => {
      const expiryDate = new Date(Date.now() + 86400000).toISOString()

      const response = await request(app)
        .put(`/api/keys/${keyId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          expiresAt: expiryDate
        })
        .expect(200)

      expect(response.body.key).toHaveProperty('expiresAt')
    })

    it('should reject update without authentication', async () => {
      await request(app)
        .put(`/api/keys/${keyId}`)
        .send({
          name: 'Updated Name'
        })
        .expect(401)
    })
  })

  describe('POST /api/keys/:id/revoke', () => {
    let keyId

    beforeEach(async () => {
      const key = await CryptoKey.create({
        userId: userId,
        name: 'Test Key',
        algorithm: 'AES',
        keySize: 256,
        keyData: 'a'.repeat(64),
        status: 'active'
      })

      keyId = key.id
    })

    it('should revoke a key', async () => {
      const response = await request(app)
        .post(`/api/keys/${keyId}/revoke`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body).toHaveProperty('message', 'Key revoked successfully')
      expect(response.body.key).toHaveProperty('status', 'revoked')
    })

    it('should not revoke already revoked key', async () => {
      // Revoke once
      await request(app)
        .post(`/api/keys/${keyId}/revoke`)
        .set('Authorization', `Bearer ${token}`)

      // Try to revoke again
      const response = await request(app)
        .post(`/api/keys/${keyId}/revoke`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Key is already revoked')
    })

    it('should reject revoke without authentication', async () => {
      await request(app)
        .post(`/api/keys/${keyId}/revoke`)
        .expect(401)
    })
  })

  describe('DELETE /api/keys/:id', () => {
    let keyId

    beforeEach(async () => {
      const key = await CryptoKey.create({
        userId: userId,
        name: 'Test Key',
        algorithm: 'AES',
        keySize: 256,
        keyData: 'a'.repeat(64),
        status: 'active'
      })

      keyId = key.id
    })

    it('should delete a key', async () => {
      const response = await request(app)
        .delete(`/api/keys/${keyId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body).toHaveProperty('message', 'Key deleted successfully')

      // Verify key is deleted
      await request(app)
        .get(`/api/keys/${keyId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
    })

    it('should reject delete without authentication', async () => {
      await request(app)
        .delete(`/api/keys/${keyId}`)
        .expect(401)
    })
  })

  describe('GET /api/keys/:id/export', () => {
    let keyId

    beforeEach(async () => {
      const key = await CryptoKey.create({
        userId: userId,
        name: 'Test Key',
        algorithm: 'AES',
        keySize: 256,
        keyData: 'a'.repeat(64),
        status: 'active'
      })

      keyId = key.id
    })

    it('should export a key', async () => {
      const response = await request(app)
        .get(`/api/keys/${keyId}/export`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body).toHaveProperty('key')
      expect(response.body.key).toHaveProperty('name', 'Test Key')
      expect(response.body.key).toHaveProperty('keyData')
    })

    it('should not export revoked key', async () => {
      // Revoke key first
      await request(app)
        .post(`/api/keys/${keyId}/revoke`)
        .set('Authorization', `Bearer ${token}`)

      const response = await request(app)
        .get(`/api/keys/${keyId}/export`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Cannot export revoked key')
    })

    it('should reject export without authentication', async () => {
      await request(app)
        .get(`/api/keys/${keyId}/export`)
        .expect(401)
    })
  })
})
