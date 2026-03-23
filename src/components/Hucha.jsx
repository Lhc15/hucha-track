import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const fmt = n => new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

function fmtDate(d) {
  if (!d) return ''
  const date = new Date(d + 'T00:00:00')
  const names = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${date.getDate()} ${names[date.getMonth()]} ${date.getFullYear()}`
}

export default function Hucha({ onLogout }) {
  const [hucha, setHucha] = useState(null)
  const [entries, setEntries] = useState([])
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState('main')
  const [history, setHistory] = useState([])
  const [confirmReset, setConfirmReset] = useState(false)
  const [editIncome, setEditIncome] = useState(false)
  const [incomeInput, setIncomeInput] = useState('')
  const [pulse, setPulse] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [{ data: h }, { data: en }, { data: hist }] = await Promise.all([
      supabase.from('hucha').select('*').single(),
      supabase.from('entries').select('*').order('created_at', { ascending: false }),
      supabase.from('hucha_history').select('*').order('ended_at', { ascending: false })
    ])
    setHucha(h)
    setEntries(en || [])
    setHistory(hist || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const totalSpent = entries.filter(e => e.type === 'expense').reduce((s, e) => s + Number(e.amount), 0)
  const income = hucha?.income || 0
  const disponible = income - totalSpent

  async function addEntry(type) {
    const amt = parseFloat(amount.replace(',', '.'))
    if (!name.trim() || isNaN(amt) || amt <= 0) return
    setSaving(true)
    await supabase.from('entries').insert({
      name: name.trim(),
      category: category.trim() || null,
      amount: amt,
      type
    })
    setPulse(type)
    setTimeout(() => setPulse(null), 600)
    setName(''); setCategory(''); setAmount('')
    await loadData()
    setSaving(false)
  }

  async function deleteEntry(id) {
    await supabase.from('entries').delete().eq('id', id)
    await loadData()
  }

  async function saveIncome() {
    const val = parseFloat(incomeInput.replace(',', '.'))
    if (isNaN(val)) return
    await supabase.from('hucha').update({ income: val }).eq('id', hucha.id)
    setEditIncome(false)
    await loadData()
  }

  async function resetHucha() {
    // Guardar histórico
    const snapshot = entries.map(e => ({ name: e.name, category: e.category, amount: e.amount, type: e.type }))
    await supabase.from('hucha_history').insert({
      started_at: hucha.started_at,
      ended_at: new Date().toISOString().slice(0, 10),
      income: hucha.income,
      total_spent: totalSpent,
      snapshot
    })
    // Borrar entries y resetear hucha
    await supabase.from('entries').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('hucha').update({
      started_at: new Date().toISOString().slice(0, 10),
      income: 0
    }).eq('id', hucha.id)
    setConfirmReset(false)
    await loadData()
  }

  const byCategory = entries.filter(e => e.type === 'expense').reduce((acc, e) => {
    const cat = e.category || 'Sin categoría'
    acc[cat] = (acc[cat] || 0) + Number(e.amount)
    return acc
  }, {})

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p style={{ color: 'var(--ink-muted)', fontSize: 15 }}>Cargando...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 0' }}>
        <h1 style={{ fontFamily: 'DM Serif Display', fontSize: 26, fontWeight: 400 }}>🪙 Hucha</h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => setView(view === 'historial' ? 'main' : 'historial')} style={{ background: 'none', fontSize: 20, padding: 4 }}>📅</button>
          <button onClick={onLogout} style={{ background: 'none', color: 'var(--ink-muted)', fontSize: 13, padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 8 }}>Salir</button>
        </div>
      </div>

      {/* Fecha inicio */}
      <div style={{ padding: '8px 20px 0' }}>
        <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>Desde el {fmtDate(hucha?.started_at)}</span>
      </div>

      {/* HUCHA card */}
      <div style={{ margin: '14px 20px 0', padding: '28px 24px 0', background: 'var(--warm-white)', borderRadius: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Lo que llevo gastado</p>
        <div style={{
          fontSize: 64, fontFamily: 'DM Serif Display', fontWeight: 400, lineHeight: 1,
          color: income > 0 && totalSpent > income ? 'var(--red)' : 'var(--ink)',
          transition: 'color 0.3s',
          animation: pulse ? `${pulse === 'expense' ? 'bumpRed' : 'bumpGreen'} 0.5s ease` : 'none'
        }}>
          {fmt(totalSpent)}€
        </div>
        <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 6 }}>
          {entries.filter(e => e.type === 'expense').length} gastos registrados
        </p>

        {/* Footer stripe */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', marginTop: 24, borderTop: '1px solid var(--border)', marginLeft: -24, marginRight: -24, padding: '14px 24px' }}>
          <div>
            <p style={{ fontSize: 11, color: 'var(--ink-muted)', marginBottom: 3 }}>He cobrado</p>
            {editIncome ? (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input value={incomeInput} onChange={e => setIncomeInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveIncome()} style={{ padding: '4px 8px', fontSize: 14, width: 80, borderRadius: 6 }} autoFocus />
                <button onClick={saveIncome} style={{ background: 'var(--green-btn)', color: 'white', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>✓</button>
              </div>
            ) : (
              <p onClick={() => { setIncomeInput(income); setEditIncome(true) }} style={{ fontSize: 16, fontWeight: 500, cursor: 'pointer', color: 'var(--green)' }}>{fmt(income)}€ ✎</p>
            )}
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: 'var(--ink-muted)', marginBottom: 3 }}>Voy sumando</p>
            <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--ink)' }}>{fmt(totalSpent)}€</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, color: 'var(--ink-muted)', marginBottom: 3 }}>Me queda</p>
            <p style={{ fontSize: 16, fontWeight: 500, color: disponible < 0 ? 'var(--red)' : 'var(--green)' }}>{fmt(disponible)}€</p>
          </div>
        </div>
      </div>

      {/* Add expense form */}
      <div style={{ margin: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input placeholder="Nombre del gasto" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="Categoría (opcional)" value={category} onChange={e => setCategory(e.target.value)} />
        <input placeholder="€" value={amount} onChange={e => setAmount(e.target.value)} type="text" inputMode="decimal" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
          <button onClick={() => addEntry('income')} disabled={saving} style={{
            background: 'var(--green-btn)', color: 'white', padding: '18px', borderRadius: 'var(--radius-sm)',
            fontSize: 16, fontWeight: 500, opacity: saving ? 0.6 : 1
          }}>+ Añades</button>
          <button onClick={() => addEntry('expense')} disabled={saving} style={{
            background: 'var(--red-btn)', color: 'white', padding: '18px', borderRadius: 'var(--radius-sm)',
            fontSize: 16, fontWeight: 500, opacity: saving ? 0.6 : 1
          }}>− Gastas</button>
        </div>
      </div>

      {/* Views */}
      <div style={{ margin: '28px 20px 0' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['main','stats'].map(v => (
            <button key={v} onClick={() => setView(view === v ? 'off' : v)} style={{
              padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
              background: view === v ? 'var(--ink)' : 'var(--warm-white)',
              color: view === v ? 'white' : 'var(--ink-soft)',
              border: '1px solid var(--border)'
            }}>
              {v === 'main' ? 'Lista de gastos' : 'Por categoría'}
            </button>
          ))}
        </div>

        {view === 'main' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {entries.length === 0 && <p style={{ color: 'var(--ink-muted)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>Sin movimientos todavía</p>}
            {entries.map(e => (
              <div key={e.id} style={{
                background: 'var(--warm-white)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderLeft: `4px solid ${e.type === 'expense' ? 'var(--red)' : 'var(--green)'}`
              }}>
                <div>
                  <p style={{ fontWeight: 500, fontSize: 15 }}>{e.name}</p>
                  {e.category && <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>{e.category}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontWeight: 500, fontSize: 16, color: e.type === 'expense' ? 'var(--red)' : 'var(--green)' }}>
                    {e.type === 'expense' ? '-' : '+'}{fmt(e.amount)}€
                  </span>
                  <button onClick={() => deleteEntry(e.id)} style={{ background: 'none', color: 'var(--ink-muted)', fontSize: 16, padding: '2px 6px' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'stats' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.keys(byCategory).length === 0 && <p style={{ color: 'var(--ink-muted)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>Sin datos todavía</p>}
            {Object.entries(byCategory).sort((a,b) => b[1]-a[1]).map(([cat, amt]) => (
              <div key={cat} style={{ background: 'var(--warm-white)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 500, fontSize: 15 }}>{cat}</span>
                  <span style={{ fontWeight: 500, color: 'var(--red)' }}>{fmt(amt)}€</span>
                </div>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
                  <div style={{ height: 4, background: 'var(--red)', borderRadius: 2, width: `${Math.min(100, (amt / totalSpent) * 100)}%` }} />
                </div>
                <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4 }}>{((amt / totalSpent) * 100).toFixed(0)}% del total</p>
              </div>
            ))}
          </div>
        )}

        {view === 'historial' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 4 }}>Huchas anteriores</p>
            {history.length === 0 && <p style={{ color: 'var(--ink-muted)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>Todavía no has reiniciado ninguna hucha</p>}
            {history.map(h => (
              <div key={h.id} style={{ background: 'var(--warm-white)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', padding: '14px 16px' }}>
                <p style={{ fontWeight: 500, fontSize: 14 }}>{fmtDate(h.started_at)} → {fmtDate(h.ended_at)}</p>
                <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--green)' }}>Cobrado: {fmt(h.income)}€</span>
                  <span style={{ fontSize: 13, color: 'var(--red)' }}>Gastado: {fmt(h.total_spent)}€</span>
                </div>
                <p style={{ fontSize: 12, color: disponible < 0 ? 'var(--red)' : 'var(--ink-muted)', marginTop: 4 }}>
                  Saldo: {fmt(h.income - h.total_spent)}€
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reset */}
      <div style={{ margin: '32px 20px 0', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
        {!confirmReset ? (
          <button onClick={() => setConfirmReset(true)} style={{
            width: '100%', background: 'none', border: '1px solid var(--border)', color: 'var(--ink-muted)',
            padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: 14
          }}>Reiniciar hucha</button>
        ) : (
          <div>
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 10, textAlign: 'center' }}>
              Se guardará en el historial y empezará una hucha nueva desde hoy.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={resetHucha} style={{ flex: 1, background: 'var(--red-btn)', color: 'white', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: 14 }}>Sí, reiniciar</button>
              <button onClick={() => setConfirmReset(false)} style={{ flex: 1, background: 'var(--warm-white)', border: '1px solid var(--border)', color: 'var(--ink)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: 14 }}>Cancelar</button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bumpRed { 0%,100% { transform: scale(1); } 40% { transform: scale(1.04); } }
        @keyframes bumpGreen { 0%,100% { transform: scale(1); } 40% { transform: scale(1.04); } }
      `}</style>
    </div>
  )
}
