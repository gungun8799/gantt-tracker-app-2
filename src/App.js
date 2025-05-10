import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './styles/Pages.css';

import DataEntryPage from './pages/DataEntryPage';
import ReportEditor from './pages/ReportEditor';
import ReportPage from './pages/ReportPage';
import RecentUpdatesPage from './pages/RecentUpdatesPage';


function Navigation() {
  const location = useLocation();
  const currentPath = location.pathname;

  const getClass = (path) => currentPath === path ? 'btn-active' : 'btn-primary';

  return (
    <nav style={{ borderBottom: '2px solid #f4f4f4', marginBottom: '1rem', paddingBottom: '0.5rem' }}>
      <Link to="/entry" className={getClass('/entry')} style={{ marginRight: '1rem' }}>
        Data Entry
      </Link>
      <Link to="/" className={getClass('/')} style={{ marginRight: '1rem' }}>
        ReportEditor
      </Link>
      <Link to="/report" className={getClass('/report')}>
        Summary Report
      </Link>
      <Link to="/recent" className={getClass('/recent')} style={{ marginLeft: '1rem' }}>
        Recent Updates
      </Link>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="page-container">
        <Navigation />
        <Routes>
          <Route path="/" element={<ReportEditor />} />
          <Route path="/entry" element={<DataEntryPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/recent" element={<RecentUpdatesPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;