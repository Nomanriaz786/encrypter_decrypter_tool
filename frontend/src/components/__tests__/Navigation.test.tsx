import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Navigation from '../Navigation'
import { useAuth } from '../../contexts/AuthContext'

// Mock the AuthContext
const mockLogout = vi.fn()
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/dashboard', search: '' })
  }
})

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}))

const mockedUseAuth = vi.mocked(useAuth)

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseAuth.mockReturnValue({
      user: {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        profilePicture: undefined
      },
      isAuthenticated: true,
      login: vi.fn(),
      logout: mockLogout,
      updateUser: vi.fn(),
      token: 'fake-token'
    })
  })

  it('renders navigation for regular user', () => {
    renderWithRouter(<Navigation />)

    expect(screen.getByText('SecureVault')).toBeInTheDocument()
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Encrypt').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Hash').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Keys').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Signatures').length).toBeGreaterThan(0)
    expect(screen.getByText('testuser')).toBeInTheDocument()
  })

  it('renders navigation for admin user', () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: '1',
        username: 'adminuser',
        email: 'admin@example.com',
        role: 'admin',
        profilePicture: undefined
      },
      isAuthenticated: true,
      login: vi.fn(),
      logout: mockLogout,
      updateUser: vi.fn(),
      token: 'fake-token'
    })

    renderWithRouter(<Navigation />)

    expect(screen.getByText('SecureVault')).toBeInTheDocument()
    expect(screen.getByText('Admin Panel')).toBeInTheDocument()
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Users').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Audit Logs').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Settings').length).toBeGreaterThan(0)
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('displays user profile picture when available', () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        profilePicture: 'profile.jpg'
      },
      isAuthenticated: true,
      login: vi.fn(),
      logout: mockLogout,
      updateUser: vi.fn(),
      token: 'fake-token'
    })

    renderWithRouter(<Navigation />)

    const profileImg = screen.getByAltText('Profile')
    expect(profileImg).toBeInTheDocument()
    expect(profileImg).toHaveAttribute('src', 'http://localhost:5000/uploads/profiles/profile.jpg')
  })

  it('displays user initial when no profile picture', () => {
    renderWithRouter(<Navigation />)

    expect(screen.getByText('T')).toBeInTheDocument() // First letter of 'testuser'
  })

  it('handles logout correctly', () => {
    renderWithRouter(<Navigation />)

    const logoutButton = screen.getByTitle('Logout')
    fireEvent.click(logoutButton)

    expect(mockLogout).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('shows active navigation item', () => {
    renderWithRouter(<Navigation />)

    const dashboardLinks = screen.getAllByText('Dashboard')
    const activeDashboard = dashboardLinks.find(link => link.closest('a')?.getAttribute('href') === '/dashboard')
    expect(activeDashboard?.closest('a')).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600')
  })

  it('shows admin badge for admin users', () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: '1',
        username: 'adminuser',
        email: 'admin@example.com',
        role: 'admin',
        profilePicture: undefined
      },
      isAuthenticated: true,
      login: vi.fn(),
      logout: mockLogout,
      updateUser: vi.fn(),
      token: 'fake-token'
    })

    renderWithRouter(<Navigation />)

    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('shows user view button for admins', () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: '1',
        username: 'adminuser',
        email: 'admin@example.com',
        role: 'admin',
        profilePicture: undefined
      },
      isAuthenticated: true,
      login: vi.fn(),
      logout: mockLogout,
      updateUser: vi.fn(),
      token: 'fake-token'
    })

    renderWithRouter(<Navigation />)

    expect(screen.getByText('User View')).toBeInTheDocument()
  })
})