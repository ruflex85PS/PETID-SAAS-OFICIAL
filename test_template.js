const token = process.env.VITE_WHATSAPP_TOKEN || 'EAAMbk3ngtSIBRZBo2ZBOX84GunTLfY3vK5TnweLZAwQOjoJTczHrQL69dZCySW2jSs3apJuGUECiN6KBIIM4jNWXOTkxUdUQ6Rm3pnTT0UIwmqr7dmZBEdADVehhZBRtgZCbioLGYFKhI80DyETyYW9lQ7XdX4qvPc51YMSHr1aZBjY2qXLsbRLSLoPiioLx'
const phoneId = process.env.VITE_WHATSAPP_PHONE_ID || '1216728231519909'

async function run() {
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
  console.log(JSON.stringify(data, null, 2))
}
run()
