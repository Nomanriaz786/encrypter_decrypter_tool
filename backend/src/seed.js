import bcrypt from 'bcryptjs'
import User from './models/User.js'
import { sequelize } from './config/database.js'

const seedUsers = async () => {
  try {
    // Connect to database
    await sequelize.authenticate()
    console.log('Database connected successfully')

    // Hash password for test users
    const hashedPassword = await bcrypt.hash('password123', 10)

    // Create test users
    const users = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        twoFactorEnabled: false,
        twoFactorSecret: null,
        isActive: true
      },
      {
        username: 'user',
        email: 'user@example.com', 
        password: hashedPassword,
        role: 'user',
        twoFactorEnabled: false,
        twoFactorSecret: null,
        isActive: true
      },
      {
        username: 'demo',
        email: 'demo@example.com',
        password: hashedPassword,
        role: 'user',
        twoFactorEnabled: false,
        twoFactorSecret: null,
        isActive: true
      }
    ]

    // Check if users already exist and create them
    for (const userData of users) {
      const existingUser = await User.findOne({ 
        where: { username: userData.username } 
      })
      
      if (!existingUser) {
        await User.create(userData)
        console.log(`✅ Created user: ${userData.username}`)
      } else {
        console.log(`⚠️  User already exists: ${userData.username}`)
      }
    }

    console.log('\n🎉 Seed completed!')
    console.log('\n📋 Default User Accounts:')
    console.log('┌─────────────┬─────────────┬────────────┬─────────┐')
    console.log('│ Username    │ Password    │ Role       │ 2FA     │')
    console.log('├─────────────┼─────────────┼────────────┼─────────┤')
    console.log('│ admin       │ password123 │ admin      │ No      │')
    console.log('│ user        │ password123 │ user       │ No      │')
    console.log('│ demo        │ password123 │ user       │ No      │')
    console.log('└─────────────┴─────────────┴────────────┴─────────┘')
    console.log('\n✅ All users can login without 2FA initially')
    console.log('🔐 Enable 2FA in user settings after first login')
    console.log('🌐 Frontend: http://localhost:3000')
    console.log('🔗 Backend:  http://localhost:5000')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedUsers()
}

export default seedUsers