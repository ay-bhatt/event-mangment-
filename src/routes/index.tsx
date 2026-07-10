import { createFileRoute, redirect } from '@tanstack/react-router'
<<<<<<< HEAD
import { getAuthSession } from '@/lib/session'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const { token } = getAuthSession()
    throw redirect({
      to: token ? '/dashboard' : '/login',
=======
import { isAdminSessionActive } from '@/lib/session'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({
      to: isAdminSessionActive() ? '/dashboard' : '/login',
>>>>>>> 596041dd872ed2d87ec020683ec940e19571c71c
    })
  },
})
