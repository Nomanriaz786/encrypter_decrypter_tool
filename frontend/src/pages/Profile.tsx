import { useState, useEffect, useRef } from 'react'
import { Navigation } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'
import { User, Mail, Phone, Building, Camera, Lock, Save, X, RefreshCw, Smartphone, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile')
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    department: '',
    profilePicture: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [imagePreview, setImagePreview] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 2FA State
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [show2FADisable, setShow2FADisable] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [manualEntryKey, setManualEntryKey] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [disable2FAData, setDisable2FAData] = useState({
    password: '',
    token: ''
  })
  const [copiedSecret, setCopiedSecret] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const response = await authAPI.getProfile()
      const userData = response.data.user
      setProfileData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phoneNumber: userData.phoneNumber || '',
        department: userData.department || '',
        profilePicture: userData.profilePicture || ''
      })
      // Set image preview with full URL if exists
      const imageUrl = userData.profilePicture 
        ? `http://localhost:5000/uploads/profiles/${userData.profilePicture}`
        : ''
      setImagePreview(imageUrl)
    } catch (error: any) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await authAPI.updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phoneNumber: profileData.phoneNumber,
        department: profileData.department
      })

      // Update user context
      updateUser(response.data.user)
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.response?.data?.error || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB')
      return
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)

    // Upload immediately using FormData
    const formData = new FormData()
    formData.append('profilePicture', file)

    try {
      const response = await authAPI.updateProfilePicture(formData)
      const profilePictureUrl = `http://localhost:5000/uploads/profiles/${response.data.profilePicture}`
      setProfileData({ ...profileData, profilePicture: response.data.profilePicture })
      setImagePreview(profilePictureUrl)
      
      // Update user context
      updateUser({ ...user, profilePicture: response.data.profilePicture })
      toast.success('Profile picture updated!')
    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast.error(error.response?.data?.error || 'Failed to upload image')
      
      // Restore previous image
      const oldUrl = profileData.profilePicture 
        ? `http://localhost:5000/uploads/profiles/${profileData.profilePicture}`
        : ''
      setImagePreview(oldUrl)
      URL.revokeObjectURL(previewUrl)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })

      toast.success('Password changed successfully!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error: any) {
      console.error('Error changing password:', error)
      toast.error(error.response?.data?.error || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveImage = async () => {
    try {
      await authAPI.deleteProfilePicture()
      setImagePreview('')
      setProfileData({ ...profileData, profilePicture: '' })
      updateUser({ ...user, profilePicture: '' })
      toast.success('Profile picture removed')
    } catch (error: any) {
      console.error('Error removing image:', error)
      toast.error('Failed to remove image')
    }
  }

  // 2FA Functions
  const handleSetup2FA = async () => {
    setLoading(true)
    try {
      const response = await authAPI.setup2FA()
      setQrCode(response.data.qrCode)
      setManualEntryKey(response.data.manualEntryKey)
      setShow2FASetup(true)
      toast.success('Scan the QR code with Google Authenticator')
    } catch (error: any) {
      console.error('Error setting up 2FA:', error)
      toast.error(error.response?.data?.error || 'Failed to setup 2FA')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify2FA = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code')
      return
    }

    setLoading(true)
    try {
      await authAPI.verify2FA(verificationCode)
      updateUser({ ...user, twoFactorEnabled: true })
      setShow2FASetup(false)
      setVerificationCode('')
      setQrCode('')
      setManualEntryKey('')
      toast.success('Two-factor authentication enabled!')
    } catch (error: any) {
      console.error('Error verifying 2FA:', error)
      console.error('Response data:', error.response?.data)
      const errorMessage = error.response?.data?.error || error.response?.data?.errors?.[0]?.msg || 'Invalid verification code'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDisable2FA = async () => {
    if (!disable2FAData.password || !disable2FAData.token) {
      toast.error('Please enter your password and 2FA code')
      return
    }

    if (disable2FAData.token.length !== 6) {
      toast.error('Please enter a 6-digit 2FA code')
      return
    }

    setLoading(true)
    try {
      await authAPI.disable2FA(disable2FAData.password, disable2FAData.token)
      updateUser({ ...user, twoFactorEnabled: false })
      setShow2FADisable(false)
      setDisable2FAData({ password: '', token: '' })
      toast.success('Two-factor authentication disabled')
    } catch (error: any) {
      console.error('Error disabling 2FA:', error)
      toast.error(error.response?.data?.error || 'Failed to disable 2FA')
    } finally {
      setLoading(false)
    }
  }

  const handleCopySecret = () => {
    navigator.clipboard.writeText(manualEntryKey)
    setCopiedSecret(true)
    toast.success('Secret key copied!')
    setTimeout(() => setCopiedSecret(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your account information and security settings
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{user?.username?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg"
                      title="Change profile picture"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{user?.username}</h3>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  {user?.role === 'admin' && (
                    <span className="mt-2 px-3 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                      Administrator
                    </span>
                  )}
                </div>

                {imagePreview && (
                  <button
                    onClick={handleRemoveImage}
                    className="w-full flex items-center justify-center px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove Picture
                  </button>
                )}

                <nav className="mt-6 space-y-1">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                      activeTab === 'profile'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <User className="h-5 w-5 mr-3" />
                    Profile Information
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                      activeTab === 'security'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Lock className="h-5 w-5 mr-3" />
                    Security Settings
                  </button>
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {activeTab === 'profile' && (
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Update your personal details and contact information
                    </p>
                  </div>

                  <form onSubmit={handleProfileUpdate} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="profile-firstName" className="block text-sm font-medium text-gray-700 mb-2">
                          First Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            id="profile-firstName"
                            type="text"
                            value={profileData.firstName}
                            onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                            className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="John"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="profile-lastName" className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            id="profile-lastName"
                            type="text"
                            value={profileData.lastName}
                            onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                            className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Doe"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="profile-email" className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            id="profile-email"
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                      </div>

                      <div>
                        <label htmlFor="profile-phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            id="profile-phoneNumber"
                            type="tel"
                            value={profileData.phoneNumber}
                            onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                            className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label htmlFor="profile-department" className="block text-sm font-medium text-gray-700 mb-2">
                          Department
                        </label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            id="profile-department"
                            type="text"
                            value={profileData.department}
                            onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                            className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Engineering, Marketing, etc."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-500">
                        Last login: {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Security Settings</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Manage your password and account security
                    </p>
                  </div>

                  <form onSubmit={handlePasswordChange} className="p-6 space-y-6">
                    <div>
                      <label htmlFor="password-current" className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          id="password-current"
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter current password"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="password-new" className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          id="password-new"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter new password"
                          required
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters</p>
                    </div>

                    <div>
                      <label htmlFor="password-confirm" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          id="password-confirm"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Confirm new password"
                          required
                        />
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <div className="flex">
                        <Lock className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
                        <div className="text-sm text-yellow-800">
                          <p className="font-medium">Password Security Tips:</p>
                          <ul className="mt-2 list-disc list-inside space-y-1 text-xs">
                            <li>Use a mix of uppercase and lowercase letters</li>
                            <li>Include numbers and special characters</li>
                            <li>Avoid common words or personal information</li>
                            <li>Use a unique password not used elsewhere</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-4 border-t border-gray-200">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Changing...
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Change Password
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* 2FA Section */}
                  <div className="px-6 py-6 border-t border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Smartphone className="h-5 w-5 text-gray-700" />
                          <h3 className="text-base font-semibold text-gray-900">Two-Factor Authentication</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {user?.twoFactorEnabled
                            ? 'Two-factor authentication is currently enabled for your account.'
                            : 'Add an extra layer of security to your account by enabling two-factor authentication with Google Authenticator.'}
                        </p>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          user?.twoFactorEnabled
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user?.twoFactorEnabled ? '✓ Enabled' : '⚠ Disabled'}
                        </span>
                      </div>
                      <button
                        onClick={() => user?.twoFactorEnabled ? setShow2FADisable(true) : handleSetup2FA()}
                        disabled={loading}
                        className={`ml-4 px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                          user?.twoFactorEnabled
                            ? 'bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-500'
                            : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                        }`}
                      >
                        {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
                        {!loading && (user?.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2FA Setup Modal */}
        {show2FASetup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Enable Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-600 mt-1">Add an extra layer of security to your account</p>
                </div>
                <button
                  onClick={() => {
                    setShow2FASetup(false)
                    setVerificationCode('')
                    setQrCode('')
                    setManualEntryKey('')
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-6">
                {/* Step 1: Download App */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">1</div>
                    <h4 className="text-sm font-semibold text-gray-900">Download Authenticator App</h4>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">
                    Install Google Authenticator or any TOTP-compatible app on your phone
                  </p>
                </div>

                {/* Step 2: Scan QR Code */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">2</div>
                    <h4 className="text-sm font-semibold text-gray-900">Scan QR Code</h4>
                  </div>
                  <div className="ml-8">
                    <p className="text-sm text-gray-600 mb-4">
                      Open your authenticator app and scan this QR code:
                    </p>
                    {qrCode && (
                      <div className="flex justify-center p-6 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
                        <img src={qrCode} alt="2FA QR Code" className="w-52 h-52" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Manual Entry Option */}
                <div className="ml-8 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Can't scan? Enter this key manually:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={manualEntryKey}
                      readOnly
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleCopySecret}
                      className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                      title="Copy secret key"
                    >
                      {copiedSecret ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Step 3: Enter Code */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">3</div>
                    <h4 className="text-sm font-semibold text-gray-900">Enter Verification Code</h4>
                  </div>
                  <div className="ml-8 space-y-2">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-3xl font-mono tracking-widest"
                    />
                    <p className="text-xs text-gray-500 text-center">
                      Enter the 6-digit code shown in your authenticator app
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShow2FASetup(false)
                    setVerificationCode('')
                    setQrCode('')
                    setManualEntryKey('')
                  }}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerify2FA}
                  disabled={loading || verificationCode.length !== 6}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Verify & Enable
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2FA Disable Modal */}
        {show2FADisable && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Disable Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-600 mt-1">Remove 2FA from your account</p>
                </div>
                <button
                  onClick={() => {
                    setShow2FADisable(false)
                    setDisable2FAData({ password: '', token: '' })
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-5">
                {/* Warning */}
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-800">
                        <span className="font-semibold">Warning:</span> Disabling 2FA will make your account less secure.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="disable2fa-password" className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        id="disable2fa-password"
                        type="password"
                        value={disable2FAData.password}
                        onChange={(e) => setDisable2FAData({ ...disable2FAData, password: e.target.value })}
                        placeholder="Enter your password"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="disable2fa-token" className="block text-sm font-medium text-gray-700 mb-2">
                      2FA Verification Code
                    </label>
                    <input
                      id="disable2fa-token"
                      type="text"
                      value={disable2FAData.token}
                      onChange={(e) => setDisable2FAData({ ...disable2FAData, token: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-center text-3xl font-mono tracking-widest"
                    />
                    <p className="mt-2 text-xs text-gray-500 text-center">
                      Enter the 6-digit code from your authenticator app
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShow2FADisable(false)
                    setDisable2FAData({ password: '', token: '' })
                  }}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDisable2FA}
                  disabled={loading || !disable2FAData.password || disable2FAData.token.length !== 6}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Disabling...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4" />
                      Disable 2FA
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
