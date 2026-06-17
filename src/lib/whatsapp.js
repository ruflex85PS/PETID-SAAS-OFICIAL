const WHATSAPP_TOKEN = import.meta.env.VITE_WHATSAPP_TOKEN
const PHONE_ID = import.meta.env.VITE_WHATSAPP_PHONE_ID

export async function sendWhatsAppMessage(to, message) {
  if (!WHATSAPP_TOKEN || !PHONE_ID) { console.warn('WhatsApp missing'); return null }
  const cleanPhone = to.replace(/\D/g, '')
  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/${PHONE_ID}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: cleanPhone, type: 'text', text: { body: message } })
    })
    return await res.json()
  } catch (err) { console.error('WhatsApp error:', err); return null }
}

export function buildAppointmentMessage(d) {
  const fecha = new Date(d.scheduledAt).toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const hora = new Date(d.scheduledAt).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
  return 'Hola ' + d.customerName + ', tu cita en ' + d.businessName + ' es el ' + fecha + ' a las ' + hora + '. Servicio: ' + d.serviceName + (d.petName ? '. Mascota: ' + d.petName : '') + '. Gracias!'
}
