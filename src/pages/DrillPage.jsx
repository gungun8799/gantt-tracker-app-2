import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chart } from 'react-google-charts';
import '../styles/Pages.css';
const apiUrl = process.env.REACT_APP_BACKEND_URL;

export default function DrillPage() {
  const { stageName, buName } = useParams();  
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [expandedCharts, setExpandedCharts] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [showOnlyDelayed, setShowOnlyDelayed] = useState(false);
  const [delayedReportCount, setDelayedReportCount] = useState(0);
  const [delayedTaskCount, setDelayedTaskCount] = useState(0);

  
// ─── Add this lookup at the top ────────────────────────
const stageDisplayMap = {
  'Gather requirements with user':     'Gather requirements with user',
  'Select File sourcing option':      'Obtain source files',
  'Produce Data mapping script':      'Determine solution to Ingest',
  'Ingest to Azure & DEV':            'Ingest to Tencent & DEV',
  'UAT on Azure':                     'UAT After ingestion',
  'Data transformation for PBI':      'Data transformation for PBI',
  'UAT on PBI':                       'UAT on PBI',
  'File sourcing automation':         'File sourcing automation',
  'Done':                             'Done'
};


  useEffect(() => {
    const normalize = str => str?.trim().toLowerCase();
  
    fetch(`${apiUrl}/api/get-reports`)
      .then(res => res.json())
      .then(data => {
        console.log('📦 fetched', data.length, 'reports');
        console.log('🔍 filtering by stageName:', stageName);
  
        data.forEach(r => {
          console.log(`[📄] ${r.reportName}: currentStage="${r.currentStage}"`);
        });
  
        const filtered = data.filter(
          r =>
            normalize(r.currentStage) === normalize(stageName) &&
            normalize(r.usedBy?.[0]?.buName) === normalize(buName)
        );


        // 🔍 Calculate delayed report/tasks for this filtered list
const today = new Date();
today.setHours(0, 0, 0, 0);

let delayedReportCount = 0;
let delayedTaskCount = 0;
const delayedReportIds = [];

filtered.forEach(report => {
  const currentStageName = report.currentStage;
  const currentStage = report.usedBy?.[0]?.stages?.find(s => s.stageName === currentStageName);
  const plannedEnd = currentStage?.plannedEnd && new Date(currentStage.plannedEnd);

  if (plannedEnd && plannedEnd < today) {
    console.log(`⏰ DELAYED: ${report.reportName} - still in stage "${currentStageName}" past ${plannedEnd.toDateString()}`);
    delayedTaskCount++;
    delayedReportCount++;
    delayedReportIds.push(report.reportId);
  }
});

setDelayedReportCount(delayedReportCount);
setDelayedTaskCount(delayedTaskCount);

setReports(
  showOnlyDelayed
    ? filtered.filter(r => delayedReportIds.includes(r.reportId))
    : filtered
);



  
        console.log('✅ matched reports:', filtered.map(r => r.reportName));
        setReports(filtered);

        console.log('🔍 stageName from URL:', stageName);
data.forEach(r => {
  console.log(`[📄] ${r.reportName}: currentStage="${r.currentStage}"`);
});
      })
      .catch(err => console.error('❌ Failed to fetch reports:', err));
      
  }, [stageName, buName, showOnlyDelayed]);




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

  const getTodayRow = () => {
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));
    return [
      'TODAY',
      '',
      'TODAY',
      start,
      end,
      null,
      100,
      null
    ];
  };

  const getTimelinePaddingRows = () => [
    [
      'timeline-start',
      '',
      '__HIDDEN__',
      new Date('2025-02-01'),
      new Date('2025-02-02'), // min anchor
      null,
      0,
      null
    ],
    [
      'timeline-end',
      '',
      '__HIDDEN__',
      new Date('2025-12-30'),
      new Date('2025-12-31'), // max anchor
      null,
      0,
      null
    ]
  ];


  return (
    <div className="page-container">
      <h1>📊 Drill Down: {stageDisplayMap[stageName] || stageName}</h1>
      <button className="btn-back" onClick={() => navigate('/overall')}>
        ← Back to Overall
      </button>
      <div
  className={`summary-card-report-delayed-horizontal ${showOnlyDelayed ? 'selected' : ''}`}
  onClick={() => setShowOnlyDelayed(prev => !prev)}
>
  <h3 style={{ fontSize: '1rem', marginRight: '2rem' }}>⏰ Delays</h3>
  <div style={{ display: 'flex', gap: '3rem' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', fontWeight: 600, color: '#0870c9' }}>
        {delayedReportCount}
      </div>
      <div style={{ fontSize: '0.85rem' }}>Delayed Reports</div>
    </div>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', fontWeight: 600, color: '#0870c9' }}>
        {delayedTaskCount}
      </div>
      <div style={{ fontSize: '0.85rem' }}>Delayed Tasks</div>
    </div>
  </div>
</div>

      {reports.map((report) => {
        const stage = report.usedBy?.[0]?.stages?.find(s => s.stageName === stageName);
        const stageRows = getStageRows(report);
        const chartExpanded = expandedCharts[report.reportId] || false;
        const rowCount = stageRows.length + 3; // +2 padding rows +1 today row
        const chartHeight = `${rowCount * 40}px`;
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
    {/* BU */}
    <div className="tag-group">
      <span className="tag-label">BU:</span>
      <span className="tag">
        {report.usedBy?.[0]?.buName?.trim() || '-'}
      </span>
    </div>

    {/* Owner */}
    <div className="tag-group">
      <span className="tag-label">Owner:</span>
      {(report.businessOwners?.length ? report.businessOwners : ['-']).map((o, i) => (
        <span key={i} className="tag">{o}</span>
      ))}
    </div>

{/* PICs */}
<div className="tag-group">
  <span className="tag-label">PICs:</span>
  {Array.isArray(stage?.PICs) && stage.PICs.length > 0
    ? stage.PICs.map((p, i) => {
        // if p is a string, render it directly
        if (typeof p === "string") {
          return (
            <span key={i} className="tag">
              {p}
            </span>
          );
        }

        // otherwise assume p is { name, org }
        const displayText = p.org?.trim()
          ? `${p.name} (${p.org})`
          : p.name;

        return (
          <span key={i} className="tag">
            {displayText}
          </span>
        );
      })
    : (
      <span className="tag">-</span>
    )
  }
</div>

    {/* Raw Files */}
    <div className="tag-group">
      <span className="tag-label">Raw Files:</span>
      {(report.rawFiles?.length ? report.rawFiles : ['-']).map((f, i) => (
        <span
          key={i}
          className="tag clickable"
          onClick={() => f !== '-' && setSelectedFile(f)}
        >
          {typeof f === 'string' ? f : f?.fileName || '-'}
        </span>
      ))}
    </div>

    {/* Issues */}
    <div className="tag-group">
      <span className="tag-label">Issues:</span>
      <span className="tag">
        {stage?.issueDescription?.trim() || '-'}
      </span>
    </div>
  </div>
)}



        <div style={{ height: '2.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
          <button className="toggle-gantt-btn" onClick={() => toggleChart(report.reportId)}>
            {chartExpanded ? '▲ Hide Details' : '▼ Show Details'}
          </button>
        </div>
            {stageRows.length > 0 && (
              

              <Chart
                chartType="Gantt"
                width="100%"
                height={chartHeight}
                data={[columns, ...getTimelinePaddingRows(), ...stageRows, getTodayRow()]}                
                options={{
                  gantt: {
                    labelStyle: { fontName: 'Segoe UI', fontSize: 12, color: '#333' },
                    trackHeight: 28,
                    criticalPathEnabled: false,
                    arrow: {
                      angle: 0,
                      width: 0,
                      color: '#ffffff',
                      radius: 0
                    },
                    palette: [
                      { color: 'transparent', label: '__HIDDEN__' },
                      { color: '#8ec0ea' },  // Planned
                      { color: '#185c97' },  // Actual
                      { color: '#ffd54f', label: 'TODAY' }
                    ]
                  },
                  hAxis: {
                    minValue: new Date('2025-02-01'),
                    maxValue: new Date('2025-12-31'),
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
      <button onClick={() => setSelectedFile(null)} className="btn-secondary-clear-drill">Close</button>
    </div>
  </div>
)}


    </div>
  );
}
