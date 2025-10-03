import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Login from '../Login'
import { useAuth } from '../../contexts/AuthContext'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'

// Mock dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn()
  }
})

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    token: null
  }))
}))

vi.mock('../../services/api', () => ({
  authAPI: {
    login: vi.fn()
  }
}))

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

vi.mock('react-hook-form', () => ({
  useForm: () => ({
    register: vi.fn(),
    handleSubmit: (fn: any) => (e: any) => {
      e.preventDefault()
      const formData = {
        username: 'testuser',
        password: 'password'
      }
      return fn(formData)
    },
    formState: { errors: {} }
  })
}))

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form', () => {
    renderWithRouter(<Login />)

    expect(screen.getByText('Welcome Back!')).toBeInTheDocument()
    expect(screen.getByText('Please sign-in to your account and start the adventure')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('admin')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('toggles password visibility', () => {
    renderWithRouter(<Login />)

    const passwordInput = screen.getByPlaceholderText('••••••')
    const toggleButton = screen.getByRole('button', { name: '' }) // Eye icon button

    expect(passwordInput).toHaveAttribute('type', 'password')

    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')
  })

  it('shows 2FA field when required', async () => {
    const mockLogin = vi.fn().mockResolvedValue({
      data: { require2FA: true }
    })
    vi.mocked(authAPI.login).mockImplementation(mockLogin)

    renderWithRouter(<Login />)

    const usernameInput = screen.getByPlaceholderText('admin')
    const passwordInput = screen.getByPlaceholderText('••••••')
    const submitButton = screen.getByRole('button', { name: /login/i })

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'password' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter 6-digit code')).toBeInTheDocument()
    })
  })

  it('handles successful login', async () => {
    const mockLogin = vi.fn().mockResolvedValue({
      data: {
        token: 'fake-token',
        user: { id: '1', username: 'testuser', role: 'user' },
        require2FA: false
      }
    })
    vi.mocked(authAPI.login).mockImplementation(mockLogin)
    const mockAuthLogin = vi.fn()
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      login: mockAuthLogin,
      logout: vi.fn(),
      updateUser: vi.fn(),
      token: null
    })

    renderWithRouter(<Login />)

    const usernameInput = screen.getByPlaceholderText('admin')
    const passwordInput = screen.getByPlaceholderText('••••••')
    const submitButton = screen.getByRole('button', { name: /login/i })

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'password' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockAuthLogin).toHaveBeenCalledWith('fake-token', { id: '1', username: 'testuser', role: 'user' })
      expect(toast.success).toHaveBeenCalledWith('Login successful!')
    })
  })

  it('handles login error', async () => {
    const mockLogin = vi.fn().mockRejectedValue({
      response: { data: { error: 'Invalid credentials' }, status: 401 }
    })
    vi.mocked(authAPI.login).mockImplementation(mockLogin)

    renderWithRouter(<Login />)

    const usernameInput = screen.getByPlaceholderText('admin')
    const passwordInput = screen.getByPlaceholderText('••••••')
    const submitButton = screen.getByRole('button', { name: /login/i })

    fireEvent.change(usernameInput, { target: { value: 'wronguser' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials')
    })
  })
})