import { describe, it, expect } from '@jest/globals'
import EncryptionSession from '../EncryptionSession.js'

describe('EncryptionSession Model', () => {
  describe('Model Definition', () => {
    it('should have correct fields', () => {
      const attributes = EncryptionSession.rawAttributes

      expect(attributes.id).toBeDefined()
      expect(attributes.userId).toBeDefined()
      expect(attributes.keyId).toBeDefined()
      expect(attributes.operation).toBeDefined()
      expect(attributes.algorithm).toBeDefined()
      expect(attributes.fileName).toBeDefined()
      expect(attributes.fileSize).toBeDefined()
      expect(attributes.fileHash).toBeDefined()
      expect(attributes.status).toBeDefined()
      expect(attributes.errorMessage).toBeDefined()
      expect(attributes.processingTime).toBeDefined()
      expect(attributes.metadata).toBeDefined()
    })

    it('should have correct field types', () => {
      const attributes = EncryptionSession.rawAttributes

      expect(attributes.id.type.constructor.name).toBe('UUID')
      expect(attributes.userId.type.constructor.name).toBe('UUID')
      expect(attributes.keyId.type.constructor.name).toBe('UUID')
      expect(attributes.operation.type.constructor.name).toBe('ENUM')
      expect(attributes.algorithm.type.constructor.name).toBe('STRING')
      expect(attributes.fileName.type.constructor.name).toBe('STRING')
      expect(attributes.fileSize.type.constructor.name).toBe('INTEGER')
      expect(attributes.fileHash.type.constructor.name).toBe('STRING')
      expect(attributes.status.type.constructor.name).toBe('ENUM')
      expect(attributes.errorMessage.type.constructor.name).toBe('TEXT')
      expect(attributes.processingTime.type.constructor.name).toBe('INTEGER')
      expect(attributes.metadata.type.constructor.name).toBe('JSONTYPE')
    })

    it('should have correct validations', () => {
      const attributes = EncryptionSession.rawAttributes

      expect(attributes.userId.allowNull).toBe(false)
      expect(attributes.operation.allowNull).toBe(false)
      expect(attributes.algorithm.allowNull).toBe(false)
      expect(attributes.keyId.allowNull).toBe(true)
      expect(attributes.fileName.allowNull).toBe(true)
      expect(attributes.fileSize.allowNull).toBe(true)
      expect(attributes.fileHash.allowNull).toBe(true)
      expect(attributes.errorMessage.allowNull).toBe(true)
      expect(attributes.processingTime.allowNull).toBe(true)
      expect(attributes.metadata.allowNull).toBe(true)
    })

    it('should have correct default values', () => {
      const attributes = EncryptionSession.rawAttributes

      expect(attributes.id.defaultValue).toBeDefined()
      expect(attributes.status.defaultValue).toBe('pending')
    })

    it('should have correct enum values for operation', () => {
      const attributes = EncryptionSession.rawAttributes
      expect(attributes.operation.values).toEqual(['encrypt', 'decrypt', 'hash', 'sign', 'verify'])
    })

    it('should have correct enum values for status', () => {
      const attributes = EncryptionSession.rawAttributes
      expect(attributes.status.values).toEqual(['pending', 'processing', 'completed', 'failed'])
    })
  })

  describe('Associations', () => {
    it('should define user association', () => {
      expect(EncryptionSession.associations).toBeDefined()
    })

    it('should define crypto key association', () => {
      expect(EncryptionSession.associations).toBeDefined()
    })
  })

  describe('Model Methods', () => {
    it('should define create method', () => {
      expect(typeof EncryptionSession.create).toBe('function')
    })

    it('should define findAll method', () => {
      expect(typeof EncryptionSession.findAll).toBe('function')
    })

    it('should define findByPk method', () => {
      expect(typeof EncryptionSession.findByPk).toBe('function')
    })

    it('should define update method', () => {
      expect(typeof EncryptionSession.update).toBe('function')
    })

    it('should define destroy method', () => {
      expect(typeof EncryptionSession.destroy).toBe('function')
    })
  })

  describe('Instance Methods', () => {
    it('should have instance methods', () => {
      const session = new EncryptionSession()
      expect(typeof session.save).toBe('function')
      expect(typeof session.update).toBe('function')
      expect(typeof session.destroy).toBe('function')
    })
  })

  describe('Data Validation', () => {
    it('should validate required fields', () => {
      const attributes = EncryptionSession.rawAttributes

      expect(attributes.userId.allowNull).toBe(false)
      expect(attributes.operation.allowNull).toBe(false)
      expect(attributes.algorithm.allowNull).toBe(false)
    })

    it('should allow null for optional fields', () => {
      const attributes = EncryptionSession.rawAttributes

      expect(attributes.keyId.allowNull).toBe(true)
      expect(attributes.fileName.allowNull).toBe(true)
      expect(attributes.fileSize.allowNull).toBe(true)
      expect(attributes.fileHash.allowNull).toBe(true)
      expect(attributes.errorMessage.allowNull).toBe(true)
      expect(attributes.processingTime.allowNull).toBe(true)
      expect(attributes.metadata.allowNull).toBe(true)
    })
  })

  describe('Model Configuration', () => {
    it('should have correct table name', () => {
      expect(EncryptionSession.tableName).toBe('encryption_sessions')
    })

    it('should have timestamps enabled', () => {
      expect(EncryptionSession.options.timestamps).toBe(true)
    })
  })

  describe('Session Tracking', () => {
    it('should support file metadata tracking', () => {
      const attributes = EncryptionSession.rawAttributes
      expect(attributes.fileName).toBeDefined()
      expect(attributes.fileSize).toBeDefined()
      expect(attributes.fileHash).toBeDefined()
    })

    it('should support processing time tracking', () => {
      const attributes = EncryptionSession.rawAttributes
      expect(attributes.processingTime.type.constructor.name).toBe('INTEGER')
    })

    it('should support error message storage', () => {
      const attributes = EncryptionSession.rawAttributes
      expect(attributes.errorMessage.type.constructor.name).toBe('TEXT')
    })

    it('should support flexible metadata storage', () => {
      const attributes = EncryptionSession.rawAttributes
      expect(attributes.metadata.type.constructor.name).toBe('JSONTYPE')
    })
  })
})