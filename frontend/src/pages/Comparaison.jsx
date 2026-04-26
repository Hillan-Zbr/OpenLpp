import { useState, useEffect, useRef } from 'react'
import Select from 'react-select'
import { rsComponents } from '../selectComponents.jsx'
import { VectorMap } from '@react-jvectormap/core'
import { frMill } from '@react-jvectormap/france'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid, LabelList
} from 'recharts'

const YEARS = [2020, 2021, 2022, 2023, 2024]

// Correspondance BEN_REG → codes départements jvectormap
const BEN_TO_JV = {
  11: ['FR-75','FR-77','FR-78','FR-91','FR-92','FR-93','FR-94','FR-95'],
  24: ['FR-18','FR-28','FR-36','FR-37','FR-41','FR-45'],
  27: ['FR-21','FR-25','FR-39','FR-58','FR-70','FR-71','FR-89','FR-90'],
  28: ['FR-14','FR-27','FR-50','FR-61','FR-76'],
  32: ['FR-02','FR-59','FR-60','FR-62','FR-80'],
  44: ['FR-08','FR-10','FR-51','FR-52','FR-54','FR-55','FR-57','FR-67','FR-68','FR-88'],
  52: ['FR-44','FR-49','FR-53','FR-72','FR-85'],
  53: ['FR-22','FR-29','FR-35','FR-56'],
  75: ['FR-16','FR-17','FR-19','FR-23','FR-24','FR-33','FR-40','FR-47','FR-64','FR-79','FR-86','FR-87'],
  76: ['FR-09','FR-11','FR-12','FR-30','FR-31','FR-32','FR-34','FR-46','FR-48','FR-65','FR-66','FR-81','FR-82'],
  84: ['FR-01','FR-03','FR-07','FR-15','FR-26','FR-38','FR-42','FR-43','FR-63','FR-69','FR-73','FR-74'],
  93: ['FR-04','FR-05','FR-06','FR-13','FR-20','FR-83','FR-84'],
}

const styles = `
  .comparaison-hifi {
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

  .comparaison-hifi .page-head { display: flex; align-items: flex-end; gap: 18px; flex-wrap: wrap; margin-bottom: 14px; }
  .comparaison-hifi .page-head .eyebrow { font-size: 11px; letter-spacing: .18em; color: var(--accent-2); text-transform: uppercase; font-weight: 600; }
  .comparaison-hifi .page-head h1 { margin: 4px 0 4px; font-size: 24px; font-weight: 700; letter-spacing: -.3px; line-height: 1.15; }
  .comparaison-hifi .page-head p { margin: 0; color: var(--ink-2); font-size: 13.5px; max-width: 720px; }

  .comparaison-hifi .classif {
    display: grid; grid-template-columns: auto 1fr; gap: 14px; align-items: stretch;
    padding: 14px 16px; background: linear-gradient(180deg,#f4fbf0,#eaf5e4);
    border: 1px solid #c7dec1; border-radius: 10px;
    box-shadow: 0 0 0 1px rgba(63,125,74,.06); margin-bottom: 14px; position: relative;
  }

  .comparaison-hifi .classif .lead {
    display: flex; flex-direction: column; justify-content: center; gap: 4px; min-width: 210px;
  }

  .comparaison-hifi .classif .lead .title {
    display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--ink); font-size: 14px;
  }

  .comparaison-hifi .classif .lead .title .n {
    width: 22px; height: 22px; border-radius: 50%;
    background: var(--ok); color: #fff; display: grid; place-items: center;
    font-size: 12px; font-weight: 700;
  }

  .comparaison-hifi .seg {
    display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 4px;
    background: rgba(255,255,255,.6); border: 1px solid rgba(168,106,31,.2); border-radius: 12px;
  }

  .comparaison-hifi .seg button {
    all: unset; cursor: pointer;
    display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px;
    padding: 10px 12px; border-radius: 9px; border: 1px solid transparent;
    transition: background .15s ease, border-color .15s ease;
  }

  .comparaison-hifi .seg button:hover { background: #fff; }

  .comparaison-hifi .seg button.on {
    background: #fff; border-color: var(--accent); box-shadow: 0 1px 2px rgba(168,106,31,.1);
  }

  .comparaison-hifi .seg .ic {
    width: 34px; height: 34px; border-radius: 8px; background: #fff; border: 1px solid var(--line);
    display: grid; place-items: center; font-weight: 800; font-size: 13px; color: var(--ink-2);
  }

  .comparaison-hifi .seg button.on .ic {
    background: var(--accent); border-color: var(--accent-2); color: #fff;
  }

  .comparaison-hifi .seg .tx { min-width: 0; }
  .comparaison-hifi .seg .tt { font-size: 13px; font-weight: 600; color: var(--ink); line-height: 1.2; }
  .comparaison-hifi .seg .dd { font-size: 11.5px; color: var(--muted); margin-top: 2px; line-height: 1.35; }

  .comparaison-hifi .seg .check {
    width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid var(--line);
    display: grid; place-items: center;
  }

  .comparaison-hifi .seg button.on .check {
    background: var(--accent); border-color: var(--accent-2); color: #fff;
  }

  .comparaison-hifi .section {
    border: 1px solid var(--line); border-radius: 12px; background: #fff;
    transition: border-color .2s ease, background .2s ease, box-shadow .2s ease;
  }

  .comparaison-hifi .section.done {
    border-color: #c7dec1; background: #fbfef9; box-shadow: 0 0 0 1px rgba(63,125,74,.06);
  }

  .comparaison-hifi .section.done > .sh {
    background: linear-gradient(180deg,#f4fbf0,#eaf5e4); border-bottom-color: #d4e5cc;
  }

  .comparaison-hifi .section.done > .sh .n {
    background: var(--ok); border-color: var(--ok); color: #fff;
  }

  .comparaison-hifi .section.done > .sh h4::after {
    content: " ✓ Complété"; font-size: 11px; color: var(--ok); font-weight: 600;
    margin-left: 6px; letter-spacing: .02em;
  }

  .comparaison-hifi .section.current {
    border-color: var(--accent); box-shadow: 0 0 0 1px rgba(201,130,42,.15), 0 4px 12px -6px rgba(201,130,42,.25);
  }

  .comparaison-hifi .section.current > .sh {
    background: linear-gradient(180deg,#fffaf1,#fbf3e4); border-bottom-color: rgba(201,130,42,.3);
  }

  .comparaison-hifi .section.current > .sh .n {
    background: var(--accent); border-color: var(--accent-2); color: #fff;
  }

  .comparaison-hifi .section.current > .sh h4::after {
    content: " · en cours"; font-size: 11px; color: var(--accent-2); font-weight: 600;
    margin-left: 2px; letter-spacing: .02em;
  }

  .comparaison-hifi .section > .sh {
    display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px dashed var(--line);
    background: linear-gradient(180deg,#fff,#fbf8f2);
  }

  .comparaison-hifi .section .sh .n {
    width: 22px; height: 22px; border-radius: 50%; background: var(--accent-soft); color: var(--accent-2);
    border: 1px solid var(--accent); display: grid; place-items: center; font-size: 11px; font-weight: 700;
  }

  .comparaison-hifi .section .sh h4 { margin: 0; font-size: 13px; font-weight: 700; color: var(--ink); }

  .comparaison-hifi .section .sh .desc { font-size: 11.5px; color: var(--muted); margin-left: 6px; }

  .comparaison-hifi .section .sb { padding: 10px 12px; }

  .comparaison-hifi .form { display: grid; gap: 8px; }

  .comparaison-hifi .row { display: grid; gap: 10px; }
  .comparaison-hifi .row.c2 { grid-template-columns: 1fr 1fr; }
  .comparaison-hifi .row.c3 { grid-template-columns: 1fr 1fr 1fr; }

  .comparaison-hifi .field { display: flex; flex-direction: column; min-width: 0; }

  .comparaison-hifi .field label {
    display: flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 600;
    color: var(--ink-2); letter-spacing: .02em; margin-bottom: 5px; text-transform: uppercase;
  }

  .comparaison-hifi .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    padding: 8px 12px; border-radius: 8px; border: 1px solid var(--line);
    background: #fff; color: var(--ink); font-size: 13px; font-weight: 500; cursor: pointer;
  }

  .comparaison-hifi .btn:hover {
    background: var(--accent-softer); border-color: var(--accent); color: var(--accent-2);
  }

  .comparaison-hifi .btn-primary {
    background: linear-gradient(180deg,var(--accent),var(--accent-2));
    color: #fff; border: 1px solid var(--accent-2); border-radius: 9px; padding: 11px 18px;
    font-weight: 600; font-size: 13.5px; cursor: pointer; display: inline-flex;
    align-items: center; gap: 8px;
    box-shadow: 0 1px 0 rgba(255,255,255,.2) inset, 0 4px 10px -4px rgba(168,106,31,.45);
  }

  .comparaison-hifi .btn-primary:hover { filter: brightness(1.04); }
  .comparaison-hifi .btn-primary.disabled {
    background: #d9d3c4; border-color: #cfc9ba; box-shadow: none; cursor: not-allowed; color: #736d5e;
  }

  .comparaison-hifi .rs__menu { z-index: 100 !important; }

  @media (max-width: 1100px) {
    .comparaison-hifi .row.c2 { grid-template-columns: 1fr; }
  }
`

const fmtEur = (v) => v == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)

const truncLabel = (s, n = 48) => s && s.length > n ? s.substring(0, n) + '…' : s

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
    fetch(`/api/domaines?source=${source}`).then(r => r.json()).then(setDomaines)
  }, [source])

  // Options domaine2 selon domaine1
  const d2Options = selD1
    ? (domaines.find(d => d.label === selD1.value)?.children || [])
        .map(c => ({ value: c.label, label: truncLabel(c.label) }))
    : []

  // Options domaine4 selon domaine2
  const d4Options = selD1 && selD2
    ? (domaines.find(d => d.label === selD1.value)
        ?.children.find(c => c.label === selD2.value)
        ?.domaine4 || [])
        .filter(Boolean)
        .map(d => ({ value: d, label: truncLabel(d) }))
    : []

  // Charger les codes LPP selon domaine OU recherche textuelle
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

  const fetchData = () => {
    if (!selLpp || selRegs.length === 0) return
    setLoading(true)

    if (selLpp.value === '__domaine__') {
      const params = new URLSearchParams({
        domaine1: selD1.value,
        year_start: year,
        year_end: year,
        source: source,
      })
      if (selD2) params.set('domaine2', selD2.value)
      if (selD4) params.set('domaine4', selD4.value)
      selRegs.forEach(r => params.append('regions', r.value))
      fetch(`/api/evolution-domaine?${params}`)
        .then(r => r.json())
        .then(d => {
          const bars = d
            .map(s => {
              const regEntry = ALL_METRO_REGIONS.find(r => r.label === s.region)
              return { region: s.region, rem: s.rem_x100k[0] ?? 0, ben_reg: regEntry?.value }
            })
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
            .map(s => {
              const regEntry = ALL_METRO_REGIONS.find(r => r.label === s.region)
              return { region: s.region, rem: s.rem_x100k[0] ?? 0, ben_reg: regEntry?.value }
            })
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

  // Carte choroplèthe — on travaille en € pour la carte (rem * 100000)
  const mapEurData = data.map(d => ({ ...d, rem_eur: d.rem * 100000 }))
  const maxEur = mapEurData.length ? Math.max(...mapEurData.map(d => d.rem_eur)) : 1
  const sqrtMax = Math.sqrt(maxEur)
  const mapValues = {}
  mapEurData.forEach(d => {
    if (d.ben_reg) {
      const depts = BEN_TO_JV[d.ben_reg]
      if (depts) depts.forEach(code => { mapValues[code] = Math.sqrt(d.rem_eur) })
    }
  })
  const handleRegionTipShow = (e, el, code) => {
    const entry = mapEurData.find(d => BEN_TO_JV[d.ben_reg]?.includes(code))
    if (entry) el.html(`<b>${entry.region}</b><br/>${fmtEur(entry.rem_eur)}`)
  }

  const handleReset = () => {
    setSelD1(null); setSelD2(null); setSelD4(null)
    setSelLpp(null); setSelRegs([]); setData([])
  }

  const classifDone = true
  const domainsDone = selD1 && selD2 && selD4
  const codeDone = selLpp
  const regionsDone = selRegs.length > 0

  return (
    <>
      <style>{styles}</style>
      <div className="comparaison-hifi fade-up">
        <div className="page-head">
          <div>
            <div className="eyebrow">Comparaison régions</div>
            <h1>Position relative par région</h1>
            <p>Pour un code LPP donné, visualisez le poids de chaque région dans le remboursement national.</p>
          </div>
        </div>

        <div className="classif">
          <div className="lead">
            <div className="title">
              <span className="n">1</span> Classification LPP
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ink-2)', lineHeight: '1.4' }}>
              Ce choix détermine les libellés de domaines et les codes proposés.
            </div>
          </div>
          <div className="seg">
            <button className={source === 'ref' ? 'on' : ''} onClick={() => { setSource('ref'); setSelD1(null); setSelD2(null); setSelD4(null); setSelLpp(null) }}>
              <div className="ic">R</div>
              <div className="tx">
                <div className="tt">Classification de <b>Référence</b></div>
                <div className="dd">Regroupement SNADOM · benchmark interne · recommandé</div>
              </div>
              <div className="check">
                {source === 'ref' && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>}
              </div>
            </button>
            <button className={source === 'orig' ? 'on' : ''} onClick={() => { setSource('orig'); setSelD1(null); setSelD2(null); setSelD4(null); setSelLpp(null) }}>
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
          <div className={`section ${domainsDone ? 'done' : ''}`}>
            <div className="sh">
              <div className="n">2</div>
              <h4>Domaines <span style={{ color: 'var(--muted)', fontWeight: 500 }}>(filtrage optionnel)</span></h4>
              <span className="desc">affinez la liste des codes · cascade D1 → D2 → D3</span>
            </div>
            <div className="sb">
              <div className="row c3">
                <div className="field">
                  <label>{domLabel1}</label>
                  <Select classNamePrefix="rs" components={rsComponents} isClearable
                    options={domaines.map(d => ({ value: d.label, label: d.label }))}
                    value={selD1}
                    onChange={v => { setSelD1(v); setSelD2(null); setSelD4(null); setSelLpp(null) }}
                    placeholder="Tous…"
                  />
                </div>

                <div className="field">
                  <label>{domLabel2}</label>
                  <Select classNamePrefix="rs" components={rsComponents} isClearable
                    options={d2Options}
                    value={selD2}
                    isDisabled={!selD1}
                    onChange={v => { setSelD2(v); setSelD4(null); setSelLpp(null) }}
                    placeholder={selD1 ? 'Tous…' : '— choisir Domaine 1 d\'abord'}
                  />
                </div>

                <div className="field">
                  <label>{domLabel4}</label>
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

          <div className="row c2" style={{ gap: '12px' }}>
            <div className={`section ${codeDone ? 'done' : ''}`}>
              <div className="sh">
                <div className="n">3</div>
                <h4>Code LPP</h4>
                <span className="desc">ou saisissez directement</span>
              </div>
              <div className="sb">
                <div className="field">
                  <label>Code LPP</label>
                  <Select classNamePrefix="rs" components={rsComponents} options={lppOptions} value={selLpp} onChange={setSelLpp}
                    onInputChange={setLppQuery} isLoading={lppLoading}
                    placeholder="Ex : 1149511 ou PPC…"
                    noOptionsMessage={() => lppQuery.length < 2 ? 'Saisissez au moins 2 caractères' : 'Aucun résultat'}
                    filterOption={() => true} isClearable
                    styles={{
                      option: (b) => ({ ...b, whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.4 }),
                      singleValue: (b) => ({ ...b, whiteSpace: 'normal', fontSize: '0.82rem' }),
                    }}
                  />
                  {selD1 && lppOptions.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                      <button onClick={() => setSelLpp({ value: '__domaine__', label: `Tous les codes (${lppOptions.length})` })} className="btn">
                        Tous les codes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={`section ${regionsDone ? 'done' : 'current'}`}>
              <div className="sh">
                <div className="n">4</div>
                <h4>Région(s)</h4>
              </div>
              <div className="sb">
                <div className="field">
                  <label>Régions</label>
                  <Select classNamePrefix="rs" components={rsComponents} isMulti
                    options={ALL_METRO_REGIONS}
                    value={selRegs}
                    onChange={setSelRegs}
                    placeholder="Sélectionner…"
                    noOptionsMessage={() => 'Aucune région'}
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    <button onClick={() => setSelRegs(ALL_METRO_REGIONS)} className="btn">
                      France entière
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`section ${true ? 'done' : ''}`}>
            <div className="sh">
              <div className="n">5</div>
              <h4>Année</h4>
            </div>
            <div className="sb">
              <div className="field">
                <div style={{ display: 'flex', gap: 8 }}>
                  {YEARS.map(y => (
                    <button key={y} onClick={() => setYear(y)} className="btn" style={{
                      border: `1px solid ${y === year ? 'var(--accent)' : 'var(--line)'}`,
                      background: y === year ? 'var(--accent-softer)' : '#fff',
                      color: y === year ? 'var(--accent-2)' : 'var(--ink)',
                    }}>
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
          <button onClick={fetchData} disabled={!canQuery} className={`btn-primary ${!canQuery ? 'disabled' : ''}`}>
            Comparer les régions
            <svg className="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
          </button>
          <button onClick={handleReset} className="btn">
            ↺ Réinitialiser
          </button>
        </div>

        <div className="card" style={{ marginBottom: 28, marginTop: 28 }}>
          <div className="card-title">
            Carte des remboursements
            {data.length > 0 && <span className="subtitle">{year} · {selLpp?.label?.split('—')[0]?.trim()}</span>}
          </div>
          {data.length === 0 && !loading && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              Sélectionnez un code LPP et des régions, puis cliquez "Comparer" pour colorer la carte.
            </p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: data.length > 0 ? '1fr 300px' : '1fr', gap: 32, alignItems: 'start' }}>
            <div style={{ height: 440, position: 'relative' }}>
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
                  initial: { fill: '#dde8f0', stroke: '#fff', 'stroke-width': 0.8, 'fill-opacity': 1 },
                  hover: { 'fill-opacity': 0.75, cursor: 'pointer' },
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

            {data.length > 0 && (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Montant remboursé</div>
                  <div style={{ height: 12, borderRadius: 6, background: 'linear-gradient(90deg, #fef3e2, #c9822a, #0f2d4a)', marginBottom: 4 }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    <span>0 €</span>
                    <span>{fmtEur(maxEur)}</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Classement</div>
                {mapEurData.slice(0, 6).map((d, i) => {
                  const ratio = sqrtMax > 0 ? Math.sqrt(d.rem_eur) / sqrtMax : 0
                  let r, g, b
                  if (ratio < 0.5) {
                    const t = ratio * 2
                    r = Math.round(253 + (201 - 253) * t); g = Math.round(232 + (130 - 232) * t); b = Math.round(200 + (42 - 200) * t)
                  } else {
                    const t = (ratio - 0.5) * 2
                    r = Math.round(201 + (15 - 201) * t); g = Math.round(130 + (45 - 130) * t); b = Math.round(42 + (74 - 42) * t)
                  }
                  const total = mapEurData.reduce((s, x) => s + x.rem_eur, 0)
                  return (
                    <div key={d.region} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        background: `rgb(${r},${g},${b})`,
                        color: ratio > 0.5 ? '#fff' : '#1a2a3a',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.65rem', fontWeight: 700, border: '1px solid rgba(0,0,0,0.1)',
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
                {mapEurData.length > 6 && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>+ {mapEurData.length - 6} autres régions</div>
                )}
              </div>
            )}
          </div>
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
    </>
  )
}