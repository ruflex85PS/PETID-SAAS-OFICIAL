import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
const supabaseAnon = createClient(
  'https://pmfchiabvzyawmcmbhck.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtZmNoaWFidnp5YXdtY21iaGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExODUzNjAsImV4cCI6MjA5Njc2MTM2MH0._T8WSbBSYyh_x6J5xzxSGWs7F8XemIRJzoffod0Q-Bk', 
  { realtime: { transport: ws } }
)

async function run() {
  await supabaseAnon.auth.signInWithPassword({ email: 'jpsalazargarcia@gmail.com', password: '10111985' })
  const { data: citas } = await supabaseAnon.from('appointments').select('*').order('created_at', { ascending: false }).limit(5)
  console.log('Appts:', JSON.stringify(citas, null, 2))
}
run()
