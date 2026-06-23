import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import styles from './AuthPage.module.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos.'
          : error.message
      )
      setLoading(false)
    }
    // Navigation handled by AuthContext/App
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2>Bienvenido de vuelta</h2>
        <p>Ingresa a tu cuenta para continuar</p>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Correo electrónico</label>
          <input
            type="email"
            className="form-control"
            placeholder="tu@correo.com" autoComplete="off"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ margin: 0 }}>Contraseña</label>
            <Link to="/forgot-password" className={styles.forgotLink}>¿Olvidaste tu contraseña?</Link>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-control"
              placeholder="••••••••" autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ paddingRight: 40 }}
            />
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)' }}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
          disabled={loading}
        >
          {loading ? <div className="spinner" style={{ borderTopColor: 'white' }} /> : <LogIn size={18} />}
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>

      <div className={styles.footer}>
        ¿No tienes cuenta?{' '}
        <Link to="/register">Crear cuenta gratuita</Link>
      </div>

      {/* Super Admin */}
      <div style={{ textAlign: "center", marginTop: 16, paddingTop: 16, borderTop: "1px solid #eee" }}>
        <button onClick={() => { setEmail("alvaroandres2802@gmail.com") }} style={{ background: "none", border: "none", color: "#999", fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline" }}>Acceso Super Admin</button>
      </div>
      {/* Demo hint */}
      <div className={styles.demoHint}>
        <strong>Cuenta demo:</strong> usa las credenciales de tu proyecto Supabase.<br />
        Si es la primera vez, <Link to="/register">regístrate</Link> y luego configura tu organización.
      </div>
    </div>
  )
}
