import React, { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../services/api';

export default function AssureHistory() {
  const [sims, setSims]   = useState([]);
  const [dmgs, setDmgs]   = useState([]);
  const [tab, setTab]     = useState('simulations');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/pricing/history?limit=20'),
      api.get('/api/damage/history?limit=20'),
    ]).then(([s,d]) => { setSims(s.data.data||[]); setDmgs(d.data.data||[]); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout title="Mon Historique" subtitle="Vos simulations et déclarations" page="home">
      <div className="tab-nav" style={{ maxWidth: 360 }}>
        <button className={`tab-btn ${tab==='simulations'?'active':''}`} onClick={()=>setTab('simulations')}>Simulations ({sims.length})</button>
        <button className={`tab-btn ${tab==='dommages'?'active':''}`} onClick={()=>setTab('dommages')}>Déclarations ({dmgs.length})</button>
      </div>
      {loading ? <div className="loading-overlay"><div className="spinner"/></div> : (
        <div className="card">
          {tab==='simulations' ? (
            sims.length > 0
              ? <div className="table-wrap"><table>
                  <thead><tr><th>Date</th><th>Véhicule</th><th>Région</th><th>Prime estimée</th><th>Risque</th></tr></thead>
                  <tbody>{sims.map(h=><tr key={h.id}><td>{h.created_at?.slice(0,10)}</td><td>{h.type_vehicule}</td><td>{h.region}</td><td><strong>{h.prime_pure} €</strong></td><td><span className="badge badge-green">{h.niveau_risque}</span></td></tr>)}</tbody>
                </table></div>
              : <div className="empty-state"><History size={32} className="empty-state-icon"/><div className="empty-state-title">Aucune simulation</div></div>
          ) : (
            dmgs.length > 0
              ? <div className="table-wrap"><table>
                  <thead><tr><th>Date</th><th>Dommage</th><th>Coût estimé</th><th>Pièces</th></tr></thead>
                  <tbody>{dmgs.map(h=><tr key={h.id}><td>{h.created_at?.slice(0,10)}</td><td><span className="badge badge-orange">{h.damage_level}</span></td><td>{h.cost_estimate_min?.toLocaleString('fr-FR')} — {h.cost_estimate_max?.toLocaleString('fr-FR')} €</td><td style={{fontSize:'0.75rem'}}>{h.detected_parts?.slice(0,2).join(', ')}</td></tr>)}</tbody>
                </table></div>
              : <div className="empty-state"><History size={32} className="empty-state-icon"/><div className="empty-state-title">Aucune déclaration</div></div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
