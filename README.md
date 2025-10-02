# Encryption/Decryption and Hashing Tool

A comprehensive PHP-based web application for secure data encryption, decryption, and integrity validation with advanced key management and digital signature capabilities.

## Features

### Core Functionality
- **AES Encryption**: Support for 128, 192, and 256-bit keys
- **RSA Encryption**: Support for 1024, 2048, and 4096-bit keys
- **Hybrid Encryption**: Automatic RSA+AES for large data
- **File Hashing**: MD5, SHA-256, and SHA-512 algorithms
- **Digital Signatures**: RSA-based signature generation and verification
- **File Integrity Checking**: Detect tampering and verify file authenticity

### Security Features
- **Secure Authentication**: Password hashing with bcrypt
- **Two-Factor Authentication (2FA)**: TOTP-based with QR codes
- **Role-Based Access Control (RBAC)**: Granular permission management
- **CSRF Protection**: Token-based request validation
- **Secure Session Management**: Database-backed sessions
- **Input Validation**: Comprehensive sanitization and validation
- **Audit Logging**: Complete activity tracking

### Key Management
- **Key Generation**: Secure random key generation
- **Key Storage**: Encrypted key storage in database
- **Key Import/Export**: Support for external key management
- **Key Revocation**: Secure key lifecycle management
- **Key Expiration**: Automatic cleanup of expired keys

## Installation

### Requirements
- PHP 7.4 or higher
- MySQL 5.7 or higher
- XAMPP/WAMP or similar local server environment
- OpenSSL extension enabled
- PDO MySQL extension

### Setup Instructions

1. **Clone or Download**
   ```
   Place the project in your web server directory (e.g., C:\xampp\htdocs\encrypter_decrypter)
   ```

2. **Database Setup**
   - Start XAMPP/WAMP and ensure MySQL is running
   - Open a web browser and navigate to:
     ```
     http://localhost/encrypter_decrypter/database/setup.php
     ```
   - This will create the database and tables automatically

3. **Configuration**
   - Edit `config/config.php` to match your environment
   - Update database credentials if needed
   - Change encryption keys for production use

4. **Permissions**
   - Ensure the following directories are writable:
     ```
     uploads/
     keys/
     ```

5. **Access the Application**
   ```
   http://localhost/encrypter_decrypter/
   ```

### Default Credentials
- **Username**: admin
- **Password**: admin123
- **Important**: Change this password immediately after first login!

## Usage

### Authentication
1. **Login**: Use your credentials to access the application
2. **2FA Setup**: Enable two-factor authentication for enhanced security
3. **Registration**: Create new user accounts with proper validation

### Key Management
1. **Generate Keys**:
   - AES keys: Choose 128, 192, or 256-bit strength
   - RSA keys: Choose 1024, 2048, or 4096-bit strength
2. **Import Keys**: Load existing keys from external sources
3. **Export Keys**: Backup keys securely
4. **Revoke Keys**: Disable compromised or unused keys

### Encryption/Decryption
1. **Text Operations**:
   - Enter text to encrypt/decrypt
   - Select algorithm (AES/RSA)
   - Choose appropriate key
   - View results instantly

2. **File Operations**:
   - Upload files for encryption/decryption
   - Automatic format detection
   - Secure file handling

### Hashing and Integrity
1. **File Hashing**:
   - Upload files to generate hashes
   - Multiple algorithms supported
   - Store hashes for future verification

2. **Integrity Verification**:
   - Compare current file hashes with stored values
   - Detect tampering or corruption
   - Batch verification support

### Digital Signatures
1. **Sign Documents**:
   - Create digital signatures for authenticity
   - RSA-based signature algorithms
   - Signature file generation

2. **Verify Signatures**:
   - Validate document authenticity
   - Check signature integrity
   - Timestamp verification

## Security Considerations

### Production Deployment
1. **Change Default Credentials**: Update admin password immediately
2. **Update Configuration**: Modify encryption keys and secrets
3. **Enable HTTPS**: Use SSL/TLS for all communications
4. **Database Security**: Use strong database passwords
5. **File Permissions**: Restrict directory access appropriately
6. **Regular Updates**: Keep PHP and dependencies updated

### Best Practices
- Use strong, unique passwords
- Enable 2FA for all accounts
- Regularly rotate encryption keys
- Monitor audit logs for suspicious activity
- Backup keys securely
- Implement network-level security

## Architecture

### Backend Structure
```
backend/
├── classes/          # Core PHP classes
│   ├── Database.php     # Database connection
│   ├── User.php         # Authentication & user management
│   ├── Security.php     # Security utilities
│   ├── Encryption.php   # Encryption algorithms
│   ├── FileHasher.php   # Hashing functionality
│   ├── KeyManager.php   # Key management
│   └── DigitalSignature.php # Digital signatures
├── api/             # API endpoints
│   ├── auth.php         # Authentication API
│   ├── encryption.php   # Encryption API
│   ├── hashing.php      # Hashing API
│   └── keys.php         # Key management API
```

### Frontend Structure
```
frontend/
├── index.html       # Main application interface
assets/
├── css/
│   └── styles.css   # Application styling
└── js/
    └── app.js       # Frontend application logic
```

### Database Schema
- **users**: User accounts and authentication
- **roles**: Role-based permissions
- **encryption_keys**: Secure key storage
- **file_hashes**: File integrity records
- **digital_signatures**: Signature verification
- **audit_logs**: Security event logging
- **user_sessions**: Session management

## API Documentation

### Authentication Endpoints
- `POST /backend/api/auth.php?action=login`
- `POST /backend/api/auth.php?action=register`
- `POST /backend/api/auth.php?action=logout`
- `POST /backend/api/auth.php?action=enable_2fa`

### Encryption Endpoints
- `POST /backend/api/encryption.php?action=encrypt_text`
- `POST /backend/api/encryption.php?action=decrypt_text`
- `POST /backend/api/encryption.php?action=encrypt_file`
- `POST /backend/api/encryption.php?action=decrypt_file`

### Hashing Endpoints
- `POST /backend/api/hashing.php?action=hash_file`
- `POST /backend/api/hashing.php?action=hash_text`
- `POST /backend/api/hashing.php?action=verify_integrity`

### Key Management Endpoints
- `POST /backend/api/keys.php?action=generate_aes_key`
- `POST /backend/api/keys.php?action=generate_rsa_keypair`
- `POST /backend/api/keys.php?action=get_user_keys`
- `POST /backend/api/keys.php?action=revoke_key`

## Troubleshooting

### Common Issues
1. **Database Connection Error**:
   - Check MySQL service status
   - Verify database credentials in config.php
   - Ensure database exists

2. **File Upload Issues**:
   - Check PHP upload_max_filesize setting
   - Verify directory permissions
   - Ensure sufficient disk space

3. **OpenSSL Errors**:
   - Verify OpenSSL extension is enabled
   - Check PHP configuration
   - Ensure proper key formats

4. **Session Issues**:
   - Clear browser cookies
   - Check session configuration
   - Verify database sessions table

### Support
For technical support or bug reports, please review the code implementation and verify configuration settings.

## License

This project is developed for educational and professional use. Please ensure compliance with local encryption regulations and export controls.

## Contributing

Contributions are welcome! Please ensure all code follows security best practices and includes appropriate documentation.

---

**Important Security Notice**: This application handles sensitive cryptographic operations. Always use HTTPS in production, regularly update dependencies, and follow security best practices for deployment and maintenance.