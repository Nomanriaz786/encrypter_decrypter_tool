import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const EncryptionSession = sequelize.define('EncryptionSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  keyId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'crypto_keys',
      key: 'id'
    }
  },
  operation: {
    type: DataTypes.ENUM('encrypt', 'decrypt', 'hash', 'sign', 'verify'),
    allowNull: false
  },
  algorithm: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  fileHash: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  processingTime: {
    type: DataTypes.INTEGER, // in milliseconds
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
})

export default EncryptionSession