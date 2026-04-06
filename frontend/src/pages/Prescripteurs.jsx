import { useState, useEffect, useCallback } from 'react'
import Select from 'react-select'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, CartesianGrid, LabelList
} from 'recharts'
import * as XLSX from 'xlsx'

const exportCSV = (data, filename) => {
  const headers = ['#', 'Spécialité', 'QTE', '% QTE', 'REM €', '% REM', 'BSE €']
  const rows = data.map((d, i) => [i + 1, d.libelle, d.qte, d.pct_qte, d.rem, d.pct_rem, d.bse])
  const csv = [headers, ...rows].map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename + '.csv'
  a.click()
}

const exportExcel = (data, filename) => {
  const headers = ['#', 'Spécialité', 'QTE', '% QTE', 'REM €', '% REM', 'BSE €']
  const rows = data.map((d, i) => [i + 1, d.libelle, d.qte, d.pct_qte, d.rem, d.pct_rem, d.bse])
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  ws['!cols'] = [6, 50, 12, 10, 14, 10, 14].map(w => ({ wch: w }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Prescripteurs')
  XLSX.writeFile(wb, filename + '.xlsx')
}

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

const fmtEur = (v) => v == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)
const fmtNb  = (v) => v == null ? '—' : new Intl.NumberFormat('fr-FR').format(v)

const COLORS_QTE = ['#0f2d4a','#1a4a73','#2a6da8','#3a8ed4','#5aaee8','#8acced','#b8e0f5','#d8eef9','#eef6fc','#f8fbfe']
const COLORS_REM = ['#7c2d12','#c9822a','#d97706','#f59e0b','#fbbf24','#fcd34d','#fde68a','#fef3c7','#fffbeb','#fffff0']

export default function Prescripteurs() {
  const [regions, setRegions]       = useState([])
  const [selRegs, setSelRegs]       = useState([])
  const [lppQuery, setLppQuery]     = useState('')
  const [lppOptions, setLppOptions] = useState([])
  const [selLpp, setSelLpp]         = useState(null)
  const [lppLoading, setLppLoading] = useState(false)
  const [domaines, setDomaines]     = useState([])
  const [selD1, setSelD1]           = useState(null)
  const [selD2, setSelD2]           = useState(null)
  const [selD4, setSelD4]           = useState(null)
  const [yearRange, setYearRange]   = useState([2024, 2024])
  const [limit, setLimit]           = useState(10)
  const [data, setData]             = useState([])
  const [loading, setLoading]       = useState(false)
  const [sortBy, setSortBy]         = useState('qte')
  const [graphMode, setGraphMode]   = useState('pct') // 'pct' | 'eur'

  useEffect(() => {
    fetch('/api/regions').then(r => r.json()).then(d =>
      setRegions(d.map(r => ({ value: r.code, label: r.label })))
    )
    fetch('/api/domaines').then(r => r.json()).then(setDomaines)
  }, [])

  const d2Options = selD1
    ? (domaines.find(d => d.label === selD1.value)?.children || []).map(c => ({ value: c.label, label: c.label }))
    : []
  const d4Options = selD1 && selD2
    ? (domaines.find(d => d.label === selD1.value)?.children.find(c => c.label === selD2.value)?.domaine4 || [])
        .filter(Boolean).map(d => ({ value: d, label: d }))
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
    if (!selLpp || selRegs.length === 0) return
    setLoading(true)
    const params = new URLSearchParams({ year_start: yearRange[0], year_end: yearRange[1], limit })
    selRegs.forEach(r => params.append('regions', r.value))

    if (selLpp.value === '__domaine__') {
      params.set('domaine1', selD1.value)
      if (selD2) params.set('domaine2', selD2.value)
      if (selD4) params.set('domaine4', selD4.value)
    } else {
      params.set('code_lpp', selLpp.value)
    }

    fetch(`/api/prescripteurs?${params}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [selLpp, selRegs, yearRange, limit, selD1, selD2, selD4])

  const sorted = [...data].sort((a, b) => b[sortBy] - a[sortBy])
  const maxQte = sorted.length ? Math.max(...sorted.map(d => d.qte)) : 1
  const maxRem = sorted.length ? Math.max(...sorted.map(d => d.rem)) : 1
  const canQuery = selLpp && selRegs.length > 0

  return (
    <div className="fade-up">
      <div className="page-header">
        <div className="eyebrow">Prescripteurs</div>
        <h2>Spécialités prescriptrices</h2>
      </div>

      <div className="page-body">
        <div className="card" style={{ marginBottom: 28 }}>
          <div className="card-title">
            Paramètres
            <button onClick={() => { setSelD1(null); setSelD2(null); setSelD4(null); setSelLpp(null); setSelRegs([]); setData([]) }}
              style={{ marginLeft: 'auto', padding: '4px 12px', fontSize: '0.72rem', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              ↺ Réinitialiser
            </button>
          </div>

          {/* Filtres domaines */}
          <div style={{ marginBottom: 20, padding: '16px', background: 'rgba(15,45,74,0.04)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
              Filtrer par domaine <span style={{ fontStyle: 'italic', textTransform: 'none', letterSpacing: 0 }}>(optionnel)</span>
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
                <Select classNamePrefix="rs" isClearable options={d2Options} value={selD2}
                  isDisabled={!selD1}
                  onChange={v => { setSelD2(v); setSelD4(null); setSelLpp(null) }}
                  placeholder={selD1 ? 'Tous…' : "— choisir D1 d'abord"}
                />
              </div>
              <div className="form-group">
                <label>Domaine 4</label>
                <Select classNamePrefix="rs" isClearable options={d4Options} value={selD4}
                  isDisabled={!selD2}
                  onChange={v => { setSelD4(v); setSelLpp(null) }}
                  placeholder={selD2 ? 'Tous…' : "— choisir D2 d'abord"}
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
                <button onClick={() => setSelLpp({ value: '__domaine__', label: `Tous les codes — ${selD2?.value || selD1?.value}` })}
                  style={{ marginTop: 6, padding: '4px 12px', fontSize: '0.72rem', background: 'transparent', color: 'var(--navy)', border: '1px solid var(--navy)', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  📋 Sélectionner tous les codes ({lppOptions.length})
                </button>
              )}
            </div>
            <div className="form-group">
              <label>Région(s) <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.68rem', fontStyle: 'italic' }}>— sélection multiple</span></label>
              <Select classNamePrefix="rs" isMulti
                options={regions.filter(r => r.value !== 99)}
                value={selRegs} onChange={setSelRegs}
                placeholder="Sélectionner une ou plusieurs régions…"
              />
              <button onClick={() => setSelRegs(ALL_METRO_REGIONS)} style={{ marginTop: 6, padding: '4px 12px', fontSize: '0.72rem', background: 'transparent', color: 'var(--navy)', border: '1px solid var(--navy)', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                🗺 France entière
              </button>
            </div>
          </div>

          <button onClick={fetchData} disabled={!canQuery} style={{
            marginTop: 24, padding: '10px 28px',
            background: canQuery ? 'var(--navy)' : 'var(--border)',
            color: canQuery ? '#fff' : 'var(--text-muted)',
            border: 'none', borderRadius: 'var(--radius)', cursor: canQuery ? 'pointer' : 'default',
            fontFamily: 'var(--font-body)', fontSize: '0.88rem', fontWeight: 500, transition: 'all 0.2s',
          }}>
            Analyser les prescripteurs →
          </button>
        </div>

        {loading && <div className="loading"><div className="spinner" /> Analyse en cours…</div>}

        {!loading && data.length > 0 && (
          <div className="fade-in">
            {/* Toggle tri + période + nb spécialités */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: 8 }}>Trier par :</span>
              {[{ id: 'qte', label: 'Quantité (QTE)' }, { id: 'rem', label: 'Remboursement (REM)' }].map(s => (
                <button key={s.id} onClick={() => setSortBy(s.id)} style={{
                  padding: '5px 14px',
                  border: `1px solid ${sortBy === s.id ? 'var(--navy)' : 'var(--border)'}`,
                  background: sortBy === s.id ? 'var(--navy)' : 'transparent',
                  color: sortBy === s.id ? '#fff' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '0.78rem',
                  fontFamily: 'var(--font-body)', transition: 'all 0.2s',
                }}>{s.label}</button>
              ))}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Période :</span>
                  {YEARS.map(y => (
                    <button key={y} onClick={() => {
                      if (yearRange[0] === yearRange[1]) setYearRange([y, y])
                      else setYearRange([Math.min(y, yearRange[1]), Math.max(y, yearRange[0])])
                    }} style={{
                      padding: '4px 10px',
                      border: `1px solid ${y >= yearRange[0] && y <= yearRange[1] ? 'var(--navy)' : 'var(--border)'}`,
                      background: y >= yearRange[0] && y <= yearRange[1] ? 'var(--navy)' : 'transparent',
                      color: y >= yearRange[0] && y <= yearRange[1] ? '#fff' : 'var(--text-secondary)',
                      borderRadius: 'var(--radius)', cursor: 'pointer',
                      fontFamily: 'var(--font-mono)', fontSize: '0.75rem', transition: 'all 0.2s',
                    }}>{y}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nb :</span>
                  <select value={limit} onChange={e => { setLimit(+e.target.value); fetchData() }} style={{
                    padding: '4px 8px', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                    background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer',
                  }}>
                    {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Graphique combiné */}
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-title">
                Spécialités prescriptrices
                <span className="subtitle">{yearRange[0] === yearRange[1] ? yearRange[0] : `${yearRange[0]}–${yearRange[1]}`} · trié par {sortBy === 'qte' ? 'quantité' : 'remboursement'}</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 0, border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  {[{ id: 'pct', label: '%' }, { id: 'eur', label: '€' }].map(m => (
                    <button key={m.id} onClick={() => setGraphMode(m.id)} style={{
                      padding: '4px 14px', fontSize: '0.78rem', fontWeight: 600,
                      background: graphMode === m.id ? 'var(--navy)' : 'transparent',
                      color: graphMode === m.id ? '#fff' : 'var(--text-secondary)',
                      border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)',
                      transition: 'all 0.2s',
                    }}>{m.label}</button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={Math.max(300, sorted.length * 40)}>
                <BarChart data={sorted} layout="vertical" margin={{ left: 8, right: 130, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="libelle" width={280}
                    tickFormatter={v => v.length > 40 ? v.substring(0, 40) + '…' : v}
                    style={{ fontFamily: 'var(--font-body)', fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0]?.payload
                      return (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 2, padding: '12px 16px', fontFamily: 'var(--font-body)', fontSize: 12, boxShadow: 'var(--shadow-md)', minWidth: 220 }}>
                          <div style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: 8, fontSize: 13 }}>{d.libelle}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
                            <span style={{ color: 'var(--text-muted)' }}>QTE</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmtNb(d.qte)} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({d.pct_qte}%)</span></span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                            <span style={{ color: 'var(--text-muted)' }}>REM</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmtEur(d.rem)} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({d.pct_rem}%)</span></span>
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Bar
                    dataKey={graphMode === 'pct' ? (sortBy === 'qte' ? 'pct_qte' : 'pct_rem') : sortBy}
                    radius={[0, 2, 2, 0]}
                  >
                    <LabelList
                      dataKey={graphMode === 'pct' ? (sortBy === 'qte' ? 'pct_qte' : 'pct_rem') : sortBy}
                      position="right"
                      formatter={v => {
                        if (graphMode === 'pct') return `${v}%`
                        return sortBy === 'qte' ? fmtNb(v) : fmtEur(v)
                      }}
                      style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--text-secondary)' }}
                    />
                    {sorted.map((d, i) => (
                      <Cell key={i}
                        fill={sortBy === 'qte' ? COLORS_QTE[i % COLORS_QTE.length] : COLORS_REM[i % COLORS_REM.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Tableau combiné QTE + REM */}
            <div className="card">
              <div className="card-title">
                Détail par spécialité
                <span className="subtitle">QTE · Quantité prescrite &nbsp;·&nbsp; REM · Montant remboursé &nbsp;·&nbsp; BSE · Base de remboursement</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <button onClick={() => exportCSV(sorted, `prescripteurs_${selLpp?.value}`)} style={{
                    padding: '4px 12px', fontSize: '0.72rem', background: 'transparent', color: 'var(--navy)',
                    border: '1px solid var(--navy)', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'var(--font-body)',
                  }}>⬇ CSV</button>
                  <button onClick={() => exportExcel(sorted, `prescripteurs_${selLpp?.value}`)} style={{
                    padding: '4px 12px', fontSize: '0.72rem', background: 'var(--navy)', color: '#fff',
                    border: '1px solid var(--navy)', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'var(--font-body)',
                  }}>⬇ Excel</button>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Spécialité</th>
                      <th style={{ textAlign: 'right' }}>QTE</th>
                      <th style={{ textAlign: 'right' }}>% QTE</th>
                      <th>Poids QTE</th>
                      <th style={{ textAlign: 'right' }}>REM €</th>
                      <th style={{ textAlign: 'right' }}>% REM</th>
                      <th style={{ textAlign: 'right' }}>BSE €</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((d, i) => (
                      <tr key={d.code}>
                        <td style={{ color: 'var(--text-muted)', width: 32 }}>{i + 1}</td>
                        <td className="label-cell" title={d.libelle}>{d.libelle}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmtNb(d.qte)}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--navy)' }}>{d.pct_qte}%</td>
                        <td style={{ width: 120, paddingRight: 16 }}>
                          <div style={{ height: 6, borderRadius: 3, background: `linear-gradient(90deg, var(--navy) ${(d.qte / maxQte) * 100}%, var(--border) ${(d.qte / maxQte) * 100}%)` }} />
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmtEur(d.rem)}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--amber)' }}>{d.pct_rem}%</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{fmtEur(d.bse)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!loading && !data.length && canQuery && (
          <div className="empty-state"><div className="icon">◐</div><p>Cliquez sur "Analyser les prescripteurs" pour afficher les résultats.</p></div>
        )}
        {!loading && !data.length && !canQuery && (
          <div className="empty-state"><div className="icon">◐</div><p>Sélectionnez un code LPP et au moins une région pour démarrer.</p></div>
        )}
      </div>
    </div>
  )
}