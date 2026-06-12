import { useState } from 'react'
import { X, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function CustomerModal({ customer, onClose, onSaved }) {
  const { organization } = useAuth()
  const [form, setForm] = useState({
    full_name: customer?.full_name || '',
    phone: customer?.phone || '',
    whatsapp: customer?.whatsapp || '',
    email: customer?.email || '',
    address: customer?.address || '',
    notes: customer?.notes || '',
    status: customer?.status || 'active',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.full_name.trim()) { setError('El nombre es obligatorio.'); return }
    setLoading(true)
    setError('')

    const payload = {
      ...form,
      full_name: form.full_name.trim(),
      organization_id: organization.id,
    }

    let error
    if (customer) {
      ({ error } = await supabase.from('customers').update(payload).eq('id', customer.id))
    } else {
      ({ error } = await supabase.from('customers').insert(payload))
    }

    if (error) { setError(error.message); setLoading(false) }
    else onSaved()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 style={{ margin: 0 }}>{customer ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}

            <div className="form-group">
              <label>Nombre completo *</label>
              <input type="text" className="form-control" placeholder="Nombre del propietario"
                value={form.full_name} onChange={e => set('full_name', e.target.value)} required autoFocus />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Teléfono</label>
                <input type="tel" className="form-control" placeholder="+593 99 000 0000"
                  value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div className="form-group">
                <label>WhatsApp</label>
                <input type="tel" className="form-control" placeholder="+593 99 000 0000"
                  value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label>Correo electrónico</label>
              <input type="email" className="form-control" placeholder="correo@ejemplo.com"
                value={form.email} onChange={e => set('email', e.target.value)} />
            </div>

            <div className="form-group">
              <label>Dirección</label>
              <input type="text" className="form-control" placeholder="Calle, ciudad"
                value={form.address} onChange={e => set('address', e.target.value)} />
            </div>

            <div className="form-group">
              <label>Notas internas</label>
              <textarea className="form-control" placeholder="Observaciones sobre el cliente…"
                value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} />
            </div>

            {customer && (
              <div className="form-group">
                <label>Estado</label>
                <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
            )}
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
