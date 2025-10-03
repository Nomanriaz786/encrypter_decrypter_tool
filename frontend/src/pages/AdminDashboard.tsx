import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Navigation } from '../components'
import { adminAPI } from '../services/api'
import toast from 'react-hot-toast'
import {
  Users,
  CheckCircle,
  Key,
  Lock,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Ban,
  XCircle
} from 'lucide-react'

interface SystemStats {
  totalUsers: number
  activeUsers: number
  totalKeys: number
  encryptionOperations: number
  systemUptime: string
  storageUsed: string
  lastBackup: string
}

interface User {
  id: string
  username: string
  email: string
  role: string
  status: 'active' | 'inactive' | 'banned'
  lastLogin: string
  createdAt: string
  twoFactorEnabled: boolean
}

interface AuditLog {
  id: string
  userId: string
  username: string
  action: string
  resource: string
  timestamp: string
  ipAddress: string
  status: 'success' | 'failed'
  details: string
}

interface SystemHealth {
  cpu: number
  memory: number
  disk: number
  network: 'good' | 'warning' | 'critical'
  database: 'connected' | 'disconnected'
  backupStatus: 'recent' | 'overdue' | 'failed'
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Determine current section from URL params
  const getCurrentSection = () => {
    const urlParams = new URLSearchParams(location.search)
    const tab = urlParams.get('tab')
    return tab || 'overview'
  }
  
  const [currentSection, setCurrentSection] = useState(getCurrentSection())
  
  // Update section when URL changes
  useEffect(() => {
    setCurrentSection(getCurrentSection())
  }, [location.search])
  
  // Data states
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalKeys: 0,
    encryptionOperations: 0,
    systemUptime: '0 days',
    storageUsed: '0 GB',
    lastBackup: 'Never'
  })
  
  const [users, setUsers] = useState<User[]>([])
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    cpu: 45,
    memory: 67,
    disk: 34,
    network: 'good',
    database: 'connected',
    backupStatus: 'recent'
  })
  
  const [searchTerm, setSearchTerm] = useState('')
  
  useEffect(() => {
    // Check if user is admin
    if (user?.role !== 'admin') {
      navigate('/dashboard')
      return
    }
    
    loadAdminData()
  }, [user, navigate])

  const loadAdminData = async () => {
    try {
      // Load real data from admin APIs
      const [statsResponse, usersResponse, auditResponse, healthResponse] = await Promise.all([
        adminAPI.getSystemStats(),
        adminAPI.getUsers({ limit: 50 }),
        adminAPI.getAuditLogs({ limit: 50 }),
        adminAPI.getSystemHealth()
      ])
      
      const statsData = statsResponse.data
      const usersData = usersResponse.data.users || []
      const auditData = auditResponse.data.auditLogs || []
      const healthData = healthResponse.data
      
      // Set real stats
      setStats({
        totalUsers: statsData.totalUsers || 0,
        activeUsers: statsData.activeUsers || 0,
        totalKeys: statsData.totalKeys || 0,
        encryptionOperations: statsData.encryptionOperations || 0,
        systemUptime: statsData.systemUptime || '0 days',
        storageUsed: statsData.storageUsed || '0 GB',
        lastBackup: statsData.lastBackup || 'Never'
      })
      
      // Set real users data
      setUsers(usersData)
      
      // Set real activity logs (recent for overview)
      setRecentActivity(auditData.slice(0, 5))
      
      // Set all audit logs (for audit section)
      setAuditLogs(auditData)
      
      // Update system health
      setSystemHealth(healthData)
      
    } catch (error) {
      console.error('Error loading admin data:', error)
      toast.error('Failed to load admin data')
      
      // Set fallback data
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        totalKeys: 0,
        encryptionOperations: 0,
        systemUptime: '0 days',
        storageUsed: '0 GB',
        lastBackup: 'Never'
      })
      
      setUsers([])
      setRecentActivity([])
      setAuditLogs([])
    }
  }

  const handleUserAction = async (userId: string, action: 'activate' | 'deactivate' | 'ban' | 'delete') => {
    try {
      // Call the appropriate admin API endpoint
      switch (action) {
        case 'activate':
          await adminAPI.activateUser(userId)
          break
        case 'deactivate':
          await adminAPI.deactivateUser(userId)
          break
        case 'ban':
          await adminAPI.banUser(userId, 'Banned by admin')
          break
        case 'delete':
          await adminAPI.deleteUser(userId)
          break
      }
      
      // Reload user data after successful action
      await loadAdminData()
      toast.success(`User ${action}d successfully`)
    } catch (error: any) {
      console.error(`Error ${action}ing user:`, error)
      toast.error(error.response?.data?.error || `Failed to ${action} user`)
    }
  }

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'inactive': return 'text-yellow-600 bg-yellow-100'
      case 'banned': return 'text-red-600 bg-red-100'
      case 'success': return 'text-green-600 bg-green-100'
      case 'failed': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">System administration and monitoring</p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-green-700 transition-colors duration-200 flex items-center"
              >
                <Users className="h-4 w-4 mr-2" />
                Switch to User View
              </button>
            </div>
          </div>
        </div>

        {/* Content based on current section */}
        {currentSection === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.activeUsers}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Key className="h-6 w-6 text-purple-400" />
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
                      <Lock className="h-6 w-6 text-orange-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Operations</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.encryptionOperations.toLocaleString()}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          {/* System Health */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Health</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                    <span>CPU Usage</span>
                    <span>{systemHealth.cpu}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${systemHealth.cpu}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                    <span>Memory Usage</span>
                    <span>{systemHealth.memory}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${systemHealth.memory}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                    <span>Disk Usage</span>
                    <span>{systemHealth.disk}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${systemHealth.disk}%` }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      systemHealth.database === 'connected' ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                    <span className="text-sm text-gray-700">Database</span>
                  </div>
                  <div className="flex items-center">
                    {(() => {
                      let networkColor = '';
                      if (systemHealth.network === 'good') {
                        networkColor = 'bg-green-400';
                      } else if (systemHealth.network === 'warning') {
                        networkColor = 'bg-yellow-400';
                      } else {
                        networkColor = 'bg-red-400';
                      }
                      return (
                        <div className={`w-3 h-3 rounded-full mr-2 ${networkColor}`}></div>
                      );
                    })()}
                    <span className="text-sm text-gray-700">Network</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Uptime</span>
                  <span className="text-sm font-medium text-gray-900">{stats.systemUptime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Storage Used</span>
                  <span className="text-sm font-medium text-gray-900">{stats.storageUsed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Backup</span>
                  <span className="text-sm font-medium text-gray-900">{stats.lastBackup}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Version</span>
                  <span className="text-sm font-medium text-gray-900">v2.1.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            </div>
            <div className="overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {recentActivity.slice(0, 5).map((log) => (
                  <li key={log.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 w-2 h-2 rounded-full ${
                          log.status === 'success' ? 'bg-green-400' : 'bg-red-400'
                        }`}></div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            {log.username} performed {log.action}
                          </p>
                          <p className="text-sm text-gray-500">{log.details}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">{log.timestamp}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        )}

        {/* Users Section */}
        {currentSection === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
              <div className="flex space-x-3">
                <div className="relative">
                  <Search className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </button>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      2FA
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.username}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.lastLogin}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.twoFactorEnabled ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900" title="View">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-yellow-600 hover:text-yellow-900" title="Edit">
                            <Edit className="h-4 w-4" />
                          </button>
                          {user.status === 'active' ? (
                            <button 
                              onClick={() => handleUserAction(user.id, 'ban')}
                              className="text-red-600 hover:text-red-900" 
                              title="Ban"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleUserAction(user.id, 'activate')}
                              className="text-green-600 hover:text-green-900" 
                              title="Activate"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleUserAction(user.id, 'delete')}
                            className="text-red-600 hover:text-red-900" 
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Audit Logs Section */}
        {currentSection === 'audit' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Audit Logs</h2>
              <div className="flex space-x-3">
                <select className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Actions</option>
                  <option>LOGIN</option>
                  <option>ENCRYPT</option>
                  <option>DECRYPT</option>
                  <option>KEY_GENERATE</option>
                </select>
                <select className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Last 24 hours</option>
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                </select>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {log.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.action}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.resource}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.timestamp}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.ipAddress}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Section */}
        {currentSection === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="require-2fa" className="text-sm font-medium text-gray-700">Require 2FA for all users</label>
                      <p className="text-sm text-gray-500">Force all users to enable two-factor authentication</p>
                    </div>
                    <input id="require-2fa" type="checkbox" className="toggle" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="session-timeout" className="text-sm font-medium text-gray-700">Session timeout</label>
                      <p className="text-sm text-gray-500">Automatically log out inactive users</p>
                    </div>
                    <select id="session-timeout" className="border border-gray-300 rounded-md px-3 py-2">
                      <option>30 minutes</option>
                      <option>1 hour</option>
                      <option>2 hours</option>
                      <option>4 hours</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="key-rotation-interval" className="text-sm font-medium text-gray-700">Key rotation interval</label>
                      <p className="text-sm text-gray-500">Automatically rotate encryption keys</p>
                    </div>
                    <select id="key-rotation-interval" className="border border-gray-300 rounded-md px-3 py-2">
                      <option>30 days</option>
                      <option>60 days</option>
                      <option>90 days</option>
                      <option>Never</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Backup Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="automatic-backups" className="text-sm font-medium text-gray-700">Automatic backups</label>
                      <p className="text-sm text-gray-500">Enable scheduled database backups</p>
                    </div>
                    <input id="automatic-backups" type="checkbox" className="toggle" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="backup-frequency" className="text-sm font-medium text-gray-700">Backup frequency</label>
                      <p className="text-sm text-gray-500">How often to create backups</p>
                    </div>
                    <select id="backup-frequency" className="border border-gray-300 rounded-md px-3 py-2">
                      <option>Daily</option>
                      <option>Weekly</option>
                      <option>Monthly</option>
                    </select>
                  </div>

                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                    Create Backup Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard