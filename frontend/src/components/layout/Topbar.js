import React from 'react';
import { Bell, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ title, subtitle }) {
  const { user } = useAuth();
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  const roleLabel = { assureur: 'Actuaire principal', assure: 'Espace assuré', developer: 'Développeur' }[user?.role] || '';

  return (
    <div className="topbar">
      <div className="topbar-title">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="topbar-spacer" />
      <div className="topbar-date">
        <Calendar size={14} />
        {dateStr}
      </div>
      <button className="topbar-icon-btn"><Bell size={16} /></button>
      <div className="topbar-user-pill">
        <div className="topbar-user-avatar">{initials}</div>
        <div>
          <div className="topbar-user-info-name">{user?.full_name || 'Utilisateur'}</div>
          <div className="topbar-user-info-status">En ligne</div>
        </div>
      </div>
    </div>
  );
}
