<<<<<<< HEAD
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth'
import { CaumasBrand } from '@/components/CaumasBrand'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

type FormData = {
  email: string
  password: string
}

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      const success = await login(data.email, data.password)
      if (success) {
        toast.success('Login successful!')
        navigate({ to: '/dashboard' })
      } else {
        toast.error('Invalid email or password')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed')
    } finally {
      setIsSubmitting(false)
=======
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
>>>>>>> 596041dd872ed2d87ec020683ec940e19571c71c
    }
  }

  return (
<<<<<<< HEAD
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CaumasBrand className="mx-auto mb-4" />
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                disabled={isSubmitting}
                {...register('email', { required: 'Email is required' })}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Log in'}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
=======
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
>>>>>>> 596041dd872ed2d87ec020683ec940e19571c71c
    </div>
  )
}
