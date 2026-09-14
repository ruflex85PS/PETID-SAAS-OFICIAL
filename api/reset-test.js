import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const { data, error } = await supabase.from('appointments').update({ reminder_24h_sent: false }).eq('status', 'scheduled')
  res.status(200).json({ data, error })
}
