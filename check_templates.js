const token = process.env.VITE_WHATSAPP_TOKEN || 'EAAMbk3ngtSIBRZBo2ZBOX84GunTLfY3vK5TnweLZAwQOjoJTczHrQL69dZCySW2jSs3apJuGUECiN6KBIIM4jNWXOTkxUdUQ6Rm3pnTT0UIwmqr7dmZBEdADVehhZBRtgZCbioLGYFKhI80DyETyYW9lQ7XdX4qvPc51YMSHr1aZBjY2qXLsbRLSLoPiioLx'
const wabaId = process.env.VITE_WHATSAPP_BUSINESS_ID || '2246396686098611'

async function run() {
  const res = await fetch(`https://graph.facebook.com/v18.0/${wabaId}/message_templates?limit=100`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const data = await res.json()
  console.log(JSON.stringify(data, null, 2))
}
run()
