import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function AdminPage() {
  const { profile } = useAuth()
  const isSuperAdmin = profile?.is_super_admin === true
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  useEffect(() => { if (isSuperAdmin) loadOrgs() }, [isSuperAdmin])

  async function loadOrgs() {
    const { data } = await supabase.from('organizations').select('*').order('created_at', { ascending: false })
    if (data) setOrgs(data)
    setLoading(false)
  }

  async function toggleStatus(org) {
    setUpdating(org.id)
    const newStatus = org.status === 'active' ? 'suspended' : 'active'
    await supabase.from('organizations').update({ status: newStatus }).eq('id', org.id)
    setOrgs(os => os.map(o => o.id === org.id ? {...o, status: newStatus} : o))
    setUpdating(null)
  }

  if (!isSuperAdmin) return <div style={{padding:40,textAlign:'center'}}><h2>Acceso restringido</h2></div>
  if (loading) return <div style={{padding:40,textAlign:'center'}}>Cargando clientes...</div>

  return (
    <div style={{padding:24,maxWidth:1000,margin:'0 auto'}}>
      <h1 style={{marginBottom:8}}>Panel Super Admin</h1>
      <p style={{color:'#6b7280',marginBottom:24}}>Gestiona todas las cuentas de clientes PETID</p>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {orgs.map(org => (
          <div key={org.id} style={{background:'white',borderRadius:12,padding:20,border:'1px solid '+(org.status==='suspended'?'#fca5a5':'#e5e7eb'),display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                <h3 style={{margin:0}}>{org.name}</h3>
                <span style={{padding:'2px 10px',borderRadius:20,fontSize:'0.75rem',fontWeight:600,background:org.status==='active'?'#dcfce7':'#fee2e2',color:org.status==='active'?'#16a34a':'#dc2626'}}>{org.status==='active'?'Activa':'Suspendida'}</span>
              </div>
              <div style={{color:'#6b7280',fontSize:'0.85rem'}}>
                {org.industry} · {org.email || 'Sin correo'} · {org.phone || 'Sin teléfono'}
              </div>
              <div style={{color:'#9ca3af',fontSize:'0.75rem',marginTop:4}}>
                Creada: {new Date(org.created_at).toLocaleDateString('es-EC')}
              </div>
            </div>
            <button
              onClick={() => toggleStatus(org)}
              disabled={updating === org.id}
              style={{padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',fontWeight:600,fontSize:'0.85rem',background:org.status==='active'?'#fee2e2':'#dcfce7',color:org.status==='active'?'#dc2626':'#16a34a'}}
            >
              {updating === org.id ? 'Actualizando...' : org.status === 'active' ? 'Suspender cuenta' : 'Activar cuenta'}
            </button>
          </div>
        ))}
        {orgs.length === 0 && <p style={{textAlign:'center',color:'#6b7280'}}>No hay clientes registrados aún.</p>}
      </div>
    </div>
  )
}