import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chart } from 'react-google-charts';
import '../styles/Pages.css';
const apiUrl = process.env.REACT_APP_BACKEND_URL;

export default function DrillPage() {
  const { stageName } = useParams();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [expandedCharts, setExpandedCharts] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetch(`${apiUrl}/api/get-reports`)
      .then(res => res.json())
      .then(data => {
        const filtered = data.filter(r => r.currentStage === stageName);
        setReports(filtered);
      })
      .catch(err => console.error('❌ Failed to fetch reports:', err));
  }, [stageName]);

  const columns = [
    { type: 'string', label: 'Task ID' },
    { type: 'string', label: 'Task Name' },
    { type: 'string', label: 'Resource' },
    { type: 'date', label: 'Start Date' },
    { type: 'date', label: 'End Date' },
    { type: 'number', label: 'Duration' },
    { type: 'number', label: 'Percent Complete' },
    { type: 'string', label: 'NoDeps' },
  ];

  const getStageRows = (report) => {
    const stage = report.usedBy?.[0]?.stages?.find(s => s.stageName === stageName);
    const rows = [];

    if (stage?.plannedStart && stage?.plannedEnd) {
      rows.push([
        `${report.reportId}-planned`,
        `${stage.stageName} (Planned)`,
        'Planned',
        new Date(stage.plannedStart),
        new Date(stage.plannedEnd),
        null,
        0,
        ''
        
      ]);
    }

    if (stage?.actualStart && stage?.actualEnd) {
      rows.push([
        `${report.reportId}-actual`,
        `${stage.stageName} (Actual)`,
        'Actual',
        new Date(stage.actualStart),
        new Date(stage.actualEnd),
        null,
        0,
        ''
      ]);
    }

    return rows;
  };

  const daysSinceUpdate = (timestamp) => {
    if (!timestamp) return <span className="days-tag">No update</span>;
  
    const last = new Date(timestamp);
    if (isNaN(last)) return <span className="days-tag">Invalid date</span>;
  
    const now = new Date();
    
    // Convert both dates to YYYY-MM-DD format to strip time component
    const dateOnly = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diff = Math.floor((dateOnly(now) - dateOnly(last)) / (1000 * 60 * 60 * 24));
  
    let color = 'blue';
    if (diff >= 3 && diff <= 4) color = 'orange';
    if (diff >= 5) color = 'red';
  
    return (
      <span className={`days-tag ${color}`}>
        {diff} day{diff !== 1 ? 's' : ''} ago
      </span>
    );
  };

  const toggleChart = (reportId) => {
    setExpandedCharts(prev => ({ ...prev, [reportId]: !prev[reportId] }));
  };

  return (
    <div className="page-container">
      <h1>📊 Drill Down: {stageName}</h1>
      <button className="btn-back" onClick={() => navigate('/overall')}>
        ← Back to Overall
      </button>

      {reports.map((report) => {
        const stage = report.usedBy?.[0]?.stages?.find(s => s.stageName === stageName);
        const stageRows = getStageRows(report);
        const chartExpanded = expandedCharts[report.reportId] || false;

        return (
          <div key={report.reportId} className="report-block">
            <h2
  className="section-title-2"
  style={{ cursor: 'pointer' }}
  onClick={() => toggleChart(report.reportId)}
>
  {report.reportName} ({report.reportId}) {' '}
  {daysSinceUpdate(report.changeLog?.[0]?.changeDate)}
</h2>

{chartExpanded && (
  <div className="report-meta-horizontal">
    <div className="tag-group">
      <span className="tag-label">BU:</span>
      <span className="tag">{report.usedBy?.[0]?.buName || '-'}</span>
    </div>
    <div className="tag-group">
      <span className="tag-label">Owner:</span>
      {(report.businessOwners || ['-']).map((o, i) => (
        <span key={i} className="tag">{o}</span>
      ))}
    </div>
    <div className="tag-group">
      <span className="tag-label">PICs:</span>
      {(stage?.PICs || ['-']).map((p, i) => (
        <span key={i} className="tag">{p}</span>
      ))}
    </div>
    <div className="tag-group">
      <span className="tag-label">Raw Files:</span>
      {(report.rawFiles || ['-']).map((f, i) => (
        <span
        key={i}
        className="tag clickable"
        onClick={() => setSelectedFile(f)}
      >
        {f.fileName || f}
      </span>
      ))}
    </div>
    <div className="tag-group">
      <span className="tag-label">Issues:</span>
      <span className="tag">{stage?.issueDescription || '-'}</span>
    </div>
  </div>
)}
                <button className="toggle-gantt-btn" onClick={() => toggleChart(report.reportId)}>
                {chartExpanded ? '▲ Hide Details;' : '▼ Show Details'}
                </button>
            {chartExpanded && stageRows.length > 0 && (
              <Chart
                chartType="Gantt"
                width="100%"
                height={`${stageRows.length * 45 + 50}px`}
                data={[columns, ...stageRows]}
                options={{
                    gantt: {
                        labelStyle: { fontName: 'Segoe UI', fontSize: 12, color: '#333' },
                        trackHeight: 28,
                        criticalPathEnabled: false, // disables thick red lines
                        arrow: {
                          angle: 0,         // no head
                          width: 0,         // no width
                          color: '#ffffff', // invisible
                          radius: 0         // flat line
                        },
                        palette: [
                          { color: '#1b9e77' },
                          { color: '#a8d5c0' }
                        ]
                      }
                }}
                loader={<div>Loading chart...</div>}
              />
            )}
          </div>
        );
      })}

{selectedFile && (
  <div className="popup-overlay" onClick={() => setSelectedFile(null)}>
    <div className="popup-content" onClick={e => e.stopPropagation()}>
      <h3>📄 Raw File Info</h3>
      <p><strong>File Name:</strong> {selectedFile.fileName}</p>
      <p><strong>System Name:</strong> {selectedFile.systemName}</p>
      <p><strong>System Owner:</strong> {selectedFile.systemOwner}</p>
      <button onClick={() => setSelectedFile(null)} className="btn-secondary-clear">Close</button>
    </div>
  </div>
)}
    </div>
  );
}
