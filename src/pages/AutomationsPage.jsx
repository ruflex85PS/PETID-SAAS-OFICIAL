import { useState, useEffect, useCallback } from 'react'
import { Bell, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Dog, Syringe, Calendar, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const AUTOMATION_TYPES = {
  reminder_24h: { label: 'Recordatorio 24h', icon: Clock, color: '#3b82f6' },
  reminder_2h: { label: 'Recordatorio 2h', icon: Bell, color: '#8b5cf6' },
  followup_postconsult: { label: 'Seguimiento post-consulta', icon: CheckCircle, color: '#10b981' },
  vaccine_reminder: { label: 'Recordatorio de vacuna', icon: Syringe, color: '#f59e0b' },
  deworming_reminder: { label: 'Recordatorio desparasitación', icon: Dog, color: '#ef4444' },
  slot_recovery: { label: 'Recuperación de espacio', icon: Calendar, color: '#6366f1' },
}

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', color: '#f59e0b', bg: '#fef3c7', icon: Clock },
  sent: { label: 'Enviado', color: '#10b981', bg: '#d1fae5', icon: CheckCircle },
  failed: { label: 'Fallido', color: '#ef4444', bg: '#fee2e2', icon: XCircle },
  cancelled: { label: 'Cancelado', color: '#6b7280', bg: '#f3f4f6', icon: AlertCircle },
}

export default function AutomationsPage() {
  const { organization } = useAuth()
  const [automations, setAutomations] = useState([])
  const [stats, setStats] = useState({ pending: 0, sent: 0, failed: 0, cancelled: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all | pending | sent | failed
  const [typeFilter, setTypeFilter] = useState('all')
  const [retrying, setRetrying] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('automations')
      .select("*")
      .order('scheduled_for', { ascending: false })
      .limit(200)

    if (data) {
      setAutomations(data)
      const s = { pending: 0, sent: 0, failed: 0, cancelled: 0, total: data.length }
      data.forEach(a => { if (s[a.status] !== undefined) s[a.status]++ })
      setStats(s)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = automations.filter(a => {
    if (filter !== 'all' && a.status !== filter) return false
    if (typeFilter !== 'all' && a.automation_type !== typeFilter) return false
    return true
  })

  async function retryAutomation(id) {
    setRetrying(id)
    await supabase
      .from('automations')
      .update({ status: 'pending', sent_at: null, error_message: null })
      .eq('id', id)
    await load()
    setRetrying(null)
  }

  async function cancelAutomation(id) {
    await supabase.from('automations').update({ status: 'cancelled' }).eq('id', id)
    await load()
  }

  function getContactChannel(automation) {
    const appt = automation.appointments
    if (!appt) return null
    const customer = appt.customers
    if (!customer) return null
    if (customer.whatsapp) return { type: 'WhatsApp', value: customer.whatsapp }
    if (customer.phone) return { type: 'SMS', value: customer.phone }
    return null
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Automatizaciones</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--gray-500)', fontSize: 14 }}>
            Recordatorios, seguimientos y notificaciones automáticas
          </p>
        </div>
        <button className="btn btn-secondary" onClick={load} disabled={loading}>
          <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Actualizar
        </button>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { key: 'total', label: 'Total', color: '#6366f1', bg: '#eef2ff' },
          { key: 'pending', label: 'Pendientes', color: '#f59e0b', bg: '#fef3c7' },
          { key: 'sent', label: 'Enviados', color: '#10b981', bg: '#d1fae5' },
          { key: 'failed', label: 'Fallidos', color: '#ef4444', bg: '#fee2e2' },
        ].map(({ key, label, color, bg }) => (
          <div
            key={key}
            className="card"
            style={{ cursor: 'pointer', borderLeft: `4px solid ${color}`, transition: 'opacity 0.15s' }}
            onClick={() => setFilter(key === 'total' ? 'all' : key)}
          >
            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color }}>{stats[key]}</div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending actions alert */}
      {stats.pending > 0 && (
        <div style={{
          background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 10,
          padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10
        }}>
          <Clock size={18} color="#f59e0b" />
          <span style={{ fontSize: 14, color: '#92400e' }}>
            <strong>{stats.pending} automatizaciones pendientes</strong> esperando ser procesadas.
            {' '}Las notificaciones se enviarán cuando se conecte la integración de WhatsApp/SMS.
          </span>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'pending', 'sent', 'failed', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`btn ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: 13, padding: '6px 12px' }}
            >
              {s === 'all' ? 'Todos' : STATUS_CONFIG[s]?.label || s}
            </button>
          ))}
        </div>
        <select
          className="form-control"
          style={{ width: 'auto', fontSize: 13 }}
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="all">Todos los tipos</option>
          {Object.entries(AUTOMATION_TYPES).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--gray-400)' }}>Cargando automatizaciones…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <Bell size={48} color="var(--gray-300)" style={{ marginBottom: 12 }} />
          <h3 style={{ color: 'var(--gray-500)', margin: '0 0 8px' }}>
            {filter === 'all' && typeFilter === 'all'
              ? 'No hay automatizaciones aún'
              : 'No hay resultados para este filtro'}
          </h3>
          <p style={{ color: 'var(--gray-400)', margin: 0, fontSize: 14 }}>
            Las automatizaciones se crean automáticamente cuando se programan citas,
            vacunas o desparasitaciones.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(automation => {
            const typeInfo = AUTOMATION_TYPES[automation.automation_type] || { label: automation.automation_type, icon: Bell, color: '#6b7280' }
            const statusInfo = STATUS_CONFIG[automation.status] || STATUS_CONFIG.pending
            const TypeIcon = typeInfo.icon
            const StatusIcon = statusInfo.icon
            const appt = automation.appointments
            const contact = getContactChannel(automation)

            return (
              <div key={automation.id} className="card" style={{
                padding: '14px 18px',
                borderLeft: `4px solid ${typeInfo.color}`,
                display: 'flex', alignItems: 'flex-start', gap: 14,
                flexWrap: 'wrap'
              }}>
                {/* Type icon */}
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: typeInfo.color + '20',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <TypeIcon size={20} color={typeInfo.color} />
                </div>

                {/* Main info */}
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                    {typeInfo.label}
                  </div>
                  {appt && (
                    <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 2 }}>
                      {appt.customers?.full_name}
                      {appt.pets && ` • ${appt.pets.name}`}
                      {appt.title && ` • ${appt.title}`}
                    </div>
                  )}
                  {automation.message_preview && (
                    <div style={{
                      fontSize: 12, color: 'var(--gray-400)',
                      background: 'var(--gray-50)', borderRadius: 6,
                      padding: '4px 8px', marginTop: 4,
                      border: '1px solid var(--gray-200)',
                      fontStyle: 'italic'
                    }}>
                      "{automation.message_preview}"
                    </div>
                  )}
                  {automation.error_message && (
                    <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>
                      ⚠ {automation.error_message}
                    </div>
                  )}
                </div>

                {/* Timing */}
                <div style={{ textAlign: 'right', minWidth: 130, flexShrink: 0 }}>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 4 }}>
                    {automation.status === 'sent' && automation.sent_at
                      ? `Enviado ${formatDistanceToNow(parseISO(automation.sent_at), { locale: es, addSuffix: true })}`
                      : automation.scheduled_for
                        ? `Prog. ${format(parseISO(automation.scheduled_for), "d MMM, HH:mm", { locale: es })}`
                        : '—'
                    }
                  </div>
                  {contact && (
                    <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                      {contact.type}: {contact.value}
                    </div>
                  )}
                </div>

                {/* Status badge + actions */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: statusInfo.bg, color: statusInfo.color,
                    fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20
                  }}>
                    <StatusIcon size={11} />
                    {statusInfo.label}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {automation.status === 'failed' && (
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: 11, padding: '3px 8px' }}
                        onClick={() => retryAutomation(automation.id)}
                        disabled={retrying === automation.id}
                      >
                        <RefreshCw size={11} />
                        Reintentar
                      </button>
                    )}
                    {automation.status === 'pending' && (
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: 11, padding: '3px 8px', color: 'var(--gray-500)' }}
                        onClick={() => cancelAutomation(automation.id)}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Integration notice */}
      <div style={{
        marginTop: 32, background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
        borderRadius: 12, padding: '20px 24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <Send size={20} color="var(--gray-400)" style={{ marginTop: 2 }} />
          <div>
            <h4 style={{ margin: '0 0 6px', fontSize: 14, color: 'var(--gray-700)' }}>
              Integración de envío (Versión 2.0)
            </h4>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.6 }}>
              Las automatizaciones ya se generan automáticamente al crear citas, vacunas y desparasitaciones.
              En la próxima versión se conectará con <strong>WhatsApp Business API</strong> para enviar
              los mensajes automáticamente. Por ahora puedes ver y gestionar la cola de mensajes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
