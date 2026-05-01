import React, { useEffect, useState } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../services/api';

const METRICS = [
  { key: 'prime_pure', label: 'Prime Pure (€)', color: '#2a7a46' },
  { key: 'frequence',  label: 'Fréquence',      color: '#3182ce' },
  { key: 'severite',   label: 'Sévérité (€)',   color: '#d97706' },
];

export default function Temporal() {
  const [data, setData]     = useState([]);
  const [metric, setMetric] = useState('prime_pure');
  const [years, setYears]   = useState([]);
  const [selYear, setSelYear] = useState('Tous');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/analysis/temporal').then(r => {
      const raw = (r.data.data || [])
        .filter(d => d.Obs_year > 2000 && d.n > 0)
        .sort((a,b) => a.Obs_year - b.Obs_year || a.Obs_month - b.Obs_month)
        .map(r => ({
          label: `${String(r.Obs_month).padStart(2,'0')}/${r.Obs_year}`,
          year: r.Obs_year,
          prime_pure: +Number(r.prime_pure).toFixed(2),
          frequence:  +Number(r.frequence).toFixed(4),
          severite:   +Number(r.severite).toFixed(2),
          n: r.n,
        }));
      setData(raw);
      const uniqYears = [...new Set(raw.map(d => d.year))].sort();
      setYears(uniqYears);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = selYear === 'Tous' ? data : data.filter(d => d.year === Number(selYear));
  const m = METRICS.find(x => x.key === metric);

  const byYear = years.map(y => {
    const rows = data.filter(d => d.year === y);
    const avg  = arr => rows.length ? arr.reduce((a,b) => a + b, 0) / rows.length : 0;
    return {
      year: y,
      prime_pure: +avg(rows.map(r => r.prime_pure)).toFixed(2),
      frequence:  +avg(rows.map(r => r.frequence)).toFixed(4),
      severite:   +avg(rows.map(r => r.severite)).toFixed(2),
    };
  });

  return (
    <AppLayout title="Analyse Temporelle" subtitle="Évolution de la sinistralité dans le temps" page="temporal">
      {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <div>
                <div className="card-title">Évolution mensuelle</div>
                <div className="card-subtitle">{filtered.length} observations</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="tab-nav" style={{ marginBottom: 0 }}>
                  {METRICS.map(x => (
                    <button key={x.key} className={`tab-btn ${metric === x.key ? 'active' : ''}`}
                            onClick={() => setMetric(x.key)}>{x.label.split(' ')[0]}</button>
                  ))}
                </div>
                <select className="form-select" style={{ width: 'auto', fontSize: '0.78rem' }}
                        value={selYear} onChange={e => setSelYear(e.target.value)}>
                  <option>Tous</option>
                  {years.map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>
            {filtered.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={filtered}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={m.color} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={m.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4ece7" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} interval={Math.max(1, Math.floor(filtered.length/12))} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey={metric} stroke={m.color} strokeWidth={2.5}
                        fill="url(#areaGrad)" dot={false} name={m.label} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="empty-state"><div className="empty-state-desc">Aucune donnée disponible</div></div>}
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-header"><div className="card-title">Moyennes annuelles</div></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Année</th><th>Prime Pure</th><th>Fréquence</th><th>Sévérité</th></tr></thead>
                  <tbody>
                    {byYear.map(r => (
                      <tr key={r.year}>
                        <td><strong>{r.year}</strong></td>
                        <td>{r.prime_pure} €</td>
                        <td>{r.frequence}</td>
                        <td>{r.severite} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><div className="card-title">Comparaison Fréquence / Sévérité</div></div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={byYear}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4ece7" />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis yAxisId="l" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="l" type="monotone" dataKey="frequence"  stroke="#3182ce" strokeWidth={2} dot={false} name="Fréquence" />
                  <Line yAxisId="r" type="monotone" dataKey="severite"   stroke="#d97706" strokeWidth={2} dot={false} name="Sévérité (€)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
