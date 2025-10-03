import { describe, it, expect } from '@jest/globals'
import SystemSettings from '../SystemSettings.js'

describe('SystemSettings Model', () => {
  describe('Model Definition', () => {
    it('should have correct fields', () => {
      const attributes = SystemSettings.rawAttributes

      expect(attributes.id).toBeDefined()
      expect(attributes.maxFileSize).toBeDefined()
      expect(attributes.allowedFileTypes).toBeDefined()
      expect(attributes.sessionTimeout).toBeDefined()
      expect(attributes.maxFailedLogins).toBeDefined()
      expect(attributes.passwordComplexity).toBeDefined()
      expect(attributes.encryptionDefaults).toBeDefined()
      expect(attributes.auditLogRetention).toBeDefined()
      expect(attributes.maintenanceMode).toBeDefined()
      expect(attributes.systemVersion).toBeDefined()
    })

    it('should have correct field types', () => {
      const attributes = SystemSettings.rawAttributes

      expect(attributes.id.type.constructor.name).toBe('UUID')
      expect(attributes.maxFileSize.type.constructor.name).toBe('INTEGER')
      expect(attributes.allowedFileTypes.type.constructor.name).toBe('JSONTYPE')
      expect(attributes.sessionTimeout.type.constructor.name).toBe('INTEGER')
      expect(attributes.maxFailedLogins.type.constructor.name).toBe('INTEGER')
      expect(attributes.passwordComplexity.type.constructor.name).toBe('JSONTYPE')
      expect(attributes.encryptionDefaults.type.constructor.name).toBe('JSONTYPE')
      expect(attributes.auditLogRetention.type.constructor.name).toBe('INTEGER')
      expect(attributes.maintenanceMode.type.constructor.name).toBe('BOOLEAN')
      expect(attributes.systemVersion.type.constructor.name).toBe('STRING')
    })

    it('should have correct primary key', () => {
      const attributes = SystemSettings.rawAttributes

      expect(attributes.id.primaryKey).toBe(true)
    })

    it('should have correct default values', () => {
      const attributes = SystemSettings.rawAttributes

      expect(attributes.id.defaultValue).toBeDefined() // UUIDV4
      expect(attributes.maxFileSize.defaultValue).toBe(100)
      expect(attributes.allowedFileTypes.defaultValue).toEqual(['.txt', '.pdf', '.doc', '.docx', '.jpg', '.png'])
      expect(attributes.sessionTimeout.defaultValue).toBe(30)
      expect(attributes.maxFailedLogins.defaultValue).toBe(5)
      expect(attributes.passwordComplexity.defaultValue).toEqual({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      })
      expect(attributes.encryptionDefaults.defaultValue).toEqual({
        algorithm: 'AES',
        keySize: 256
      })
      expect(attributes.auditLogRetention.defaultValue).toBe(90)
      expect(attributes.maintenanceMode.defaultValue).toBe(false)
      expect(attributes.systemVersion.defaultValue).toBe('1.0.0')
    })
  })

  describe('Field Validations', () => {
    it('should require maxFileSize field', () => {
      const attributes = SystemSettings.rawAttributes
      expect(attributes.maxFileSize.allowNull).toBe(false)
    })

    it('should require allowedFileTypes field', () => {
      const attributes = SystemSettings.rawAttributes
      expect(attributes.allowedFileTypes.allowNull).toBe(false)
    })

    it('should require sessionTimeout field', () => {
      const attributes = SystemSettings.rawAttributes
      expect(attributes.sessionTimeout.allowNull).toBe(false)
    })

    it('should require maxFailedLogins field', () => {
      const attributes = SystemSettings.rawAttributes
      expect(attributes.maxFailedLogins.allowNull).toBe(false)
    })

    it('should require passwordComplexity field', () => {
      const attributes = SystemSettings.rawAttributes
      expect(attributes.passwordComplexity.allowNull).toBe(false)
    })

    it('should require encryptionDefaults field', () => {
      const attributes = SystemSettings.rawAttributes
      expect(attributes.encryptionDefaults.allowNull).toBe(false)
    })

    it('should require auditLogRetention field', () => {
      const attributes = SystemSettings.rawAttributes
      expect(attributes.auditLogRetention.allowNull).toBe(false)
    })
  })

  describe('Default Values Validation', () => {
    it('should have sensible default for maxFileSize (100MB)', () => {
      const attributes = SystemSettings.rawAttributes
      expect(attributes.maxFileSize.defaultValue).toBe(100)
    })

    it('should have common file extensions as default for allowedFileTypes', () => {
      const attributes = SystemSettings.rawAttributes
      const defaults = attributes.allowedFileTypes.defaultValue
      expect(defaults).toContain('.txt')
      expect(defaults).toContain('.pdf')
      expect(defaults).toContain('.jpg')
      expect(defaults).toContain('.png')
    })

    it('should have reasonable session timeout (30 minutes)', () => {
      const attributes = SystemSettings.rawAttributes
      expect(attributes.sessionTimeout.defaultValue).toBe(30)
    })

    it('should have secure default for max failed logins (5)', () => {
      const attributes = SystemSettings.rawAttributes
      expect(attributes.maxFailedLogins.defaultValue).toBe(5)
    })

    it('should have strong password complexity defaults', () => {
      const attributes = SystemSettings.rawAttributes
      const complexity = attributes.passwordComplexity.defaultValue
      expect(complexity.minLength).toBe(8)
      expect(complexity.requireUppercase).toBe(true)
      expect(complexity.requireLowercase).toBe(true)
      expect(complexity.requireNumbers).toBe(true)
      expect(complexity.requireSpecialChars).toBe(true)
    })

    it('should default to AES-256 encryption', () => {
      const attributes = SystemSettings.rawAttributes
      const encryption = attributes.encryptionDefaults.defaultValue
      expect(encryption.algorithm).toBe('AES')
      expect(encryption.keySize).toBe(256)
    })

    it('should have reasonable audit log retention (90 days)', () => {
      const attributes = SystemSettings.rawAttributes
      expect(attributes.auditLogRetention.defaultValue).toBe(90)
    })

    it('should default maintenance mode to false', () => {
      const attributes = SystemSettings.rawAttributes
      expect(attributes.maintenanceMode.defaultValue).toBe(false)
    })

    it('should have initial system version', () => {
      const attributes = SystemSettings.rawAttributes
      expect(attributes.systemVersion.defaultValue).toBe('1.0.0')
    })
  })

  describe('Model Configuration', () => {
    it('should have correct model name', () => {
      expect(SystemSettings.name).toBe('SystemSettings')
    })

    it('should be a valid Sequelize model', () => {
      expect(SystemSettings).toBeDefined()
      expect(typeof SystemSettings).toBe('function')
      expect(SystemSettings.rawAttributes).toBeDefined()
    })
  })
})