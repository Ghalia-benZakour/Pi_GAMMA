import React from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';

export function AssureProfil() {
  const { user } = useAuth();
  return (
    <AppLayout title="Mon Profil" subtitle="Vos informations personnelles" page="home">
      <div style={{ maxWidth: 500 }}>
        <div className="card">
          <div className="card-header"><div className="card-title">Informations du compte</div></div>
          <div className="metric-row"><span className="metric-label">Nom complet</span><span className="metric-value">{user?.full_name}</span></div>
          <div className="metric-row"><span className="metric-label">Email</span><span className="metric-value">{user?.email}</span></div>
          <div className="metric-row"><span className="metric-label">Profil</span><span className="badge badge-green">Assuré</span></div>
          <div className="metric-row"><span className="metric-label">Statut</span><span className="badge badge-green">Actif</span></div>
        </div>
      </div>
    </AppLayout>
  );
}
