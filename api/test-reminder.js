export default async function handler(req, res) {
  const token = process.env.VITE_WHATSAPP_TOKEN
  const phoneId = process.env.VITE_WHATSAPP_PHONE_ID

  const response = await fetch("https://graph.facebook.com/v18.0/" + phoneId + "/messages", {
    method: "POST",
    headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: "593996504236",
      type: "template",
      template: {
        name: "recordatorio_24h_cx",
        language: { code: "es" },
        components: [{
          type: "body",
          parameters: [
            { type: "text", text: "Juan Pablo Salazar" },
            { type: "text", text: "Cash" },
            { type: "text", text: "VETPS" },
            { type: "text", text: "06:00 p. m." },
            { type: "text", text: "Consulta General" }
          ]
        }]
      }
    })
  })
  const data = await response.json()
  return res.status(200).json(data)
}
