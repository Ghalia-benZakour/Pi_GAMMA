import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../services/api';

export default function EDA() {
  const [summary, setSummary]   = useState(null);
  const [correlations, setCorrelations] = useState([]);
  const [distData, setDistData] = useState([]);
  const [selDist, setSelDist]   = useState('Premium');
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/analysis/eda/summary'),
      api.get('/api/analysis/eda/correlations'),
    ]).then(([s, c]) => {
      setSummary(s.data);
      setCorrelations(c.data.variables_importantes || []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get(`/api/analysis/portfolio/distribution/${selDist}`)
      .then(r => setDistData(r.data.data || []));
  }, [selDist]);

  const statCards = summary ? [
    { label: 'Observations', value: summary.nb_observations?.toLocaleString('fr-FR') },
    { label: '% avec sinistre', value: `${summary.pct_sinistres?.toFixed(2)}%` },
    { label: 'Prime moy.', value: `${summary.prime?.moyenne?.toFixed(2)} €` },
    { label: 'Sévérité moy.', value: `${summary.cout_sinistre?.moyenne?.toFixed(2)} €` },
    { label: 'Âge conducteur moy.', value: `${summary.age_conducteur?.moyenne?.toFixed(1)} ans` },
    { label: 'Expérience moy.', value: `${summary.experience?.moyenne?.toFixed(1)} ans` },
  ] : [];

  const statBlocks = summary ? [
    { label: 'Prime commerciale', stat: summary.prime },
    { label: 'Coût sinistres', stat: summary.cout_sinistre },
    { label: 'Âge conducteur', stat: summary.age_conducteur },
    { label: 'Expérience conduite', stat: summary.experience },
    { label: 'Âge véhicule', stat: summary.age_vehicule },
  ] : [];

  return (
    <AppLayout title="Analyse EDA" subtitle="Exploration des données actuarielles" page="eda" chatContext={summary}>
      {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
        <>
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(6,1fr)', marginBottom: 16 }}>
            {statCards.map(k => (
              <div className="kpi-card" key={k.label} style={{ padding: '12px 14px' }}>
                <div className="kpi-value" style={{ fontSize: '1rem' }}>{k.value}</div>
                <div className="kpi-label" style={{ fontSize: '0.72rem' }}>{k.label}</div>
              </div>
            ))}
          </div>

          <div className="grid-2" style={{ marginBottom: 16 }}>
            {/* Distribution */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Distribution</div>
                <select className="form-select" style={{ width: 'auto', fontSize: '0.78rem', padding: '5px 10px' }}
                        value={selDist} onChange={e => setSelDist(e.target.value)}>
                  {['Premium','Age_driver','Driving_experience','Vehicle_age'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              {distData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={distData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4ece7" />
                    <XAxis dataKey="bin_start" tick={{ fontSize: 9 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={v => [v, 'Contrats']} />
                    <Bar dataKey="count" fill="#2a7a46" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="loading-overlay"><div className="spinner" /></div>}
            </div>

            {/* Feature importance */}
            <div className="card">
              <div className="card-header"><div className="card-title">Importance des Variables</div></div>
              {correlations.map(c => (
                <div key={c.variable} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{c.variable}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className={`badge badge-${c.direction === 'positif' ? 'green' : c.direction === 'negatif' ? 'blue' : 'orange'}`}>{c.direction}</span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{(c.importance * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${c.importance * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats table */}
          <div className="card">
            <div className="card-header"><div className="card-title">Statistiques Descriptives</div></div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Variable</th><th>Min</th><th>Max</th><th>Moyenne</th><th>Médiane</th><th>Écart-type</th>
                  </tr>
                </thead>
                <tbody>
                  {statBlocks.filter(b => b.stat).map(b => (
                    <tr key={b.label}>
                      <td><strong>{b.label}</strong></td>
                      <td>{b.stat.min?.toLocaleString('fr-FR')}</td>
                      <td>{b.stat.max?.toLocaleString('fr-FR')}</td>
                      <td>{b.stat.moyenne?.toLocaleString('fr-FR')}</td>
                      <td>{b.stat.mediane?.toLocaleString('fr-FR')}</td>
                      <td>{b.stat.ecart_type?.toLocaleString('fr-FR')}</td>
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
