import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Camera, Loader2, Lock, Mail, User, UserRound } from 'lucide-react'
import { authService } from '@/services/authService'
import { getApiErrorMessage } from '@/services/api'

export default function RegisterPage() {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = () => {
    const trimmedUsername = username.trim()
    const trimmedFullName = fullName.trim()

    if (trimmedUsername.length < 3 || trimmedUsername.length > 50) {
      return 'Username phai tu 3 den 50 ky tu'
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return 'Email khong hop le'
    }

    if (password.length < 8 || password.length > 128) {
      return 'Mat khau phai tu 8 den 128 ky tu'
    }

    if (trimmedFullName.length > 150) {
      return 'Ho ten toi da 150 ky tu'
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
      const trimmedFullName = fullName.trim()

      await authService.register({
        username: username.trim(),
        email: email.trim(),
        password,
        ...(trimmedFullName ? { fullName: trimmedFullName } : {}),
      })

      navigate('/login', {
        replace: true,
        state: { message: 'Dang ky thanh cong. Hay dang nhap de tiep tuc.' },
      })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Dang ky that bai'))
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
            <h1 className="text-2xl font-black">Dang ky</h1>
            <p className="text-sm text-slate-500">Tao tai khoan InstaShare</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <label className="mb-4 block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Username</span>
            <div className="flex items-center gap-2 rounded-md border border-slate-300 px-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
              <User size={18} className="text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="h-11 w-full bg-transparent text-sm outline-none"
                placeholder="john_doe"
                autoComplete="username"
                minLength={3}
                maxLength={50}
                required
              />
            </div>
          </label>

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

          <label className="mb-4 block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Mat khau</span>
            <div className="flex items-center gap-2 rounded-md border border-slate-300 px-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
              <Lock size={18} className="text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 w-full bg-transparent text-sm outline-none"
                placeholder="password123"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
              />
            </div>
          </label>

          <label className="mb-5 block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Ho ten</span>
            <div className="flex items-center gap-2 rounded-md border border-slate-300 px-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
              <UserRound size={18} className="text-slate-400" />
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="h-11 w-full bg-transparent text-sm outline-none"
                placeholder="John Doe"
                autoComplete="name"
                maxLength={150}
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting && <Loader2 size={18} className="animate-spin" />}
            Dang ky
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Da co tai khoan?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
            Dang nhap
          </Link>
        </p>
      </div>
    </main>
  )
}
