import { useState, useEffect, useCallback } from 'react'
import Select from 'react-select'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, CartesianGrid, LabelList
} from 'recharts'

const REGION_COLORS = [
  '#0f2d4a','#c9822a','#1a6b4a','#8b1a6b','#1a4a8b',
  '#6b4a1a','#1a6b6b','#4a1a6b','#6b1a1a','#2a6b1a',
]

const ALL_METRO_REGIONS = [
  { value: 11, label: 'Île-de-France' },
  { value: 24, label: 'Centre-Val de Loire' },
  { value: 27, label: 'Bourgogne-Franche-Comté' },
  { value: 28, label: 'Normandie' },
  { value: 32, label: 'Hauts-de-France' },
  { value: 44, label: 'Grand Est' },
  { value: 52, label: 'Pays de la Loire' },
  { value: 53, label: 'Bretagne' },
  { value: 75, label: 'Nouvelle-Aquitaine' },
  { value: 76, label: 'Occitanie' },
  { value: 84, label: 'Auvergne-Rhône-Alpes' },
  { value: 93, label: 'PACA' },
]

function YearRangeSlider({ min, max, value, onChange }) {
  const [start, end] = value
  const pctStart = ((start - min) / (max - min)) * 100
  const pctEnd   = ((end   - min) / (max - min)) * 100
  const years = []
  for (let y = min; y <= max; y++) years.push(y)
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
        <input type="range" min={min} max={max} value={start}
          onChange={e => { const v = +e.target.value; if (v < end) onChange([v, end]) }}
          style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', zIndex: 2 }}
        />
        <input type="range" min={min} max={max} value={end}
          onChange={e => { const v = +e.target.value; if (v > start) onChange([start, v]) }}
          style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', zIndex: 3 }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        {years.map(y => <span key={y}>{y}</span>)}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 2, padding: '12px 16px', fontFamily: 'var(--font-body)', fontSize: 12, boxShadow: 'var(--shadow-md)', minWidth: 200 }}>
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

const CustomLabel = ({ x, y, value, color }) => {
  if (value == null) return null
  return (
    <text x={x} y={y - 10} fill={color} textAnchor="middle"
      style={{ fontSize: '9px', fontFamily: 'DM Mono, monospace', fontWeight: 600 }}>
      {value}
    </text>
  )
}

export default function Benchmark() {
  const [regions, setRegions]       = useState([])
  const [selRegs, setSelRegs]       = useState([])
  const [lppQuery, setLppQuery]     = useState('')
  const [lppOptions, setLppOptions] = useState([])
  const [selLpp, setSelLpp]         = useState(null)
  const [yearRange, setYearRange]   = useState([2020, 2024])
  const [data, setData]             = useState([])
  const [loading, setLoading]       = useState(false)
  const [lppLoading, setLppLoading] = useState(false)
  const [mode, setMode]             = useState('index')
  const [showLabels, setShowLabels] = useState(false)

  useEffect(() => {
    fetch('/api/regions').then(r => r.json()).then(d =>
      setRegions(d.map(r => ({ value: r.code, label: r.label })))
    )
  }, [])

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
    const params = new URLSearchParams({ code_lpp: selLpp.value, year_start: yearRange[0], year_end: yearRange[1] })
    selRegs.forEach(r => params.append('regions', r.value))
    fetch(`/api/evolution?${params}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [selLpp, selRegs, yearRange])

  const chartData = (() => {
    if (!data.length) return []
    const years = data[0]?.years || []
    return years.map((y, i) => {
      const point = { year: y }
      data.forEach(s => {
        if (mode === 'index') point[s.region] = s.index_base100[i]
        else if (mode === 'rem') point[s.region] = s.rem_x100k[i]
        else if (mode === 'yoy') point[s.region] = s.yoy_pct[i]
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
        <div className="card" style={{ marginBottom: 28 }}>
          <div className="card-title">Paramètres d'analyse</div>
          <div className="form-grid">
            <div className="form-group">
              <label>
                Code LPP
                <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6, fontSize: '0.68rem', fontStyle: 'italic' }}>
                  — saisissez un code ou un mot-clé
                </span>
              </label>
              <Select classNamePrefix="rs" options={lppOptions} value={selLpp} onChange={setSelLpp}
                onInputChange={setLppQuery} isLoading={lppLoading}
                placeholder="Ex : 1149511 ou PPC ou APNEE…"
                noOptionsMessage={() => lppQuery.length < 2 ? 'Saisissez au moins 2 caractères' : 'Aucun résultat'}
                filterOption={() => true} isClearable
                styles={{
                  option: (b) => ({ ...b, whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.4 }),
                  singleValue: (b) => ({ ...b, whiteSpace: 'normal', fontSize: '0.82rem' }),
                }}
              />
            </div>
            <div className="form-group">
              <label>
                Région(s)
                <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6, fontSize: '0.68rem', fontStyle: 'italic' }}>
                  — sélection multiple possible
                </span>
              </label>
              <Select classNamePrefix="rs" isMulti
                options={regions.filter(r => r.value !== 99)}
                value={selRegs} onChange={setSelRegs}
                placeholder="Sélectionner une ou plusieurs régions…"
                noOptionsMessage={() => 'Aucune région'}
              />
              <button onClick={() => setSelRegs(ALL_METRO_REGIONS)} style={{
                marginTop: 6, padding: '4px 12px', fontSize: '0.72rem',
                background: 'transparent', color: 'var(--navy)',
                border: '1px solid var(--navy)', borderRadius: 'var(--radius)',
                cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}>
                🗺 Sélectionner France entière
              </button>
            </div>
            </div>
          <div className="form-group" style={{ maxWidth: 420 }}>
            <label>Plage d'années</label>
            <YearRangeSlider min={2020} max={2024} value={yearRange} onChange={setYearRange} />
          </div>
          <button onClick={fetchData} disabled={!canQuery} style={{
            marginTop: 24, padding: '10px 28px',
            background: canQuery ? 'var(--navy)' : 'var(--border)',
            color: canQuery ? '#fff' : 'var(--text-muted)',
            border: 'none', borderRadius: 'var(--radius)', cursor: canQuery ? 'pointer' : 'default',
            fontFamily: 'var(--font-body)', fontSize: '0.88rem', fontWeight: 500, transition: 'all 0.2s',
          }}>
            Analyser le marché →
          </button>
        </div>

        {loading && <div className="loading"><div className="spinner" /> Analyse en cours…</div>}

        {!loading && data.length > 0 && (
          <div className="fade-in">
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: 8 }}>Afficher :</span>
              {[{ id: 'index', label: 'Indice base 100' }, { id: 'rem', label: 'Montant (×100k€)' }, { id: 'yoy', label: 'Évolution annuelle %' }].map(m => (
                <button key={m.id} onClick={() => setMode(m.id)} style={{
                  padding: '5px 14px',
                  border: `1px solid ${mode === m.id ? 'var(--navy)' : 'var(--border)'}`,
                  background: mode === m.id ? 'var(--navy)' : 'transparent',
                  color: mode === m.id ? '#fff' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '0.78rem',
                  fontFamily: 'var(--font-body)', transition: 'all 0.2s',
                }}>{m.label}</button>
              ))}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 12, cursor: 'pointer', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={showLabels} onChange={e => setShowLabels(e.target.checked)}
                  style={{ accentColor: 'var(--navy)', cursor: 'pointer' }}
                />
                Afficher les valeurs sur les points
              </label>
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
              <ResponsiveContainer width="100%" height={showLabels ? 400 : 360}>
                <LineChart data={chartData} margin={{ top: showLabels ? 24 : 8, right: 24, bottom: 8, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="year" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }} />
                  <YAxis tickFormatter={v => mode === 'index' ? v : mode === 'yoy' ? `${v}%` : v} style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }} />
                  {mode === 'index' && <ReferenceLine y={100} stroke="var(--amber)" strokeDasharray="6 3" strokeWidth={1.5} label={{ value: 'Base 100', position: 'right', fontSize: 10, fill: 'var(--amber)' }} />}
                  {mode === 'yoy'   && <ReferenceLine y={0} stroke="var(--border-strong)" strokeDasharray="3 3" />}
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} />
                  {data.map((s, i) => {
                    const color = REGION_COLORS[i % REGION_COLORS.length]
                    return (
                      <Line key={s.region} type="monotone" dataKey={s.region}
                        stroke={color} strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls={false}
                      >
                        {showLabels && (
                          <LabelList
                            dataKey={s.region}
                            content={({ x, y, value }) => <CustomLabel x={x} y={y} value={value} color={color} />}
                          />
                        )}
                      </Line>
                    )
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card" style={{ marginTop: 24 }}>
              <div className="card-title">
                Tableau récapitulatif
                <span className="subtitle">{selLpp?.label?.split('—')[0]?.trim()}</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th rowSpan={2} style={{ verticalAlign: 'bottom', minWidth: 160 }}>Région</th>
                      {data[0]?.years.map(y => (
                        <th key={y} colSpan={2} style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>{y}</th>
                      ))}
                      <th rowSpan={2} style={{ textAlign: 'right', verticalAlign: 'bottom' }}>Évol. totale</th>
                    </tr>
                    <tr>
                      {data[0]?.years.flatMap(y => [
                        <th key={`${y}-rem`} style={{ textAlign: 'right', fontSize: '0.62rem', color: 'var(--text-muted)', paddingTop: 2 }}>×100k€</th>,
                        <th key={`${y}-pct`} style={{ textAlign: 'right', fontSize: '0.62rem', color: 'var(--text-muted)', paddingTop: 2 }}>vs N-1</th>,
                      ])}
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
                          {s.rem_x100k.flatMap((v, i) => {
                            const prev = s.rem_x100k[i - 1]
                            const pct = i > 0 && v != null && prev != null && prev > 0
                              ? (((v - prev) / prev) * 100).toFixed(1) : null
                            return [
                              <td key={`${i}-rem`} style={{ textAlign: 'right' }}>
                                {v != null ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{v.toFixed(2)}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                              </td>,
                              <td key={`${i}-pct`} style={{ textAlign: 'right', minWidth: 64 }}>
                                {pct != null
                                  ? <span className={+pct > 0 ? 'pct-positive' : +pct < 0 ? 'pct-negative' : 'pct-neutral'}>{+pct > 0 ? '+' : ''}{pct}%</span>
                                  : <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>}
                              </td>,
                            ]
                          })}
                          <td style={{ textAlign: 'right' }}>
                            {totalEvol != null
                              ? <span className={+totalEvol > 0 ? 'pct-positive' : 'pct-negative'} style={{ fontWeight: 600 }}>{+totalEvol > 0 ? '+' : ''}{totalEvol}%</span>
                              : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!loading && !data.length && canQuery && (
          <div className="empty-state"><div className="icon">◎</div><p>Cliquez sur "Analyser le marché" pour afficher les résultats.</p></div>
        )}
        {!loading && !data.length && !canQuery && (
          <div className="empty-state"><div className="icon">◈</div><p>Sélectionnez un code LPP et au moins une région pour démarrer.</p></div>
        )}
      </div>
    </div>
  )
}