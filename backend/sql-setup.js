// Simple SQL script to create default users
// Run this in your MySQL database

const createUsersSQL = `
-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default users (password is 'password123' hashed with bcrypt)
INSERT IGNORE INTO users (username, email, password, role, two_factor_enabled, is_active) VALUES
('admin', 'admin@example.com', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8.M8KDfXQwv.OPXkZuJUvU9iNdh3au', 'admin', FALSE, TRUE),
('user', 'user@example.com', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8.M8KDfXQwv.OPXkZuJUvU9iNdh3au', 'user', FALSE, TRUE),
('demo', 'demo@example.com', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8.M8KDfXQwv.OPXkZuJUvU9iNdh3au', 'user', FALSE, TRUE);

-- Verify the users were created
SELECT username, email, role, two_factor_enabled, is_active FROM users;
`;

console.log('🔐 Database Setup for Encryption Tool')
console.log('=====================================')
console.log('')
console.log('Please run the following SQL in your MySQL database:')
console.log('')
console.log(createUsersSQL)
console.log('')
console.log('✅ Default Accounts:')
console.log('┌─────────────┬─────────────┬────────────┬─────────┐')
console.log('│ Username    │ Password    │ Role       │ 2FA     │')
console.log('├─────────────┼─────────────┼────────────┼─────────┤')
console.log('│ admin       │ password123 │ admin      │ No      │')
console.log('│ user        │ password123 │ user       │ No      │')
console.log('│ demo        │ password123 │ user       │ No      │')
console.log('└─────────────┴─────────────┴────────────┴─────────┘')
console.log('')
console.log('🌐 Access URLs:')
console.log('  Frontend: http://localhost:3000')
console.log('  Backend:  http://localhost:5000')
console.log('')
console.log('🔒 2FA Information:')
console.log('  - All accounts start with 2FA disabled')
console.log('  - Users can enable 2FA in their account settings')
console.log('  - 2FA is only required after user enables it')