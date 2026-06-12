import { useState } from 'react'
import { X, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function DewormingModal({ petId, deworming, onClose, onSaved }) {
  const { organization } = useAuth()
  const [form, setForm] = useState({
    product_name: deworming?.product_name || '',
    applied_date: deworming?.applied_date || new Date().toISOString().split('T')[0],
    next_due_date: deworming?.next_due_date || '',
    deworming_type: deworming?.deworming_type || 'internal',
    notes: deworming?.notes || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.product_name.trim()) { setError('El nombre del producto es obligatorio.'); return }
    setLoading(true); setError('')
    const payload = { ...form, pet_id: petId, organization_id: organization.id, next_due_date: form.next_due_date || null }
    const { error } = deworming
      ? await supabase.from('dewormings').update(payload).eq('id', deworming.id)
      : await supabase.from('dewormings').insert(payload)
    if (error) { setError(error.message); setLoading(false) }
    else onSaved()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 style={{ margin: 0 }}>🪱 {deworming ? 'Editar Desparasitación' : 'Registrar Desparasitación'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}
            <div className="form-group">
              <label>Producto *</label>
              <input type="text" className="form-control" placeholder="Ej: Drontal Plus, Frontline"
                value={form.product_name} onChange={e => set('product_name', e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label>Tipo</label>
              <select className="form-control" value={form.deworming_type} onChange={e => set('deworming_type', e.target.value)}>
                <option value="internal">Interna (oral)</option>
                <option value="external">Externa (pipeta/collar)</option>
                <option value="both">Ambas</option>
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Fecha de aplicación *</label>
                <input type="date" className="form-control" value={form.applied_date}
                  onChange={e => set('applied_date', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Próxima aplicación</label>
                <input type="date" className="form-control" value={form.next_due_date}
                  onChange={e => set('next_due_date', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Notas</label>
              <textarea className="form-control" rows={2} placeholder="Observaciones"
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
