import React, { useEffect, useState } from 'react';
import { Chart } from 'react-google-charts';
import '../styles/Pages.css';
const apiUrl = process.env.REACT_APP_BACKEND_URL;

export default function ReportPage() {
  const [reports, setReports] = useState([]);
  const [expandedReports, setExpandedReports] = useState({});
  const [scale, setScale] = useState('Month');
  const [filters, setFilters] = useState({
    name: '',
    bu: [],
    stage: [],
    file: [],
    pic: []
  });

  useEffect(() => {
    fetch(`${apiUrl}/api/get-reports`)
      .then(res => res.json())
      .then(setReports)
      .catch(err => console.error('❌ Failed to fetch reports:', err));
  }, []);

  const scaleWidths = {
    Week: '920px',
    Month: '920px',
    Quarter: '920px'
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
    const buMatch = !filters.bu.length || filters.bu.includes(r.usedBy?.[0]?.buName);    const stageMatch = !filters.stage.length || filters.stage.includes(currentStageName);
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

  const ganttOptions = {
    gantt: {
      labelStyle: { fontName: 'Segoe UI', fontSize: 12, color: '#333' },
      trackHeight: 26,
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
      null
    ];
  };

  const getStageRows = (report) => {
    const rows = [];
    const stagesMap = {};
  
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
          `${stageName.padEnd(40, ' ')}`, // 👈 fixed label width
          'Planned',
          new Date(s.plannedStart),
          new Date(s.plannedEnd),
          null,
          0,
          `${report.reportId}-overall`
        ]);
      }
  
      // Actual
      if (s.actualStart && s.actualEnd) {
        const actualId = `${baseId}-actual`;
        rows.push([
          actualId,
          `${stageName} (Actual)`,
          'Actual',
          new Date(s.actualStart),
          new Date(s.actualEnd),
          null,
          0,
          `${report.reportId}-overall` // 👈 Add dependency to overall row
        ]);
      }
    });
  
    return rows;
  };

  return (
    <div className="page-container">
      <h1>📈 Gantt Chart Report Summary</h1>
  
      {/* 🔼 Filters and Summary Section */}
      <div className="section-block-filter-merged">
        <div className="section-title">🎯 Filters & Summary</div>
        <div className="filter-summary-row" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
  {/* 🔹 Left: Filter Fields */}
  <div className="filter-grid" style={{ flex: '1' }}>
    <div className="filter-item-full">
      <label htmlFor="reportNameInput" className="filter-label">Search Report Name</label>
      <input
        id="reportNameInput"
        className="filter-input"
        type="text"
        placeholder="e.g. Report name"
        value={filters.name}
        onChange={e => setFilters({ ...filters, name: e.target.value })}
      />
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
            <option key={v}>{v}</option>
          ))}
        </select>
      </div>
    ))}

    <div className="filter-item-full" style={{ textAlign: 'right' }}>
      <button
        className="btn-secondary-clear"
        onClick={() => setFilters({ name: '', bu: [], stage: [], file: [], pic: [] })}
      >
        ❌ Clear Filters
      </button>
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
  </div>
</div>

        
  
        {/* Summary Cards */}
        <div className="filter-summary-cards-row">
          
  
          <div className="summary-card-pipeline">
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
  
      {/* Gantt List View */}
      <div className="report-container">
  {filtered.map((report) => {
    const isExpanded = expandedReports[report.reportId];
    const allRows = [
      getOverallRow(report), 
      ...(isExpanded ? getStageRows(report) : [])
    ].filter(Boolean);

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
          <div className="report-gantt" style={{ flex: 1 }}>
            <Chart
              chartType="Gantt"
              width={scaleWidths[scale]}
              height={`${Math.max(allRows.length * 30, 80)}px`}              data={[columns, ...allRows]}
              options={ganttOptions}
              loader={<div>Loading Gantt Chart...</div>}
            />
          </div>
        )}
      </div>
    );
  })}
</div>
    </div>
  );
}  