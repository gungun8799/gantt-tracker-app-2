// src/pages/ResourceOverview.jsx
import React, { useEffect, useState } from 'react';
import { Chart } from 'react-google-charts';
import './Overall.css';

const apiUrl = process.env.REACT_APP_BACKEND_URL;

// ─── Columns for the Gantt chart ─────────────────────────────────────────────
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

// ─── “Today” row for the Gantt chart ─────────────────────────────────────────
const getTodayRow = () => {
  const now   = new Date();
  const start = new Date(now.setHours(0,0,0,0));
  const end   = new Date(now.setHours(23,59,59,999));
  return ['TODAY','Today','Today', start, end, null, 100, null];
};

export default function ResourceOverviewPage() {
  const [reports,     setReports]     = useState([]);
  const [expandedPic, setExpandedPic] = useState([]);
  const [expandedRpt, setExpandedRpt] = useState([]);
  const [filterPics,  setFilterPics]  = useState([]);

  useEffect(() => {
    fetch(`${apiUrl}/api/get-reports`)
      .then(r => r.json())
      .then(setReports)
      .catch(console.error);
  }, []);

  // ─── 1) Group all stages by PIC ─────────────────────────────────────────────
  const byPic = {};
  reports.forEach(r =>
    r.usedBy?.[0]?.stages?.forEach(stage =>
      (stage.PICs || []).forEach(pic => {
        (byPic[pic] ||= []).push({ report: r, stage });
      })
    )
  );
  const pics = Object.keys(byPic).sort();

  // ─── 2) Compute overall project date span ──────────────────────────────────
  let allDates = [];
  Object.values(byPic).forEach(list =>
    list.forEach(({ stage }) => {
      if (stage.plannedStart && stage.plannedEnd) {
        allDates.push(new Date(stage.plannedStart), new Date(stage.plannedEnd));
      }
    })
  );
  const globalMin = allDates.length
    ? new Date(Math.min(...allDates))
    : new Date();
  const globalMax = allDates.length
    ? new Date(Math.max(...allDates))
    : new Date();

  // ─── 3) Build array of each day in that span ───────────────────────────────
  const timelineDates = [];
  for (let day = new Date(globalMin); day <= globalMax; day.setDate(day.getDate() + 1)) {
    timelineDates.push(new Date(day));
  }

  // ─── 4) Build time-series data: one column per PIC, one row per date ─────
  const tsData = [
    ['Date', ...pics],
    ...timelineDates.map(day => [
      new Date(day),
      ...pics.map(pic =>
        (byPic[pic] || []).filter(({ stage }) => {
          const s = new Date(stage.plannedStart);
          const e = new Date(stage.plannedEnd);
          return s <= day && day <= e;
        }).length
      )
    ])
  ];

  // ─── 5) Compute metrics for bottleneck & stale ────────────────────────────
  const picMetrics = pics.map(pic => {
    const intervals = (byPic[pic] || []).flatMap(({ stage }) =>
      (stage.plannedStart && stage.plannedEnd)
        ? [[ new Date(stage.plannedStart), new Date(stage.plannedEnd) ]]
        : []
    );
    intervals.sort((a, b) => a[0] - b[0]);
    const totalMs = intervals.reduce((sum, [s, e]) => sum + (e - s), 0);
    const totalDays = totalMs / (1000*60*60*24);
    let maxGap = 0;
    for (let i = 1; i < intervals.length; i++) {
      const gap = (intervals[i][0] - intervals[i-1][1]) / (1000*60*60*24);
      if (gap > maxGap) maxGap = gap;
    }
    return { pic, totalDays, maxGap };
  });
  const bottleneck = picMetrics.reduce((a, b) => b.totalDays > a.totalDays ? b : a, { totalDays: -1 });
  const stale      = picMetrics.reduce((a, b) => b.maxGap      > a.maxGap      ? b : a, { maxGap: -1 });

  // ─── 6) LineChart options with zooming enabled ─────────────────────────────
  const lineOptions = {
    title: 'Reports per PIC Over Time',
    hAxis: {
      title: 'Date',
      format: 'MMM d, yyyy',
      viewWindowMode: 'explicit',
      viewWindow: { min: globalMin, max: globalMax }
    },
    vAxis: { title: 'Number of Reports' },
    explorer: {
      actions: ['dragToZoom', 'rightClickToReset'],
      axis: 'horizontal',
      keepInBounds: true
    },
    curveType: 'function'
  };

  // ─── 7) Build Gantt rows (unchanged) ───────────────────────────────────────
  const ganttRows = (() => {
    const rows = [ getTodayRow() ];
    const listPics = filterPics.length ? filterPics : pics;
    listPics.forEach(pic => {
      const assigns = byPic[pic] || [];
      if (!assigns.length) return;
      const dates = assigns.flatMap(({ stage }) => [
        new Date(stage.plannedStart), new Date(stage.plannedEnd)
      ]);
      const picMin = new Date(Math.min(...dates));
      const picMax = new Date(Math.max(...dates));
      const arrow = expandedPic.includes(pic) ? '▼' : '▶';
      rows.push([`PIC-${pic}`, `${arrow} ${pic}`, 'PIC', picMin, picMax, null,0,null]);
      if (expandedPic.includes(pic)) {
        const byRpt = {};
        assigns.forEach(({ report, stage }) => {
          (byRpt[report.reportId] ||= { report, stages: [] }).stages.push(stage);
        });
        Object.entries(byRpt).forEach(([rid, { report, stages }]) => {
          const rdates = stages.flatMap(s=>[
            new Date(s.plannedStart), new Date(s.plannedEnd)
          ]);
          const rMin = new Date(Math.min(...rdates));
          const rMax = new Date(Math.max(...rdates));
          const arrowRpt = expandedRpt.includes(rid) ? '▼' : '▶';
          rows.push([
            `RPT-${pic}-${rid}`,
            `${arrowRpt} ${report.reportName}`,
            'Report', rMin, rMax, null,0,`PIC-${pic}`
          ]);
          if (expandedRpt.includes(rid)) {
            stages.forEach(s =>
              rows.push([
                `STG-${pic}-${rid}-${s.stageName.replace(/\s+/g,'_')}`,
                s.stageName,'Stage',
                new Date(s.plannedStart),
                new Date(s.plannedEnd),
                null,0,`RPT-${pic}-${rid}`
              ])
            );
          }
        });
      }
    });
    return rows;
  })();

  // ─── 8) Gantt select toggle handlers ────────────────────────────────────────
  const ganttEvents = [{
    eventName: 'select',
    callback: ({ chartWrapper }) => {
      const sel = chartWrapper.getChart().getSelection();
      if (!sel.length) return;
      const id = chartWrapper.getDataTable().getValue(sel[0].row, 0);
      if (id.startsWith('PIC-')) {
        const pic = id.slice(4);
        setExpandedPic(prev => prev.includes(pic)
          ? prev.filter(x => x !== pic)
          : [...prev, pic]
        );
      } else if (id.startsWith('RPT-')) {
        const rid = id.split('-')[2];
        setExpandedRpt(prev => prev.includes(rid)
          ? prev.filter(x => x !== rid)
          : [...prev, rid]
        );
      }
    }
  }];

  // ─── 9) Clicking a line filters Gantt below ───────────────────────────────
  const lineEvents = [{
    eventName: 'select',
    callback: ({ chartWrapper }) => {
      const sel = chartWrapper.getChart().getSelection();
      if (!sel.length) return;
      const col = sel[0].column;
      if (col > 0) {
        const pic = pics[col - 1];
        setFilterPics(fp => fp.includes(pic) ? [] : [pic]);
      }
    }
  }];

  // ─── 10) Optional direct-card toggles ────────────────────────────────────
  const toggleFilterPic = pic =>
    setFilterPics(fp => fp.includes(pic) ? [] : [pic]);

  return (
    <div className="overall-container">
      <h1>👥 Resource Overview</h1>

      {/* ─── Bottleneck & Stale Cards ────────────────────────────────────── */}
      <div style={{ display:'flex', gap:'1rem', marginTop:'1rem' }}>
        <div
          className={`summary-card${filterPics.includes(bottleneck.pic)?' selected':''}`}
          onClick={()=>toggleFilterPic(bottleneck.pic)}
        >
          <h3>🚨 Bottleneck</h3>
          <div>{bottleneck.pic} ({bottleneck.totalDays.toFixed(1)}d)</div>
        </div>
        <div
          className={`summary-card${filterPics.includes(stale.pic)?' selected':''}`}
          onClick={()=>toggleFilterPic(stale.pic)}
        >
          <h3>🐢 Stale</h3>
          <div>{stale.pic} (idle {stale.maxGap.toFixed(1)}d)</div>
        </div>
      </div>

      {/* ─── Workload Over Time LineChart ──────────────────────────────────── */}
      <div style={{ marginTop:'2rem' }}>
        <Chart
          chartType="LineChart"
          width="100%"
          height="300px"
          data={tsData}
          options={lineOptions}
          chartEvents={lineEvents}
          loader={<div>Loading workload chart…</div>}
        />
      </div>

      {/* ─── Gantt Chart ──────────────────────────────────────────────────── */}
      <div style={{ marginTop:'2rem', overflowX:'auto' }}>
        <Chart
          chartType="Gantt"
          width="100%"
          height={`${Math.max(ganttRows.length * 30, 300)}px`}
          data={[columns, ...ganttRows]}
          options={{
            gantt: {
              labelStyle: { fontName:'Segoe UI', fontSize:12 },
              trackHeight: 28,
              arrow: { angle:0, width:0, color:'transparent', radius:0 },
              criticalPathEnabled: false,
              palette: [
                { color:'#1976D2', label:'PIC'     },
                { color:'#388E3C', label:'Report'  },
                { color:'#FFB300', label:'Stage'   },
                { color:'#BDBDBD', label:'Today'   }
              ]
            },
            hAxis: { minValue: globalMin, maxValue: globalMax }
          }}
          loader={<div>Loading Gantt chart…</div>}
          chartEvents={ganttEvents}
        />
      </div>
    </div>
  );
}