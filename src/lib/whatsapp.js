const WHATSAPP_TOKEN = import.meta.env.VITE_WHATSAPP_TOKEN
const PHONE_ID = import.meta.env.VITE_WHATSAPP_PHONE_ID

export async function sendAppointmentConfirmation(to, params) {
  if (!WHATSAPP_TOKEN || !PHONE_ID) { console.warn("WhatsApp missing"); return null }
  let cleanPhone = to.replace(/\D/g, "")
  if (cleanPhone.startsWith("0")) { cleanPhone = "593" + cleanPhone.slice(1) }
  const { customerName, businessName, fecha, hora, serviceName } = params
  try {
    const res = await fetch("https://graph.facebook.com/v18.0/" + PHONE_ID + "/messages", {
      method: "POST",
      headers: { "Authorization": "Bearer " + WHATSAPP_TOKEN, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: cleanPhone, type: "template", template: { name: "confirmacion_cita", language: { code: "es" }, components: [{ type: "body", parameters: [{ type: "text", text: customerName }, { type: "text", text: businessName }, { type: "text", text: fecha }, { type: "text", text: hora }, { type: "text", text: serviceName }] }] } })
    })
    const data = await res.json()
    console.log("WhatsApp response:", JSON.stringify(data))
    return data
  } catch (err) { console.error("WhatsApp error:", err); return null }
}