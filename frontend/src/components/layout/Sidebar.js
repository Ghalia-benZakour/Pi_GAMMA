import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, BarChart2, TrendingUp, Calculator,
  Car, History, MessageCircle, Settings, Shield, Code2, Cpu,
  Database, Home, User, FileText, LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ASSUREUR = [
  { label: 'Navigation', type: 'section' },
  { path: '/assureur',            label: 'Dashboard',     icon: LayoutDashboard, end: true },
  { path: '/assureur/portfolio',  label: 'Portefeuille',  icon: Briefcase },
  { path: '/assureur/eda',        label: 'Analyse EDA',   icon: BarChart2 },
  { path: '/assureur/temporal',   label: 'Analyse Temporelle', icon: TrendingUp },
  { path: '/assureur/simulation', label: 'Tarification',  icon: Calculator, badge: 'NEW' },
  { path: '/assureur/damage',     label: 'Dommages',      icon: Car },
  { path: '/assureur/history',    label: 'Historique',    icon: History },
  { label: 'Système', type: 'section' },
  { path: '/assureur/developer',  label: 'Monitoring',    icon: Cpu },
  { path: '/assureur/settings',   label: 'Paramètres',    icon: Settings },
];

const NAV_ASSURE = [
  { label: 'Mon espace', type: 'section' },
  { path: '/assure',              label: 'Accueil',       icon: Home, end: true },
  { path: '/assure/profil',       label: 'Mon Profil',    icon: User },
  { path: '/assure/simulation',   label: 'Ma Simulation', icon: Calculator },
  { path: '/assure/damage',       label: 'Déclarer un sinistre', icon: Car },
  { path: '/assure/history',      label: 'Historique',    icon: History },
];

const NAV_DEVELOPER = [
  { label: 'Modèles & API', type: 'section' },
  { path: '/developer',               label: 'Vue d\'ensemble', icon: LayoutDashboard, end: true },
  { path: '/developer/models',        label: 'Modèles',         icon: Cpu },
  { path: '/developer/endpoints',     label: 'API Endpoints',   icon: Code2 },
  { path: '/developer/database',      label: 'Base de données', icon: Database },
  { path: '/developer/monitoring',    label: 'Monitoring',      icon: BarChart2 },
];

function NavItem({ item }) {
  if (item.type === 'section') {
    return <div className="sidebar-section-label">{item.label}</div>;
  }
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      end={item.end}
      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
    >
      <span className="nav-icon"><Icon size={15} /></span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.badge && <span className="nav-badge">{item.badge}</span>}
    </NavLink>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = user?.role === 'assureur' ? NAV_ASSUREUR
    : user?.role === 'developer' ? NAV_DEVELOPER
    : NAV_ASSURE;

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const roleLabel = { assureur: 'Actuaire', assure: 'Assuré', developer: 'Développeur' }[user?.role] || '';

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Shield size={18} color="#fff" />
        </div>
        <div className="sidebar-logo-text">
          <div className="sidebar-logo-name">PI Assurance</div>
          <div className="sidebar-logo-sub">Analytics Platform</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, i) => <NavItem key={i} item={item} />)}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.full_name || 'Utilisateur'}
            </div>
            <div className="sidebar-user-role">{roleLabel}</div>
          </div>
          <button
            onClick={handleLogout}
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,.35)', cursor: 'pointer', padding: 4 }}
            title="Se déconnecter"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
