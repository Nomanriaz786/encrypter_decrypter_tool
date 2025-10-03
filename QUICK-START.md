# Quick Start Guide - Testing and CI/CD

## Prerequisites

- Node.js 18.x or higher
- MySQL 8.0 or higher
- Python 3.9+ (for Bandit security scanning)
- Git
- GitHub account (for CI/CD)

## Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/Nomanriaz786/encrypter_decrypter_tool.git
cd encrypter_decrypter_tool
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your database credentials
# DB_HOST=localhost
# DB_PORT=3306
# DB_NAME=crypto_db
# DB_USER=your_user
# DB_PASSWORD=your_password
# JWT_SECRET=your_secret_key_here

# Run database migrations
npm run seed

# Start development server
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (for development)
npm run test:watch

# Run specific test file
npm test -- auth.test.js

# Run tests for CI/CD
npm run test:ci
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### View Coverage Reports

After running tests with coverage:

```bash
# Backend coverage
cd backend
open coverage/index.html  # macOS
start coverage/index.html  # Windows
xdg-open coverage/index.html  # Linux

# Frontend coverage
cd frontend
open coverage/index.html  # macOS
start coverage/index.html  # Windows
xdg-open coverage/index.html  # Linux
```

## Running Security Scans Locally

### 1. ESLint (Code Quality)

```bash
# Backend
cd backend
npm run lint

# Frontend
cd frontend
npm run lint
```

### 2. npm Audit (Dependency Vulnerabilities)

```bash
# Backend
cd backend
npm audit

# Frontend
cd frontend
npm audit

# Fix vulnerabilities automatically
npm audit fix
```

### 3. Bandit (Python Security Scan)

```bash
# Install Bandit
pip install bandit

# Run security scan
bandit -r backend/src -f txt
bandit -r backend/src -f json -o bandit-report.json
```

### 4. OWASP ZAP (requires application running)

```bash
# Install OWASP ZAP
# Download from https://www.zaproxy.org/download/

# Start backend server
cd backend
npm start

# Run ZAP baseline scan
zap-baseline.py -t http://localhost:5000 -r zap-report.html
```

## Setting Up CI/CD Pipeline

### 1. Fork/Clone Repository to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/encrypter_decrypter_tool.git
git push -u origin main
```

### 2. Setup SonarCloud

1. Go to https://sonarcloud.io/
2. Sign in with GitHub
3. Click "+" → "Analyze new project"
4. Select your repository
5. Copy the project key and organization
6. Go to GitHub repository → Settings → Secrets
7. Add secret: `SONAR_TOKEN` (get from SonarCloud → My Account → Security)

### 3. Enable GitHub Actions

1. Go to your GitHub repository
2. Click "Actions" tab
3. Click "I understand my workflows, go ahead and enable them"
4. Workflows will run automatically on push/PR

### 4. View Pipeline Results

1. Go to "Actions" tab
2. Click on a workflow run
3. View job results and logs
4. Download artifacts for reports

## Testing Checklist

### Before Committing Code

- [ ] Run all tests locally: `npm test`
- [ ] Check code coverage: `npm run test:coverage`
- [ ] Run linter: `npm run lint`
- [ ] Fix linting errors: `npm run lint:fix`
- [ ] Run security audit: `npm audit`
- [ ] Test application manually
- [ ] Check for console errors
- [ ] Verify no secrets in code

### Before Creating PR

- [ ] All tests pass
- [ ] Coverage ≥ 70%
- [ ] No linting errors
- [ ] No security vulnerabilities
- [ ] Branch up to date with main
- [ ] Clear commit messages
- [ ] PR description complete

### After PR Merge

- [ ] Pipeline passes
- [ ] SonarCloud quality gate passes
- [ ] No new security issues
- [ ] Deploy to staging
- [ ] Smoke test deployed version

## Common Issues and Solutions

### Tests Failing - Database Connection

```bash
# Make sure MySQL is running
# Windows
net start MySQL80

# macOS
brew services start mysql

# Linux
sudo systemctl start mysql

# Check connection
mysql -u root -p
```

### Tests Failing - Port Already in Use

```bash
# Find process using port
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

### Coverage Not Generated

```bash
# Clear cache and reinstall
rm -rf node_modules coverage
npm install
npm run test:coverage
```

### SonarCloud Token Invalid

1. Go to SonarCloud → My Account → Security
2. Revoke old token
3. Generate new token
4. Update GitHub secret

### OWASP ZAP Scan Fails

```bash
# Make sure application is running
curl http://localhost:5000/api/health

# Check ZAP is installed correctly
zap-baseline.py --version

# Run with verbose output
zap-baseline.py -t http://localhost:5000 -d -v
```

## Environment Variables Reference

### Backend (.env)

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=crypto_db
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production

# Application
PORT=5000
NODE_ENV=development

# 2FA
APP_NAME=SecureVault
ISSUER=SecureVault

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=SecureVault
```

### Test Environment (CI/CD)

```env
NODE_ENV=test
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=test_db
DB_USER=test_user
DB_PASSWORD=test_password
JWT_SECRET=test_jwt_secret_key
```

## Quick Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm start                # Start production server

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run test:ci          # Run tests for CI/CD

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors

# Security
npm audit                # Check for vulnerabilities
npm audit fix            # Fix vulnerabilities
npm run security:scan    # Run security scan

# Database
npm run seed             # Seed database
npm run seed:dev         # Seed development database

# Build
npm run build            # Build for production
```

## Getting Help

### Documentation
- [Testing Documentation](./TESTING.md)
- [CI/CD Pipeline Documentation](./CI-CD-PIPELINE.md)
- [Project Summary](./PROJECT-SUMMARY.md)

### Resources
- GitHub Issues: Report bugs and issues
- GitHub Discussions: Ask questions
- Pull Requests: Contribute code

### Support Channels
- Email: [team contact]
- Slack: [workspace link]
- Discord: [server link]

## Next Steps

1. ✅ Setup local development environment
2. ✅ Run tests locally to verify setup
3. ✅ Create a feature branch
4. ✅ Make changes with tests
5. ✅ Run all tests and checks
6. ✅ Commit and push changes
7. ✅ Create pull request
8. ✅ Wait for CI/CD pipeline
9. ✅ Address review comments
10. ✅ Merge to main

---

**Happy Testing! 🚀**

For detailed information, refer to the complete documentation files.
