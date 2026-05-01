import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [demos, setDemos]   = useState([]);

  useEffect(() => {
    if (user) redirectByRole(user.role);
    api.get('/api/auth/demo-credentials').then(r => setDemos(r.data.comptes_demo)).catch(() => {});
  }, [user]);

  const redirectByRole = (role) => {
    if (role === 'assureur')  navigate('/assureur');
    else if (role === 'developer') navigate('/developer');
    else navigate('/assure');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const u = await login(form.email, form.password);
      redirectByRole(u.role);
    } catch (err) {
      setError(err.response?.data?.detail || 'Identifiants incorrects');
    } finally { setLoading(false); }
  };

  const fillDemo = (d) => setForm({ email: d.email, password: d.password });

  const roleLabels = { assureur: 'Assureur', assure: 'Assuré', developer: 'Développeur' };

  return (
    <div className="auth-shell">
      <div className="auth-left">
        <div className="auth-card">
          <div className="auth-logo-row">
            <div className="auth-logo-icon"><Shield size={22} color="#fff" /></div>
            <div>
              <div className="auth-logo-name">PI Assurance</div>
              <div className="auth-logo-tagline">Analytics Platform</div>
            </div>
          </div>

          <div className="auth-title">Connexion</div>
          <div className="auth-subtitle">Accédez à votre espace personnel</div>

          {error && (
            <div className="alert alert-red" style={{ marginBottom: 16 }}>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Adresse email</label>
              <input
                className="form-input"
                type="email"
                placeholder="vous@exemple.fr"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(s => !s)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? <span className="spinner" /> : <><LogIn size={16} />Se connecter</>}
            </button>
          </form>

          <div className="auth-footer">
            Pas encore de compte ?{' '}
            <Link to="/register" className="auth-link">Créer un compte</Link>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-demo-box">
          <div className="auth-demo-title">Comptes de démonstration</div>
          <div className="auth-demo-sub">Cliquez sur un profil pour remplir automatiquement le formulaire</div>
          <div className="auth-demo-cred">
            {demos.map(d => (
              <div key={d.role} className="auth-demo-item" onClick={() => fillDemo(d)}>
                <div className="auth-demo-item-role">{roleLabels[d.role] || d.role}</div>
                <div className="auth-demo-item-email">{d.email}</div>
                <div className="auth-demo-item-pwd">Mot de passe : {d.password}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
