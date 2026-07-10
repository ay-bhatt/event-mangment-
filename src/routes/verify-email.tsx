import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { authApi } from '@/lib/api'
import { CaumasBrand } from '@/components/CaumasBrand'

export const Route = createFileRoute('/verify-email')({
  component: VerifyEmailPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: search.token as string | undefined,
    }
  },
})

type VerificationStatus = 'loading' | 'success' | 'error'

function VerifyEmailPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<VerificationStatus>('loading')
  const searchParams = Route.useSearch()
  const token = searchParams.token as string

  useEffect(() => {
    if (token) {
      verifyEmail(token)
    } else {
      setStatus('error')
    }
  }, [token])

  const verifyEmail = async (token: string) => {
    try {
      await authApi.verifyEmail(token)
      setStatus('success')
      toast.success('Email verified successfully!')
    } catch {
      setStatus('error')
      toast.error('Invalid or expired verification token')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CaumasBrand className="mx-auto mb-4" />
          <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <CardDescription>Verifying your email...</CardDescription>
            </div>
          )}
          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <CardDescription className="text-lg">
                Your email has been verified successfully!
              </CardDescription>
              <Button onClick={() => navigate({ to: '/login' })} className="w-full">
                Go to Login
              </Button>
            </div>
          )}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <XCircle className="h-12 w-12 text-red-500" />
              <CardDescription className="text-lg">
                The verification link is invalid or has expired.
              </CardDescription>
              <Button onClick={() => navigate({ to: '/login' })} className="w-full">
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
