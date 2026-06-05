import { FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Camera, Loader2, Lock, Mail } from 'lucide-react'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'

interface LocationState {
  message?: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setUser } = useAuthStore()
  const message = (location.state as LocationState | null)?.message

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return 'Email khong hop le'
    }

    if (password.length < 8 || password.length > 128) {
      return 'Mat khau phai tu 8 den 128 ky tu'
    }

    return ''
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await authService.login({
        email: email.trim(),
        password,
      })

      setUser(response.user)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dang nhap that bai')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Camera size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black">Dang nhap</h1>
            <p className="text-sm text-slate-500">Tro lai InstaShare</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          {message && (
            <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <label className="mb-4 block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Email</span>
            <div className="flex items-center gap-2 rounded-md border border-slate-300 px-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
              <Mail size={18} className="text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 w-full bg-transparent text-sm outline-none"
                placeholder="john@example.com"
                autoComplete="email"
                required
              />
            </div>
          </label>

          <label className="mb-5 block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Mat khau</span>
            <div className="flex items-center gap-2 rounded-md border border-slate-300 px-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
              <Lock size={18} className="text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 w-full bg-transparent text-sm outline-none"
                placeholder="password123"
                autoComplete="current-password"
                minLength={8}
                maxLength={128}
                required
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting && <Loader2 size={18} className="animate-spin" />}
            Dang nhap
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Chua co tai khoan?{' '}
          <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
            Dang ky
          </Link>
        </p>
      </div>
    </main>
  )
}
