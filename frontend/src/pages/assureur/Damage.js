import React, { useState, useRef } from 'react';
import { Upload, Car, AlertTriangle, CheckCircle, Image } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../services/api';

export default function Damage() {
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult]   = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [histLoaded, setHistLoaded] = useState(false);
  const inputRef = useRef();

  const loadHistory = () => {
    if (histLoaded) return;
    api.get('/api/damage/history').then(r => { setHistory(r.data.data || []); setHistLoaded(true); });
  };

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const r = await api.post('/api/damage/analyze', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(r.data);
      setHistLoaded(false);
    } catch {
      alert('Erreur lors de l\'analyse. Vérifiez le backend.');
    } finally { setLoading(false); }
  };

  const levelColor = { léger: 'badge-green', modéré: 'badge-orange', grave: 'badge-red', 'très grave': 'badge-red', indéterminé: 'badge-gray' };

  return (
    <AppLayout title="Détection de Dommages" subtitle="Analyse visuelle d'un véhicule endommagé" page="damage" chatContext={result}>
      <div className="grid-6-4" style={{ marginBottom: 16 }}>
        {/* Upload zone */}
        <div className="card">
          <div className="card-header"><div className="card-title">Uploader une image</div></div>

          <div
            className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          >
            <input ref={inputRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files[0])} />
            {preview ? (
              <img src={preview} alt="preview" style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' }} />
            ) : (
              <>
                <Upload size={36} color="var(--gray-400)" style={{ marginBottom: 10 }} />
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--gray-700)' }}>Glissez ou cliquez pour uploader</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: 4 }}>JPG, PNG — Max 10 Mo</div>
              </>
            )}
          </div>

          {file && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--gray-50)', borderRadius: 'var(--r-sm)', fontSize: '0.79rem', color: 'var(--gray-600)' }}>
              <strong>{file.name}</strong> — {(file.size/1024).toFixed(0)} Ko
            </div>
          )}

          <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 14 }}
                  onClick={analyze} disabled={!file || loading}>
            {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} />Analyse en cours...</> : <><Car size={16} />Analyser les dommages</>}
          </button>
        </div>

        {/* Result */}
        <div>
          {result ? (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Résultat de l'analyse</div>
                <span className={`badge ${levelColor[result.damage_level] || 'badge-gray'}`}>{result.damage_level}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: '12px 14px', background: 'var(--g50)', border: '1px solid var(--g200)', borderRadius: 'var(--r-sm)' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--gray-900)' }}>
                    {result.cost_estimate_min?.toLocaleString('fr-FR')} — {result.cost_estimate_max?.toLocaleString('fr-FR')} €
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--g600)', marginTop: 2 }}>Estimation du coût de réparation</div>
                </div>

                <div className="metric-row">
                  <span className="metric-label">Type de dommage</span>
                  <span className="badge badge-blue">{result.damage_type}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Confiance du modèle</span>
                  <span className="metric-value">{(result.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Détections</span>
                  <span className="metric-value">{result.nb_detections}</span>
                </div>

                <div>
                  <div className="section-title">Pièces détectées</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {result.detected_parts?.map(p => (
                      <span key={p} className="badge badge-orange">{p}</span>
                    ))}
                    {!result.detected_parts?.length && <span className="badge badge-gray">Aucune pièce identifiée</span>}
                  </div>
                </div>

                {result.source?.includes('demo') && (
                  <div className="alert alert-orange" style={{ fontSize: '0.75rem' }}>
                    <AlertTriangle size={14} />
                    Mode démo — Configurez ROBOFLOW_API_KEY pour la détection réelle.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="empty-state">
                <Image size={40} className="empty-state-icon" />
                <div className="empty-state-title">En attente d'une image</div>
                <div className="empty-state-desc">Uploadez une photo de véhicule endommagé pour commencer l'analyse</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Historique des analyses</div>
          <button className="btn btn-secondary btn-sm" onClick={loadHistory}>Charger</button>
        </div>
        {history.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Fichier</th><th>Dommage</th><th>Type</th><th>Coût estimé</th><th>Confiance</th><th>Date</th></tr></thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id}>
                    <td>{h.id}</td>
                    <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.filename}</td>
                    <td><span className={`badge ${levelColor[h.damage_level] || 'badge-gray'}`}>{h.damage_level}</span></td>
                    <td>{h.damage_type}</td>
                    <td>{h.cost_estimate_min?.toLocaleString('fr-FR')} — {h.cost_estimate_max?.toLocaleString('fr-FR')} €</td>
                    <td>{(h.confidence * 100).toFixed(0)}%</td>
                    <td style={{ color: 'var(--gray-500)' }}>{h.created_at?.slice(0,16)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: 24 }}>
            <div className="empty-state-desc">Aucune analyse dans l'historique. Cliquez sur Charger.</div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
