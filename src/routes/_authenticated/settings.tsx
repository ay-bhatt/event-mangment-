import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
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

export const Route = createFileRoute('/_authenticated/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings)

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }))
  }

  const onSave = () => {
    const normalized = {
      ...settings,
      eventName: settings.eventName.trim(),
      qrPrefix: settings.qrPrefix.trim(),
      emailSubject: settings.emailSubject.trim(),
      emailMessage: settings.emailMessage.trim(),
    }
    setSettings(normalized)
    saveSettings(normalized)
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
          <CardTitle className="text-lg">Interface</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The app uses a consistent light interface designed for reliable event-day operations.
          </p>
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
              IDs are generated as {settings.qrPrefix}-001, {settings.qrPrefix}-002, …
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
