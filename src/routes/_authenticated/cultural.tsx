import { createFileRoute } from '@tanstack/react-router'
import { ActivityListPage } from '@/components/ActivityListPage'

export const Route = createFileRoute('/_authenticated/cultural')({
  component: CulturalPage,
})

function CulturalPage() {
  return <ActivityListPage type="cultural" />
}
