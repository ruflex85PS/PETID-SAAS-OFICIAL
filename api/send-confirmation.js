export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const WHATSAPP_TOKEN = (process.env.WHATSAPP_TOKEN || process.env.VITE_WHATSAPP_TOKEN || 'EAATPwIgNsnIBSvcT6MZAzAgqR6MesZAD8xumSVFVoFpfXaJlg91w8ZAiqCiU8JZCh3yJkawXKl1ZBZAMiYlJ63EZCrZBXpL2wdLQelZBLbLmuADI7jcz6XlGC7JKj5SEPSW58AdWUHzXVrZBOnQmD0UDgCGdZC6coIPFWxcvXWZB1PBZA14wOeIX8kRZCahleZAGLHlO04epUyZC2J3ooYDla8EpSRlaKYYVAh0fPLNlenvZCSquGJNx4hoD9tMZBn9JZAbFcTncMiHpZByHZCUVc89MKIJptEMtuwAZDZD').trim();
  const PHONE_ID = (process.env.VITE_WHATSAPP_PHONE_ID || '1277147338823083').trim();

  if (!WHATSAPP_TOKEN || !PHONE_ID) {
    console.error('WhatsApp credentials missing on server');
    return res.status(500).json({ error: 'WhatsApp credentials missing' });
  }

  const { to, params } = req.body
  if (!to || !params) {
    return res.status(400).json({ error: 'Missing to or params' })
  }

    let cleanPhone = to.replace(/\D/g, "")
    // Si tiene 9 dígitos y empieza con 9 (ej. 996504236), le falta el 0 inicial
    if (cleanPhone.length === 9 && cleanPhone.startsWith("9")) {
      cleanPhone = "593" + cleanPhone
    } else if (cleanPhone.startsWith("0")) { 
      cleanPhone = "593" + cleanPhone.slice(1) 
    }
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
              { type: "text", text: customerName || "Cliente" },
              { type: "text", text: petName || "tu mascota" },
              { type: "text", text: businessName || "nuestra clínica" },
              { type: "text", text: fecha || "fecha acordada" },
              { type: "text", text: hora || "hora acordada" },
              { type: "text", text: serviceName || "Consulta" }
            ]
          }]
        }
      })
    })
    const data = await response.json()
    
    // Fallback: If template fails (e.g. PENDING), try sending as plain text (works if 24h window is open)
    if (data.error) {
      console.warn("Template failed, attempting text fallback:", data.error.message)
      const fallbackText = `Hola ${customerName || "Cliente"}, hemos agendado con éxito la cita para tu mascota ${petName || "tu mascota"} en ${businessName || "nuestra clínica"}. 📍 Fecha: ${fecha || "fecha acordada"} a las ${hora || "hora acordada"}. Servicio: ${serviceName || "Consulta"}.`
      
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
