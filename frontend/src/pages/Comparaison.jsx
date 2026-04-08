import { useState, useEffect, useRef, useCallback } from 'react'
import Select from 'react-select'
import { VectorMap } from '@react-jvectormap/core'
import { frMill } from '@react-jvectormap/france'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid, LabelList
} from 'recharts'

const YEARS = [2020, 2021, 2022, 2023, 2024]
const ALL_REGIONS = [11, 24, 27, 28, 32, 44, 52, 53, 75, 76, 84, 93]

// Correspondance BEN_REG → codes départements jvectormap (tous les depts de la région)
const BEN_TO_JV = {
  11: ['FR-75','FR-77','FR-78','FR-91','FR-92','FR-93','FR-94','FR-95'], // Île-de-France
  24: ['FR-18','FR-28','FR-36','FR-37','FR-41','FR-45'], // Centre-Val de Loire
  27: ['FR-21','FR-25','FR-39','FR-58','FR-70','FR-71','FR-89','FR-90'], // Bourgogne-Franche-Comté
  28: ['FR-14','FR-27','FR-50','FR-61','FR-76'], // Normandie
  32: ['FR-02','FR-59','FR-60','FR-62','FR-80'], // Hauts-de-France
  44: ['FR-08','FR-10','FR-51','FR-52','FR-54','FR-55','FR-57','FR-67','FR-68','FR-88'], // Grand Est
  52: ['FR-44','FR-49','FR-53','FR-72','FR-85'], // Pays de la Loire
  53: ['FR-22','FR-29','FR-35','FR-56'], // Bretagne
  75: ['FR-16','FR-17','FR-19','FR-23','FR-24','FR-33','FR-40','FR-47','FR-64','FR-79','FR-86','FR-87'], // Nouvelle-Aquitaine
  76: ['FR-09','FR-11','FR-12','FR-30','FR-31','FR-32','FR-34','FR-46','FR-48','FR-65','FR-66','FR-81','FR-82'], // Occitanie
  84: ['FR-01','FR-03','FR-07','FR-15','FR-26','FR-38','FR-42','FR-43','FR-63','FR-69','FR-73','FR-74'], // Auvergne-Rhône-Alpes
  93: ['FR-04','FR-05','FR-06','FR-13','FR-20','FR-83','FR-84'], // PACA + Corse
}

const REG_LABELS = {
  11: 'Île-de-France', 24: 'Centre-Val de Loire', 27: 'Bourgogne-Franche-Comté',
  28: 'Normandie', 32: 'Hauts-de-France', 44: 'Grand Est',
  52: 'Pays de la Loire', 53: 'Bretagne', 75: 'Nouvelle-Aquitaine',
  76: 'Occitanie', 84: 'Auvergne-Rhône-Alpes', 93: 'PACA',
}

const fmtEur = (v) => v == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)

export default function Comparaison() {
  const [lppQuery, setLppQuery]     = useState('')
  const [lppOptions, setLppOptions] = useState([])
  const [selLpp, setSelLpp]         = useState(null)
  const [year, setYear]             = useState(2024)
  const [data, setData]             = useState([])
  const [loading, setLoading]       = useState(false)
  const [lppLoading, setLppLoading] = useState(false)
  const [domaines, setDomaines]     = useState([])
  const [selD1, setSelD1]           = useState(null)
  const [selD2, setSelD2]           = useState(null)
  const [selD4, setSelD4]           = useState(null)
  const mapRef = useRef(null)

  useEffect(() => {
    fetch('/api/domaines').then(r => r.json()).then(setDomaines)
  }, [])

  const d2Options = selD1
    ? (domaines.find(d => d.label === selD1.value)?.children || []).map(c => ({ value: c.label, label: c.label }))
    : []

  const d4Options = selD1 && selD2
    ? (domaines.find(d => d.label === selD1.value)
        ?.children.find(c => c.label === selD2.value)
        ?.domaine4 || [])
        .filter(Boolean)
        .map(d => ({ value: d, label: d }))
    : []

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

  const fetchData = useCallback(() => {
    if (!selLpp) return
    setLoading(true)

    const buildBars = (d) => {
      const yearIdx = 0
      return d
        .map(s => ({
          region: s.region,
          ben_reg: ALL_REGIONS.find(code => REG_LABELS[code] === s.region),
          rem_x100k: s.rem_x100k[yearIdx] ?? 0,
          rem_eur: s.rem_x100k[yearIdx] != null ? s.rem_x100k[yearIdx] * 100000 : 0,
        }))
        .filter(s => s.rem_eur > 0)
        .sort((a, b) => b.rem_eur - a.rem_eur)
    }

    if (selLpp.value === '__domaine__') {
      const params = new URLSearchParams({ domaine1: selD1.value, year_start: year, year_end: year })
      if (selD2) params.set('domaine2', selD2.value)
      if (selD4) params.set('domaine4', selD4.value)
      ALL_REGIONS.forEach(r => params.append('regions', r))
      fetch(`/api/evolution-domaine?${params}`)
        .then(r => r.json())
        .then(d => { setData(buildBars(d)); setLoading(false) })
    } else {
      const params = new URLSearchParams({ code_lpp: selLpp.value, year_start: year, year_end: year })
      ALL_REGIONS.forEach(r => params.append('regions', r))
      fetch(`/api/evolution?${params}`)
        .then(r => r.json())
        .then(d => { setData(buildBars(d)); setLoading(false) })
    }
  }, [selLpp, year, selD1, selD2, selD4])

  const total = data.reduce((s, d) => s + d.rem_eur, 0)
  const maxVal = data.length ? Math.max(...data.map(d => d.rem_eur)) : 1
  const sqrtMax = Math.sqrt(maxVal)

  // Données pour la carte — on utilise la racine carrée pour mieux visualiser les écarts
  const mapValues = {}
  data.forEach(d => {
    const depts = BEN_TO_JV[d.ben_reg]
    if (depts) {
      depts.forEach(code => { mapValues[code] = Math.sqrt(d.rem_eur) })
    }
  })

  // Tooltip carte
  const handleRegionTipShow = (e, el, code) => {
    const entry = data.find(d => BEN_TO_JV[d.ben_reg]?.includes(code))
    if (entry) {
      el.html(`<b>${entry.region}</b><br/>${fmtEur(entry.rem_eur)}`)
    }
  }

  return (
    <div className="fade-up">
      <div className="page-header">
        <div className="eyebrow">Comparaison régions</div>
        <h2>Position relative par région</h2>
      </div>

      <div className="page-body">
        {/* Paramètres — toujours visibles */}
        <div className="card" style={{ marginBottom: 28 }}>
          <div className="card-title">
            Paramètres d'analyse
            <button onClick={() => {
              setSelD1(null); setSelD2(null); setSelD4(null)
              setSelLpp(null); setData([])
              setLppQuery(''); setYear(2024)
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
              { num: '3', title: 'Choisir l\'année', desc: 'Sélectionnez l\'année de référence pour la comparaison régionale' },
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
              <label>Code LPP <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.68rem', fontStyle: 'italic' }}>— saisissez un code ou mot-clé</span></label>
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
              <label>Année</label>
              <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                {YEARS.map(y => (
                  <button key={y} onClick={() => setYear(y)} style={{
                    padding: '6px 14px',
                    border: `1px solid ${y === year ? 'var(--navy)' : 'var(--border)'}`,
                    background: y === year ? 'var(--navy)' : 'transparent',
                    color: y === year ? '#fff' : 'var(--text-secondary)',
                    borderRadius: 'var(--radius)', cursor: 'pointer',
                    fontFamily: 'var(--font-mono)', fontSize: '0.8rem', transition: 'all 0.2s',
                  }}>{y}</button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={fetchData} disabled={!selLpp} style={{
            marginTop: 20, padding: '10px 28px',
            background: selLpp ? 'var(--navy)' : 'var(--border)',
            color: selLpp ? '#fff' : 'var(--text-muted)',
            border: 'none', borderRadius: 'var(--radius)',
            cursor: selLpp ? 'pointer' : 'default',
            fontFamily: 'var(--font-body)', fontSize: '0.88rem', fontWeight: 500, transition: 'all 0.2s',
          }}>
            Comparer les régions →
          </button>
        </div>

        {/* Carte — toujours visible */}
        <div className="card" style={{ marginBottom: 28 }}>
          <div className="card-title">
            Carte des remboursements
            {data.length > 0 && <span className="subtitle">{year} · {selLpp?.label?.split('—')[0]?.trim()}</span>}
          </div>

          {data.length === 0 && !loading && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              Sélectionnez un code LPP et une année, puis cliquez "Comparer" pour colorer la carte.
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' }}>
            {/* Carte */}
            <div style={{ height: 460, position: 'relative' }}>
              {loading && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.7)', zIndex: 10 }}>
                  <div className="loading"><div className="spinner" /> Chargement…</div>
                </div>
              )}
              <VectorMap
                key={JSON.stringify(mapValues)}
                map={frMill}
                backgroundColor="transparent"
                zoomOnScroll={false}
                zoomButtons={false}
                containerStyle={{ width: '100%', height: '100%' }}
                regionStyle={{
                  initial: {
                    fill: '#dde8f0',
                    stroke: '#fff',
                    'stroke-width': 0.8,
                    'fill-opacity': 1,
                  },
                  hover: {
                    'fill-opacity': 0.75,
                    cursor: 'pointer',
                  },
                }}
                series={data.length > 0 ? {
                  regions: [{
                    values: mapValues,
                    scale: ['#fde8c8', '#c9822a', '#0f2d4a'],
                    normalizeFunction: 'linear',
                    min: 0,
                    max: sqrtMax,
                  }]
                } : undefined}
                onRegionTipShow={handleRegionTipShow}
              />
            </div>

            {/* Légende + top régions */}
            {data.length > 0 && (
              <div>
                {/* Gradient légende */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Montant remboursé</div>
                  <div style={{ height: 12, borderRadius: 6, background: 'linear-gradient(90deg, #fef3e2, #c9822a, #0f2d4a)', marginBottom: 4 }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    <span>0 €</span>
                    <span>{fmtEur(maxVal)}</span>
                  </div>
                </div>

                {/* Top régions */}
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Classement</div>
                {data.slice(0, 6).map((d, i) => {
                  // Calculer la couleur interpolée selon la valeur sqrt
                  const ratio = sqrtMax > 0 ? Math.sqrt(d.rem_eur) / sqrtMax : 0
                  // Interpolation : #fde8c8 → #c9822a → #0f2d4a
                  let r, g, b
                  if (ratio < 0.5) {
                    const t = ratio * 2
                    r = Math.round(253 + (201 - 253) * t)
                    g = Math.round(232 + (130 - 232) * t)
                    b = Math.round(200 + (42  - 200) * t)
                  } else {
                    const t = (ratio - 0.5) * 2
                    r = Math.round(201 + (15  - 201) * t)
                    g = Math.round(130 + (45  - 130) * t)
                    b = Math.round(42  + (74  - 42)  * t)
                  }
                  const circleColor = `rgb(${r},${g},${b})`
                  const textColor = ratio > 0.5 ? '#fff' : '#1a2a3a'

                  return (
                    <div key={d.region} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        background: circleColor,
                        color: textColor,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.65rem', fontWeight: 700,
                        border: '1px solid rgba(0,0,0,0.1)',
                      }}>{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--navy)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.region}</div>
                        <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                          {fmtEur(d.rem_eur)} · {total > 0 ? ((d.rem_eur / total) * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                    </div>
                  )
                })}
                {data.length > 6 && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>+ {data.length - 6} autres régions</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Graphique barres + tableau */}
        {!loading && data.length > 0 && (
          <div className="fade-in">
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-title">
                Remboursements par région
                <span className="subtitle">{year} · montant brut €</span>
              </div>
              <ResponsiveContainer width="100%" height={420}>
                <BarChart data={data} layout="vertical" margin={{ left: 8, right: 80, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => fmtEur(v)} style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }} />
                  <YAxis type="category" dataKey="region" width={200} style={{ fontFamily: 'var(--font-body)', fontSize: 11 }} />
                  <Tooltip
                    formatter={(v) => [fmtEur(v), 'Remboursement']}
                    contentStyle={{ fontFamily: 'var(--font-body)', fontSize: 12, border: '1px solid var(--border)', borderRadius: 2, background: 'var(--bg-card)' }}
                  />
                  <Bar dataKey="rem_eur" radius={[0, 2, 2, 0]}>
                    <LabelList dataKey="rem_eur" position="right"
                      formatter={v => fmtEur(v)}
                      style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--text-secondary)' }}
                    />
                    {data.map((d) => {
                      const ratio = sqrtMax > 0 ? Math.sqrt(d.rem_eur) / sqrtMax : 0
                      let r, g, b
                      if (ratio < 0.5) {
                        const t = ratio * 2
                        r = Math.round(253 + (201 - 253) * t)
                        g = Math.round(232 + (130 - 232) * t)
                        b = Math.round(200 + (42  - 200) * t)
                      } else {
                        const t = (ratio - 0.5) * 2
                        r = Math.round(201 + (15  - 201) * t)
                        g = Math.round(130 + (45  - 130) * t)
                        b = Math.round(42  + (74  - 42)  * t)
                      }
                      return <Cell key={d.region} fill={`rgb(${r},${g},${b})`} />
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <div className="card-title">
                Parts de marché régionales
                <span className="subtitle">% du total remboursé</span>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Région</th>
                    <th style={{ textAlign: 'right' }}>Remboursement (€)</th>
                    <th style={{ textAlign: 'right' }}>Part du marché</th>
                    <th>Poids relatif</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((d, i) => {
                    const pct = total > 0 ? ((d.rem_eur / total) * 100).toFixed(1) : 0
                    const barWidth = maxVal > 0 ? (d.rem_eur / maxVal) * 100 : 0
                    const ratio = sqrtMax > 0 ? Math.sqrt(d.rem_eur) / sqrtMax : 0
                    let r, g, b
                    if (ratio < 0.5) {
                      const t = ratio * 2
                      r = Math.round(253 + (201 - 253) * t)
                      g = Math.round(232 + (130 - 232) * t)
                      b = Math.round(200 + (42  - 200) * t)
                    } else {
                      const t = (ratio - 0.5) * 2
                      r = Math.round(201 + (15  - 201) * t)
                      g = Math.round(130 + (45  - 130) * t)
                      b = Math.round(42  + (74  - 42)  * t)
                    }
                    const cellColor = `rgb(${r},${g},${b})`
                    return (
                      <tr key={d.region}>
                        <td style={{ color: 'var(--text-muted)', width: 32 }}>{i + 1}</td>
                        <td className="label-cell">{d.region}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmtEur(d.rem_eur)}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: cellColor, fontWeight: 600 }}>{pct}%</td>
                        <td style={{ width: 160, paddingRight: 16 }}>
                          <div style={{ height: 6, borderRadius: 3, background: `linear-gradient(90deg, ${cellColor} ${barWidth}%, var(--border) ${barWidth}%)` }} />
                        </td>
                      </tr>
                    )
                  })}
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