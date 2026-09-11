import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Building2, ArrowRight } from 'lucide-react'

const INDUSTRIES = [
  { value: 'veterinary', label: '🐾 PETID Vet', desc: 'Clínica veterinaria o pet shop' },
  { value: 'health', label: '🏥 PETID Salud', desc: 'Médicos, especialistas, clínicas' },
  { value: 'insurance', label: '🛡️ PETID Seguros', desc: 'Brokers y aseguradoras' },
]

export default function SetupOrganizationPage() {
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('veterinary')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user, refreshProfile } = useAuth()

  function generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .slice(0, 50) + '-' + Date.now().toString(36)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('El nombre del negocio es obligatorio.'); return }
    setError('')
    setLoading(true)

    try {
      // 1. Create organization via API (bypasses RLS)
      const res = await fetch('/api/create-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: generateSlug(name),
          industry,
          phone: phone || null,
          email: email || null,
          address: address || null,
        })
      })
      const org = await res.json()
      if (!res.ok) throw new Error(org.error || 'Error al crear la organización')

      // 2. Link profile to organization
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ organization_id: org.id, role: 'owner' })
        .eq('id', user.id)

      if (profileError) throw profileError

      // 3. Create default services based on industry
      const defaultServices = getDefaultServices(industry, org.id)
      if (defaultServices.length > 0) {
        await supabase.from('services').insert(defaultServices)
      }

      await refreshProfile()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #EEF2FF 0%, #F0FDF4 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24
    }}>
      <div style={{
        background: 'white',
        borderRadius: 20,
        padding: '40px',
        width: '100%',
        maxWidth: 580,
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--gray-200)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🚀</div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: 8 }}>Configura tu negocio</h1>
          <p style={{ color: 'var(--gray-500)' }}>Un último paso antes de comenzar</p>
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: 20 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre del negocio *</label>
            <input type="text" className="form-control" placeholder="Ej: Clínica Veterinaria San Marcos"
              value={name} onChange={e => setName(e.target.value)} required autoFocus />
          </div>

          <div className="form-group">
            <label>Tipo de negocio</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {INDUSTRIES.map(ind => (
                <button
                  key={ind.value}
                  type="button"
                  onClick={() => setIndustry(ind.value)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: `2px solid ${industry === ind.value ? 'var(--primary)' : 'var(--gray-200)'}`,
                    background: industry === ind.value ? 'var(--primary-bg)' : 'white',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: industry === ind.value ? 'var(--primary)' : 'var(--gray-800)' }}>
                    {ind.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: 2 }}>
                    {ind.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Teléfono</label>
              <input type="tel" className="form-control" placeholder="+593 99 000 0000"
                value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Correo del negocio</label>
              <input type="email" className="form-control" placeholder="info@negocio.com"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Dirección</label>
            <input type="text" className="form-control" placeholder="Calle, ciudad"
              value={address} onChange={e => setAddress(e.target.value)} />
          </div>

          <button type="submit" className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
            {loading ? <div className="spinner" style={{ borderTopColor: 'white' }} /> : <ArrowRight size={18} />}
            {loading ? 'Creando tu espacio…' : 'Comenzar con PETID'}
          </button>
        </form>
      </div>
    </div>
  )
}

function getDefaultServices(industry, orgId) {
  const base = {
    organization_id: orgId,
    duration_minutes: 30,
    is_active: true
  }
  const map = {
    veterinary: [
      { ...base, name: 'Consulta General', price: 25, color: '#4F46E5', duration_minutes: 30 },
      { ...base, name: 'Vacunación', price: 35, color: '#059669', duration_minutes: 15 },
      { ...base, name: 'Desparasitación', price: 20, color: '#D97706', duration_minutes: 20 },
      { ...base, name: 'Peluquería Canina', price: 30, color: '#7C3AED', duration_minutes: 60 },
    ],
    medical: [
      { ...base, name: 'Consulta General', price: 40, color: '#4F46E5', duration_minutes: 30 },
      { ...base, name: 'Control', price: 30, color: '#059669', duration_minutes: 20 },
    ],
    dental: [
      { ...base, name: 'Consulta', price: 30, color: '#4F46E5' },
      { ...base, name: 'Limpieza Dental', price: 60, color: '#059669', duration_minutes: 60 },
    ],
  }
  return map[industry] || [
    { ...base, name: 'Servicio General', price: 30, color: '#4F46E5' }
  ]
}
