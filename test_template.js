import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pmfchiabvzyawmcmbhck.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtZmNoaWFidnp5YXdtY21iaGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExODUzNjAsImV4cCI6MjA5Njc2MTM2MH0._T8WSbBSYyh_x6J5xzxSGWs7F8XemIRJzoffod0Q-Bk'
const supabaseAnon = createClient(supabaseUrl, supabaseKey, { realtime: { transport: ws } })

async function run() {
  await supabaseAnon.auth.signInWithPassword({ email: 'jpsalazargarcia@gmail.com', password: '10111985' })
  const { data, error } = await supabaseAnon.from('whatsapp_templates').select('*').eq('template_type', 'reschedule_reply').single()
  console.log("Reschedule Template single():", error ? error.message : "Success")
}
run()
