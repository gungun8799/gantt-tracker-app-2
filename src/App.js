import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './styles/Pages.css';
import { Menu, FileText, Table, BarChart, Clock, List } from 'lucide-react';

import DataEntryPage from './pages/DataEntryPage';
import ReportEditor from './pages/ReportEditor';
import ReportPage from './pages/ReportPage';
import RecentUpdatesPage from './pages/RecentUpdatesPage';
import OverallPage from './pages/overall';
import DrillPage from './pages/DrillPage';

function Sidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isExpanded, setIsExpanded] = useState(true);

  const links = [
    { path: '/entry', label: 'Data Entry', icon: <FileText size={18} /> },
    { path: '/', label: 'ReportEditor', icon: <Table size={18} /> },
    { path: '/report', label: 'Summary Report', icon: <BarChart size={18} /> },
    { path: '/overall', label: 'Overall', icon: <List size={18} /> },
    { path: '/recent', label: 'Recent Updates', icon: <Clock size={18} /> },
  ];

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
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<ReportEditor />} />
            <Route path="/entry" element={<DataEntryPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/recent" element={<RecentUpdatesPage />} />
            <Route path="/overall" element={<OverallPage />} />
            <Route path="/drill/:stageName" element={<DrillPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;