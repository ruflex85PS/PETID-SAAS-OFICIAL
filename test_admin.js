import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pmfchiabvzyawmcmbhck.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtZmNoaWFidnp5YXdtY21iaGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExODUzNjAsImV4cCI6MjA5Njc2MTM2MH0._T8WSbBSYyh_x6J5xzxSGWs7F8XemIRJzoffod0Q-Bk'
const supabaseAnon = createClient(supabaseUrl, supabaseKey, { realtime: { transport: ws } })

async function run() {
  await supabaseAnon.auth.signInWithPassword({ email: 'jpsalazargarcia@gmail.com', password: '10111985' })
  const { data: orgs } = await supabaseAnon.from('organizations').select('*')
  console.log("Orgs:", orgs.map(o => o.name))
  
  for (let org of orgs) {
    const { data: automations } = await supabaseAnon.from('automations')
      .select('*').eq('organization_id', org.id).order('created_at', { ascending: false }).limit(3)
    console.log(`Automations for ${org.name}:`, automations.map(a => ({ type: a.automation_type, status: a.status, error: a.error_message, time: a.created_at })))
  }
}
run()
