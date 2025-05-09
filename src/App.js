import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './styles/Pages.css'; // ✅ Ensure your styles are applied

import DataEntryPage from './pages/DataEntryPage';
import ReportEditor from './pages/ReportEditor';
import ReportPage from './pages/ReportPage';

function App() {
  return (
    <Router>
      <div className="page-container">
        <nav style={{ borderBottom: '2px solid #f4f4f4', marginBottom: '1rem', paddingBottom: '0.5rem' }}>
          <Link to="/" className="btn-primary" style={{ marginRight: '1rem' }}>ReportEditor</Link>
          <Link to="/entry" className="btn-primary" style={{ marginRight: '1rem' }}>Data Entry</Link>
          <Link to="/report" className="btn-primary">Summary Report</Link>
        </nav>

        <Routes>
          <Route path="/" element={<ReportEditor />} />
          <Route path="/entry" element={<DataEntryPage />} />
          <Route path="/report" element={<ReportPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;