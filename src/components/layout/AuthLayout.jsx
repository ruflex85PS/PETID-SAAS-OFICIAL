import styles from './AuthLayout.module.css'

export default function AuthLayout({ children }) {
  return (
    <div className={styles.layout}>
      <div className={styles.brand}>
        <div className={styles.logo}>
          <span>🐾</span>
        </div>
        <h1 className={styles.brandName}>PETID</h1>
        <p className={styles.brandTagline}>Menos ausencias. Más ingresos.</p>
        <div className={styles.features}>
          <div className={styles.feature}>✅ Recordatorios automáticos</div>
          <div className={styles.feature}>📅 Agenda inteligente</div>
          <div className={styles.feature}>💰 Recuperación de citas</div>
          <div className={styles.feature}>📊 Métricas en tiempo real</div>
        </div>
      </div>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  )
}
