import { useEffect } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import ProfilePage from './pages/ProfilePage'
import FriendsPage from './pages/FriendsPage'
import NotificationsPage from './pages/NotificationsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { authService } from './services/authService'
import { useAuthStore } from './store/authStore'

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, setUser, clearAuth } = useAuthStore()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  useEffect(() => {
    const stored = authService.getStoredUser()
    if (stored) {
      setUser(stored)
    }
  }, [setUser])

  const handleLogout = async () => {
    await authService.logout()
    clearAuth()
    navigate('/login')
  }

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    )
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar user={user ?? undefined} onLogout={handleLogout} />
      <main className="flex-1 md:ml-64 mb-16 md:mb-0">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/friends/:userId" element={<FriendsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/explore" element={<SearchPage />} />
          <Route path="/messages" element={<HomePage />} />
          <Route path="/saved" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
