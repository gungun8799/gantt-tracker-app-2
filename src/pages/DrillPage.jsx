import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chart } from 'react-google-charts';
import '../styles/Pages.css';

export default function DrillPage() {
  const { stageName } = useParams();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [expandedCharts, setExpandedCharts] = useState({});

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
    const last = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - last) / (1000 * 60 * 60 * 24));
    let color = 'blue';
    if (diff >= 3 && diff <= 4) color = 'orange';
    if (diff >= 5) color = 'red';
    return <span className={`days-tag ${color}`}>{diff} day{diff !== 1 ? 's' : ''} ago</span>;
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
            <h2 className="section-title-2">
              {report.reportName} ({report.reportId}) {' '}
              {daysSinceUpdate(report.recentUpdate)}
            </h2>
            <div className="report-meta" style={{ marginBottom: '1rem' }}>
              <strong>BU:</strong> {report.usedBy?.[0]?.buName || '-'} | {' '}
              <strong>Owner:</strong> {report.businessOwners?.join(', ') || '-'} | {' '}
              <strong>PICs:</strong> {stage?.PICs?.join(', ') || '-'} | {' '}
              <strong>Issues:</strong> {stage?.issueDescription || '-'}
            </div>
            <button className="toggle-gantt-btn" onClick={() => toggleChart(report.reportId)}>
              {chartExpanded ? '▲ Hide Timeline' : '▼ Show Timeline'}
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
    </div>
  );
}
