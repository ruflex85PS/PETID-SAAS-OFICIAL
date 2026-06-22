import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { format } from 'date-fns'
import { sendAppointmentConfirmation } from '../../lib/whatsapp'

export default function AppointmentModal({ appointment, onClose, onSaved }) {
  const { organization } = useAuth()
  const isEdit = appointment && appointment.id
  const defaultDate = appointment?.defaultDate
    ? format(appointment.defaultDate, "yyyy-MM-dd'T'HH:mm")
    : format(new Date(), "yyyy-MM-dd'T'HH:mm")

  const [form, setForm] = useState({
    customer_id: appointment?.customer_id || '',
    pet_id: appointment?.pet_id || '',
    service_id: appointment?.service_id || '',
    title: appointment?.title || '',
    scheduled_at: isEdit ? format(new Date(appointment.scheduled_at), "yyyy-MM-dd'T'HH:mm") : defaultDate,
    duration_minutes: appointment?.duration_minutes || 30,
    notes: appointment?.notes || '',
    status: appointment?.status || 'scheduled',
    cancellation_reason: appointment?.cancellation_reason || '',
  })
  const [customers, setCustomers] = useState([])
  const [pets, setPets] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadSelectData() }, [])
  useEffect(() => { if (form.customer_id) loadPetsForCustomer(form.customer_id) }, [form.customer_id])

  async function loadSelectData() {
    const [{ data: cust }, { data: svc }] = await Promise.all([
      supabase.from('customers').select('id, full_name, phone').eq('status', 'active').order('full_name'),
      supabase.from('services').select('id, name, duration_minutes, color').eq('is_active', true).order('name'),
    ])
    setCustomers(cust || [])
    setServices(svc || [])
    if (isEdit && appointment.customer_id) loadPetsForCustomer(appointment.customer_id)
  }

  async function loadPetsForCustomer(customerId) {
    const { data } = await supabase.from('pets').select('id, name, species').eq('customer_id', customerId).eq('status', 'active')
    setPets(data || [])
  }

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))

  function handleServiceChange(serviceId) {
    const svc = services.find(s => s.id === serviceId)
    set('service_id', serviceId)
    if (svc) {
      set('duration_minutes', svc.duration_minutes)
      if (!form.title) set('title', svc.name)
    }
  }

  function handleCustomerChange(customerId) {
    set('customer_id', customerId)
    set('pet_id', '')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.customer_id) { setError('Selecciona un cliente.'); return }
    if (!form.scheduled_at) { setError('La fecha y hora son obligatorias.'); return }
    setLoading(true); setError('')

    const title = form.title.trim() || (services.find(s => s.id === form.service_id)?.name) || 'Cita'
    const payload = {
      ...form,
      title,
      pet_id: form.pet_id || null,
      service_id: form.service_id || null,
      cancellation_reason: form.status === 'cancelled' ? form.cancellation_reason : null,
      organization_id: organization.id,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
    }

    let error
    if (isEdit) {
      ({ error } = await supabase.from('appointments').update(payload).eq('id', appointment.id))
    } else {
      ({ error } = await supabase.from('appointments').insert(payload))
    }

    if (error) { setError(error.message); setLoading(false) }
    else {
      if (!isEdit) {
        const customer = customers.find(c => c.id === form.customer_id)
        const pet = pets.find(p => p.id === form.pet_id)
        const service = services.find(s => s.id === form.service_id)
        if (customer?.phone) {
          const fecha = new Date(form.scheduled_at).toLocaleDateString("es-EC", { weekday: "long", year: "numeric", month: "long", day: "numeric" }); const hora = new Date(form.scheduled_at).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" }); sendAppointmentConfirmation(customer.phone, { customerName: customer.full_name, businessName: organization.name, fecha, hora, serviceName: service?.name || form.title }).then(result => { supabase.from("automations").insert([{ organization_id: organization.id, automation_type: "appointment_confirmation", reference_id: null, reference_type: "appointment", customer_id: form.customer_id, channel: "whatsapp", message_preview: "Confirmacion de cita para " + customer.full_name, status: result?.messages ? "sent" : "failed", scheduled_for: new Date().toISOString(), sent_at: new Date().toISOString(), error_message: result?.error?.message || null }]).then(r => console.log("Auto saved:", r)) })
        }
      }
      onSaved()
    }
  }

  const SPECIES_ICON = { dog: '🐕', cat: '🐈', bird: '🦜', rabbit: '🐇', reptile: '🦎', other: '🐾' }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <h3 style={{ margin: 0 }}>{isEdit ? 'Editar Cita' : 'Nueva Cita'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}

            <div className="form-row">
              <div className="form-group">
                <label>Cliente *</label>
                <select className="form-control" value={form.customer_id} onChange={e => handleCustomerChange(e.target.value)} required>
                  <option value="">Seleccionar cliente…</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Mascota</label>
                <select className="form-control" value={form.pet_id} onChange={e => set('pet_id', e.target.value)} disabled={!form.customer_id || pets.length === 0}>
                  <option value="">Sin mascota / No aplica</option>
                  {pets.map(p => <option key={p.id} value={p.id}>{SPECIES_ICON[p.species]} {p.name}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Servicio</label>
              <select className="form-control" value={form.service_id} onChange={e => handleServiceChange(e.target.value)}>
                <option value="">Seleccionar servicio…</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min)</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Título (opcional)</label>
              <input type="text" className="form-control" placeholder="Descripción de la cita"
                value={form.title} onChange={e => set('title', e.target.value)} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Fecha y hora *</label>
                <input type="datetime-local" className="form-control" value={form.scheduled_at}
                  onChange={e => set('scheduled_at', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Duración (min)</label>
                <input type="number" className="form-control" min="5" max="480" step="5"
                  value={form.duration_minutes} onChange={e => set('duration_minutes', parseInt(e.target.value))} />
              </div>
            </div>

            {isEdit && (
              <div className="form-group">
                <label>Estado</label>
                <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="scheduled">Programada</option>
                  <option value="confirmed">Confirmada</option>
                  <option value="in_progress">En curso</option>
                  <option value="completed">Completada</option>
                  <option value="cancelled">Cancelada</option>
                  <option value="no_show">No asistió</option>
                </select>
              </div>
            )}

            {form.status === 'cancelled' && (
              <div className="form-group">
                <label>Motivo de cancelación</label>
                <input type="text" className="form-control" placeholder="¿Por qué se canceló?"
                  value={form.cancellation_reason} onChange={e => set('cancellation_reason', e.target.value)} />
              </div>
            )}

            <div className="form-group">
              <label>Notas</label>
              <textarea className="form-control" rows={2} placeholder="Notas adicionales de la cita"
                value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner" style={{ borderTopColor: 'white' }} /> : <Save size={16} />}
              {loading ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
