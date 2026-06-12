import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail } from 'lucide-react'
import styles from './AuthPage.module.css'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const { resetPassword } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await resetPassword(email)
    if (error) { setError(error.message); setLoading(false) }
    else { setSent(true); setLoading(false) }
  }

  if (sent) return (
    <div className={styles.card}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✅</div>
        <h2 style={{ marginBottom: 8 }}>Correo enviado</h2>
        <p style={{ marginBottom: 20 }}>Revisa tu correo para restablecer tu contraseña.</p>
        <Link to="/login" className="btn btn-primary">Volver al inicio</Link>
      </div>
    </div>
  )

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2>Recuperar contraseña</h2>
        <p>Te enviaremos un enlace para restablecer tu contraseña</p>
      </div>
      {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Correo electrónico</label>
          <input type="email" className="form-control" placeholder="tu@correo.com"
            value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
        </div>
        <button type="submit" className="btn btn-primary btn-lg"
          style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
          {loading ? <div className="spinner" style={{ borderTopColor: 'white' }} /> : <Mail size={18} />}
          {loading ? 'Enviando…' : 'Enviar enlace'}
        </button>
      </form>
      <div className={styles.footer}><Link to="/login">← Volver al inicio</Link></div>
    </div>
  )
}
