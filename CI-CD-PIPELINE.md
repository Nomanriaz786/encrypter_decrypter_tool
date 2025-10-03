# CI/CD Pipeline with Integrated Security Scanning

This document explains the DevSecOps CI/CD pipeline implementation for the Secure Encryption/Decryption Tool.

## Pipeline Overview

The CI/CD pipeline integrates security at every stage (Shift-Left Security) and includes:
- Automated testing
- Code quality analysis
- Static Application Security Testing (SAST)
- Dynamic Application Security Testing (DAST)
- Dependency vulnerability scanning
- Container security scanning
- Automated builds and deployments

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Code Push / PR                          │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│              Job 1: Code Quality Check                      │
│              - ESLint (Backend & Frontend)                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│ Job 2: Backend   │  │ Job 3: Frontend  │
│ Unit Tests       │  │ Unit Tests       │
│ + Coverage       │  │ + Coverage       │
└────────┬─────────┘  └─────────┬────────┘
         │                      │
         └──────────┬───────────┘
                    ▼
┌─────────────────────────────────────────────────────────────┐
│              Job 4: SAST - SonarCloud                       │
│              - Code Quality + Security Analysis             │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┬──────────────┐
        ▼                     ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Job 5:       │  │ Job 6:       │  │ Job 7:       │
│ Python       │  │ Dependency   │  │ DAST         │
│ Security     │  │ Scan         │  │ OWASP ZAP    │
│ (Bandit)     │  │ (npm audit)  │  │              │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┴─────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │ Job 8: Container Security      │
        │ Scan (Trivy)                   │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ Job 9: Build & Deploy          │
        │ (main branch only)             │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ Job 10: Security Report        │
        │ Summary                        │
        └────────────────────────────────┘
```

## Security Tools Integration

### 1. SonarCloud (SAST)
**Purpose**: Static code analysis for code quality and security vulnerabilities

**Configuration**: `sonar-project.properties`

**Detects**:
- Code smells
- Bugs
- Security vulnerabilities
- Code duplication
- Test coverage

**Quality Gates**:
- Minimum 70% code coverage
- No critical bugs
- No security hotspots
- Maintainability rating A-B

**Setup**:
1. Create account on [SonarCloud](https://sonarcloud.io/)
2. Import GitHub repository
3. Add `SONAR_TOKEN` to GitHub Secrets
4. Pipeline will automatically run analysis

### 2. OWASP ZAP (DAST)
**Purpose**: Dynamic security testing of running application

**Configuration**: `.zap/rules.tsv`

**Tests**:
- SQL Injection
- Cross-Site Scripting (XSS)
- Cross-Site Request Forgery (CSRF)
- Security headers
- Authentication bypass
- Session management

**Modes**:
- **Baseline Scan**: Quick passive scan
- **Full Scan**: Active attack simulation
- **API Scan**: REST API specific tests

**Reports**: HTML format uploaded as GitHub artifact

### 3. Bandit (Python Security)
**Purpose**: Security vulnerability scanner for Python code

**Configuration**: `pyproject.toml`

**Checks**:
- SQL injection vulnerabilities
- Use of insecure functions
- Hard-coded passwords/tokens
- Weak cryptographic practices
- Command injection risks

**Output**: JSON and text reports

### 4. npm audit
**Purpose**: Identify known vulnerabilities in dependencies

**Scans**:
- Backend dependencies
- Frontend dependencies
- Transitive dependencies

**Severity Levels**:
- Critical
- High
- Moderate
- Low

**Actions**:
- Fails on critical/high vulnerabilities
- Generates detailed reports
- Suggests updates/fixes

### 5. Trivy
**Purpose**: Container and filesystem vulnerability scanner

**Scans**:
- OS packages
- Application dependencies
- Configuration issues
- Secrets in code

**Output**: SARIF format for GitHub Security tab

## Pipeline Triggers

### Automatic Triggers
- **Push to main**: Full pipeline + deployment
- **Push to develop**: Full pipeline (no deployment)
- **Pull Request**: Full pipeline (no deployment or DAST)
- **Daily Schedule**: Security scans at 2 AM UTC

### Manual Triggers
- Can be triggered manually from GitHub Actions tab
- Useful for testing pipeline changes

## Environment Variables

### Required Secrets (GitHub Repository Settings)
```
SONAR_TOKEN              # SonarCloud authentication token
GITHUB_TOKEN            # Automatically provided by GitHub
```

### Environment Variables (Set in Pipeline)
```
NODE_VERSION=18.x       # Node.js version
PYTHON_VERSION=3.9      # Python version
DB_HOST=127.0.0.1       # Test database host
DB_NAME=test_db         # Test database name
DB_USER=test_user       # Test database user
DB_PASSWORD=test_pass   # Test database password
JWT_SECRET=test_secret  # Test JWT secret
```

## Pipeline Jobs Details

### Job 1: Code Quality Check
- Runs ESLint on backend and frontend
- Checks code style and patterns
- Identifies potential bugs
- **Duration**: ~2 minutes

### Job 2: Backend Tests
- Sets up MySQL test database
- Runs Jest tests
- Generates coverage report
- Uploads to Codecov
- **Duration**: ~5 minutes

### Job 3: Frontend Tests
- Runs Vitest tests
- Generates coverage report
- Uploads to Codecov
- **Duration**: ~3 minutes

### Job 4: SAST Scan
- SonarCloud analysis
- Security vulnerability detection
- Code quality metrics
- Test coverage integration
- **Duration**: ~3 minutes

### Job 5: Python Security
- Bandit security scan
- Detects Python security issues
- Generates JSON and text reports
- **Duration**: ~1 minute

### Job 6: Dependency Scan
- npm audit on backend
- npm audit on frontend
- Generates vulnerability reports
- **Duration**: ~2 minutes

### Job 7: DAST Scan
- Starts backend server
- Runs OWASP ZAP scan
- Tests running application
- Generates HTML report
- **Duration**: ~10 minutes
- **Runs**: Only on main branch pushes

### Job 8: Container Security
- Trivy filesystem scan
- Vulnerability detection
- SARIF report to GitHub Security
- **Duration**: ~3 minutes

### Job 9: Build & Deploy
- Build frontend assets
- Prepare backend for deployment
- Upload build artifacts
- **Duration**: ~4 minutes
- **Runs**: Only on main branch pushes

### Job 10: Security Summary
- Aggregates all security reports
- Generates summary
- Posts to GitHub Step Summary
- **Duration**: ~1 minute

## Viewing Reports

### Test Coverage
1. Go to Actions tab
2. Click on workflow run
3. View coverage in job logs
4. Download coverage artifacts
5. Visit [Codecov](https://codecov.io/) for visual reports

### Security Reports
1. **SonarCloud**: Visit project dashboard
2. **OWASP ZAP**: Download HTML artifact from job
3. **Bandit**: Download JSON artifact
4. **npm audit**: View in job logs or download artifacts
5. **Trivy**: View in GitHub Security tab

### Build Artifacts
1. Go to completed workflow run
2. Scroll to "Artifacts" section
3. Download available artifacts:
   - Build artifacts
   - Coverage reports
   - Security scan reports

## Quality Gates

### Tests Must Pass
- All unit tests pass
- All integration tests pass
- Code coverage ≥ 70%

### Security Gates
- No critical vulnerabilities (SAST)
- No high-severity dependency issues
- OWASP ZAP scan with acceptable risk
- Bandit scan passes

### Code Quality Gates
- SonarCloud quality gate passes
- Maintainability rating ≥ B
- Reliability rating ≥ B
- Security rating ≥ A

## Troubleshooting

### Pipeline Fails on Tests
```bash
# Run tests locally
cd backend
npm test

# Check specific test
npm test -- auth.test.js
```

### SonarCloud Analysis Fails
- Check `SONAR_TOKEN` secret is set
- Verify sonar-project.properties configuration
- Ensure project exists in SonarCloud

### OWASP ZAP Scan Issues
- Verify backend starts successfully
- Check ZAP rules configuration
- Review false positives

### Dependency Audit Fails
```bash
# Check vulnerabilities
npm audit

# Try to fix automatically
npm audit fix

# Update specific packages
npm update package-name
```

## Best Practices

### Committing Code
1. Run tests locally before pushing
2. Fix linting errors
3. Ensure coverage doesn't drop
4. Review security scan results

### Pull Requests
1. Wait for all checks to pass
2. Review security scan findings
3. Address code quality issues
4. Maintain test coverage

### Security
1. Never commit secrets
2. Use environment variables
3. Review dependency updates
4. Monitor security advisories

## Pipeline Optimization

### Speed Improvements
- Cache dependencies (`cache: 'npm'`)
- Run independent jobs in parallel
- Use `continue-on-error` for non-critical jobs
- Limit max workers in tests

### Cost Optimization
- Skip DAST on every commit (main only)
- Use scheduled scans for non-critical checks
- Cache build artifacts
- Optimize test suite

## Monitoring

### Metrics to Track
- Pipeline success rate
- Average execution time
- Security vulnerability trends
- Test coverage trends
- Deployment frequency

### Alerts
Set up notifications for:
- Pipeline failures
- Security vulnerabilities found
- Coverage drops below threshold
- Deployment failures

## Continuous Improvement

### Regular Reviews
- Weekly: Review pipeline performance
- Monthly: Analyze security trends
- Quarterly: Update tools and dependencies

### Updates
- Keep GitHub Actions up to date
- Update security scanning tools
- Upgrade Node.js and dependencies
- Review and update quality gates

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [SonarCloud Documentation](https://docs.sonarcloud.io/)
- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)
- [npm audit Documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [Bandit Documentation](https://bandit.readthedocs.io/)

## Support

For issues or questions:
1. Check GitHub Actions logs
2. Review tool-specific documentation
3. Check GitHub Issues
4. Contact DevSecOps team
