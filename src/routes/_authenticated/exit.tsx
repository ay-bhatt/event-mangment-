import { createFileRoute } from '@tanstack/react-router'
import ParticipantScanner from '@/components/ParticipantScanner'

export const Route = createFileRoute('/_authenticated/exit')({
  component: ExitPage,
})

function ExitPage() {
  return <ParticipantScanner mode="exit" />
}
