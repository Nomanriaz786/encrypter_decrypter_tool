import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Navigation } from '../components'
import { keyAPI, dashboardAPI } from '../services/api'
import {
  Shield,
  Key,
  FileText,
  ChevronRight,
  Lock,
  CheckCircle,
  TrendingUp,
  Clock,
  Star,
  Plus,
  ArrowRight
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
  const [stats, setStats] = useState<QuickStats>({
    totalKeys: 0,
    activeKeys: 0,
    encryptionSessions: 0,
    lastActivity: 'Never'
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to SecureVault</h1>
          <p className="mt-2 text-lg text-gray-600">Your complete encryption and security toolkit</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Key className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Keys</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalKeys}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 px-5 py-3">
              <div className="text-sm">
                <Link to="/keys" className="font-medium text-blue-700 hover:text-blue-900">
                  Manage keys <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Shield className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Keys</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.activeKeys}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-green-50 px-5 py-3">
              <div className="text-sm">
                <span className="font-medium text-green-700">
                  {stats.activeKeys > 0 ? 'Ready for encryption' : 'Create your first key'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Lock className="h-6 w-6 text-purple-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Sessions</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.encryptionSessions}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 px-5 py-3">
              <div className="text-sm">
                <span className="font-medium text-purple-700">Total operations</span>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-orange-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Last Activity</dt>
                    <dd className="text-sm font-medium text-gray-900">{stats.lastActivity}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 px-5 py-3">
              <div className="text-sm">
                <span className="font-medium text-orange-700">Recent usage</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Encrypt & Decrypt Card */}
          <Link to="/encrypt" className="group">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                  <Lock className="h-8 w-8 text-white" />
                </div>
                <ArrowRight className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Encrypt & Decrypt</h3>
              <p className="text-blue-100 text-sm mb-4">
                Secure your data with AES or RSA encryption. Encrypt messages and decrypt them with your keys.
              </p>
              <div className="flex items-center text-white text-sm font-medium">
                <span>Start encrypting</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </div>
            </div>
          </Link>

          {/* Key Management Card */}
          <Link to="/keys" className="group">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                  <Key className="h-8 w-8 text-white" />
                </div>
                <ArrowRight className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Key Management</h3>
              <p className="text-purple-100 text-sm mb-4">
                Generate, import, and manage your cryptographic keys. View key details and control access.
              </p>
              <div className="flex items-center text-white text-sm font-medium">
                <span>Manage keys</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </div>
            </div>
          </Link>

          {/* Digital Signatures Card */}
          <Link to="/signatures" className="group">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <ArrowRight className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Digital Signatures</h3>
              <p className="text-green-100 text-sm mb-4">
                Sign documents and verify authenticity. Create tamper-proof digital signatures.
              </p>
              <div className="flex items-center text-white text-sm font-medium">
                <span>Create signature</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </div>
            </div>
          </Link>

          {/* Hash & Verify Card */}
          <Link to="/hash" className="group">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <ArrowRight className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Hash & Verify</h3>
              <p className="text-orange-100 text-sm mb-4">
                Generate file hashes with MD5, SHA-256, or SHA-512. Verify data integrity.
              </p>
              <div className="flex items-center text-white text-sm font-medium">
                <span>Generate hash</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </div>
            </div>
          </Link>
        </div>

        {/* Security Overview & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Security Overview */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Security Overview</h3>
                <Shield className="h-5 w-5 text-green-500" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Account Security</p>
                      <p className="text-xs text-gray-500">All security features enabled</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">Active</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Key className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Encryption Keys</p>
                      <p className="text-xs text-gray-500">{stats.activeKeys} active keys ready</p>
                    </div>
                  </div>
                  <Link to="/keys" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                    View all
                  </Link>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Usage Statistics</p>
                      <p className="text-xs text-gray-500">{stats.encryptionSessions} total operations</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-gray-500">This month</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Recent Activity */}
          <div className="space-y-6">

            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <Clock className="h-5 w-5 text-gray-400" />
              </div>
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                        activity.status === 'success' ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Clock className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">No recent activity</p>
                  <p className="text-xs text-gray-400">Your actions will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Getting Started Guide (shown when no keys exist) */}
        {stats.totalKeys === 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Star className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-blue-900">Getting Started with SecureVault</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p className="mb-2">You haven't created any encryption keys yet. Here's how to get started:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Create your first encryption key in Key Management</li>
                    <li>Choose between AES (symmetric) or RSA (asymmetric) encryption</li>
                    <li>Start encrypting your sensitive data securely</li>
                    <li>Use digital signatures to verify document authenticity</li>
                  </ol>
                </div>
                <div className="mt-4">
                  <Link
                    to="/keys"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Key
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserDashboard