import crypto from 'crypto'

export class CryptoService {
  // AES Encryption/Decryption
  static encryptAES(text, key, keySize = 256) {
    try {
      if (!text || typeof text !== 'string') {
        throw new Error('Text must be a non-empty string')
      }
      if (!key || typeof key !== 'string' || key.length === 0) {
        throw new Error('Key must be a non-empty string')
      }
      if (![128, 192, 256].includes(keySize)) {
        throw new Error('Key size must be 128, 192, or 256 bits')
      }

      const algorithm = `aes-${keySize}-gcm`
      const keyBuffer = crypto.scryptSync(key, 'salt', keySize / 8)
      const iv = crypto.randomBytes(16)
      
      const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv)
      cipher.setAAD(Buffer.from('additional data'))
      
      let encrypted = cipher.update(text, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      const authTag = cipher.getAuthTag()
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        algorithm
      }
    } catch (error) {
      throw new Error(`AES encryption failed: ${error.message}`)
    }
  }

  static decryptAES(encryptedData, key, keySize = 256) {
    try {
      const algorithm = `aes-${keySize}-gcm`
      const keyBuffer = crypto.scryptSync(key, 'salt', keySize / 8)
      const iv = Buffer.from(encryptedData.iv, 'hex')
      
      const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv)
      decipher.setAAD(Buffer.from('additional data'))
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'))
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      throw new Error(`AES decryption failed: ${error.message}`)
    }
  }

  // RSA Key Generation
  static generateRSAKeyPair(keySize = 2048) {
    try {
      if (keySize < 1024) {
        throw new Error('Key size must be at least 1024 bits')
      }
      if (keySize > 4096) {
        throw new Error('Key size must not exceed 4096 bits')
      }

      return crypto.generateKeyPairSync('rsa', {
        modulusLength: keySize,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      })
    } catch (error) {
      throw new Error(`RSA key generation failed: ${error.message}`)
    }
  }

  // RSA Encryption/Decryption
  static encryptRSA(text, publicKey) {
    try {
      const encrypted = crypto.publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        Buffer.from(text, 'utf8')
      )
      
      return encrypted.toString('base64')
    } catch (error) {
      throw new Error(`RSA encryption failed: ${error.message}`)
    }
  }

  static decryptRSA(encryptedText, privateKey) {
    try {
      const decrypted = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        Buffer.from(encryptedText, 'base64')
      )
      
      return decrypted.toString('utf8')
    } catch (error) {
      throw new Error(`RSA decryption failed: ${error.message}`)
    }
  }

  // Hashing functions
  static generateHash(text, algorithm = 'sha256') {
    try {
      const supportedAlgorithms = ['md5', 'sha1', 'sha256', 'sha512']
      
      if (!supportedAlgorithms.includes(algorithm.toLowerCase())) {
        throw new Error(`Unsupported algorithm: ${algorithm}`)
      }
      
      return crypto.createHash(algorithm).update(text, 'utf8').digest('hex')
    } catch (error) {
      throw new Error(`Hashing failed: ${error.message}`)
    }
  }

  // Digital Signatures
  static signData(data, privateKey, algorithm = 'RSA-SHA256') {
    try {
      // Ensure algorithm is valid
      const validAlgorithms = ['RSA-SHA1', 'RSA-SHA256', 'RSA-SHA384', 'RSA-SHA512', 'sha1', 'sha256', 'sha384', 'sha512']
      if (!validAlgorithms.includes(algorithm)) {
        throw new Error(`Invalid algorithm: ${algorithm}`)
      }
      
      const sign = crypto.createSign(algorithm)
      sign.update(data, 'utf8')
      
      return sign.sign(privateKey, 'base64')
    } catch (error) {
      throw new Error(`Digital signing failed: ${error.message}`)
    }
  }

  static verifySignature(data, signature, publicKey, algorithm = 'RSA-SHA256') {
    try {
      // Ensure algorithm is valid
      const validAlgorithms = ['RSA-SHA1', 'RSA-SHA256', 'RSA-SHA384', 'RSA-SHA512', 'sha1', 'sha256', 'sha384', 'sha512']
      if (!validAlgorithms.includes(algorithm)) {
        throw new Error(`Invalid algorithm: ${algorithm}`)
      }
      
      const verify = crypto.createVerify(algorithm)
      verify.update(data, 'utf8')
      
      return verify.verify(publicKey, signature, 'base64')
    } catch (error) {
      console.error(`Signature verification error: ${error.message}`)
      throw new Error(`Signature verification failed: ${error.message}`)
    }
  }

  // Generate random key
  static generateRandomKey(length = 32) {
    return crypto.randomBytes(length).toString('hex')
  }

  // File integrity checking
  static generateFileHash(fileBuffer, algorithm = 'sha256') {
    try {
      if (!Buffer.isBuffer(fileBuffer)) {
        throw new Error('Input must be a Buffer')
      }
      if (fileBuffer.length === 0) {
        throw new Error('Buffer cannot be empty')
      }

      return crypto.createHash(algorithm).update(fileBuffer).digest('hex')
    } catch (error) {
      throw new Error(`File hashing failed: ${error.message}`)
    }
  }

  static verifyFileIntegrity(fileBuffer, expectedHash, algorithm = 'sha256') {
    try {
      if (!Buffer.isBuffer(fileBuffer)) {
        throw new Error('Input must be a Buffer')
      }
      if (!expectedHash || typeof expectedHash !== 'string') {
        throw new Error('Expected hash must be a non-empty string')
      }

      const actualHash = this.generateFileHash(fileBuffer, algorithm)
      return {
        isValid: actualHash === expectedHash.toLowerCase(),
        actualHash,
        expectedHash: expectedHash.toLowerCase()
      }
    } catch (error) {
      throw new Error(`File integrity verification failed: ${error.message}`)
    }
  }
}