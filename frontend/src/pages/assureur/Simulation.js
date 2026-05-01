import React, { useEffect, useState } from 'react';
import { Calculator, TrendingUp, AlertTriangle, ChevronDown } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../services/api';

const RISK_COLORS = { faible: 'green', modéré: 'orange', élevé: 'red', 'très élevé': 'red' };
const RISK_CSS    = { faible: 'faible', modéré: 'modere', élevé: 'eleve', 'très élevé': 'tres-eleve' };

export default function Simulation() {
  const [options, setOptions] = useState({});
  const [form, setForm] = useState({
    age: '36-50', experience: '6-10', type_vehicule: 'berline',
    puissance: '76-110cv', region: 'sud', historique_sinistres: '0',
    anciennete_contrat: '2-5', modele: 'glm_poisson_gamma',
  });
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.get('/api/pricing/options').then(r => setOptions(r.data));
    api.get('/api/pricing/history').then(r => setHistory(r.data.data || []));
  }, []);

  const simulate = async () => {
    setLoading(true);
    try {
      const r = await api.post('/api/pricing/simulate', form);
      setResult(r.data);
      api.get('/api/pricing/history').then(r2 => setHistory(r2.data.data || []));
    } catch(e) {
      alert('Erreur lors de la simulation');
    } finally { setLoading(false); }
  };

  const fields = [
    { key: 'age', label: 'Tranche d\'âge' },
    { key: 'experience', label: 'Expérience conduite' },
    { key: 'type_vehicule', label: 'Type de véhicule' },
    { key: 'puissance', label: 'Puissance' },
    { key: 'region', label: 'Région' },
    { key: 'historique_sinistres', label: 'Historique sinistres' },
    { key: 'anciennete_contrat', label: 'Ancienneté contrat' },
  ];

  const relFreq  = result?.relativites_frequence || [];
  const relSev   = result?.relativites_severite  || [];
  const radarData = relFreq.map(r => ({ var: r.variable.replace('_',' '), relativity: r.relativite }));
  const riskCss = result ? RISK_CSS[result.niveau_risque?.toLowerCase()] || 'modere' : '';

  return (
    <AppLayout title="Tarification" subtitle="Simulation de prime actuarielle GLM" page="simulation" chatContext={result}>
      <div className="grid-6-4">
        {/* Form */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Profil à tarifer</div>
              <div className="card-subtitle">Renseignez les caractéristiques du contrat</div>
            </div>
          </div>
          <div className="form-grid-2">
            {fields.map(f => (
              <div className="form-group" key={f.key}>
                <label className="form-label">{f.label}</label>
                <select className="form-select" value={form[f.key]}
                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}>
                  {(options[f.key] || [form[f.key]]).map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="form-group">
            <label className="form-label">Modèle actuariel</label>
            <select className="form-select" value={form.modele}
                    onChange={e => setForm({ ...form, modele: e.target.value })}>
              <option value="glm_poisson_gamma">GLM Poisson × Gamma (standard)</option>
              <option value="tweedie">GLM Tweedie (prime directe)</option>
            </select>
          </div>
          <button className="btn btn-primary btn-lg" onClick={simulate} disabled={loading} style={{ width: '100%' }}>
            {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} />Calcul en cours...</> : <><Calculator size={16} />Calculer la prime</>}
          </button>
        </div>

        {/* Result */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {result ? (
            <>
              <div className={`risk-result ${riskCss}`}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Résultat</span>
                  <span className={`badge badge-${RISK_COLORS[result.niveau_risque?.toLowerCase()] || 'orange'}`}>{result.niveau_risque}</span>
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 4 }}>{result.prime_pure} €</div>
                <div style={{ fontSize: '0.82rem', opacity: .75 }}>Prime pure estimée</div>
                <hr className="divider" />
                <div className="form-grid-2" style={{ gap: 8 }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', opacity: .65, marginBottom: 2 }}>Fréquence</div>
                    <div style={{ fontWeight: 700 }}>{result.frequence_estimee}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', opacity: .65, marginBottom: 2 }}>Sévérité</div>
                    <div style={{ fontWeight: 700 }}>{result.severite_estimee} €</div>
                  </div>
                </div>
                <div style={{ marginTop: 10, fontSize: '0.78rem', opacity: .75 }}>
                  Écart vs portefeuille : <strong>{result.ecart_portefeuille_pct > 0 ? '+' : ''}{result.ecart_portefeuille_pct}%</strong>
                </div>
              </div>

              <div className="card">
                <div className="card-title" style={{ marginBottom: 12 }}>Relativités Fréquence</div>
                {relFreq.map(r => (
                  <div className="metric-row" key={r.variable}>
                    <span className="metric-label">{r.variable} ({r.valeur})</span>
                    <span className={`badge ${r.relativite > 1 ? 'badge-orange' : 'badge-green'}`}>×{r.relativite}</span>
                  </div>
                ))}
              </div>

              <div className="card">
                <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                  {result.interpretations?.map((x, i) => <p key={i} style={{ marginBottom: 6 }}>{x}</p>)}
                </div>
              </div>
            </>
          ) : (
            <div className="card">
              <div className="empty-state">
                <Calculator size={36} className="empty-state-icon" />
                <div className="empty-state-title">Aucune simulation</div>
                <div className="empty-state-desc">Remplissez le formulaire et cliquez sur Calculer</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <div className="card-title">Historique des simulations</div>
            <span className="badge badge-gray">{history.length}</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Âge</th><th>Véhicule</th><th>Région</th><th>Prime Pure</th><th>Risque</th><th>Date</th></tr></thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id}>
                    <td>{h.id}</td>
                    <td>{h.age}</td>
                    <td>{h.type_vehicule}</td>
                    <td>{h.region}</td>
                    <td><strong>{h.prime_pure} €</strong></td>
                    <td><span className={`badge badge-${RISK_COLORS[h.niveau_risque?.toLowerCase()] || 'gray'}`}>{h.niveau_risque}</span></td>
                    <td style={{ color: 'var(--gray-500)' }}>{h.created_at?.slice(0,16)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
