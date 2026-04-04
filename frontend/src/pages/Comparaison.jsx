import { useState, useEffect } from 'react'
import Select from 'react-select'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid
} from 'recharts'

const YEARS = [2020, 2021, 2022, 2023, 2024]
const ALL_REGIONS = [5,11,24,27,28,32,44,52,53,75,76,84,93]

export default function Comparaison() {
  const [lppQuery, setLppQuery]     = useState('')
  const [lppOptions, setLppOptions] = useState([])
  const [selLpp, setSelLpp]         = useState(null)
  const [year, setYear]             = useState(2024)
  const [data, setData]             = useState([])
  const [loading, setLoading]       = useState(false)
  const [lppLoading, setLppLoading] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setLppLoading(true)
      fetch(`/api/codes-lpp?q=${encodeURIComponent(lppQuery)}`)
        .then(r => r.json())
        .then(d => { setLppOptions(d.map(x => ({ value: x.code, label: x.label }))); setLppLoading(false) })
    }, 300)
    return () => clearTimeout(t)
  }, [lppQuery])

  const fetchData = () => {
    if (!selLpp) return
    setLoading(true)
    const params = new URLSearchParams({
      code_lpp: selLpp.value,
      year_start: year,
      year_end: year,
    })
    ALL_REGIONS.forEach(r => params.append('regions', r))
    fetch(`/api/evolution?${params}`)
      .then(r => r.json())
      .then(d => {
        // Flatten to single bar chart
        const bars = d
          .map(s => ({
            region: s.region,
            rem: s.rem_x100k[0] ?? 0,
          }))
          .filter(s => s.rem > 0)
          .sort((a, b) => b.rem - a.rem)
        setData(bars)
        setLoading(false)
      })
  }

  const maxVal = data.length ? Math.max(...data.map(d => d.rem)) : 1

  return (
    <div className="fade-up">
      <div className="page-header">
        <div className="eyebrow">Comparaison régions</div>
        <h2>Position relative par région</h2>
        <p>Pour un code LPP donné, visualisez le poids de chaque région dans le remboursement national.</p>
      </div>

      <div className="page-body">
        <div className="card" style={{ marginBottom: 28 }}>
          <div className="card-title">Paramètres</div>
          <div className="form-grid">
            <div className="form-group">
              <label>Code LPP</label>
              <Select
                classNamePrefix="rs"
                options={lppOptions}
                value={selLpp}
                onChange={setSelLpp}
                onInputChange={setLppQuery}
                isLoading={lppLoading}
                placeholder="Rechercher par code ou libellé…"
                noOptionsMessage={() => lppQuery.length < 2 ? 'Saisissez au moins 2 caractères' : 'Aucun résultat'}
                filterOption={() => true}
                isClearable
                styles={{
                  option: (base) => ({ ...base, whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.4 }),
                  singleValue: (base) => ({ ...base, whiteSpace: 'normal', fontSize: '0.82rem' }),
                }}
              />
            </div>

            <div className="form-group">
              <label>Année</label>
              <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                {YEARS.map(y => (
                  <button key={y} onClick={() => setYear(y)} style={{
                    padding: '6px 14px',
                    border: `1px solid ${y === year ? 'var(--navy)' : 'var(--border)'}`,
                    background: y === year ? 'var(--navy)' : 'transparent',
                    color: y === year ? '#fff' : 'var(--text-secondary)',
                    borderRadius: 'var(--radius)', cursor: 'pointer',
                    fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
                    transition: 'all 0.2s',
                  }}>{y}</button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={fetchData}
            disabled={!selLpp}
            style={{
              marginTop: 20,
              padding: '10px 28px',
              background: selLpp ? 'var(--navy)' : 'var(--border)',
              color: selLpp ? '#fff' : 'var(--text-muted)',
              border: 'none', borderRadius: 'var(--radius)',
              cursor: selLpp ? 'pointer' : 'default',
              fontFamily: 'var(--font-body)', fontSize: '0.88rem',
              fontWeight: 500, transition: 'all 0.2s',
            }}
          >
            Comparer les régions →
          </button>
        </div>

        {loading && <div className="loading"><div className="spinner" /> Chargement…</div>}

        {!loading && data.length > 0 && (
          <div className="fade-in">
            <div className="card">
              <div className="card-title">
                Remboursements par région
                <span className="subtitle">{year} · ×100k€</span>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data} layout="vertical" margin={{ left: 8, right: 40, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => `${v}`}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }} />
                  <YAxis type="category" dataKey="region" width={200}
                    style={{ fontFamily: 'var(--font-body)', fontSize: 11 }} />
                  <Tooltip
                    formatter={(v) => [`${v} ×100k€`, 'Remboursement']}
                    contentStyle={{
                      fontFamily: 'var(--font-body)', fontSize: 12,
                      border: '1px solid var(--border)', borderRadius: 2,
                      background: 'var(--bg-card)',
                    }}
                  />
                  <Bar dataKey="rem" radius={[0, 2, 2, 0]}>
                    {data.map((d, i) => (
                      <Cell
                        key={i}
                        fill={i === 0 ? 'var(--amber)' : `rgba(15,45,74,${0.9 - i * 0.06})`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Part de marché */}
            <div className="card" style={{ marginTop: 24 }}>
              <div className="card-title">
                Parts de marché régionales
                <span className="subtitle">% du total remboursé</span>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Région</th>
                    <th style={{ textAlign: 'right' }}>Remb. (×100k€)</th>
                    <th style={{ textAlign: 'right' }}>Part du marché</th>
                    <th>Poids relatif</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const total = data.reduce((s, d) => s + d.rem, 0)
                    return data.map((d, i) => {
                      const pct = total > 0 ? ((d.rem / total) * 100).toFixed(1) : 0
                      const barWidth = maxVal > 0 ? (d.rem / maxVal) * 100 : 0
                      return (
                        <tr key={d.region}>
                          <td style={{ color: 'var(--text-muted)', width: 32 }}>{i + 1}</td>
                          <td className="label-cell">{d.region}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{d.rem.toFixed(2)}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--amber)' }}>{pct}%</td>
                          <td style={{ width: 160, paddingRight: 16 }}>
                            <div style={{
                              height: 6, borderRadius: 3,
                              background: `linear-gradient(90deg, var(--navy) ${barWidth}%, var(--border) ${barWidth}%)`,
                            }} />
                          </td>
                        </tr>
                      )
                    })
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && !data.length && (
          <div className="empty-state">
            <div className="icon">◉</div>
            <p>Sélectionnez un code LPP et cliquez sur "Comparer" pour visualiser la répartition régionale.</p>
          </div>
        )}
      </div>
    </div>
  )
}
