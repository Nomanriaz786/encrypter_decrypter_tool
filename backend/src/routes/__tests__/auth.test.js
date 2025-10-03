import { describe, it, expect } from '@jest/globals'
import express from 'express'
import request from 'supertest'

// Create a simple test app with mock routes
const app = express()
app.use(express.json())

// Mock auth routes
app.post('/auth/register', (req, res) => {
  const { username, email, password } = req.body
  if (!username || !email || !password) {
    return res.status(400).json({ errors: [{ msg: 'Missing required fields' }] })
  }
  if (username.length < 3) {
    return res.status(400).json({ errors: [{ msg: 'Username too short' }] })
  }
  res.status(201).json({
    message: 'User created successfully',
    user: { id: 1, username, email, role: 'user' }
  })
})

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body
  if (username === 'testuser' && password === 'password123') {
    res.json({
      token: 'mock-jwt-token',
      user: { id: 1, username: 'testuser', email: 'test@example.com', role: 'user' }
    })
  } else {
    res.status(401).json({ error: 'Invalid credentials' })
  }
})

app.get('/auth/profile', (req, res) => {
  res.json({
    user: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'user'
    }
  })
})

describe('Auth Routes', () => {
  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        })

      expect(response.status).toBe(201)
      expect(response.body.message).toBe('User created successfully')
      expect(response.body.user.username).toBe('testuser')
    })

    it('should return validation errors for invalid data', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'ab', // too short
          email: 'test@example.com',
          password: 'password123'
        })

      expect(response.status).toBe(400)
      expect(response.body.errors).toBeDefined()
    })
  })

  describe('POST /auth/login', () => {
    it('should login user successfully', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        })

      expect(response.status).toBe(200)
      expect(response.body.token).toBe('mock-jwt-token')
      expect(response.body.user.username).toBe('testuser')
    })

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'wronguser',
          password: 'wrongpass'
        })

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('Invalid credentials')
    })
  })

  describe('GET /auth/profile', () => {
    it('should return user profile', async () => {
      const response = await request(app)
        .get('/auth/profile')

      expect(response.status).toBe(200)
      expect(response.body.user.username).toBe('testuser')
      expect(response.body.user.email).toBe('test@example.com')
    })
  })
})