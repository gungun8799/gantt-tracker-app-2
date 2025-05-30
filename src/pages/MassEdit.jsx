// src/pages/MassEdit.jsx
import React, { useEffect, useState } from 'react';
import '../styles/Pages.css';

const apiUrl = process.env.REACT_APP_BACKEND_URL;
const REPORTS_CACHE_KEY = 'massedit_reports';
const PIC_OPTIONS_CACHE_KEY = 'massedit_picOptions';
const RAWFILES_CACHE_KEY    = 'massedit_rawFileOptions';
const SYSNAMES_CACHE_KEY  = 'massedit_systemNames';
const SYSOWNERS_CACHE_KEY = 'massedit_systemOwners';

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


// helper to load & save JSON
// helper to load & save JSON
const loadCache = key => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const { data } = JSON.parse(raw);
      return data;
    } catch {
      return null;
    }
  };
  const saveCache = (key, data) => {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  };
  

export default function MassEditPage() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReportIds, setSelectedReportIds] = useState([]);
  const [mode, setMode] = useState('stage');
  const [rawFileOptions, setRawFileOptions] = useState([]);
  // picOptions per stage, initialised from /api/pic-options
  const [picOptions, setPicOptions] = useState({});
  const [systemNames, setSystemNames] = useState([]);
  const [systemOwners, setSystemOwners] = useState([]);
  const [newSystemName,  setNewSystemName]  = useState('');
  const [newSystemOwner, setNewSystemOwner] = useState('');
  // what the user has selected in each stage’s dropdown
  const [picUpdates, setPicUpdates] = useState({});
  const [timelineUpdates, setTimelineUpdates] = useState({});
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
    // ── Reports ───────────────────────────────────────────────
    const cachedReports = loadCache(REPORTS_CACHE_KEY);
    if (cachedReports) {
      setReports(cachedReports);
      setFilteredReports(cachedReports);
    } else {
      fetch(`http://localhost:4000/api/get-reports`)
        .then(r => r.json())
        .then(data => {
          setReports(data);
          setFilteredReports(data);
          saveCache(REPORTS_CACHE_KEY, data);
        })
        .catch(console.error);
    }

    // ── PIC options ──────────────────────────────────────────
    const cachedPics = loadCache(PIC_OPTIONS_CACHE_KEY);
    if (cachedPics) {
      setPicOptions(cachedPics);
    } else {
      fetch(`http://localhost:4000/api/pic-options`)
        .then(r => r.json())
        .then(data => {
          setPicOptions(data);
          saveCache(PIC_OPTIONS_CACHE_KEY, data);
        })
        .catch(console.error);
    }

      // ── Raw-file options ─────────────────────────────────────
  const cachedRaw = loadCache(RAWFILES_CACHE_KEY);
  if (cachedRaw) {
    setRawFileOptions(cachedRaw);
  } else {
    fetch(`http://localhost:4000/api/rawfile-options`)
      .then(r => r.json())
      .then(data => {
        setRawFileOptions(data);
        saveCache(RAWFILES_CACHE_KEY, data);
      })
      .catch(console.error);
  }

  // ── System Names ─────────────────────────────────────────
  const cachedSysNames = loadCache(SYSNAMES_CACHE_KEY);
  if (cachedSysNames) {
    setSystemNames(cachedSysNames);
  } else {
    fetch(`http://localhost:4000/api/system-names`)
      .then(r => r.json())
      .then(data => {
        setSystemNames(data);
        saveCache(SYSNAMES_CACHE_KEY, data);
      })
      .catch(console.error);
  }

  // ── System Owners ────────────────────────────────────────
  const cachedSysOwners = loadCache(SYSOWNERS_CACHE_KEY);
  if (cachedSysOwners) {
    setSystemOwners(cachedSysOwners);
  } else {
    fetch(`http://localhost:4000/api/system-owners`)
      .then(r => r.json())
      .then(data => {
        setSystemOwners(data);
        saveCache(SYSOWNERS_CACHE_KEY, data);
      })
      .catch(console.error);
  }
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
    // 4️⃣ Seed timelineUpdates
if (selectedReportIds.length === 0) {
    setTimelineUpdates({});
  } else {
    const tl = {};
    selectedReportIds.forEach(rid => {
      const rpt = srcReports.find(r => r.reportId === rid);
      (rpt?.usedBy?.[0]?.stages || []).forEach(stage => {
        tl[stage.stageId] = {
          plannedStart: stage.plannedStart || '',
          plannedEnd:   stage.plannedEnd   || '',
          actualStart:  stage.actualStart  || '',
          actualEnd:    stage.actualEnd    || '',
        };
      });
    });
    setTimelineUpdates(tl);
  }
  }, [searchQuery, reports, selectedReportIds]);
  const toggleReport = (reportId) => {
    setSelectedReportIds(ids =>
      ids.includes(reportId)
        ? ids.filter(id => id !== reportId)
        : [...ids, reportId]
    );
  };



const [rawFileUpdates, setRawFileUpdates] = useState([]);      // ← must be an array
const [newRawFileInputs, setNewRawFileInputs] = useState({});
const [newRawFileInput, setNewRawFileInput] = useState('');


  const handlePicChange = (stageId, e) => {
    const selected = Array.from(e.target.selectedOptions, o => o.value);
    setPicUpdates(u => ({ ...u, [stageId]: selected }));
  };
  const handleStageAddRawFile = async () => {
    const file  = newRawFileInput.trim();
    const sys   = newSystemName.trim();
    const owner = newSystemOwner.trim();
    if (!file || !sys || !owner) {
      return; // or alert("Fill all three")
    }
  
    const newEntry = { fileName: file, systemName: sys, systemOwner: owner };
  
    // 1️⃣ update local selection list, avoiding duplicates
    setRawFileUpdates(list => {
      const exists = list.some(
        e =>
          e.fileName    === newEntry.fileName &&
          e.systemName  === newEntry.systemName &&
          e.systemOwner === newEntry.systemOwner
      );
      return exists ? list : [...list, newEntry];
    });
  
    // 2️⃣ ensure dropdown options exist
    setRawFileOptions(opts =>
      opts.includes(file) ? opts : [...opts, file]
    );
    setSystemNames(list =>
      list.includes(sys) ? list : [...list, sys]
    );
    setSystemOwners(list =>
      list.includes(owner) ? list : [...list, owner]
    );
  
    // 3️⃣ clear inputs
    setNewRawFileInput('');
    setNewSystemName('');
    setNewSystemOwner('');
  
    // 4️⃣ persist
    try {
      await Promise.all([
        fetch(`http://localhost:4000/api/save-rawfile-option`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file })
        }),
        fetch(`http://localhost:4000/api/save-system-name`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: sys })
        }),
        fetch(`http://localhost:4000/api/save-system-owner`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: owner })
        })
      ]);
    } catch (err) {
      console.error('Failed to save raw file, system name, or system owner:', err);
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
      await fetch(`http://localhost:4000/api/save-pic-option`, {
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
      // ── 1) bulk PIC update ───────────────────────────────────
      const picRes = await fetch(`http://localhost:4000/api/mass-update-pic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportIds: selectedReportIds,
          picUpdates
        }),
      });
  
      // ── 2) bulk timeline update ──────────────────────────────
      const timelineRes = await fetch(`http://localhost:4000/api/mass-update-timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportIds: selectedReportIds,
          timelineUpdates
        }),
      });
  
      if (picRes.ok && timelineRes.ok) {
        // ── 3) merge everything into local state ────────────────
        setReports(prev =>
          prev.map(r => {
            if (!selectedReportIds.includes(r.reportId)) return r;
            return {
              ...r,
              usedBy: (r.usedBy || []).map(bu => ({
                ...bu,
                stages: (bu.stages || []).map(stage => {
                  const sid = stage.stageId;
                  return {
                    ...stage,
                    PICs: picUpdates[sid]      ?? stage.PICs,
                    plannedStart: timelineUpdates[sid]?.plannedStart ?? stage.plannedStart,
                    plannedEnd:   timelineUpdates[sid]?.plannedEnd   ?? stage.plannedEnd,
                    actualStart:  timelineUpdates[sid]?.actualStart  ?? stage.actualStart,
                    actualEnd:    timelineUpdates[sid]?.actualEnd    ?? stage.actualEnd,
                  };
                })
              }))
            };
          })
        );
  
        alert('✅ PICs & timelines updated');
      } else {
        console.error('PIC error:', await picRes.text());
        console.error('Timeline error:', await timelineRes.text());
        alert('❌ Failed to update PICs and/or timelines');
      }
  
      return;
    }
  
    // … your existing Raw-file branch unchanged …
  
  
    // ── bulk Raw-file update ───────────────────────────────────
    const res2 = await fetch(`http://localhost:4000/api/mass-update-rawfile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportIds: selectedReportIds,
          rawFileNames: rawFileUpdates.map(e => e.fileName)
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
  const stages = r.usedBy?.[0]?.stages || [];

  // 1️⃣ still missing PICs?
  const hasMissingPIC = stages.some(
    stage => !stage.PICs || stage.PICs.length === 0
  );

  // 2️⃣ still missing any of the 4 dates?
  const hasMissingDates = stages.some(stage =>
    !stage.plannedStart ||
    !stage.plannedEnd   

  );

  // both PICs and dates complete?
  const isFullyComplete = !hasMissingPIC && !hasMissingDates;

  // decide color: missing‐PIC always red, then fully complete → green, else default
  const labelColor = hasMissingPIC
    ? 'red'
    : isFullyComplete
    ? 'green'
    : 'inherit';

  return (
    <li key={r.reportId} style={{ padding: '0.5rem' }}>
      <label style={{ color: labelColor }}>
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
                    width: '1000px',
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

                    {/* ─── Timeline editors ──────────────────────────────── */}
<div
  style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem',
    marginTop: '0.75rem',
  }}
>
  {['plannedStart','plannedEnd','actualStart','actualEnd'].map(field => (
    <label key={field} style={{ display:'flex', flexDirection:'column', fontSize:'0.85rem' }}>
      {field.replace(/([A-Z])/g, ' $1').replace(/^./,str=>str.toUpperCase())}
      <input
        type="date"
        className="input"
        value={timelineUpdates[stageId]?.[field] || ''}
        onChange={e =>
          setTimelineUpdates(tl => ({
            ...tl,
            [stageId]: {
              ...tl[stageId],
              [field]: e.target.value
            }
          }))
        }
      />
    </label>
  ))}
</div>
                  </div>
                </div>
              )
            })}
          </>
        ) : (
            
          <>
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
    {/* Raw File */}
    <input
      className="input"
      list="rawfile-list"
      placeholder="Select or type Raw File…"
      value={newRawFileInput}
      onChange={e => setNewRawFileInput(e.target.value)}
      onFocus={() => {
        fetch(`http://localhost:4000/api/rawfile-options`)
          .then(res => res.json())
          .then(data => setRawFileOptions(Array.isArray(data) ? data : data.values || []))
          .catch(console.error);
      }}
      style={{ flex: 1 }}
    />
    <datalist id="rawfile-list">
      {rawFileOptions.map(f => <option key={f} value={f} />)}
    </datalist>

    {/* System Name */}
    <input
      className="input"
      list="system-list"
      placeholder="Select or type System…"
      value={newSystemName}
      onChange={e => setNewSystemName(e.target.value)}
      onFocus={() => {
        fetch(`http://localhost:4000/api/system-names`)
          .then(res => res.json())
          .then(data => setSystemNames(Array.isArray(data) ? data : data.values || []))
          .catch(console.error);
      }}
      style={{ flex: 1 }}
    />
    <datalist id="system-list">
      {systemNames.map(s => <option key={s} value={s} />)}
    </datalist>

    {/* System Owner */}
    <input
      className="input"
      list="owner-list"
      placeholder="Select or type System Owner…"
      value={newSystemOwner}
      onChange={e => setNewSystemOwner(e.target.value)}
      onFocus={() => {
        fetch(`http://localhost:4000/api/system-owners`)
          .then(res => res.json())
          .then(data => setSystemOwners(Array.isArray(data) ? data : data.values || []))
          .catch(console.error);
      }}
      style={{ flex: 1 }}
    />
    <datalist id="owner-list">
      {systemOwners.map(o => <option key={o} value={o} />)}
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
  {rawFileUpdates.map(entry => (
    <span
      key={`${entry.fileName}-${entry.systemName}-${entry.systemOwner}`}
      className="selected-report-tag"
    >
      {/* display each field */}
      {entry.fileName} — {entry.systemName} / {entry.systemOwner}
      <button
        style={{
          background: 'transparent',
          border: 'none',
          marginLeft: '0.25rem',
          cursor: 'pointer',
          color: 'red'
        }}
        onClick={() =>
          setRawFileUpdates(list =>
            list.filter(
              x =>
                !(
                  x.fileName === entry.fileName &&
                  x.systemName === entry.systemName &&
                  x.systemOwner === entry.systemOwner
                )
            )
          )
        }
      >
        ×
      </button>
    </span>
  ))}
</div>
</>
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