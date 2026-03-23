import { useState } from 'react'
import Login from './components/Login.jsx'
import Hucha from './components/Hucha.jsx'

export default function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('hucha_auth'))

  function handleLogout() {
    localStorage.removeItem('hucha_auth')
    setAuthed(false)
  }

  return authed
    ? <Hucha onLogout={handleLogout} />
    : <Login onLogin={() => setAuthed(true)} />
}
