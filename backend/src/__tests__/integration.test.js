import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import request from 'supertest'
import app from '../server.js'
import { sequelize } from '../config/database.js'
import User from '../models/User.js'
import CryptoKey from '../models/CryptoKey.js'
import AuditLog from '../models/AuditLog.js'
import EncryptionSession from '../models/EncryptionSession.js'

describe('Integration Tests - End-to-End Workflows', () => {
  let testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'TestPass123!',
    role: 'user'
  }

  let authToken = ''
  let testKeyId = ''

  beforeAll(async () => {
    // Ensure database is connected
    await sequelize.authenticate()
  })

  afterAll(async () => {
    // Clean up and close database connection
    await sequelize.close()
  })

  beforeEach(async () => {
    // Clean up test data before each test
    await EncryptionSession.destroy({ where: {} })
    await AuditLog.destroy({ where: {} })
    await CryptoKey.destroy({ where: {} })
    await User.destroy({ where: {} })
  })

  describe('User Registration and Authentication Flow', () => {
    it('should complete full user registration and login workflow', async () => {
      // 1. Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201)

      expect(registerResponse.body.message).toContain('User created successfully')
      expect(registerResponse.body.user).toBeDefined()
      expect(registerResponse.body.user.username).toBe(testUser.username)

      // 2. Login user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        })
        .expect(200)

      expect(loginResponse.body.token).toBeDefined()
      expect(loginResponse.body.user).toBeDefined()
      expect(loginResponse.body.user.username).toBe(testUser.username)

      authToken = loginResponse.body.token

      // 3. Verify user can access protected route
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(profileResponse.body.user.username).toBe(testUser.username)
    })

    it('should handle authentication failures correctly', async () => {
      // Test invalid credentials
      const invalidLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'wrongpass'
        })
        .expect(401)

      expect(invalidLoginResponse.body.error).toContain('Invalid credentials')

      // Test accessing protected route without token
      const noTokenResponse = await request(app)
        .get('/api/auth/profile')
        .expect(401)

      expect(noTokenResponse.body.error).toContain('Access token required')
    })
  })

  describe('Key Management Workflow', () => {
    beforeEach(async () => {
      // Register and login user for authenticated tests
      await request(app)
        .post('/api/auth/register')
        .send(testUser)

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        })

      authToken = loginResponse.body.token
    })

    it('should complete full key lifecycle: create, list, use, and revoke', async () => {
      // 1. Create AES key
      const createKeyResponse = await request(app)
        .post('/api/keys/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test AES Key',
          algorithm: 'AES',
          keySize: 256
        })
        .expect(201)

      expect(createKeyResponse.body.message).toContain('Key generated and saved successfully')
      expect(createKeyResponse.body.key).toBeDefined()
      expect(createKeyResponse.body.key.name).toBe('Test AES Key')
      expect(createKeyResponse.body.key.algorithm).toBe('AES')

      testKeyId = createKeyResponse.body.key.id

      // 2. List user keys
      const listKeysResponse = await request(app)
        .get('/api/keys')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(listKeysResponse.body.keys).toBeDefined()
      expect(Array.isArray(listKeysResponse.body.keys)).toBe(true)
      expect(listKeysResponse.body.keys.length).toBeGreaterThan(0)
      expect(listKeysResponse.body.keys[0].name).toBe('Test AES Key')

      // 3. Get specific key details
      const getKeyResponse = await request(app)
        .get(`/api/keys/${testKeyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(getKeyResponse.body.key.id).toBe(testKeyId)
      expect(getKeyResponse.body.key.status).toBe('active')

      // 4. Revoke key
      const revokeKeyResponse = await request(app)
        .post(`/api/keys/${testKeyId}/revoke`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(revokeKeyResponse.body.message).toContain('Key revoked successfully')

      // 5. Verify key is revoked
      const getRevokedKeyResponse = await request(app)
        .get(`/api/keys/${testKeyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(getRevokedKeyResponse.body.key.status).toBe('revoked')
    })

    it('should handle key access control correctly', async () => {
      // Create key with first user
      const createKeyResponse = await request(app)
        .post('/api/keys/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Private Key',
          algorithm: 'AES',
          keySize: 256
        })
        .expect(201)

      const privateKeyId = createKeyResponse.body.key.id

      // Create second user
      const secondUser = {
        username: 'seconduser',
        email: 'second@example.com',
        password: 'TestPass123!'
      }

      await request(app)
        .post('/api/auth/register')
        .send(secondUser)

      const secondLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: secondUser.username,
          password: secondUser.password
        })

      const secondUserToken = secondLoginResponse.body.token

      // Second user should not be able to access first user's key
      const accessOtherKeyResponse = await request(app)
        .get(`/api/keys/${privateKeyId}`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .expect(404)

      expect(accessOtherKeyResponse.body.error).toContain('Key not found')
    })
  })

  describe('Encryption/Decryption Workflow', () => {
    beforeEach(async () => {
      // Register and login user
      await request(app)
        .post('/api/auth/register')
        .send(testUser)

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        })

      authToken = loginResponse.body.token
    })

    it('should complete full encryption and decryption cycle', async () => {
      const testData = 'This is a secret message that needs encryption!'

      // 1. Generate AES key
      const generateKeyResponse = await request(app)
        .post('/api/crypto/generate-key')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          algorithm: 'AES',
          keySize: 256
        })
        .expect(200)

      expect(generateKeyResponse.body.success).toBe(true)
      expect(generateKeyResponse.body.keyData.key).toBeDefined()
      const aesKey = generateKeyResponse.body.keyData.key

      // 2. Encrypt data
      const encryptResponse = await request(app)
        .post('/api/crypto/encrypt')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: testData,
          algorithm: 'AES',
          keySize: 256,
          key: aesKey
        })
        .expect(200)

      expect(encryptResponse.body.success).toBe(true)
      expect(encryptResponse.body.result.encrypted).toBeDefined()
      expect(encryptResponse.body.result.encrypted).not.toBe(testData)

      const encryptedData = encryptResponse.body.result
      console.log('Encrypted data object:', encryptedData) // Debug log

      // 3. Decrypt data
      const decryptResponse = await request(app)
        .post('/api/crypto/decrypt')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          encryptedData: encryptedData,
          algorithm: 'AES',
          keySize: 256,
          key: aesKey
        })
        .expect(200)

      expect(decryptResponse.body.success).toBe(true)
      expect(decryptResponse.body.decrypted).toBe(testData)
    })

    it('should handle encryption errors gracefully', async () => {
      // Test encryption with missing key
      const missingKeyResponse = await request(app)
        .post('/api/crypto/encrypt')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'test data',
          algorithm: 'AES',
          keySize: 256
          // missing key
        })
        .expect(400)

      expect(missingKeyResponse.body.error).toContain('AES key is required')
    })
  })

  describe('File Integrity and Hashing Workflow', () => {
    beforeEach(async () => {
      // Register and login user
      await request(app)
        .post('/api/auth/register')
        .send(testUser)

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        })

      authToken = loginResponse.body.token
    })

    it('should generate and verify file hashes correctly', async () => {
      const testContent = 'This is test file content for hashing'

      // 1. Generate MD5 hash
      const md5Response = await request(app)
        .post('/api/crypto/hash')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: testContent,
          algorithm: 'md5'
        })
        .expect(200)

      expect(md5Response.body.success).toBe(true)
      expect(md5Response.body.hash).toBeDefined()
      expect(md5Response.body.algorithm).toBe('md5')

      // 2. Generate SHA-256 hash
      const sha256Response = await request(app)
        .post('/api/crypto/hash')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: testContent,
          algorithm: 'sha256'
        })
        .expect(200)

      expect(sha256Response.body.success).toBe(true)
      expect(sha256Response.body.hash).toBeDefined()
      expect(sha256Response.body.algorithm).toBe('sha256')

      // 3. Verify file integrity (same content should produce same hash)
      const verifyResponse = await request(app)
        .post('/api/crypto/verify-integrity')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          expectedHash: md5Response.body.hash,
          actualData: testContent,
          algorithm: 'md5'
        })
        .expect(200)

      expect(verifyResponse.body.success).toBe(true)
      expect(verifyResponse.body.isValid).toBe(true)

      // 4. Verify with different content should fail
      const invalidVerifyResponse = await request(app)
        .post('/api/crypto/verify-integrity')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          expectedHash: md5Response.body.hash,
          actualData: 'Different content',
          algorithm: 'md5'
        })
        .expect(200)

      expect(invalidVerifyResponse.body.success).toBe(true)
      expect(invalidVerifyResponse.body.isValid).toBe(false)
    })
  })

  describe('Digital Signatures Workflow', () => {
    beforeEach(async () => {
      // Register and login user
      await request(app)
        .post('/api/auth/register')
        .send(testUser)

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        })

      authToken = loginResponse.body.token
    })

    it('should complete digital signature creation and verification', async () => {
      const testData = 'Document content to be signed'

      // 1. Generate RSA key pair for signing
      const generateKeyResponse = await request(app)
        .post('/api/crypto/generate-key')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          algorithm: 'RSA',
          keySize: 2048
        })
        .expect(200)

      expect(generateKeyResponse.body.success).toBe(true)
      const privateKey = generateKeyResponse.body.keyData.privateKey
      const publicKey = generateKeyResponse.body.keyData.publicKey

      // 2. Generate digital signature
      const signResponse = await request(app)
        .post('/api/signatures/sign')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: testData,
          privateKey: privateKey
        })
        .expect(200)

      expect(signResponse.body.success).toBe(true)
      expect(signResponse.body.signature).toBeDefined()
      expect(signResponse.body.algorithm).toBe('RSA-SHA256')

      const signature = signResponse.body.signature

      // 3. Verify digital signature
      const verifyResponse = await request(app)
        .post('/api/signatures/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: testData,
          signature: signature,
          publicKey: publicKey
        })
        .expect(200)

      expect(verifyResponse.body.success).toBe(true)
      expect(verifyResponse.body.isValid).toBe(true)

      // 4. Verify with tampered data should fail
      const tamperedVerifyResponse = await request(app)
        .post('/api/signatures/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: 'Tampered document content',
          signature: signature,
          publicKey: publicKey
        })
        .expect(200)

      expect(tamperedVerifyResponse.body.success).toBe(true)
      expect(tamperedVerifyResponse.body.isValid).toBe(false)
    })
  })

  describe.skip('Admin Dashboard Workflow', () => {
    beforeEach(async () => {
      // Create admin user
      const adminUser = {
        username: 'admin',
        email: 'admin@example.com',
        password: 'AdminPass123!',
        role: 'admin'
      }

      await request(app)
        .post('/api/auth/register')
        .send(adminUser)

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: adminUser.username,
          password: adminUser.password
        })

      authToken = loginResponse.body.token
    })

    it('should provide admin dashboard statistics', async () => {
      // Get dashboard stats
      const dashboardResponse = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(dashboardResponse.body.totalUsers).toBeDefined()
      expect(dashboardResponse.body.activeUsers).toBeDefined()
      expect(dashboardResponse.body.totalKeys).toBeDefined()
      expect(dashboardResponse.body.activeKeys).toBeDefined()
      expect(dashboardResponse.body.encryptionOperations).toBeDefined()
    })

    it('should allow admin to view all audit logs', async () => {
      const auditResponse = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(auditResponse.body.auditLogs).toBeDefined()
      expect(Array.isArray(auditResponse.body.auditLogs)).toBe(true)
    })
  })
})