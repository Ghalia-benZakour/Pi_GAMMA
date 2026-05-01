import React, { useEffect, useState } from 'react';
import { Calculator } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../services/api';

const RISK_CSS = { faible: 'faible', modéré: 'modere', élevé: 'eleve', 'très élevé': 'tres-eleve' };

export default function AssureSimulation() {
  const [options, setOptions] = useState({});
  const [form, setForm] = useState({
    age: '36-50', experience: '6-10', type_vehicule: 'berline',
    puissance: '76-110cv', region: 'sud', historique_sinistres: '0', anciennete_contrat: '2-5',
  });
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get('/api/pricing/options').then(r => setOptions(r.data)); }, []);

  const simulate = async () => {
    setLoading(true);
    try { const r = await api.post('/api/pricing/simulate', form); setResult(r.data); }
    catch { alert('Erreur lors de la simulation'); }
    finally { setLoading(false); }
  };

  const fields = [
    { key: 'age', label: 'Votre tranche d\'âge' },
    { key: 'experience', label: 'Années de conduite' },
    { key: 'type_vehicule', label: 'Type de véhicule' },
    { key: 'puissance', label: 'Puissance du véhicule' },
    { key: 'region', label: 'Région' },
    { key: 'historique_sinistres', label: 'Sinistres passés' },
    { key: 'anciennete_contrat', label: 'Ancienneté de contrat' },
  ];

  const riskCss = result ? RISK_CSS[result.niveau_risque?.toLowerCase()] || 'modere' : '';

  return (
    <AppLayout title="Ma Simulation" subtitle="Estimez votre prime d'assurance" page="simulation" chatContext={result}>
      <div style={{ maxWidth: 700 }}>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><div className="card-title">Votre profil conducteur</div></div>
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
          <button className="btn btn-primary btn-lg" onClick={simulate} disabled={loading} style={{ width: '100%' }}>
            {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} />Calcul...</> : <><Calculator size={16} />Estimer ma prime</>}
          </button>
        </div>

        {result && (
          <div className={`risk-result ${riskCss}`}>
            <div style={{ marginBottom: 12, fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>Résultat de votre estimation</div>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: 4 }}>{result.prime_pure} €<span style={{ fontSize: '1rem', fontWeight: 400, marginLeft: 6 }}>/an</span></div>
            <div style={{ fontSize: '0.84rem', opacity: .75, marginBottom: 16 }}>Prime pure estimée — hors frais et taxes</div>
            <div style={{ display: 'flex', gap: 24 }}>
              <div><div style={{ fontSize: '0.72rem', opacity: .6 }}>Niveau de risque</div><div style={{ fontWeight: 700 }}>{result.niveau_risque}</div></div>
              <div><div style={{ fontSize: '0.72rem', opacity: .6 }}>Vs. moyenne</div><div style={{ fontWeight: 700 }}>{result.ecart_portefeuille_pct > 0 ? '+' : ''}{result.ecart_portefeuille_pct}%</div></div>
            </div>
            <hr className="divider" />
            <div style={{ fontSize: '0.79rem', opacity: .7 }}>
              {result.interpretations?.slice(0,2).map((x,i) => <p key={i} style={{ marginBottom: 4 }}>{x}</p>)}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
