import React, { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../services/api';

export default function HistoryPage() {
  const [sims, setSims]   = useState([]);
  const [dmgs, setDmgs]   = useState([]);
  const [tab, setTab]     = useState('simulations');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/pricing/history?limit=50'),
      api.get('/api/damage/history?limit=50'),
    ]).then(([s, d]) => {
      setSims(s.data.data || []);
      setDmgs(d.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const riskBadge = { faible: 'badge-green', modéré: 'badge-orange', élevé: 'badge-red', 'très élevé': 'badge-red' };
  const dmgBadge  = { léger: 'badge-green', modéré: 'badge-orange', grave: 'badge-red' };

  return (
    <AppLayout title="Historique" subtitle="Simulations et analyses passées" page="dashboard">
      <div className="tab-nav" style={{ maxWidth: 360 }}>
        <button className={`tab-btn ${tab === 'simulations' ? 'active' : ''}`} onClick={() => setTab('simulations')}>
          Simulations ({sims.length})
        </button>
        <button className={`tab-btn ${tab === 'dommages' ? 'active' : ''}`} onClick={() => setTab('dommages')}>
          Analyses dommages ({dmgs.length})
        </button>
      </div>

      {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
        <div className="card">
          {tab === 'simulations' ? (
            sims.length > 0 ? (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>#</th><th>Âge</th><th>Véhicule</th><th>Région</th><th>Prime Pure</th><th>Risque</th><th>Date</th></tr></thead>
                  <tbody>
                    {sims.map(h => (
                      <tr key={h.id}>
                        <td>{h.id}</td><td>{h.age}</td><td>{h.type_vehicule}</td><td>{h.region}</td>
                        <td><strong>{h.prime_pure} €</strong></td>
                        <td><span className={`badge ${riskBadge[h.niveau_risque?.toLowerCase()] || 'badge-gray'}`}>{h.niveau_risque}</span></td>
                        <td style={{ color: 'var(--gray-500)' }}>{h.created_at?.slice(0,16)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="empty-state"><History size={32} className="empty-state-icon" /><div className="empty-state-title">Aucune simulation</div></div>
          ) : (
            dmgs.length > 0 ? (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>#</th><th>Fichier</th><th>Dommage</th><th>Type</th><th>Coût estimé</th><th>Confiance</th><th>Date</th></tr></thead>
                  <tbody>
                    {dmgs.map(h => (
                      <tr key={h.id}>
                        <td>{h.id}</td>
                        <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.filename}</td>
                        <td><span className={`badge ${dmgBadge[h.damage_level] || 'badge-gray'}`}>{h.damage_level}</span></td>
                        <td>{h.damage_type}</td>
                        <td>{h.cost_estimate_min?.toLocaleString('fr-FR')} — {h.cost_estimate_max?.toLocaleString('fr-FR')} €</td>
                        <td>{(h.confidence * 100).toFixed(0)}%</td>
                        <td style={{ color: 'var(--gray-500)' }}>{h.created_at?.slice(0,16)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="empty-state"><History size={32} className="empty-state-icon" /><div className="empty-state-title">Aucune analyse</div></div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
