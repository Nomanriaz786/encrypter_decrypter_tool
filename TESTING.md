# Testing Strategy and Implementation

## Overview
This document outlines the comprehensive testing strategy for the Secure Encryption/Decryption Tool, following DevSecOps best practices and ICT932 assessment requirements.

## Testing Framework

### Backend Testing
- **Framework**: Jest with Supertest
- **Coverage Tool**: Jest Coverage (Istanbul)
- **Target Coverage**: 70% minimum (branches, functions, lines, statements)

### Frontend Testing
- **Framework**: Vitest (Vite's testing framework)
- **Component Testing**: React Testing Library
- **Coverage Tool**: Vitest Coverage

## Test Types

### 1. Unit Tests
Tests individual functions and components in isolation.

**Backend Unit Tests:**
- `tests/auth.test.js` - Authentication logic
- `tests/crypto.test.js` - Encryption/decryption functions
- `tests/keys.test.js` - Key management operations
- `tests/signatures.test.js` - Digital signature generation/verification

**Frontend Unit Tests:**
- Component rendering tests
- Hook functionality tests
- Utility function tests

### 2. Integration Tests
Tests interactions between multiple components/modules.

**Covered Areas:**
- API endpoint integration
- Database operations
- Authentication flow
- Encryption/decryption pipeline
- Key management workflow

### 3. Security Tests

#### SAST (Static Application Security Testing)
- **Tool**: SonarCloud
- **Scans**: Code quality, security vulnerabilities, code smells
- **Integration**: GitHub Actions CI/CD pipeline

#### DAST (Dynamic Application Security Testing)
- **Tool**: OWASP ZAP
- **Scans**: Runtime vulnerabilities, injection attacks, XSS
- **Frequency**: On every push to main branch

#### Dependency Scanning
- **Tool**: npm audit
- **Scans**: Known vulnerabilities in dependencies
- **Frequency**: Daily and on every push

#### Python Security Scanning
- **Tool**: Bandit
- **Scans**: Python code security issues
- **Configuration**: `pyproject.toml`

#### Container Security
- **Tool**: Trivy
- **Scans**: Container image vulnerabilities
- **Integration**: CI/CD pipeline

## Test Execution

### Running Tests Locally

#### Backend Tests
```bash
cd backend

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- auth.test.js
```

#### Frontend Tests
```bash
cd frontend

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### CI/CD Pipeline Tests
Tests run automatically on:
- Push to main or develop branches
- Pull requests to main or develop
- Daily scheduled runs (2 AM UTC)

## Test Coverage Requirements

### Minimum Coverage Targets
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Excluded from Coverage
- Configuration files (`*.config.js`)
- Test files (`*.test.js`, `*.spec.js`)
- Server entry point (`server.js`)
- Seed files (`seed.js`)

## Security Testing Details

### SonarCloud Configuration
- **Project Key**: `Nomanriaz786_encrypter_decrypter_tool`
- **Organization**: `nomanriaz786`
- **Quality Gate**: Default (Must Pass)
- **Coverage Report**: Integrated from Jest/Vitest

### OWASP ZAP Scanning
- **Mode**: Baseline scan
- **Target**: Backend API (http://localhost:5000)
- **Rules**: Custom rules defined in `.zap/rules.tsv`
- **Report**: HTML format uploaded as artifact

### Bandit Configuration
- **Excluded Directories**: tests, __pycache__, node_modules
- **Skipped Tests**: B101 (assert_used)
- **Output**: JSON and TXT formats

## Test Scenarios

### Authentication Tests
1. User registration with valid data
2. Registration validation (email, password, username)
3. User login with correct credentials
4. Login with incorrect credentials
5. 2FA setup and verification
6. Profile retrieval and updates
7. Password change functionality
8. Token-based authentication

### Cryptography Tests
1. AES-128/256 encryption and decryption
2. RSA-2048/4096 encryption and decryption
3. Key generation for various algorithms
4. Hash generation (MD5, SHA-256, SHA-512)
5. Data integrity verification
6. Invalid algorithm handling
7. Empty data handling

### Key Management Tests
1. Key creation and storage
2. Key retrieval (all and by ID)
3. Key updates (name, expiration)
4. Key revocation
5. Key deletion
6. Key export functionality
7. Revoked key restrictions

### Digital Signature Tests
1. Signature generation with RSA private key
2. Signature verification with public key
3. Document signing with metadata
4. Tampered document detection
5. Invalid key handling

## Continuous Integration

### GitHub Actions Workflow
The CI/CD pipeline includes 10 jobs:

1. **code-quality**: ESLint checks
2. **backend-tests**: Unit and integration tests
3. **frontend-tests**: Component and unit tests
4. **sast-scan**: SonarCloud analysis
5. **python-security**: Bandit security scan
6. **dependency-scan**: npm audit
7. **dast-scan**: OWASP ZAP scan
8. **container-scan**: Trivy vulnerability scan
9. **build-deploy**: Build artifacts
10. **security-summary**: Consolidated security report

### Quality Gates
- All tests must pass
- Code coverage ≥ 70%
- No critical security vulnerabilities
- SonarCloud quality gate must pass
- No high-severity dependency vulnerabilities

## Test Data Management

### Test Database
- **Type**: MySQL 8.0
- **Mode**: In-memory for CI/CD
- **Reset**: Database cleared between test suites
- **Seed Data**: Created programmatically in tests

### Test Users
```javascript
{
  username: 'testuser',
  email: 'test@example.com',
  password: 'Test123!@#',
  firstName: 'Test',
  lastName: 'User'
}
```

## Reporting

### Coverage Reports
- **Format**: LCOV, HTML, Text
- **Location**: `backend/coverage/`, `frontend/coverage/`
- **Upload**: Codecov for visualization

### Security Reports
- **SonarCloud**: Dashboard view
- **OWASP ZAP**: HTML report artifact
- **Bandit**: JSON and TXT reports
- **npm audit**: JSON reports for both projects

### CI/CD Summary
- Job status overview
- Test execution times
- Coverage percentages
- Security scan results
- Artifact downloads

## Best Practices

### Writing Tests
1. Follow AAA pattern (Arrange, Act, Assert)
2. One assertion per test
3. Descriptive test names
4. Independent tests (no shared state)
5. Mock external dependencies
6. Clean up after tests

### Security Testing
1. Test authentication on all endpoints
2. Validate input sanitization
3. Test SQL injection prevention
4. Verify XSS protection
5. Check CSRF token implementation
6. Test rate limiting
7. Verify encryption strength

### Maintaining Tests
1. Update tests with code changes
2. Review test coverage regularly
3. Refactor flaky tests
4. Keep test data minimal
5. Document complex test scenarios

## Troubleshooting

### Common Issues

**Tests failing locally but passing in CI:**
- Check environment variables
- Verify database connection
- Check Node.js version

**Low coverage:**
- Add tests for uncovered branches
- Test error handling paths
- Cover edge cases

**Slow tests:**
- Use test.concurrent for independent tests
- Mock external API calls
- Optimize database queries

**Flaky tests:**
- Add proper wait conditions
- Avoid time-dependent tests
- Clean up state properly

## Future Enhancements

1. **Performance Testing**: Load testing with Artillery or k6
2. **E2E Testing**: Playwright or Cypress for full user flows
3. **Visual Regression**: Percy or Chromatic for UI changes
4. **API Testing**: Postman/Newman for API contracts
5. **Mutation Testing**: Stryker for test quality
6. **Chaos Engineering**: Test resilience under failures

## References

- [Jest Documentation](https://jestjs.io/)
- [Supertest GitHub](https://github.com/visionmedia/supertest)
- [OWASP ZAP](https://www.zaproxy.org/)
- [SonarCloud](https://sonarcloud.io/)
- [Bandit Documentation](https://bandit.readthedocs.io/)
