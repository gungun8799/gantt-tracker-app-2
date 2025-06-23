// src/pages/overall.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, UploadCloud, Table, Database,
  CheckSquare, Code, BarChart3, Bot
} from 'lucide-react';
import { Chart } from 'react-google-charts';
import './Overall.css';

const apiUrl = process.env.REACT_APP_BACKEND_URL;

const stageNames = [
  'Gather requirements with user',
  'Produce Data mapping script',
  'Select File sourcing option',
  'Ingest to Azure & DEV',
  'UAT on Azure',
  'Data transformation for PBI',
  'UAT on PBI',
  'File sourcing automation',
  'Done'
];
// maps your real stageName → the one you want to *display*
const stageDisplayMap = {
  'Gather requirements with user':     'Gather requirements with user',
  'Produce Data mapping script':      'Determine solution to Ingest',
  'Select File sourcing option':      'Data model design/approval',
  'Ingest to Azure':                  'Ingest to Azure',
  'UAT on Azure':                     'Dev Data Model & QA',
  'Data transformation for PBI':      'Develop PBI Report',
  'UAT on PBI':                       'UAT',
  'File sourcing automation':         'File sourcing automation',
  'Done':                             'Done'
};

const columns = [
  { type: 'string', label: 'Task ID' },
  { type: 'string', label: 'Task Name' },
  { type: 'string', label: 'Resource' },
  { type: 'date',   label: 'Start Date' },
  { type: 'date',   label: 'End Date' },
  { type: 'number', label: 'Duration' },
  { type: 'number', label: 'Percent Complete' },
  { type: 'string', label: 'Dependencies' },
];

const getMinMaxDate = stages => {
  const dates = stages.flatMap(s =>
    s.plannedStart && s.plannedEnd
      ? [new Date(s.plannedStart), new Date(s.plannedEnd)]
      : []
  );
  return dates.length
    ? [new Date(Math.min(...dates)), new Date(Math.max(...dates))]
    : null;
};

const getTodayRow = () => {
  const now   = new Date();
  const start = new Date(now.setHours(0,0,0,0));
  const end   = new Date(now.setHours(23,59,59,999));
  return ['TODAY','Today','Today', start, end, null, 100, null];
};

const stageIcons = [
  <FileText />, <UploadCloud />, <Table />, <Database />,
  <CheckSquare />, <Code />, <BarChart3 />, <Bot />, <CheckSquare />
];

export default function OverallPage() {
  const [reports,    setReports]    = useState([]);
  const [expandedBu, setExpandedBu] = useState([]);
  const [expandedRpt,setExpandedRpt]= useState([]);
  const [filterMode, setFilterMode] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${apiUrl}
/api/get-reports`)
      .then(r => r.json())
      .then(setReports)
      .catch(console.error);
  }, []);

  const today = new Date(); today.setHours(0,0,0,0);
  const in3   = new Date(today); in3.setDate(in3.getDate()+3);
  const in5   = new Date(today); in5.setDate(in5.getDate()+5);

  // compute delayed / due-in counts
  const delayedIds = new Set(), due3Ids = new Set(), due5Ids = new Set();
  reports.forEach(r => {
    const curr = r.usedBy?.[0]?.stages?.find(s => s.stageName === r.currentStage);
    if (!curr?.plannedEnd) return;
    const end = new Date(curr.plannedEnd);
    if (end < today) delayedIds.add(r.reportId);
    if (end >= today && end <= in3) due3Ids.add(r.reportId);
    if (end >= today && end <= in5) due5Ids.add(r.reportId);
  });
  const delayedCount = delayedIds.size;
  const due3Count    = due3Ids.size;
  const due5Count    = due5Ids.size;

  // filter by card
  const filteredReports = reports.filter(r => {
    if (filterMode === 'delayed') return delayedIds.has(r.reportId);
    if (filterMode === 'due3')    return due3Ids.has(r.reportId);
    if (filterMode === 'due5')    return due5Ids.has(r.reportId);
    return true;
  });

  // summary table data
  const buSummary = {};
  const picByStage = {};
  filteredReports.forEach(r => {
    const bu = r.usedBy?.[0]?.buName || 'Unknown';
    buSummary[bu] = (buSummary[bu]||0) + 1;
  });
  stageNames.forEach(stage => {
      // 1) pull out every {name,org} from that stage across all reports
  const allPICObjects = filteredReports.flatMap(r => {
    const stageObj = r.usedBy?.[0]?.stages?.find(s => s.stageName === stage);
    return stageObj?.PICs || [];
  });

  // 2) extract ONLY the org property; if it's a legacy string, skip
  const allOrgStrings = allPICObjects
    .filter(p => p && typeof p === 'object' && p.org && p.org.trim())
    .map(p => p.org.trim());

  // 3) dedupe and join
  picByStage[stage] = [...new Set(allOrgStrings)].join(', ');
  });

  // build Gantt rows including General category
  const ganttRows = (() => {
    const rows = [ getTodayRow() ];
    const byBu = {};
    filteredReports.forEach(r => {
      const bu = r.usedBy?.[0]?.buId || 'Unknown';
      (byBu[bu]|| (byBu[bu]=[])).push(r);
    });

    const categories = ['AR','AP','GL','General'];
    categories.forEach(cat => {
      // select BU entries for this category
      const entries = Object.entries(byBu).filter(([bu,list]) =>
        cat === 'General'
          ? !['AR','AP','GL'].some(pref => bu.startsWith(pref))
          : bu.startsWith(cat)
      );
      // gather all dates
      const catDates = entries.flatMap(([,list]) =>
        list.flatMap(r => getMinMaxDate(r.usedBy?.[0]?.stages||[])||[])
      );
      if (!catDates.length) return;
      const catMin = new Date(Math.min(...catDates));
      const catMax = new Date(Math.max(...catDates));

      // Category row
      rows.push([`CAT-${cat}`, cat, 'Category', catMin, catMax, null,0,null]);

      // each BU in this category
      entries.forEach(([bu,list]) => {
        const buDates = list.flatMap(r => getMinMaxDate(r.usedBy?.[0]?.stages||[])||[]);
        const buMin = new Date(Math.min(...buDates));
        const buMax = new Date(Math.max(...buDates));
        const arrowBu = expandedBu.includes(bu)?'▼':'▶';
        rows.push([`BU-${bu}`, `${arrowBu} ${bu}`, 'BU', buMin, buMax, null,0,null]);

        if (expandedBu.includes(bu)) {
          list.forEach(r => {
            const mm = getMinMaxDate(r.usedBy?.[0]?.stages||[]);
            if (!mm) return;
            const hasStages = (r.usedBy?.[0]?.stages||[]).length>0;
            const arrowRpt = hasStages
              ? (expandedRpt.includes(r.reportId)?'▼':'▶')
              : ' ';
            rows.push([
              `RPT-${r.reportId}`,
              `${arrowRpt} ${r.reportName}`,
              'Report',
              mm[0], mm[1], null,0,`BU-${bu}`
            ]);
            if (expandedRpt.includes(r.reportId)) {
              r.usedBy[0].stages.forEach(stage => {
                if (!(stage.plannedStart && stage.plannedEnd)) return;
                const isCurrent = stage.stageName === r.currentStage;
                // look up the display-friendly name
                const displayName = stageDisplayMap[stage.stageName] || stage.stageName;
                rows.push([
                  `STG-${r.reportId}-${stage.stageName.replace(/\s+/g,'_')}`,
                  displayName,
                  isCurrent ? 'Current Stage' : 'Stage',
                  new Date(stage.plannedStart),
                  new Date(stage.plannedEnd),
                  null,
                  0,
                  `RPT-${r.reportId}`
                ]);
              });
            }
          });
        }
      });
    });

    return rows;
  })();

  // expand/collapse
  const chartEvents = [{
    eventName:'select',
    callback:({ chartWrapper }) => {
      const sel = chartWrapper.getChart().getSelection();
      if (!sel.length) return;
      const taskId = chartWrapper.getDataTable().getValue(sel[0].row,0);
      if (taskId.startsWith('BU-')) {
        const bu = taskId.slice(3);
        setExpandedBu(prev => prev.includes(bu)?prev.filter(x=>x!==bu):[...prev,bu]);
      } else if (taskId.startsWith('RPT-')) {
        const rpt = taskId.slice(4);
        setExpandedRpt(prev => prev.includes(rpt)?prev.filter(x=>x!==rpt):[...prev,rpt]);
      }
    }
  }];

  return (
    <div className="overall-container">
      {/* HEADER & CARDS */}
      <div style={{
        display:'flex',
        justifyContent:'space-between',
        alignItems:'center'
      }}>
        <h1>📊 Overall Report Summary</h1>
        <div style={{ display:'flex', gap:'1rem' }}>
          <div
            className={`summary-card${filterMode==='delayed'?' selected':''}`}
            onClick={()=>setFilterMode(f=>f==='delayed'?'all':'delayed')}
          >
            <h3>⏰ Delayed</h3>
            <div>{delayedCount}</div>
          </div>
          <div
            className={`summary-card${filterMode==='due3'?' selected':''}`}
            onClick={()=>setFilterMode(f=>f==='due3'?'all':'due3')}
          >
            <h3>📅 Due in 3 Days</h3>
            <div>{due3Count}</div>
          </div>
          <div
            className={`summary-card${filterMode==='due5'?' selected':''}`}
            onClick={()=>setFilterMode(f=>f==='due5'?'all':'due5')}
          >
            <h3>📅 Due in 5 Days</h3>
            <div>{due5Count}</div>
          </div>
        </div>
      </div>

      {/* SUMMARY TABLE */}
      <table className="report-table">
      <thead>
      
<tr>
  <th>Pending Reports</th>

  {stageNames.map((s, i) => (
    <React.Fragment key={s}>
      <th>
        <button className="stage-icon" disabled>
          {stageIcons[i]}
        </button>
        <div className="stage-label">{stageDisplayMap[s] || s}</div>
      </th>

      {i === 6 && (
        <th style={{ width: '0.5rem' /* make it narrow */ }}>
          <button className="stage-icon" disabled>
            <span style={{ color: 'red', fontSize: '1.25em' }}>●</span>
          </button>
          <div className="stage-label">LIVE</div>
        </th>
      )}
    </React.Fragment>
  ))}
</tr>



  <tr>
    <td><strong>Responsible Persons</strong></td>

    {stageNames.map((s, i) => (
      <React.Fragment key={s}>
        {/* your normal PIC cell */}
        <td className="responsible">
          {picByStage[s] || '-'}
        </td>

        {/* blank placeholder under GO LIVE */}
        {i === 6 && <td className="responsible">-</td>}
      </React.Fragment>
    ))}
  </tr>
</thead>
  <tbody>
    {/* Total row */}
{/* Total row */}
<tr className="total-row">
  <td><strong>Total ({filteredReports.length})</strong></td>
  {stageNames.map((stage, idx) => (
    <React.Fragment key={stage}>
      <td><strong>{filteredReports.filter(r => r.currentStage === stage).length}</strong></td>
      {idx === 6 && (
        <td style={{ backgroundColor: 'orange', padding: 0 }} />
      )}
    </React.Fragment>
  ))}
</tr>

{/* BU rows */}
{Object.entries(buSummary).map(([bu], i) => (
  <tr key={bu}>
    <td>{bu}</td>
    {stageNames.map((s, j) => (
      <React.Fragment key={s}>
        <td
          className={filteredReports.filter(r => r.usedBy?.[0]?.buName === bu && r.currentStage === s).length === 0
            ? 'done' 
            : 'clickable-cell'}
          onClick={() =>
            navigate(`/drill/${encodeURIComponent(s)}/${encodeURIComponent(bu)}`)
          }
        >
          {filteredReports.filter(r => r.usedBy?.[0]?.buName === bu && r.currentStage === s).length}
        </td>
        {j === 6 && (
          <td style={{ backgroundColor: 'orange', padding: 0 }} />
        )}
      </React.Fragment>
    ))}
  </tr>
))}
  </tbody>
</table>

      {/* GANTT CHART */}
      <div style={{ marginTop:'2rem', overflowX:'auto' }}>
        <Chart
          chartType="Gantt"
          width="95%"
          height={`${Math.max(ganttRows.length*30,500)}px`}
          data={[columns, ...ganttRows]}
          options={{
            gantt:{
              labelStyle:{ fontName:'Segoe UI', fontSize:12 },
              trackHeight:28,
              arrow:{ angle:0, width:0, color:'transparent', radius:0 },
              criticalPathEnabled:false,
              palette:[
                { color:'#0D47A1', label:'Category' },
                { color:'#70B6FF', label:'BU' },
                { color:'#8D8E90', label:'Report' },
                { color:'#34ebb7', label:'Stage' },
                { color:'#f2e93d', label:'Current Stage' },
                { color:'#BDBDBD', label:'Today' }
              ]
            },
            hAxis:{
              minValue:new Date('2025-01-01'),
              maxValue:new Date('2025-12-31')
            }
          }}
          loader={<div>Loading Gantt chart…</div>}
          chartEvents={chartEvents}
        />
      </div>
    </div>
  );
}