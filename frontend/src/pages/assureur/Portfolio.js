import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCw } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../services/api';

export default function Portfolio() {
  const [overview, setOverview] = useState(null);
  const [sample, setSample]     = useState([]);
  const [freqData, setFreqData] = useState([]);
  const [variables, setVariables] = useState([]);
  const [selVar, setSelVar]     = useState('Area');
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/analysis/portfolio/overview'),
      api.get('/api/analysis/portfolio/sample?limit=30'),
      api.get('/api/analysis/portfolio/variables'),
    ]).then(([ov, s, v]) => {
      setOverview(ov.data);
      setSample(s.data.data || []);
      const vars = (v.data.variables || []).filter(c => !['ID','Observation_date','Date_birth','Date_driving_licence','Date_start_contract','Date_last_renewal','Date_next_renewal','Date_lapse'].includes(c));
      setVariables(vars.slice(0, 20));
      if (vars.length > 0) setSelVar(vars.includes('Area') ? 'Area' : vars[0]);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selVar) return;
    api.get(`/api/analysis/portfolio/frequency/${selVar}`)
      .then(r => setFreqData(r.data.data || []));
  }, [selVar]);

  const cols = sample.length > 0 ? Object.keys(sample[0]).slice(0, 7) : [];

  return (
    <AppLayout title="Portefeuille" subtitle="Vue complète du portefeuille de contrats" page="portfolio" chatContext={overview}>
      {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
        <>
          {/* KPIs */}
          {overview && (
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
              {[
                { label: 'Observations', value: overview.nb_contrats?.toLocaleString('fr-FR') },
                { label: 'Variables', value: overview.nb_variables },
                { label: 'Fréquence', value: overview.frequence?.toFixed(4) },
                { label: 'Prime Pure', value: `${overview.prime_pure?.toFixed(2)} €` },
                { label: 'Sévérité', value: `${overview.severite?.toFixed(2)} €` },
                { label: 'Sinistres', value: overview.nb_sinistres?.toLocaleString('fr-FR') },
                { label: 'Coût Total', value: `${(overview.cout_total/1e6).toFixed(1)} M€` },
                { label: 'Vals Manquantes', value: overview.valeurs_manquantes?.toLocaleString('fr-FR') },
              ].map(k => (
                <div className="kpi-card" key={k.label} style={{ padding: '14px 16px' }}>
                  <div className="kpi-value" style={{ fontSize: '1.2rem' }}>{k.value}</div>
                  <div className="kpi-label">{k.label}</div>
                </div>
              ))}
            </div>
          )}

          <div className="grid-6-4" style={{ marginBottom: 16 }}>
            {/* Freq chart */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Fréquence par Segment</div>
                <select className="form-select" style={{ width: 'auto', fontSize: '0.78rem', padding: '5px 10px' }}
                        value={selVar} onChange={e => setSelVar(e.target.value)}>
                  {variables.map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              {freqData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={freqData} margin={{ top: 0, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4ece7" />
                    <XAxis dataKey="segment" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={v => [v.toFixed(4), 'Fréquence']} />
                    <Bar dataKey="frequence" fill="#2a7a46" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="loading-overlay"><div className="spinner" /></div>}
            </div>

            {/* Stats */}
            <div className="card">
              <div className="card-header"><div className="card-title">Statistiques</div></div>
              {freqData.slice(0, 8).map(r => (
                <div className="metric-row" key={r.segment}>
                  <span className="metric-label">{String(r.segment).slice(0,18)}</span>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{r.effectif?.toLocaleString('fr-FR')}</span>
                    <span className="badge badge-green">{r.frequence?.toFixed(3)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sample table */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Échantillon des données</div>
              <span className="badge badge-gray">{sample.length} lignes affichées</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>{cols.map(c => <th key={c}>{c}</th>)}</tr>
                </thead>
                <tbody>
                  {sample.map((row, i) => (
                    <tr key={i}>
                      {cols.map(c => <td key={c}>{String(row[c] ?? '').slice(0, 20)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
