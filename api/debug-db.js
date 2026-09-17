import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { realtime: { transport: ws } }
  )
  const { data: appts } = await supabase
    .from('appointments')
    .select('id, status, updated_at, scheduled_at, customers(full_name, phone)')
    .order('updated_at', { ascending: false })
    .limit(10)
    
  const { data: automations } = await supabase
    .from('automations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  res.status(200).json({ appts, automations })
}
