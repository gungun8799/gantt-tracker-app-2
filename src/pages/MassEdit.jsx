// src/pages/MassEdit.jsx
import React, { useEffect, useState } from 'react';
import '../styles/Pages.css';

const apiUrl = process.env.REACT_APP_BACKEND_URL;

// your stage names (and IDs) must match what the backend expects
const stageTemplate = [
  'Gather requirements with user',
  'Select File sourcing option',
  'Produce Data mapping script',
  'Ingest to Azure & DEV',
  'UAT on Azure',
  'Data transformation for PBI',
  'UAT on PBI',
  'File sourcing automation',
  'Done',
];



  

export default function MassEditPage() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReportIds, setSelectedReportIds] = useState([]);

  // picOptions per stage, initialised from /api/pic-options
  const [picOptions, setPicOptions] = useState({});

  // what the user has selected in each stage’s dropdown
  const [picUpdates, setPicUpdates] = useState({});

  // temporary input for adding a new PIC per stage
  const [newPicInputs, setNewPicInputs] = useState({});
  const handleRemovePic = (stageId, name) => {
    setPicUpdates(u => ({
      ...u,
      [stageId]: (u[stageId] || []).filter(p => p !== name)
    }));
  };
  useEffect(() => {
    // fetch reports
    fetch(`${apiUrl}/api/get-reports`)
      .then(r => r.json())
      .then(data => {
        setReports(data);
        setFilteredReports(data);
      });

    // fetch pic‐options
    fetch(`${apiUrl}/api/pic-options`)
      .then(r => r.json())
      .then(data => {
        setPicOptions(data);
      });
  }, []);

  // filter reports list by name or id
  useEffect(() => {
    // 1️⃣ filter reports by name or ID
    const q = searchQuery.toLowerCase();
    const filtered = reports.filter(r =>
      r.reportName.toLowerCase().includes(q) ||
      r.reportId.toLowerCase().includes(q)
    );
    setFilteredReports(filtered);

    // 2️⃣ seed picUpdates from currently selected reports
    if (selectedReportIds.length === 0) {
      setPicUpdates({});
    } else {
      const combined = {};
      selectedReportIds.forEach(rid => {
        const rpt = reports.find(r => r.reportId === rid);
        rpt?.usedBy?.[0]?.stages.forEach(stage => {
          const sid = stage.stageId;
          if (!combined[sid]) combined[sid] = new Set();
          (stage.PICs || []).forEach(pic => combined[sid].add(pic));
        });
      });
      // convert Sets to arrays
      const initial = {};
      Object.entries(combined).forEach(([sid, setOfPics]) => {
        initial[sid] = Array.from(setOfPics);
      });
      setPicUpdates(initial);
    }
  }, [searchQuery, reports, selectedReportIds]);
  const toggleReport = (reportId) => {
    setSelectedReportIds(ids =>
      ids.includes(reportId)
        ? ids.filter(id => id !== reportId)
        : [...ids, reportId]
    );
  };

  const handlePicChange = (stageId, e) => {
    const selected = Array.from(e.target.selectedOptions, o => o.value);
    setPicUpdates(u => ({ ...u, [stageId]: selected }));
  };

  const handleStageAddPIC = async (stageId) => {
    const val = (newPicInputs[stageId] || '').trim();
    if (!val) return;

    // 1) add to local options
    setPicOptions(opts => {
      const next = { ...opts };
      next[stageId] = next[stageId] || [];
      if (!next[stageId].includes(val)) {
        next[stageId].push(val);
      }
      return next;
    });

    // 2) add to this stage’s selection
    setPicUpdates(u => {
      const curr = u[stageId] || [];
      return {
        ...u,
        [stageId]: curr.includes(val) ? curr : [...curr, val],
      };
    });

    // 3) clear input
    setNewPicInputs(i => ({ ...i, [stageId]: '' }));

    // 4) persist to server
    try {
      await fetch(`${apiUrl}/api/save-pic-option`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId, name: val }),
      });
    } catch (err) {
      console.error('Failed to save new PIC:', err);
    }
  };

  const handleSave = async () => {
    if (!selectedReportIds.length) {
      alert('Select at least one report to update.');
      return;
    }
  
    const res = await fetch(`${apiUrl}/api/mass-update-pic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportIds: selectedReportIds,
        picUpdates
      }),
    });
  
    if (res.ok) {
      // 1️⃣ Merge picUpdates into your local reports state
      setReports(prev =>
        prev.map(r => {
          if (!selectedReportIds.includes(r.reportId)) return r;
          return {
            ...r,
            usedBy: (r.usedBy || []).map(bu => ({
              ...bu,
              stages: (bu.stages || []).map(stage => ({
                ...stage,
                // overwrite PICs if we updated them for this stage
                PICs: picUpdates[stage.stageId] ?? stage.PICs
              }))
            }))
          };
        })
      );
  
      // 2️⃣ Success feedback
      alert('✅ PICs updated');
    } else {
      alert('❌ Failed to update');
    }
  };

  return (
    <div className="mass-edit-container" style={{ display: 'flex', gap: '0.2rem', marginTop: '0.2rem',paddingBottom: '5rem'  }}>
      {/* ─── Left: report selector ───────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <input
          type="text"
          placeholder="🔍 Search reports…"
          className="input"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ marginBottom: '1rem' }}
        />
        <ul
  style={{
    listStyle: 'none',
    padding: 0,
    height: '800px',
    marginLeft: '1rem',
    marginTop: '1rem',
    width: '700px',
    overflowY: 'auto',
    border: '1px solid #ccc',
    borderRadius: 4
  }}
>
  {filteredReports.map(r => {
    // Does this report have *any* stage missing PICs?
    const hasMissingPIC = r.usedBy?.[0]?.stages.some(
      stage => !stage.PICs || stage.PICs.length === 0
    );

    return (
      <li key={r.reportId} style={{ padding: '0.5rem' }}>
        <label style={{ color: hasMissingPIC ? 'red' : 'inherit' }}>
          <input
            type="checkbox"
            checked={selectedReportIds.includes(r.reportId)}
            onChange={() => toggleReport(r.reportId)}
          />{' '}
          {r.reportName} ({r.reportId})
        </label>
      </li>
    );
  })}
</ul>
        <div style={{ marginTop: '0.2rem', minHeight: '0.2rem' }}>
          {selectedReportIds.map(id => {
            const r = reports.find(r => r.reportId === id);
            return (
              <span key={id} className="selected-report-tag" style={{ marginRight: 4 }}>
                {r?.reportName || id}
              </span>
            );
          })}
        </div>
      </div>

      {/* ─── Right: per‐stage dropdown + add + tags ───────────────── */}
<div style={{ flex: 1, marginTop: '0.2rem' }}>
  <h2 style={{ marginBottom: '0.5rem' }}>Bulk Edit PICs by Stage</h2>

  {stageTemplate.map((stageName, idx) => {
    const stageId = `STG0${idx + 1}`;
    const options = picOptions[stageId] || [];
    const selected = picUpdates[stageId] || [];
    const inputVal = newPicInputs[stageId] || '';

    return (
      <div
        key={stageId}
        style={{
          marginBottom: '1rem',
          padding: '0.5rem',
          border: '1px solid #ddd',
          borderRadius: '10px',
          width: '600px',
          overflowY: 'auto',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          
        }}
      >
        {/* Stage title */}
        <h3 style={{ margin: 0, marginBottom: '0.75rem' }}>{stageName}</h3>

        {/* dropdown + Add button */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            marginBottom: '0.75rem'
          }}
        >
          <select
            className="select"
            value={inputVal}
            onChange={e =>
              setNewPicInputs(i => ({
                ...i,
                [stageId]: e.target.value
              }))
            }
            style={{ flex: 1 }}
          >
            <option value="">-- Select or type PIC --</option>
            {options.map(p => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button
            className="btn-secondary"
            onClick={() => handleStageAddPIC(stageId)}
          >
            ➕ Add
          </button>
        </div>

        {/* tags of selected PICs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {selected.map(p => (
            <span key={p} className="selected-report-tag">
              {p}
              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  marginLeft: '0.25rem',
                  cursor: 'pointer',
                  color: 'red'
                }}
                onClick={() => handleRemovePic(stageId, p)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    );
  })}

<div
  style={{
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: '#fff',
    padding: '1rem',
    boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
    textAlign: 'right',
    zIndex: 1000
  }}
>
  <button className="btn-primary" onClick={handleSave}>
    💾 Save Changes
  </button>
</div>
</div>
    </div>
  );
}