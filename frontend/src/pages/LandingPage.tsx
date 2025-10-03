import { Shield, Lock, Key, FileCheck, Signature, Users, ArrowRight, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="ml-3 text-2xl font-bold text-gray-900">SecureVault</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
              <a href="#security" className="text-gray-600 hover:text-gray-900">Security</a>
              <a href="#about" className="text-gray-600 hover:text-gray-900">About</a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900">Contact</a>
            </nav>
            <div className="flex items-center space-x-4">
              <Link 
                to="/login" 
                className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md font-medium"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Military-Grade <span className="text-blue-600">Encryption</span>
            <br />for Your Digital Assets
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Protect your sensitive data with advanced AES & RSA encryption, 
            digital signatures, and comprehensive security tools. Built for 
            professionals who demand the highest level of data protection.
          </p>
          <div className="flex justify-center space-x-4 mb-12">
            <Link 
              to="/register" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium inline-flex items-center"
            >
              <Shield className="h-5 w-5 mr-2" />
              Create Account
            </Link>
            <Link 
              to="/login" 
              className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 font-medium inline-flex items-center"
            >
              <ArrowRight className="h-5 w-5 mr-2" />
              Sign In
            </Link>
          </div>

          {/* Feature Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">256-bit</div>
              <div className="text-gray-600">AES Encryption</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">4096-bit</div>
              <div className="text-gray-600">RSA Keys</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">Military</div>
              <div className="text-gray-600">Grade Security</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">Zero</div>
              <div className="text-gray-600">Data Collection</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Comprehensive Security Suite</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to protect, encrypt, and manage your digital assets 
              with enterprise-grade security tools.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Advanced Encryption */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:border-blue-200 transition-colors">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <Lock className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Advanced Encryption</h3>
              <p className="text-gray-600 mb-6">
                State-of-the-art AES and RSA encryption algorithms to secure your data with 
                military-grade protection.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  AES 128/192/256-bit encryption
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  RSA 1024/2048/4096-bit encryption
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Hybrid encryption for large files
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Perfect forward secrecy
                </li>
              </ul>
            </div>

            {/* Digital Signatures */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:border-blue-200 transition-colors">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <Signature className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Digital Signatures</h3>
              <p className="text-gray-600 mb-6">
                Create and verify digital signatures for document authenticity and 
                integrity with cryptographic proof.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  RSA digital signatures
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Document integrity verification
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Timestamp authentication
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Non-repudiation guarantee
                </li>
              </ul>
            </div>

            {/* Key Management */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:border-blue-200 transition-colors">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <Key className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Management</h3>
              <p className="text-gray-600 mb-6">
                Comprehensive key lifecycle management with secure generation, 
                storage and revocation capabilities.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Secure key generation
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Key import/export
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Automatic key rotation
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Hardware security module support
                </li>
              </ul>
            </div>

            {/* File Integrity */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:border-blue-200 transition-colors">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <FileCheck className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">File Integrity</h3>
              <p className="text-gray-600 mb-6">
                Advanced hash algorithms to verify file integrity and detect any unauthorized 
                modifications or tampering.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  MD5, SHA-1, SHA-256, SHA-512
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Batch file processing
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Integrity monitoring
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Tamper detection alerts
                </li>
              </ul>
            </div>

            {/* Role-Based Access */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:border-blue-200 transition-colors">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Role-Based Access</h3>
              <p className="text-gray-600 mb-6">
                Granular permission system with role-based access control to manage user 
                privileges and system security.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Multi-user support
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Granular permissions
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Two-factor authentication
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Session management
                </li>
              </ul>
            </div>

            {/* Audit & Compliance */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:border-blue-200 transition-colors">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Audit & Compliance</h3>
              <p className="text-gray-600 mb-6">
                Comprehensive audit logging and compliance capabilities to meet regulatory 
                requirements and security standards.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Complete audit trails
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Security event monitoring
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Compliance reporting
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Real-time alerts
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Security Architecture Section */}
      <section id="security" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Enterprise-Grade Security Architecture</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built with security-first principles, our platform employs multiple 
              layers of protection to safeguard your most sensitive information.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Zero-Knowledge Architecture</h3>
                  <p className="text-gray-600">Your data never leaves your environment unencrypted. Our zero-knowledge architecture ensures that only you have access to your sensitive information.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Key Storage</h3>
                  <p className="text-gray-600">Keys are encrypted and stored with additional protection layers. Support for hardware security modules and secure enclaves.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Privacy by Design</h3>
                  <p className="text-gray-600">No telemetry, tracking, or data collection - completely private. Open architecture for security auditing and verification.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Open Architecture</h3>
                  <p className="text-gray-600">Transparent codebase for security auditing and verification. Industry-standard protocols and algorithms.</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-600 text-white p-8 rounded-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Your Data, Your Control</h3>
                <p className="text-blue-100 mb-6">
                  Military-grade encryption ensures that only you have access to 
                  your sensitive information. Our zero-knowledge architecture 
                  means we cannot access your data even if we wanted to.
                </p>
                <Link 
                  to="/register" 
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 font-medium inline-block"
                >
                  Get Started Today
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Secure Your Digital Assets?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of professionals who trust SecureVault to protect their most sensitive data.
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              to="/register" 
              className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 font-medium inline-flex items-center"
            >
              <Shield className="h-5 w-5 mr-2" />
              Start Free Trial
            </Link>
            <Link 
              to="/login" 
              className="border border-white text-white px-8 py-3 rounded-lg hover:bg-white/10 font-medium"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-white">SecureVault</span>
              </div>
              <p className="text-sm">
                Professional encryption and security tools for protecting your digital 
                assets. Built with privacy and security at core principles.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-sm">
                <li>AES/RSA Encryption</li>
                <li>Digital Signatures</li>
                <li>Key Management</li>
                <li>File Integrity</li>
                <li>User Management</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Security</h3>
              <ul className="space-y-2 text-sm">
                <li>Security Architecture</li>
                <li>Privacy Policy</li>
                <li>Security Audit</li>
                <li>Compliance</li>
                <li>Best Practices</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li>Documentation</li>
                <li>API Reference</li>
                <li>Support Center</li>
                <li>Community Forum</li>
                <li>Launch Application</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2025 SecureVault. All rights reserved. Built for secure encryption and digital asset protection.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}