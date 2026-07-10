import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, PawPrint, Calendar, Clock, Syringe,
  CheckCircle, XCircle, TrendingUp, AlertCircle, Zap
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { format, isToday, startOfDay, endOfDay, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import styles from './DashboardPage.module.css'

export default function DashboardPage() {
  const { organization, profile } = useAuth()
  const isSuspended = organization?.status === 'suspended' && !profile?.is_super_admin
  const [stats, setStats] = useState(null)
  const [todayAppts, setTodayAppts] = useState([])
  const [upcomingAppts, setUpcomingAppts] = useState([])
  const [pendingVaccines, setPendingVaccines] = useState([])
  const [availableSlots, setAvailableSlots] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (organization) loadDashboard()
  }, [organization])

  async function loadDashboard() {
    setLoading(true)
    try {
      const now = new Date()
      const todayStart = startOfDay(now).toISOString()
      const todayEnd = endOfDay(now).toISOString()
      const nextWeek = addDays(now, 7).toISOString()

      const [
        { count: totalCustomers },
        { count: totalPets },
        { count: totalAppts },
        { count: confirmedAppts },
        { count: cancelledAppts },
        { data: todayData },
        { data: upcomingData },
        { data: vaccineData },
        { data: cancelledSlots },
      ] = await Promise.all([
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('organization_id', organization.id),
        supabase.from('pets').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('organization_id', organization.id),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('organization_id', organization.id),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'confirmed').eq('organization_id', organization.id),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'cancelled').eq('organization_id', organization.id),
        supabase.from('appointments').select(`
          id, title, scheduled_at, status, duration_minutes,
          customers(full_name), pets(name), services(name, color)
        `).eq('organization_id', organization.id).gte('scheduled_at', todayStart).lte('scheduled_at', todayEnd)
          .order('scheduled_at'),
        supabase.from('appointments').select(`
          id, title, scheduled_at, status, duration_minutes,
          customers(full_name), pets(name), services(name, color)
        `).eq('organization_id', organization.id).gt('scheduled_at', todayEnd).lte('scheduled_at', nextWeek)
          .in('status', ['scheduled', 'confirmed'])
          .order('scheduled_at').limit(5),
        supabase.from('vaccines').select(`
          id, vaccine_name, next_due_date, pets(name, customers(full_name))
        `).eq('organization_id', organization.id).lte('next_due_date', addDays(now, 30).toISOString().split('T')[0])
          .order('next_due_date').limit(5),
        supabase.from('appointments').select(`
          id, title, scheduled_at, duration_minutes, cancellation_reason,
          customers(full_name), services(name)
        `).eq('status', 'cancelled').eq('organization_id', organization.id).gte('scheduled_at', now.toISOString())
          .order('scheduled_at').limit(4),
      ])

      setStats({ totalCustomers, totalPets, totalAppts, confirmedAppts, cancelledAppts })
      setTodayAppts(todayData || [])
      setUpcomingAppts(upcomingData || [])
      setPendingVaccines(vaccineData || [])
      setAvailableSlots(cancelledSlots || [])
    } catch (err) {
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  )

  const attendanceRate = stats?.totalAppts
    ? Math.round(((stats.totalAppts - (stats.cancelledAppts || 0)) / stats.totalAppts) * 100)
    : 0

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">{greeting()}, {profile?.full_name?.split(' ')[0] || 'bienvenido'} 👋</div>
          <div className="page-subtitle">{format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })}</div>
        </div>
        {isSuspended ? (
          <span className="btn btn-primary" style={{ opacity: 0.4, cursor: 'not-allowed', pointerEvents: 'none' }} title="Cuenta suspendida. Por favor comunícate con PETID Admin para reactivarla.">
            <Calendar size={16} /> Nueva cita
          </span>
        ) : (
          <Link to="/appointments" className="btn btn-primary">
            <Calendar size={16} /> Nueva cita
          </Link>
        )}
      </div>

      {/* Stat cards */}
      <div className={styles.statsGrid}>
        <StatCard icon={<Users size={20} />} label="Clientes" value={stats?.totalCustomers || 0} color="primary" link="/customers" />
        <StatCard icon={<PawPrint size={20} />} label="Mascotas" value={stats?.totalPets || 0} color="success" link="/pets" />
        <StatCard icon={<Calendar size={20} />} label="Total Citas" value={stats?.totalAppts || 0} color="info" />
        <StatCard icon={<TrendingUp size={20} />} label="Tasa Asistencia" value={`${attendanceRate}%`} color="warning" />
      </div>

      {/* Main content grid */}
      <div className={styles.mainGrid}>
        {/* Today's appointments */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: '1rem' }}>
              <Calendar size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
              Citas de Hoy ({todayAppts.length})
            </h3>
            <Link to="/appointments" className="btn btn-secondary btn-sm">Ver agenda</Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {todayAppts.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 20px' }}>
                <p>No hay citas programadas para hoy</p>
                {isSuspended ? <span className="btn btn-primary btn-sm" style={{ opacity: 0.4, cursor: 'not-allowed', pointerEvents: 'none' }} title="Cuenta suspendida. Por favor comunícate con PETID Admin para reactivarla.">Agregar cita</span> : <Link to="/appointments" className="btn btn-primary btn-sm">Agregar cita</Link>}
              </div>
            ) : (
              <div className={styles.appointmentList}>
                {todayAppts.map(apt => (
                  <AppointmentRow key={apt.id} apt={apt} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Upcoming */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ margin: 0, fontSize: '1rem' }}>
                <Clock size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                Próximas Citas
              </h3>
            </div>
            <div className="card-body" style={{ padding: '12px 0' }}>
              {upcomingAppts.length === 0 ? (
                <p style={{ padding: '8px 20px', color: 'var(--gray-400)', fontSize: '0.875rem' }}>Sin citas esta semana</p>
              ) : (
                upcomingAppts.map(apt => (
                  <div key={apt.id} className={styles.upcomingItem}>
                    <div className={styles.upcomingDot} style={{ background: apt.services?.color || '#4F46E5' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--gray-800)' }}>
                        {apt.customers?.full_name}
                        {apt.pets?.name && <span style={{ color: 'var(--gray-500)', fontWeight: 400 }}> — {apt.pets.name}</span>}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                        {format(new Date(apt.scheduled_at), "EEE d MMM, HH:mm", { locale: es })}
                      </div>
                    </div>
                    <StatusBadge status={apt.status} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending vaccines */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ margin: 0, fontSize: '1rem' }}>
                <Syringe size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                Vacunas Pendientes
              </h3>
            </div>
            <div className="card-body" style={{ padding: '12px 0' }}>
              {pendingVaccines.length === 0 ? (
                <p style={{ padding: '8px 20px', color: 'var(--gray-400)', fontSize: '0.875rem' }}>Sin vacunas pendientes</p>
              ) : (
                pendingVaccines.map(v => {
                  const overdue = new Date(v.next_due_date) < new Date()
                  return (
                    <div key={v.id} className={styles.vaccineItem}>
                      <AlertCircle size={14} style={{ color: overdue ? 'var(--danger)' : 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                          {v.pets?.name} <span style={{ fontWeight: 400, color: 'var(--gray-500)' }}>({v.pets?.customers?.full_name})</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: overdue ? 'var(--danger)' : 'var(--warning)' }}>
                          {v.vaccine_name} · {overdue ? '⚠️ Vencida' : format(new Date(v.next_due_date), "d MMM", { locale: es })}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Available slots (cancelled appointments) */}
      {availableSlots.length > 0 && (
        <div className="card" style={{ marginTop: 20, border: '2px solid var(--success-bg)' }}>
          <div className="card-header" style={{ background: 'var(--success-bg)', borderRadius: '10px 10px 0 0' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--success)' }}>
                🟢 Horarios Disponibles — Oportunidades de Recuperación
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--success)', opacity: 0.8 }}>
                Estas citas fueron canceladas. Puedes asignar nuevos pacientes.
              </p>
            </div>
            <Link to="/available-slots" className="btn btn-sm" style={{ background: 'var(--success)', color: 'white' }}>
              Ver todos
            </Link>
          </div>
          <div className="card-body">
            <div className={styles.slotsGrid}>
              {availableSlots.map(slot => (
                <div key={slot.id} className={styles.slotCard}>
                  <div className={styles.slotTime}>
                    {format(new Date(slot.scheduled_at), "EEE d MMM", { locale: es })}
                    <br />
                    <strong>{format(new Date(slot.scheduled_at), "HH:mm")}</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                    {slot.duration_minutes} min · {slot.services?.name || 'Servicio'}
                  </div>
                  <Link to="/appointments" className="btn btn-sm" style={{ background: 'var(--success)', color: 'white', marginTop: 6 }}>
                    Asignar
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color, link }) {
  const colorMap = {
    primary: { bg: 'var(--primary-bg)', color: 'var(--primary)', icon: 'var(--primary-dark)' },
    success: { bg: 'var(--success-bg)', color: 'var(--success)', icon: '#065f46' },
    warning: { bg: 'var(--warning-bg)', color: 'var(--warning)', icon: '#92400e' },
    info: { bg: 'var(--info-bg)', color: 'var(--info)', icon: '#164e63' },
  }
  const c = colorMap[color] || colorMap.primary
  const content = (
    <div className="card" style={{ cursor: link ? 'pointer' : 'default' }}>
      <div className="card-body">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--gray-500)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: c.color, lineHeight: 1 }}>{value}</div>
          </div>
          <div style={{ background: c.bg, color: c.icon, padding: 10, borderRadius: 10 }}>{icon}</div>
        </div>
      </div>
    </div>
  )
  return link ? <Link to={link} style={{ textDecoration: 'none' }}>{content}</Link> : content
}

function AppointmentRow({ apt }) {
  return (
    <div className={styles.apptRow}>
      <div className={styles.apptTime}>
        {format(new Date(apt.scheduled_at), 'HH:mm')}
        <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>{apt.duration_minutes}min</div>
      </div>
      <div className={styles.apptColor} style={{ background: apt.services?.color || '#4F46E5' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray-800)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {apt.customers?.full_name}
          {apt.pets?.name && <span style={{ color: 'var(--gray-500)', fontWeight: 400 }}> · {apt.pets.name}</span>}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>{apt.services?.name || apt.title}</div>
      </div>
      <StatusBadge status={apt.status} />
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    scheduled: { label: 'Programada', cls: 'badge-primary' },
    confirmed: { label: 'Confirmada', cls: 'badge-success' },
    in_progress: { label: 'En curso', cls: 'badge-info' },
    completed: { label: 'Completada', cls: 'badge-gray' },
    cancelled: { label: 'Cancelada', cls: 'badge-danger' },
    no_show: { label: 'No asistió', cls: 'badge-warning' },
  }
  const s = map[status] || { label: status, cls: 'badge-gray' }
  return <span className={`badge ${s.cls}`}>{s.label}</span>
}
