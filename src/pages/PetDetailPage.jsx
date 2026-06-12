import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Plus, Syringe, Bug, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format, differenceInYears, differenceInMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import PetModal from '../components/pets/PetModal'
import MedicalRecordModal from '../components/medical/MedicalRecordModal'
import VaccineModal from '../components/medical/VaccineModal'
import DewormingModal from '../components/medical/DewormingModal'

const SPECIES_ICON = { dog: '🐕', cat: '🐈', bird: '🦜', rabbit: '🐇', reptile: '🦎', other: '🐾' }

export default function PetDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pet, setPet] = useState(null)
  const [medicalRecords, setMedicalRecords] = useState([])
  const [vaccines, setVaccines] = useState([])
  const [dewormings, setDewormings] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // 'edit'|'record'|'vaccine'|'deworming'

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    setLoading(true)
    const [{ data: petData }, { data: records }, { data: vacs }, { data: dew }] = await Promise.all([
      supabase.from('pets').select('*, customers(id, full_name, phone)').eq('id', id).single(),
      supabase.from('medical_records').select('*').eq('pet_id', id).order('record_date', { ascending: false }),
      supabase.from('vaccines').select('*').eq('pet_id', id).order('applied_date', { ascending: false }),
      supabase.from('dewormings').select('*').eq('pet_id', id).order('applied_date', { ascending: false }),
    ])
    setPet(petData)
    setMedicalRecords(records || [])
    setVaccines(vacs || [])
    setDewormings(dew || [])
    setLoading(false)
  }

  function getAge(birthDate) {
    if (!birthDate) return 'Desconocida'
    const years = differenceInYears(new Date(), new Date(birthDate))
    if (years === 0) {
      const months = differenceInMonths(new Date(), new Date(birthDate))
      return `${months} mes${months !== 1 ? 'es' : ''}`
    }
    return `${years} año${years !== 1 ? 's' : ''}`
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 48 }}><div className="spinner" style={{ margin: '0 auto', width: 32, height: 32 }} /></div>
  if (!pet) return <div style={{ padding: 32 }}>Mascota no encontrada. <Link to="/pets">Volver</Link></div>

  const pendingVaccines = vaccines.filter(v => v.next_due_date && new Date(v.next_due_date) <= new Date())

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}><ArrowLeft size={14} /> Volver</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{pet.name}</h1>
          <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '0.9rem' }}>
            Propietario: <Link to={`/customers/${pet.customers?.id}`}>{pet.customers?.full_name}</Link>
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => setModal('edit')}><Edit2 size={14} /> Editar</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        {/* Left: Pet info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: 12 }}>{SPECIES_ICON[pet.species] || '🐾'}</div>
              <h3 style={{ margin: '0 0 4px' }}>{pet.name}</h3>
              <p style={{ margin: '0 0 12px', color: 'var(--gray-500)', fontSize: '0.9rem' }}>
                {pet.breed || pet.species}
              </p>
              <span className={`badge ${pet.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                {pet.status === 'active' ? 'Activo' : pet.status}
              </span>
              {pendingVaccines.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <span className="badge badge-danger">⚠️ {pendingVaccines.length} vacuna{pendingVaccines.length > 1 ? 's' : ''} vencida{pendingVaccines.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h4 style={{ margin: 0 }}>Datos físicos</h4></div>
            <div className="card-body">
              {[
                ['Sexo', pet.sex === 'male' ? 'Macho' : pet.sex === 'female' ? 'Hembra' : 'N/E'],
                ['Edad', getAge(pet.birth_date)],
                ['Nacimiento', pet.birth_date ? format(new Date(pet.birth_date), 'd MMM yyyy', { locale: es }) : 'N/E'],
                ['Peso', pet.weight_kg ? `${pet.weight_kg} kg` : 'N/E'],
                ['Color', pet.color || 'N/E'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--gray-500)' }}>{label}</span>
                  <span style={{ fontWeight: 500, color: 'var(--gray-800)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {pet.observations && (
            <div className="card">
              <div className="card-header"><h4 style={{ margin: 0 }}>⚠️ Observaciones</h4></div>
              <div className="card-body">
                <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', margin: 0 }}>{pet.observations}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Medical data */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Medical records */}
          <div className="card">
            <div className="card-header">
              <h4 style={{ margin: 0 }}><FileText size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />Historial Médico</h4>
              <button className="btn btn-primary btn-sm" onClick={() => setModal('record')}><Plus size={13} /> Agregar</button>
            </div>
            {medicalRecords.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--gray-400)' }}>
                <p style={{ marginBottom: 12, fontSize: '0.875rem' }}>Sin registros médicos</p>
                <button className="btn btn-primary btn-sm" onClick={() => setModal('record')}><Plus size={13} /> Agregar registro</button>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Fecha</th><th>Tipo</th><th>Diagnóstico</th><th>Tratamiento</th></tr>
                  </thead>
                  <tbody>
                    {medicalRecords.map(r => (
                      <tr key={r.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>{format(new Date(r.record_date), 'd MMM yyyy', { locale: es })}</td>
                        <td><RecordTypeBadge type={r.record_type} /></td>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.diagnosis || '—'}
                        </td>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.treatment || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Vaccines */}
          <div className="card">
            <div className="card-header">
              <h4 style={{ margin: 0 }}><Syringe size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />Vacunas</h4>
              <button className="btn btn-primary btn-sm" onClick={() => setModal('vaccine')}><Plus size={13} /> Agregar</button>
            </div>
            {vaccines.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.875rem' }}>Sin vacunas registradas</div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Vacuna</th><th>Aplicada</th><th>Próxima</th><th>Estado</th></tr>
                  </thead>
                  <tbody>
                    {vaccines.map(v => {
                      const overdue = v.next_due_date && new Date(v.next_due_date) <= new Date()
                      const upcoming = v.next_due_date && !overdue && new Date(v.next_due_date) <= new Date(Date.now() + 30 * 86400000)
                      return (
                        <tr key={v.id}>
                          <td style={{ fontWeight: 500 }}>{v.vaccine_name}</td>
                          <td>{format(new Date(v.applied_date), 'd MMM yyyy', { locale: es })}</td>
                          <td>{v.next_due_date ? format(new Date(v.next_due_date), 'd MMM yyyy', { locale: es }) : '—'}</td>
                          <td>
                            {overdue ? <span className="badge badge-danger">Vencida</span>
                              : upcoming ? <span className="badge badge-warning">Próxima</span>
                              : <span className="badge badge-success">Al día</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Dewormings */}
          <div className="card">
            <div className="card-header">
              <h4 style={{ margin: 0 }}><Bug size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />Desparasitaciones</h4>
              <button className="btn btn-primary btn-sm" onClick={() => setModal('deworming')}><Plus size={13} /> Agregar</button>
            </div>
            {dewormings.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.875rem' }}>Sin desparasitaciones registradas</div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Producto</th><th>Tipo</th><th>Aplicada</th><th>Próxima</th></tr>
                  </thead>
                  <tbody>
                    {dewormings.map(d => (
                      <tr key={d.id}>
                        <td style={{ fontWeight: 500 }}>{d.product_name}</td>
                        <td><span className="badge badge-info">{d.deworming_type === 'internal' ? 'Interna' : d.deworming_type === 'external' ? 'Externa' : 'Ambas'}</span></td>
                        <td>{format(new Date(d.applied_date), 'd MMM yyyy', { locale: es })}</td>
                        <td>
                          {d.next_due_date ? (
                            new Date(d.next_due_date) <= new Date()
                              ? <span style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>⚠️ {format(new Date(d.next_due_date), 'd MMM', { locale: es })}</span>
                              : format(new Date(d.next_due_date), 'd MMM yyyy', { locale: es })
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {modal === 'edit' && <PetModal pet={pet} onClose={() => setModal(null)} onSaved={() => { setModal(null); loadData() }} />}
      {modal === 'record' && <MedicalRecordModal petId={id} onClose={() => setModal(null)} onSaved={() => { setModal(null); loadData() }} />}
      {modal === 'vaccine' && <VaccineModal petId={id} onClose={() => setModal(null)} onSaved={() => { setModal(null); loadData() }} />}
      {modal === 'deworming' && <DewormingModal petId={id} onClose={() => setModal(null)} onSaved={() => { setModal(null); loadData() }} />}
    </div>
  )
}

function RecordTypeBadge({ type }) {
  const map = {
    consultation: { label: 'Consulta', cls: 'badge-primary' },
    vaccine: { label: 'Vacuna', cls: 'badge-success' },
    deworming: { label: 'Desparasitación', cls: 'badge-warning' },
    surgery: { label: 'Cirugía', cls: 'badge-danger' },
    exam: { label: 'Examen', cls: 'badge-info' },
    other: { label: 'Otro', cls: 'badge-gray' },
  }
  const s = map[type] || { label: type, cls: 'badge-gray' }
  return <span className={`badge ${s.cls}`} style={{ fontSize: '0.75rem' }}>{s.label}</span>
}
