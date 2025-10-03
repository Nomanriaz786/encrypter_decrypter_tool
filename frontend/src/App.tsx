import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import UserDashboard from './pages/UserDashboard'
import AdminDashboard from './pages/AdminDashboard'
import KeyManagement from './pages/KeyManagement'
import DigitalSignature from './pages/DigitalSignature'
import EncryptDecrypt from './pages/EncryptDecrypt'
import HashVerify from './pages/HashVerify'
import Profile from './pages/Profile'
import { AuthProvider, useAuth } from './contexts/AuthContext'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function AdminRoute({ children }: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated, user } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" />
  }
  
  return <>{children}</>
}

function PublicRoute({ children }: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated, user } = useAuth()
  
  if (isAuthenticated) {
    // Redirect based on user role
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/keys" element={
              <ProtectedRoute>
                <KeyManagement />
              </ProtectedRoute>
            } />
            <Route path="/signatures" element={
              <ProtectedRoute>
                <DigitalSignature />
              </ProtectedRoute>
            } />
            <Route path="/encrypt" element={
              <ProtectedRoute>
                <EncryptDecrypt />
              </ProtectedRoute>
            } />
            <Route path="/hash" element={
              <ProtectedRoute>
                <HashVerify />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            {/* Catch all route - redirect to appropriate dashboard */}
            <Route path="*" element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            } />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  )
}
export default App
