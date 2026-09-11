export default async function handler(req, res) {
  const token = process.env.WHATSAPP_TOKEN || process.env.VITE_WHATSAPP_TOKEN
  const wabaId = process.env.VITE_WHATSAPP_BUSINESS_ID
  const response = await fetch(`https://graph.facebook.com/v18.0/${wabaId}/message_templates?limit=100`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const data = await response.json()
  res.status(200).json(data)
}
