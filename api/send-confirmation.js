export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const WHATSAPP_TOKEN = (process.env.WHATSAPP_TOKEN || process.env.VITE_WHATSAPP_TOKEN || '').trim();
  const PHONE_ID = (process.env.VITE_WHATSAPP_PHONE_ID || '').trim();

  if (!WHATSAPP_TOKEN || !PHONE_ID) {
    console.error('WhatsApp credentials missing on server');
    return res.status(500).json({ error: 'WhatsApp credentials missing' });
  }

  const { to, params } = req.body
  if (!to || !params) {
    return res.status(400).json({ error: 'Missing to or params' })
  }

  let cleanPhone = to.replace(/\D/g, "")
  if (cleanPhone.startsWith("0")) { cleanPhone = "593" + cleanPhone.slice(1) }
  const { customerName, petName, businessName, fecha, hora, serviceName } = params

  try {
    const response = await fetch("https://graph.facebook.com/v18.0/" + PHONE_ID + "/messages", {
      method: "POST",
      headers: { "Authorization": "Bearer " + WHATSAPP_TOKEN, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "template",
        template: {
          name: "cita_confirmada_cx",
          language: { code: "es" },
          components: [{
            type: "body",
            parameters: [
              { type: "text", text: customerName },
              { type: "text", text: petName },
              { type: "text", text: businessName },
              { type: "text", text: fecha },
              { type: "text", text: hora },
              { type: "text", text: serviceName }
            ]
          }]
        }
      })
    })
    const data = await response.json()
    
    // Fallback: If template fails (e.g. PENDING), try sending as plain text (works if 24h window is open)
    if (data.error) {
      console.warn("Template failed, attempting text fallback:", data.error.message)
      const fallbackText = `Hola ${customerName}, hemos agendado con éxito la cita para tu mascota ${petName} en ${businessName}. 📍 Fecha: ${fecha} a las ${hora}. Servicio: ${serviceName}.`
      
      const fallbackResponse = await fetch("https://graph.facebook.com/v18.0/" + PHONE_ID + "/messages", {
        method: "POST",
        headers: { "Authorization": "Bearer " + WHATSAPP_TOKEN, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanPhone,
          type: "text",
          text: { body: fallbackText }
        })
      })
      const fallbackData = await fallbackResponse.json()
      return res.status(200).json({ original_error: data.error, fallback: fallbackData })
    }

    return res.status(200).json(data)
  } catch (err) {
    console.error("WhatsApp error:", err);
    return res.status(500).json({ error: err.message })
  }
}
