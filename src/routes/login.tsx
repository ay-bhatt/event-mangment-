import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Eye, EyeOff, KeyRound, User } from 'lucide-react'
import { CaumasLogoMark } from '@/components/CaumasBrand'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/lib/auth'
import { BRAND } from '@/lib/brand'
import { isAdminSessionActive } from '@/lib/session'
import { getInitials } from '@/lib/utils'

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (isAdminSessionActive()) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const ok = await login(username, password)
    setLoading(false)
    if (ok) {
      navigate({ to: '/dashboard' })
    } else {
      setError('Invalid username or password')
    }
  }

  return (
    <div className="caumas-login-page">
      <div className="caumas-login-hero">
        <div className="caumas-login-logo-wrap">
          <CaumasLogoMark className="h-11 w-11" />
        </div>
        <p className="caumas-login-tagline">Enjoy the event with me</p>
      </div>

      <div className="caumas-login-card">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              good news
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to {BRAND.name}
            </p>
          </div>
          <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-sm">
            <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
              {getInitials(username || 'Admin')}
            </AvatarFallback>
          </Avatar>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Username or email
            </label>
            <div className="caumas-login-input">
              <User className="h-4 w-4 shrink-0 text-muted-foreground/70" />
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="Enter username or Gmail address"
                required
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-xs font-medium text-muted-foreground"
              >
                Password
              </label>
              <button
                type="button"
                className="text-xs font-medium transition-colors"
                style={{ color: 'hsl(var(--login-orange))' }}
                onClick={() => setShowPass((v) => !v)}
              >
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="caumas-login-input">
              <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground/70" />
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="caumas-btn-orange" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          {BRAND.productName} · Secure admin access
        </p>
      </div>
    </div>
  )
}
