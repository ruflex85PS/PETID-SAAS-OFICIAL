import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Plus, Phone, Mail, MapPin, MessageCircle, Calendar } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import CustomerModal from '../components/clients/CustomerModal'
import PetModal from '../components/pets/PetModal'

export default function CustomerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [pets, setPets] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [editCustomer, setEditCustomer] = useState(false)
  const [showPetModal, setShowPetModal] = useState(false)

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    setLoading(true)
    const [{ data: cust }, { data: petsData }, { data: apptData }] = await Promise.all([
      supabase.from('customers').select('*').eq('id', id).single(),
      supabase.from('pets').select('*, vaccines(id, vaccine_name, next_due_date)').eq('customer_id', id).order('name'),
      supabase.from('appointments').select('*, services(name, color)').eq('customer_id', id).order('scheduled_at', { ascending: false }).limit(10),
    ])
    setCustomer(cust)
    setPets(petsData || [])
    setAppointments(apptData || [])
    setLoading(false)
  }

  if (loading) return <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto', width: 32, height: 32 }} /></div>
  if (!customer) return <div style={{ padding: 32 }}>Cliente no encontrado. <Link to="/customers">Volver</Link></div>

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/customers')}>
          <ArrowLeft size={14} /> Volver
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{customer.full_name}</h1>
        </div>
        <button className="btn btn-secondary" onClick={() => setEditCustomer(true)}>
          <Edit2 size={14} /> Editar
        </button>
        <Link to="/appointments" className="btn btn-primary">
          <Calendar size={14} /> Nueva Cita
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
        {/* Left: Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Contact card */}
          <div className="card">
            <div className="card-header"><h4 style={{ margin: 0 }}>Información</h4></div>
            <div className="card-body">
              {customer.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Phone size={14} style={{ color: 'var(--gray-400)' }} />
                  <span style={{ fontSize: '0.9rem' }}>{customer.phone}</span>
                </div>
              )}
              {customer.whatsapp && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <MessageCircle size={14} style={{ color: '#25D366' }} />
                  <span style={{ fontSize: '0.9rem' }}>{customer.whatsapp}</span>
                </div>
              )}
              {customer.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Mail size={14} style={{ color: 'var(--gray-400)' }} />
                  <span style={{ fontSize: '0.9rem' }}>{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                  <MapPin size={14} style={{ color: 'var(--gray-400)', marginTop: 3 }} />
                  <span style={{ fontSize: '0.9rem' }}>{customer.address}</span>
                </div>
              )}
              <div style={{ marginTop: 12 }}>
                <span className={`badge ${customer.status === 'active' ? 'badge-success' : 'badge-gray'}`}>
                  {customer.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>

          {customer.notes && (
            <div className="card">
              <div className="card-header"><h4 style={{ margin: 0 }}>📝 Notas</h4></div>
              <div className="card-body">
                <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', margin: 0 }}>{customer.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Pets + Appointments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Pets */}
          <div className="card">
            <div className="card-header">
              <h4 style={{ margin: 0 }}>🐾 Mascotas ({pets.length})</h4>
              <button className="btn btn-primary btn-sm" onClick={() => setShowPetModal(true)}>
                <Plus size={14} /> Agregar
              </button>
            </div>
            <div className="card-body">
              {pets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--gray-400)' }}>
                  <p style={{ marginBottom: 12 }}>Sin mascotas registradas</p>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowPetModal(true)}>
                    <Plus size={14} /> Agregar mascota
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                  {pets.map(pet => (
                    <Link key={pet.id} to={`/pets/${pet.id}`} style={{ textDecoration: 'none' }}>
                      <div className="card" style={{ cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>
                        <div className="card-body" style={{ textAlign: 'center', padding: 16 }}>
                          <div style={{ fontSize: '2rem', marginBottom: 8 }}>
                            {pet.species === 'dog' ? '🐕' : pet.species === 'cat' ? '🐈' : pet.species === 'bird' ? '🦜' : '🐾'}
                          </div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-800)', marginBottom: 4 }}>{pet.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>{pet.breed || pet.species}</div>
                          {pet.vaccines?.some(v => new Date(v.next_due_date) <= new Date()) && (
                            <div style={{ marginTop: 6 }}><span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>💉 Vacuna pendiente</span></div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Appointment history */}
          <div className="card">
            <div className="card-header">
              <h4 style={{ margin: 0 }}>📅 Historial de Citas ({appointments.length})</h4>
            </div>
            <div className="table-wrapper">
              {appointments.length === 0 ? (
                <div style={{ padding: '20px', color: 'var(--gray-400)', textAlign: 'center', fontSize: '0.9rem' }}>Sin citas registradas</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Servicio</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map(apt => (
                      <tr key={apt.id}>
                        <td>{format(new Date(apt.scheduled_at), "d MMM yyyy, HH:mm", { locale: es })}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {apt.services?.color && <div style={{ width: 8, height: 8, borderRadius: '50%', background: apt.services.color }} />}
                            {apt.services?.name || apt.title}
                          </div>
                        </td>
                        <td><StatusBadge status={apt.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {editCustomer && (
        <CustomerModal customer={customer} onClose={() => setEditCustomer(false)} onSaved={() => { setEditCustomer(false); loadData() }} />
      )}
      {showPetModal && (
        <PetModal customerId={id} onClose={() => setShowPetModal(false)} onSaved={() => { setShowPetModal(false); loadData() }} />
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    scheduled: { label: 'Programada', cls: 'badge-primary' },
    confirmed: { label: 'Confirmada', cls: 'badge-success' },
    in_progress: { label: 'En curso', cls: 'badge-info' },
    completed: { label: 'Completada', cls: 'badge-gray' },
    cancelled: { label: 'Cancelada', cls: 'badge-danger' },
    no_show: { label: 'No asistió', cls: 'badge-warning' },
  }
  const s = map[status] || { label: status, cls: 'badge-gray' }
  return <span className={`badge ${s.cls}`}>{s.label}</span>
}
