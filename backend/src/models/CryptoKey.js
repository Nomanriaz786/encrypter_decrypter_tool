import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const CryptoKey = sequelize.define('CryptoKey', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  algorithm: {
    type: DataTypes.ENUM('AES', 'RSA'),
    allowNull: false
  },
  keySize: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  keyData: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  publicKey: {
    type: DataTypes.TEXT,
    allowNull: true // Only for RSA keys
  },
  status: {
    type: DataTypes.ENUM('active', 'revoked'),
    defaultValue: 'active'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
})

export default CryptoKey