import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const { data, error } = await supabase.from('automations')
    .select('*, organizations(name)')
    .order('created_at', { ascending: false })
    .limit(10)
  res.status(200).json({ data, error })
}
