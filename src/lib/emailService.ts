import emailjs from 'emailjs-com'
import { applyTemplate, loadSettings } from '@/lib/settings'
import { qrToDataUrl, getQrPayload } from '@/lib/qr-utils'
import type { Volunteer } from '@/lib/volunteers'

export type EmailRecipient = Pick<Volunteer, 'id' | 'name' | 'email' | 'team' | 'role'>

export function isEmailJsConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_EMAILJS_SERVICE_ID &&
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID &&
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  )
}

export async function sendVolunteerPassEmail(
  volunteer: EmailRecipient,
): Promise<void> {
  if (!isEmailJsConfigured()) {
    throw new Error(
      'EmailJS is not configured. Add keys to .env — see SETUP.md.',
    )
  }

  const settings = loadSettings()
  const vars = {
    name: volunteer.name,
    id: volunteer.id,
    event: settings.eventName,
    email: volunteer.email,
    team: volunteer.team,
    role: volunteer.role,
  }

  const qrImage = await qrToDataUrl(getQrPayload(volunteer.id), 400)
  const message = applyTemplate(settings.emailMessage, vars)
  const subject = applyTemplate(settings.emailSubject, vars)

  await emailjs.send(
    import.meta.env.VITE_EMAILJS_SERVICE_ID,
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
    {
      to_email: volunteer.email,
      to_name: volunteer.name,
      volunteer_id: volunteer.id,
      event_name: settings.eventName,
      subject,
      message,
      qr_image: qrImage,
      reply_to: volunteer.email,
    },
    import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  )
}
