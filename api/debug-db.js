import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const { data: appts } = await supabase
    .from('appointments')
    .select('id, status, updated_at, scheduled_at, customers(full_name)')
    .order('updated_at', { ascending: false })
    .limit(10)
    
  res.status(200).json(appts)
}
