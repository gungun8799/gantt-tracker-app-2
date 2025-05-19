import React, { useEffect, useMemo, useState } from 'react';
import { Chart } from 'react-google-charts';
import '../styles/Pages.css';
const apiUrl = process.env.REACT_APP_BACKEND_URL;

export default function ReportPage() {
  const [reports, setReports] = useState([]);
  const [expandedReports, setExpandedReports] = useState({});
  const [scale, setScale] = useState('Month');
  const [showOnlyDelayed, setShowOnlyDelayed] = useState(false);
  const [filters, setFilters] = useState({
    name: '',
    bu: [],
    stage: [],
    file: [],
    pic: []
  });
  const [searchMatchedReports, setSearchMatchedReports] = useState([]);
const [selectedReports, setSelectedReports] = useState([]);

  useEffect(() => {
    fetch(`${apiUrl}/api/get-reports`)
      .then(res => res.json())
      .then(setReports)
      .catch(err => console.error('❌ Failed to fetch reports:', err));
  }, []);

    if (!reports.length) return; // Wait until data is loaded


  const today = new Date();
  today.setHours(0, 0, 0, 0); // normalize
  
  const stageOrder = [
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
  
  const delayedReports = [];
  const delayedTasks = [];
  

  
  console.log('[DEBUG] Delayed Report IDs:', delayedReports);
  console.log('[DEBUG] Delayed Task Names:', delayedTasks);
  const scaleWidths = {
    Week: '920px',
    Month: '920px',
    Quarter: '920px'
  };

  const getTodayLineRow = (reportId) => {
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));
  
    return [
      `${reportId}-today`,
      '🔴 Today',
      'Today',
      start,
      end,
      null,
      100,
      null,
      'Today' // ✅ tooltip
    ];
  };
  

  const columns = [
    { type: 'string', label: 'Task ID' },
    { type: 'string', label: 'Task Name' },
    { type: 'string', label: 'Resource' },
    { type: 'date', label: 'Start Date' },
    { type: 'date', label: 'End Date' },
    { type: 'number', label: 'Duration' },
    { type: 'number', label: 'Percent Complete' },
    { type: 'string', label: 'Dependencies' },
    { type: 'string', role: 'tooltip', p: { html: true } } // ✅ Add this line
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






const delayedReportIds = new Set();
let delayedReportCount = 0;
let delayedTaskCount = 0;

reports.forEach(report => {
  const stages = report.usedBy?.[0]?.stages || [];
  let reportHasDelay = false;

  stages.forEach(stage => {
    const plannedEnd = stage.plannedEnd && new Date(stage.plannedEnd);
    const actualEnd = stage.actualEnd && new Date(stage.actualEnd);

    if (plannedEnd && plannedEnd < today && !actualEnd) {
      delayedTaskCount++;
      reportHasDelay = true;
      console.log(`⚠️ Delayed Stage: ${stage.stageName} in report ${report.reportName}`);
    }
  });

  if (reportHasDelay) {
    delayedReportIds.add(report.reportId);
    delayedReportCount++;
    console.log(`[⚠️ Delayed Report] ${report.reportName} (${report.reportId})`);
  }
});



const filtered = reports.filter(r => {
  if (showOnlyDelayed && !delayedReportIds.has(r.reportId)) return false;

  // ✅ If any reports are manually selected, show only those — ignore text search
  if (selectedReports.length > 0) {
    const selectedIds = selectedReports.map(rep => rep.reportId);
    return selectedIds.includes(r.reportId);
  }

  const currentStageName = r.currentStage;
  const currentStage = r.usedBy?.[0]?.stages.find(s => s.stageName === currentStageName);

  const nameMatch = !filters.name || r.reportName.toLowerCase().includes(filters.name.toLowerCase()) || r.reportId.toLowerCase().includes(filters.name.toLowerCase());
  const buMatch = !filters.bu.length || filters.bu.includes(r.usedBy?.[0]?.buName);
  const stageMatch = !filters.stage.length || filters.stage.includes(currentStageName);
  const fileMatch = !filters.file.length || r.rawFiles?.some(f => filters.file.includes(f.fileName));
  const picMatch = !filters.pic.length || currentStage?.PICs?.some(p => filters.pic.includes(p));

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

  const getTimelinePaddingRows = () => [
    [
      'timeline-start',
      '',
      '__HIDDEN__',
      new Date('2025-02-01'),
      new Date('2025-02-02'),
      null,
      0,
      null,
      '' // ✅ tooltip
    ],
    [
      'timeline-end',
      '',
      '__HIDDEN__',
      new Date('2025-12-30'),
      new Date('2025-12-31'),
      null,
      0,
      null,
      '' // ✅ tooltip
    ]
  ];



  const ganttOptions = {
    gantt: {
      labelStyle: { fontName: 'Segoe UI', fontSize: 12, color: '#333' },
      trackHeight: 26,
      criticalPathEnabled: false,
      arrow: {
        angle: 0,
        width: 0,
        color: '#ffffff',
        radius: 0
      },
      palette: [
        { color: 'transparent', label: '__HIDDEN__' },
        { color: '#185c97', label: 'Planned' },
        { color: '#0870c9', label: 'Overall' },
        { color: '#8ec0ea', label: 'Actual' },
        { color: '#ffd54f', label: 'TODAY' },
        { color: '#ffd54f', label: 'TODAY2' },
         // 👈 NEW invisible resource

      ]
    },
    hAxis: {
      format: {
        Week: 'w',
        Month: 'MMM yyyy',
        Quarter: "'Q'q yyyy"
      }[scale],
      minValue: new Date('2025-02-01'),
      maxValue: new Date('2025-12-31')
    }
  };


  function ChartErrorBoundary({ children }) {
    const [hasError, setHasError] = useState(false);
  
    return hasError ? (
      <div style={{ color: 'red' }}>⚠️ Failed to render chart.</div>
    ) : (
      <ErrorCatcher onError={() => setHasError(true)}>{children}</ErrorCatcher>
    );
  }
  
  class ErrorCatcher extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
      return { hasError: true };
    }
    componentDidCatch(error, errorInfo) {
      if (this.props.onError) this.props.onError(error, errorInfo);
    }
    render() {
      return this.state.hasError ? null : this.props.children;
    }
  }
  const getOverallRow = (report) => {
    const stages = report.usedBy?.[0]?.stages || [];
  
    // Collect all dates from both planned and actual
    const allDates = stages.flatMap(stage => {
      const dates = [];
      if (stage.plannedStart && stage.plannedEnd) {
        dates.push(new Date(stage.plannedStart));
        dates.push(new Date(stage.plannedEnd));
      }
      if (stage.actualStart && stage.actualEnd) {
        dates.push(new Date(stage.actualStart));
        dates.push(new Date(stage.actualEnd));
      }
      return dates;
    });
  
    if (allDates.length === 0) return null;
  
    const minStart = new Date(Math.min(...allDates));
    const maxEnd = new Date(Math.max(...allDates));
  
    return [
      `${report.reportId}-overall`,
      ``,  // 👈 pad to fixed length
      'Overall',
      minStart,
      maxEnd,
      null,
      0,
      null,
      'Today' // ✅ tooltip
    ];
  };

  const getStageRows = (report) => {
    const rows = [];
    const stagesMap = {};
    const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    (report.usedBy?.[0]?.stages || []).forEach(s => {
      stagesMap[s.stageName] = s;
    });
  
    stageNames.forEach((stageName, i) => {
      const s = stagesMap[stageName];
      if (!s) return;
      const baseId = `${report.reportId}-STG${i + 1}`;
  
      // Planned
      if (s.plannedStart && s.plannedEnd) {
        rows.push([
          `${baseId}`,
          stageName, // 👈 fixed label width
          'Planned',
          new Date(s.plannedStart),
          new Date(s.plannedEnd),
          null,
          0,
          `${report.reportId}-overall`,
          `<b>${stageName}</b><br>Start: ${formatDate(s.plannedStart)}<br>End: ${formatDate(s.plannedEnd)}`
        ]);
      }
  
      // Actual
      if (s.actualStart && s.actualEnd) {
        const actualId = `${baseId}-actual`;
        rows.push([
          actualId,
          ``,
          'Actual',
          new Date(s.actualStart),
          new Date(s.actualEnd),
          null,
          0,
          `${report.reportId}-overall`, // 👈 Add dependency to overall row
          `<b>${stageName} (Actual)</b><br>Start: ${formatDate(s.actualStart)}<br>End: ${formatDate(s.actualEnd)}`
        ]);
      }
    });
  
    return rows;
  };


  const getTodayRow = () => {
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));
  
    return [
      'TODAY',
      '',
      'TODAY', // 👈 this string must match a palette label
      start,
      end,
      null,
      100,
      null,
      'Today' // ✅ tooltip
          // Extra column (tooltip override) — must be added if you're using tooltips manually

    ];
  };
  console.log('Palette colors:', ganttOptions.gantt.palette.map(item => item.color));
  return (
    <div className="page-container">
      <h1>📈 Gantt Chart Report Summary</h1>
  
      {/* 🔼 Filters and Summary Section */}
      <div className="section-block-filter-merged">
      <div
  className="section-title-summary-report"
  style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  }}
>
  <span>🎯 Filters & Summary</span>

  <button
    className="btn-secondary-clear"
    onClick={() => {
      setFilters({ name: '', bu: [], stage: [], file: [], pic: [] });
      setSearchMatchedReports([]);
      setSelectedReports([]);
    }}
    style={{ marginTop: 0 }} // remove previous spacing if any
  >
    ❌ Clear Filters
  </button>
</div>        

<div className="filter-summary-row" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
  {/* 🔹 Left: Filter Fields */}
  
  <div className="filter-grid" style={{ flex: '1' }}>
    <div className="filter-item-full">

    <div
  style={{
    display: 'flex',
    gap: '0.1rem',
    alignItems: 'flex-start',
    marginBottom: '0.1rem',
    flexWrap: 'wrap',
  }}
>
  {/* LEFT: Search field */}
  <div style={{ flex: '1 1 100px' }}>
    <label className="filter-label">Search Report Name or ID</label>
    <input
  list="reportOptions"
  className="filter-input"
  type="text"
  placeholder="Type to search reports..."
  value={filters.name}
  onChange={e => {
    const value = e.target.value;
    setFilters(prev => ({ ...prev, name: value }));

    // Try to auto-add if exact match on blur or enter (optional)
    const matched = reports.find(r =>
      `${r.reportName} (${r.reportId})`.toLowerCase() === value.toLowerCase()
    );
    if (matched && !selectedReports.some(r => r.reportId === matched.reportId)) {
      setSelectedReports(prev => [...prev, matched]);
      setFilters(prev => ({ ...prev, name: '' }));
    }
  }}
  onKeyDown={e => {
    if (e.key === 'Enter') {
      const matched = reports.find(r =>
        `${r.reportName} (${r.reportId})`.toLowerCase() === filters.name.toLowerCase()
      );
      if (matched && !selectedReports.some(r => r.reportId === matched.reportId)) {
        setSelectedReports(prev => [...prev, matched]);
        setFilters(prev => ({ ...prev, name: '' }));
      }
    }
  }}
/>

<datalist id="reportOptions">
  {reports.map(r => (
    <option key={r.reportId} value={`${r.reportName} (${r.reportId})`} />
  ))}
</datalist>
  </div>

  {/* RIGHT: Dropdown + tags */}
  <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
   

    {selectedReports.length > 0 && (
      <div>
        <label className="filter-label" style={{ display: 'flex', alignItems: 'center' }}></label>
        <div
  style={{
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  }}
>
  {selectedReports.map(r => (
    <div
      key={r.reportId}
      className="selected-report-tag"
      style={{
        background: '#e0e0e0',
        padding: '4px 8px',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        width: 'calc(33.333% - 0.5rem)', // ✅ 3 per row
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      <button
        style={{
          background: 'transparent',
          border: 'none',
          color: 'red',
          fontWeight: 'bold',
          cursor: 'pointer',
          marginRight: '0.5rem',
          padding: 0,
        }}
        onClick={() =>
          setSelectedReports(prev =>
            prev.filter(x => x.reportId !== r.reportId)
          )
        }
      >
        ❌
      </button>

      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {r.reportName} ({r.reportId})
      </span>
    </div>
  ))}
</div>
      </div>
    )}
  </div>
</div>




    <button
      className="btn-secondary-clear"
      onClick={() => {
        setFilters({ name: '', bu: [], stage: [], file: [], pic: [] });
        setSearchMatchedReports([]);
        setSelectedReports([]);
      }}
    >
      
    </button>
    
    </div>


    {["bu", "stage", "file", "pic"].map((key, i) => (
      <div className="filter-item" key={i}>
        <label className="filter-label">{key === 'bu' ? 'Business Units' : key === 'stage' ? 'Stages' : key === 'file' ? 'Raw Files' : 'Person in Charge (PIC)'}</label>
        <select
          multiple
          className="filter-select"
          value={filters[key]}
          onChange={e => {
            const options = Array.from(e.target.selectedOptions, opt => opt.value);
            setFilters(prev => ({ ...prev, [key]: options }));
          }}
        >
          <option value="">All</option>
          {unique(key).map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>

      
    ))}

    <div className="filter-item-full" style={{ textAlign: 'right' }}>

    </div>

  </div>

  {/* 🔸 Right: Summary Cards */}
  <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', minWidth: '350px' }}>    <div className="summary-card-report">
     
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

    <div className="summary-card-report">
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
    <div
  className={`summary-card-report-delayed ${showOnlyDelayed ? 'selected' : ''}`}

  onClick={() => setShowOnlyDelayed(prev => !prev)}
>
  <h3 className="delayed-text">⏰ Delays</h3>

  <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
    <div>
      <div style={{ fontSize: '2.2rem', color: showOnlyDelayed ? '#0870c9' : '#333' }}>
        {delayedReportCount}
      </div>
      <div style={{ fontSize: '0.85rem', color: '#666' }}>Delayed Reports</div>
    </div>
    <div>
      <div style={{ fontSize: '2.2rem', color: '#333' }}>
        {delayedTaskCount}
      </div>
      <div style={{ fontSize: '0.85rem', color: '#666' }}>Delayed Tasks</div>
    </div>
  </div>
</div>
  </div>
</div>

        
  
        {/* Summary Cards */}
        <div className="filter-summary-cards-row">
          
  
          <div className="summary-card-pipeline">
            <h3 className="pipeline-text" >📊 Pipeline by Stage</h3>
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
  
      {/* Gantt List View */}
      <div className="report-container">
  {filtered.map((report) => {
    const isExpanded = expandedReports[report.reportId];

    
    const allRows = [
      ...getTimelinePaddingRows(),
      getOverallRow(report),
      ...(isExpanded ? getStageRows(report) : []),
      getTodayRow()
    ].filter(Boolean);

    for (const row of allRows.slice(1)) {
      const resource = row[2];
      const allowedResources = ganttOptions.gantt.palette.map(p => p.label);

      if (resource && !allowedResources.includes(resource)) {
        console.warn('⚠️ Unknown Resource:', resource);
      }
    }
    console.log('🟡 Gantt rows:', allRows);
    return (
      <div key={report.reportId} className="report-row">
        <div
          className="report-info"
          onClick={() => toggleReport(report.reportId)}
          style={{
            cursor: 'pointer',
            width: '100%'
          }}
        >
          <h3 className="report-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isExpanded ? '▼' : '▶'} {report.reportName} ({report.reportId})
            <span className="stage-tag">{report.currentStage || 'No Stage'}</span>
          </h3>
    
          {isExpanded && (
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div><strong>BU:</strong> {report.usedBy?.[0]?.buName || '-'}</div>
              <div><strong>Biz Owner:</strong> {report.usedBy?.[0]?.businessOwner || '-'}</div>
              <div><strong>Stage:</strong> {report.currentStage || '-'}</div>
              <div><strong>Current PICs:</strong> {(report.usedBy?.[0]?.stages || []).find(s => s.stageName === report.currentStage)?.PICs?.join(', ') || '-'}</div>
              <div><strong>Issues:</strong> {(report.usedBy?.[0]?.stages || []).find(s => s.stageName === report.currentStage)?.issueDescription || '-'}</div>
            </div>
          )}
        </div>
    
        {allRows.length > 0 && (
          <div
            className="report-gantt"
            style={{
              flex: 1,
              overflowX: 'auto',
              overflowY: 'auto',
              paddingBottom: '1rem',
            }}
          >
            
            <div style={{ minWidth: '1400px' /* or wider depending on scale */ }}>
              
              <Chart
                chartType="Gantt"
                width="100%"
                height={
                  isExpanded
                    ? `${Math.max(allRows.length * 30, 80)}px`  // normal height when expanded
                    : '140px'                                     // shorter height when collapsed
                }                data={[columns, ...allRows]}
                options={{
                  ...ganttOptions,
                  tooltip: {
                    isHtml: true,
                    trigger: 'selection' // ✅ force use of your custom tooltip
                  }
                }}              
                 loader={<div>Loading Gantt Chart...</div>}
              />
            </div>
          </div>
        )}
      </div>
    );
  })}
</div>
    </div>
  );
}  