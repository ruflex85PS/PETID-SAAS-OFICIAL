import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function sendWhatsApp(to, message) {
  const token = process.env.VITE_WHATSAPP_TOKEN
  const phoneId = process.env.VITE_WHATSAPP_PHONE_ID
  const cleanPhone = to.replace(/\D/g, '')
  const phone = cleanPhone.startsWith('0') ? '593' + cleanPhone.slice(1) : cleanPhone
  
  await fetch('https://graph.facebook.com/v18.0/' + phoneId + '/messages', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body: message }
    })
  })
}

export default async function handler(req, res) {
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const in30min = new Date(now.getTime() + 30 * 60 * 1000)

  const from24 = new Date(in24h.getTime() - 15 * 60 * 1000).toISOString()
  const to24 = new Date(in24h.getTime() + 15 * 60 * 1000).toISOString()
  const from30 = new Date(in30min.getTime() - 5 * 60 * 1000).toISOString()
  const to30 = new Date(in30min.getTime() + 5 * 60 * 1000).toISOString()

  const { data: citas24 } = await supabase
    .from('appointments')
    .select('*, customers(full_name, phone), services(name), organizations(name)')
    .eq('status', 'scheduled')
    .gte('scheduled_at', from24)
    .lte('scheduled_at', to24)

  for (const cita of citas24 || []) {
    if (!cita.customers?.phone) continue
    const hora = new Date(cita.scheduled_at).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
    const msg = 'Hola ' + cita.customers.full_name + ', te recordamos que manana tienes cita en ' + cita.organizations.name + ' a las ' + hora + '. Servicio: ' + (cita.services?.name || cita.title) + '. Te esperamos!'
    await sendWhatsApp(cita.customers.phone, msg)
  }

  const { data: citas30 } = await supabase
    .from('appointments')
    .select('*, customers(full_name, phone), services(name), organizations(name)')
    .eq('status', 'scheduled')
    .gte('scheduled_at', from30)
    .lte('scheduled_at', to30)

  for (const cita of citas30 || []) {
    if (!cita.customers?.phone) continue
    const hora = new Date(cita.scheduled_at).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
    const msg = 'Hola ' + cita.customers.full_name + ', tu cita en ' + cita.organizations.name + ' es en 30 minutos a las ' + hora + '. Te esperamos!'
    await sendWhatsApp(cita.customers.phone, msg)
  }

  return res.status(200).json({ 
    ok: true, 
    recordatorios24h: citas24?.length || 0,
    recordatorios30min: citas30?.length || 0
  })
}