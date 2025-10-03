import { CryptoService } from '../cryptoService.js'

describe('CryptoService', () => {
  describe('AES Encryption/Decryption', () => {
    const testKey = 'test-key-12345678901234567890123456789012'
    const testText = 'Hello, World! This is a test message.'

    it('should encrypt and decrypt text correctly with AES-256-GCM', () => {
      const encrypted = CryptoService.encryptAES(testText, testKey, 256)

      expect(encrypted).toHaveProperty('encrypted')
      expect(encrypted).toHaveProperty('iv')
      expect(encrypted).toHaveProperty('authTag')
      expect(encrypted).toHaveProperty('algorithm', 'aes-256-gcm')

      const decrypted = CryptoService.decryptAES(encrypted, testKey, 256)
      expect(decrypted).toBe(testText)
    })

    it('should encrypt and decrypt text correctly with AES-128-GCM', () => {
      const shortKey = 'short-key-12345'
      const encrypted = CryptoService.encryptAES(testText, shortKey, 128)

      expect(encrypted.algorithm).toBe('aes-128-gcm')

      const decrypted = CryptoService.decryptAES(encrypted, shortKey, 128)
      expect(decrypted).toBe(testText)
    })

    it('should throw error for invalid key during encryption', () => {
      expect(() => {
        CryptoService.encryptAES(testText, '', 256)
      }).toThrow('AES encryption failed')
    })

    it('should throw error for invalid encrypted data during decryption', () => {
      const invalidData = {
        encrypted: 'invalid',
        iv: 'invalid',
        authTag: 'invalid'
      }

      expect(() => {
        CryptoService.decryptAES(invalidData, testKey, 256)
      }).toThrow('AES decryption failed')
    })

    it('should throw error for wrong key during decryption', () => {
      const encrypted = CryptoService.encryptAES(testText, testKey, 256)
      const wrongKey = 'wrong-key-12345678901234567890123456789012'

      expect(() => {
        CryptoService.decryptAES(encrypted, wrongKey, 256)
      }).toThrow('AES decryption failed')
    })
  })

  describe('RSA Key Generation', () => {
    it('should generate RSA key pair with default size (2048)', () => {
      const keyPair = CryptoService.generateRSAKeyPair()

      expect(keyPair).toHaveProperty('publicKey')
      expect(keyPair).toHaveProperty('privateKey')
      expect(keyPair.publicKey).toContain('-----BEGIN PUBLIC KEY-----')
      expect(keyPair.privateKey).toContain('-----BEGIN PRIVATE KEY-----')
    })

    it('should generate RSA key pair with custom size (4096)', () => {
      const keyPair = CryptoService.generateRSAKeyPair(4096)

      expect(keyPair).toHaveProperty('publicKey')
      expect(keyPair).toHaveProperty('privateKey')
      expect(keyPair.publicKey).toContain('-----BEGIN PUBLIC KEY-----')
      expect(keyPair.privateKey).toContain('-----BEGIN PRIVATE KEY-----')
    })

    it('should throw error for invalid key size', () => {
      expect(() => {
        CryptoService.generateRSAKeyPair(512) // Too small
      }).toThrow('RSA key generation failed')
    })
  })

  describe('RSA Encryption/Decryption', () => {
    let keyPair
    const testText = 'Hello, RSA World!'

    beforeEach(() => {
      keyPair = CryptoService.generateRSAKeyPair()
    })

    it('should encrypt and decrypt text correctly with RSA', () => {
      const encrypted = CryptoService.encryptRSA(testText, keyPair.publicKey)
      expect(typeof encrypted).toBe('string')
      expect(encrypted.length).toBeGreaterThan(0)

      const decrypted = CryptoService.decryptRSA(encrypted, keyPair.privateKey)
      expect(decrypted).toBe(testText)
    })

    it('should throw error for invalid public key during encryption', () => {
      expect(() => {
        CryptoService.encryptRSA(testText, 'invalid-public-key')
      }).toThrow('RSA encryption failed')
    })

    it('should throw error for invalid private key during decryption', () => {
      const encrypted = CryptoService.encryptRSA(testText, keyPair.publicKey)

      expect(() => {
        CryptoService.decryptRSA(encrypted, 'invalid-private-key')
      }).toThrow('RSA decryption failed')
    })

    it('should throw error for wrong key pair during decryption', () => {
      const encrypted = CryptoService.encryptRSA(testText, keyPair.publicKey)
      const wrongKeyPair = CryptoService.generateRSAKeyPair()

      expect(() => {
        CryptoService.decryptRSA(encrypted, wrongKeyPair.privateKey)
      }).toThrow('RSA decryption failed')
    })
  })

  describe('Hashing Functions', () => {
    const testText = 'Hello, Hashing World!'

    it('should generate MD5 hash correctly', () => {
      const hash = CryptoService.generateHash(testText, 'md5')
      expect(hash).toMatch(/^[a-f0-9]{32}$/)
      expect(hash.length).toBe(32)
    })

    it('should generate SHA-256 hash correctly', () => {
      const hash = CryptoService.generateHash(testText, 'sha256')
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
      expect(hash.length).toBe(64)
    })

    it('should generate SHA-512 hash correctly', () => {
      const hash = CryptoService.generateHash(testText, 'sha512')
      expect(hash).toMatch(/^[a-f0-9]{128}$/)
      expect(hash.length).toBe(128)
    })

    it('should generate SHA-1 hash correctly', () => {
      const hash = CryptoService.generateHash(testText, 'sha1')
      expect(hash).toMatch(/^[a-f0-9]{40}$/)
      expect(hash.length).toBe(40)
    })

    it('should be case insensitive for algorithm names', () => {
      const hash1 = CryptoService.generateHash(testText, 'SHA256')
      const hash2 = CryptoService.generateHash(testText, 'sha256')
      expect(hash1).toBe(hash2)
    })

    it('should throw error for unsupported algorithm', () => {
      expect(() => {
        CryptoService.generateHash(testText, 'unsupported')
      }).toThrow('Unsupported algorithm: unsupported')
    })

    it('should generate consistent hashes for same input', () => {
      const hash1 = CryptoService.generateHash(testText, 'sha256')
      const hash2 = CryptoService.generateHash(testText, 'sha256')
      expect(hash1).toBe(hash2)
    })

    it('should generate different hashes for different inputs', () => {
      const hash1 = CryptoService.generateHash(testText, 'sha256')
      const hash2 = CryptoService.generateHash('Different text', 'sha256')
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('Digital Signatures', () => {
    let keyPair
    const testData = 'Hello, Digital Signature World!'

    beforeEach(() => {
      keyPair = CryptoService.generateRSAKeyPair()
    })

    it('should sign and verify data correctly', () => {
      const signature = CryptoService.signData(testData, keyPair.privateKey)
      expect(typeof signature).toBe('string')
      expect(signature.length).toBeGreaterThan(0)

      const isValid = CryptoService.verifySignature(testData, signature, keyPair.publicKey)
      expect(isValid).toBe(true)
    })

    it('should return false for tampered data', () => {
      const signature = CryptoService.signData(testData, keyPair.privateKey)
      const tamperedData = testData + 'tampered'

      const isValid = CryptoService.verifySignature(tamperedData, signature, keyPair.publicKey)
      expect(isValid).toBe(false)
    })

    it('should return false for wrong public key', () => {
      const signature = CryptoService.signData(testData, keyPair.privateKey)
      const wrongKeyPair = CryptoService.generateRSAKeyPair()

      const isValid = CryptoService.verifySignature(testData, signature, wrongKeyPair.publicKey)
      expect(isValid).toBe(false)
    })

    it('should throw error for invalid private key during signing', () => {
      expect(() => {
        CryptoService.signData(testData, 'invalid-private-key')
      }).toThrow('Digital signing failed')
    })

    it('should throw error for invalid public key during verification', () => {
      const signature = CryptoService.signData(testData, keyPair.privateKey)

      expect(() => {
        CryptoService.verifySignature(testData, signature, 'invalid-public-key')
      }).toThrow('Signature verification failed')
    })

    it('should work with different algorithms', () => {
      const signature = CryptoService.signData(testData, keyPair.privateKey, 'RSA-SHA512')
      const isValid = CryptoService.verifySignature(testData, signature, keyPair.publicKey, 'RSA-SHA512')
      expect(isValid).toBe(true)
    })
  })

  describe('Random Key Generation', () => {
    it('should generate random key with default length (32 bytes)', () => {
      const key = CryptoService.generateRandomKey()
      expect(typeof key).toBe('string')
      expect(key.length).toBe(64) // 32 bytes * 2 hex chars per byte
      expect(key).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should generate random key with custom length', () => {
      const key = CryptoService.generateRandomKey(16)
      expect(key.length).toBe(32) // 16 bytes * 2 hex chars per byte
      expect(key).toMatch(/^[a-f0-9]{32}$/)
    })

    it('should generate different keys on each call', () => {
      const key1 = CryptoService.generateRandomKey()
      const key2 = CryptoService.generateRandomKey()
      expect(key1).not.toBe(key2)
    })
  })

  describe('File Integrity Checking', () => {
    const testBuffer = Buffer.from('Hello, File Integrity World!')
    const testHash = 'a3b8c8d2e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5'

    it('should generate file hash correctly', () => {
      const hash = CryptoService.generateFileHash(testBuffer, 'sha256')
      expect(typeof hash).toBe('string')
      expect(hash.length).toBe(64)
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should verify file integrity correctly for valid hash', () => {
      const actualHash = CryptoService.generateFileHash(testBuffer, 'sha256')
      const result = CryptoService.verifyFileIntegrity(testBuffer, actualHash, 'sha256')

      expect(result.isValid).toBe(true)
      expect(result.actualHash).toBe(actualHash.toLowerCase())
      expect(result.expectedHash).toBe(actualHash.toLowerCase())
    })

    it('should detect file tampering', () => {
      const tamperedBuffer = Buffer.from('Hello, Tampered File!')
      const originalHash = CryptoService.generateFileHash(testBuffer, 'sha256')
      const result = CryptoService.verifyFileIntegrity(tamperedBuffer, originalHash, 'sha256')

      expect(result.isValid).toBe(false)
      expect(result.actualHash).not.toBe(result.expectedHash)
    })

    it('should handle case insensitive hash comparison', () => {
      const actualHash = CryptoService.generateFileHash(testBuffer, 'sha256')
      const upperCaseHash = actualHash.toUpperCase()
      const result = CryptoService.verifyFileIntegrity(testBuffer, upperCaseHash, 'sha256')

      expect(result.isValid).toBe(true)
    })

    it('should work with different algorithms', () => {
      const hash = CryptoService.generateFileHash(testBuffer, 'md5')
      const result = CryptoService.verifyFileIntegrity(testBuffer, hash, 'md5')

      expect(result.isValid).toBe(true)
      expect(hash.length).toBe(32)
    })

    it('should throw error for invalid buffer during hashing', () => {
      expect(() => {
        CryptoService.generateFileHash('not-a-buffer', 'sha256')
      }).toThrow('File hashing failed')
    })

    it('should throw error for invalid buffer during verification', () => {
      expect(() => {
        CryptoService.verifyFileIntegrity('not-a-buffer', testHash, 'sha256')
      }).toThrow('File integrity verification failed')
    })
  })
})