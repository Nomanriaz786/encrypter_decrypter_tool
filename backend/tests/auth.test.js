import request from 'supertest'
import express from 'express'
import authRoutes from '../../src/routes/auth.js'
import User from '../../src/models/User.js'

const app = express()
app.use(express.json())
app.use('/api/auth', authRoutes)

describe('Authentication API Tests', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'Test123!@#'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body).toHaveProperty('message', 'User created successfully')
      expect(response.body.user).toHaveProperty('username', 'johndoe')
      expect(response.body.user).toHaveProperty('email', 'john@example.com')
      expect(response.body.user).not.toHaveProperty('password')
    })

    it('should reject registration with duplicate username', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'Test123!@#'
      }

      // Create first user
      await request(app).post('/api/auth/register').send(userData)

      // Try to create duplicate
      await request(app)
        .post('/api/auth/register')
        .send({ ...userData, email: 'different@example.com' })
        .expect(500)
    })

    it('should reject registration with invalid email', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'invalid-email',
        password: 'Test123!@#'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body).toHaveProperty('errors')
    })

    it('should reject registration with short password', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: '12345'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body).toHaveProperty('errors')
    })

    it('should reject registration with short username', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'jo',
        email: 'john@example.com',
        password: 'Test123!@#'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body).toHaveProperty('errors')
    })
  })

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await User.create({
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!@#'
      })
    })

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'Test123!@#'
        })
        .expect(200)

      expect(response.body).toHaveProperty('token')
      expect(response.body).toHaveProperty('user')
      expect(response.body.user).toHaveProperty('username', 'testuser')
    })

    it('should reject login with invalid username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'wronguser',
          password: 'Test123!@#'
        })
        .expect(401)

      expect(response.body).toHaveProperty('error', 'Invalid credentials')
    })

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        })
        .expect(401)

      expect(response.body).toHaveProperty('error', 'Invalid credentials')
    })

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400)

      expect(response.body).toHaveProperty('errors')
    })
  })

  describe('POST /api/auth/2fa/setup', () => {
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

    it('should setup 2FA for authenticated user', async () => {
      const response = await request(app)
        .post('/api/auth/2fa/setup')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body).toHaveProperty('secret')
      expect(response.body).toHaveProperty('qrCode')
      expect(response.body).toHaveProperty('manualEntryKey')
    })

    it('should reject 2FA setup without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/2fa/setup')
        .expect(401)

      expect(response.body).toHaveProperty('error', 'Access token required')
    })
  })

  describe('GET /api/auth/profile', () => {
    let token

    beforeEach(async () => {
      // Create and login a test user
      await User.create({
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!@#',
        phoneNumber: '+1234567890',
        department: 'Engineering'
      })

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'Test123!@#'
        })

      token = loginResponse.body.token
    })

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body).toHaveProperty('user')
      expect(response.body.user).toHaveProperty('username', 'testuser')
      expect(response.body.user).toHaveProperty('email', 'test@example.com')
      expect(response.body.user).toHaveProperty('firstName', 'Test')
      expect(response.body.user).toHaveProperty('lastName', 'User')
      expect(response.body.user).not.toHaveProperty('password')
    })

    it('should reject profile request without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401)

      expect(response.body).toHaveProperty('error', 'Access token required')
    })

    it('should reject profile request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid_token')
        .expect(403)

      expect(response.body).toHaveProperty('error', 'Invalid token')
    })
  })

  describe('PUT /api/auth/profile', () => {
    let token

    beforeEach(async () => {
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

    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phoneNumber: '+9876543210',
        department: 'Marketing'
      }

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200)

      expect(response.body.user).toHaveProperty('firstName', 'Updated')
      expect(response.body.user).toHaveProperty('lastName', 'Name')
      expect(response.body.user).toHaveProperty('phoneNumber', '+9876543210')
      expect(response.body.user).toHaveProperty('department', 'Marketing')
    })

    it('should reject profile update without authentication', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({ firstName: 'Updated' })
        .expect(401)

      expect(response.body).toHaveProperty('error', 'Access token required')
    })
  })

  describe('PUT /api/auth/profile/password', () => {
    let token

    beforeEach(async () => {
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

    it('should change password with valid current password', async () => {
      const response = await request(app)
        .put('/api/auth/profile/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'Test123!@#',
          newPassword: 'NewTest123!@#'
        })
        .expect(200)

      expect(response.body).toHaveProperty('message', 'Password changed successfully')

      // Try logging in with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'NewTest123!@#'
        })
        .expect(200)

      expect(loginResponse.body).toHaveProperty('token')
    })

    it('should reject password change with wrong current password', async () => {
      const response = await request(app)
        .put('/api/auth/profile/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'WrongPassword',
          newPassword: 'NewTest123!@#'
        })
        .expect(401)

      expect(response.body).toHaveProperty('error', 'Current password is incorrect')
    })

    it('should reject password change with short new password', async () => {
      const response = await request(app)
        .put('/api/auth/profile/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'Test123!@#',
          newPassword: '123'
        })
        .expect(400)

      expect(response.body).toHaveProperty('errors')
    })
  })
})
