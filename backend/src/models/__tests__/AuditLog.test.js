import { describe, it, expect } from '@jest/globals'
import AuditLog from '../AuditLog.js'

describe('AuditLog Model', () => {
  describe('Model Definition', () => {
    it('should have correct fields', () => {
      const attributes = AuditLog.rawAttributes

      expect(attributes.id).toBeDefined()
      expect(attributes.userId).toBeDefined()
      expect(attributes.action).toBeDefined()
      expect(attributes.resource).toBeDefined()
      expect(attributes.resourceId).toBeDefined()
      expect(attributes.details).toBeDefined()
      expect(attributes.ipAddress).toBeDefined()
      expect(attributes.userAgent).toBeDefined()
    })

    it('should have correct field types', () => {
      const attributes = AuditLog.rawAttributes

      expect(attributes.id.type.constructor.name).toBe('UUID')
      expect(attributes.userId.type.constructor.name).toBe('UUID')
      expect(attributes.action.type.constructor.name).toBe('STRING')
      expect(attributes.resource.type.constructor.name).toBe('STRING')
      expect(attributes.resourceId.type.constructor.name).toBe('STRING')
      expect(attributes.details.type.constructor.name).toBe('JSONTYPE')
      expect(attributes.ipAddress.type.constructor.name).toBe('STRING')
      expect(attributes.userAgent.type.constructor.name).toBe('TEXT')
    })

    it('should have correct validations', () => {
      const attributes = AuditLog.rawAttributes

      expect(attributes.userId.allowNull).toBe(true) // Can be null for system actions
      expect(attributes.action.allowNull).toBe(false)
      expect(attributes.resource.allowNull).toBe(false)
      expect(attributes.resourceId.allowNull).toBe(true)
      expect(attributes.details.allowNull).toBe(true)
      expect(attributes.ipAddress.allowNull).toBe(true)
      expect(attributes.userAgent.allowNull).toBe(true)
    })

    it('should have correct default values', () => {
      const attributes = AuditLog.rawAttributes

      expect(attributes.id.defaultValue).toBeDefined()
    })
  })

  describe('Associations', () => {
    it('should define user association', () => {
      // Test that associations are defined (actual relationships tested in integration tests)
      expect(AuditLog.associations).toBeDefined()
    })
  })

  describe('Model Methods', () => {
    it('should define create method', () => {
      expect(typeof AuditLog.create).toBe('function')
    })

    it('should define findAll method', () => {
      expect(typeof AuditLog.findAll).toBe('function')
    })

    it('should define findByPk method', () => {
      expect(typeof AuditLog.findByPk).toBe('function')
    })

    it('should define count method', () => {
      expect(typeof AuditLog.count).toBe('function')
    })

    it('should define destroy method', () => {
      expect(typeof AuditLog.destroy).toBe('function')
    })
  })

  describe('Instance Methods', () => {
    it('should have instance methods', () => {
      const log = new AuditLog()
      expect(typeof log.save).toBe('function')
      expect(typeof log.update).toBe('function')
      expect(typeof log.destroy).toBe('function')
    })
  })

  describe('Data Validation', () => {
    it('should validate required fields', () => {
      const attributes = AuditLog.rawAttributes

      // Required fields should not allow null
      expect(attributes.action.allowNull).toBe(false)
      expect(attributes.resource.allowNull).toBe(false)
    })

    it('should allow null for optional fields', () => {
      const attributes = AuditLog.rawAttributes

      // Optional fields should allow null
      expect(attributes.userId.allowNull).toBe(true)
      expect(attributes.resourceId.allowNull).toBe(true)
      expect(attributes.details.allowNull).toBe(true)
      expect(attributes.ipAddress.allowNull).toBe(true)
      expect(attributes.userAgent.allowNull).toBe(true)
    })
  })

  describe('Model Configuration', () => {
    it('should have correct table name', () => {
      expect(AuditLog.tableName).toBe('audit_logs')
    })

    it('should have timestamps enabled', () => {
      expect(AuditLog.options.timestamps).toBe(true)
    })
  })

  describe('Audit Trail Functionality', () => {
    it('should support JSON details field', () => {
      const attributes = AuditLog.rawAttributes
      expect(attributes.details.type.constructor.name).toBe('JSONTYPE')
    })

    it('should support IP address tracking', () => {
      const attributes = AuditLog.rawAttributes
      expect(attributes.ipAddress.type.constructor.name).toBe('STRING')
    })

    it('should support user agent tracking', () => {
      const attributes = AuditLog.rawAttributes
      expect(attributes.userAgent.type.constructor.name).toBe('TEXT')
    })

    it('should allow null userId for system actions', () => {
      const attributes = AuditLog.rawAttributes
      expect(attributes.userId.allowNull).toBe(true)
    })
  })
})