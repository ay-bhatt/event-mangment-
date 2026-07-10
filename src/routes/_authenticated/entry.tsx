import { createFileRoute } from '@tanstack/react-router'
import ParticipantScanner from '@/components/ParticipantScanner'

export const Route = createFileRoute('/_authenticated/entry')({
  component: EntryPage,
})

function EntryPage() {
  return <ParticipantScanner mode="entry" />
}
