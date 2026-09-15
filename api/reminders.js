import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { realtime: { transport: ws } }
)

async function sendWhatsAppTemplate(to, templateName, params) {
  const token = process.env.WHATSAPP_TOKEN || process.env.VITE_WHATSAPP_TOKEN
  const phoneId = process.env.VITE_WHATSAPP_PHONE_ID
  const cleanPhone = to.replace(/\D/g, '')
  const phone = cleanPhone.startsWith('0') ? '593' + cleanPhone.slice(1) : cleanPhone

  const res = await fetch('https://graph.facebook.com/v18.0/' + phoneId + '/messages', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'es' },
        components: [{ type: 'body', parameters: params.map(p => ({ type: 'text', text: p })) }]
      }
    })
  })
  const data = await res.json()
  
  if (data.error) {
    console.warn("Template failed, attempting fallback:", data.error.message)
    const fallbackText = `Hola ${params[0]} 👋, solo pasamos a recordarte que mañana es la cita de ${params[1]} en ${params[2]} a las ${params[3]} para su ${params[4]}. ¿Nos confirmas tu asistencia? (Responde Confirmar, Reprogramar o Cancelar)`
    
    const fallbackRes = await fetch('https://graph.facebook.com/v18.0/' + phoneId + '/messages', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: fallbackText }
      })
    })
    return fallbackRes.json()
  }
  
  return data
}

async function sendWhatsAppText(to, message) {
  const token = process.env.WHATSAPP_TOKEN || process.env.VITE_WHATSAPP_TOKEN
  const phoneId = process.env.VITE_WHATSAPP_PHONE_ID
  const cleanPhone = to.replace(/\D/g, '')
  const phone = cleanPhone.startsWith('0') ? '593' + cleanPhone.slice(1) : cleanPhone

  await fetch('https://graph.facebook.com/v18.0/' + phoneId + '/messages', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: phone, type: 'text', text: { body: message } })
  })
}

// Ecuador es UTC-5 todo el año (sin horario de verano)
const ECUADOR_OFFSET_MS = 5 * 60 * 60 * 1000

// Calcula el rango "mañana 00:00 a 23:59, hora Ecuador" y lo devuelve
// como instantes UTC correctos para comparar contra scheduled_at (que está en UTC)
function getTomorrowRangeEcuador(now) {
  const ecuadorShifted = new Date(now.getTime() - ECUADOR_OFFSET_MS)

  const tomorrow = new Date(ecuadorShifted)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  tomorrow.setUTCHours(0, 0, 0, 0)

  const tomorrowEndShifted = new Date(tomorrow)
  tomorrowEndShifted.setUTCHours(23, 59, 59, 999)

  return {
    tomorrowStart: new Date(tomorrow.getTime() + ECUADOR_OFFSET_MS),
    tomorrowEnd: new Date(tomorrowEndShifted.getTime() + ECUADOR_OFFSET_MS)
  }
}

export default async function handler(req, res) {
  const now = new Date()

  // --- Recordatorio 24h: todas las citas de "mañana" (dia completo, hora Ecuador) ---
  const { tomorrowStart, tomorrowEnd } = getTomorrowRangeEcuador(now)

  const { data: citas24 } = await supabase
    .from('appointments')
    .select('*, customers(full_name, phone), services(name), organizations(name), pets(name)')
    .eq('status', 'scheduled')
    .eq('reminder_24h_sent', false)
    .gte('scheduled_at', tomorrowStart.toISOString())
    .lte('scheduled_at', tomorrowEnd.toISOString())

  let enviados24 = 0
  for (const cita of citas24 || []) {
    if (!cita.customers?.phone) continue
    
    // Skip sending 24h reminder if the appointment was created less than 12 hours ago
    const createdDate = new Date(cita.created_at)
    if (now.getTime() - createdDate.getTime() < 12 * 60 * 60 * 1000) {
      // Mark as sent so it doesn't try again, but don't actually send it to avoid spam
      await supabase.from('appointments').update({ reminder_24h_sent: true }).eq('id', cita.id)
      continue
    }

    const hora = new Date(cita.scheduled_at).toLocaleTimeString('es-EC', { timeZone: 'America/Guayaquil', hour: '2-digit', minute: '2-digit' })

    const result = await sendWhatsAppTemplate(cita.customers.phone, 'recordatorio_24h_cx', [
      cita.customers.full_name,
      cita.pets?.name || 'tu mascota',
      cita.organizations.name,
      hora,
      cita.services?.name || cita.title
    ])

    await supabase.from('appointments').update({ reminder_24h_sent: true }).eq('id', cita.id)

    await supabase.from('automations').insert([{
      organization_id: cita.organization_id,
      automation_type: 'reminder_24h',
      reference_id: cita.id,
      reference_type: 'appointment',
      customer_id: cita.customer_id,
      channel: 'whatsapp',
      message_preview: 'Recordatorio 24h para ' + cita.customers.full_name,
      status: result?.messages ? 'sent' : 'failed',
      scheduled_for: new Date().toISOString(),
      sent_at: new Date().toISOString(),
      error_message: result?.error?.message || null
    }])

    enviados24++
  }

  // --- Recordatorio 30 minutos (se mantiene igual que antes) ---
  const in30min = new Date(now.getTime() + 30 * 60 * 1000)
  const from30 = new Date(in30min.getTime() - 5 * 60 * 1000).toISOString()
  const to30 = new Date(in30min.getTime() + 5 * 60 * 1000).toISOString()

  const { data: citas30 } = await supabase
    .from('appointments')
    .select('*, customers(full_name, phone), services(name), organizations(name)')
    .eq('status', 'scheduled')
    .gte('scheduled_at', from30)
    .lte('scheduled_at', to30)

  for (const cita of citas30 || []) {
    if (!cita.customers?.phone) continue
    const hora = new Date(cita.scheduled_at).toLocaleTimeString('es-EC', { timeZone: 'America/Guayaquil', hour: '2-digit', minute: '2-digit' })
    const msg = 'Hola ' + cita.customers.full_name + ', tu cita en ' + cita.organizations.name + ' es en 30 minutos a las ' + hora + '. Te esperamos!'
    await sendWhatsAppText(cita.customers.phone, msg)
  }

  return res.status(200).json({
    ok: true,
    recordatorios24h: enviados24,
    recordatorios30min: citas30?.length || 0
  })
}
