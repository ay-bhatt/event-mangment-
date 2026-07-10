<<<<<<< HEAD
import { createFileRoute } from '@tanstack/react-router'
import ParticipantScanner from '@/components/ParticipantScanner'

export const Route = createFileRoute('/_authenticated/exit')({
  component: ExitPage,
})

function ExitPage() {
  return <ParticipantScanner mode="exit" />
}
=======
import { createFileRoute } from '@tanstack/react-router'
import ParticipantScanner from '@/components/ParticipantScanner'

export const Route = createFileRoute('/_authenticated/exit')({
  component: ExitPage,
})

function ExitPage() {
  return <ParticipantScanner mode="exit" />
}
>>>>>>> 596041dd872ed2d87ec020683ec940e19571c71c
