import { useState, useEffect } from 'react'
import Select from 'react-select'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid, LabelList
} from 'recharts'

const YEARS = [2020, 2021, 2022, 2023, 2024]

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


export default function Comparaison() {
  const [lppQuery, setLppQuery]     = useState('')
  const [lppOptions, setLppOptions] = useState([])
  const [selLpp, setSelLpp]         = useState(null)
  const [selRegs, setSelRegs]       = useState([])
  const [year, setYear]             = useState(2024)
  const [data, setData]             = useState([])
  const [loading, setLoading]       = useState(false)
  const [lppLoading, setLppLoading] = useState(false)
  const [unit, setUnit]             = useState('x100k') // 'eur' | 'x10k' | 'x100k'

  // Domaines
  const [domaines, setDomaines]     = useState([])
  const [selD1, setSelD1]           = useState(null)
  const [selD2, setSelD2]           = useState(null)
  const [selD4, setSelD4]           = useState(null)

  useEffect(() => {
    fetch('/api/domaines').then(r => r.json()).then(setDomaines)
  }, [])

  // Options domaine2 selon domaine1
  const d2Options = selD1
    ? (domaines.find(d => d.label === selD1.value)?.children || [])
        .map(c => ({ value: c.label, label: c.label }))
    : []

  // Options domaine4 selon domaine2
  const d4Options = selD1 && selD2
    ? (domaines.find(d => d.label === selD1.value)
        ?.children.find(c => c.label === selD2.value)
        ?.domaine4 || [])
        .filter(Boolean)
        .map(d => ({ value: d, label: d }))
    : []

  // Charger les codes LPP selon domaine OU recherche textuelle
  useEffect(() => {
    if (selD1) {
      setLppLoading(true)
      const params = new URLSearchParams()
      params.set('domaine1', selD1.value)
      if (selD2) params.set('domaine2', selD2.value)
      if (selD4) params.set('domaine4', selD4.value)
      fetch(`/api/codes-lpp-domaine?${params}`)
        .then(r => r.json())
        .then(d => { setLppOptions(d.map(x => ({ value: x.code, label: x.label }))); setLppLoading(false) })
    } else {
      const t = setTimeout(() => {
        setLppLoading(true)
        fetch(`/api/codes-lpp?q=${encodeURIComponent(lppQuery)}`)
          .then(r => r.json())
          .then(d => { setLppOptions(d.map(x => ({ value: x.code, label: x.label }))); setLppLoading(false) })
      }, 300)
      return () => clearTimeout(t)
    }
  }, [lppQuery, selD1, selD2, selD4])

  const fetchData = () => {
    if (!selLpp || selRegs.length === 0) return
    setLoading(true)

    if (selLpp.value === '__domaine__') {
      const params = new URLSearchParams({
        domaine1: selD1.value,
        year_start: year,
        year_end: year,
      })
      if (selD2) params.set('domaine2', selD2.value)
      if (selD4) params.set('domaine4', selD4.value)
      selRegs.forEach(r => params.append('regions', r.value))
      fetch(`/api/evolution-domaine?${params}`)
        .then(r => r.json())
        .then(d => {
          const bars = d
            .map(s => ({ region: s.region, rem: s.rem_x100k[0] ?? 0 }))
            .filter(s => s.rem > 0)
            .sort((a, b) => b.rem - a.rem)
          setData(bars)
          setLoading(false)
        })
    } else {
      const params = new URLSearchParams({
        code_lpp: selLpp.value,
        year_start: year,
        year_end: year,
      })
      selRegs.forEach(r => params.append('regions', r.value))
      fetch(`/api/evolution?${params}`)
        .then(r => r.json())
        .then(d => {
          const bars = d
            .map(s => ({ region: s.region, rem: s.rem_x100k[0] ?? 0 }))
            .filter(s => s.rem > 0)
            .sort((a, b) => b.rem - a.rem)
          setData(bars)
          setLoading(false)
        })
    }
  }

  const fmt = (v, decimals = 0) =>
    v.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')

  const UNIT_OPTS = [
    { id: 'eur',   label: '€',      factor: 100000, fmt: v => `${fmt(v, 0)} €` },
    { id: 'x10k',  label: '×10k€',  factor: 10,     fmt: v => fmt(v, 1) },
    { id: 'x100k', label: '×100k€', factor: 1,      fmt: v => fmt(v, 2) },
  ]
  const currentUnit = UNIT_OPTS.find(u => u.id === unit)
  const displayData = data.map(d => ({ ...d, val: d.rem * currentUnit.factor }))
  const maxVal = displayData.length ? Math.max(...displayData.map(d => d.val)) : 1
  const canQuery = selLpp && selRegs.length > 0

  const handleReset = () => {
    setSelD1(null); setSelD2(null); setSelD4(null)
    setSelLpp(null); setSelRegs([]); setData([])
  }

  return (
    <div className="fade-up">
      <div className="page-header">
        <div className="eyebrow">Comparaison régions</div>
        <h2>Position relative par région</h2>
        <p>Pour un code LPP donné, visualisez le poids de chaque région dans le remboursement national.</p>
      </div>

      <div className="page-body">
        <div className="card" style={{ marginBottom: 28 }}>

          {/* ── Titre + Réinitialiser ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>Paramètres d'analyse</div>
            <button onClick={handleReset} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', fontSize: '0.75rem',
              background: 'transparent', color: 'var(--text-muted)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              transition: 'all 0.2s',
            }}>
              ↺ Réinitialiser
            </button>
          </div>

          {/* ── Bandeau 3 étapes ── */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            overflow: 'hidden', marginBottom: 20,
          }}>
            {[
              { n: '1', title: 'Choisir un périmètre', desc: 'Filtrez par domaine pour affiner la liste, ou saisissez directement un code ou mot-clé dans "Code LPP"' },
              { n: '2', title: 'Sélectionner le code LPP', desc: 'Choisissez un code précis dans la liste, ou cliquez "Tous les codes" pour agréger tout un domaine' },
              { n: '3', title: 'Choisir les régions', desc: 'Sélectionnez une ou plusieurs régions, ou cliquez "France entière" pour couvrir tout le territoire' },
            ].map((step, i) => (
              <div key={step.n} style={{
                padding: '12px 16px',
                borderRight: i < 2 ? '1px solid var(--border)' : 'none',
                background: 'rgba(15,45,74,0.02)',
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <div style={{
                  minWidth: 22, height: 22,
                  background: 'var(--navy)', color: '#fff',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700,
                  flexShrink: 0, marginTop: 1,
                }}>{step.n}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: 3 }}>{step.title}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Filtres domaines ── */}
          <div style={{ marginBottom: 20, padding: '14px 16px', background: 'rgba(15,45,74,0.04)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
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
                  placeholder={selD1 ? 'Tous…' : "— choisir D1 d'abord"}
                />
              </div>
              <div className="form-group">
                <label>Domaine 4</label>
                <Select classNamePrefix="rs" isClearable
                  options={d4Options}
                  value={selD4}
                  isDisabled={!selD2}
                  onChange={v => { setSelD4(v); setSelLpp(null) }}
                  placeholder={selD2 ? 'Tous…' : "— choisir D2 d'abord"}
                />
              </div>
            </div>
          </div>

          {/* ── Code LPP + Région(s) côte à côte ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div className="form-group">
              <label>
                Code LPP
                <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6, fontSize: '0.68rem', fontStyle: 'italic' }}>
                  — saisissez un code ou un mot-clé
                </span>
              </label>
              <Select
                classNamePrefix="rs"
                options={lppOptions}
                value={selLpp}
                onChange={setSelLpp}
                onInputChange={setLppQuery}
                isLoading={lppLoading}
                placeholder="Ex : 1149511 ou PPC ou APNEE…"
                noOptionsMessage={() => lppQuery.length < 2 ? 'Saisissez au moins 2 caractères' : 'Aucun résultat'}
                filterOption={() => true}
                isClearable
                styles={{
                  option: (base) => ({ ...base, whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.4 }),
                  singleValue: (base) => ({ ...base, whiteSpace: 'normal', fontSize: '0.82rem' }),
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
              <Select
                classNamePrefix="rs"
                isMulti
                options={ALL_METRO_REGIONS}
                value={selRegs}
                onChange={setSelRegs}
                placeholder="Sélectionner une ou plusieurs régions…"
                noOptionsMessage={() => 'Aucune région'}
              />
              <button onClick={() => setSelRegs(ALL_METRO_REGIONS)} style={{
                marginTop: 6, width: '100%', padding: '5px 12px', fontSize: '0.75rem',
                background: 'transparent', color: 'var(--navy)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                transition: 'all 0.2s',
              }}>
                🗺 Sélectionner France entière
              </button>
            </div>
          </div>

          {/* ── Année ── */}
          <div className="form-group" style={{ marginBottom: 20 }}>
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

          <button
            onClick={fetchData}
            disabled={!canQuery}
            style={{
              padding: '10px 28px',
              background: canQuery ? 'var(--navy)' : 'var(--border)',
              color: canQuery ? '#fff' : 'var(--text-muted)',
              border: 'none', borderRadius: 'var(--radius)',
              cursor: canQuery ? 'pointer' : 'default',
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
            {/* Toggle unité */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: 4 }}>Afficher en :</span>
              {UNIT_OPTS.map(u => (
                <button key={u.id} onClick={() => setUnit(u.id)} style={{
                  padding: '5px 14px',
                  border: `1px solid ${unit === u.id ? 'var(--navy)' : 'var(--border)'}`,
                  background: unit === u.id ? 'var(--navy)' : 'transparent',
                  color: unit === u.id ? '#fff' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '0.78rem',
                  fontFamily: 'var(--font-mono)', transition: 'all 0.2s',
                }}>{u.label}</button>
              ))}
            </div>

            <div className="card">
              <div className="card-title">
                Remboursements par région
                <span className="subtitle">{year} · {currentUnit.label}</span>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={displayData} layout="vertical" margin={{ left: 8, right: 80, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => unit === 'eur' ? `${(v/1000).toFixed(0)}k` : `${v}`}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }} />
                  <YAxis type="category" dataKey="region" width={200}
                    style={{ fontFamily: 'var(--font-body)', fontSize: 11 }} />
                  <Tooltip
                    formatter={(v) => [currentUnit.fmt(v), 'Remboursement']}
                    contentStyle={{
                      fontFamily: 'var(--font-body)', fontSize: 12,
                      border: '1px solid var(--border)', borderRadius: 2,
                      background: 'var(--bg-card)',
                    }}
                  />
                  <Bar dataKey="val" radius={[0, 2, 2, 0]}>
                    {displayData.map((d, i) => (
                      <Cell
                        key={i}
                        fill={i === 0 ? 'var(--amber)' : `rgba(15,45,74,${0.9 - i * 0.06})`}
                      />
                    ))}
                    <LabelList dataKey="val" position="right"
                      formatter={v => currentUnit.fmt(v)}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--text-secondary)' }}
                    />
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
                    <th style={{ textAlign: 'right' }}>Remb. ({currentUnit.label})</th>
                    <th style={{ textAlign: 'right' }}>Part du marché</th>
                    <th>Poids relatif</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const total = displayData.reduce((s, d) => s + d.val, 0)
                    return displayData.map((d, i) => {
                      const pct = total > 0 ? ((d.val / total) * 100).toFixed(1) : 0
                      const barWidth = maxVal > 0 ? (d.val / maxVal) * 100 : 0
                      return (
                        <tr key={d.region}>
                          <td style={{ color: 'var(--text-muted)', width: 32 }}>{i + 1}</td>
                          <td className="label-cell">{d.region}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{currentUnit.fmt(d.val)}</td>
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

        {!loading && !data.length && canQuery && (
          <div className="empty-state">
            <div className="icon">◉</div>
            <p>Cliquez sur "Comparer les régions" pour visualiser la répartition régionale.</p>
          </div>
        )}
        {!loading && !data.length && !canQuery && (
          <div className="empty-state">
            <div className="icon">◉</div>
            <p>Sélectionnez un code LPP et au moins une région pour démarrer.</p>
          </div>
        )}
      </div>
    </div>
  )
}