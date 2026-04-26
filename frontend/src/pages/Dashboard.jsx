import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid, ReferenceDot } from 'recharts'

const styles = `
  .dashboard-hifi {
    --nav: #102e4b;
    --nav-2: #0b2238;
    --nav-hi: #1a4368;
    --nav-ink: #dbe6f1;
    --nav-muted: #7c98b3;
    --paper: #f5f2ed;
    --paper-2: #ffffff;
    --ink: #1b2230;
    --ink-2: #3b4657;
    --muted: #7a8498;
    --line: #e1dcd2;
    --line-2: #ebe7dd;
    --card: #ffffff;
    --accent: #c9822a;
    --accent-2: #a86a1f;
    --accent-soft: #f7e9d1;
    --accent-softer: #fbf3e4;
    --ok: #3f7d4a;
    --ok-soft: #e2efdf;
    --focus-ring: 0 0 0 3px rgba(201,130,42,.22);
    --shadow-sm: 0 1px 2px rgba(16,46,75,.06);
    --shadow-md: 0 1px 2px rgba(16,46,75,.06), 0 8px 20px -12px rgba(16,46,75,.18);
    padding: 0 32px;
  }

  .dashboard-hifi .page-head { display: flex; align-items: flex-end; gap: 18px; flex-wrap: wrap; margin-bottom: 14px; }
  .dashboard-hifi .page-head .eyebrow { font-size: 11px; letter-spacing: .18em; color: var(--accent-2); text-transform: uppercase; font-weight: 600; }
  .dashboard-hifi .page-head h1 { margin: 4px 0 4px; font-size: 24px; font-weight: 700; letter-spacing: -.3px; line-height: 1.15; }
  .dashboard-hifi .page-head p { margin: 0; color: var(--ink-2); font-size: 13.5px; max-width: 720px; }

  .dashboard-hifi .controls { display: flex; gap: 24px; flex-wrap: wrap; align-items: center; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid var(--line); }
  .dashboard-hifi .controls-group { display: flex; gap: 8px; align-items: center; }
  .dashboard-hifi .controls-label { font-size: 11.5px; font-weight: 600; color: var(--ink-2); letter-spacing: .02em; text-transform: uppercase; }
  .dashboard-hifi .controls-buttons { display: flex; gap: 6px; }

  .dashboard-hifi .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    padding: 8px 14px; border-radius: 8px; border: 1px solid var(--line);
    background: #fff; color: var(--ink); font-size: 13px; font-weight: 500; cursor: pointer;
    transition: all 0.2s;
  }

  .dashboard-hifi .btn:hover {
    background: var(--accent-softer); border-color: var(--accent); color: var(--accent-2);
  }

  .dashboard-hifi .btn.active {
    background: linear-gradient(180deg,var(--accent),var(--accent-2));
    color: #fff; border-color: var(--accent-2);
  }

  .dashboard-hifi .kpi-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 28px;
  }

  .dashboard-hifi .kpi-card {
    background: linear-gradient(135deg, #fffaf1, #fbf3e4);
    border: 1px solid var(--accent); border-radius: 12px;
    padding: 20px; box-shadow: 0 0 0 1px rgba(201,130,42,.1);
  }

  .dashboard-hifi .kpi-card .label {
    font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--accent-2); font-weight: 600; margin-bottom: 8px;
  }

  .dashboard-hifi .kpi-card .value {
    font-size: 2.2rem; font-weight: 700; color: var(--accent); letter-spacing: -0.02em; margin-bottom: 4px; font-family: 'DM Mono', monospace;
  }

  .dashboard-hifi .kpi-card .unit {
    font-size: 12px; color: var(--muted); line-height: 1.4;
  }

  .dashboard-hifi .card { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 24px; }

  .dashboard-hifi .card .title {
    font-size: 16px; font-weight: 700; color: var(--ink); margin-bottom: 4px;
  }

  .dashboard-hifi .card .subtitle {
    font-size: 12px; color: var(--muted); font-weight: 400; margin-left: 8px;
  }

  @media (max-width: 1100px) {
    .dashboard-hifi .kpi-grid { grid-template-columns: 1fr; }
  }
`

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
  const [source, setSource] = useState('ref')

  useEffect(() => {
    // Chargement unique de l'évolution nationale (toutes années)
    fetch(`/api/evolution-nationale?source=${source}`).then(r => r.json()).then(setEvol)
  }, [source])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/kpi-national?year=${year}&source=${source}`).then(r => r.json()),
      fetch(`/api/top-codes?year=${year}&limit=10&source=${source}`).then(r => r.json()),
    ]).then(([k, t]) => {
      setKpi(k)
      setTops(t)
      setLoading(false)
    })
  }, [year, source])

  return (
    <>
      <style>{styles}</style>
      <div className="dashboard-hifi fade-up">
        <div className="page-head">
          <div>
            <div className="eyebrow">Vue nationale</div>
            <h1>Marché du remboursement LPP</h1>
            <p>Dépenses de remboursement AMELI sur l'ensemble du territoire métropolitain.</p>
          </div>
        </div>

        <div className="controls">
          <div className="controls-group">
            <span className="controls-label">Année</span>
            <div className="controls-buttons">
              {YEARS.map(y => (
                <button key={y} onClick={() => setYear(y)} className={`btn ${y === year ? 'active' : ''}`}>
                  {y}
                </button>
              ))}
            </div>
          </div>

          <div className="controls-group">
            <span className="controls-label">Classification</span>
            <div className="controls-buttons">
              <button onClick={() => setSource('ref')} className={`btn ${source === 'ref' ? 'active' : ''}`}>
                Référence
              </button>
              <button onClick={() => setSource('orig')} className={`btn ${source === 'orig' ? 'active' : ''}`}>
                Originale
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /> Chargement…</div>
        ) : (
          <>
            <div className="kpi-grid">
              <div className="kpi-card fade-up">
                <div className="label">Remboursements totaux</div>
                <div className="value">{kpi ? fmtM(kpi.rem_millions) : '—'}</div>
                <div className="unit">Montant remboursé en {year}</div>
              </div>
              <div className="kpi-card fade-up" style={{ animationDelay: '0.05s' }}>
                <div className="label">Quantités prescrites</div>
                <div className="value">{kpi ? fmt(kpi.qte_totale) : '—'}</div>
                <div className="unit">Actes / produits remboursés</div>
              </div>
              <div className="kpi-card fade-up" style={{ animationDelay: '0.1s' }}>
                <div className="label">Codes LPP actifs</div>
                <div className="value">{kpi ? fmt(kpi.nb_codes) : '—'}</div>
                <div className="unit">Codes distincts remboursés</div>
              </div>
            </div>

            {/* Évolution nationale totale */}
            {evol.length > 0 && (
              <div className="card fade-up" style={{ marginBottom: 24, animationDelay: '0.15s' }}>
                <div className="title">
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

            <div className="card fade-up" style={{ animationDelay: '0.2s' }}>
              <div className="title">
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
    </>
  )
}