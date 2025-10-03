import { sequelize } from '../src/config/database.js'

// Setup test environment
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test_secret_key_for_testing_only'
  
  // Connect to test database
  try {
    await sequelize.authenticate()
    await sequelize.sync({ force: true }) // Reset database before tests
  } catch (error) {
    console.error('Unable to connect to test database:', error)
  }
})

// Cleanup after all tests
afterAll(async () => {
  try {
    await sequelize.close()
  } catch (error) {
    console.error('Error closing database connection:', error)
  }
})

// Clear database between test suites
afterEach(async () => {
  if (sequelize.models) {
    await Promise.all(
      Object.values(sequelize.models).map(model => model.destroy({ where: {}, force: true }))
    )
  }
})
