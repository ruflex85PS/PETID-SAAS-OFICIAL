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
        const token = process.env.VITE_WHATSAPP_TOKEN
        const phoneId = process.env.VITE_WHATSAPP_PHONE_ID

        let replyMsg = ''
        if (buttonText === 'Confirmar') {
          replyMsg = 'Perfecto, tu cita esta confirmada. Te esperamos!'
        } else if (buttonText === 'Reprogramar') {
          replyMsg = 'Entendido, nos pondremos en contacto contigo para reagendar tu cita. Que tengas un feliz dia!'
        } else if (buttonText === 'Cancelar') {
          replyMsg = 'Lamentamos que no puedas asistir. Tu cita ha sido cancelada. Hasta pronto!'
        }

        if (replyMsg && token && phoneId) {
          await fetch('https://graph.facebook.com/v18.0/' + phoneId + '/messages', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: phone,
              type: 'text',
              text: { body: replyMsg }
            })
          })
        }
      }
    } catch (err) {
      console.error('Webhook error:', err)
    }
    return res.status(200).json({ status: 'ok' })
  }
}