import { createFileRoute, redirect } from '@tanstack/react-router'
import { getAuthSession } from '@/lib/session'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const { token } = getAuthSession()
    throw redirect({
      to: token ? '/dashboard' : '/login',
    })
  },
})
