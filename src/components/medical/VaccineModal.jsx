import { useState } from 'react'
import { X, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function VaccineModal({ petId, vaccine, onClose, onSaved }) {
  const { organization } = useAuth()
  const [form, setForm] = useState({
    vaccine_name: vaccine?.vaccine_name || '',
    applied_date: vaccine?.applied_date || new Date().toISOString().split('T')[0],
    next_due_date: vaccine?.next_due_date || '',
    batch_number: vaccine?.batch_number || '',
    notes: vaccine?.notes || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.vaccine_name.trim()) { setError('El nombre de la vacuna es obligatorio.'); return }
    setLoading(true); setError('')
    const payload = { ...form, pet_id: petId, organization_id: organization.id, next_due_date: form.next_due_date || null }
    const { error } = vaccine
      ? await supabase.from('vaccines').update(payload).eq('id', vaccine.id)
      : await supabase.from('vaccines').insert(payload)
    if (error) { setError(error.message); setLoading(false) }
    else onSaved()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 style={{ margin: 0 }}>💉 {vaccine ? 'Editar Vacuna' : 'Registrar Vacuna'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}
            <div className="form-group">
              <label>Nombre de la vacuna *</label>
              <input type="text" className="form-control" placeholder="Ej: Parvovirus / Moquillo / Hepatitis"
                value={form.vaccine_name} onChange={e => set('vaccine_name', e.target.value)} required autoFocus />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Fecha de aplicación *</label>
                <input type="date" className="form-control" value={form.applied_date}
                  onChange={e => set('applied_date', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Próxima dosis</label>
                <input type="date" className="form-control" value={form.next_due_date}
                  onChange={e => set('next_due_date', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Número de lote</label>
              <input type="text" className="form-control" placeholder="Número de lote (opcional)"
                value={form.batch_number} onChange={e => set('batch_number', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Notas</label>
              <textarea className="form-control" rows={2} placeholder="Observaciones sobre la vacuna"
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
