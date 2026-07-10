import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, isToday, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import AppointmentModal from '../components/appointments/AppointmentModal'
import styles from './AppointmentsPage.module.css'

const STATUS_COLOR = {
  scheduled: '#4F46E5',
  confirmed: '#059669',
  in_progress: '#0891B2',
  completed: '#9CA3AF',
  cancelled: '#EF4444',
  no_show: '#D97706',
  rescheduled: '#7C3AED',
}

export default function AppointmentsPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAppt, setEditingAppt] = useState(null)
  const [view, setView] = useState('week')
  const { organization } = useAuth()
  const [searchParams] = useSearchParams()
  const orgId = searchParams.get('org') || organization?.id

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  useEffect(() => { if (orgId) loadAppointments() }, [orgId, currentWeek, view])

  async function loadAppointments() {
    setLoading(true)
    let start, end
    if (view === 'week') {
      start = weekStart.toISOString()
      end = weekEnd.toISOString()
    } else {
      const today = new Date()
      start = new Date(today.setHours(0, 0, 0, 0)).toISOString()
      end = new Date(today.setHours(23, 59, 59, 999)).toISOString()
    }
    const { data } = await supabase
      .from('appointments')
      .select('*, customers(full_name), pets(name), services(name, color, duration_minutes)')
      .eq('organization_id', orgId)
      .gte('scheduled_at', start)
      .lte('scheduled_at', end)
      .order('scheduled_at')
    setAppointments(data || [])
    setLoading(false)
  }

  function getApptsByDay(day) {
    return appointments.filter(a => isSameDay(new Date(a.scheduled_at), day))
  }

  async function updateStatus(apptId, status) {
    await supabase.from('appointments').update({ status }).eq('id', apptId)
    setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status } : a))
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Agenda</div>
          <div className="page-subtitle">
            {view === 'week'
              ? `${format(weekStart, "d MMM", { locale: es })} — ${format(weekEnd, "d MMM yyyy", { locale: es })}`
              : format(new Date(), "EEEE d MMMM yyyy", { locale: es })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
            <button className={`btn ${view === 'day' ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: 0 }} onClick={() => setView('day')}>
              <Calendar size={14} /> Día
            </button>
            <button className={`btn ${view === 'week' ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: 0 }} onClick={() => setView('week')}>
              <Clock size={14} /> Semana
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditingAppt(null); setShowModal(true) }}>
            <Plus size={16} /> Nueva Cita
          </button>
        </div>
      </div>

      {/* Week navigation */}
      {view === 'week' && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className={styles.weekNav}>
            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
              <ChevronLeft size={14} />
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentWeek(new Date())}>
              Hoy
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
              <ChevronRight size={14} />
            </button>
            <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginLeft: 8, fontWeight: 500 }}>
              {format(weekStart, "MMMM yyyy", { locale: es })}
            </span>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto', width: 28, height: 28 }} />
            </div>
          ) : (
            <div className={styles.weekGrid}>
              {weekDays.map(day => {
                const dayAppts = getApptsByDay(day)
                const isCurrentDay = isToday(day)
                return (
                  <div key={day.toISOString()} className={`${styles.dayCol} ${isCurrentDay ? styles.today : ''}`}>
                    <div className={styles.dayHeader}>
                      <span className={styles.dayName}>
                        {format(day, 'EEE', { locale: es })}
                      </span>
                      <span className={`${styles.dayNum} ${isCurrentDay ? styles.dayNumToday : ''}`}>
                        {format(day, 'd')}
                      </span>
                    </div>
                    <div className={styles.dayBody}>
                      {dayAppts.length === 0 ? (
                        <div className={styles.emptyDay} onClick={() => { { setEditingAppt({ defaultDate: day }); setShowModal(true) } }}>
                          + agregar
                        </div>
                      ) : (
                        dayAppts.map(apt => (
                          <AppointmentCard
                            key={apt.id}
                            apt={apt}
                            onEdit={() => { setEditingAppt(apt); setShowModal(true) }}
                            onStatusChange={status => updateStatus(apt.id, status)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Day view - list */}
      {view === 'day' && (
        <div className="card">
          <div className="card-header">
            <h4 style={{ margin: 0 }}>Citas de hoy ({appointments.length})</h4>
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto', width: 28, height: 28 }} />
            </div>
          ) : appointments.length === 0 ? (
            <div className="empty-state">
              <h3>Sin citas hoy</h3>
              <p>No hay citas programadas para hoy.</p>
              <button className="btn btn-primary" onClick={() => { setEditingAppt(null); setShowModal(true) }}>
                <Plus size={16} /> Agregar cita
              </button>
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              {appointments.map(apt => (
                <div key={apt.id} className={styles.listRow} onClick={() => { setEditingAppt(apt); setShowModal(true) }}>
                  <div className={styles.listTime}>
                    <strong>{format(new Date(apt.scheduled_at), 'HH:mm')}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{apt.duration_minutes}min</span>
                  </div>
                  <div className={styles.listBar} style={{ background: apt.services?.color || STATUS_COLOR[apt.status] }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {apt.customers?.full_name}
                      {apt.pets?.name && <span style={{ fontWeight: 400, color: 'var(--gray-500)' }}> · {apt.pets.name}</span>}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{apt.services?.name || apt.title}</div>
                  </div>
                  <StatusSelect value={apt.status} onChange={s => updateStatus(apt.id, s)} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <AppointmentModal
          appointment={editingAppt}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); loadAppointments() }}
        />
      )}
    </div>
  )
}

function AppointmentCard({ apt, onEdit, onStatusChange }) {
  return (
    <div
      className={styles.apptCard}
      style={{ borderLeft: `3px solid ${apt.services?.color || STATUS_COLOR[apt.status]}` }}
      onClick={onEdit}
    >
      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: 2 }}>
        {format(new Date(apt.scheduled_at), 'HH:mm')}
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--gray-800)', fontWeight: 500, lineHeight: 1.3 }}>
        {apt.customers?.full_name}
        {apt.pets?.name && <span style={{ color: 'var(--gray-500)', fontWeight: 400 }}> · {apt.pets.name}</span>}
      </div>
      {apt.services?.name && (
        <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: 2 }}>{apt.services.name}</div>
      )}
      <div style={{ marginTop: 4 }} onClick={e => e.stopPropagation()}>
        <StatusSelect value={apt.status} onChange={onStatusChange} compact />
      </div>
    </div>
  )
}

function StatusSelect({ value, onChange, compact }) {
  const options = [
    { value: 'scheduled', label: 'Programada' },
    { value: 'confirmed', label: 'Confirmada' },
    { value: 'in_progress', label: 'En curso' },
    { value: 'completed', label: 'Completada' },
    { value: 'cancelled', label: 'Cancelada' },
    { value: 'no_show', label: 'No asistió' },
    { value: 'rescheduled', label: 'Reprogramada' },
  ]
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }} onClick={e => e.stopPropagation()}>
      <span style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: STATUS_COLOR[value] || 'var(--gray-300)',
        flexShrink: 0,
      }} />
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          fontSize: compact ? '0.7rem' : '0.8rem',
          padding: compact ? '2px 4px' : '4px 8px',
          borderRadius: 4,
          border: '1px solid var(--gray-200)',
          background: 'white',
          cursor: 'pointer',
          color: 'var(--gray-700)',
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
