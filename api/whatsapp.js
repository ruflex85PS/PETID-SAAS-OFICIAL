import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { realtime: { transport: ws } }
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
        } else if (msgType === 'text') {
          buttonText = message.text?.body
        }

        console.log('Phone:', phone, 'Type:', msgType, 'Button:', buttonText)

        // DEBUG: Log the incoming webhook to automations table
        await supabase.from('automations').insert([{
          organization_id: '7dc97a41-55be-40ce-9487-fe7a9460d9e5', // Hardcoded to VETPS for debug visibility
          automation_type: 'incoming_webhook',
          channel: 'whatsapp',
          status: 'received',
          message_preview: `Type: ${msgType} | Text: ${buttonText} | From: ${phone}`,
          error_message: JSON.stringify(body),
          scheduled_for: new Date().toISOString(),
          sent_at: new Date().toISOString()
        }])

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
              .in('status', ['scheduled', 'confirmed', 'rescheduled'])
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

              const textLower = buttonText.toLowerCase()
              if (textLower.includes('confirmar') || textLower.includes('confirm')) {
                newStatus = 'confirmed'
                replyMsg = 'Perfecto ' + customer.full_name + ', tu cita esta confirmada. Te esperamos!'
              } else if (textLower.includes('reprogramar') || textLower.includes('reprogram')) {
                newStatus = 'rescheduled'
                const { data: rescheduleTemplate } = await supabase
                  .from('whatsapp_templates')
                  .select('message')
                  .eq('template_type', 'reschedule_reply')
                  // Removed .single() to avoid crashes if multiple orgs have this template
                  .limit(1)
                const templateMsg = rescheduleTemplate?.[0]?.message
                const petName = appointment.pets?.name || 'tu mascota'
                replyMsg = (templateMsg || 'Listo {nombre}, nos comunicaremos contigo para reprogramar la cita de {mascota}. Que tengas un feliz dia!')
                  .replace('{nombre}', customer.full_name)
                  .replace('{mascota}', petName)
              } else if (textLower.includes('cancelar') || textLower.includes('cancel')) {
                newStatus = 'cancelled'
                replyMsg = 'Lamentamos que no puedas asistir ' + customer.full_name + '. Tu cita ha sido cancelada. Hasta pronto!'
              } else {
                // FALLBACK: If they pressed a weird button or sent text we don't understand
                replyMsg = 'Hemos recibido tu mensaje ' + customer.full_name + '. La clinica se pondra en contacto contigo pronto.'
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