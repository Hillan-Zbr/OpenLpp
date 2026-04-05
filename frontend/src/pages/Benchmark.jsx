import { useState, useEffect, useCallback } from 'react'
import Select from 'react-select'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, CartesianGrid, LabelList
} from 'recharts'
import * as XLSX from 'xlsx'

const exportCSV = (detail, filename) => {
  const headers = ['Année','Région','Code LPP','Libellé','Domaine 1','Domaine 2','Domaine 3','Domaine 4','QTE','REM €','BSE €']
  const rows = detail.map(r => [
    r.annee, r.ben_reg, r.code_lpp, r.l_code_lpp,
    r.domaine1 || '', r.domaine2 || '', r.domaine3 || '', r.domaine4 || '',
    r.qte, r.rem, r.bse,
  ])
  const csv = [headers, ...rows].map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename + '.csv'
  a.click()
}

const exportExcel = (detail, filename) => {
  const headers = ['Année','Région','Code LPP','Libellé','Domaine 1','Domaine 2','Domaine 3','Domaine 4','QTE','REM €','BSE €']
  const rows = detail.map(r => [
    r.annee, r.ben_reg, r.code_lpp, r.l_code_lpp,
    r.domaine1 || '', r.domaine2 || '', r.domaine3 || '', r.domaine4 || '',
    r.qte, r.rem, r.bse,
  ])
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  // Largeurs colonnes
  ws['!cols'] = [8, 8, 10, 50, 25, 35, 35, 25, 10, 14, 14].map(w => ({ wch: w }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Détail LPP')
  XLSX.writeFile(wb, filename + '.xlsx')
}

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
    <g>
      <rect
        x={x - 22} y={y - 26}
        width={44} height={18}
        rx={3} ry={3}
        fill="white"
        stroke={color}
        strokeWidth={1.5}
        opacity={0.92}
      />
      <text x={x} y={y - 13} fill={color} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: '11px', fontFamily: 'DM Mono, monospace', fontWeight: 700 }}>
        {value}
      </text>
    </g>
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
  const [detail, setDetail]         = useState([])
  const [unite, setUnite]           = useState('x100k') // 'x100k' | 'x1k' | 'eur'

  const UNITE_CONFIG = {
    x100k: { diviseur: 1,       label: '×100k€', suffix: '×100k€' },
    x1k:   { diviseur: 0.1,     label: '×1k€',   suffix: '×1k€'   },
    eur:   { diviseur: 0.00001, label: '€',       suffix: '€'      },
  }

  // Domaines
  const [domaines, setDomaines]     = useState([])
  const [selD1, setSelD1]           = useState(null)
  const [selD2, setSelD2]           = useState(null)
  const [selD4, setSelD4]           = useState(null)

  useEffect(() => {
    fetch('/api/regions').then(r => r.json()).then(d =>
      setRegions(d.map(r => ({ value: r.code, label: r.label })))
    )
    fetch('/api/domaines').then(r => r.json()).then(setDomaines)
  }, [])

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
  }, [lppQuery, selD1, selD2, selD4])

  const fetchData = useCallback(() => {
    if (!selLpp || selRegs.length === 0) return
    setLoading(true)
    setDetail([])

    const detailParams = new URLSearchParams({ year_start: yearRange[0], year_end: yearRange[1] })
    selRegs.forEach(r => detailParams.append('regions', r.value))

    if (selLpp.value === '__domaine__') {
      const params = new URLSearchParams({ domaine1: selD1.value, year_start: yearRange[0], year_end: yearRange[1] })
      if (selD2) params.set('domaine2', selD2.value)
      if (selD4) params.set('domaine4', selD4.value)
      selRegs.forEach(r => params.append('regions', r.value))

      detailParams.set('domaine1', selD1.value)
      if (selD2) detailParams.set('domaine2', selD2.value)
      if (selD4) detailParams.set('domaine4', selD4.value)

      Promise.all([
        fetch(`/api/evolution-domaine?${params}`).then(r => r.json()),
        fetch(`/api/detail?${detailParams}`).then(r => r.json()),
      ]).then(([evo, det]) => { setData(evo); setDetail(det); setLoading(false) })
    } else {
      detailParams.set('code_lpp', selLpp.value)
      const evoParams = new URLSearchParams({ code_lpp: selLpp.value, year_start: yearRange[0], year_end: yearRange[1] })
      selRegs.forEach(r => evoParams.append('regions', r.value))
      Promise.all([
        fetch(`/api/evolution?${evoParams}`).then(r => r.json()),
        fetch(`/api/detail?${detailParams}`).then(r => r.json()),
      ]).then(([evo, det]) => { setData(evo); setDetail(det); setLoading(false) })
    }
  }, [selLpp, selRegs, yearRange, selD1, selD2, selD4])

  const chartData = (() => {
    if (!data.length) return []
    const years = data[0]?.years || []
    const { diviseur } = UNITE_CONFIG[unite]
    return years.map((y, i) => {
      const point = { year: y }
      data.forEach(s => {
        if (mode === 'index') point[s.region] = s.index_base100[i]
        else if (mode === 'rem') point[s.region] = s.rem_x100k[i] != null ? +(s.rem_x100k[i] / diviseur).toFixed(2) : null
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
      </div>

      <div className="page-body">
        <div className="card" style={{ marginBottom: 28 }}>
          <div className="card-title">
            Paramètres d'analyse
            <button onClick={() => {
              setSelD1(null); setSelD2(null); setSelD4(null)
              setSelLpp(null); setSelRegs([]); setData([])
              setLppQuery(''); setYearRange([2020, 2024])
            }} style={{
              marginLeft: 'auto', padding: '4px 12px', fontSize: '0.72rem',
              background: 'transparent', color: 'var(--text-muted)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.target.style.color = 'var(--navy)'; e.target.style.borderColor = 'var(--navy)' }}
              onMouseLeave={e => { e.target.style.color = 'var(--text-muted)'; e.target.style.borderColor = 'var(--border)' }}
            >
              ↺ Réinitialiser
            </button>
          </div>

          {/* Guide 3 étapes */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
            {[
              { num: '1', title: 'Choisir un périmètre', desc: 'Filtrez par domaine pour affiner la liste, ou saisissez directement un code ou mot-clé dans "Code LPP"' },
              { num: '2', title: 'Sélectionner le code LPP', desc: 'Choisissez un code précis dans la liste, ou cliquez "Tous les codes" pour agréger tout un domaine' },
              { num: '3', title: 'Choisir les régions', desc: 'Sélectionnez une ou plusieurs régions, ou cliquez "France entière" pour couvrir tout le territoire' },
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1, padding: '12px 16px',
                background: i % 2 === 0 ? 'rgba(15,45,74,0.03)' : 'transparent',
                borderRight: i < 2 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'var(--navy)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                  }}>{s.num}</div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--navy)' }}>{s.title}</span>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5, paddingLeft: 28 }}>{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Filtres domaines */}
          <div style={{ marginBottom: 20, padding: '16px', background: 'rgba(15,45,74,0.04)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
              Filtrer par domaine <span style={{ fontStyle: 'italic', textTransform: 'none', letterSpacing: 0 }}>(optionnel — affine la liste des codes LPP)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Domaine 1</label>
                <Select classNamePrefix="rs" isClearable
                  options={domaines.map(d => ({ value: d.label, label: d.label }))}
                  value={selD1}
                  onChange={v => { setSelD1(v); setSelD2(null); setSelD4(null); setSelLpp(null) }}
                  placeholder="Tous les domaines…"
                />
              </div>
              <div className="form-group">
                <label>Domaine 2</label>
                <Select classNamePrefix="rs" isClearable
                  options={d2Options}
                  value={selD2}
                  isDisabled={!selD1}
                  onChange={v => { setSelD2(v); setSelD4(null); setSelLpp(null) }}
                  placeholder={selD1 ? 'Tous…' : '— choisir D1 d\'abord'}
                />
              </div>
              <div className="form-group">
                <label>Domaine 4</label>
                <Select classNamePrefix="rs" isClearable
                  options={d4Options}
                  value={selD4}
                  isDisabled={!selD2}
                  onChange={v => { setSelD4(v); setSelLpp(null) }}
                  placeholder={selD2 ? 'Tous…' : '— choisir D2 d\'abord'}
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
              {[{ id: 'index', label: 'Indice base 100' }, { id: 'rem', label: 'Montant' }, { id: 'yoy', label: 'Évolution annuelle %' }].map(m => (
                <button key={m.id} onClick={() => setMode(m.id)} style={{
                  padding: '5px 14px',
                  border: `1px solid ${mode === m.id ? 'var(--navy)' : 'var(--border)'}`,
                  background: mode === m.id ? 'var(--navy)' : 'transparent',
                  color: mode === m.id ? '#fff' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '0.78rem',
                  fontFamily: 'var(--font-body)', transition: 'all 0.2s',
                }}>{m.label}</button>
              ))}
              {/* Sélecteur unité — visible uniquement en mode montant */}
              {mode === 'rem' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8, padding: '4px 8px', background: 'rgba(15,45,74,0.05)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Unité :</span>
                  {Object.entries(UNITE_CONFIG).map(([key, cfg]) => (
                    <button key={key} onClick={() => setUnite(key)} style={{
                      padding: '3px 10px', fontSize: '0.72rem',
                      border: `1px solid ${unite === key ? 'var(--amber)' : 'var(--border)'}`,
                      background: unite === key ? 'var(--amber)' : 'transparent',
                      color: unite === key ? '#fff' : 'var(--text-secondary)',
                      borderRadius: 'var(--radius)', cursor: 'pointer',
                      fontFamily: 'var(--font-mono)', transition: 'all 0.2s',
                    }}>{cfg.label}</button>
                  ))}
                </div>
              )}
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
                {mode === 'rem'   && <>Remboursements <span className="subtitle">en {UNITE_CONFIG[unite].suffix}</span></>}
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
                  <YAxis tickFormatter={v => mode === 'index' ? v : mode === 'yoy' ? `${v}%` : `${v}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }} />
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
            {/* Tableau détail */}
            {detail.length > 0 && (
              <div className="card" style={{ marginTop: 24 }}>
                <div className="card-title">
                  Tableau détail
                  <span className="subtitle">{detail.length} lignes{detail.length === 2000 ? ' (limite 2000)' : ''}</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <button onClick={() => exportCSV(detail, `openlpp_detail_${selLpp?.value}`)} style={{
                      padding: '4px 12px', fontSize: '0.72rem',
                      background: 'transparent', color: 'var(--navy)',
                      border: '1px solid var(--navy)', borderRadius: 'var(--radius)',
                      cursor: 'pointer', fontFamily: 'var(--font-body)',
                    }}>⬇ CSV</button>
                    <button onClick={() => exportExcel(detail, `openlpp_detail_${selLpp?.value}`)} style={{
                      padding: '4px 12px', fontSize: '0.72rem',
                      background: 'var(--navy)', color: '#fff',
                      border: '1px solid var(--navy)', borderRadius: 'var(--radius)',
                      cursor: 'pointer', fontFamily: 'var(--font-body)',
                    }}>⬇ Excel</button>
                  </div>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
                  <strong>QTE</strong> — Quantité remboursée &nbsp;·&nbsp;
                  <strong>REM</strong> — Montant remboursé (€) &nbsp;·&nbsp;
                  <strong>BSE</strong> — Base de remboursement (€)
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Année</th>
                        <th>Région</th>
                        <th>Code LPP</th>
                        <th>Libellé</th>
                        <th>Domaine 1</th>
                        <th>Domaine 2</th>
                        <th>Domaine 3</th>
                        <th>Domaine 4</th>
                        <th style={{ textAlign: 'right' }}>QTE</th>
                        <th style={{ textAlign: 'right' }}>REM €</th>
                        <th style={{ textAlign: 'right' }}>BSE €</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.map((r, i) => (
                        <tr key={i}>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{r.annee}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{r.ben_reg}</td>
                          <td><span className="badge">{r.code_lpp}</span></td>
                          <td className="label-cell" title={r.l_code_lpp}>{r.l_code_lpp}</td>
                          <td className="label-cell">{r.domaine1 || '—'}</td>
                          <td className="label-cell">{r.domaine2 || '—'}</td>
                          <td className="label-cell">{r.domaine3 || '—'}</td>
                          <td className="label-cell">{r.domaine4 || '—'}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{r.qte?.toLocaleString('fr-FR')}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{r.rem?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{r.bse?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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