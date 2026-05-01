import React from 'react';
import { Settings } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  return (
    <AppLayout title="Paramètres" subtitle="Configuration de votre compte" page="dashboard">
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><div className="card-title">Informations du compte</div></div>
          <div className="metric-row"><span className="metric-label">Nom complet</span><span className="metric-value">{user?.full_name}</span></div>
          <div className="metric-row"><span className="metric-label">Email</span><span className="metric-value">{user?.email}</span></div>
          <div className="metric-row"><span className="metric-label">Rôle</span>
            <span className={`badge badge-green`}>{user?.role}</span>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">À propos de la plateforme</div></div>
          <div className="metric-row"><span className="metric-label">Version API</span><span className="metric-value">4.0.0</span></div>
          <div className="metric-row"><span className="metric-label">Frontend</span><span className="metric-value">React 18</span></div>
          <div className="metric-row"><span className="metric-label">Backend</span><span className="metric-value">FastAPI</span></div>
        </div>
      </div>
    </AppLayout>
  );
}
