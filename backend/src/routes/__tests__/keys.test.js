import { describe, it, expect } from '@jest/globals'
import express from 'express'
import request from 'supertest'

// Create a test app with mock keys routes
const app = express()
app.use(express.json())

// Mock keys data
let mockKeys = [
  { id: 1, name: 'test-key-1', algorithm: 'AES', status: 'active', userId: 1 },
  { id: 2, name: 'test-key-2', algorithm: 'RSA', status: 'active', userId: 1 }
]

// Mock keys routes
app.get('/keys', (req, res) => {
  const userKeys = mockKeys.filter(key => key.userId === 1)
  res.json({ keys: userKeys })
})

app.get('/keys/:id', (req, res) => {
  const keyId = parseInt(req.params.id)
  const key = mockKeys.find(k => k.id === keyId && k.userId === 1)
  if (!key) {
    return res.status(404).json({ error: 'Key not found' })
  }
  res.json({ key })
})

app.post('/keys', (req, res) => {
  const { name, algorithm, keySize, keyData } = req.body
  if (!name || !algorithm || !keyData) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  if (!['AES', 'RSA'].includes(algorithm)) {
    return res.status(400).json({ error: 'Invalid algorithm' })
  }

  const newKey = {
    id: mockKeys.length + 1,
    name,
    algorithm,
    keySize: keySize || 256,
    status: 'active',
    userId: 1,
    createdAt: new Date()
  }
  mockKeys.push(newKey)

  res.status(201).json({
    message: 'Key saved successfully',
    key: {
      id: newKey.id,
      name: newKey.name,
      algorithm: newKey.algorithm,
      keySize: newKey.keySize,
      status: newKey.status,
      createdAt: newKey.createdAt
    }
  })
})

app.post('/keys/generate', (req, res) => {
  const { name, algorithm, keySize } = req.body
  if (!name || !algorithm) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  let publicKey = null
  if (algorithm === 'AES') {
    // AES key generation mock
  } else if (algorithm === 'RSA') {
    publicKey = 'generated_rsa_public_key_mock'
  }

  const newKey = {
    id: mockKeys.length + 1,
    name,
    algorithm,
    keySize: keySize || 256,
    status: 'active',
    userId: 1,
    createdAt: new Date()
  }
  mockKeys.push(newKey)

  const response = {
    message: 'Key generated and saved successfully',
    key: {
      id: newKey.id,
      name: newKey.name,
      algorithm: newKey.algorithm,
      keySize: newKey.keySize,
      status: newKey.status,
      createdAt: newKey.createdAt
    }
  }

  if (algorithm === 'RSA') {
    response.key.publicKey = publicKey
  }

  res.status(201).json(response)
})

app.put('/keys/:id', (req, res) => {
  const keyId = parseInt(req.params.id)
  const keyIndex = mockKeys.findIndex(k => k.id === keyId && k.userId === 1)
  if (keyIndex === -1) {
    return res.status(404).json({ error: 'Key not found' })
  }

  const { name, expiresAt } = req.body
  if (name) mockKeys[keyIndex].name = name
  if (expiresAt) mockKeys[keyIndex].expiresAt = expiresAt

  res.json({ message: 'Key updated successfully', key: mockKeys[keyIndex] })
})

app.post('/keys/:id/revoke', (req, res) => {
  const keyId = parseInt(req.params.id)
  const keyIndex = mockKeys.findIndex(k => k.id === keyId && k.userId === 1)
  if (keyIndex === -1) {
    return res.status(404).json({ error: 'Key not found' })
  }

  if (mockKeys[keyIndex].status === 'revoked') {
    return res.status(400).json({ error: 'Key is already revoked' })
  }

  mockKeys[keyIndex].status = 'revoked'
  res.json({ message: 'Key revoked successfully' })
})

app.delete('/keys/:id', (req, res) => {
  const keyId = parseInt(req.params.id)
  const keyIndex = mockKeys.findIndex(k => k.id === keyId && k.userId === 1)
  if (keyIndex === -1) {
    return res.status(404).json({ error: 'Key not found' })
  }

  mockKeys.splice(keyIndex, 1)
  res.json({ message: 'Key deleted successfully' })
})

app.get('/keys/:id/export', (req, res) => {
  const keyId = parseInt(req.params.id)
  const key = mockKeys.find(k => k.id === keyId && k.userId === 1)
  if (!key) {
    return res.status(404).json({ error: 'Key not found' })
  }

  if (key.status === 'revoked') {
    return res.status(400).json({ error: 'Cannot export revoked key' })
  }

  const exportData = {
    name: key.name,
    algorithm: key.algorithm,
    keySize: key.keySize,
    keyData: 'exported_key_data_mock',
    exportedAt: new Date().toISOString()
  }

  res.setHeader('Content-Disposition', `attachment; filename="${key.name}.json"`)
  res.setHeader('Content-Type', 'application/json')
  res.json(exportData)
})

describe('Keys Routes', () => {
  beforeEach(() => {
    // Reset mock keys before each test
    mockKeys = [
      { id: 1, name: 'test-key-1', algorithm: 'AES', status: 'active', userId: 1 },
      { id: 2, name: 'test-key-2', algorithm: 'RSA', status: 'active', userId: 1 }
    ]
  })

  describe('GET /keys', () => {
    it('should return all user keys', async () => {
      const response = await request(app)
        .get('/keys')

      expect(response.status).toBe(200)
      expect(response.body.keys).toHaveLength(2)
      expect(response.body.keys[0].name).toBe('test-key-1')
      expect(response.body.keys[1].name).toBe('test-key-2')
    })
  })

  describe('GET /keys/:id', () => {
    it('should return specific key', async () => {
      const response = await request(app)
        .get('/keys/1')

      expect(response.status).toBe(200)
      expect(response.body.key.name).toBe('test-key-1')
      expect(response.body.key.algorithm).toBe('AES')
    })

    it('should return 404 for non-existent key', async () => {
      const response = await request(app)
        .get('/keys/999')

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Key not found')
    })
  })

  describe('POST /keys', () => {
    it('should create and save AES key', async () => {
      const response = await request(app)
        .post('/keys')
        .send({
          name: 'new-aes-key',
          algorithm: 'AES',
          keySize: 256,
          keyData: 'aes_key_data'
        })

      expect(response.status).toBe(201)
      expect(response.body.message).toBe('Key saved successfully')
      expect(response.body.key.name).toBe('new-aes-key')
      expect(response.body.key.algorithm).toBe('AES')
    })

    it('should create and save RSA key', async () => {
      const response = await request(app)
        .post('/keys')
        .send({
          name: 'new-rsa-key',
          algorithm: 'RSA',
          keySize: 2048,
          keyData: 'rsa_private_key_data',
          publicKey: 'rsa_public_key_data'
        })

      expect(response.status).toBe(201)
      expect(response.body.message).toBe('Key saved successfully')
      expect(response.body.key.algorithm).toBe('RSA')
    })

    it('should reject invalid algorithm', async () => {
      const response = await request(app)
        .post('/keys')
        .send({
          name: 'invalid-key',
          algorithm: 'INVALID',
          keyData: 'key_data'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Invalid algorithm')
    })

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/keys')
        .send({
          name: 'incomplete-key'
          // missing algorithm and keyData
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Missing required fields')
    })
  })

  describe('POST /keys/generate', () => {
    it('should generate and save AES key', async () => {
      const response = await request(app)
        .post('/keys/generate')
        .send({
          name: 'generated-aes-key',
          algorithm: 'AES',
          keySize: 256
        })

      expect(response.status).toBe(201)
      expect(response.body.message).toBe('Key generated and saved successfully')
      expect(response.body.key.name).toBe('generated-aes-key')
      expect(response.body.key.algorithm).toBe('AES')
    })

    it('should generate and save RSA key pair', async () => {
      const response = await request(app)
        .post('/keys/generate')
        .send({
          name: 'generated-rsa-key',
          algorithm: 'RSA',
          keySize: 2048
        })

      expect(response.status).toBe(201)
      expect(response.body.message).toBe('Key generated and saved successfully')
      expect(response.body.key.algorithm).toBe('RSA')
      expect(response.body.key.publicKey).toBeDefined()
    })
  })

  describe('PUT /keys/:id', () => {
    it('should update key name', async () => {
      const response = await request(app)
        .put('/keys/1')
        .send({
          name: 'updated-key-name'
        })

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Key updated successfully')
      expect(response.body.key.name).toBe('updated-key-name')
    })

    it('should update key expiration', async () => {
      const expiresAt = new Date().toISOString()
      const response = await request(app)
        .put('/keys/1')
        .send({
          expiresAt
        })

      expect(response.status).toBe(200)
      expect(response.body.key.expiresAt).toBe(expiresAt)
    })

    it('should return 404 for non-existent key', async () => {
      const response = await request(app)
        .put('/keys/999')
        .send({
          name: 'updated-name'
        })

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Key not found')
    })
  })

  describe('POST /keys/:id/revoke', () => {
    it('should revoke active key', async () => {
      const response = await request(app)
        .post('/keys/1/revoke')

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Key revoked successfully')
    })

    it('should reject revoking already revoked key', async () => {
      // First revoke the key
      await request(app).post('/keys/1/revoke')

      // Try to revoke again
      const response = await request(app)
        .post('/keys/1/revoke')

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Key is already revoked')
    })

    it('should return 404 for non-existent key', async () => {
      const response = await request(app)
        .post('/keys/999/revoke')

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Key not found')
    })
  })

  describe('DELETE /keys/:id', () => {
    it('should delete key', async () => {
      const response = await request(app)
        .delete('/keys/1')

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Key deleted successfully')

      // Verify key is deleted
      const getResponse = await request(app).get('/keys/1')
      expect(getResponse.status).toBe(404)
    })

    it('should return 404 for non-existent key', async () => {
      const response = await request(app)
        .delete('/keys/999')

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Key not found')
    })
  })

  describe('GET /keys/:id/export', () => {
    it('should export active key', async () => {
      const response = await request(app)
        .get('/keys/1/export')

      expect(response.status).toBe(200)
      expect(response.body.name).toBe('test-key-1')
      expect(response.body.keyData).toBe('exported_key_data_mock')
      expect(response.headers['content-disposition']).toContain('test-key-1.json')
    })

    it('should reject exporting revoked key', async () => {
      // First revoke the key
      await request(app).post('/keys/1/revoke')

      const response = await request(app)
        .get('/keys/1/export')

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Cannot export revoked key')
    })

    it('should return 404 for non-existent key', async () => {
      const response = await request(app)
        .get('/keys/999/export')

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Key not found')
    })
  })
})