import { useState } from 'react'

const PASSWORD = 'hucha2025'

export default function Login({ onLogin }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (pw === PASSWORD) {
      localStorage.setItem('hucha_auth', '1')
      onLogin()
    } else {
      setError(true)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      gap: '2rem'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>🪙</div>
        <h1 style={{ fontFamily: 'DM Serif Display', fontSize: 36, fontWeight: 400, letterSpacing: '-0.5px' }}>Hucha</h1>
        <p style={{ color: 'var(--ink-soft)', marginTop: 6, fontSize: 15 }}>Tu tracker de gastos personal</p>
      </div>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="password"
          placeholder="Contraseña"
          value={pw}
          onChange={e => { setPw(e.target.value); setError(false) }}
          style={{
            textAlign: 'center',
            fontSize: 18,
            letterSpacing: 4,
            animation: shake ? 'shake 0.4s ease' : 'none',
            borderColor: error ? 'var(--red)' : undefined
          }}
          autoFocus
        />
        {error && <p style={{ color: 'var(--red)', fontSize: 13, textAlign: 'center' }}>Contraseña incorrecta</p>}
        <button type="submit" style={{
          background: 'var(--ink)',
          color: 'white',
          padding: '16px',
          borderRadius: 'var(--radius-sm)',
          fontSize: 16,
          fontWeight: 500,
          marginTop: 4
        }}>
          Entrar
        </button>
      </form>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}
