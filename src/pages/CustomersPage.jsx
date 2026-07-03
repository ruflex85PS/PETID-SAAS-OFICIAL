import { useState, useEffect } from 'react'

import { Link } from 'react-router-dom'
import { Plus, Search, Edit2, Trash2, Phone, Mail, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useSearchParams } from 'react-router-dom'
import CustomerModal from '../components/clients/CustomerModal'

export default function CustomersPage() {

  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const { organization, profile } = useAuth()
  const [searchParams] = useSearchParams()
  const orgId = searchParams.get('org') || organization?.id
  const isSuspended = organization?.status === 'suspended' && !profile?.is_super_admin

  useEffect(() => { if (organization) loadCustomers() }, [organization])

  async function loadCustomers() {
    setLoading(true)
    const { data } = await supabase
      .from('customers')
      .select('*, pets(id)')
      .order('full_name')
    setCustomers(data || [])
    setLoading(false)
  }

  async function deleteCustomer(id) {
    if (!confirm('¿Eliminar este cliente? Esta acción no se puede deshacer.')) return
    setDeleting(id)
    await supabase.from('customers').delete().eq('id', id)
    setCustomers(prev => prev.filter(c => c.id !== id))
    setDeleting(null)
  }

  const filtered = customers.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() { setEditingCustomer(null); setShowModal(true) }
  function openEdit(c) { setEditingCustomer(c); setShowModal(true) }
  function onSaved() { setShowModal(false); loadCustomers() }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Clientes</div>
          <div className="page-subtitle">{customers.length} clientes registrados</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate} disabled={isSuspended} title={isSuspended ? "Cuenta suspendida" : ""}>
          <Plus size={16} /> Nuevo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ paddingTop: 14, paddingBottom: 14 }}>
          <div className="search-bar" style={{ maxWidth: '100%' }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nombre, teléfono o correo…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
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
            <div className="empty-state-icon"><User size={24} /></div>
            <h3>{search ? 'Sin resultados' : 'Sin clientes aún'}</h3>
            <p>{search ? `No se encontraron clientes con "${search}"` : 'Agrega tu primer cliente para comenzar.'}</p>
            {!search && <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Agregar Cliente</button>}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contacto</th>
                  <th className="hide-mobile">Dirección</th>
                  <th>Mascotas</th>
                  <th>Estado</th>
                  <th style={{ width: 80 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar">{c.full_name.slice(0, 2).toUpperCase()}</div>
                        <div>
                          <Link to={`/customers/${c.id}`} style={{ fontWeight: 600, color: 'var(--gray-900)', textDecoration: 'none' }}>
                            {c.full_name}
                          </Link>
                          {c.notes && <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: 2 }}>📝 Tiene notas</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {c.phone && <span style={{ fontSize: '0.85rem', color: 'var(--gray-600)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Phone size={12} /> {c.phone}
                        </span>}
                        {c.email && <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Mail size={12} /> {c.email}
                        </span>}
                      </div>
                    </td>
                    <td className="hide-mobile">
                      <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                        {c.address || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-primary">{c.pets?.length || 0}</span>
                    </td>
                    <td>
                      <span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-gray'}`}>
                        {c.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-icon" title="Editar" onClick={() => openEdit(c)}>
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon"
                          title="Eliminar"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => deleteCustomer(c.id)}
                          disabled={deleting === c.id}
                        >
                          {deleting === c.id ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Trash2 size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <CustomerModal
          customer={editingCustomer}
          onClose={() => setShowModal(false)}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}
