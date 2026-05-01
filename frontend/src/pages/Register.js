import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';import { Briefcase, User, Code2 } from 'lucide-react';

const ROLES = [
  { id: 'assure',    icon: User,      label: 'Assuré',     desc: 'Simuler ma prime et déclarer des sinistres' },
  { id: 'assureur',  icon: Briefcase, label: 'Assureur',   desc: 'Analyser le portefeuille et tarifier' },
  { id: 'developer', icon: Code2,     label: 'Développeur',desc: 'Accéder aux modèles et à l\'API' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]   = useState({ email: '', full_name: '', password: '', role: 'assure' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const u = await register(form);
      if (u.role === 'assureur') navigate('/assureur');
      else if (u.role === 'developer') navigate('/developer');
      else navigate('/assure');
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la création du compte');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-shell">
      <div className="auth-left">
        <div className="auth-card" style={{ maxWidth: 480 }}>
          <div className="auth-logo-row">
            <div className="auth-logo-icon"><Shield size={22} color="#fff" /></div>
            <div>
              <div className="auth-logo-name">PI Assurance</div>
              <div className="auth-logo-tagline">Analytics Platform</div>
            </div>
          </div>

          <div className="auth-title">Créer un compte</div>
          <div className="auth-subtitle">Choisissez votre profil et commencez</div>

          {error && <div className="alert alert-red" style={{ marginBottom: 16 }}>{error}</div>}

          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Nom complet</label>
              <input className="form-input" placeholder="Jean Dupont"
                value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Adresse email</label>
              <input className="form-input" type="email" placeholder="vous@exemple.fr"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input className="form-input" type="password" placeholder="Min. 8 caractères"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>

            <div className="form-group">
              <label className="form-label">Votre profil</label>
              <div className="grid-3" style={{ gap: 8 }}>
                {ROLES.map(r => {
                  const Icon = r.icon;
                  return (
                    <div key={r.id} className={`role-card ${form.role === r.id ? 'selected' : ''}`}
                         onClick={() => setForm({ ...form, role: r.id })}>
                      <div className="role-card-icon"><Icon size={18} /></div>
                      <div className="role-card-label">{r.label}</div>
                      <div className="role-card-desc">{r.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? <span className="spinner" /> : <><UserPlus size={16} />Créer mon compte</>}
            </button>
          </form>

          <div className="auth-footer">
            Déjà un compte ?{' '}
            <Link to="/login" className="auth-link">Se connecter</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
