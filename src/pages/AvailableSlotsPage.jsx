import { useState, useEffect, useCallback } from 'react'
import { Calendar, Clock, User, Dog, Plus, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { format, isFuture, parseISO, differenceInHours } from 'date-fns'
import { es } from 'date-fns/locale'
import AppointmentModal from '../components/appointments/AppointmentModal'

const URGENCY = {
  today: { label: 'Hoy', color: '#ef4444', bg: '#fee2e2' },
  soon: { label: 'Pronto', color: '#f59e0b', bg: '#fef3c7' },
  later: { label: 'Disponible', color: '#10b981', bg: '#d1fae5' },
}

function getUrgency(scheduledAt) {
  const hours = differenceInHours(parseISO(scheduledAt), new Date())
  if (hours <= 24) return 'today'
  if (hours <= 72) return 'soon'
  return 'later'
}

export default function AvailableSlotsPage() {
  const { organization } = useAuth()
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [stats, setStats] = useState({ total: 0, today: 0, revenue_at_risk: 0 })

  const load = useCallback(async () => {
    setLoading(true)
    const now = new Date().toISOString()

    const { data } = await supabase
      .from('appointments')
      .select(`
        *,
        customers (id, full_name, phone, whatsapp),
        pets (id, name, species),
        services (id, name, price, duration_minutes, color)
      `)
      .eq('status', 'cancelled')
      .gte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })

    if (data) {
      setSlots(data)
      const todaySlots = data.filter(s => differenceInHours(parseISO(s.scheduled_at), new Date()) <= 24)
      const revenue = data.reduce((sum, s) => sum + (s.services?.price || 0), 0)
      setStats({ total: data.length, today: todaySlots.length, revenue_at_risk: revenue })
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function handleRecover(slot) {
    // Pre-fill appointment modal with the same time slot
    setSelectedSlot({
      defaultDate: parseISO(slot.scheduled_at),
      service_id: slot.service_id,
      duration_minutes: slot.duration_minutes,
      title: slot.title,
    })
    setShowModal(true)
  }

  function handleNewAppointment() {
    setSelectedSlot(null)
    setShowModal(true)
  }

  const SPECIES_ICON = { dog: '🐕', cat: '🐈', bird: '🦜', rabbit: '🐇', reptile: '🦎', other: '🐾' }

  return (
    <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>🟢 Horarios Disponibles</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--gray-500)', fontSize: 14 }}>
            Espacios de citas canceladas que puedes reasignar para recuperar ingresos
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={load} disabled={loading}>
            <RefreshCw size={16} />
          </button>
          <button className="btn btn-primary" onClick={handleNewAppointment}>
            <Plus size={16} />
            Nueva cita
          </button>
        </div>
      </div>

      {/* Revenue recovery banner */}
      {stats.total > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 12, padding: '20px 24px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap'
        }}>
          <TrendingUp size={32} color="white" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>
              Oportunidad de recuperación de ingresos
            </div>
            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 }}>
              Tienes <strong>{stats.total} espacio{stats.total > 1 ? 's' : ''}</strong> disponible{stats.total > 1 ? 's' : ''}.
              {stats.today > 0 && ` ${stats.today} vence${stats.today > 1 ? 'n' : ''} hoy.`}
              {stats.revenue_at_risk > 0 && ` Potencial: $${stats.revenue_at_risk.toFixed(2)}.`}
            </div>
          </div>
          <div style={{ color: 'white', fontSize: 28, fontWeight: 800 }}>
            {stats.total}
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid #6366f1' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#6366f1' }}>{stats.total}</div>
          <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Espacios disponibles</div>
        </div>
        <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#ef4444' }}>{stats.today}</div>
          <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Vencen hoy (24h)</div>
        </div>
        <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#10b981' }}>
            {stats.revenue_at_risk > 0 ? `$${stats.revenue_at_risk.toFixed(0)}` : '$0'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Ingresos recuperables</div>
        </div>
      </div>

      {/* Slots list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--gray-400)' }}>Cargando espacios disponibles…</p>
        </div>
      ) : slots.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <Calendar size={48} color="var(--gray-300)" style={{ marginBottom: 12 }} />
          <h3 style={{ color: 'var(--gray-500)', margin: '0 0 8px' }}>
            No hay espacios disponibles
          </h3>
          <p style={{ color: 'var(--gray-400)', margin: '0 0 20px', fontSize: 14 }}>
            ¡Excelente! No tienes citas canceladas con horario futuro.
            Cuando se cancele una cita, aparecerá aquí para que puedas reasignarla.
          </p>
          <button className="btn btn-primary" onClick={handleNewAppointment}>
            <Plus size={16} />
            Crear nueva cita
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {slots.map(slot => {
            const urgency = getUrgency(slot.scheduled_at)
            const urgencyInfo = URGENCY[urgency]
            const scheduledDate = parseISO(slot.scheduled_at)

            return (
              <div key={slot.id} className="card" style={{
                padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                border: urgency === 'today' ? '1px solid #fca5a5' : undefined,
                background: urgency === 'today' ? '#fff9f9' : undefined,
              }}>
                {/* Date block */}
                <div style={{
                  textAlign: 'center', minWidth: 60, flexShrink: 0,
                  background: urgencyInfo.bg, borderRadius: 10, padding: '8px 10px'
                }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: urgencyInfo.color, lineHeight: 1 }}>
                    {format(scheduledDate, 'd')}
                  </div>
                  <div style={{ fontSize: 11, color: urgencyInfo.color, fontWeight: 600, textTransform: 'uppercase' }}>
                    {format(scheduledDate, 'MMM', { locale: es })}
                  </div>
                  <div style={{ fontSize: 12, color: urgencyInfo.color, marginTop: 2 }}>
                    {format(scheduledDate, 'HH:mm')}
                  </div>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{
                      background: urgencyInfo.bg, color: urgencyInfo.color,
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20
                    }}>
                      🟢 {urgencyInfo.label}
                    </span>
                    {slot.services && (
                      <span style={{
                        background: slot.services.color + '20' || '#e5e7eb',
                        color: slot.services.color || 'var(--gray-600)',
                        fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500
                      }}>
                        {slot.services.name}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 14, color: 'var(--gray-600)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={13} color="var(--gray-400)" />
                    {slot.duration_minutes} min
                    {slot.cancellation_reason && (
                      <span style={{ color: 'var(--gray-400)', fontSize: 12 }}>
                        • Motivo: {slot.cancellation_reason}
                      </span>
                    )}
                  </div>

                  {slot.customers && (
                    <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <User size={12} />
                      Anterior: {slot.customers.full_name}
                      {slot.pets && ` • ${SPECIES_ICON[slot.pets.species] || '🐾'} ${slot.pets.name}`}
                    </div>
                  )}

                  {slot.services?.price > 0 && (
                    <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginTop: 2 }}>
                      Valor del espacio: ${slot.services.price}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleRecover(slot)}
                    style={{ fontSize: 13 }}
                  >
                    <Plus size={14} />
                    Reasignar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* How it works */}
      <div style={{
        marginTop: 32, background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
        borderRadius: 12, padding: '20px 24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <AlertCircle size={20} color="var(--gray-400)" style={{ marginTop: 2 }} />
          <div>
            <h4 style={{ margin: '0 0 6px', fontSize: 14, color: 'var(--gray-700)' }}>
              ¿Cómo funciona la recuperación de citas?
            </h4>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.7 }}>
              Cuando una cita se cancela, el horario aparece automáticamente aquí como disponible.
              Puedes <strong>reasignarlo a otro cliente</strong> con un clic.
              El botón "Reasignar" abre el formulario de nueva cita pre-completado con ese horario y servicio.
              En la Versión 2.0, los clientes de tu lista de espera serán <strong>notificados automáticamente</strong> por WhatsApp cuando se libere un espacio.
            </p>
          </div>
        </div>
      </div>

      {/* Appointment modal */}
      {showModal && (
        <AppointmentModal
          appointment={selectedSlot}
          onClose={() => { setShowModal(false); setSelectedSlot(null) }}
          onSaved={() => { setShowModal(false); setSelectedSlot(null); load() }}
        />
      )}
    </div>
  )
}
