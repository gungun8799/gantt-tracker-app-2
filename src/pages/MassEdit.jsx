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
    const handleRemovePic = (stageId, name, org) => {
        setPicUpdates(u => ({
          ...u,
          [stageId]: (u[stageId] || []).filter(
            p => !(p.name === name && p.org === org)
          )
        }));
      };

  
  useEffect(() => {
    // ── Reports ───────────────────────────────────────────────
    fetch(`http://localhost:4000/api/get-reports`)
      .then(res => res.json())
      .then(data => {
        setReports(data);
        setFilteredReports(data);
      })
      .catch(console.error);
  
    // ── PIC options ──────────────────────────────────────────
    fetch(`http://localhost:4000/api/pic-options`)
      .then(res => res.json())
      .then(setPicOptions)
      .catch(console.error);
  
    // ── Raw-file options ─────────────────────────────────────
    fetch(`http://localhost:4000/api/rawfile-options`)
      .then(res => res.json())
      .then(setRawFileOptions)
      .catch(console.error);
  
    // ── System Names ─────────────────────────────────────────
    fetch(`http://localhost:4000/api/system-names`)
      .then(res => res.json())
      .then(setSystemNames)
      .catch(console.error);
  
    // ── System Owners ────────────────────────────────────────
    fetch(`http://localhost:4000/api/system-owners`)
      .then(res => res.json())
      .then(setSystemOwners)
      .catch(console.error);
  }, []);

  // filter reports list by name or id
  // Replace your existing useEffect([... searchQuery, reports, selectedReportIds]) with this:

  useEffect(() => {
    // ── 1️⃣ Filter reports by name or ID ─────────────────────────────────────────────
    const srcReports = Array.isArray(reports) ? reports : [];
    const q = searchQuery.toLowerCase();
    const filtered = srcReports.filter(r =>
      r.reportName.toLowerCase().includes(q) ||
      r.reportId.toLowerCase().includes(q)
    );
    setFilteredReports(filtered);
  
    // ── 2️⃣ Seed picUpdates, normalizing both old‐style strings and new {name,org} objects ──
    if (selectedReportIds.length === 0) {
      setPicUpdates({});
    } else {
      const initialPic = {};
  
      selectedReportIds.forEach(rid => {
        const rpt = srcReports.find(r => r.reportId === rid);
        if (!rpt) return;
  
        // usedBy might be an array or a plain object with numeric keys
        const usedByArr = Array.isArray(rpt.usedBy)
          ? rpt.usedBy
          : Object.values(rpt.usedBy || {});
  
        usedByArr.forEach(bu => {
          (bu.stages || []).forEach(stage => {
            const sid = stage.stageId;
            if (!initialPic[sid]) initialPic[sid] = [];
  
            (stage.PICs || []).forEach(picEntry => {
              if (picEntry && typeof picEntry === 'object' && picEntry.name) {
                // new‐style: { name, org }
                initialPic[sid].push({ name: picEntry.name, org: picEntry.org || '' });
              } else if (typeof picEntry === 'string') {
                // old‐style: just a string
                initialPic[sid].push({ name: picEntry, org: '' });
              }
            });
          });
        });
      });
  
      // Deduplicate exact {name,org} pairs
      Object.entries(initialPic).forEach(([sid, arr]) => {
        const seen = new Set();
        const deduped = [];
        arr.forEach(e => {
          const key = `${e.name}||${e.org}`;
          if (!seen.has(key)) {
            seen.add(key);
            deduped.push(e);
          }
        });
        initialPic[sid] = deduped;
      });
  
      setPicUpdates(initialPic);
    }
  
    // ── 3️⃣ Seed rawFileUpdates as full objects ───────────────────────────────────────
    if (selectedReportIds.length === 0) {
      setRawFileUpdates([]);
    } else {
      const entries = [];
      selectedReportIds.forEach(rid => {
        const rpt = srcReports.find(r => r.reportId === rid);
        (rpt?.rawFiles || []).forEach(f => {
          entries.push({
            fileName:    f.fileName,
            systemName:  f.systemName   || '',
            systemOwner: f.systemOwner  || ''
          });
        });
      });
      const unique = [];
      const seen = new Set();
      for (let e of entries) {
        const key = `${e.fileName}||${e.systemName}||${e.systemOwner}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(e);
        }
      }
      setRawFileUpdates(unique);
    }
  
    // ── 4️⃣ Seed timelineUpdates ────────────────────────────────────────────────────
    if (selectedReportIds.length === 0) {
      setTimelineUpdates({});
    } else {
      const tl = {};
      selectedReportIds.forEach(rid => {
        const rpt = srcReports.find(r => r.reportId === rid);
        const usedByArr = Array.isArray(rpt.usedBy)
          ? rpt.usedBy
          : Object.values(rpt.usedBy || {});
  
        // Assume we use the first bu object (index 0) as before
        (usedByArr[0]?.stages || []).forEach(stage => {
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
    const entry = newPicInputs[stageId] || { name: '', org: '' };
    const name = entry.name.trim();
    const org  = entry.org.trim();
  
    if (!name || !org) {
      // require both fields
      return;
    }
  
    // ── 1) Update local picOptions so it stays as { names: [...], entries: [...] }
    setPicOptions(opts => {
      // Clone the existing picOptions object
      const next = { ...opts };
  
      // If nothing existed for this stageId, initialize to { names: [], entries: [] }
      if (
        !next[stageId] ||
        typeof next[stageId] !== 'object' ||
        Array.isArray(next[stageId])
      ) {
        next[stageId] = { names: [], entries: [] };
      }
  
      // Pull out whatever was already there
      const existingNames   = Array.isArray(next[stageId].names)   ? next[stageId].names   : [];
      const existingEntries = Array.isArray(next[stageId].entries) ? next[stageId].entries : [];
  
      // If this name is not yet in names[], push it
      if (!existingNames.includes(name)) {
        existingNames.push(name);
      }
  
      // If this exact {name, org} pair isn’t in entries[], push it
      const alreadyHasPair = existingEntries.some(e => e.name === name && e.org === org);
      if (!alreadyHasPair) {
        existingEntries.push({ name, org });
      }
  
      // Write back the merged object
      next[stageId] = {
        names:   existingNames,
        entries: existingEntries
      };
      return next;
    });
  
    // ── 2) Merge into picUpdates[stageId] so the “Selected” tags show up
    setPicUpdates(u => {
      const curr = Array.isArray(u[stageId]) ? u[stageId] : [];
      const exists = curr.some(p => p.name === name && p.org === org);
  
      return {
        ...u,
        [stageId]: exists
          ? curr
          : [...curr, { name, org }]
      };
    });
  
    // ── 3) Clear the input boxes
    setNewPicInputs(i => ({
      ...i,
      [stageId]: { name: '', org: '' }
    }));
  
    // ── 4) Persist both name + org to Firestore for next load
    try {
      await fetch(`${apiUrl}/api/save-pic-option`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId, name, org }),
      });
    } catch (err) {
      console.error('Failed to save new PIC (with org) to pic-options:', err);
    }
  };
  
  const handleSave = async () => {
    console.log("💾 handleSave fired", { selectedReportIds, picUpdates, timelineUpdates });
  
    if (!selectedReportIds.length) {
      alert("Select at least one report to update.");
      return;
    }
  
    if (mode === "stage") {
      try {
        // ── 1) Mass-update PICs ───────────────────────────────────────────────
        // (hard-code “http://localhost:4000” here so we know it’s not an env-var issue)
        const picRes = await fetch(`http://localhost:4000/api/mass-update-pic`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportIds: selectedReportIds,
            picUpdates,
          }),
        });
        console.log("▶️ picRes.status:", picRes.status);
  
        // ── 2) Mass-update Timeline ───────────────────────────────────────────
        const timelineRes = await fetch(`http://localhost:4000/api/mass-update-timeline`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportIds: selectedReportIds,
            timelineUpdates,
          }),
        });
        console.log("▶️ timelineRes.status:", timelineRes.status);
  
        if (picRes.ok && timelineRes.ok) {
          // ── 3) Merge results into local state ─────────────────────────────────
          const updatedReports = await Promise.all(
            selectedReportIds.map(async (reportId) => {
              // find the original locally
              const original = reports.find((r) => r.reportId === reportId);
              if (!original) {
                console.warn(`⚠️ original report not found in local state: ${reportId}`);
                return null;
              }
  
              // normalize usedBy → always array
              const rawUsedBy = original.usedBy;
              const usedByArray = Array.isArray(rawUsedBy)
                ? rawUsedBy
                : rawUsedBy
                ? Object.values(rawUsedBy)
                : [];
  
              // build a brand-new usedBy by merging in whatever picUpdates/timelineUpdates we have
              const mergedUsedBy = usedByArray.map((bu) => {
                return {
                  ...bu,
                  stages: (bu.stages || []).map((stage) => {
                    const sid = stage.stageId;
                    // if picUpdates[sid] exists, use that; otherwise keep old stage.PICs
                    const newPICs = picUpdates.hasOwnProperty(sid)
                      ? picUpdates[sid]
                      : stage.PICs || [];
                    const newPlannedStart =
                      timelineUpdates[sid]?.plannedStart ?? stage.plannedStart;
                    const newPlannedEnd =
                      timelineUpdates[sid]?.plannedEnd ?? stage.plannedEnd;
                    const newActualStart =
                      timelineUpdates[sid]?.actualStart ?? stage.actualStart;
                    const newActualEnd =
                      timelineUpdates[sid]?.actualEnd ?? stage.actualEnd;
  
                    return {
                      ...stage,
                      PICs: newPICs,
                      plannedStart: newPlannedStart,
                      plannedEnd: newPlannedEnd,
                      actualStart: newActualStart,
                      actualEnd: newActualEnd,
                    };
                  }),
                };
              });
  
              // create the payload to re-POST
              const updatedReport = {
                ...original,
                usedBy: mergedUsedBy,
              };
  
              console.log("▶️ updating report to Firestore:", reportId, updatedReport);
              const res = await fetch(`http://localhost:4000/api/update-report`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedReport),
              });
              if (!res.ok) {
                console.error(
                  `❌ Failed to update report ${reportId}:`,
                  await res.text()
                );
              }
              return updatedReport;
            })
          );
  
          // now merge those updated ones into local state
          setReports((prev) =>
            prev.map((r) => {
              const replacement = updatedReports.find(
                (u) => u && u.reportId === r.reportId
              );
              return replacement || r;
            })
          );
  
          alert("✅ PICs & timelines updated");
        } else {
          if (!picRes.ok) {
            console.error("PIC error:", await picRes.text());
          }
          if (!timelineRes.ok) {
            console.error("Timeline error:", await timelineRes.text());
          }
          alert("❌ Failed to update PICs and/or timelines");
        }
      } catch (err) {
        console.error("❌ handleSave (stage) error:", err);
        alert("❌ Failed to save changes");
      }
  
      return;
    }
  
    // ── Raw-file branch unchanged ───────────────────────────────────────────────
    const res2 = await fetch(`http://localhost:4000/api/mass-update-rawfile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportIds: selectedReportIds,
        rawFileEntries: rawFileUpdates,
      }),
    });
  
    if (res2.ok) {
      // re-fetch all reports so that UI fully refreshes
      try {
        const freshRes = await fetch(`http://localhost:4000/api/get-reports`);
        if (!freshRes.ok) throw new Error(await freshRes.text());
        const fresh = await freshRes.json();
        setReports(fresh);
        setFilteredReports(fresh);
        setRawFileUpdates([]);
        setSelectedReportIds([]);
        alert("✅ Raw files updated");
      } catch (err) {
        console.error("❌ Error refreshing after raw-file update:", err);
        alert("❌ Updated Firestore, but could not refresh local data.");
      }
    } else {
      alert("❌ Failed to update raw files");
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
<div
  style={{
    marginTop: '0.2rem',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    alignItems: 'center'
  }}
>
  {/* Clear All */}
  {selectedReportIds.length > 0 && (
    <button
      className="btn-secondary-clear"
      onClick={() => setSelectedReportIds([])}
      style={{ marginRight: '1rem' }}
    >
      ❌ Clear All
    </button>
  )}

  {/* Individual tags with “×” */}
  {selectedReportIds.map(id => {
    const r = reports.find(r => r.reportId === id)
    return (
      <span
        key={id}
        className="selected-report-tag"
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#e0e0e0',
          borderRadius: '6px',
          padding: '4px 8px'
        }}
      >
        <button
          onClick={() => toggleReport(id)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'red',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginRight: '0.5rem',
            padding: 0
          }}
        >
          ×
        </button>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {r?.reportName || id}
        </span>
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
  const stageId = `STG0${idx + 1}`;

  // picOptions[stageId] may be an array of names (legacy) or an object { names, entries }
  const rawPicOpt = picOptions[stageId] || {};
  const optionNames = Array.isArray(rawPicOpt) ? rawPicOpt : rawPicOpt.names || [];
  const optionEntries = Array.isArray(rawPicOpt) ? [] : rawPicOpt.entries || [];

  // “selected” is an array of { name, org }
  const selected = picUpdates[stageId] || [];

  // newPicInputs[stageId] is { name, org }
  const inputObj = newPicInputs[stageId] || { name: '', org: '' };
  const nameVal = inputObj.name || '';
  const orgVal  = inputObj.org  || '';

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

      {/* PIC Name + Organization inputs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
          marginBottom: '0.75rem'
        }}
      >
        {/* PIC Name with datalist */}
        <input
          className="input"
          list={`pic-list-${stageId}`}
          placeholder="Select or type PIC…"
          value={nameVal}
          onChange={e =>
            setNewPicInputs(inputs => ({
              ...inputs,
              [stageId]: {
                ...(inputs[stageId] || {}),
                name: e.target.value
              }
            }))
          }
          style={{ flex: 1 }}
        />
        <datalist id={`pic-list-${stageId}`}>
          {optionNames.map(p => (
            <option key={p} value={p} />
          ))}
        </datalist>

        {/* Organization input */}
        <input
          className="input"
          list={`org-list-${stageId}`}
          placeholder="Organization…"
          value={orgVal}
          onChange={e =>
            setNewPicInputs(inputs => ({
              ...inputs,
              [stageId]: {
                ...(inputs[stageId] || {}),
                org: e.target.value
              }
            }))
          }
          style={{ flex: 1 }}
        />
        <datalist id={`org-list-${stageId}`}>
          {optionEntries
            // only show entries whose name matches the selected PIC name
            .filter(entry => entry.name === nameVal && entry.org)
            .map((entry, i) => (
              <option key={`${entry.name}|${entry.org}|${i}`} value={entry.org} />
            ))}
        </datalist>

        <button
          className="btn-secondary"
          onClick={() => handleStageAddPIC(stageId)}
        >
          ➕ Add
        </button>
      </div>

      {/* Display selected PICs with their organizations */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}
      >
        {selected.map((p, i) => (
          <span
            key={`${p.name}-${p.org}-${i}`}
            className="selected-report-tag"
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#e0e0e0',
              borderRadius: '6px',
              padding: '4px 8px'
            }}
          >
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {p.name} {p.org ? `(${p.org})` : ''}
            </span>
            <button
              style={{
                background: 'transparent',
                border: 'none',
                marginLeft: '0.25rem',
                cursor: 'pointer',
                color: 'red'
              }}
              onClick={() =>
                setPicUpdates(u => {
                  const newArr = (u[stageId] || []).filter(
                    entry => !(entry.name === p.name && entry.org === p.org)
                  );
                  return { ...u, [stageId]: newArr };
                })
              }
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* ─── Timeline editors ──────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
          marginTop: '0.75rem'
        }}
      >
        {['plannedStart', 'plannedEnd', 'actualStart', 'actualEnd'].map(field => (
          <label
            key={field}
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: '0.85rem'
            }}
          >
            {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
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
  );
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