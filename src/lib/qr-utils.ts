import QRCode from 'qrcode'
import { jsPDF } from 'jspdf'

export function getVerifyUrl(passId: string): string {
  const base =
    import.meta.env.VITE_APP_BASE_URL?.replace(/\/$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}/verify/${encodeURIComponent(passId)}`
}

export function getQrPayload(passId: string): string {
  return getVerifyUrl(passId)
}

export async function qrToDataUrl(
  text: string,
  size = 280,
): Promise<string> {
  return QRCode.toDataURL(text, {
    width: size,
    margin: 1,
    errorCorrectionLevel: 'M',
  })
}

type PassEntry = {
  id: string
  name: string
  team?: string
  role?: string
}

export async function downloadQrPng(
  entry: PassEntry,
  filename?: string,
): Promise<void> {
  const dataUrl = await qrToDataUrl(getQrPayload(entry.id))
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename ?? `${entry.id}-qr.png`
  link.click()
}

export async function qrElementToDataUrl(
  element: HTMLElement,
): Promise<string> {
  const { default: html2canvas } = await import('html2canvas')
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2,
  })
  return canvas.toDataURL('image/png')
}

export async function generateBulkPdf(
  entries: PassEntry[],
  eventName: string,
): Promise<void> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()

  for (let i = 0; i < entries.length; i++) {
    const v = entries[i]
    if (i > 0) pdf.addPage()

    const qrData = await qrToDataUrl(getQrPayload(v.id), 320)
    const qrSize = 70
    const x = (pageWidth - qrSize) / 2

    pdf.setFontSize(18)
    pdf.text(v.name, pageWidth / 2, 30, { align: 'center' })
    pdf.setFontSize(12)
    pdf.setTextColor(100)
    pdf.text(v.id, pageWidth / 2, 40, { align: 'center' })
    pdf.setTextColor(0)
    pdf.text(`${v.team ?? ''} · ${v.role ?? ''}`, pageWidth / 2, 48, { align: 'center' })
    pdf.addImage(qrData, 'PNG', x, 58, qrSize, qrSize)
    pdf.setFontSize(10)
    pdf.setTextColor(120)
    pdf.text(eventName, pageWidth / 2, 140, { align: 'center' })
  }

  pdf.save(`${eventName.replace(/\s+/g, '-')}-passes.pdf`)
}
