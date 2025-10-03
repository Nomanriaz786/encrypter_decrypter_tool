import { describe, it, expect } from '@jest/globals'
import User from '../User.js'

describe('User Model', () => {
  describe('Model Definition', () => {
    it('should have correct fields', () => {
      const attributes = User.rawAttributes

      expect(attributes.id).toBeDefined()
      expect(attributes.username).toBeDefined()
      expect(attributes.email).toBeDefined()
      expect(attributes.password).toBeDefined()
      expect(attributes.role).toBeDefined()
      expect(attributes.twoFactorEnabled).toBeDefined()
      expect(attributes.isActive).toBeDefined()
    })

    it('should have correct field types', () => {
      const attributes = User.rawAttributes

      expect(attributes.id.type.constructor.name).toBe('UUID')
      expect(attributes.username.type.constructor.name).toBe('STRING')
      expect(attributes.email.type.constructor.name).toBe('STRING')
      expect(attributes.password.type.constructor.name).toBe('STRING')
      expect(attributes.role.type.constructor.name).toBe('ENUM')
    })

    it('should have correct validations', () => {
      const attributes = User.rawAttributes

      expect(attributes.username.allowNull).toBe(false)
      expect(attributes.email.allowNull).toBe(false)
      expect(attributes.password.allowNull).toBe(false)
      expect(attributes.username.unique).toBe(true)
      expect(attributes.email.unique).toBe(true)
    })
  })

  describe('Hooks', () => {
    it('should define password hashing hook', () => {
      // Test that the hook is defined (actual functionality tested in integration tests)
      expect(User.options.hooks).toBeDefined()
      expect(User.options.hooks.beforeCreate).toBeDefined()
    })
  })

  describe('Instance Methods', () => {
    it('should define comparePassword method', () => {
      // Test that the method exists (actual functionality tested in integration tests)
      const user = new User()
      expect(typeof user.comparePassword).toBe('function')
    })
  })

  describe('Model Methods', () => {
    it('should define create method', () => {
      expect(typeof User.create).toBe('function')
    })

    it('should define destroy method', () => {
      expect(typeof User.destroy).toBe('function')
    })
  })
})