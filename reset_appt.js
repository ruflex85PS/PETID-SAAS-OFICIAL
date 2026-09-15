import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pmfchiabvzyawmcmbhck.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Need service role key to update!
const supabaseAnon = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtZmNoaWFidnp5YXdtY21iaGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExODUzNjAsImV4cCI6MjA5Njc2MTM2MH0._T8WSbBSYyh_x6J5xzxSGWs7F8XemIRJzoffod0Q-Bk', { realtime: { transport: ws } })

async function run() {
  await supabaseAnon.auth.signInWithPassword({ email: 'jpsalazargarcia@gmail.com', password: '10111985' })
  const { data } = await supabaseAnon.from('appointments').update({ reminder_24h_sent: false }).eq('status', 'scheduled')
  console.log('Reset reminder_24h_sent for appointments.')
}
run()
