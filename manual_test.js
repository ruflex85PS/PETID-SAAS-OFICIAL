const token = process.env.VITE_WHATSAPP_TOKEN || 'EAAMbk3ngtSIBRZBo2ZBOX84GunTLfY3vK5TnweLZAwQOjoJTczHrQL69dZCySW2jSs3apJuGUECiN6KBIIM4jNWXOTkxUdUQ6Rm3pnTT0UIwmqr7dmZBEdADVehhZBRtgZCbioLGYFKhI80DyETyYW9lQ7XdX4qvPc51YMSHr1aZBjY2qXLsbRLSLoPiioLx'
const phoneId = process.env.VITE_WHATSAPP_PHONE_ID || '1216728231519909'

async function run() {
  const res = await fetch("https://petid-vet-2.vercel.app/api/test-reminder")
  const json = await res.json()
  console.log(JSON.stringify(json, null, 2))
}
run()
