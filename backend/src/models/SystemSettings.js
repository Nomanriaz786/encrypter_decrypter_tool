import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const SystemSettings = sequelize.define('SystemSettings', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  maxFileSize: {
    type: DataTypes.INTEGER, // in MB
    defaultValue: 100,
    allowNull: false
  },
  allowedFileTypes: {
    type: DataTypes.JSON,
    defaultValue: ['.txt', '.pdf', '.doc', '.docx', '.jpg', '.png'],
    allowNull: false
  },
  sessionTimeout: {
    type: DataTypes.INTEGER, // in minutes
    defaultValue: 30,
    allowNull: false
  },
  maxFailedLogins: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    allowNull: false
  },
  passwordComplexity: {
    type: DataTypes.JSON,
    defaultValue: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },
    allowNull: false
  },
  encryptionDefaults: {
    type: DataTypes.JSON,
    defaultValue: {
      algorithm: 'AES',
      keySize: 256
    },
    allowNull: false
  },
  auditLogRetention: {
    type: DataTypes.INTEGER, // in days
    defaultValue: 90,
    allowNull: false
  },
  maintenanceMode: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  systemVersion: {
    type: DataTypes.STRING,
    defaultValue: '1.0.0'
  }
})

export default SystemSettings