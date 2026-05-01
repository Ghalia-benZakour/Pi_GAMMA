import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Database, Cpu, Globe, Server } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../services/api';

export default function Developer() {
  const [status, setStatus]   = useState(null);
  const [models, setModels]   = useState([]);
  const [endpoints, setEndpoints] = useState([]);
  const [tab, setTab]         = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/developer/status'),
      api.get('/api/pricing/models'),
      api.get('/api/developer/endpoints'),
    ]).then(([s, m, e]) => {
      setStatus(s.data);
      setModels(m.data.models || []);
      setEndpoints(e.data.endpoints || []);
    }).finally(() => setLoading(false));
  }, []);

  const StatusIcon = ({ ok }) => ok
    ? <CheckCircle size={16} color="var(--g500)" />
    : <XCircle size={16} color="var(--red)" />;

  return (
    <AppLayout title="Monitoring Développeur" subtitle="Statut des services, modèles et API" page="developer">
      <div className="tab-nav" style={{ maxWidth: 480 }}>
        {['overview','models','endpoints'].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'overview' ? 'Vue d\'ensemble' : t === 'models' ? 'Modèles' : 'API Endpoints'}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
        <>
          {tab === 'overview' && status && (
            <>
              <div className="grid-4" style={{ marginBottom: 16 }}>
                {[
                  { label: 'API Backend', icon: Server, ok: status.api?.status === 'operational', val: status.api?.version },
                  { label: 'Base de données', icon: Database, ok: status.database?.status === 'connected', val: 'SQLite' },
                  { label: 'Gemini AI', icon: Cpu, ok: status.gemini?.configured, val: status.gemini?.configured ? 'Configuré' : 'Non configuré' },
                  { label: 'Roboflow CV', icon: Globe, ok: status.roboflow?.configured, val: status.roboflow?.configured ? 'Configuré' : 'Mode démo' },
                ].map(s => {
                  const Icon = s.icon;
                  return (
                    <div className="card" key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ width: 36, height: 36, background: 'var(--g100)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--g500)' }}>
                          <Icon size={18} />
                        </div>
                        <StatusIcon ok={s.ok} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>{s.label}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--gray-500)', marginTop: 2 }}>{s.val}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid-2">
                <div className="card">
                  <div className="card-header"><div className="card-title">Données chargées</div></div>
                  <div className="metric-row"><span className="metric-label">Lignes</span><span className="metric-value">{status.data?.rows?.toLocaleString('fr-FR')}</span></div>
                  <div className="metric-row"><span className="metric-label">Colonnes</span><span className="metric-value">{status.data?.columns}</span></div>
                  <div className="metric-row"><span className="metric-label">Statut</span><span className="badge badge-green">{status.data?.status}</span></div>
                </div>
                <div className="card">
                  <div className="card-header"><div className="card-title">Configuration</div></div>
                  <div className="alert alert-blue" style={{ fontSize: '0.78rem' }}>
                    Configurez <code>GEMINI_API_KEY</code> et <code>ROBOFLOW_API_KEY</code> dans le fichier <code>.env</code> du backend pour activer tous les services.
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === 'models' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {models.map(m => (
                <div className="card" key={m.id}>
                  <div className="card-header">
                    <div>
                      <div className="card-title">{m.name}</div>
                      <div className="card-subtitle">Version {m.version}</div>
                    </div>
                    <span className="badge badge-green">Actif</span>
                  </div>
                  <div className="grid-4" style={{ marginBottom: m.features?.length > 0 ? 14 : 0 }}>
                    {Object.entries(m.metrics || {}).filter(([k]) => k !== 'type').map(([k, v]) => (
                      <div key={k} style={{ padding: '8px 10px', background: 'var(--gray-50)', borderRadius: 'var(--r-sm)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{k}</div>
                        <div style={{ fontWeight: 700, marginTop: 2 }}>{typeof v === 'number' ? v.toFixed ? v.toFixed(3) : v : v}</div>
                      </div>
                    ))}
                  </div>
                  {m.features?.length > 0 && (
                    <>
                      <div className="section-title">Importance des variables</div>
                      <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={m.features} layout="vertical" margin={{ left: 80 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e4ece7" />
                          <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} />
                          <YAxis type="category" dataKey="variable" tick={{ fontSize: 10 }} tickLine={false} width={80} />
                          <Tooltip formatter={v => [(v * 100).toFixed(0) + '%', 'Importance']} />
                          <Bar dataKey="importance" fill="#2a7a46" radius={[0,4,4,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'endpoints' && (
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Méthode</th><th>Route</th><th>Description</th></tr></thead>
                  <tbody>
                    {endpoints.map((e, i) => (
                      <tr key={i}>
                        <td>
                          <span className={`badge ${e.method === 'GET' ? 'badge-blue' : e.method === 'POST' ? 'badge-green' : 'badge-orange'}`}>
                            {e.method}
                          </span>
                        </td>
                        <td><code style={{ fontSize: '0.79rem', background: 'var(--gray-100)', padding: '2px 6px', borderRadius: 4 }}>{e.path}</code></td>
                        <td style={{ color: 'var(--gray-600)' }}>{e.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
