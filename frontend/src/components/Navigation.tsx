import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Shield,
  Home,
  Key,
  FileText,
  Users,
  Activity,
  LogOut
} from 'lucide-react'

const Navigation: React.FC = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Automatically detect if user is admin
  const isAdmin = user?.role === 'admin'

  const userNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/keys', label: 'Key Management', icon: Key },
    { path: '/signatures', label: 'Digital Signatures', icon: FileText }
  ]

  const adminNavItems = [
    { path: '/admin', label: 'Overview', icon: Activity },
    { path: '/admin?tab=users', label: 'Users', icon: Users },
    { path: '/admin?tab=audit', label: 'Audit Logs', icon: FileText },
    { path: '/admin?tab=settings', label: 'Settings', icon: Key },
    { path: '/dashboard', label: 'User View', icon: Home }
  ]

  const navItems = isAdmin ? adminNavItems : userNavItems

  const isActivePath = (path: string) => {
    if (path === '/admin' && location.pathname === '/admin' && !location.search) {
      return true
    }
    if (path.includes('?') && location.pathname === '/admin') {
      const urlParams = new URLSearchParams(location.search)
      const pathParams = new URLSearchParams(path.split('?')[1])
      const tabParam = pathParams.get('tab')
      const currentTab = urlParams.get('tab')
      return tabParam === currentTab
    }
    if (path !== '/admin' && path !== '/dashboard' && !path.includes('?')) {
      return location.pathname.startsWith(path)
    }
    return location.pathname === path
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to={isAdmin ? '/admin' : '/dashboard'} className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="ml-3 text-xl font-semibold text-gray-900">
                SecureVault {isAdmin && 'Admin'}
              </span>
            </Link>
          </div>
          
          {/* Navigation Items */}
          <div className="hidden md:flex space-x-8">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`${
                  isActivePath(path)
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                } px-3 py-2 text-sm font-medium flex items-center space-x-2`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Quick Actions for Non-Admin */}
            {!isAdmin && (
              <div className="hidden lg:flex items-center space-x-2">
                <Link
                  to="/keys"
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-md hover:bg-gray-100"
                  title="Manage Keys"
                >
                  <Key className="h-5 w-5" />
                </Link>
                <Link
                  to="/signatures"
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-md hover:bg-gray-100"
                  title="Digital Signatures"
                >
                  <FileText className="h-5 w-5" />
                </Link>
              </div>
            )}

            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <span className="text-sm font-medium text-gray-700">{user?.username}</span>
                  {user?.role === 'admin' && (
                    <span className="ml-2 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`${
                  isActivePath(path)
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium flex items-center space-x-3`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation