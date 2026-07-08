import { createFileRoute } from '@tanstack/react-router'
import { ActivityListPage } from '@/components/ActivityListPage'

export const Route = createFileRoute('/_authenticated/adventure')({
  component: AdventurePage,
})

function AdventurePage() {
  return <ActivityListPage type="adventure" />
}
