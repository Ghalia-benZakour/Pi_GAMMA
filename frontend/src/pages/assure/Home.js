import React from 'react';
import { Link } from 'react-router-dom';
import { Calculator, Car, History, ArrowRight, Shield } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';

export default function AssureHome() {
  const { user } = useAuth();
  const cards = [
    { icon: Calculator, label: 'Simuler ma prime', desc: 'Obtenez une estimation de votre prime personnalisée', to: '/assure/simulation', color: 'var(--g100)', iconColor: 'var(--g500)' },
    { icon: Car,        label: 'Déclarer un sinistre', desc: 'Uploadez une photo de votre véhicule endommagé', to: '/assure/damage', color: 'var(--orange-light)', iconColor: 'var(--orange)' },
    { icon: History,    label: 'Mon historique', desc: 'Consultez vos simulations et déclarations passées', to: '/assure/history', color: 'var(--blue-light)', iconColor: 'var(--blue)' },
  ];

  return (
    <AppLayout title="Espace Assuré" subtitle="Bienvenue sur votre espace personnel" page="home">
      <div style={{ maxWidth: 700 }}>
        <div className="alert alert-green" style={{ marginBottom: 20 }}>
          <Shield size={16} />
          <span>Bonjour <strong>{user?.full_name}</strong> — Votre contrat est actif.</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cards.map(c => {
            const Icon = c.icon;
            return (
              <Link key={c.to} to={c.to} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'box-shadow .2s' }}
                     onMouseOver={e => e.currentTarget.style.boxShadow = 'var(--sh-md)'}
                     onMouseOut={e => e.currentTarget.style.boxShadow = 'var(--sh-sm)'}>
                  <div style={{ width: 48, height: 48, background: c.color, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.iconColor, flexShrink: 0 }}>
                    <Icon size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--gray-900)' }}>{c.label}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: 2 }}>{c.desc}</div>
                  </div>
                  <ArrowRight size={18} color="var(--gray-400)" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
