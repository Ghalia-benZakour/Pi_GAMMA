import React, { useEffect, useState } from 'react';
import { Users, Shield, Euro, TrendingUp, AlertTriangle, CheckCircle, Info, ArrowRight } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Link } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../services/api';

const COLORS = ['#2a7a46', '#3a9960', '#52b878', '#d97706', '#9dddb8'];

export default function AssureurDashboard() {
  const [stats, setStats]   = useState(null);
  const [temporal, setTemporal] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/analysis/dashboard/stats'),
      api.get('/api/analysis/temporal'),
    ]).then(([s, t]) => {
      setStats(s.data);
      const raw = t.data.data || [];
      const sorted = raw.sort((a, b) => a.Obs_year - b.Obs_year || a.Obs_month - b.Obs_month);
      setTemporal(sorted.slice(-24).map(r => ({
        label: `${String(r.Obs_month).padStart(2,'0')}/${r.Obs_year}`,
        prime_pure: +r.prime_pure.toFixed(2),
        frequence: +r.frequence.toFixed(4),
        severite: +r.severite.toFixed(2),
      })));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const kpis = stats ? [
    { label: 'Contrats Total', value: stats.nb_contrats?.toLocaleString('fr-FR'), icon: Users, color: 'var(--g100)', iconColor: 'var(--g500)' },
    { label: 'Fréquence Moyenne', value: stats.frequence?.toFixed(4), icon: Shield, color: 'var(--blue-light)', iconColor: 'var(--blue)' },
    { label: 'Sévérité Moyenne', value: `${stats.severite?.toFixed(2)} €`, icon: Euro, color: 'var(--orange-light)', iconColor: 'var(--orange)' },
    { label: 'Prime Pure Moyenne', value: `${stats.prime_pure?.toFixed(2)} €`, icon: TrendingUp, color: 'var(--g100)', iconColor: 'var(--g500)' },
  ] : [];

  const contractTypes = [
    { name: 'Auto', value: 75.2 }, { name: 'Habitation', value: 12.6 },
    { name: 'Santé', value: 7.8 }, { name: 'Autres', value: 4.4 },
  ];

  const alerts = [
    { type: 'error', icon: AlertTriangle, title: 'Sinistralité élevée détectée', sub: 'Segment Conducteur Jeune', time: '14:30' },
    { type: 'warning', icon: Info, title: 'Dérive de fréquence', sub: 'Augmentation vs période précédente', time: '11:15' },
    { type: 'success', icon: CheckCircle, title: 'Modèles mis à jour', sub: 'GLM recalibrés avec succès', time: 'Hier' },
  ];

  const alertColors = { error: 'var(--red)', warning: 'var(--orange)', success: 'var(--g500)' };
  const alertBg     = { error: 'var(--red-light)', warning: 'var(--orange-light)', success: 'var(--g50)' };

  if (loading) return (
    <AppLayout title="Dashboard" subtitle="Vue d'ensemble du portefeuille assurance" page="dashboard">
      <div className="loading-overlay"><div className="spinner" /><span>Chargement des données...</span></div>
    </AppLayout>
  );

  return (
    <AppLayout title="Dashboard" subtitle="Vue d'ensemble du portefeuille assurance auto" page="dashboard" chatContext={stats}>
      {/* KPIs */}
      <div className="kpi-grid">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <div className="kpi-card" key={k.label}>
              <div className="kpi-icon-row">
                <div className="kpi-icon" style={{ background: k.color, color: k.iconColor }}><Icon size={20} /></div>
              </div>
              <div className="kpi-value">{k.value ?? '—'}</div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-compare">vs mois dernier</div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid-7-5" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Évolution de la Prime Pure</div>
              <div className="card-subtitle">24 derniers mois</div>
            </div>
          </div>
          {temporal.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={temporal}>
                <defs>
                  <linearGradient id="ppGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2a7a46" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#2a7a46" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4ece7" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} interval={2} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={v => [`${v} €`, 'Prime pure']} />
                <Area type="monotone" dataKey="prime_pure" stroke="#2a7a46" strokeWidth={2} fill="url(#ppGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><div className="empty-state-desc">Données temporelles insuffisantes</div></div>}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Répartition par Type</div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={contractTypes} cx="40%" cy="50%" innerRadius={55} outerRadius={80}
                   dataKey="value" paddingAngle={3}>
                {contractTypes.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={v => [`${v}%`]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {contractTypes.map((c, i) => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i], flexShrink: 0 }} />
                <span style={{ flex: 1, color: 'var(--gray-600)' }}>{c.name}</span>
                <span style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid-3">
        <div className="card">
          <div className="card-header"><div className="card-title">Indicateurs Clés</div></div>
          {stats && [
            { label: 'Taux de Sinistralité', value: `${stats.taux_sinistralite?.toFixed(1)}%` },
            { label: 'Nombre de Sinistres', value: stats.nb_sinistres?.toLocaleString('fr-FR') },
            { label: 'Coût Total Sinistres', value: `${(stats.cout_total / 1e6)?.toFixed(1)} M€` },
          ].map(m => (
            <div className="metric-row" key={m.label}>
              <span className="metric-label">{m.label}</span>
              <span className="metric-value">{m.value}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">Alertes & Notifications</div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 10px', borderRadius: 'var(--r-sm)', background: alertBg[a.type] }}>
                  <Icon size={14} color={alertColors[a.type]} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.79rem', fontWeight: 600, color: alertColors[a.type] }}>{a.title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>{a.sub}</div>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>{a.time}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="card-header"><div className="card-title">Accès Rapide</div></div>
          {[
            { label: 'Lancer une simulation', to: '/assureur/simulation', desc: 'Calculer une prime personnalisée' },
            { label: 'Analyse EDA', to: '/assureur/eda', desc: 'Explorer les données' },
            { label: 'Détecter des dommages', to: '/assureur/damage', desc: 'Analyser une photo véhicule' },
          ].map(l => (
            <Link key={l.to} to={l.to} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 'var(--r-sm)', background: 'var(--gray-50)', border: '1px solid var(--gray-200)', textDecoration: 'none', transition: 'background .15s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--g50)'}
                  onMouseOut={e => e.currentTarget.style.background = 'var(--gray-50)'}>
              <div>
                <div style={{ fontSize: '0.81rem', fontWeight: 600, color: 'var(--gray-800)' }}>{l.label}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>{l.desc}</div>
              </div>
              <ArrowRight size={14} color="var(--gray-400)" />
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
