import { describe, it, expect } from '@jest/globals'
import express from 'express'
import request from 'supertest'

// Create a simple test app
const app = express()
app.use(express.json())

// Simple test route
app.post('/test', (req, res) => {
  res.json({ message: 'test successful', data: req.body })
})

describe('Basic Route Test', () => {
  it('should handle basic requests', async () => {
    const response = await request(app)
      .post('/test')
      .send({ test: 'data' })

    expect(response.status).toBe(200)
    expect(response.body.message).toBe('test successful')
  })
})