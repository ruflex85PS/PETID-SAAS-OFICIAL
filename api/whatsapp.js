import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)



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
    try {
      const body = req.body
      const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
      


      if (message) {
        const phone = message.from
        const msgType = message.type
        
        let buttonText = ''
        if (msgType === 'button') {
          buttonText = message.button?.text
        } else if (msgType === 'interactive') {
          buttonText = message.interactive?.button_reply?.title || message.interactive?.list_reply?.title
        }

        console.log('Phone:', phone, 'Type:', msgType, 'Button:', buttonText)

        if (buttonText) {
          const cleanPhone = phone.replace(/\D/g, '')
          const localPhone = '0' + cleanPhone.slice(3)

          // Fetch ALL customers with this phone (could be in multiple clinics)
          const { data: customers } = await supabase
            .from('customers')
            .select('id, full_name, organization_id')
            .or('phone.eq.' + localPhone + ',phone.eq.' + phone + ',phone.eq.+' + cleanPhone)

          console.log('Customers found:', customers?.length)

          if (customers && customers.length > 0) {
            const customerIds = customers.map(c => c.id)
            const now = new Date()
            const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

            // Find the nearest upcoming appointment across ALL these customers
            const { data: appointments } = await supabase
              .from('appointments')
              .select('id, title, scheduled_at, customer_id, pets(name)')
              .in('customer_id', customerIds)
              .in('status', ['scheduled', 'confirmed'])
              .gte('scheduled_at', now.toISOString())
              .lte('scheduled_at', future.toISOString())
              .order('scheduled_at', { ascending: true })
              .limit(1)

            console.log('Appointments found:', appointments?.length)
            const appointment = appointments?.[0]

            if (appointment) {
              const customer = customers.find(c => c.id === appointment.customer_id)
              let newStatus = null
              let replyMsg = ''

              if (buttonText.trim() === 'Confirmar') {
                newStatus = 'confirmed'
                replyMsg = 'Perfecto ' + customer.full_name + ', tu cita esta confirmada. Te esperamos!'
              } else if (buttonText.trim() === 'Reprogramar') {
                newStatus = 'rescheduled'
                const { data: rescheduleTemplate } = await supabase
                  .from('whatsapp_templates')
                  .select('message')
                  .eq('template_type', 'reschedule_reply')
                  .single()
                const petName = appointment.pets?.name || 'tu mascota'
                replyMsg = (rescheduleTemplate?.message || 'Listo {nombre}, nos comunicaremos contigo para reprogramar la cita de {mascota}. Que tengas un feliz dia!')
                  .replace('{nombre}', customer.full_name)
                  .replace('{mascota}', petName)
              } else if (buttonText.trim() === 'Cancelar') {
                newStatus = 'cancelled'
                replyMsg = 'Lamentamos que no puedas asistir ' + customer.full_name + '. Tu cita ha sido cancelada. Hasta pronto!'
              }

              if (newStatus) {
                const { error: updateErr } = await supabase.from('appointments').update({ status: newStatus }).eq('id', appointment.id)
                console.log('Update status result:', updateErr ? 'Error' : 'Success')
              }

              if (replyMsg) {
                await sendWhatsApp(phone, replyMsg)
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Webhook error:', err)
    }
    return res.status(200).json({ status: 'ok' })
  }
}

async function sendWhatsApp(to, message) {
  const token = (process.env.WHATSAPP_TOKEN || process.env.VITE_WHATSAPP_TOKEN || '').trim()
  const phoneId = (process.env.VITE_WHATSAPP_PHONE_ID || '').trim()
  if (!token || !phoneId) { console.error('Missing WhatsApp credentials'); return; }
  const cleanPhone = to.replace(/\D/g, '')
  const phone = cleanPhone.startsWith('0') ? '593' + cleanPhone.slice(1) : cleanPhone
  await fetch('https://graph.facebook.com/v18.0/' + phoneId + '/messages', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: phone, type: 'text', text: { body: message } })
  })
}