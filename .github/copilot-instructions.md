# Secure Encryption/Decryption Tool

## Project Overview
Full-stack application with React frontend and Node.js backend for secure data encryption, decryption, and integrity validation.

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS + React Router
- **Backend**: Node.js + Express + MySQL + Sequelize ORM
- **Authentication**: JWT + RBAC + 2FA
- **Cryptography**: AES, RSA, MD5, SHA-256, SHA-512, Digital Signatures

## Key Features
1. **Encryption/Decryption**: AES and RSA with selectable key sizes
2. **File Hashing**: MD5, SHA-256, SHA-512 algorithms
3. **File Integrity**: Tamper detection and verification
4. **Authentication**: Secure login with RBAC and 2FA
5. **Key Management**: Save, load, and revoke cryptographic keys
6. **Digital Signatures**: Generation and verification

## Project Structure
```
/
├── frontend/          # React app
├── backend/           # Node.js API
├── shared/            # Common utilities
└── docs/              # Documentation
```

## Development Guidelines
- Use TypeScript for type safety
- Follow security best practices for crypto operations
- Implement proper error handling and validation
- Use environment variables for sensitive configuration
- Follow REST API conventions
- Implement comprehensive logging and monitoring