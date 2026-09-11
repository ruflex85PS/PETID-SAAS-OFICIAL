import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
import fs from 'fs'

const env = fs.readFileSync('.env.vercel', 'utf8')
const url = env.match(/VITE_SUPABASE_URL="(.+?)"/)[1] || env.match(/VITE_SUPABASE_URL=(.+)/)[1]
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY="(.+?)"/)[1] || env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1]

const supabase = createClient(url.replace(/"/g, ''), key.replace(/"/g, ''), { realtime: { transport: ws } })

async function run() {
  await supabase.from('whatsapp_templates').update({ name: 'Respuesta a Cancelación / Cupo' }).eq('template_type', 'slot_recovery')
  console.log('Template fixed.')
  
  // Create RLS Policy for organizations
  const { error } = await supabase.rpc('execute_sql', { sql: 'CREATE POLICY "org_insert_any" ON organizations FOR INSERT WITH CHECK (true);' })
  console.log('RLS Update:', error?.message || 'Success')
}
run()
