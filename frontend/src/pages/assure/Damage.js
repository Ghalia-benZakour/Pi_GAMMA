import React, { useState, useRef } from 'react';
import { Upload, Car, AlertTriangle } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../services/api';

export default function AssureDamage() {
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef              = useRef();

  const handleFile = f => { if (!f) return; setFile(f); setPreview(URL.createObjectURL(f)); setResult(null); };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const r = await api.post('/api/damage/analyze', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(r.data);
    } catch { alert('Erreur lors de l\'analyse'); }
    finally { setLoading(false); }
  };

  const levelColor = { léger: 'badge-green', modéré: 'badge-orange', grave: 'badge-red', 'très grave': 'badge-red' };

  return (
    <AppLayout title="Déclarer un sinistre" subtitle="Uploadez une photo de votre véhicule endommagé" page="damage" chatContext={result}>
      <div style={{ maxWidth: 700 }}>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><div className="card-title">Photo du véhicule</div></div>
          <div className="upload-zone" onClick={() => inputRef.current?.click()}>
            <input ref={inputRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files[0])} />
            {preview
              ? <img src={preview} alt="preview" style={{ maxHeight: 220, maxWidth: '100%', borderRadius: 8 }} />
              : (<>
                  <Upload size={36} color="var(--gray-400)" style={{ marginBottom: 10 }} />
                  <div style={{ fontWeight: 600, color: 'var(--gray-700)' }}>Cliquez pour uploader une photo</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: 4 }}>JPG, PNG — Max 10 Mo</div>
                </>)}
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 14 }}
                  onClick={analyze} disabled={!file || loading}>
            {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} />Analyse...</> : <><Car size={16} />Analyser mon véhicule</>}
          </button>
        </div>

        {result && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">Estimation de votre sinistre</div>
              <span className={`badge ${levelColor[result.damage_level] || 'badge-gray'}`}>{result.damage_level}</span>
            </div>
            <div style={{ padding: '14px', background: 'var(--g50)', border: '1px solid var(--g200)', borderRadius: 'var(--r-sm)', marginBottom: 14 }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                {result.cost_estimate_min?.toLocaleString('fr-FR')} — {result.cost_estimate_max?.toLocaleString('fr-FR')} €
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--g600)', marginTop: 4 }}>Estimation indicative du coût de réparation</div>
            </div>
            <div className="metric-row"><span className="metric-label">Type de dommage</span><span className="badge badge-blue">{result.damage_type}</span></div>
            <div className="metric-row"><span className="metric-label">Confiance</span><span className="metric-value">{(result.confidence*100).toFixed(0)}%</span></div>
            <div style={{ marginTop: 12 }}>
              <div className="section-title">Pièces concernées</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {result.detected_parts?.map(p => <span key={p} className="badge badge-orange">{p}</span>)}
              </div>
            </div>
            <div className="alert alert-blue" style={{ marginTop: 14, fontSize: '0.79rem' }}>
              <AlertTriangle size={14} />
              Cette estimation est indicative. Contactez votre assureur pour ouvrir un dossier officiel.
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
