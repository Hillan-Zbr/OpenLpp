import { useState, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'
import Select from 'react-select'
import { rsComponents } from '../selectComponents.jsx'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, CartesianGrid, LabelList
} from 'recharts'

// HiFi V4 Design Styles
const styles = `
  .benchmark-hifi {
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

  .benchmark-hifi .page-head { display: flex; align-items: flex-end; gap: 18px; flex-wrap: wrap; margin-bottom: 14px; }
  .benchmark-hifi .page-head .eyebrow { font-size: 11px; letter-spacing: .18em; color: var(--accent-2); text-transform: uppercase; font-weight: 600; }
  .benchmark-hifi .page-head h1 { margin: 4px 0 4px; font-size: 24px; font-weight: 700; letter-spacing: -.3px; line-height: 1.15; }
  .benchmark-hifi .page-head p { margin: 0; color: var(--ink-2); font-size: 13.5px; max-width: 720px; }
  .benchmark-hifi .page-head .actions { margin-left: auto; display: flex; gap: 8px; }

  .benchmark-hifi .classif {
    display: grid; grid-template-columns: auto 1fr; gap: 14px; align-items: stretch;
    padding: 14px 16px; background: linear-gradient(180deg,#f4fbf0,#eaf5e4);
    border: 1px solid #c7dec1; border-radius: 10px;
    box-shadow: 0 0 0 1px rgba(63,125,74,.06); margin-bottom: 14px; position: relative;
  }

  .benchmark-hifi .classif .lead {
    display: flex; flex-direction: column; justify-content: center; gap: 4px; min-width: 210px;
  }

  .benchmark-hifi .classif .lead .title {
    display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--ink); font-size: 14px;
  }

  .benchmark-hifi .classif .lead .title .n {
    width: 22px; height: 22px; border-radius: 50%;
    background: var(--ok); color: #fff; display: grid; place-items: center;
    font-size: 12px; font-weight: 700;
  }

  .benchmark-hifi .seg {
    display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 4px;
    background: rgba(255,255,255,.6); border: 1px solid rgba(168,106,31,.2); border-radius: 12px;
  }

  .benchmark-hifi .seg button {
    all: unset; cursor: pointer;
    display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px;
    padding: 10px 12px; border-radius: 9px; border: 1px solid transparent;
    transition: background .15s ease, border-color .15s ease;
  }

  .benchmark-hifi .seg button:hover { background: #fff; }

  .benchmark-hifi .seg button.on {
    background: #fff; border-color: var(--accent); box-shadow: 0 1px 2px rgba(168,106,31,.1);
  }

  .benchmark-hifi .seg .ic {
    width: 34px; height: 34px; border-radius: 8px; background: #fff; border: 1px solid var(--line);
    display: grid; place-items: center; font-weight: 800; font-size: 13px; color: var(--ink-2);
  }

  .benchmark-hifi .seg button.on .ic {
    background: var(--accent); border-color: var(--accent-2); color: #fff;
  }

  .benchmark-hifi .seg .tx { min-width: 0; }
  .benchmark-hifi .seg .tt { font-size: 13px; font-weight: 600; color: var(--ink); line-height: 1.2; }
  .benchmark-hifi .seg .dd { font-size: 11.5px; color: var(--muted); margin-top: 2px; line-height: 1.35; }

  .benchmark-hifi .seg .check {
    width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid var(--line);
    display: grid; place-items: center;
  }

  .benchmark-hifi .seg button.on .check {
    background: var(--accent); border-color: var(--accent-2); color: #fff;
  }

  .benchmark-hifi .section {
    border: 1px solid var(--line); border-radius: 12px; background: #fff;
    transition: border-color .2s ease, background .2s ease, box-shadow .2s ease;
  }

  .benchmark-hifi .section.done {
    border-color: #c7dec1; background: #fbfef9; box-shadow: 0 0 0 1px rgba(63,125,74,.06);
  }

  .benchmark-hifi .section.done > .sh {
    background: linear-gradient(180deg,#f4fbf0,#eaf5e4); border-bottom-color: #d4e5cc;
  }

  .benchmark-hifi .section.done > .sh .n {
    background: var(--ok); border-color: var(--ok); color: #fff;
  }

  .benchmark-hifi .section.done > .sh h4::after {
    content: " ✓ Complété"; font-size: 11px; color: var(--ok); font-weight: 600;
    margin-left: 6px; letter-spacing: .02em;
  }

  .benchmark-hifi .section.current {
    border-color: var(--accent); box-shadow: 0 0 0 1px rgba(201,130,42,.15), 0 4px 12px -6px rgba(201,130,42,.25);
  }

  .benchmark-hifi .section.current > .sh {
    background: linear-gradient(180deg,#fffaf1,#fbf3e4); border-bottom-color: rgba(201,130,42,.3);
  }

  .benchmark-hifi .section.current > .sh .n {
    background: var(--accent); border-color: var(--accent-2); color: #fff;
  }

  .benchmark-hifi .section.current > .sh h4::after {
    content: " · en cours"; font-size: 11px; color: var(--accent-2); font-weight: 600;
    margin-left: 2px; letter-spacing: .02em;
  }

  .benchmark-hifi .section > .sh {
    display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px dashed var(--line);
    background: linear-gradient(180deg,#fff,#fbf8f2);
  }

  .benchmark-hifi .section .sh .n {
    width: 22px; height: 22px; border-radius: 50%; background: var(--accent-soft); color: var(--accent-2);
    border: 1px solid var(--accent); display: grid; place-items: center; font-size: 11px; font-weight: 700;
  }

  .benchmark-hifi .section .sh h4 { margin: 0; font-size: 13px; font-weight: 700; color: var(--ink); }

  .benchmark-hifi .section .sh .desc { font-size: 11.5px; color: var(--muted); margin-left: 6px; }

  .benchmark-hifi .section .sh .right {
    margin-left: auto; display: flex; align-items: center; gap: 8px; font-size: 11.5px; color: var(--muted);
  }

  .benchmark-hifi .section .sb { padding: 10px 12px; }

  .benchmark-hifi .form { display: grid; gap: 8px; }

  .benchmark-hifi .row { display: grid; gap: 10px; }
  .benchmark-hifi .row.c3 { grid-template-columns: 1fr 1fr 1fr; }
  .benchmark-hifi .row.c2 { grid-template-columns: 1fr 1fr; }
  .benchmark-hifi .row.c3-equal { display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 12px; }

  @media (max-width: 1280px) {
    .benchmark-hifi .row.c3-equal { grid-template-columns: 1.2fr 1fr 1fr; }
  }
  @media (max-width: 1100px) {
    .benchmark-hifi .row.c3-equal { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 760px) {
    .benchmark-hifi .row.c3-equal { grid-template-columns: 1fr; }
  }

  .benchmark-hifi .field { display: flex; flex-direction: column; min-width: 0; }

  .benchmark-hifi .field label {
    display: flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 600;
    color: var(--ink-2); letter-spacing: .02em; margin-bottom: 5px; text-transform: uppercase;
  }

  .benchmark-hifi .field label .req { color: var(--accent); }

  .benchmark-hifi .field label .tip {
    display: inline-grid; place-items: center; width: 14px; height: 14px; border-radius: 50%;
    border: 1px solid var(--line); color: var(--muted); font-size: 9px; font-weight: 700;
    cursor: help; background: #fff;
  }

  .benchmark-hifi .field .sub {
    font-size: 11.5px; color: var(--muted); margin-top: 5px; line-height: 1.4;
  }

  .benchmark-hifi .field .sub.ok { color: var(--ok); }

  .benchmark-hifi .cta-bar {
    margin-top: 14px; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px;
    background: #fff; border: 1px solid var(--line); border-radius: 10px;
    padding: 10px 16px; box-shadow: var(--shadow-sm);
    position: sticky; bottom: 10px; z-index: 5;
  }

  .benchmark-hifi .rs__menu { z-index: 100 !important; }

  .benchmark-hifi .cta-status {
    display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--accent-2);
    background: var(--accent-softer); border: 1px solid var(--accent); border-radius: 6px; padding: 4px 8px;
  }

  .benchmark-hifi .cta-status.ok {
    color: #2f5e38; background: var(--ok-soft); border-color: #c7dec1; font-size: 11px; padding: 4px 8px;
  }

  .benchmark-hifi .cta-status svg { width: 12px; height: 12px; flex-shrink: 0; }

  .benchmark-hifi .btn-primary {
    background: linear-gradient(180deg,var(--accent),var(--accent-2));
    color: #fff; border: 1px solid var(--accent-2); border-radius: 9px; padding: 11px 18px;
    font-weight: 600; font-size: 13.5px; cursor: pointer; display: inline-flex;
    align-items: center; gap: 8px;
    box-shadow: 0 1px 0 rgba(255,255,255,.2) inset, 0 4px 10px -4px rgba(168,106,31,.45);
  }

  .benchmark-hifi .btn-primary:hover { filter: brightness(1.04); }
  .benchmark-hifi .btn-primary.disabled {
    background: #d9d3c4; border-color: #cfc9ba; box-shadow: none; cursor: not-allowed; color: #736d5e;
  }

  .benchmark-hifi .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    padding: 8px 12px; border-radius: 8px; border: 1px solid var(--line);
    background: #fff; color: var(--ink); font-size: 13px; font-weight: 500; cursor: pointer;
  }

  .benchmark-hifi .btn:hover {
    background: var(--accent-softer); border-color: var(--accent); color: var(--accent-2);
  }

  @media (max-width: 1180px) {
    .benchmark-hifi .row.c3 { grid-template-columns: 1fr 1fr; }
  }

  @media (max-width: 1020px) {
    .benchmark-hifi .classif { grid-template-columns: 1fr; }
    .benchmark-hifi .classif .lead { min-width: 0; }
  }

  @media (max-width: 960px) {
    .benchmark-hifi .row.c3 { grid-template-columns: 1fr; }
  }
`

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
    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '14px', alignItems: 'center' }}>
      <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--ink)', minWidth: '60px', textAlign: 'center', letterSpacing: '-.5px' }}>
        {start}
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ height: '6px', background: '#efece2', borderRadius: '999px', position: 'relative', overflow: 'visible' }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, background: 'linear-gradient(90deg,var(--accent),var(--accent-2))', borderRadius: '999px', left: `${pctStart}%`, right: `${100-pctEnd}%` }} />
          <div style={{ position: 'absolute', top: '-7px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', border: '2px solid var(--accent)', boxShadow: '0 1px 2px rgba(0,0,0,.1)', cursor: 'grab', left: `calc(${pctStart}% - 10px)` }} />
          <div style={{ position: 'absolute', top: '-7px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', border: '2px solid var(--accent)', boxShadow: '0 1px 2px rgba(0,0,0,.1)', cursor: 'grab', left: `calc(${pctEnd}% - 10px)` }} />
        </div>
        <input type="range" min={min} max={max} value={start}
          onChange={e => { const v = +e.target.value; if (v < end) onChange([v, end]) }}
          style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', zIndex: start >= end - 1 ? 4 : 2 }}
        />
        <input type="range" min={min} max={max} value={end}
          onChange={e => { const v = +e.target.value; if (v > start) onChange([start, v]) }}
          style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', zIndex: 3 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: 'var(--muted)' }}>
          {years.map(y => <span key={y} style={{ width: 0, whiteSpace: 'nowrap' }}>{y}</span>)}
        </div>
      </div>
      <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--ink)', minWidth: '60px', textAlign: 'center', letterSpacing: '-.5px' }}>
        {end}
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
      style={{ fontSize: '13px', fontFamily: 'DM Mono, monospace', fontWeight: 600 }}>
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

  const d2Options = selD1
    ? (domaines.find(d => d.label === selD1.value)?.children || [])
        .map(c => ({ value: c.label, label: c.label }))
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
      params.set('source', source)
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
  }, [lppQuery, selD1, selD2, selD4, source])

  const fetchData = useCallback(() => {
    if (!selLpp || selRegs.length === 0) return
    setLoading(true)

    if (selLpp.value === '__domaine__' || selLpp.value === '__all-codes__') {
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

  const fmtFRFn = (v, dec = 2) =>
    v == null ? '—' : v.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec })

  const buildRawRows = () => {
    if (!data.length) return []
    const rows = []
    data.forEach(s => {
      ;(s.years || []).forEach((y, i) => {
        rows.push({
          'Code LPP / Domaine': selLpp?.label ?? '',
          'Région': s.region,
          'Année': y,
          'REM (×100k€)': s.rem_x100k[i] ?? '',
          'Indice base 100': s.index_base100[i] ?? '',
          'Évolution % vs N-1': s.yoy_pct[i] ?? '',
        })
      })
    })
    return rows
  }

  const exportCSV = () => {
    const rows = buildRawRows()
    if (!rows.length) return
    const headers = Object.keys(rows[0])
    const csv = [headers.join(';'), ...rows.map(r => headers.map(h => String(r[h]).replace('.', ',')).join(';'))].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'benchmark_openlpp.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const exportExcel = () => {
    const rows = buildRawRows()
    if (!rows.length) return
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Benchmark')
    XLSX.writeFile(wb, 'benchmark_openlpp.xlsx')
  }

  const domainsDone = selD1 && selD2 && selD4
  const codeDone = selLpp
  const regionsDone = selRegs.length > 0
  const periodDone = true

  const missingField = !domainsDone ? 'Domaine 3' : !codeDone ? 'Code LPP' : !regionsDone ? 'Région(s)' : null

  return (
    <>
      <style>{styles}</style>
      <div className="benchmark-hifi fade-up">
        <div className="page-head">
          <div>
            <div className="eyebrow">Benchmark marché</div>
            <h1>Évolution du marché de référence</h1>
            <p>Comparez l'évolution des remboursements sur vos régions cibles pour situer votre propre trajectoire.</p>
          </div>
          <div className="actions">
            <button className="btn">↓ Charger une analyse</button>
            <button className="btn">↻ Réinitialiser</button>
          </div>
        </div>

        <div className="classif">
          <div className="lead">
            <div className="title">
              <span className="n">1</span> Classification LPP
              <span className="tip" title="Référence = regroupement interne SNADOM. Originale = nomenclature LPP officielle.">?</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ink-2)', lineHeight: '1.4' }}>
              Ce choix détermine les libellés de domaines et les codes proposés ensuite.
            </div>
          </div>
          <div className="seg">
            <button className={source === 'ref' ? 'on' : ''} onClick={() => { setSource('ref'); setSelD1(null); setSelD2(null); setSelD4(null) }}>
              <div className="ic">R</div>
              <div className="tx">
                <div className="tt">Classification de <b>Référence</b></div>
                <div className="dd">Regroupement SNADOM · benchmark interne · recommandé</div>
              </div>
              <div className="check">
                {source === 'ref' && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>}
              </div>
            </button>
            <button className={source === 'orig' ? 'on' : ''} onClick={() => { setSource('orig'); setSelD1(null); setSelD2(null); setSelD4(null) }}>
              <div className="ic">O</div>
              <div className="tx">
                <div className="tt">Classification <b>Originale</b></div>
                <div className="dd">Nomenclature officielle LPP · codes &amp; libellés publiés</div>
              </div>
              <div className="check">
                {source === 'orig' && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>}
              </div>
            </button>
          </div>
        </div>

        <div className="form">
          <div className={`section ${domainsDone ? 'done' : selD2 ? 'current' : ''}`}>
            <div className="sh">
              <div className="n">2</div>
              <h4>Domaines <span style={{ color: 'var(--muted)', fontWeight: 500 }}>(classification {source === 'ref' ? 'de référence' : 'LPP officielle'})</span></h4>
              <span className="desc">filtrage progressif · cascade D1 → D2 → D3</span>
              <div className="right">
                <span className="tip" title="Les 3 domaines se filtrent en cascade : D2 dépend de D1, D3 dépend de D2.">?</span>
              </div>
            </div>
            <div className="sb">
              <div className="row c3">
                <div className="field">
                  <label>{domLabel1} <span className="req">*</span> <span className="tip" title="Famille de dispositifs médicaux.">?</span></label>
                  <Select classNamePrefix="rs" components={rsComponents} isClearable
                    options={domaines.map(d => ({ value: d.label, label: d.label }))}
                    value={selD1}
                    onChange={v => { setSelD1(v); setSelD2(null); setSelD4(null); setSelLpp(null) }}
                    placeholder="Tous…"
                  />
                  {selD1 && <div className="sub ok">✓ Sélectionné — débloque Domaine 2</div>}
                </div>

                <div className="field">
                  <label>{domLabel2} <span className="req">*</span> <span className="tip" title="Sous-famille. Disponible après Domaine 1.">?</span></label>
                  <Select classNamePrefix="rs" components={rsComponents} isClearable
                    options={d2Options}
                    value={selD2}
                    isDisabled={!selD1}
                    onChange={v => { setSelD2(v); setSelD4(null); setSelLpp(null) }}
                    placeholder={selD1 ? 'Tous…' : '— choisir Domaine 1 d\'abord'}
                  />
                  {selD2 && <div className="sub ok">✓ Sélectionné — débloque Domaine 3</div>}
                </div>

                <div className="field">
                  <label>{domLabel4} <span className="req">*</span> <span className="tip" title="Spécialité. Disponible après Domaine 2.">?</span></label>
                  <Select classNamePrefix="rs" components={rsComponents} isClearable
                    options={d4Options}
                    value={selD4}
                    isDisabled={!selD2}
                    onChange={v => { setSelD4(v); setSelLpp(null) }}
                    placeholder={selD2 ? 'Tous…' : '— choisir Domaine 2 d\'abord'}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="row c3-equal" style={{ gap: '12px' }}>
            <div className={`section ${codeDone ? 'done' : ''}`}>
              <div className="sh">
                <div className="n">3</div>
                <h4>Code LPP</h4>
                <span className="desc">ou saisissez directement un code si vous le connaissez</span>
                <div className="right">
                  <span className="tip" title="Saisissez le code exact ou cherchez par mot-clé. 3 caractères min.">?</span>
                </div>
              </div>
              <div className="sb">
                <div className="field">
                  <label>Code LPP <span className="req">*</span></label>
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
                  {lppOptions.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                      <button onClick={() => setSelLpp({ value: '__all-codes__', label: `Tous les codes (${lppOptions.length})` })} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 10px',
                        border: selLpp?.value === '__all-codes__' ? '1.5px solid var(--accent)' : '1.5px solid var(--accent)',
                        background: selLpp?.value === '__all-codes__' ? 'var(--accent)' : '#fff',
                        color: selLpp?.value === '__all-codes__' ? '#fff' : 'var(--ink)',
                        fontSize: '12px', fontWeight: '600', cursor: 'pointer', borderRadius: '999px'
                      }}>
                        <input type="checkbox" checked={selLpp?.value === '__all-codes__'} onChange={() => {}} style={{ accentColor: 'var(--accent)', cursor: 'pointer' }} />
                        <span><b>Tous les codes</b></span>
                      </button>
                    </div>
                  )}
                  {codeDone && (
                    <div className="sub" style={{ fontSize: '11.5px' }}>
                      Groupement de {lppOptions.length} codes LPP — <a style={{ color: 'var(--accent-2)', textDecoration: 'underline', cursor: 'pointer' }}>voir le détail</a> · ou <a style={{ color: 'var(--accent-2)', textDecoration: 'underline', cursor: 'pointer' }}>saisir un code précis</a>.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={`section ${regionsDone ? 'done' : 'current'}`}>
              <div className="sh">
                <div className="n">4</div>
                <h4>Région(s)</h4>
                <div className="right">
                  <span className="tip" title="France entière = métropole + DROM.">?</span>
                </div>
              </div>
              <div className="sb">
                <div className="field">
                  <label>Régions <span className="req">*</span></label>
                  <Select classNamePrefix="rs" components={rsComponents} isMulti
                    options={regions.filter(r => r.value !== 99)}
                    value={selRegs} onChange={setSelRegs}
                    placeholder="Sélectionner…"
                    noOptionsMessage={() => 'Aucune région'}
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    <button onClick={() => setSelRegs(ALL_METRO_REGIONS)} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 10px',
                      border: regionsDone ? '1.5px solid var(--accent)' : '1.5px solid var(--accent)',
                      background: regionsDone ? 'var(--accent)' : '#fff',
                      color: regionsDone ? '#fff' : 'var(--ink)',
                      fontSize: '12px', fontWeight: '600', cursor: 'pointer', borderRadius: '999px'
                    }}>
                      <input type="checkbox" checked={regionsDone} onChange={() => {}} style={{ accentColor: 'var(--accent)', cursor: 'pointer' }} />
                      <span><b>France entière</b></span>
                    </button>
                    {selRegs.map(r => (
                      <span key={r.value} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 8px 4px 10px',
                        borderRadius: '999px', border: '1px solid var(--accent)', background: 'var(--accent-softer)',
                        color: 'var(--accent-2)', fontSize: '12px', fontWeight: '500'
                      }}>
                        {r.label} <span style={{ cursor: 'pointer', opacity: '.7', fontWeight: '700', fontSize: '14px', lineHeight: 1 }} onClick={() => setSelRegs(selRegs.filter(x => x.value !== r.value))}>×</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={`section ${periodDone ? 'done' : ''}`}>
              <div className="sh">
                <div className="n">5</div>
                <h4>Période</h4>
                <div className="right">
                  <span className="tip" title="Données CNAM 2018–2024.">?</span>
                </div>
              </div>
              <div className="sb">
                <div className="field">
                  <YearRangeSlider min={2020} max={2024} value={yearRange} onChange={setYearRange} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="cta-bar">
          {missingField ? (
            <div className="cta-status">
              <svg className="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16v.01"/></svg>
              <span>Il reste <b>1 champ</b> à compléter : <b>{missingField}</b>.</span>
            </div>
          ) : (
            <div className="cta-status ok">
              <svg className="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m5 12 5 5L20 7"/></svg>
              <span>Tous les champs sont remplis — prêt à analyser.</span>
            </div>
          )}
          <button className={`btn-primary ${!canQuery ? 'disabled' : ''}`} onClick={fetchData} disabled={!canQuery}>
            Analyser le marché
            <svg className="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
          </button>
          <div />
        </div>

        {loading && <div className="loading"><div className="spinner" /> Analyse en cours…</div>}

        {!loading && data.length > 0 && (
          <div className="fade-in">
            {totalStats && (
              <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, var(--navy) 0%, #1a4a8b 100%)', color: '#fff', border: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 16, textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7, marginBottom: 6 }}>Total remboursements — sélection</div>
                    <div style={{ fontSize: '2.6rem', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '-0.02em' }}>
                      {fmtFRFn(totalStats.grandTotal / 10, 1)}&nbsp;<span style={{ fontSize: '1.2rem', fontWeight: 400, opacity: 0.85 }}>M€</span>
                    </div>
                    <div style={{ fontSize: '0.88rem', opacity: 0.65, marginTop: 6 }}>
                      {selLpp?.label?.split('—')[0]?.trim()} · {selRegs.map(r => r.label).join(', ')} · {yearRange[0]}–{yearRange[1]}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                    <div style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 4 }}>Par année</div>
                    {(data[0]?.years || []).map((y, i) => (
                      <div key={y} style={{ display: 'flex', gap: 16, fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>
                        <span style={{ opacity: 0.65, minWidth: 36 }}>{y}</span>
                        <span style={{ fontWeight: 600 }}>
                          {totalStats.perYear[i] != null ? `${fmtFRFn(totalStats.perYear[i] / 10, 1)} M€` : '—'}
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
                                  ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--navy)' }}>{fmtFRFn(v, 2)}</span>
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

            {/* Tableau valeurs brutes + export */}
            <div className="card" style={{ marginTop: 24 }}>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Données brutes <span className="subtitle">remboursements · indice · évolution</span></span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={exportCSV} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                    border: '1px solid var(--line)', borderRadius: 8, background: '#fff',
                    color: 'var(--ink-2)', fontSize: '12px', fontWeight: 500, cursor: 'pointer'
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    CSV
                  </button>
                  <button onClick={exportExcel} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                    border: '1px solid #c7dec1', borderRadius: 8, background: '#f4fbf0',
                    color: '#2f5e38', fontSize: '12px', fontWeight: 500, cursor: 'pointer'
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Excel
                  </button>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: 200 }}>Code LPP / Domaine</th>
                      <th style={{ minWidth: 160 }}>Région</th>
                      <th style={{ textAlign: 'right' }}>Année</th>
                      <th style={{ textAlign: 'right' }}>REM <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 400 }}>×100k€</span></th>
                      <th style={{ textAlign: 'right' }}>Indice <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 400 }}>base 100</span></th>
                      <th style={{ textAlign: 'right' }}>Évol% <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 400 }}>vs N-1</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.flatMap(s =>
                      (s.years || []).map((y, i) => (
                        <tr key={`${s.region}-${y}`}>
                          <td className="label-cell" style={{ fontSize: '0.78rem', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selLpp?.label ?? '—'}</td>
                          <td className="label-cell">{s.region}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{y}</td>
                          <td style={{ textAlign: 'right' }}>
                            {s.rem_x100k[i] != null ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{fmtFRFn(s.rem_x100k[i], 2)}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {s.index_base100[i] != null ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{fmtFRFn(s.index_base100[i], 1)}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {s.yoy_pct[i] != null
                              ? <span className={s.yoy_pct[i] > 0 ? 'pct-positive' : s.yoy_pct[i] < 0 ? 'pct-negative' : 'pct-neutral'}>{s.yoy_pct[i] > 0 ? '+' : ''}{fmtFRFn(s.yoy_pct[i], 1)}%</span>
                              : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </td>
                        </tr>
                      ))
                    )}
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
    </>
  )
}
