import { useState, useEffect, useCallback } from 'react'
import Select from 'react-select'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, CartesianGrid
} from 'recharts'

const REGION_COLORS = [
  '#0f2d4a','#c9822a','#1a6b4a','#8b1a6b','#1a4a8b',
  '#6b4a1a','#1a6b6b','#4a1a6b','#6b1a1a','#2a6b1a',
]

const fmtM = (v) => v == null ? '—' : `${(v).toFixed(2)} ×100k€`
const fmtPct = (v) => v == null ? '—' : `${v > 0 ? '+' : ''}${v}%`

function YearRangeSlider({ min, max, value, onChange }) {
  const [start, end] = value
  const pctStart = ((start - min) / (max - min)) * 100
  const pctEnd   = ((end   - min) / (max - min)) * 100

  return (
    <div className="year-range-wrapper">
      <div className="year-display">
        <span>{start}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>→</span>
        <span>{end}</span>
      </div>
      <div style={{ position: 'relative', padding: '12px 0' }}>
        <div className="range-track">
          <div className="range-fill" style={{ left: `${pctStart}%`, width: `${pctEnd - pctStart}%` }} />
        </div>
        {/* Start thumb */}
        <input type="range" min={min} max={max} value={start}
          onChange={e => { const v = +e.target.value; if (v < end) onChange([v, end]) }}
          style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', zIndex: 2 }}
        />
        {/* End thumb */}
        <input type="range" min={min} max={max} value={end}
          onChange={e => { const v = +e.target.value; if (v > start) onChange([start, v]) }}
          style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', zIndex: 3 }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        {[2020,2021,2022,2023,2024,2025].map(y => <span key={y}>{y}</span>)}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 2, padding: '12px 16px', fontFamily: 'var(--font-body)', fontSize: 12,
      boxShadow: 'var(--shadow-md)', minWidth: 200,
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, marginBottom: 8, color: 'var(--navy)' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, color: p.color, marginBottom: 3 }}>
          <span>{p.name}</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{p.value != null ? p.value : '—'}</span>
        </div>
      ))}
    </div>
  )
}

export default function Benchmark() {
  const [regions, setRegions]   = useState([])
  const [selRegs, setSelRegs]   = useState([])
  const [lppQuery, setLppQuery] = useState('')
  const [lppOptions, setLppOptions] = useState([])
  const [selLpp, setSelLpp]     = useState(null)
  const [yearRange, setYearRange] = useState([2020, 2025])
  const [data, setData]         = useState([])
  const [loading, setLoading]   = useState(false)
  const [lppLoading, setLppLoading] = useState(false)
  const [mode, setMode]         = useState('index') // 'index' | 'rem' | 'yoy'

  useEffect(() => {
    fetch('/api/regions').then(r => r.json()).then(d =>
      setRegions(d.map(r => ({ value: r.code, label: r.label })))
    )
  }, [])

  // Debounced LPP search
  useEffect(() => {
    const t = setTimeout(() => {
      setLppLoading(true)
      fetch(`/api/codes-lpp?q=${encodeURIComponent(lppQuery)}`)
        .then(r => r.json())
        .then(d => { setLppOptions(d.map(x => ({ value: x.code, label: x.label }))); setLppLoading(false) })
    }, 300)
    return () => clearTimeout(t)
  }, [lppQuery])

  const fetchData = useCallback(() => {
    if (!selLpp || selRegs.length === 0) return
    setLoading(true)
    const params = new URLSearchParams({
      code_lpp: selLpp.value,
      year_start: yearRange[0],
      year_end: yearRange[1],
    })
    selRegs.forEach(r => params.append('regions', r.value))
    fetch(`/api/evolution?${params}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [selLpp, selRegs, yearRange])

  // Build chart data (pivoted by year)
  const chartData = (() => {
    if (!data.length) return []
    const years = data[0]?.years || []
    return years.map((y, i) => {
      const point = { year: y }
      data.forEach(series => {
        const key = series.region
        if (mode === 'index') point[key] = series.index_base100[i]
        else if (mode === 'rem') point[key] = series.rem_x100k[i]
        else if (mode === 'yoy') point[key] = series.yoy_pct[i]
      })
      return point
    })
  })()

  const canQuery = selLpp && selRegs.length > 0

  return (
    <div className="fade-up">
      <div className="page-header">
        <div className="eyebrow">Benchmark marché</div>
        <h2>Évolution du marché de référence</h2>
        <p>Comparez l'évolution des remboursements sur vos régions cibles — votre repère pour situer votre propre trajectoire.</p>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div className="card" style={{ marginBottom: 28 }}>
          <div className="card-title">Paramètres d'analyse</div>
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
              <label>Région(s)</label>
              <Select
                classNamePrefix="rs"
                isMulti
                options={regions}
                value={selRegs}
                onChange={setSelRegs}
                placeholder="Sélectionner une ou plusieurs régions…"
                noOptionsMessage={() => 'Aucune région'}
              />
            </div>
          </div>

          <div className="form-group" style={{ maxWidth: 420 }}>
            <label>Plage d'années</label>
            <YearRangeSlider min={2020} max={2025} value={yearRange} onChange={setYearRange} />
          </div>

          <button
            onClick={fetchData}
            disabled={!canQuery}
            style={{
              marginTop: 24,
              padding: '10px 28px',
              background: canQuery ? 'var(--navy)' : 'var(--border)',
              color: canQuery ? '#fff' : 'var(--text-muted)',
              border: 'none', borderRadius: 'var(--radius)',
              cursor: canQuery ? 'pointer' : 'default',
              fontFamily: 'var(--font-body)', fontSize: '0.88rem',
              fontWeight: 500, transition: 'all 0.2s',
            }}
          >
            Analyser le marché →
          </button>
        </div>

        {/* Results */}
        {loading && <div className="loading"><div className="spinner" /> Analyse en cours…</div>}

        {!loading && data.length > 0 && (
          <div className="fade-in">
            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: 8 }}>Afficher :</span>
              {[
                { id: 'index', label: 'Indice base 100' },
                { id: 'rem',   label: 'Montant (×100k€)' },
                { id: 'yoy',   label: 'Évolution annuelle %' },
              ].map(m => (
                <button key={m.id} onClick={() => setMode(m.id)} style={{
                  padding: '5px 14px',
                  border: `1px solid ${mode === m.id ? 'var(--navy)' : 'var(--border)'}`,
                  background: mode === m.id ? 'var(--navy)' : 'transparent',
                  color: mode === m.id ? '#fff' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius)', cursor: 'pointer',
                  fontSize: '0.78rem', fontFamily: 'var(--font-body)',
                  transition: 'all 0.2s',
                }}>{m.label}</button>
              ))}
            </div>

            <div className="card">
              <div className="card-title">
                {mode === 'index' && <>Indice de progression <span className="subtitle">base 100 = première année sélectionnée</span></>}
                {mode === 'rem'   && <>Remboursements <span className="subtitle">en ×100k€</span></>}
                {mode === 'yoy'   && <>Évolution annuelle <span className="subtitle">en %</span></>}
              </div>

              {mode === 'index' && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
                  💡 <strong>Comment lire ce graphique :</strong> si votre CA est au-dessus de la courbe marché, vous progressez plus vite que le remboursement de référence.
                </p>
              )}

              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={chartData} margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="year" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }} />
                  <YAxis
                    tickFormatter={v => mode === 'index' ? v : mode === 'yoy' ? `${v}%` : v}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
                  />
                  {mode === 'index' && <ReferenceLine y={100} stroke="var(--amber)" strokeDasharray="6 3" strokeWidth={1.5} label={{ value: 'Base 100', position: 'right', fontSize: 10, fill: 'var(--amber)' }} />}
                  {mode === 'yoy'   && <ReferenceLine y={0} stroke="var(--border-strong)" strokeDasharray="3 3" />}
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} />
                  {data.map((s, i) => (
                    <Line
                      key={s.region}
                      type="monotone"
                      dataKey={s.region}
                      stroke={REGION_COLORS[i % REGION_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                      connectNulls={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Summary table */}
            <div className="card" style={{ marginTop: 24 }}>
              <div className="card-title">
                Tableau récapitulatif
                <span className="subtitle">{selLpp?.label?.split('—')[0]?.trim()}</span>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Région</th>
                    {data[0]?.years.map(y => <th key={y} style={{ textAlign: 'right' }}>{y}</th>)}
                    <th style={{ textAlign: 'right' }}>Évol. totale</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(s => {
                    const first = s.rem_x100k.find(v => v != null && v > 0)
                    const last  = [...s.rem_x100k].reverse().find(v => v != null)
                    const totalEvol = first && last ? (((last - first) / first) * 100).toFixed(1) : null
                    return (
                      <tr key={s.region}>
                        <td className="label-cell">{s.region}</td>
                        {s.rem_x100k.map((v, i) => (
                          <td key={i} style={{ textAlign: 'right' }}>
                            {v != null ? `${v.toFixed(2)}` : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </td>
                        ))}
                        <td style={{ textAlign: 'right' }}>
                          {totalEvol != null ? (
                            <span className={+totalEvol > 0 ? 'pct-positive' : 'pct-negative'}>
                              {+totalEvol > 0 ? '+' : ''}{totalEvol}%
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && !data.length && canQuery && (
          <div className="empty-state">
            <div className="icon">◎</div>
            <p>Cliquez sur "Analyser le marché" pour afficher les résultats.</p>
          </div>
        )}

        {!loading && !data.length && !canQuery && (
          <div className="empty-state">
            <div className="icon">◈</div>
            <p>Sélectionnez un code LPP et au moins une région pour démarrer.</p>
          </div>
        )}
      </div>
    </div>
  )
}
