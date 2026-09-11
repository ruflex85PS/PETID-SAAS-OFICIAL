import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
const supabaseAnon = createClient('https://pmfchiabvzyawmcmbhck.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtZmNoaWFidnp5YXdtY21iaGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExODUzNjAsImV4cCI6MjA5Njc2MTM2MH0._T8WSbBSYyh_x6J5xzxSGWs7F8XemIRJzoffod0Q-Bk', { realtime: { transport: ws } })

async function run() {
  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email: 'jpsalazargarcia@gmail.com', password: '10111985' })
  
  const { data: profile } = await supabaseAnon.from('profiles').select('*').eq('id', data.user.id).single()
  const { data: org } = await supabaseAnon.from('organizations').select('*').eq('id', profile.organization_id).single()
  let { data: customers } = await supabaseAnon.from('customers').select('*').eq('organization_id', org.id)
  let customer = customers.find(c => c.phone.includes('996504236'))

  // Create appointment
  const apptData = {
    organization_id: org.id,
    customer_id: customer.id,
    title: 'Consulta General',
    scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: 'scheduled'
  }
  const { data: appt, error: err } = await supabaseAnon.from('appointments').insert(apptData).select().single()
  console.log('Appt created:', appt?.id, err?.message)

  // Trigger webhook
  const res = await fetch('https://petid-vet-2.vercel.app/api/send-confirmation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: customer.phone,
      params: {
        customerName: customer.full_name,
        businessName: org.name,
        fecha: 'mañana',
        hora: '10:00 AM',
        serviceName: 'Consulta General'
      }
    })
  })
  
  const text = await res.text()
  console.log('Webhook result:', text)
}
run()
