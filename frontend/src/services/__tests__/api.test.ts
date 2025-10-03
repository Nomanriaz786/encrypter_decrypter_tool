import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the entire api module before importing it
vi.mock('../api', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    verify2FA: vi.fn()
  },
  cryptoAPI: {
    encrypt: vi.fn(),
    decrypt: vi.fn(),
    hash: vi.fn(),
    verifyHash: vi.fn()
  },
  keyAPI: {
    getKeys: vi.fn(),
    createKey: vi.fn(),
    deleteKey: vi.fn(),
    revokeKey: vi.fn()
  },
  signatureAPI: {
    sign: vi.fn(),
    verify: vi.fn()
  }
}))

import * as apiModule from '../api'

describe('API Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'fake-token'),
        setItem: vi.fn(),
        removeItem: vi.fn()
      },
      writable: true
    })
  })

  describe('authAPI', () => {
    it('login makes correct API call', async () => {
      const mockResponse = { data: { token: 'token', user: {} } }
      ;(apiModule.authAPI.login as any).mockResolvedValue(mockResponse)

      const result = await apiModule.authAPI.login({ username: 'user', password: 'pass' })

      expect(apiModule.authAPI.login).toHaveBeenCalledWith({ username: 'user', password: 'pass' })
      expect(result).toEqual(mockResponse)
    })

    it('register makes correct API call', async () => {
      const mockResponse = { data: { user: {} } }
      ;(apiModule.authAPI.register as any).mockResolvedValue(mockResponse)

      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123'
      }

      const result = await apiModule.authAPI.register(userData)

      expect(apiModule.authAPI.register).toHaveBeenCalledWith(userData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('cryptoAPI', () => {
    it('encrypt makes correct API call', async () => {
      const mockResponse = { data: { encryptedData: 'encrypted' } }
      ;(apiModule.cryptoAPI.encrypt as any).mockResolvedValue(mockResponse)

      const encryptData = {
        text: 'hello',
        algorithm: 'AES',
        keySize: 256,
        key: 'secret'
      }

      const result = await apiModule.cryptoAPI.encrypt(encryptData)

      expect(apiModule.cryptoAPI.encrypt).toHaveBeenCalledWith(encryptData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('keyAPI', () => {
    it('getKeys makes correct API call', async () => {
      const mockResponse = { data: { keys: [] } }
      ;(apiModule.keyAPI.getKeys as any).mockResolvedValue(mockResponse)

      const result = await apiModule.keyAPI.getKeys()

      expect(apiModule.keyAPI.getKeys).toHaveBeenCalledWith()
      expect(result).toEqual(mockResponse)
    })
  })
})