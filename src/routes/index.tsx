import { createFileRoute, redirect } from '@tanstack/react-router'
import { isAdminSessionActive } from '@/lib/session'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({
      to: isAdminSessionActive() ? '/dashboard' : '/login',
    })
  },
})
