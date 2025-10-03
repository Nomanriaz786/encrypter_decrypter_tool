import { sequelize } from '../config/database.js'
import User from './User.js'
import CryptoKey from './CryptoKey.js'
import AuditLog from './AuditLog.js'
import EncryptionSession from './EncryptionSession.js'
import SystemSettings from './SystemSettings.js'

// Define associations
User.hasMany(CryptoKey, { foreignKey: 'userId', onDelete: 'CASCADE' })
CryptoKey.belongsTo(User, { foreignKey: 'userId' })

User.hasMany(AuditLog, { foreignKey: 'userId', onDelete: 'SET NULL' })
AuditLog.belongsTo(User, { foreignKey: 'userId' })

User.hasMany(EncryptionSession, { foreignKey: 'userId', onDelete: 'CASCADE' })
EncryptionSession.belongsTo(User, { foreignKey: 'userId' })

EncryptionSession.belongsTo(CryptoKey, { foreignKey: 'keyId' })
CryptoKey.hasMany(EncryptionSession, { foreignKey: 'keyId' })

export {
  User,
  CryptoKey,
  AuditLog,
  EncryptionSession,
  SystemSettings,
  sequelize
}

// Initialize database
export async function initializeDatabase() {
  try {
    // Test connection
    await sequelize.authenticate()
    console.log('Database connection established successfully.')

    // Sync models (create tables)
    await sequelize.sync({ alter: true })
    console.log('Database models synchronized successfully.')

    // Create default admin user if it doesn't exist
    await createDefaultAdmin()
    
    // Create default system settings
    await createDefaultSettings()

    return true
  } catch (error) {
    console.error('Unable to initialize database:', error)
    return false
  }
}

async function createDefaultAdmin() {
  try {
    const adminExists = await User.findOne({ where: { role: 'admin' } })
    
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@securevault.com',
        password: 'SecureAdmin@123', // This will be hashed automatically
        role: 'admin',
        isActive: true
      })
      console.log('Default admin user created successfully.')
      
      // Log the admin creation
      await AuditLog.create({
        action: 'USER_CREATED',
        resource: 'user',
        details: {
          username: 'admin',
          role: 'admin',
          createdBy: 'system'
        },
        ipAddress: '127.0.0.1',
        userAgent: 'System Init'
      })
    }
  } catch (error) {
    console.error('Error creating default admin:', error)
  }
}

async function createDefaultSettings() {
  try {
    const settingsExist = await SystemSettings.findOne()
    
    if (!settingsExist) {
      await SystemSettings.create({
        maxFileSize: 100, // 100MB
        allowedFileTypes: ['.txt', '.pdf', '.doc', '.docx', '.jpg', '.png'],
        sessionTimeout: 30, // 30 minutes
        maxFailedLogins: 5,
        passwordComplexity: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true
        },
        encryptionDefaults: {
          algorithm: 'AES',
          keySize: 256
        }
      })
      console.log('Default system settings created successfully.')
    }
  } catch (error) {
    console.error('Error creating default settings:', error)
  }
}