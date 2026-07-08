import { createFileRoute } from '@tanstack/react-router'
import { ActivityListPage } from '@/components/ActivityListPage'

export const Route = createFileRoute('/_authenticated/workshop')({
  component: WorkshopPage,
})

function WorkshopPage() {
  return <ActivityListPage type="workshop" />
}
