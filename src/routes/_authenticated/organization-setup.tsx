import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { orgApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { CaumasBrand } from '@/components/CaumasBrand'

export const Route = createFileRoute('/_authenticated/organization-setup')({
  component: OrganizationSetupPage,
})

type FormData = {
  businessEmail: string
  website: string
  country: string
  address: string
  logo: string
  timezone: string
  currency: string
}

function OrganizationSetupPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
  } = useForm<FormData>({
    defaultValues: {
      businessEmail: user?.organization?.businessEmail || '',
      website: user?.organization?.website || '',
      country: user?.organization?.country || '',
      address: user?.organization?.address || '',
      logo: user?.organization?.logo || '',
      timezone: user?.organization?.timezone || 'UTC',
      currency: user?.organization?.currency || 'USD',
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      await orgApi.updateOrganization(data)
      toast.success('Organization profile updated!')
      navigate({ to: '/dashboard' })
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update organization')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CaumasBrand className="mx-auto mb-4" />
          <CardTitle className="text-2xl font-bold">Complete your organization profile</CardTitle>
          <CardDescription>Fill in these details to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessEmail">Business Email</Label>
              <Input
                id="businessEmail"
                type="email"
                placeholder="business@yourorg.com"
                disabled={isSubmitting}
                {...register('businessEmail')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://yourorg.com"
                disabled={isSubmitting}
                {...register('website')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                type="text"
                placeholder="United States"
                disabled={isSubmitting}
                {...register('country')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                type="text"
                placeholder="123 Main St, City, State"
                disabled={isSubmitting}
                {...register('address')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                type="url"
                placeholder="https://yourorg.com/logo.png"
                disabled={isSubmitting}
                {...register('logo')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                type="text"
                placeholder="UTC"
                disabled={isSubmitting}
                {...register('timezone')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                type="text"
                placeholder="USD"
                disabled={isSubmitting}
                {...register('currency')}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Complete setup'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
