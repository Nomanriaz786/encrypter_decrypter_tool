import express from 'express'
import jwt from 'jsonwebtoken'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { body, validationResult } from 'express-validator'
import User from '../models/User.js'
import AuditLog from '../models/AuditLog.js'
import { authenticateToken } from '../middleware/auth.js'
import { profileUpload, deleteOldProfilePicture } from '../config/upload.js'

const router = express.Router()

// Register
router.post('/register', [
  body('username').isLength({ min: 3, max: 50 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { username, email, password } = req.body

    const user = await User.create({
      username,
      email,
      password
    })

    // Log registration
    await AuditLog.create({
      userId: user.id,
      action: 'register',
      resource: 'user',
      resourceId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    next(error)
  }
})

// Login
router.post('/login', [
  body('username').notEmpty(),
  body('password').notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { username, password, totpCode } = req.body

    const user = await User.findOne({ where: { username } })
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const isValidPassword = await user.comparePassword(password)
    if (!isValidPassword) {
      // Log failed login attempt
      await AuditLog.create({
        userId: user.id,
        action: 'login_failed',
        resource: 'authentication',
        resourceId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        details: 'Invalid password'
      })
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Only check 2FA if the user has explicitly enabled it
    if (user.twoFactorEnabled) {
      if (!totpCode) {
        return res.status(200).json({ 
          require2FA: true,
          message: 'Two-factor authentication required'
        })
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: totpCode,
        window: 2 // Allow some time drift
      })

      if (!verified) {
        // Log failed 2FA attempt
        await AuditLog.create({
          userId: user.id,
          action: 'login_failed',
          resource: 'authentication',
          resourceId: user.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          details: 'Invalid 2FA code'
        })
        return res.status(401).json({ error: 'Invalid 2FA code' })
      }
    }

    // Update last login
    await user.update({ lastLogin: new Date() })

    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    // Log login
    await AuditLog.create({
      userId: user.id,
      action: 'login',
      resource: 'user',
      resourceId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled
      }
    })
  } catch (error) {
    next(error)
  }
})

// Setup 2FA
router.post('/2fa/setup', authenticateToken, async (req, res, next) => {
  try {
    const user = req.user

    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA already enabled' })
    }

    const secret = speakeasy.generateSecret({
      name: `${process.env.APP_NAME} (${user.username})`,
      issuer: process.env.ISSUER
    })

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url)

    // Store secret temporarily (in production, use redis or similar)
    await user.update({ twoFactorSecret: secret.base32 })

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    })
  } catch (error) {
    next(error)
  }
})

// Verify and enable 2FA
router.post('/2fa/verify', authenticateToken, [
  body('token').isLength({ min: 6, max: 6 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { token } = req.body
    
    // Fetch user with twoFactorSecret (not excluded)
    const user = await User.findByPk(req.user.id)

    if (!user.twoFactorSecret) {
      return res.status(400).json({ error: '2FA not set up' })
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2
    })

    if (!verified) {
      return res.status(400).json({ error: 'Invalid 2FA code' })
    }

    await user.update({ twoFactorEnabled: true })

    // Log 2FA setup
    await AuditLog.create({
      userId: user.id,
      action: 'enable_2fa',
      resource: 'user',
      resourceId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.json({ message: '2FA enabled successfully' })
  } catch (error) {
    next(error)
  }
})

// Disable 2FA
router.post('/2fa/disable', authenticateToken, [
  body('password').notEmpty(),
  body('token').isLength({ min: 6, max: 6 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { password, token } = req.body
    
    // Fetch user with twoFactorSecret (not excluded)
    const user = await User.findByPk(req.user.id)

    // Verify password
    const isValidPassword = await user.comparePassword(password)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' })
    }

    // Verify 2FA token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2
    })

    if (!verified) {
      return res.status(400).json({ error: 'Invalid 2FA code' })
    }

    await user.update({
      twoFactorEnabled: false,
      twoFactorSecret: null
    })

    // Log 2FA disable
    await AuditLog.create({
      userId: user.id,
      action: 'disable_2fa',
      resource: 'user',
      resourceId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.json({ message: '2FA disabled successfully' })
  } catch (error) {
    next(error)
  }
})

// Get user profile
router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      phoneNumber: req.user.phoneNumber,
      department: req.user.department,
      profilePicture: req.user.profilePicture,
      role: req.user.role,
      twoFactorEnabled: req.user.twoFactorEnabled,
      lastLogin: req.user.lastLogin,
      preferences: req.user.preferences
    }
  })
})

// Update user profile
router.put('/profile', authenticateToken, [
  body('firstName').optional().isLength({ min: 1, max: 50 }).trim(),
  body('lastName').optional().isLength({ min: 1, max: 50 }).trim(),
  body('phoneNumber').optional().isMobilePhone(),
  body('department').optional().isLength({ min: 1, max: 100 }).trim()
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { firstName, lastName, phoneNumber, department } = req.body
    const user = await User.findByPk(req.user.id)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    await user.update({
      firstName: firstName !== undefined ? firstName : user.firstName,
      lastName: lastName !== undefined ? lastName : user.lastName,
      phoneNumber: phoneNumber !== undefined ? phoneNumber : user.phoneNumber,
      department: department !== undefined ? department : user.department
    })

    // Log profile update
    await AuditLog.create({
      userId: req.user.id,
      action: 'update_profile',
      resource: 'user',
      details: { updatedFields: Object.keys(req.body) },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        department: user.department,
        profilePicture: user.profilePicture,
        role: user.role
      }
    })
  } catch (error) {
    next(error)
  }
})

// Update profile picture
router.post('/profile/picture', authenticateToken, profileUpload.single('profilePicture'), async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Delete old profile picture if exists
    if (user.profilePicture) {
      deleteOldProfilePicture(user.profilePicture)
    }

    // Store only the filename, not the full path
    const filename = req.file.filename
    await user.update({ profilePicture: filename })

    // Log profile picture update
    await AuditLog.create({
      userId: req.user.id,
      action: 'update_profile_picture',
      resource: 'user',
      details: { filename, fileSize: req.file.size },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.json({
      message: 'Profile picture updated successfully',
      profilePicture: filename
    })
  } catch (error) {
    // Clean up uploaded file if there's an error
    if (req.file) {
      deleteOldProfilePicture(req.file.filename)
    }
    next(error)
  }
})

// Delete profile picture
router.delete('/profile/picture', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Delete the file if exists
    if (user.profilePicture) {
      deleteOldProfilePicture(user.profilePicture)
      await user.update({ profilePicture: null })
    }

    // Log profile picture deletion
    await AuditLog.create({
      userId: req.user.id,
      action: 'delete_profile_picture',
      resource: 'user',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.json({ message: 'Profile picture deleted successfully' })
  } catch (error) {
    next(error)
  }
})

// Change password
router.put('/profile/password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { currentPassword, newPassword } = req.body
    const user = await User.findByPk(req.user.id)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword)
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' })
    }

    // Update password
    await user.update({ password: newPassword })

    // Log password change
    await AuditLog.create({
      userId: req.user.id,
      action: 'change_password',
      resource: 'user',
      details: { success: true },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    next(error)
  }
})

export default router