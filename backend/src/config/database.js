import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'

dotenv.config()

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true
    }
  }
)

export async function connectDB() {
  try {
    await sequelize.authenticate()
    console.log('✅ Database connected successfully')
    
    // Sync models in development
    if (process.env.NODE_ENV === 'development') {
      try {
        // First try normal sync
        await sequelize.sync()
        console.log('📊 Database models synchronized')
      } catch (error) {
        if (error.name === 'SequelizeDatabaseError' && error.original.code === 'ER_TOO_MANY_KEYS') {
          console.log('⚠️  Too many keys detected, dropping and recreating tables...')
          // Drop all tables and recreate them
          await sequelize.drop()
          await sequelize.sync()
          console.log('📊 Database tables recreated successfully')
          
          // Re-seed the database with default users
          console.log('🌱 Re-seeding database with default users...')
          const seedUsers = (await import('../seed.js')).default
          await seedUsers()
        } else {
          throw error
        }
      }
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    throw error
  }
}

export { sequelize }