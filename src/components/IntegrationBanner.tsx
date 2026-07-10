import { Alert } from '@/components/ui/alert'
import { isEmailJsConfigured } from '@/lib/emailService'

export function IntegrationBanner() {
  const emailOk = isEmailJsConfigured()

  if (emailOk) return null

  return (
    <Alert variant="muted" className="mb-4 text-xs leading-relaxed">
      EmailJS not configured — see Settings to enable pass email sending.
    </Alert>
  )
}
