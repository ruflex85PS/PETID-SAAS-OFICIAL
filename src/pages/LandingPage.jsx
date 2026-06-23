import { useNavigate } from 'react-router-dom'
export default function LandingPage() {
  const navigate = useNavigate()
  const options = [
    { icon: '🐾', title: 'PETID Vet', desc: 'Clínicas veterinarias', industry: 'veterinary', color: '#4CAF50' },
    { icon: '🏥', title: 'PETID Salud', desc: 'Médicos y especialistas', industry: 'health', color: '#2196F3' },
    { icon: '🛡️', title: 'PETID Seguros', desc: 'Brokers y aseguradoras', industry: 'insurance', color: '#9C27B0' },
    { icon: '⚙️', title: 'Super Admin', desc: 'Acceso total', industry: 'admin', color: '#FF5722' },
  ]
  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0D47A1,#1E88E5)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24}}>
      <img src='/logo.png' alt='PETID' style={{height:100,marginBottom:16}} />
      <h1 style={{color:'white',fontSize:'2rem',marginBottom:8}}>Bienvenido a PETID</h1>
      <p style={{color:'rgba(255,255,255,0.8)',marginBottom:40}}>Selecciona tu tipo de cuenta</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16,width:'100%',maxWidth:900}}>
        {options.map(o => (
          <div key={o.industry} onClick={() => o.industry === 'admin' ? navigate('/login') : (sessionStorage.setItem('selectedIndustry', o.industry), navigate('/register?industry=' + o.industry))} style={{background:'white',borderRadius:16,padding:28,cursor:'pointer',textAlign:'center',border:'3px solid '+o.color}}>
            <div style={{fontSize:'3rem',marginBottom:12}}>{o.icon}</div>
            <h2 style={{color:o.color,marginBottom:8}}>{o.title}</h2>
            <p style={{color:'#666',fontSize:'0.9rem'}}>{o.desc}</p>
          </div>
        ))}
      </div>
      <p style={{color:'rgba(255,255,255,0.6)',marginTop:32}}>Ya tienes cuenta? <span onClick={() => navigate('/login')} style={{color:'white',cursor:'pointer'}}>Inicia sesión</span></p>
    </div>
  )
}
