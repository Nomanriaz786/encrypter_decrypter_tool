# Secure Encryption/Decryption Tool

A full-stack application providing secure data encryption, decryption, and integrity validation with a modern web interface.

## Features

### 🔐 Encryption & Decryption
- **AES Encryption**: Support for 128, 192, and 256-bit keys
- **RSA Encryption**: Support for 1024, 2048, and 4096-bit keys
- **Real-time Processing**: Instant encryption/decryption with visual feedback

### 🔍 File Hashing & Integrity
- **Multiple Algorithms**: MD5, SHA-256, SHA-512
- **Integrity Verification**: Detect file tampering
- **Hash Comparison**: Side-by-side hash validation

### 🔑 Key Management
- **Generate Keys**: Create AES and RSA key pairs
- **Save/Load Keys**: Secure key storage and retrieval
- **Key Revocation**: Disable compromised keys
- **Export/Import**: Backup and restore keys

### ✍️ Digital Signatures
- **Document Signing**: RSA-SHA256, RSA-SHA512, ECDSA-SHA256
- **Signature Verification**: Validate document authenticity
- **Timestamp Support**: Signed timestamps for legal validity

### 🛡️ Security Features
- **RBAC**: Role-based access control
- **2FA**: Two-factor authentication with TOTP
- **JWT**: Secure token-based authentication
- **Audit Logging**: Complete security event tracking
- **Rate Limiting**: DDoS protection

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Hook Form** for form handling
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **MySQL** with Sequelize ORM
- **JWT** for authentication
- **Speakeasy** for 2FA
- **Crypto** for encryption operations
- **Helmet** for security headers

## Project Structure

```
encrypter/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   └── package.json
├── backend/                 # Node.js API
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   └── config/         # Configuration
│   └── package.json
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- MySQL 8.0+
- XAMPP (recommended for Windows)

### Database Setup
1. Start XAMPP and ensure MySQL is running
2. Create a database named `encryption_tool`:
```sql
CREATE DATABASE encryption_tool;
```

### Backend Setup
1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Start the development server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup
1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/2fa/setup` - Setup 2FA
- `POST /api/auth/2fa/verify` - Verify 2FA
- `GET /api/auth/profile` - Get user profile

### Cryptography
- `POST /api/crypto/encrypt` - Encrypt data
- `POST /api/crypto/decrypt` - Decrypt data
- `POST /api/crypto/hash` - Generate hash
- `POST /api/crypto/verify-integrity` - Verify file integrity
- `POST /api/crypto/generate-key` - Generate random key

### Key Management
- `GET /api/keys` - List user keys
- `POST /api/keys` - Save new key
- `POST /api/keys/generate` - Generate and save key
- `PUT /api/keys/:id` - Update key
- `DELETE /api/keys/:id` - Delete key
- `POST /api/keys/:id/revoke` - Revoke key

### Digital Signatures
- `POST /api/signatures/sign` - Sign data
- `POST /api/signatures/verify` - Verify signature
- `POST /api/signatures/sign-document` - Sign document with metadata
- `POST /api/signatures/verify-document` - Verify document signature

## Security Considerations

### Production Deployment
- Use strong JWT secrets (256-bit minimum)
- Enable HTTPS for all communications
- Set secure environment variables
- Use database connection pooling
- Implement proper logging and monitoring
- Regular security audits

### Key Management
- Never store private keys in plain text
- Use hardware security modules (HSM) for production
- Implement key rotation policies
- Regular key backup and recovery procedures

## Development

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests  
cd frontend && npm test
```

### Building for Production
```bash
# Build frontend
cd frontend && npm run build

# Backend is ready for production
cd backend && npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Contact the development team

---

**⚠️ Security Notice**: This tool handles sensitive cryptographic operations. Always follow security best practices and never use in production without proper security review.