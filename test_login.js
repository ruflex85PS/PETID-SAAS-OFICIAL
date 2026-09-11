import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
const supabaseAnon = createClient('https://pmfchiabvzyawmcmbhck.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtZmNoaWFidnp5YXdtY21iaGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExODUzNjAsImV4cCI6MjA5Njc2MTM2MH0._T8WSbBSYyh_x6J5xzxSGWs7F8XemIRJzoffod0Q-Bk', { realtime: { transport: ws } })

async function run() {
  const { data, error } = await supabaseAnon.auth.signInWithPassword({
    email: 'jpsalazargarcia@gmail.com',
    password: '10111985'
  })
  if (error) { console.error('Auth error:', error); return; }
  
  const { data: profile } = await supabaseAnon.from('profiles').select('*').eq('id', data.user.id).single()
  const { data: org } = await supabaseAnon.from('organizations').select('*').eq('id', profile.organization_id).single()
  const { data: customers } = await supabaseAnon.from('customers').select('id, full_name, phone').eq('organization_id', profile.organization_id)
  const { data: services } = await supabaseAnon.from('services').select('id, name').eq('organization_id', profile.organization_id)
  
  console.log('Org:', org.name)
  console.log('Customers:', customers)
  console.log('Services:', services)
}
run()
