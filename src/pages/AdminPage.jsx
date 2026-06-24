import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function AdminPage() {
  const { profile } = useAuth()
  const isSuperAdmin = profile?.is_super_admin === true
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [selectedOrg, setSelectedOrg] = useState(null)
  const [orgStats, setOrgStats] = useState({})
  const navigate = useNavigate()

  useEffect(() => { if (isSuperAdmin) loadOrgs() }, [isSuperAdmin])

  async function loadOrgs() {
    const { data } = await supabase.from('organizations').select('*').order('created_at', { ascending: false })
    if (data) {
      setOrgs(data)
      data.forEach(org => loadOrgStats(org.id))
    }
    setLoading(false)
  }

  async function loadOrgStats(orgId) {
    const [{ count: citas }, { count: clientes }, { count: autos }] = await Promise.all([
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
      supabase.from('customers').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
      supabase.from('automations').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    ])
    setOrgStats(prev => ({ ...prev, [orgId]: { citas: citas || 0, clientes: clientes || 0, autos: autos || 0 } }))
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

  if (selectedOrg) {
    const stats = orgStats[selectedOrg.id] || {}
    return (
      <div style={{padding:24,maxWidth:1000,margin:'0 auto'}}>
        <button onClick={() => setSelectedOrg(null)} style={{background:'none',border:'none',color:'#3b82f6',cursor:'pointer',fontSize:'0.9rem',marginBottom:16,display:'flex',alignItems:'center',gap:4}}>
          ← Volver al panel
        </button>
        <div style={{background:'white',borderRadius:12,padding:24,border:'1px solid #e5e7eb',marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
            <h2 style={{margin:0}}>{selectedOrg.name}</h2>
            <span style={{padding:'2px 10px',borderRadius:20,fontSize:'0.75rem',fontWeight:600,background:selectedOrg.status==='active'?'#dcfce7':'#fee2e2',color:selectedOrg.status==='active'?'#16a34a':'#dc2626'}}>{selectedOrg.status==='active'?'Activa':'Suspendida'}</span>
          </div>
          <p style={{color:'#6b7280',margin:0}}>{selectedOrg.industry} · {selectedOrg.email} · {selectedOrg.phone} · {selectedOrg.address}</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:20}}>
          <div style={{background:'white',borderRadius:12,padding:20,border:'1px solid #e5e7eb',textAlign:'center'}}>
            <div style={{fontSize:'2rem',fontWeight:700,color:'#3b82f6'}}>{stats.citas || 0}</div>
            <div style={{color:'#6b7280',fontSize:'0.85rem'}}>Citas totales</div>
          </div>
          <div style={{background:'white',borderRadius:12,padding:20,border:'1px solid #e5e7eb',textAlign:'center'}}>
            <div style={{fontSize:'2rem',fontWeight:700,color:'#10b981'}}>{stats.clientes || 0}</div>
            <div style={{color:'#6b7280',fontSize:'0.85rem'}}>Clientes</div>
          </div>
          <div style={{background:'white',borderRadius:12,padding:20,border:'1px solid #e5e7eb',textAlign:'center'}}>
            <div style={{fontSize:'2rem',fontWeight:700,color:'#f59e0b'}}>{stats.autos || 0}</div>
            <div style={{color:'#6b7280',fontSize:'0.85rem'}}>Automatizaciones</div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
          <button onClick={() => navigate('/appointments')} style={{padding:16,borderRadius:10,border:'1px solid #e5e7eb',background:'white',cursor:'pointer',textAlign:'left',fontWeight:500}}>📅 Ver Agenda</button>
          <button onClick={() => navigate('/customers')} style={{padding:16,borderRadius:10,border:'1px solid #e5e7eb',background:'white',cursor:'pointer',textAlign:'left',fontWeight:500}}>👥 Ver Clientes</button>
          <button onClick={() => navigate('/automations')} style={{padding:16,borderRadius:10,border:'1px solid #e5e7eb',background:'white',cursor:'pointer',textAlign:'left',fontWeight:500}}>⚡ Ver Automatizaciones</button>
          <button onClick={() => navigate('/pets')} style={{padding:16,borderRadius:10,border:'1px solid #e5e7eb',background:'white',cursor:'pointer',textAlign:'left',fontWeight:500}}>🐾 Ver Mascotas</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{padding:24,maxWidth:1000,margin:'0 auto'}}>
      <h1 style={{marginBottom:8}}>Panel Super Admin</h1>
      <p style={{color:'#6b7280',marginBottom:24}}>Gestiona todas las cuentas de clientes PETID</p>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {orgs.map(org => (
          <div key={org.id} style={{background:'white',borderRadius:12,padding:20,border:'1px solid '+(org.status==='suspended'?'#fca5a5':'#e5e7eb')}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                  <h3 style={{margin:0}}>{org.name}</h3>
                  <span style={{padding:'2px 10px',borderRadius:20,fontSize:'0.75rem',fontWeight:600,background:org.status==='active'?'#dcfce7':'#fee2e2',color:org.status==='active'?'#16a34a':'#dc2626'}}>{org.status==='active'?'Activa':'Suspendida'}</span>
                </div>
                <div style={{color:'#6b7280',fontSize:'0.85rem'}}>{org.industry} · {org.email || 'Sin correo'} · {org.phone || 'Sin teléfono'}</div>
                <div style={{color:'#9ca3af',fontSize:'0.75rem',marginTop:4}}>Creada: {new Date(org.created_at).toLocaleDateString('es-EC')}</div>
                <div style={{display:'flex',gap:16,marginTop:8,fontSize:'0.8rem',color:'#6b7280'}}>
                  <span>📅 {orgStats[org.id]?.citas || 0} citas</span>
                  <span>👥 {orgStats[org.id]?.clientes || 0} clientes</span>
                  <span>⚡ {orgStats[org.id]?.autos || 0} automatizaciones</span>
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <button onClick={() => setSelectedOrg(org)} style={{padding:'8px 16px',borderRadius:8,border:'1px solid #3b82f6',cursor:'pointer',fontWeight:600,fontSize:'0.85rem',background:'white',color:'#3b82f6'}}>
                  Ver cuenta
                </button>
                <button onClick={() => toggleStatus(org)} disabled={updating === org.id} style={{padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',fontWeight:600,fontSize:'0.85rem',background:org.status==='active'?'#fee2e2':'#dcfce7',color:org.status==='active'?'#dc2626':'#16a34a'}}>
                  {updating === org.id ? 'Actualizando...' : org.status === 'active' ? 'Suspender' : 'Activar'}
                </button>
              </div>
            </div>
          </div>
        ))}
        {orgs.length === 0 && <p style={{textAlign:'center',color:'#6b7280'}}>No hay clientes registrados aún.</p>}
      </div>
    </div>
  )
}