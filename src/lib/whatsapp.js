const WHATSAPP_TOKEN = import.meta.env.VITE_WHATSAPP_TOKEN
const PHONE_ID = import.meta.env.VITE_WHATSAPP_PHONE_ID

export async function sendAppointmentConfirmation(to, params) {
  const cleanPhone = to.replace(/D/g, '')
  const { customerName, businessName, fecha, hora, serviceName } = params
  try {
    const res = await fetch('https://graph.facebook.com/v18.0/' + PHONE_ID + '/messages', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + WHATSAPP_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: cleanPhone, type: 'template', template: { name: 'confirmacion_cita', language: { code: 'es' }, components: [{ type: 'body', parameters: [{ type: 'text', text: customerName }, { type: 'text', text: businessName }, { type: 'text', text: fecha }, { type: 'text', text: hora }, { type: 'text', text: serviceName }] }] } })
    })
    return await res.json()
  } catch (err) { console.error('WhatsApp error:', err); return null }
}