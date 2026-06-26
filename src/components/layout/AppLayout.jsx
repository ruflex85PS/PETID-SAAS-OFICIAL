import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, PawPrint, Calendar, Zap,
  Clock, Menu, X, LogOut, ChevronRight, Bell, MessageSquare
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import styles from './AppLayout.module.css'

const clientNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/appointments', icon: Calendar, label: 'Agenda' },
  { to: '/customers', icon: Users, label: 'Clientes' },
  { to: '/pets', icon: PawPrint, label: 'Mascotas' },
  { to: 'available-slots', icon: Clock, label: 'Horarios Disponibles' },
  { to: 'automations', icon: Zap, label: 'Automatizaciones' },
]
const adminNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/appointments', icon: Calendar, label: 'Agenda' },
  { to: '/customers', icon: Users, label: 'Clientes' },
  { to: '/pets', icon: PawPrint, label: 'Mascotas' },
  { to: '/automations', icon: Zap, label: 'Automatizaciones' },
  { to: '/available-slots', icon: Clock, label: 'Horarios Disponibles' },
  { to: 'templates', icon: MessageSquare, label: 'Plantillas WhatsApp' },
  { to: 'admin', icon: Users, label: 'Clientes PETID' },
]

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { organization, profile, signOut } = useAuth()
  const isSuperAdmin = profile?.is_super_admin === true
  const navItems = isSuperAdmin ? adminNavItems : clientNavItems
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <div className={styles.layout}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        {/* Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.brandMark}>
            <img src="/logo.png" alt="PETID" style={{height: 40, width: 40, objectFit: "contain"}} />
            <div>
              <div className={styles.brandName}>PETID</div>
              <div className={styles.orgName}>{organization?.name || 'Mi Negocio'}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon show-mobile" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
              <ChevronRight size={14} className={styles.navChevron} />
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className="avatar">{initials}</div>
            <div className={styles.userMeta}>
              <div className={styles.userName}>{profile?.full_name || 'Usuario'}</div>
              <div className={styles.userRole}>{isSuperAdmin ? '⚙️ Super Admin PETID' : profile?.role === 'owner' ? 'Propietario' : 'Staff'}</div>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-icon"
            onClick={handleSignOut}
            title="Cerrar sesión"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={styles.main}>
        {/* Top bar */}
        <header className={styles.topbar}>
          <button
            className="btn btn-ghost btn-icon show-mobile"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className={styles.topbarRight}>
            <button className="btn btn-ghost btn-icon" title="Notificaciones">
              <Bell size={18} />
            </button>
          </div>
        </header>

        {/* Suspended banner */}
        {organization?.status === 'suspended' && !isSuperAdmin && (
          <div style={{background:'#fee2e2',borderBottom:'2px solid #dc2626',padding:'12px 24px',display:'flex',alignItems:'center',gap:12}}>
            <span style={{fontSize:'1.2rem'}}>🔒</span>
            <div>
              <strong style={{color:'#dc2626'}}>Cuenta suspendida</strong>
              <span style={{color:'#7f1d1d',marginLeft:8,fontSize:'0.9rem'}}>Tu cuenta está suspendida por falta de pago. Comunícate con PETID Admin para reactivarla.</span>
            </div>
          </div>
        )}
        {/* Content */}
        <main className={styles.content}>
          <Outlet context={{ isSuspended: organization?.status === 'suspended' && !isSuperAdmin }} />
        </main>
      </div>
    </div>
  )
}
