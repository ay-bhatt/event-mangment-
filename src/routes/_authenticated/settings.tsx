import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { isEmailJsConfigured } from '@/lib/emailService'
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type AppSettings,
} from '@/lib/settings'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings)
  const { theme, setTheme } = useTheme()

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }))
  }

  const onSave = () => {
    saveSettings(settings)
    toast.success('Settings saved')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure event details and integrations.
        </p>
      </div>

      <Card className="rounded-3xl border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Choose light pastel mode or dark library dashboard theme.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={cn(
                'little-box flex-col items-start gap-3 !py-5',
                theme === 'light' && 'little-box-active',
              )}
            >
              <Sun className="h-5 w-5" />
              <div className="text-left">
                <p className="font-semibold">Light mode</p>
                <p className="text-xs opacity-80">Pastel cards & soft UI</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={cn(
                'little-box flex-col items-start gap-3 !py-5',
                theme === 'dark' && 'little-box-active',
              )}
            >
              <Moon className="h-5 w-5" />
              <div className="text-left">
                <p className="font-semibold">Dark mode</p>
                <p className="text-xs opacity-80">Navy & gold accent</p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">Event</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eventName">Event name</Label>
            <Input
              id="eventName"
              value={settings.eventName}
              onChange={(e) => update('eventName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="qrPrefix">QR ID prefix</Label>
            <Input
              id="qrPrefix"
              value={settings.qrPrefix}
              onChange={(e) => update('qrPrefix', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              IDs are generated as {settings.qrPrefix}-001,{' '}
              {settings.qrPrefix}-002, …
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">Email template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Variables: {'{{name}}'}, {'{{id}}'}, {'{{event}}'}
          </p>
          <div className="space-y-2">
            <Label htmlFor="emailSubject">Subject</Label>
            <Input
              id="emailSubject"
              value={settings.emailSubject}
              onChange={(e) => update('emailSubject', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emailMessage">Message</Label>
            <Textarea
              id="emailMessage"
              rows={8}
              value={settings.emailMessage}
              onChange={(e) => update('emailMessage', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <span>MySQL API (attendance, meals, scans)</span>
            <span className="font-medium text-success">Backend API</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <span>EmailJS (send pass)</span>
            <span
              className={
                isEmailJsConfigured()
                  ? 'font-medium text-success'
                  : 'text-muted-foreground'
              }
            >
              {isEmailJsConfigured() ? 'Connected' : 'Not configured'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            See SETUP.md in the project root for env var instructions.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave}>Save settings</Button>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="text-xs"
        onClick={() => setSettings({ ...DEFAULT_SETTINGS })}
      >
        Reset to defaults
      </Button>
    </div>
  )
}
