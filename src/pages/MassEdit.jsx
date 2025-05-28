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
  const [mode, setMode] = useState('stage');
  const [rawFileOptions, setRawFileOptions] = useState([]);
  // picOptions per stage, initialised from /api/pic-options
  const [picOptions, setPicOptions] = useState({});

  // what the user has selected in each stage’s dropdown
  const [picUpdates, setPicUpdates] = useState({});
  
  const handleRawFileChange = e => {
    const chosen = Array.from(e.target.selectedOptions, o => o.value);
    setRawFileUpdates(chosen);
  };
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

  useEffect(() => {
    // … your existing get-reports and pic-options …
    fetch(`${apiUrl}/api/rawfile-options`)
      .then(r => r.json())
      .then(setRawFileOptions)
      .catch(console.error);
  }, []);

  // filter reports list by name or id
  useEffect(() => {
    // Make sure we always have an array
    const srcReports = Array.isArray(reports) ? reports : [];
  
    // 1️⃣ Filter reports by name or ID
    const q = searchQuery.toLowerCase();
    const filtered = srcReports.filter(r =>
      r.reportName.toLowerCase().includes(q) ||
      r.reportId.toLowerCase().includes(q)
    );
    setFilteredReports(filtered);
  
    // 2️⃣ Seed picUpdates
    if (selectedReportIds.length === 0) {
      setPicUpdates({});
    } else {
      const combined = {};
      selectedReportIds.forEach(rid => {
        const rpt = srcReports.find(r => r.reportId === rid);
        rpt?.usedBy?.[0]?.stages.forEach(stage => {
          const sid = stage.stageId;
          if (!combined[sid]) combined[sid] = new Set();
          (stage.PICs || []).forEach(pic => combined[sid].add(pic));
        });
      });
      const initialPic = {};
      Object.entries(combined).forEach(([sid, setOfPics]) => {
        initialPic[sid] = Array.from(setOfPics);
      });
      setPicUpdates(initialPic);
    }
  
    // 3️⃣ Seed rawFileUpdates
    if (selectedReportIds.length === 0) {
      setRawFileUpdates([]);
    } else {
      const rfSet = new Set();
      selectedReportIds.forEach(rid => {
        const rpt = srcReports.find(r => r.reportId === rid);
        rpt?.rawFiles?.forEach(f => rfSet.add(f.fileName));
      });
      setRawFileUpdates(Array.from(rfSet));
    }
  }, [searchQuery, reports, selectedReportIds]);
  const toggleReport = (reportId) => {
    setSelectedReportIds(ids =>
      ids.includes(reportId)
        ? ids.filter(id => id !== reportId)
        : [...ids, reportId]
    );
  };

  // inside useEffect(...)
fetch(`${apiUrl}/api/rawfile-options`)
.then(r => r.json())
.then(data => setRawFileOptions(data));
// and up top:

const [rawFileUpdates, setRawFileUpdates] = useState([]);      // ← must be an array
const [newRawFileInputs, setNewRawFileInputs] = useState({});
const [newRawFileInput, setNewRawFileInput] = useState('');


  const handlePicChange = (stageId, e) => {
    const selected = Array.from(e.target.selectedOptions, o => o.value);
    setPicUpdates(u => ({ ...u, [stageId]: selected }));
  };
  const handleStageAddRawFile = async () => {
    const val = newRawFileInput.trim();
    if (!val) return;
  
    // 1) add to local dropdown
    setRawFileOptions(opts =>
      opts.includes(val) ? opts : [...opts, val]
    );
  
    // 2) add to this selection
    setRawFileUpdates(u =>
      u.includes(val) ? u : [...u, val]
    );
  
    setNewRawFileInput('');
  
    // 3) persist for next time
    try {
      await fetch(`${apiUrl}/api/save-rawfile-option`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: val })
      });
    } catch (err) {
      console.error('Failed to save raw file option:', err);
    }
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
  
    if (mode === 'stage') {
      // ── bulk PIC update ───────────────────────────────────────
      const res = await fetch(`${apiUrl}/api/mass-update-pic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportIds: selectedReportIds,
          picUpdates
        }),
      });
  
      if (res.ok) {
        // merge into local state
        setReports(prev =>
          prev.map(r => {
            if (!selectedReportIds.includes(r.reportId)) return r;
            return {
              ...r,
              usedBy: (r.usedBy || []).map(bu => ({
                ...bu,
                stages: (bu.stages || []).map(stage => ({
                  ...stage,
                  PICs: picUpdates[stage.stageId] ?? stage.PICs
                }))
              }))
            };
          })
        );
        alert('✅ PICs updated');
      } else {
        alert('❌ Failed to update PICs');
      }
      return;
    }
  
    // ── bulk Raw-file update ───────────────────────────────────
    const res2 = await fetch(`${apiUrl}/api/mass-update-rawfile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportIds: selectedReportIds,
        rawFileNames: rawFileUpdates
      }),
    });
  
    if (res2.ok) {
      // merge rawFiles into local state
      setReports(prev =>
        prev.map(r => {
          if (!selectedReportIds.includes(r.reportId)) return r;
          return {
            ...r,
            rawFiles: rawFileUpdates.map(name => ({ fileName: name }))
          };
        })
      );
      alert('✅ Raw files updated');
    } else {
      alert('❌ Failed to update raw files');
    }
  };

  return (
    <div
      className="mass-edit-container"
      style={{
        display: 'flex',
        gap: '0.2rem',
        marginTop: '0.2rem',
        paddingBottom: '5rem'
      }}
    >
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
  {(Array.isArray(filteredReports) ? filteredReports : []).map(r => {
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
    )
  })}
</ul>
        <div style={{ marginTop: '0.2rem', minHeight: '0.2rem' }}>
          {selectedReportIds.map(id => {
            const r = reports.find(r => r.reportId === id)
            return (
              <span
                key={id}
                className="selected-report-tag"
                style={{ marginRight: 4 }}
              >
                {r?.reportName || id}
              </span>
            )
          })}
        </div>
      </div>
  
      {/* ─── Right: toggle + per‐stage / per‐rawfile edit ───────────── */}
      <div style={{ flex: 1, marginTop: '0.2rem', position: 'relative' }}>
        {/* Mode toggle */}
        <div style={{ marginBottom: '1rem' }}>
          <button
            className={`btn-secondary${mode === 'stage' ? ' selected' : ''}`}
            onClick={() => setMode('stage')}
          >
            Bulk edit by Stage
          </button>
          <button
            className={`btn-secondary${mode === 'rawfile' ? ' selected' : ''}`}
            onClick={() => setMode('rawfile')}
            style={{ marginLeft: '0.5rem' }}
          >
            Bulk edit Raw Files
          </button>
        </div>
  
        {mode === 'stage' ? (
          <>
            <h2 style={{ marginBottom: '0.5rem' }}>Bulk Edit PICs by Stage</h2>
            {stageTemplate.map((stageName, idx) => {
              const stageId = `STG0${idx + 1}`
              const options = picOptions[stageId] || []
              const selected = picUpdates[stageId] || []
              const inputVal = newPicInputs[stageId] || ''
  
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
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <h3 style={{ margin: 0, marginBottom: '0.75rem' }}>
                    {stageName}
                  </h3>
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center',
                      marginBottom: '0.75rem'
                    }}
                  >
                    <input
                      className="input"
                      list={`pic-list-${stageId}`}
                      placeholder="Select or type PIC…"
                      value={inputVal}
                      onChange={e =>
                        setNewPicInputs(inputs => ({
                          ...inputs,
                          [stageId]: e.target.value
                        }))
                      }
                      style={{ flex: 1 }}
                    />
                    <datalist id={`pic-list-${stageId}`}>
                      {options.map(p => (
                        <option key={p} value={p} />
                      ))}
                    </datalist>
                    <button
                      className="btn-secondary"
                      onClick={() => handleStageAddPIC(stageId)}
                    >
                      ➕ Add
                    </button>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}
                  >
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
              )
            })}
          </>
        ) : (
            
          <>
            <h2 style={{ marginBottom: '0.5rem' }}>
      Bulk Edit Raw Files by Report
    </h2>

    {/* fetch options on focus */}
    <div
      style={{
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        marginBottom: '0.75rem'
      }}
    >
      <input
  className="input"
  list="rawfile-list"
  placeholder="Select or type Raw File…"
  value={newRawFileInput}
  onChange={e => setNewRawFileInput(e.target.value)}
  onFocus={() => {
    // refresh in case new files were added
    fetch(`${apiUrl}/api/rawfile-options`)
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.values)
          ? data.values
          : [];
        setRawFileOptions(list);
      })
      .catch(console.error);
  }}
  style={{ flex: 1 }}
/>
<datalist id="rawfile-list">
  {/* guard .map in case rawFileOptions isn't an array for some reason */}
  {(Array.isArray(rawFileOptions) ? rawFileOptions : []).map(f => (
    <option key={f} value={f} />
  ))}
</datalist>

      <button
        className="btn-secondary"
        onClick={handleStageAddRawFile}
      >
        ➕ Add
      </button>
    </div>

    {/* show tags of selected raw files */}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {rawFileUpdates.map(f => (
        <span key={f} className="selected-report-tag">
          {f}
          <button
            style={{
              background: 'transparent',
              border: 'none',
              marginLeft: '0.25rem',
              cursor: 'pointer',
              color: 'red'
            }}
            onClick={() =>
              setRawFileUpdates(list => list.filter(x => x !== f))
            }
          >
            ×
          </button>
        </span>
      ))}
    </div>
  </>
)}
  
        {/* ── fixed save bar ─────────────────────────────────────────────────── */}
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
  )
    </div>
  );
}