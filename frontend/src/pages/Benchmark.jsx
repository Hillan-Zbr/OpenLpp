import { useState, useEffect, useCallback } from 'react'
import Select from 'react-select'
import { rsComponents } from '../selectComponents.jsx'
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
  const [source, setSource]         = useState('ref')

  // Domaines
  const [domaines, setDomaines]     = useState([])
  const [selD1, setSelD1]           = useState(null)
  const [selD2, setSelD2]           = useState(null)
  const [selD4, setSelD4]           = useState(null)

  const domLabel1 = source === 'orig' ? 'Titre (L_titre)' : 'Domaine 1'
  const domLabel2 = source === 'orig' ? 'Sous-classe 1 (L_SC1)' : 'Domaine 2'
  const domLabel4 = source === 'orig' ? 'Sous-classe 2 (L_SC2)' : 'Domaine 4'

  useEffect(() => {
    fetch('/api/regions').then(r => r.json()).then(d =>
      setRegions(d.map(r => ({ value: r.code, label: r.label })))
    )
    fetch(`/api/domaines?source=${source}`).then(r => r.json()).then(setDomaines)
  }, [source])

  // Options domaine2 selon domaine1 sélectionné
  const d2Options = selD1
    ? (domaines.find(d => d.label === selD1.value)?.children || [])
        .map(c => ({ value: c.label, label: c.label }))
    : []

  // Options domaine4 selon domaine2 sélectionné
  const d4Options = selD1 && selD2
    ? (domaines.find(d => d.label === selD1.value)
        ?.children.find(c => c.label === selD2.value)
        ?.domaine4 || [])
        .filter(Boolean)
        .map(d => ({ value: d, label: d }))
    : []

  // Charger les codes LPP selon domaine sélectionné OU recherche textuelle
  useEffect(() => {
    if (selD1) {
      // Filtre par domaine
      setLppLoading(true)
      const params = new URLSearchParams()
      params.set('domaine1', selD1.value)
      if (selD2) params.set('domaine2', selD2.value)
      if (selD4) params.set('domaine4', selD4.value)
      params.set('source', source)
      fetch(`/api/codes-lpp-domaine?${params}`)
        .then(r => r.json())
        .then(d => { setLppOptions(d.map(x => ({ value: x.code, label: x.label }))); setLppLoading(false) })
    } else {
      // Recherche textuelle
      const t = setTimeout(() => {
        setLppLoading(true)
        fetch(`/api/codes-lpp?q=${encodeURIComponent(lppQuery)}`)
          .then(r => r.json())
          .then(d => { setLppOptions(d.map(x => ({ value: x.code, label: x.label }))); setLppLoading(false) })
      }, 300)
      return () => clearTimeout(t)
    }
  }, [lppQuery, selD1, selD2, selD4, source])

  const fetchData = useCallback(() => {
    if (!selLpp || selRegs.length === 0) return
    setLoading(true)

    if (selLpp.value === '__domaine__') {
      // Mode agrégation domaine
      const params = new URLSearchParams({
        domaine1: selD1.value,
        year_start: yearRange[0],
        year_end: yearRange[1],
        source: source,
      })
      if (selD2) params.set('domaine2', selD2.value)
      if (selD4) params.set('domaine4', selD4.value)
      selRegs.forEach(r => params.append('regions', r.value))
      fetch(`/api/evolution-domaine?${params}`)
        .then(r => r.json())
        .then(d => { setData(d); setLoading(false) })
    } else {
      // Mode code LPP individuel
      const params = new URLSearchParams({ code_lpp: selLpp.value, year_start: yearRange[0], year_end: yearRange[1] })
      selRegs.forEach(r => params.append('regions', r.value))
      fetch(`/api/evolution?${params}`)
        .then(r => r.json())
        .then(d => { setData(d); setLoading(false) })
    }
  }, [selLpp, selRegs, yearRange, selD1, selD2, selD4, source])

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

  // Somme des REM : par année (toutes régions) + grand total
  const totalStats = (() => {
    if (!data.length) return null
    const years = data[0]?.years || []
    const perYear = years.map((_, i) => {
      const sum = data.reduce((acc, s) => {
        const v = s.rem_x100k[i]
        return v != null ? acc + v : acc
      }, 0)
      return sum > 0 ? sum : null
    })
    const grandTotal = perYear.reduce((acc, v) => v != null ? acc + v : acc, 0)
    return { perYear, grandTotal }
  })()

  // Formatage français avec espace insécable
  const fmtFR = (v, dec = 2) =>
    v == null ? '—' : v.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec })

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

          {/* Filtres domaines */}
          <div style={{ marginBottom: 20, padding: '16px', background: 'rgba(15,45,74,0.04)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
              Filtrer par domaine <span style={{ fontStyle: 'italic', textTransform: 'none', letterSpacing: 0 }}>(optionnel — affine la liste des codes LPP)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>{domLabel1}</label>
                <Select classNamePrefix="rs" components={rsComponents} isClearable
                  options={domaines.map(d => ({ value: d.label, label: d.label }))}
                  value={selD1}
                  onChange={v => { setSelD1(v); setSelD2(null); setSelD4(null); setSelLpp(null) }}
                  placeholder="Tous…"
                />
              </div>
              <div className="form-group">
                <label>{domLabel2}</label>
                <Select classNamePrefix="rs" components={rsComponents} isClearable
                  options={d2Options}
                  value={selD2}
                  isDisabled={!selD1}
                  onChange={v => { setSelD2(v); setSelD4(null); setSelLpp(null) }}
                  placeholder={selD1 ? 'Tous…' : `— choisir ${domLabel1} d'abord`}
                />
              </div>
              <div className="form-group">
                <label>{domLabel4}</label>
                <Select classNamePrefix="rs" components={rsComponents} isClearable
                  options={d4Options}
                  value={selD4}
                  isDisabled={!selD2}
                  onChange={v => { setSelD4(v); setSelLpp(null) }}
                  placeholder={selD2 ? 'Tous…' : `— choisir ${domLabel2} d'abord`}
                />
              </div>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>
                Code LPP
                <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6, fontSize: '0.68rem', fontStyle: 'italic' }}>
                  — saisissez un code ou un mot-clé
                </span>
              </label>
              <Select classNamePrefix="rs" components={rsComponents} options={lppOptions} value={selLpp} onChange={setSelLpp}
                onInputChange={setLppQuery} isLoading={lppLoading}
                placeholder="Ex : 1149511 ou PPC ou APNEE…"
                noOptionsMessage={() => lppQuery.length < 2 ? 'Saisissez au moins 2 caractères' : 'Aucun résultat'}
                filterOption={() => true} isClearable
                styles={{
                  option: (b) => ({ ...b, whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.4 }),
                  singleValue: (b) => ({ ...b, whiteSpace: 'normal', fontSize: '0.82rem' }),
                }}
              />
              {selD1 && lppOptions.length > 0 && (
                <button onClick={() => setSelLpp({ value: '__domaine__', label: `Tous les codes — ${selD2?.value || selD1?.value}` })} style={{
                  marginTop: 6, padding: '4px 12px', fontSize: '0.72rem',
                  background: 'transparent', color: 'var(--navy)',
                  border: '1px solid var(--navy)', borderRadius: 'var(--radius)',
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}>
                  📋 Sélectionner tous les codes ({lppOptions.length})
                </button>
              )}
            </div>
            <div className="form-group">
              <label>Classification</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setSource('ref'); setSelD1(null); setSelD2(null); setSelD4(null) }} style={{
                  padding: '6px 14px',
                  border: `1px solid ${source === 'ref' ? 'var(--navy)' : 'var(--border)'}`,
                  background: source === 'ref' ? 'var(--navy)' : 'transparent',
                  color: source === 'ref' ? '#fff' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.82rem',
                  transition: 'all 0.2s',
                }}>📋 Référence</button>
                <button onClick={() => { setSource('orig'); setSelD1(null); setSelD2(null); setSelD4(null) }} style={{
                  padding: '6px 14px',
                  border: `1px solid ${source === 'orig' ? 'var(--navy)' : 'var(--border)'}`,
                  background: source === 'orig' ? 'var(--navy)' : 'transparent',
                  color: source === 'orig' ? '#fff' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.82rem',
                  transition: 'all 0.2s',
                }}>📊 Originale</button>
              </div>
            </div>
            <div className="form-group">
              <label>
                Région(s)
                <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6, fontSize: '0.68rem', fontStyle: 'italic' }}>
                  — sélection multiple possible
                </span>
              </label>
              <Select classNamePrefix="rs" components={rsComponents} isMulti
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

            {/* ── KPI : total REM ── */}
            {totalStats && (
              <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, var(--navy) 0%, #1a4a8b 100%)', color: '#fff', border: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7, marginBottom: 6 }}>
                      Total remboursements — sélection
                    </div>
                    <div style={{ fontSize: '2rem', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '-0.02em' }}>
                      {fmtFR(totalStats.grandTotal / 10, 1)}&nbsp;<span style={{ fontSize: '1rem', fontWeight: 400, opacity: 0.85 }}>M€</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.65, marginTop: 6 }}>
                      {selLpp?.label?.split('—')[0]?.trim()} · {selRegs.map(r => r.label).join(', ')} · {yearRange[0]}–{yearRange[1]}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                    <div style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 4 }}>Par année</div>
                    {(data[0]?.years || []).map((y, i) => (
                      <div key={y} style={{ display: 'flex', gap: 16, fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                        <span style={{ opacity: 0.65, minWidth: 36 }}>{y}</span>
                        <span style={{ fontWeight: 600 }}>
                          {totalStats.perYear[i] != null ? `${fmtFR(totalStats.perYear[i] / 10, 1)} M€` : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

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
                    {/* Ligne TOTAL */}
                    {totalStats && (() => {
                      const firstNonNull = totalStats.perYear.find(v => v != null && v > 0)
                      const lastNonNull  = [...totalStats.perYear].reverse().find(v => v != null)
                      const totalEvol = firstNonNull && lastNonNull
                        ? (((lastNonNull - firstNonNull) / firstNonNull) * 100).toFixed(1)
                        : null
                      return (
                        <tr style={{ borderTop: '2px solid var(--navy)', background: 'rgba(15,45,74,0.04)', fontWeight: 600 }}>
                          <td className="label-cell" style={{ color: 'var(--navy)' }}>TOTAL</td>
                          {totalStats.perYear.flatMap((v, i) => {
                            const prev = totalStats.perYear[i - 1]
                            const pct = i > 0 && v != null && prev != null && prev > 0
                              ? (((v - prev) / prev) * 100).toFixed(1) : null
                            return [
                              <td key={`tot-${i}-rem`} style={{ textAlign: 'right' }}>
                                {v != null
                                  ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--navy)' }}>{fmtFR(v, 2)}</span>
                                  : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                              </td>,
                              <td key={`tot-${i}-pct`} style={{ textAlign: 'right', minWidth: 64 }}>
                                {pct != null
                                  ? <span className={+pct > 0 ? 'pct-positive' : +pct < 0 ? 'pct-negative' : 'pct-neutral'}>{+pct > 0 ? '+' : ''}{pct}%</span>
                                  : <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>}
                              </td>,
                            ]
                          })}
                          <td style={{ textAlign: 'right' }}>
                            {totalEvol != null
                              ? <span className={+totalEvol > 0 ? 'pct-positive' : 'pct-negative'} style={{ fontWeight: 700 }}>{+totalEvol > 0 ? '+' : ''}{totalEvol}%</span>
                              : '—'}
                          </td>
                        </tr>
                      )
                    })()}
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