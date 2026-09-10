import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
const supabase = createClient(
  'https://pmfchiabvzyawmcmbhck.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtZmNoaWFidnp5YXdtY21iaGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExODUzNjAsImV4cCI6MjA5Njc2MTM2MH0._T8WSbBSYyh_x6J5xzxSGWs7F8XemIRJzoffod0Q-Bk',
  { realtime: { transport: ws } }
)
async function run() {
  const { data: customers } = await supabase.from('customers').select('id, full_name, pets(id, name), appointments(id)')
  const testCustomers = customers.filter(c => c.full_name === 'PS' || c.full_name.toLowerCase().includes('cash') || c.pets.some(p => p.name.toLowerCase().includes('cash')))
  console.log(JSON.stringify(testCustomers, null, 2))
}
run()
