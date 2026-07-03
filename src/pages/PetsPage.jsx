import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Edit2, PawPrint } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useSearchParams } from 'react-router-dom'
import PetModal from '../components/pets/PetModal'

const SPECIES_ICON = { dog: '🐕', cat: '🐈', bird: '🦜', rabbit: '🐇', reptile: '🦎', other: '🐾' }
const SPECIES_LABEL = { dog: 'Perro', cat: 'Gato', bird: 'Ave', rabbit: 'Conejo', reptile: 'Reptil', other: 'Otro' }

export default function PetsPage() {
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPet, setEditingPet] = useState(null)
  const { organization } = useAuth()
  const [searchParams] = useSearchParams()
  const orgId = searchParams.get('org') || organization?.id

  useEffect(() => { if (organization) loadPets() }, [organization])

  async function loadPets() {
    setLoading(true)
    const { data } = await supabase
      .from('pets')
      .select('*, customers(full_name), vaccines(id, next_due_date)')
      .order('name')
    setPets(data || [])
    setLoading(false)
  }

  function getPendingVaccines(pet) {
    return pet.vaccines?.filter(v => v.next_due_date && new Date(v.next_due_date) <= new Date()).length || 0
  }

  const filtered = pets.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.breed || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.customers?.full_name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Mascotas</div>
          <div className="page-subtitle">{pets.length} mascotas registradas</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingPet(null); setShowModal(true) }}>
          <Plus size={16} /> Nueva Mascota
        </button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ paddingTop: 14, paddingBottom: 14 }}>
          <div className="search-bar" style={{ maxWidth: '100%' }}>
            <Search size={16} className="search-icon" />
            <input type="text" className="form-control" placeholder="Buscar por nombre, raza o propietario…"
              value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div className="spinner" style={{ margin: '0 auto', width: 32, height: 32 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><PawPrint size={24} /></div>
            <h3>{search ? 'Sin resultados' : 'Sin mascotas aún'}</h3>
            <p>{search ? `No se encontraron mascotas con "${search}"` : 'Agrega mascotas desde el perfil de cada cliente.'}</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {filtered.map(pet => {
            const pending = getPendingVaccines(pet)
            return (
              <div key={pet.id} className="card" style={{ position: 'relative' }}>
                <div className="card-body" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{SPECIES_ICON[pet.species] || '🐾'}</div>
                  <Link to={`/pets/${pet.id}`} style={{ textDecoration: 'none' }}>
                    <h4 style={{ margin: '0 0 4px', color: 'var(--gray-900)' }}>{pet.name}</h4>
                  </Link>
                  <p style={{ fontSize: '0.8rem', margin: '0 0 4px', color: 'var(--gray-500)' }}>
                    {SPECIES_LABEL[pet.species]}{pet.breed ? ` · ${pet.breed}` : ''}
                  </p>
                  <p style={{ fontSize: '0.8rem', margin: '0 0 12px', color: 'var(--gray-400)' }}>
                    👤 {pet.customers?.full_name}
                  </p>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <span className={`badge ${pet.status === 'active' ? 'badge-success' : 'badge-gray'}`} style={{ fontSize: '0.72rem' }}>
                      {pet.status === 'active' ? 'Activo' : pet.status === 'deceased' ? 'Fallecido' : 'Transferido'}
                    </span>
                    {pending > 0 && (
                      <span className="badge badge-danger" style={{ fontSize: '0.72rem' }}>💉 {pending} vacuna{pending > 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
                <div className="card-footer" style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                  <Link to={`/pets/${pet.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                    Ver perfil
                  </Link>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setEditingPet(pet); setShowModal(true) }}>
                    <Edit2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <PetModal
          pet={editingPet}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); loadPets() }}
        />
      )}
    </div>
  )
}
