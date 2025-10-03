import { describe, it, expect } from '@jest/globals'
import CryptoKey from '../CryptoKey.js'

describe('CryptoKey Model', () => {
  describe('Model Definition', () => {
    it('should have correct fields', () => {
      const attributes = CryptoKey.rawAttributes

      expect(attributes.id).toBeDefined()
      expect(attributes.userId).toBeDefined()
      expect(attributes.name).toBeDefined()
      expect(attributes.algorithm).toBeDefined()
      expect(attributes.keySize).toBeDefined()
      expect(attributes.keyData).toBeDefined()
      expect(attributes.publicKey).toBeDefined()
      expect(attributes.status).toBeDefined()
      expect(attributes.expiresAt).toBeDefined()
    })

    it('should have correct field types', () => {
      const attributes = CryptoKey.rawAttributes

      expect(attributes.id.type.constructor.name).toBe('UUID')
      expect(attributes.userId.type.constructor.name).toBe('UUID')
      expect(attributes.name.type.constructor.name).toBe('STRING')
      expect(attributes.algorithm.type.constructor.name).toBe('ENUM')
      expect(attributes.keySize.type.constructor.name).toBe('INTEGER')
      expect(attributes.keyData.type.constructor.name).toBe('TEXT')
      expect(attributes.publicKey.type.constructor.name).toBe('TEXT')
      expect(attributes.status.type.constructor.name).toBe('ENUM')
      expect(attributes.expiresAt.type.constructor.name).toBe('DATE')
    })

    it('should have correct validations', () => {
      const attributes = CryptoKey.rawAttributes

      expect(attributes.userId.allowNull).toBe(false)
      expect(attributes.name.allowNull).toBe(false)
      expect(attributes.algorithm.allowNull).toBe(false)
      expect(attributes.keySize.allowNull).toBe(false)
      expect(attributes.keyData.allowNull).toBe(false)
      expect(attributes.publicKey.allowNull).toBe(true) // Only for RSA keys
    })

    it('should have correct default values', () => {
      const attributes = CryptoKey.rawAttributes

      expect(attributes.id.defaultValue).toBeDefined()
      expect(attributes.status.defaultValue).toBe('active')
    })

    it('should have correct enum values for algorithm', () => {
      const attributes = CryptoKey.rawAttributes
      expect(attributes.algorithm.values).toEqual(['AES', 'RSA'])
    })

    it('should have correct enum values for status', () => {
      const attributes = CryptoKey.rawAttributes
      expect(attributes.status.values).toEqual(['active', 'revoked'])
    })
  })

  describe('Associations', () => {
    it('should define user association', () => {
      // Test that associations are defined (actual relationships tested in integration tests)
      expect(CryptoKey.associations).toBeDefined()
    })
  })

  describe('Model Methods', () => {
    it('should define create method', () => {
      expect(typeof CryptoKey.create).toBe('function')
    })

    it('should define findAll method', () => {
      expect(typeof CryptoKey.findAll).toBe('function')
    })

    it('should define findByPk method', () => {
      expect(typeof CryptoKey.findByPk).toBe('function')
    })

    it('should define update method', () => {
      expect(typeof CryptoKey.update).toBe('function')
    })

    it('should define destroy method', () => {
      expect(typeof CryptoKey.destroy).toBe('function')
    })
  })

  describe('Instance Methods', () => {
    it('should have instance methods', () => {
      const key = new CryptoKey()
      expect(typeof key.save).toBe('function')
      expect(typeof key.update).toBe('function')
      expect(typeof key.destroy).toBe('function')
    })
  })

  describe('Data Validation', () => {
    it('should validate required fields', () => {
      const attributes = CryptoKey.rawAttributes

      // Required fields should not allow null
      expect(attributes.userId.allowNull).toBe(false)
      expect(attributes.name.allowNull).toBe(false)
      expect(attributes.algorithm.allowNull).toBe(false)
      expect(attributes.keySize.allowNull).toBe(false)
      expect(attributes.keyData.allowNull).toBe(false)
    })

    it('should allow null for optional fields', () => {
      const attributes = CryptoKey.rawAttributes

      // Optional fields should allow null
      expect(attributes.publicKey.allowNull).toBe(true)
      expect(attributes.expiresAt.allowNull).toBe(true)
    })
  })

  describe('Model Configuration', () => {
    it('should have correct table name', () => {
      expect(CryptoKey.tableName).toBe('crypto_keys')
    })

    it('should have timestamps enabled', () => {
      expect(CryptoKey.options.timestamps).toBe(true)
    })
  })
})