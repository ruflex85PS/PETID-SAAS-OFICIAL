import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function PetModal({ pet, customerId, onClose, onSaved }) {
  const { organization } = useAuth()
  const [customers, setCustomers] = useState([])
  const [form, setForm] = useState({
    name: pet?.name || '',
    species: pet?.species || 'dog',
    breed: pet?.breed || '',
    sex: pet?.sex || 'unknown',
    birth_date: pet?.birth_date || '',
    weight_kg: pet?.weight_kg || '',
    color: pet?.color || '',
    observations: pet?.observations || '',
    status: pet?.status || 'active',
    customer_id: customerId || pet?.customer_id || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!customerId) loadCustomers()
  }, [])

  async function loadCustomers() {
    const { data } = await supabase.from('customers').select('id, full_name').eq('status', 'active').order('full_name')
    setCustomers(data || [])
  }

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('El nombre es obligatorio.'); return }
    if (!form.customer_id) { setError('Selecciona un propietario.'); return }
    setLoading(true); setError('')

    const payload = {
      ...form,
      name: form.name.trim(),
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      birth_date: form.birth_date || null,
      organization_id: organization.id,
    }

    let error
    if (pet) {
      ({ error } = await supabase.from('pets').update(payload).eq('id', pet.id))
    } else {
      ({ error } = await supabase.from('pets').insert(payload))
    }

    if (error) { setError(error.message); setLoading(false) }
    else onSaved()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 style={{ margin: 0 }}>{pet ? 'Editar Mascota' : 'Nueva Mascota'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}

            {!customerId && (
              <div className="form-group">
                <label>Propietario *</label>
                <select className="form-control" value={form.customer_id} onChange={e => set('customer_id', e.target.value)} required>
                  <option value="">Seleccionar propietario…</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Nombre *</label>
                <input type="text" className="form-control" placeholder="Nombre de la mascota"
                  value={form.name} onChange={e => set('name', e.target.value)} required autoFocus />
              </div>
              <div className="form-group">
                <label>Especie</label>
                <select className="form-control" value={form.species} onChange={e => set('species', e.target.value)}>
                  <option value="dog">🐕 Perro</option>
                  <option value="cat">🐈 Gato</option>
                  <option value="bird">🦜 Ave</option>
                  <option value="rabbit">🐇 Conejo</option>
                  <option value="reptile">🦎 Reptil</option>
                  <option value="other">Otro</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Raza</label>
                <input type="text" className="form-control" placeholder="Ej: Golden Retriever"
                  value={form.breed} onChange={e => set('breed', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Sexo</label>
                <select className="form-control" value={form.sex} onChange={e => set('sex', e.target.value)}>
                  <option value="male">Macho</option>
                  <option value="female">Hembra</option>
                  <option value="unknown">No especificado</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Fecha de nacimiento</label>
                <input type="date" className="form-control"
                  value={form.birth_date} onChange={e => set('birth_date', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Peso (kg)</label>
                <input type="number" step="0.1" min="0" className="form-control" placeholder="Ej: 12.5"
                  value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label>Color / Descripción física</label>
              <input type="text" className="form-control" placeholder="Ej: Dorado con manchas blancas"
                value={form.color} onChange={e => set('color', e.target.value)} />
            </div>

            <div className="form-group">
              <label>Observaciones médicas</label>
              <textarea className="form-control" placeholder="Alergias, condiciones preexistentes, notas importantes…"
                value={form.observations} onChange={e => set('observations', e.target.value)} rows={3} />
            </div>

            {pet && (
              <div className="form-group">
                <label>Estado</label>
                <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="active">Activo</option>
                  <option value="deceased">Fallecido</option>
                  <option value="transferred">Transferido</option>
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
