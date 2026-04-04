import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid, ReferenceDot } from 'recharts'

const YEARS = [2020, 2021, 2022, 2023, 2024]
const COLORS = ['#0f2d4a','#1a4a73','#2a6da8','#c9822a','#e8a84e']

const fmt = (n) => n == null ? '—' : new Intl.NumberFormat('fr-FR').format(n)
const fmtM = (n) => n == null ? '—' : `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(n)} M€`

export default function Dashboard() {
  const [year, setYear]     = useState(2024)
  const [kpi, setKpi]       = useState(null)
  const [tops, setTops]     = useState([])
  const [evol, setEvol]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Chargement unique de l'évolution nationale (toutes années)
    fetch('/api/evolution-nationale').then(r => r.json()).then(setEvol)
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/kpi-national?year=${year}`).then(r => r.json()),
      fetch(`/api/top-codes?year=${year}&limit=10`).then(r => r.json()),
    ]).then(([k, t]) => {
      setKpi(k)
      setTops(t)
      setLoading(false)
    })
  }, [year])

  return (
    <div className="fade-up">
      <div className="page-header">
        <div className="eyebrow">Vue nationale</div>
        <h2>Marché du remboursement LPP</h2>
        <p>Dépenses de remboursement AMELI sur l'ensemble du territoire métropolitain.</p>
      </div>

      <div className="page-body">
        {/* Year selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {YEARS.map(y => (
            <button key={y} onClick={() => setYear(y)} style={{
              padding: '6px 16px',
              border: `1px solid ${y === year ? 'var(--navy)' : 'var(--border)'}`,
              background: y === year ? 'var(--navy)' : 'transparent',
              color: y === year ? '#fff' : 'var(--text-secondary)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              transition: 'all 0.2s',
            }}>{y}</button>
          ))}
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /> Chargement…</div>
        ) : (
          <>
            <div className="kpi-grid" style={{ animationDelay: '0.1s' }}>
              <div className="kpi-card fade-up">
                <div className="kpi-label">Remboursements totaux</div>
                <div className="kpi-value">{kpi ? fmtM(kpi.rem_millions) : '—'}</div>
                <div className="kpi-unit">Montant remboursé en {year}</div>
              </div>
              <div className="kpi-card fade-up" style={{ animationDelay: '0.1s' }}>
                <div className="kpi-label">Quantités prescrites</div>
                <div className="kpi-value">{kpi ? fmt(kpi.qte_totale) : '—'}</div>
                <div className="kpi-unit">Actes / produits remboursés</div>
              </div>
              <div className="kpi-card fade-up" style={{ animationDelay: '0.2s' }}>
                <div className="kpi-label">Codes LPP actifs</div>
                <div className="kpi-value">{kpi ? fmt(kpi.nb_codes) : '—'}</div>
                <div className="kpi-unit">Codes distincts remboursés</div>
              </div>
            </div>

            {/* Évolution nationale totale */}
            {evol.length > 0 && (
              <div className="card fade-up" style={{ marginBottom: 24, animationDelay: '0.25s' }}>
                <div className="card-title">
                  Évolution du marché total
                  <span className="subtitle">Tous codes LPP · France métropolitaine · en M€</span>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={evol} margin={{ top: 8, right: 32, bottom: 4, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="annee" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }} />
                    <YAxis
                      tickFormatter={v => `${v}M€`}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      formatter={(v) => [`${v} M€`, 'Remboursements']}
                      labelFormatter={(l) => `Année ${l}`}
                      contentStyle={{
                        fontFamily: 'var(--font-body)', fontSize: 12,
                        border: '1px solid var(--border)', borderRadius: 2,
                        background: 'var(--bg-card)',
                      }}
                    />
                    <ReferenceDot
                      x={year} y={evol.find(e => e.annee === year)?.rem_millions}
                      r={6} fill="var(--amber)" stroke="#fff" strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="rem_millions"
                      stroke="var(--navy)"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: 'var(--navy)', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: 'var(--amber)', strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 12, display: 'flex', gap: 24 }}>
                  {evol.map((e, i) => {
                    const prev = evol[i - 1]
                    const pct = prev && prev.rem_millions > 0
                      ? (((e.rem_millions - prev.rem_millions) / prev.rem_millions) * 100).toFixed(1)
                      : null
                    return (
                      <div key={e.annee} style={{ textAlign: 'center' }}>
                        <div style={{
                          fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                          color: e.annee === year ? 'var(--amber)' : 'var(--text-muted)',
                          fontWeight: e.annee === year ? 600 : 400,
                        }}>{e.annee}</div>
                        {pct && (
                          <div style={{ fontSize: '0.7rem', color: +pct >= 0 ? '#16a34a' : '#dc2626' }}>
                            {+pct >= 0 ? '+' : ''}{pct}%
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="card fade-up" style={{ animationDelay: '0.3s' }}>
              <div className="card-title">
                Top 10 codes LPP par remboursement
                <span className="subtitle">{year} · France métropolitaine</span>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={tops} layout="vertical" margin={{ left: 8, right: 32, top: 4, bottom: 4 }}>
                    <XAxis type="number" tickFormatter={v => `${v}M€`}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }} />
                    <YAxis type="category" dataKey="code" width={80}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }} />
                    <Tooltip
                      formatter={(v) => [`${v} M€`, 'Remboursement']}
                      labelFormatter={(label) => {
                        const item = tops.find(t => t.code === label)
                        return item ? item.label.substring(0, 60) + '…' : label
                      }}
                      contentStyle={{
                        fontFamily: 'var(--font-body)', fontSize: 12,
                        border: '1px solid var(--border)', borderRadius: 2,
                        background: 'var(--bg-card)',
                      }}
                    />
                    <Bar dataKey="rem_millions" radius={[0, 2, 2, 0]}>
                      {tops.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? 'var(--amber)' : i < 3 ? 'var(--navy-mid)' : 'var(--navy)'} fillOpacity={1 - i * 0.05} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Table under chart */}
              <div style={{ marginTop: 24 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Code LPP</th>
                      <th>Libellé</th>
                      <th style={{ textAlign: 'right' }}>Remb. (M€)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tops.map((t, i) => (
                      <tr key={t.code}>
                        <td style={{ color: 'var(--text-muted)', width: 32 }}>{i + 1}</td>
                        <td><span className="badge">{t.code}</span></td>
                        <td className="label-cell" title={t.label}>{t.label}</td>
                        <td style={{ textAlign: 'right', color: 'var(--amber)' }}>{t.rem_millions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}