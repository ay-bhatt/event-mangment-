<<<<<<< HEAD
import { createFileRoute } from '@tanstack/react-router'
import ParticipantScanner from '@/components/ParticipantScanner'

export const Route = createFileRoute('/_authenticated/entry')({
  component: EntryPage,
})

function EntryPage() {
  return <ParticipantScanner mode="entry" />
}
=======
import { createFileRoute } from '@tanstack/react-router'
import ParticipantScanner from '@/components/ParticipantScanner'

export const Route = createFileRoute('/_authenticated/entry')({
  component: EntryPage,
})

function EntryPage() {
  return <ParticipantScanner mode="entry" />
}
>>>>>>> 596041dd872ed2d87ec020683ec940e19571c71c
