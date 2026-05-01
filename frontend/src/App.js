import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth pages
import Login    from './pages/Login';
import Register from './pages/Register';

// Assureur pages
import AssureurDashboard from './pages/assureur/Dashboard';
import Portfolio         from './pages/assureur/Portfolio';
import EDA               from './pages/assureur/EDA';
import Temporal          from './pages/assureur/Temporal';
import AssureurSimulation from './pages/assureur/Simulation';
import Damage            from './pages/assureur/Damage';
import HistoryPage       from './pages/assureur/HistoryPage';
import Developer         from './pages/assureur/Developer';
import Settings          from './pages/assureur/Settings';

// Assure pages
import AssureHome       from './pages/assure/Home';
import AssureSimulation from './pages/assure/Simulation';
import AssureDamage     from './pages/assure/Damage';
import AssureHistory    from './pages/assure/History';
import { AssureProfil } from './pages/assure/Profil';

// Developer pages
import DevOverview from './pages/developer/Overview';


function RequireAuth({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role === 'assureur' ? 'assureur' : user.role === 'developer' ? 'developer' : 'assure'}`} replace />;
  return children;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'assureur')  return <Navigate to="/assureur" replace />;
  if (user.role === 'developer') return <Navigate to="/developer" replace />;
  return <Navigate to="/assure" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Assureur */}
          <Route path="/assureur" element={<RequireAuth role="assureur"><AssureurDashboard /></RequireAuth>} />
          <Route path="/assureur/portfolio"  element={<RequireAuth role="assureur"><Portfolio /></RequireAuth>} />
          <Route path="/assureur/eda"        element={<RequireAuth role="assureur"><EDA /></RequireAuth>} />
          <Route path="/assureur/temporal"   element={<RequireAuth role="assureur"><Temporal /></RequireAuth>} />
          <Route path="/assureur/simulation" element={<RequireAuth role="assureur"><AssureurSimulation /></RequireAuth>} />
          <Route path="/assureur/damage"     element={<RequireAuth role="assureur"><Damage /></RequireAuth>} />
          <Route path="/assureur/history"    element={<RequireAuth role="assureur"><HistoryPage /></RequireAuth>} />
          <Route path="/assureur/developer"  element={<RequireAuth role="assureur"><Developer /></RequireAuth>} />
          <Route path="/assureur/settings"   element={<RequireAuth role="assureur"><Settings /></RequireAuth>} />

          {/* Assure */}
          <Route path="/assure"              element={<RequireAuth role="assure"><AssureHome /></RequireAuth>} />
          <Route path="/assure/profil"       element={<RequireAuth role="assure"><AssureProfil /></RequireAuth>} />
          <Route path="/assure/simulation"   element={<RequireAuth role="assure"><AssureSimulation /></RequireAuth>} />
          <Route path="/assure/damage"       element={<RequireAuth role="assure"><AssureDamage /></RequireAuth>} />
          <Route path="/assure/history"      element={<RequireAuth role="assure"><AssureHistory /></RequireAuth>} />

          {/* Developer */}
          <Route path="/developer"            element={<RequireAuth role="developer"><DevOverview /></RequireAuth>} />
          <Route path="/developer/models"     element={<RequireAuth role="developer"><DevOverview /></RequireAuth>} />
          <Route path="/developer/endpoints"  element={<RequireAuth role="developer"><DevOverview /></RequireAuth>} />
          <Route path="/developer/database"   element={<RequireAuth role="developer"><DevOverview /></RequireAuth>} />
          <Route path="/developer/monitoring" element={<RequireAuth role="developer"><DevOverview /></RequireAuth>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
