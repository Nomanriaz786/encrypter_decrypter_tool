import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Navigation } from '../components'
import { cryptoAPI, keyAPI, dashboardAPI } from '../services/api'
import toast from 'react-hot-toast'
import {
  Shield,
  Key,
  FileText,
  Hash,
  Eye,
  EyeOff,
  ChevronRight,
  Lock,
  Unlock,
  Copy,
  Check
} from 'lucide-react'

interface QuickStats {
  totalKeys: number
  activeKeys: number
  encryptionSessions: number
  lastActivity: string
}

interface RecentActivity {
  id: string
  type: 'encryption' | 'decryption' | 'signing' | 'key_generation'
  description: string
  timestamp: string
  status: 'success' | 'failed'
}

const UserDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'encrypt' | 'decrypt' | 'hash'>('encrypt')
  const [stats, setStats] = useState<QuickStats>({
    totalKeys: 0,
    activeKeys: 0,
    encryptionSessions: 0,
    lastActivity: 'Never'
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(false)
  
  // Encryption/Decryption state
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [algorithm, setAlgorithm] = useState('AES')
  const [keySize, setKeySize] = useState(256)
  const [customKey, setCustomKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Hash state
  const [hashInput, setHashInput] = useState('')
  const [hashOutput, setHashOutput] = useState('')
  const [hashAlgorithm, setHashAlgorithm] = useState('SHA256')
  const [verifyHash, setVerifyHash] = useState('')
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load user's keys and dashboard stats
      const [keysResponse, statsResponse, activityResponse] = await Promise.all([
        keyAPI.getKeys(),
        dashboardAPI.getQuickStats(),
        dashboardAPI.getRecentActivity(5)
      ])
      
      const keys = keysResponse.data.keys || []
      const statsData = statsResponse.data
      const activityData = activityResponse.data.recentActivity || []
      
      // Set stats from real API data
      setStats({
        totalKeys: statsData.totalKeys || keys.length,
        activeKeys: statsData.activeKeys || keys.filter((key: any) => key.status === 'active').length,
        encryptionSessions: statsData.encryptionSessions || 0,
        lastActivity: statsData.lastActivity || 'Never'
      })
      
      // Set recent activity from API
      setRecentActivity(activityData)
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      // Fallback to basic key data if dashboard API fails
      try {
        const keysResponse = await keyAPI.getKeys()
        const keys = keysResponse.data.keys || []
        
        setStats({
          totalKeys: keys.length,
          activeKeys: keys.filter((key: any) => key.status === 'active').length,
          encryptionSessions: 0,
          lastActivity: 'Never'
        })
      } catch (keyError) {
        console.error('Error loading keys:', keyError)
        setStats({
          totalKeys: 0,
          activeKeys: 0,
          encryptionSessions: 0,
          lastActivity: 'Never'
        })
      }
      
      // Set default activity if API fails
      setRecentActivity([
        {
          id: '1',
          type: 'encryption',
          description: 'Welcome! Start by creating your first encryption key.',
          timestamp: new Date().toLocaleTimeString(),
          status: 'success'
        }
      ])
    }
  }

  const handleEncrypt = async () => {
    if (!inputText.trim()) {
      toast.error('Please enter text to encrypt')
      return
    }

    setLoading(true)
    try {
      const response = await cryptoAPI.encrypt({
        text: inputText,
        algorithm,
        keySize,
        key: customKey || undefined
      })
      
      setOutputText(JSON.stringify(response.data.encryptedData, null, 2))
      toast.success('Text encrypted successfully!')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Encryption failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDecrypt = async () => {
    if (!inputText.trim()) {
      toast.error('Please enter encrypted data to decrypt')
      return
    }

    setLoading(true)
    try {
      let encryptedData
      try {
        encryptedData = JSON.parse(inputText)
      } catch {
        toast.error('Invalid encrypted data format')
        return
      }

      const response = await cryptoAPI.decrypt({
        encryptedData,
        algorithm,
        keySize,
        key: customKey || undefined
      })
      
      setOutputText(response.data.decryptedText)
      toast.success('Text decrypted successfully!')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Decryption failed')
    } finally {
      setLoading(false)
    }
  }

  const handleHash = async () => {
    if (!hashInput.trim()) {
      toast.error('Please enter text to hash')
      return
    }

    setLoading(true)
    try {
      const response = await cryptoAPI.hash({
        text: hashInput,
        algorithm: hashAlgorithm
      })
      
      setHashOutput(response.data.hash)
      toast.success('Hash generated successfully!')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Hashing failed')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyIntegrity = async () => {
    if (!hashInput.trim() || !verifyHash.trim()) {
      toast.error('Please enter both text and hash to verify')
      return
    }

    setLoading(true)
    try {
      const response = await cryptoAPI.verifyIntegrity({
        expectedHash: verifyHash,
        actualData: hashInput,
        algorithm: hashAlgorithm
      })
      
      setVerificationResult(response.data.isValid)
      toast.success(response.data.isValid ? 'Hash verification successful!' : 'Hash verification failed!')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Key className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Keys</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalKeys}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Shield className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Keys</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.activeKeys}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Lock className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Sessions</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.encryptionSessions}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Last Activity</dt>
                    <dd className="text-sm font-medium text-gray-900">{stats.lastActivity}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex">
                  {[
                    { id: 'encrypt', label: 'Encrypt', icon: Lock },
                    { id: 'decrypt', label: 'Decrypt', icon: Unlock },
                    { id: 'hash', label: 'Hash', icon: Hash },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id as any)}
                      className={`${
                        activeTab === id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } flex items-center py-2 px-6 border-b-2 font-medium text-sm`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {(activeTab === 'encrypt' || activeTab === 'decrypt') && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Algorithm
                        </label>
                        <select
                          value={algorithm}
                          onChange={(e) => setAlgorithm(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="AES">AES</option>
                          <option value="RSA">RSA</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Key Size
                        </label>
                        <select
                          value={keySize}
                          onChange={(e) => setKeySize(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {algorithm === 'AES' ? (
                            <>
                              <option value={128}>128-bit</option>
                              <option value={192}>192-bit</option>
                              <option value={256}>256-bit</option>
                            </>
                          ) : (
                            <>
                              <option value={1024}>1024-bit</option>
                              <option value={2048}>2048-bit</option>
                              <option value={4096}>4096-bit</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Key (Optional)
                      </label>
                      <div className="relative">
                        <input
                          type={showKey ? 'text' : 'password'}
                          value={customKey}
                          onChange={(e) => setCustomKey(e.target.value)}
                          placeholder="Leave empty to generate automatically"
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowKey(!showKey)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showKey ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {activeTab === 'encrypt' ? 'Text to Encrypt' : 'Encrypted Data to Decrypt'}
                      </label>
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={activeTab === 'encrypt' ? 'Enter text to encrypt...' : 'Paste encrypted data...'}
                      />
                    </div>

                    <button
                      onClick={activeTab === 'encrypt' ? handleEncrypt : handleDecrypt}
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Processing...' : (activeTab === 'encrypt' ? 'Encrypt' : 'Decrypt')}
                    </button>

                    {outputText && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {activeTab === 'encrypt' ? 'Encrypted Data' : 'Decrypted Text'}
                          </label>
                          <button
                            onClick={() => copyToClipboard(outputText)}
                            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                          >
                            {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                            {copied ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <textarea
                          value={outputText}
                          readOnly
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                        />
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'hash' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hash Algorithm
                      </label>
                      <select
                        value={hashAlgorithm}
                        onChange={(e) => setHashAlgorithm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="MD5">MD5</option>
                        <option value="SHA1">SHA-1</option>
                        <option value="SHA256">SHA-256</option>
                        <option value="SHA512">SHA-512</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Text to Hash
                      </label>
                      <textarea
                        value={hashInput}
                        onChange={(e) => setHashInput(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter text to generate hash..."
                      />
                    </div>

                    <button
                      onClick={handleHash}
                      disabled={loading}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Generating...' : 'Generate Hash'}
                    </button>

                    {hashOutput && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Generated Hash
                          </label>
                          <button
                            onClick={() => copyToClipboard(hashOutput)}
                            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                          >
                            {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                            {copied ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <textarea
                          value={hashOutput}
                          readOnly
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                        />
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Verify Hash Integrity</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expected Hash
                        </label>
                        <input
                          type="text"
                          value={verifyHash}
                          onChange={(e) => setVerifyHash(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter hash to verify against..."
                        />
                      </div>

                      <button
                        onClick={handleVerifyIntegrity}
                        disabled={loading}
                        className="w-full mt-4 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Verifying...' : 'Verify Integrity'}
                      </button>

                      {verificationResult !== null && (
                        <div className={`mt-4 p-4 rounded-md ${
                          verificationResult 
                            ? 'bg-green-50 border border-green-200 text-green-800' 
                            : 'bg-red-50 border border-red-200 text-red-800'
                        }`}>
                          <div className="flex items-center">
                            {verificationResult ? (
                              <Check className="h-5 w-5 mr-2" />
                            ) : (
                              <span className="font-bold mr-2">✗</span>
                            )}
                            <span className="font-medium">
                              {verificationResult ? 'Hash verification successful!' : 'Hash verification failed!'}
                            </span>
                          </div>
                          <p className="mt-1 text-sm">
                            {verificationResult 
                              ? 'The data integrity is intact - no tampering detected.'
                              : 'The data has been modified or corrupted - integrity compromised.'
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/keys"
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <Key className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium">Manage Keys</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
                
                <Link
                  to="/signatures"
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium">Digital Signatures</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                      activity.status === 'success' ? 'bg-green-400' : 'bg-red-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserDashboard