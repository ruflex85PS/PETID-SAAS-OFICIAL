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
    body: JSON.stringify({ messaging_product: 'whatsapp', to: phone, type: 'text', text: { body: message } })
  })
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode']
    const token = req.query['hub.verify_token']
    const challenge = req.query['hub.challenge']
    if (mode === 'subscribe' && token === 'petid_webhook_2024') {
      return res.status(200).send(challenge)
    }
    return res.status(403).send('Forbidden')
  }

  if (req.method === 'POST') {
    const body = req.body
    try {
      const entry = body.entry?.[0]
      const changes = entry?.changes?.[0]
      const value = changes?.value
      const message = value?.messages?.[0]

      if (message?.type === 'button') {
        const phone = message.from
        const buttonText = message.button?.text

        const cleanPhone = phone.replace(/\D/g, '')
        const localPhone = '0' + cleanPhone.slice(3)
        const localPhone2 = cleanPhone.slice(3)

        const { data: customers } = await supabase
          .from('customers')
          .select('id, full_name, organization_id')
          .or('phone.eq.' + phone + ',phone.eq.' + localPhone + ',phone.eq.' + localPhone2 + ',phone.eq.+' + cleanPhone)
          .limit(1)

        const customer = customers?.[0]

        if (customer) {
          const now = new Date()
          const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

          const { data: appointments } = await supabase
            .from('appointments')
            .select('id, title, scheduled_at')
            .eq('customer_id', customer.id)
            .eq('status', 'scheduled')
            .gte('scheduled_at', now.toISOString())
            .lte('scheduled_at', future.toISOString())
            .order('scheduled_at', { ascending: true })
            .limit(1)

          const appointment = appointments?.[0]

          if (appointment) {
            let newStatus = 'scheduled'
            let replyMsg = ''

            if (buttonText === 'Confirmar') {
              newStatus = 'confirmed'
              replyMsg = 'Perfecto ' + customer.full_name + ', tu cita esta confirmada. Te esperamos!'
            } else if (buttonText === 'Reprogramar') {
              newStatus = 'scheduled'
              replyMsg = 'Entendido ' + customer.full_name + ', nos pondremos en contacto contigo para reagendar tu cita. Que tengas un feliz dia!'
            } else if (buttonText === 'Cancelar') {
              newStatus = 'cancelled'
              replyMsg = 'Lamentamos que no puedas asistir ' + customer.full_name + '. Tu cita ha sido cancelada. Hasta pronto!'
            }

            if (newStatus !== 'scheduled' || buttonText === 'Reprogramar') {
              await supabase
                .from('appointments')
                .update({ status: newStatus })
                .eq('id', appointment.id)
            }

            await sendWhatsApp(phone, replyMsg)
          }
        }
      }
    } catch (err) {
      console.error('Webhook error:', err)
    }
    return res.status(200).json({ status: 'ok' })
  }
}