import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { UserPlus } from 'lucide-react'
import styles from './AuthPage.module.css'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setLoading(true)
    const { error } = await signUp(email, password, fullName)
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className={styles.card}>
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>✉️</div>
          <h2 style={{ marginBottom: 8 }}>Revisa tu correo</h2>
          <p style={{ marginBottom: 20 }}>
            Enviamos un enlace de confirmación a <strong>{email}</strong>.<br />
            Haz clic en el enlace para activar tu cuenta.
          </p>
          <Link to="/login" className="btn btn-primary" style={{ justifyContent: 'center' }}>
            Ir al inicio de sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2>Crear cuenta</h2>
        <p>Empieza gratis, sin tarjeta de crédito</p>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nombre completo</label>
          <input
            type="text"
            className="form-control"
            placeholder="Tu nombre"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label>Correo electrónico</label>
          <input
            type="email"
            className="form-control"
            placeholder="tu@correo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Contraseña</label>
          <input
            type="password"
            className="form-control"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
          disabled={loading}
        >
          {loading ? <div className="spinner" style={{ borderTopColor: 'white' }} /> : <UserPlus size={18} />}
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>

      <div className={styles.footer}>
        ¿Ya tienes cuenta?{' '}
        <Link to="/login">Iniciar sesión</Link>
      </div>
    </div>
  )
}
