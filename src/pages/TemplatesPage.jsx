import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Save } from 'lucide-react'

const DEFAULT_TEMPLATES = [
  { id: 'confirmation_request', name: 'Confirmacion de cita', icon: '✅', variables: ['nombre', 'negocio', 'fecha', 'hora', 'servicio'], defaultMsg: 'Hola {nombre}, te confirmamos tu cita en {negocio}. Fecha: {fecha} a las {hora}. Servicio: {servicio}. Si necesitas cancelar contactanos.' },
  { id: 'reminder_24h', name: 'Recordatorio 24h antes', icon: '⏰', variables: ['nombre', 'negocio', 'hora', 'servicio'], defaultMsg: 'Hola {nombre}, te recordamos que manana tienes cita en {negocio} a las {hora}. Servicio: {servicio}. Te esperamos.' },
  { id: 'followup_postconsult', name: 'Seguimiento post-consulta', icon: '🔍', variables: ['nombre', 'mascota', 'servicio'], defaultMsg: 'Hola {nombre}, esperamos que {mascota} se encuentre bien tras su consulta de {servicio}. Tienes alguna duda? Estamos para ayudarte.' },
  { id: 'slot_recovery', name: 'Cancelacion de cita', icon: '❌', variables: ['nombre', 'fecha', 'hora', 'negocio'], defaultMsg: 'Hola {nombre}, tu cita del {fecha} a las {hora} en {negocio} ha sido cancelada. Contactanos para reagendar.' },
]

export default function TemplatesPage() {
  const { profile } = useAuth()
  const isSuperAdmin = profile?.is_super_admin === true
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES)
  const [selected, setSelected] = useState(DEFAULT_TEMPLATES[0].id)
  const [saved, setSaved] = useState(false)
  const current = templates.find(t => t.id === selected)
  function updateMsg(msg) { setTemplates(ts => ts.map(t => t.id === selected ? {...t, defaultMsg: msg} : t)) }
  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  if (!isSuperAdmin) return <div style={{padding:40,textAlign:'center'}}><h2>Acceso restringido</h2><p>Solo el Super Admin puede gestionar plantillas.</p></div>
  return (
    <div style={{padding:24,maxWidth:900,margin:'0 auto'}}>
      <h1 style={{marginBottom:8}}>Plantillas de WhatsApp</h1>
      <p style={{color:'#6b7280',marginBottom:24}}>Gestiona los mensajes automaticos que se envian a los clientes</p>
      <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:24}}>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {templates.map(t => (
            <div key={t.id} onClick={() => setSelected(t.id)} style={{padding:'12px 16px',borderRadius:10,cursor:'pointer',background:selected===t.id?'#eff6ff':'white',border:'2px solid '+(selected===t.id?'#3b82f6':'#e5e7eb'),display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:'1.5rem'}}>{t.icon}</span>
              <span style={{fontWeight:500,color:selected===t.id?'#3b82f6':'#1f2937'}}>{t.name}</span>
            </div>
          ))}
        </div>
        <div style={{background:'white',borderRadius:12,padding:24,border:'1px solid #e5e7eb'}}>
          <h3 style={{marginBottom:8}}>{current?.icon} {current?.name}</h3>
          <p style={{color:'#6b7280',fontSize:'0.85rem',marginBottom:16}}>Variables: {current?.variables.map(v => '{'+v+'}').join(', ')}</p>
          <textarea style={{width:'100%',minHeight:120,padding:12,borderRadius:8,border:'1px solid #e5e7eb',fontSize:'0.95rem',resize:'vertical',boxSizing:'border-box'}} value={current?.defaultMsg} onChange={e => updateMsg(e.target.value)} />
          <div style={{marginTop:8,padding:12,background:'#f0f9ff',borderRadius:8,fontSize:'0.85rem',color:'#0369a1'}}>
            <strong>Vista previa:</strong><br/>{current?.defaultMsg.replace('{nombre}','Juan').replace('{negocio}','Veterinaria PETID').replace('{fecha}','lunes 23 de junio').replace('{hora}','10:00').replace('{servicio}','Consulta General').replace('{mascota}','Max')}
          </div>
          <button onClick={handleSave} style={{marginTop:16,display:'flex',alignItems:'center',gap:8,background:'#3b82f6',color:'white',border:'none',padding:'10px 20px',borderRadius:8,cursor:'pointer',fontWeight:500}}>
            <Save size={16}/>{saved?'Guardado':'Guardar plantilla'}
          </button>
        </div>
      </div>
    </div>
  )
}