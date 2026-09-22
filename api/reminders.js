import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  { realtime: { transport: ws } }
)

async function sendWhatsAppTemplate(to, templateName, params) {
  const token = process.env.WHATSAPP_TOKEN || process.env.VITE_WHATSAPP_TOKEN || 'EAATPwIgNsnIBSvcT6MZAzAgqR6MesZAD8xumSVFVoFpfXaJlg91w8ZAiqCiU8JZCh3yJkawXKl1ZBZAMiYlJ63EZCrZBXpL2wdLQelZBLbLmuADI7jcz6XlGC7JKj5SEPSW58AdWUHzXVrZBOnQmD0UDgCGdZC6coIPFWxcvXWZB1PBZA14wOeIX8kRZCahleZAGLHlO04epUyZC2J3ooYDla8EpSRlaKYYVAh0fPLNlenvZCSquGJNx4hoD9tMZBn9JZAbFcTncMiHpZByHZCUVc89MKIJptEMtuwAZDZD'
  const phoneId = process.env.VITE_WHATSAPP_PHONE_ID || '1277147338823083'
  let cleanPhone = to.replace(/\D/g, '')
  if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) {
    cleanPhone = '593' + cleanPhone
  } else if (cleanPhone.startsWith('0')) {
    cleanPhone = '593' + cleanPhone.slice(1)
  }
  const phone = cleanPhone

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
        components: [{
          type: 'body',
          parameters: [
            { type: 'text', text: params[0] || 'Cliente' },
            { type: 'text', text: params[1] || 'tu mascota' },
            { type: 'text', text: params[2] || 'nuestra clínica' },
            { type: 'text', text: params[3] || 'hora acordada' },
            { type: 'text', text: params[4] || 'Consulta' }
          ]
        }]
      }
    })
  })
  const data = await res.json()
  
  if (data.error) {
    console.warn("Template failed, attempting fallback:", data.error.message)
    const fallbackText = `Hola ${params[0] || 'Cliente'} 👋, solo pasamos a recordarte que mañana es la cita de ${params[1] || 'tu mascota'} en ${params[2] || 'nuestra clínica'} a las ${params[3] || 'hora acordada'} para su ${params[4] || 'Consulta'}. ¿Nos confirmas tu asistencia? (Responde Confirmar, Reprogramar o Cancelar)`
    
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
  let cleanPhone = to.replace(/\D/g, '')
  if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) {
    cleanPhone = '593' + cleanPhone
  } else if (cleanPhone.startsWith('0')) {
    cleanPhone = '593' + cleanPhone.slice(1)
  }
  const phone = cleanPhone

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

  // Buscar citas en la ventana de las proximas 2 a 25 horas
  const windowStart = new Date(now.getTime() + 2 * 60 * 60 * 1000)
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000)

  const { data: citas24 } = await supabase
    .from('appointments')
    .select('*, customers(*), pets(*), organizations(*), services(*)')
    .eq('status', 'scheduled')
    .eq('reminder_24h_sent', false)
    .gte('scheduled_at', windowStart.toISOString())
    .lte('scheduled_at', windowEnd.toISOString())

  console.log('Citas para 24h:', citas24?.length)

  let enviados24 = 0
  if (citas24) {
    for (const cita of citas24) {
      if (!cita.customers?.phone) continue
      
      // Buffer Anti-Spam: Si la cita fue creada hace menos de 60 minutos, saltar por ahora
      // Esto evita que le llegue la confirmación y el recordatorio al mismo tiempo.
      // Se enviará en la siguiente ejecución del cron (en 1 hora).
      const createdDate = new Date(cita.created_at)
      if (now.getTime() - createdDate.getTime() < 60 * 60 * 1000) {
        console.log(`Cita ${cita.id} omitida temporalmente (creada hace menos de 1h)`)
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
