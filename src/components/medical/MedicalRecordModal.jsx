import { useState } from 'react'
import { X, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function MedicalRecordModal({ petId, record, onClose, onSaved }) {
  const { organization, user } = useAuth()
  const [form, setForm] = useState({
    record_date: record?.record_date || new Date().toISOString().split('T')[0],
    record_type: record?.record_type || 'consultation',
    diagnosis: record?.diagnosis || '',
    treatment: record?.treatment || '',
    medications: record?.medications || '',
    observations: record?.observations || '',
    next_visit_date: record?.next_visit_date || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const payload = {
      ...form,
      pet_id: petId,
      organization_id: organization.id,
      created_by: user.id,
      next_visit_date: form.next_visit_date || null,
    }
    const { error } = record
      ? await supabase.from('medical_records').update(payload).eq('id', record.id)
      : await supabase.from('medical_records').insert(payload)
    if (error) { setError(error.message); setLoading(false) }
    else onSaved()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <h3 style={{ margin: 0 }}>Registro Médico</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}
            <div className="form-row">
              <div className="form-group">
                <label>Fecha *</label>
                <input type="date" className="form-control" value={form.record_date}
                  onChange={e => set('record_date', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select className="form-control" value={form.record_type} onChange={e => set('record_type', e.target.value)}>
                  <option value="consultation">Consulta</option>
                  <option value="vaccine">Vacuna</option>
                  <option value="deworming">Desparasitación</option>
                  <option value="surgery">Cirugía</option>
                  <option value="exam">Examen</option>
                  <option value="other">Otro</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Diagnóstico</label>
              <textarea className="form-control" rows={2} placeholder="Diagnóstico del paciente"
                value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Tratamiento</label>
              <textarea className="form-control" rows={2} placeholder="Tratamiento indicado"
                value={form.treatment} onChange={e => set('treatment', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Medicamentos</label>
              <textarea className="form-control" rows={2} placeholder="Medicamentos recetados, dosis, frecuencia"
                value={form.medications} onChange={e => set('medications', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Observaciones adicionales</label>
              <textarea className="form-control" rows={2} placeholder="Notas adicionales"
                value={form.observations} onChange={e => set('observations', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Fecha próxima visita</label>
              <input type="date" className="form-control" value={form.next_visit_date}
                onChange={e => set('next_visit_date', e.target.value)} />
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
