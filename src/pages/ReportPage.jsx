import React, { useEffect, useState } from 'react';
import { Chart } from 'react-google-charts';
import '../styles/Pages.css';

export default function ReportPage() {
  const [reports, setReports] = useState([]);
  const [expandedReports, setExpandedReports] = useState({});
  const [scale, setScale] = useState('Month');
  const [filters, setFilters] = useState({
    name: '',
    bu: '',
    stage: '',
    file: '',
    pic: ''
  });

  useEffect(() => {
    fetch('http://localhost:4000/api/get-reports')
      .then(res => res.json())
      .then(setReports)
      .catch(err => console.error('❌ Failed to fetch reports:', err));
  }, []);

  const scaleWidths = {
    Week: '1600px',
    Month: '1200px',
    Quarter: '900px'
  };



  const columns = [
    { type: 'string', label: 'Task ID' },
    { type: 'string', label: 'Task Name' },
    { type: 'string', label: 'Resource' },
    { type: 'date', label: 'Start Date' },
    { type: 'date', label: 'End Date' },
    { type: 'number', label: 'Duration' },
    { type: 'number', label: 'Percent Complete' },
    { type: 'string', label: 'Dependencies' }
  ];

  const unique = (key) => {
    const set = new Set();
    reports.forEach(r => {
      if (key === 'bu') r.usedBy?.forEach(b => set.add(b.buName));
      if (key === 'stage') r.usedBy?.[0]?.stages?.forEach(s => set.add(s.stageName));
      if (key === 'file') r.rawFiles?.forEach(f => set.add(f.fileName));
      if (key === 'pic') r.usedBy?.[0]?.stages?.forEach(s => s.PICs?.forEach(p => set.add(p)));
    });
    return [...set];
  };

  const fullStageCounts = {};
reports.forEach((r) => {
  const stageName = r.currentStage;
  if (stageName) {
    fullStageCounts[stageName] = (fullStageCounts[stageName] || 0) + 1;
  }
});

  const filtered = reports.filter(r => {
    const currentStageName = r.currentStage;
    const currentStage = r.usedBy?.[0]?.stages.find(s => s.stageName === currentStageName);
  
    const nameMatch = !filters.name || r.reportName.toLowerCase().includes(filters.name.toLowerCase());
    const buMatch = !filters.bu || r.usedBy?.[0]?.buName === filters.bu;
    const fileMatch = !filters.file || r.rawFiles?.some(f => f.fileName === filters.file);
    const stageMatch = !filters.stage || currentStageName === filters.stage;
    const picMatch = !filters.pic || currentStage?.PICs?.includes(filters.pic);
  
    return nameMatch && buMatch && fileMatch && stageMatch && picMatch;
  });
  const stagePipeline = {};
const stageNames = [
  "Gather requirements with user",
  "Select File sourcing option",
  "Produce Data mapping script",
  "Ingest to Azure & DEV",
  "UAT on Azure",
  "Data transformation for PBI",
  "UAT on PBI",
  "File sourcing automation",
  "Done"
];

stageNames.forEach(stage => {
  stagePipeline[stage] = 0;
});

filtered.forEach((r) => {
  const stage = r.currentStage;
  if (stagePipeline.hasOwnProperty(stage)) {
    stagePipeline[stage]++;
  }
});

  const toggleReport = (id) => {
    setExpandedReports(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const ganttOptions = {
    gantt: {
      labelStyle: { fontName: 'Segoe UI', fontSize: 12, color: '#333' },
      trackHeight: 28,
      palette: [
        { color: '#1b9e77' },        // Planned
        { color: '#a8d5c0' },        // Actual (lighter green)
        { color: '#d95f02' },
        { color: '#f7bfa0' },
        { color: '#7570b3' },
        { color: '#c4bfe3' }
      ]
    },
    hAxis: {
      format: {
        Week: 'w',
        Month: 'MMM yyyy',
        Quarter: "'Q'q yyyy"
      }[scale],
    }
  };

  const getOverallRow = (report) => {
    const stages = report.usedBy?.[0]?.stages || [];
    const valid = stages.filter(s => s.plannedStart && s.plannedEnd);
    if (!valid.length) return null;
    const minStart = new Date(Math.min(...valid.map(s => new Date(s.plannedStart))));
    const maxEnd = new Date(Math.max(...valid.map(s => new Date(s.plannedEnd))));
    return [
      report.reportId,
      `${expandedReports[report.reportId] ? '▼' : '▶'} ${report.reportName}`,
      'Overall',
      minStart,
      maxEnd,
      null,
      0,
      null
    ];
  };

  const getStageRows = (report) => {
    const rows = [];
  
    (report.usedBy?.[0]?.stages || []).forEach((s, i) => {
      if (s.plannedStart && s.plannedEnd) {
        // Planned bar
        rows.push([
          `${report.reportId}-STG${i + 1}`,
          s.stageName,
          'Planned',
          new Date(s.plannedStart),
          new Date(s.plannedEnd),
          null,
          0,
          null
        ]);
      }
  
      if (s.actualStart && s.actualEnd) {
        // Actual bar
        rows.push([
          `${report.reportId}-STG${i + 1}-actual`,
          `${s.stageName} (Actual)`,
          'Actual',
          new Date(s.actualStart),
          new Date(s.actualEnd),
          null,
          0,
          null
        ]);
      }
    });
  
    return rows;
  };

  return (
    <div className="page-container">
      <h1>📈 Gantt Chart Report Summary</h1>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'nowrap' }}>  {/* Filters Section (left) */}
  <div className="section-block-filter" style={{ flex: '0 0 250px' }}>
    <div className="section-title">🎯 Filters</div>
    <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
      <input className="input" placeholder="Search Report Name"
        value={filters.name}
        onChange={e => setFilters({ ...filters, name: e.target.value })} />

      <select className="select" value={filters.bu} onChange={e => setFilters({ ...filters, bu: e.target.value })}>
        <option value="">All BUs</option>
        {unique('bu').map(b => <option key={b}>{b}</option>)}
      </select>

      <select className="select" value={filters.stage} onChange={e => setFilters({ ...filters, stage: e.target.value })}>
        <option value="">All Stages</option>
        {unique('stage').map(s => <option key={s}>{s}</option>)}
      </select>

      <select className="select" value={filters.file} onChange={e => setFilters({ ...filters, file: e.target.value })}>
        <option value="">All Files</option>
        {unique('file').map(f => <option key={f}>{f}</option>)}
      </select>

      <select className="select" value={filters.pic} onChange={e => setFilters({ ...filters, pic: e.target.value })}>
        <option value="">All PICs</option>
        {unique('pic').map(p => <option key={p}>{p}</option>)}
      </select>

      <button className="btn-secondary" onClick={() => setFilters({ name: '', bu: '', stage: '', file: '', pic: '' })}>
        ❌ Clear
      </button>
    </div>
  </div>

  {/* Summary Cards (right) */}
  <div className="summary-cards-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: '1' }}>
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      {/* PIC Summary */}
      <div className="summary-card" style={{ flex: '1 1 30%' }}>
        <h3>📋 Pending Reports by PIC</h3>
        <ul>
          {Object.entries(
            filtered.reduce((acc, report) => {
              const currentStage = report.usedBy?.[0]?.stages.find(s => s.stageName === report.currentStage);
              const pics = currentStage?.PICs || [];
              pics.forEach(pic => {
                acc[pic] = (acc[pic] || 0) + 1;
              });
              return acc;
            }, {})
          ).map(([pic, count]) => (
            <li key={pic}><strong>{pic}</strong>: {count}</li>
          ))}
        </ul>
      </div>

      {/* BU Summary */}
      <div className="summary-card" style={{ flex: '1 1 30%' }}>
        <h3>🏢 Pending Reports by BU</h3>
        <ul>
          {Object.entries(
            filtered.reduce((acc, report) => {
              const bu = report.usedBy?.[0]?.buName || 'Unknown';
              acc[bu] = (acc[bu] || 0) + 1;
              return acc;
            }, {})
          ).map(([bu, count]) => (
            <li key={bu}><strong>{bu}</strong>: {count}</li>
          ))}
        </ul>
      </div>

      {/* Pipeline by Stage */}
      <div className="summary-card" style={{ flex: '1 1 100%' }}>
        <h3>📊 Pipeline by Stage</h3>
        <div className="stage-pipeline-grid">
          {stageNames.map(stage => (
            <div
              key={stage}
              className={`stage-cell ${stage === 'Done' ? 'stage-done' : ''}`}
            >
              <div className="stage-name">{stage}</div>
              <div className="stage-count">{stagePipeline[stage]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
</div>

{/* Gantt List View */}
<div className="report-container">
  {filtered.map((report) => {
    const overallRow = getOverallRow(report);
    const stageRows = getStageRows(report);
    const isExpanded = expandedReports[report.reportId];

    return (
        <div key={report.reportId} className="report-row" style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', marginBottom: '1rem' }}>
        {/* Left Info (Extra Column) */}
        <div
  className="report-info"
  onClick={() => toggleReport(report.reportId)}
  style={{
    cursor: 'pointer',
    width: '100%',
    maxWidth: '600px'
  }}
>
  <h3 className="report-title" style={{ marginBottom: '0.5rem' }}>
    {isExpanded ? '▼' : '▶'} {report.reportName} ({report.reportId})
  </h3>

  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      gap: '1rem',
      flexWrap: 'wrap'
    }}
  >
    <div style={{ flex: '1' }}><strong>BU:</strong> {report.usedBy?.[0]?.buName || '-'}</div>
    <div style={{ flex: '1' }}><strong>Stage:</strong> {report.currentStage || '-'}</div>
    <div style={{ flex: '1' }}>
      <strong>PICs:</strong>{' '}
      {
        (report.usedBy?.[0]?.stages || [])
          .find(s => s.stageName === report.currentStage)?.PICs?.join(', ') || '-'
      }
    </div>
    <div style={{ flex: '2' }}>
      <strong>Issues:</strong>{' '}
      {(report.usedBy?.[0]?.stages || [])
        .map(s => s.issueDescription)
        .filter(Boolean)
        .join(', ') || '-'}
    </div>
  </div>
</div>
      
        {/* Right Chart */}
        <div className="report-gantt" style={{ flex: 1 }}>
          {overallRow && (
            <Chart
              chartType="Gantt"
              width={scaleWidths[scale]}
              height="60px"
              data={[columns, overallRow]}
              options={ganttOptions}
              loader={<div>Loading Gantt Chart...</div>}
            />
          )}
          {isExpanded && stageRows.length > 0 && (
            <Chart
              chartType="Gantt"
              width={scaleWidths[scale]}
              height={`${stageRows.length * 40 + 50}px`}
              data={[columns, ...stageRows]}
              options={ganttOptions}
              loader={<div>Loading Stage Chart...</div>}
            />
          )}
        </div>
      </div>
    );
  })}
</div>
    </div>
  );
}