import React, { useEffect, useState } from 'react';
import '../styles/Pages.css';
const apiUrl = process.env.REACT_APP_BACKEND_URL;

export default function RecentUpdatesPage() {
  const [updates, setUpdates] = useState([]);
  const [expandedReports, setExpandedReports] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyTimeChanges, setOnlyTimeChanges] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:4000/api/get-reports`)
      .then(res => res.json())
      .then(data => {
        const grouped = {};

        data.forEach(report => {
          if (report.changeLog && Array.isArray(report.changeLog)) {
            grouped[report.reportId] = {
              reportName: report.reportName,
              logs: [...report.changeLog].sort((a, b) => new Date(b.changeDate) - new Date(a.changeDate))
            };
          }
        });

        setUpdates(grouped);
      })
      .catch(err => console.error('❌ Failed to fetch change logs:', err));
  }, []);

  const toggleReport = (id) => {
    setExpandedReports(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredKeys = Object.keys(updates).filter(id => {
    const match = updates[id].reportName.toLowerCase().includes(searchTerm.toLowerCase()) || id.includes(searchTerm);
    const logs = updates[id].logs;
    const hasTimeChange = logs.some(log =>
      log.notes?.toLowerCase().includes('actualstart') || log.notes?.toLowerCase().includes('actualend')
    );
    return match && (!onlyTimeChanges || hasTimeChange);
  });

  return (
    <div className="page-container">
      <h1>🕒 Recent Report Updates</h1>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="🔍 Search by report name or ID"
          className="input"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={onlyTimeChanges}
            onChange={e => setOnlyTimeChanges(e.target.checked)}
          />
          Show only date changes
        </label>
      </div>

      <table className="recent-updates-table">
        <thead>
          <tr>
            <th>Report Name</th>
            <th>Report ID</th>
          </tr>
        </thead>
        <tbody>
          {filteredKeys.map(reportId => {
            const report = updates[reportId];
            const hasDateChange = report.logs.some(
              log => log.notes?.toLowerCase().includes('actualstart') || log.notes?.toLowerCase().includes('actualend')
            );
            return (
              <React.Fragment key={reportId}>
                <tr className="collapsible-header" onClick={() => toggleReport(reportId)}>
                  <td>{hasDateChange ? '⚠️ ' : ''}{report.reportName}</td>
                  <td>{reportId}</td>
                </tr>
                {expandedReports[reportId] && report.logs.map((log, i) => (
                  <tr key={i} className="collapsible-log">
                    <td colSpan="2" style={{ paddingLeft: '2rem' }}>
                      <strong>{log.changeDate && new Date(log.changeDate).toLocaleString()}</strong> — <em>{log.changeType}</em><br />
                      {log.notes}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}