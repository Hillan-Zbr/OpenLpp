import { useState } from 'react'
import Dashboard from './pages/Dashboard.jsx'
import Benchmark from './pages/Benchmark.jsx'
import Comparaison from './pages/Comparaison.jsx'

const PAGES = [
  { id: 'dashboard',   label: 'Vue nationale',      icon: '◈', eyebrow: 'Aperçu' },
  { id: 'benchmark',  label: 'Benchmark marché',   icon: '◎', eyebrow: 'Analyse' },
  { id: 'comparaison',label: 'Comparaison régions', icon: '◉', eyebrow: 'Analyse' },
]

export default function App() {
  const [page, setPage] = useState('dashboard')

  return (
    <div className="app-shell">
      <aside className="sidebar">
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
        <div style={{ padding: '20px 28px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', lineHeight: 1.6 }}>
            Données AMELI · Open LPP<br />
            2020 – 2024
          </p>
        </div>
      </aside>

      <main className="main-content">
        {page === 'dashboard'    && <Dashboard />}
        {page === 'benchmark'   && <Benchmark />}
        {page === 'comparaison' && <Comparaison />}
      </main>
    </div>
  )
}
