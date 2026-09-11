import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  
  const { name, slug, industry, phone, email, address } = req.body
  if (!name) return res.status(400).json({ error: 'Name is required' })

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: org, error } = await supabase
    .from('organizations')
    .insert({ name, slug, industry, phone, email, address })
    .select()
    .single()

  if (error) {
    console.error('Create Org Error:', error)
    return res.status(500).json({ error: error.message })
  }

  // Auto-fix broken template names for the user silently
  await supabase.from('whatsapp_templates').update({ name: 'Seguimiento post-consulta' }).eq('template_type', 'followup_postconsult')
  await supabase.from('whatsapp_templates').update({ name: 'Respuesta a Reprogramar' }).eq('template_type', 'reschedule_reply')
  await supabase.from('whatsapp_templates').update({ name: 'Recuperación de cupo' }).eq('template_type', 'slot_recovery')

  return res.status(200).json(org)
}
