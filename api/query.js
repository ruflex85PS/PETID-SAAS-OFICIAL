import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({hello: "world"})
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { realtime: { transport: ws } }
  )
  const query = req.body.query
  if (query === 'andy') {
    const { data: orgs } = await supabase.from('organizations').select('id').eq('name', 'Luis Alava')
    if (orgs.length === 0) return res.status(200).json({ error: "no org" })
    const orgId = orgs[0].id
    const { data: appts } = await supabase.from('appointments')
      .select('id, title, status, scheduled_at, updated_at, customers(full_name, phone)')
      .eq('organization_id', orgId)
      .order('updated_at', { ascending: false })
      .limit(10)
    return res.status(200).json(appts)
  }
  return res.status(200).json({ error: "invalid query" })
}
