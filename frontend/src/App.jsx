import { useState } from 'react'
import Dashboard from './pages/Dashboard.jsx'
import Benchmark from './pages/Benchmark.jsx'
import Comparaison from './pages/Comparaison.jsx'
import Prescripteurs from './pages/Prescripteurs.jsx'

const PAGES = [
  { id: 'dashboard',      label: 'Vue nationale',      icon: '◈' },
  { id: 'benchmark',      label: 'Benchmark marché',   icon: '◎' },
  { id: 'comparaison',    label: 'Comparaison régions', icon: '◉' },
  { id: 'prescripteurs',  label: 'Prescripteurs',       icon: '◐' },
]

const Logo = ({ size = 80, style = {} }) => (
  <img
    src="/logo_Snadom.png"
    alt="Snadom"
    style={{
      width: size,
      height: 'auto',
      objectFit: 'contain',
      display: 'block',
      ...style,
    }}
  />
)

export default function App() {
  const [page, setPage] = useState('dashboard')

  return (
    <div className="app-shell">
      <aside className="sidebar">
        {/* Logo haut sidebar */}
        <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Logo size={120} style={{ opacity: 0.9 }} />
        </div>

        <div className="sidebar-logo">
          <h1>Open<span>LPP</span></h1>
          <p>Analyse de marché · AMELI</p>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-label">Navigation</div>
          {PAGES.map(p => (
            <div
              key={p.id}
              className={`nav-item ${page === p.id ? 'active' : ''}`}
              onClick={() => setPage(p.id)}
            >
              <span className="nav-icon">{p.icon}</span>
              {p.label}
            </div>
          ))}
        </nav>

        {/* Logo bas sidebar + mention */}
        <div style={{ padding: '20px 28px', borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 'auto' }}>
		<Logo size={80} style={{ background: 'white', padding: '4px', borderRadius: 4, opacity: 0.9, marginBottom: 10 }} />
          <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', lineHeight: 1.6 }}>
            Données AMELI · Open LPP - Snadom<br />
            2020 – 2024
          </p>
        </div>
      </aside>

      <main className="main-content">
        {/* Logo haut contenu */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end',
          padding: '16px 48px 0',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-card)',
        }}>
          <Logo size={120} style={{ opacity: 0.9 }} />
        </div>

        {page === 'dashboard'      && <Dashboard />}
        {page === 'benchmark'     && <Benchmark />}
        {page === 'comparaison'   && <Comparaison />}
        {page === 'prescripteurs' && <Prescripteurs />}

        {/* Logo bas contenu */}
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          gap: 16, padding: '24px 48px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-card)',
        }}>
         <Logo size={120} style={{ opacity: 0.9 }} />
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Données open data AMELI · Open LPP · 2020–2024<br />
            Outil à usage interne — ne pas diffuser
          </p>
        </div>
      </main>
    </div>
  )
}