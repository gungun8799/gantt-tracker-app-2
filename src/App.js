import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import './styles/Pages.css';
import { Menu, FileText, Table, BarChart, Clock, List, LogOut, Users } from 'lucide-react';
import ReportEditor from './pages/ReportEditor';
import DataEntryPage from './pages/DataEntryPage';
import ReportPage from './pages/ReportPage';
import RecentUpdatesPage from './pages/RecentUpdatesPage';
import OverallPage from './pages/overall';
import DrillPage from './pages/DrillPage';
import LoginPage from './pages/LoginPage';
import ResourceOverviewPage from './pages/ResourceOverview';
import MassEditPage from './pages/MassEdit';


function Sidebar({ role, onLogout }) {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isExpanded, setIsExpanded] = useState(true);

  const allLinks = [
    {
      path: '/overall',
      label: 'Overall',
      icon: <List size={18} />,
      roles: ['admin', 'viewer', 'user']
    },
    {
      path: '/report',
      label: 'Summary Report',
      icon: <BarChart size={18} />,
      roles: ['admin', 'viewer', 'user']
    },
    {
      path: '/entry',
      label: 'Data Entry',
      icon: <FileText size={18} />,
      roles: ['admin']
    },
    {
      path: '/editor',
      label: 'Report Editor',
      icon: <Table size={18} />,
      roles: ['admin', 'viewer']
    },


    {
      path: '/resources',
      label: 'Resource Overview',
      icon: <Users size={18} />,
      roles: ['admin', 'viewer', 'user']
    },
    {
      path: '/recent',
      label: 'Recent Updates',
      icon: <Clock size={18} />,
      roles: ['admin', 'viewer']
    },
    { path: '/mass-edit', label: 'Mass Edit', icon: <Table size={18}/> /* or any icon */, roles: ['admin'] },

  ];

  const links = allLinks.filter(link => link.roles.includes(role));
  const getClass = (path) => currentPath === path ? 'sidebar-link active' : 'sidebar-link';

  return (
    <div className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button className="sidebar-toggle" onClick={() => setIsExpanded(!isExpanded)}>
        <Menu />
      </button>
      <ul className="sidebar-list">
        {links.map(({ path, label, icon }) => (
          <li key={path}>
            <Link to={path} className={getClass(path)}>
              {icon}
              {isExpanded && <span className="sidebar-label">{label}</span>}
            </Link>
          </li>
        ))}
      </ul>
      <div className="sidebar-logout">
        <button className="sidebar-link logout-btn" onClick={onLogout}>
          <LogOut size={18} />
          {isExpanded && <span className="sidebar-label">Logout</span>}
        </button>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) return <div className="loading-screen">Loading...</div>;

  return (
    <Router>
      <div className="app-layout">
        {isAuthenticated && <Sidebar role={user.role} onLogout={handleLogout} />}
        <div className="main-content">
          <Routes>
            {/* Public */}
            {!isAuthenticated && (
              <>
                <Route path="/" element={
                  <LoginPage setUser={u => {
                    setUser(u);
                    localStorage.setItem('user', JSON.stringify(u));
                  }}/>
                }/>
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}

            {/* Private */}
            {isAuthenticated && (
              <>
                <Route path="/" element={<Navigate to="/overall" replace />} />
                {user.role === 'admin' && <Route path="/entry"      element={<DataEntryPage />} />}
                <Route                        path="/editor"     element={<ReportEditor />} />
                <Route                        path="/report"     element={<ReportPage />} />
                <Route                        path="/overall"    element={<OverallPage />} />
                <Route                        path="/resources"  element={<ResourceOverviewPage />} />
                <Route                        path="/recent"     element={<RecentUpdatesPage />} />
                <Route                        path="/drill/:stageName/:buName" element={<DrillPage />} />
                <Route path="*" element={<Navigate to="/overall" replace />} />
                <Route path="/mass-edit" element={<MassEditPage />} />
              </>
            )}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;