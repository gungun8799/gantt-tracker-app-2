import React, { useState } from 'react';
import '../styles/Pages.css';
const apiUrl = process.env.REACT_APP_BACKEND_URL;
const BOwnerOptions = ["Somchai", "Kanda", "Nattapong"];
const stageTemplate = [
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

const BUs = ["Finance", "Marketing", "Supply Chain"];
const Priorities = ["High", "Medium", "Low"];
const rawFileOptions = [
  "sales_apr.xlsx",
  "stock_may.csv",
  "cost_center_data.xls"
];



const PIC_OPTIONS_PER_STAGE = {
  STG01: ["Anan", "Supaporn"],
  STG02: ["Supaporn", "Pongsak"],
  STG03: ["Pongsak", "Kanda"],
  STG04: ["Anan", "Kanda"],
  STG05: ["Kanda"],
  STG06: ["Anan", "Pongsak"],
  STG07: ["Supaporn"],
  STG08: ["Anan", "Supaporn", "Pongsak", "Kanda"],
  STG09: ["Kanda"]
};

export default function DataEntryPage() {
  const [reportId, setReportId] = useState('');
  const [reportName, setReportName] = useState('');
  const [currentStage, setCurrentStage] = useState('');
  const [selectedBU, setSelectedBU] = useState('');
  const [buList, setBUList] = useState([]);
  const [priority, setPriority] = useState('');
  const [rawFiles, setRawFiles] = useState([]);
  const [selectedRawFile, setSelectedRawFile] = useState('');
  const [systemName, setSystemName] = useState('');
  const [systemOwner, setSystemOwner] = useState('');
  const systemNames = ["SAP", "Oracle", "BigQuery"];
    const systemOwners = ["Somchai", "Kanda", "Nattapong"];
    const [selectedBOwner, setSelectedBOwner] = useState('');
    const [businessOwnerList, setBusinessOwnerList] = useState([]);
  const [stages, setStages] = useState(
    stageTemplate.map((name, index) => {
      const id = `STG0${index + 1}`;
      return {
        stageId: id,
        stageName: name,
        plannedStart: '',
        plannedEnd: '',
        actualStart: '',
        actualEnd: '',
        issueDescription: '',
        delayInDays: null,
        PICs: [],
        selectedPIC: '',
        picOptions: PIC_OPTIONS_PER_STAGE[id] || []
      };
    })
  );

  const addToList = (value, setter, list) => {
    if (value && !list.includes(value)) setter([...list, value]);
  };

  const removeFromList = (value, setter, list) => {
    setter(list.filter(item => item !== value));
  };

  const handleAddRawFile = () => {
    if (selectedRawFile && systemName && systemOwner) {
      setRawFiles([...rawFiles, {
        fileName: selectedRawFile,
        systemName,
        systemOwner
      }]);
      setSelectedRawFile('');
      setSystemName('');
      setSystemOwner('');
    }
  };

  const handleRemoveRawFile = (fileName) => {
    setRawFiles(rawFiles.filter(f => f.fileName !== fileName));
  };

  const handleStageChange = (i, field, value) => {
    const updated = [...stages];
    updated[i][field] = value;
    setStages(updated);
  };

  const handleAddPIC = (i) => {
    const updated = [...stages];
    const stage = updated[i];
    if (stage.selectedPIC && !stage.PICs.includes(stage.selectedPIC)) {
      stage.PICs.push(stage.selectedPIC);
    }
    stage.selectedPIC = '';
    setStages(updated);
  };

  const handleRemovePIC = (i, name) => {
    const updated = [...stages];
    updated[i].PICs = updated[i].PICs.filter(p => p !== name);
    setStages(updated);
  };

  const handleSubmit = async () => {
    const usedBy = buList.map(buName => ({
      buId: buName,
      buName,
      priority,
      stages: stages.map(({ selectedPIC, picOptions, ...rest }) => rest)
    }));

    const report = {
      reportId,
      reportName,
      currentStage,
      recentUpdate: new Date().toISOString(),
      changeLog: [{
        changedBy: "panithan",
        changeDate: new Date().toISOString(),
        changeType: "Created",
        notes: "Submitted from DataEntryPage"
      }],
      usedBy,
      rawFiles,
      businessOwners: businessOwnerList

    };

    try {
        
        const res = await fetch(`${apiUrl}/api/save-report`, {        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });

      const result = await res.json();
      if (res.ok) {
        alert(`✅ Report "${report.reportId}" saved.`);
        console.log(result);
      } else {
        alert(`❌ Save failed: ${result.error}`);
      }
    } catch (err) {
      console.error('❌ Backend error:', err);
      alert('❌ Could not connect to server.');
    }
  };

  return (
    <div className="page-container">
      <h1>📋 Enter Report Details</h1>

      {/* Report Info */}
      <div className="section-block">
        <h2 className="section-title">📝 Report Info</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <label className="label" style={{ flex: '1 1 45%' }}>
            Report ID
            <input className="input" value={reportId} onChange={e => setReportId(e.target.value)} />
          </label>
          <label className="label" style={{ flex: '1 1 45%' }}>
            Report Name
            <input className="input" value={reportName} onChange={e => setReportName(e.target.value)} />
          </label>
        </div>
      </div>

      {/* Business Units */}
      <div className="section-block">
        <h2 className="section-title">🏢 Business Units</h2>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <select className="select" value={selectedBU} onChange={e => setSelectedBU(e.target.value)}>
            <option value="">Select BU</option>
            {BUs.map(b => <option key={b}>{b}</option>)}
          </select>
          <button className="btn-primary" type="button" onClick={() => addToList(selectedBU, setBUList, buList)}>+ Add BU</button>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          {buList.map(bu => (
            <span key={bu} style={{ marginRight: '0.5rem' }}>
              {bu} <button onClick={() => removeFromList(bu, setBUList, buList)}>🗑</button>
            </span>
          ))}
        </div>
      </div>

      {/* Business Owners */}
      <div className="section-block">
        <h2 className="section-title">👤 Business Owner</h2>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <select className="select" value={selectedBOwner} onChange={e => setSelectedBOwner(e.target.value)}>
            <option value="">Select Owner</option>
            {BOwnerOptions.map(o => <option key={o}>{o}</option>)}
          </select>
          <button className="btn-primary" type="button" onClick={() => addToList(selectedBOwner, setBusinessOwnerList, businessOwnerList)}>+ Add Owner</button>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          {businessOwnerList.map(owner => (
            <span key={owner} style={{ marginRight: '0.5rem' }}>
              {owner} <button onClick={() => removeFromList(owner, setBusinessOwnerList, businessOwnerList)}>🗑</button>
            </span>
          ))}
        </div>
      </div>

      {/* Raw Files */}
      <div className="section-block">
        <h2 className="section-title">📂 Raw Files</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <select className="select" value={selectedRawFile} onChange={e => setSelectedRawFile(e.target.value)} style={{ flex: '1 1 30%' }}>
            <option value="">Select File</option>
            {rawFileOptions.map(f => <option key={f}>{f}</option>)}
          </select>
          <select className="select" value={systemName} onChange={e => setSystemName(e.target.value)} style={{ flex: '1 1 30%' }}>
            <option value="">Select System</option>
            {systemNames.map(sys => <option key={sys}>{sys}</option>)}
            </select>

            <select className="select" value={systemOwner} onChange={e => setSystemOwner(e.target.value)} style={{ flex: '1 1 30%' }}>
            <option value="">Select Owner</option>
            {systemOwners.map(owner => <option key={owner}>{owner}</option>)}
            </select>
          <button className="btn-primary" type="button" onClick={handleAddRawFile}>+ Add</button>
        </div>
        <ul>
          {rawFiles.map(file => (
            <li key={file.fileName}>
              📄 {file.fileName} — 🖥 {file.systemName} — 👤 {file.systemOwner}
              <button onClick={() => handleRemoveRawFile(file.fileName)} style={{ marginLeft: '1rem' }}>🗑</button>
            </li>
          ))}
        </ul>
      </div>

      {/* Priority */}
      <div className="section-block">
        <h2 className="section-title">🚦 Priority</h2>
        <select className="select" value={priority} onChange={e => setPriority(e.target.value)}>
          <option value="">Select Priority</option>
          {Priorities.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      {/* Current Stage */}
      <div className="section-block">
        <h2 className="section-title">📍 Current Stage</h2>
        <select className="select" value={currentStage} onChange={e => setCurrentStage(e.target.value)}>
          <option value="">Select Current Stage</option>
          {stages.map(s => (
            <option key={s.stageId} value={s.stageName}>{s.stageName}</option>
          ))}
        </select>
      </div>

      {/* Stages */}
      <div className="section-block">
        <h2 className="section-title">📌 Stages</h2>
        {stages.map((stage, i) => (
          <div key={i} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem', borderRadius: '6px' }}>
            <h3 className="section-title">{stage.stageName}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              <label className="label" style={{ flex: '1 1 45%' }}>
                Planned Start
                <input type="date" className="input" value={stage.plannedStart} onChange={e => handleStageChange(i, 'plannedStart', e.target.value)} />
              </label>
              <label className="label" style={{ flex: '1 1 45%' }}>
                Planned End
                <input type="date" className="input" value={stage.plannedEnd} onChange={e => handleStageChange(i, 'plannedEnd', e.target.value)} />
              </label>
              <label className="label" style={{ flex: '1 1 45%' }}>
                Actual Start
                <input type="date" className="input" value={stage.actualStart} onChange={e => handleStageChange(i, 'actualStart', e.target.value)} />
              </label>
              <label className="label" style={{ flex: '1 1 45%' }}>
                Actual End
                <input type="date" className="input" value={stage.actualEnd} onChange={e => handleStageChange(i, 'actualEnd', e.target.value)} />
              </label>
              <label className="label" style={{ flex: '1 1 100%' }}>
                PICs
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select className="select" value={stage.selectedPIC} onChange={e => handleStageChange(i, 'selectedPIC', e.target.value)}>
                    <option value="">Select PIC</option>
                    {stage.picOptions.map(p => <option key={p}>{p}</option>)}
                  </select>
                  <button className="btn-primary" type="button" onClick={() => handleAddPIC(i)}>+ Add PIC</button>
                </div>
              </label>
              <div style={{ width: '100%', marginBottom: '0.5rem' }}>
                {stage.PICs.map(pic => (
                  <span key={pic} style={{ marginRight: '0.5rem' }}>
                    {pic} <button onClick={() => handleRemovePIC(i, pic)}>🗑</button>
                  </span>
                ))}
              </div>
              <label className="label" style={{ flex: '1 1 100%' }}>
                Issue Description
                <input className="input" value={stage.issueDescription} onChange={e => handleStageChange(i, 'issueDescription', e.target.value)} />
              </label>
            </div>
          </div>
        ))}
      </div>

      <button className="btn-primary" onClick={handleSubmit}>💾 Submit Report</button>
    </div>
  );
}