import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Save } from 'lucide-react'

const ICONS = { confirmation_request: '✅', reminder_24h: '⏰', followup_postconsult: '🔍', slot_recovery: '❌' }
const VARIABLES = { confirmation_request: ['{nombre}','{negocio}','{fecha}','{hora}','{servicio}'], reminder_24h: ['{nombre}','{negocio}','{hora}','{servicio}'], followup_postconsult: ['{nombre}','{mascota}','{servicio}'], slot_recovery: ['{nombre}','{fecha}','{hora}','{negocio}'] }

export default function TemplatesPage() {
  const { profile } = useAuth()
  const isSuperAdmin = profile?.is_super_admin === true
  const [templates, setTemplates] = useState([])
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadTemplates() }, [])

  async function loadTemplates() {
    const { data } = await supabase.from('whatsapp_templates').select('*').order('created_at')
    if (data) { setTemplates(data); setSelected(data[0]?.template_type) }
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const current = templates.find(t => t.template_type === selected)
    await supabase.from('whatsapp_templates').update({ message: current.message, updated_at: new Date().toISOString() }).eq('template_type', selected)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  function updateMsg(msg) { setTemplates(ts => ts.map(t => t.template_type === selected ? {...t, message: msg} : t)) }

  const current = templates.find(t => t.template_type === selected)

  if (!isSuperAdmin) return <div style={{padding:40,textAlign:'center'}}><h2>Acceso restringido</h2><p>Solo el Super Admin puede gestionar plantillas.</p></div>
  if (loading) return <div style={{padding:40,textAlign:'center'}}>Cargando plantillas...</div>

  return (
    <div style={{padding:24,maxWidth:900,margin:'0 auto'}}>
      <h1 style={{marginBottom:8}}>Plantillas de WhatsApp</h1>
      <p style={{color:'#6b7280',marginBottom:24}}>Edita los mensajes automaticos que se envian a los clientes</p>
      <div style={{display:'grid',gridTemplateColumns:'260px 1fr',gap:24}}>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {templates.map(t => (
            <div key={t.template_type} onClick={() => setSelected(t.template_type)} style={{padding:'12px 16px',borderRadius:10,cursor:'pointer',background:selected===t.template_type?'#eff6ff':'white',border:'2px solid '+(selected===t.template_type?'#3b82f6':'#e5e7eb'),display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:'1.5rem'}}>{ICONS[t.template_type]}</span>
              <span style={{fontWeight:500,color:selected===t.template_type?'#3b82f6':'#1f2937',fontSize:'0.9rem'}}>{t.name}</span>
            </div>
          ))}
        </div>
        <div style={{background:'white',borderRadius:12,padding:24,border:'1px solid #e5e7eb'}}>
          <h3 style={{marginBottom:4}}>{ICONS[selected]} {current?.name}</h3>
          <p style={{color:'#6b7280',fontSize:'0.8rem',marginBottom:12}}>Variables: {(VARIABLES[selected]||[]).join(', ')}</p>
          <textarea style={{width:'100%',minHeight:120,padding:12,borderRadius:8,border:'1px solid #e5e7eb',fontSize:'0.95rem',resize:'vertical',boxSizing:'border-box'}} value={current?.message||''} onChange={e => updateMsg(e.target.value)} />
          <div style={{marginTop:8,padding:12,background:'#f0f9ff',borderRadius:8,fontSize:'0.85rem',color:'#0369a1'}}>
            <strong>Vista previa:</strong><br/>{(current?.message||'').replace('{nombre}','Juan').replace('{negocio}','Veterinaria PETID').replace('{fecha}','lunes 23 de junio').replace('{hora}','10:00').replace('{servicio}','Consulta General').replace('{mascota}','Max')}
          </div>
          <button onClick={handleSave} disabled={saving} style={{marginTop:16,display:'flex',alignItems:'center',gap:8,background:saved?'#16a34a':'#3b82f6',color:'white',border:'none',padding:'10px 20px',borderRadius:8,cursor:'pointer',fontWeight:500}}>
            <Save size={16}/>{saving?'Guardando...':saved?'Guardado':'Guardar plantilla'}
          </button>
        </div>
      </div>
    </div>
  )
}