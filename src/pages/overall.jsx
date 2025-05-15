// overall.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, UploadCloud, Table, Database,
  CheckSquare, Code, BarChart3, Bot
} from 'lucide-react';
import './Overall.css';
const apiUrl = process.env.REACT_APP_BACKEND_URL;

const stageNames = [
  'Gather requirements with user',
  'Select File sourcing option',
  'Produce Data mapping script',
  'Ingest to Azure & DEV',
  'UAT on Azure',
  'Data transformation for PBI',
  'UAT on PBI',
  'File sourcing automation',
  'Done'
];

const stageIcons = [
  <FileText />, <UploadCloud />, <Table />, <Database />,
  <CheckSquare />, <Code />, <BarChart3 />, <Bot />, <CheckSquare />
];

export default function OverallPage() {
  const [reports, setReports] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${apiUrl}/api/get-reports`)
      .then(res => res.json())
      .then(setReports)
      .catch(err => console.error('❌ Failed to fetch reports:', err));
  }, []);

  // Stage summary
  const stagePipeline = {};
  stageNames.forEach(stage => { stagePipeline[stage] = 0 });
  reports.forEach(r => {
    if (stagePipeline.hasOwnProperty(r.currentStage)) {
      stagePipeline[r.currentStage]++;
    }
  });

  // BU summary
  const buSummary = {};
  reports.forEach(r => {
    const bu = r.usedBy?.[0]?.buName || 'Unknown';
    buSummary[bu] = (buSummary[bu] || 0) + 1;
  });

  // PIC per stage (across all BUs)
  const picByStage = {};
  stageNames.forEach(stage => {
    const allPics = reports.flatMap(r =>
      r.usedBy?.[0]?.stages?.find(s => s.stageName === stage)?.PICs || []
    );
    const uniquePics = [...new Set(allPics)];
    picByStage[stage] = uniquePics.join(', ');
  });

  return (
    <div className="overall-container">
      <h1>📊 Overall Report Summary</h1>
      <table className="report-table">
        <thead>
          <tr>
            <th>Pending Reports</th>
            {stageNames.map((stage, idx) => (
              <th key={idx}>
                {/* ✅ Icon remains clickable */}
                <button
                  className="stage-icon" disable
                >
                  {stageIcons[idx]}
                </button>
                <div className="stage-label">{stage}</div>
              </th>
            ))}
          </tr>
          <tr>
            <td><strong>Responsible Persons</strong></td>
            {stageNames.map((stage, idx) => (
              <td key={idx} className="responsible">
                {picByStage[stage] || '-'}
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(buSummary).map(([bu], idx) => (
            <tr key={idx}>
              <td>{bu}</td>
              {stageNames.map((stage, sidx) => {
                const count = reports.filter(r =>
                  r.usedBy?.[0]?.buName === bu && r.currentStage === stage
                ).length;

                return (
                  <td
                    key={sidx}
                    className={count === 0 ? 'done' : 'clickable-cell'}
                    onClick={() => navigate(`/drill/${encodeURIComponent(stage)}/${encodeURIComponent(bu)}`)}
                    title={`Drill into ${stage}`}
                  >
                    {count}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}