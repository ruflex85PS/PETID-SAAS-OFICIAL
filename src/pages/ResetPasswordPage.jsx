import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Lock } from 'lucide-react'
import styles from './AuthPage.module.css'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { updatePassword } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    setLoading(true)
    const { error } = await updatePassword(password)
    if (error) { setError(error.message); setLoading(false) }
    else navigate('/dashboard')
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2>Nueva contraseña</h2>
        <p>Elige una contraseña segura</p>
      </div>
      {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nueva contraseña</label>
          <input type="password" className="form-control" placeholder="Mínimo 6 caracteres"
            value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
        </div>
        <div className="form-group">
          <label>Confirmar contraseña</label>
          <input type="password" className="form-control" placeholder="Repite la contraseña"
            value={confirm} onChange={e => setConfirm(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary btn-lg"
          style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
          {loading ? <div className="spinner" style={{ borderTopColor: 'white' }} /> : <Lock size={18} />}
          {loading ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>
    </div>
  )
}
