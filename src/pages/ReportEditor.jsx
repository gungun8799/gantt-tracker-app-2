import React, { useEffect, useState } from 'react';
import '../styles/Pages.css';
const apiUrl = process.env.REACT_APP_BACKEND_URL;
const currentUserEmail = JSON.parse(localStorage.getItem('user'))?.email || 'unknown';

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

const stageDisplayMap = {
  'Gather requirements with user':     'Gather requirements with user',
  'Produce Data mapping script':      'Determine solution to Ingest',
  'Select File sourcing option':      'Data model design/approval',
  'Ingest to Azure & DEV':            'Ingest to Azure',
  'UAT on Azure':                     'Dev Data Model & QA',
  'Data transformation for PBI':      'Develop PBI Report',
  'UAT on PBI':                       'UAT',
  'File sourcing automation':         'File sourcing automation',
  'Done':                             'Done'
};
export default function DashboardPage() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [selectedPIC, setSelectedPIC] = useState('');
  const [reportNameQuery, setReportNameQuery] = useState('');
  const [selectedBUs, setSelectedBUs] = useState([]);
  const [selectedStage, setSelectedStage] = useState([]);  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedReportIds, setSelectedReportIds] = useState([]);
  const [openStages, setOpenStages] = useState({});
  const [openReports, setOpenReports] = useState({});
  const [reportToDelete, setReportToDelete] = useState(null);
  const [stageChangeModal, setStageChangeModal] = useState({ open: false, reportIdx: null, newStage: null });
  const [editingStageIdx, setEditingStageIdx] = useState(null);
  const [newStageName, setNewStageName] = useState('');
  const [businessOwner, setBusinessOwner] = useState('');
  const [searchMatchedReports, setSearchMatchedReports] = useState([]);
  const [selectedReports, setSelectedReports] = useState([]); // full report objects
  const [globalPicOptions, setGlobalPicOptions] = useState({});
  const [businessOwnerList, setBusinessOwnerList] = useState([]);
  const toggleReport = (reportId) => {
    setOpenReports(prev => ({ ...prev, [reportId]: !prev[reportId] }));
  };

  const toggleStage = (key) => {
    setOpenStages(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    fetch(`${apiUrl}/api/get-reports`)
      .then(res => res.json())
      .then(data => {
        setReports(data);
        setFilteredReports(data);
      })
      .catch(err => console.error("❌ Failed to fetch reports:", err));
  }, []);

  useEffect(() => {
    fetch(`${apiUrl}/api/pic-options`)
      .then(res => res.json())
      .then(setGlobalPicOptions)
      .catch(err => console.error("❌ Failed to fetch PIC options:", err));
  }, []);

  const deleteReport = async (reportId) => {
    try {
      const res = await fetch(`${apiUrl}/api/delete-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId }),
      });
      if (res.ok) {
        alert(`🗑 Report ${reportId} deleted.`);
        setReports(prev => prev.filter(r => r.reportId !== reportId));
        setFilteredReports(prev => prev.filter(r => r.reportId !== reportId));
        setReportToDelete(null);
      } else {
        alert('❌ Failed to delete report');
      }
    } catch (err) {
      console.error('❌ Error deleting report:', err);
    }
  };

  const uniqueValues = (keyPath) => {
    const values = new Set();
  
    reports.forEach(report => {
      // normalize usedBy to an array
      const bus = Array.isArray(report.usedBy)
        ? report.usedBy
        : report.usedBy ? [report.usedBy] : [];
  
      switch (keyPath) {
        case 'buName':
          bus.forEach(b => {
            if (b.buName) values.add(b.buName);
          });
          break;
  
        case 'stageName':
          bus.forEach(b => {
            if (Array.isArray(b.stages)) {
              b.stages.forEach(s => {
                if (s.stageName) values.add(s.stageName);
              });
            }
          });
          break;
  
        case 'rawFile':
          if (Array.isArray(report.rawFiles)) {
            report.rawFiles.forEach(f => {
              if (f.fileName) values.add(f.fileName);
            });
          }
          break;
  
          case 'PICs':
            bus.forEach(b => {
              if (Array.isArray(b.stages)) {
                b.stages.forEach(s => {
                  if (Array.isArray(s.PICs)) {
                    s.PICs.forEach(p => {
                      // if p is an object, use p.name; otherwise p is already a string
                      if (p && typeof p === 'object') {
                        values.add(p.name);
                      } else if (typeof p === 'string') {
                        values.add(p);
                      }
                    });
                  }
                });
              }
            });
            break;
  
        case 'businessOwners':
          if (Array.isArray(report.businessOwners)) {
            report.businessOwners.forEach(owner => values.add(owner));
          }
          break;
  
        default:
          break;
      }
    });
  
    return Array.from(values);
  };

  const handleCheckboxChange = (value, setter, list) => {
    if (list.includes(value)) {
      setter(list.filter(v => v !== value));
    } else {
      setter([...list, value]);
    }
  };

  const handleMultiSelectChange = (event, setter) => {
    const options = Array.from(event.target.selectedOptions, opt => opt.value);
    setter(options);
  };

  const handleQuery = () => {
    let filtered = [...reports];

    if (selectedReportIds.length) {
      filtered = filtered.filter(r => selectedReportIds.includes(r.reportId));
    }

    {reportNameQuery.trim() && (
      <div style={{ marginBottom: '1rem' }}>
        <label className="label-filter">Select Specific Reports</label>
        <select
          multiple
          className="select"
          value={selectedReportIds}
          onChange={e => {
            const options = Array.from(e.target.selectedOptions, opt => opt.value);
            setSelectedReportIds(options);
          }}
          style={{ width: '100%' }}
        >
          {searchMatchedReports.map(r => (
            <option key={r.reportId} value={r.reportId}>
              {r.reportName} ({r.reportId})
            </option>
          ))}
        </select>
      </div>
    )}

    if (selectedBUs.length) {
      filtered = filtered.filter(r => selectedBUs.includes(r.usedBy[0]?.buName));
    }

    if (businessOwnerList.length) {
      filtered = filtered.filter(r =>
        r.businessOwners?.some(bo => businessOwnerList.includes(bo))
      );
    }

    if (selectedStage.length) {
      filtered = filtered.filter(r => selectedStage.includes(r.currentStage));
    }

    if (selectedFiles.length) {
      filtered = filtered.filter(r =>
        r.rawFiles?.some(f => selectedFiles.includes(f.fileName))
      );
    }

    if (selectedPIC.length) {
      filtered = filtered.filter(r => {
        const currentStage = r.currentStage;
        const stage = r.usedBy?.[0]?.stages.find(s => s.stageName === currentStage);
        return stage?.PICs?.some(p => selectedPIC.includes(p));
      });
    }

    if (selectedReports.length > 0) {
      const selectedIds = selectedReports.map(r => r.reportId);
      filtered = filtered.filter(r => selectedIds.includes(r.reportId));
    }

    setFilteredReports(filtered);
  };

  const handleAddPIC = (reportIdx, stageIdx) => {
    const updated = [...filteredReports];
    const st = updated[reportIdx].usedBy[0].stages[stageIdx];
  
    // ensure the arrays exist
    if (!Array.isArray(st.PICs)) st.PICs = [];
    if (!Array.isArray(st.picOptions)) st.picOptions = [];
  
    const newPIC = (st.selectedPIC || '').trim();
    if (!newPIC) return;
  
    if (!st.PICs.includes(newPIC)) {
      st.PICs.push(newPIC);
    }
    if (!st.picOptions.includes(newPIC)) {
      st.picOptions.push(newPIC);
    }
    // clear input
    st.selectedPIC = '';
    setFilteredReports(updated);
  };
  
  const handleRemovePIC = (reportIdx, stageIdx, name) => {
    const updated = [...filteredReports];
    const st = updated[reportIdx].usedBy[0].stages[stageIdx];
  
    // ensure the array exists
    if (!Array.isArray(st.PICs)) st.PICs = [];
  
    st.PICs = st.PICs.filter(p => p !== name);
    setFilteredReports(updated);
  };


  const handleFieldChange = (reportIdx, stageIdx, field, value) => {
    const updated = [...filteredReports];
    const stage = updated[reportIdx].usedBy[0].stages[stageIdx];
  
    const oldVal = JSON.stringify(stage[field] || '');
    const newVal = JSON.stringify(value || '');
  
    if (oldVal !== newVal) {
      updated[reportIdx].changeLog.push({
        changedBy: currentUserEmail,
        changeDate: new Date().toISOString(),
        changeType: "Update",
        notes: `Changed ${field} from "${oldVal}" to "${newVal}"`
      });
  
      stage[field] = value;
      setFilteredReports(updated);
    }
  };

  const handleCurrentStageChange = (reportIdx, newStageName) => {
    const updated = [...filteredReports];
    const report = updated[reportIdx];

    if (report.currentStage !== newStageName) {
      report.changeLog.push({
        changedBy: currentUserEmail,
        changeDate: new Date().toISOString(),
        changeType: "Stage Update",
        notes: `Changed current stage from "${report.currentStage || "N/A"}" to "${newStageName}"`
      });
      report.currentStage = newStageName;
    }

    setFilteredReports(updated);
  };

  const saveReport = async (report) => {
    try {
      const original = reports.find(r => r.reportId === report.reportId);
      const updatedStages = report?.usedBy[0]?.stages || [];
      const originalStages = original?.usedBy[0]?.stages || [];
      const diffs = [];
  
      updatedStages.forEach((stage, idx) => {
        const oldStage = originalStages[idx];
        if (!oldStage) return;
  
        ['actualStart', 'actualEnd', 'issueDescription'].forEach(field => {
          const oldVal = oldStage[field] || '';
          const newVal = stage[field] || '';
          if (oldVal !== newVal) {
            diffs.push(`🟡 ${stage.stageName} → ${field}: "${oldVal}" ➜ "${newVal}"`);
          }
        });
      });
  
      if (diffs.length > 0) {
        report.changeLog = report.changeLog || [];
        report.changeLog.push({
          changedBy: currentUserEmail,
          changeDate: new Date().toISOString(),
          changeType: 'Update',
          notes: diffs.join('\n')
        });
      }
  
      const res = await fetch(`${apiUrl}/api/update-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
  
      const result = await res.json();
      if (res.ok) {
        alert('✅ Report updated.');
      } else {
        alert('❌ Save failed: ' + result.error);
      }
    } catch (err) {
      console.error('❌ Error saving:', err);
    }
  };

  return (
    <div className="page-container">
      <h1>📊 Report Update</h1>
  
      {/* FILTER SECTION */}
      <div className="section-block-3">
        <h2 className="section-title-filter">🔍 Filter Reports</h2>
  
        {/* Top Search Field */}
        {/* Top Search Field - Minimal Style */}
<div style={{ marginBottom: '1rem' }}>
  <label className="label-filter" htmlFor="reportNameInput">
    Search by Report Name or ID
  </label>
  <input
  id="reportNameInput"
  list="reportOptions"
  className="input-report-name"
  type="text"
  placeholder="Start typing to search..."
  value={reportNameQuery}
  onChange={e => setReportNameQuery(e.target.value)}
  onInput={e => {
    const selectedText = e.target.value;
    const match = reports.find(r =>
      `${r.reportName} (${r.reportId})`.toLowerCase() === selectedText.toLowerCase()
    );
    if (match && !selectedReports.some(r => r.reportId === match.reportId)) {
      setSelectedReports(prev => [...prev, match]);
      setReportNameQuery('');
    }
  }}
  style={{ width: '100%' }}
/>
  <datalist id="reportOptions">
    {reports.map(r => (
      <option key={r.reportId} value={`${r.reportName} (${r.reportId})`} />
    ))}
  </datalist>
</div>


{selectedReports.length > 0 && (
  <div style={{ marginBottom: '1rem' }}>
    <label className="label-filter">📌 Selected Reports:</label>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
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
            width: 'calc(20.333% - 0.5rem)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
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
              padding: 0
            }}
            onClick={() => setSelectedReports(prev => prev.filter(x => x.reportId !== r.reportId))}
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



  
        {/* Grid-based Filters */}
        <div className="page-container-filter">
          {[
            {
              label: 'Business Units',
              values: uniqueValues('buName'),
              selected: selectedBUs,
              setter: setSelectedBUs,
            },
            {
              label: 'Business Owners',
              values: uniqueValues('businessOwners'),
              selected: businessOwnerList,
              setter: setBusinessOwnerList,
            },
            {
              label: 'Stages',
              values: uniqueValues('stageName'),
              selected: selectedStage,
              setter: setSelectedStage,
            },
            {
              label: 'Raw Files',
              values: uniqueValues('rawFile'),
              selected: selectedFiles,
              setter: setSelectedFiles,
            },
            {
              label: 'Person in Charge (PIC)',
              values: uniqueValues('PICs'),
              selected: selectedPIC,
              setter: setSelectedPIC,
            }
          ].map((item, i) => (
            <div key={i}>
              <label className="label-filter" style={{ marginBottom: '0.5rem', display: 'block' }}>
                {item.label}
              </label>
              <select
                multiple
                className="select"
                value={item.selected}
                onChange={e => {
                  const options = Array.from(e.target.selectedOptions, opt => opt.value);
                  item.setter(options);
                }}
                style={{ width: '100%' }}
              >
                {item.values.map(v => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
 
        
        <button className="btn-primary-query" style={{ marginTop: '0.1rem' }} onClick={handleQuery}>
          🔍 Query Reports
        </button>
        <button
          className="btn-secondary-clear-2"
          style={{ marginTop: '1rem', marginLeft: '1rem' }}
          onClick={() => {
            setReportNameQuery('');
            setSelectedBUs([]);
            setSelectedReportIds([]);
            setSearchMatchedReports([]);
            setSelectedStage([]);
            setSelectedFiles([]);
            setSelectedPIC('');
            setBusinessOwner('');
            setBusinessOwnerList([]);
            setSelectedReports([]); // 🔁 Clear selected report tags
            setFilteredReports(reports); // reset to all
          }}
        >
          ❌ Clear Filters
        </button>
      </div>

      {reportToDelete && (
        <div className="modal-backdrop">
          <div className="modal">
            <p>⚠️ Are you sure you want to delete report <strong>{reportToDelete.reportId}</strong>?</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-danger" onClick={() => deleteReport(reportToDelete.reportId)}>Yes, Delete</button>
              <button className="btn-secondary" onClick={() => setReportToDelete(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}


{stageChangeModal.open && (
  <div className="modal-backdrop">
    <div className="modal">
      {!stageChangeModal.newStage ? (
        <>
          <p>Select new stage for this report:</p>
          {stageNames.map(stage => {
            const display = stageDisplayMap[stage] || stage;
            return (
              <button
                key={stage}
                className="btn-secondary"
                style={{ display: 'block', margin: '0.25rem auto' }}
                onClick={() => setStageChangeModal(prev => ({ ...prev, newStage: stage }))}
              >
                {display}
              </button>
            );
        })}
        </>
      ) : (
        <>
          <p>Confirm changing stage to:</p>
          <strong>{stageChangeModal.newStage}</strong>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              className="btn-primary"
              onClick={() => {
                handleCurrentStageChange(stageChangeModal.reportIdx, stageChangeModal.newStage);
                setStageChangeModal({ open: false, reportIdx: null, newStage: null });
              }}
            >
              ✅ Confirm
            </button>
            <button className="btn-secondary" onClick={() => setStageChangeModal({ open: false, reportIdx: null, newStage: null })}>
              ❌ Cancel
            </button>
          </div>
        </>
      )}
    </div>
  </div>
)}

      {/* FILTERED REPORTS */}
      {filteredReports.map((report, reportIdx) => {
        const reportKey = report.reportId;
        const isReportOpen = openReports[reportKey] || false;

        return (
          <div key={report.reportId} className="section-block-2">
            <h2
              className="section-title-2"
              onClick={() => toggleReport(reportKey)}
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
                <span>
                  {report.reportName} ({report.reportId}) 
                  <span className="current-stage-label">
                    {stageDisplayMap[report.currentStage] || report.currentStage || 'No Stage'}
                  </span>
                </span>
              <span>{isReportOpen ? '▲' : '▼'}</span>
            </h2>

            {isReportOpen && (
              <>
                <p>
                  <strong>BU:</strong> {report.usedBy[0]?.buName} |
                  <strong> Priority:</strong> {report.usedBy[0]?.priority} |
                  <strong> Business Owner:</strong> {report.businessOwners || 'N/A'}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                {editingStageIdx === reportIdx ? (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select
                      className="select"
                      value={newStageName}
                      onChange={e => setNewStageName(e.target.value)}
                    >
                      <option value="">Select New Stage</option>
                      {report.usedBy?.[0]?.stages.map(s => (
                        <option key={s.stageId} value={s.stageName}>
                        {stageDisplayMap[s.stageName] || s.stageName}
                      </option>
                      ))}
                    </select>
                    <button
                      className="btn-primary"
                      onClick={() => {
                        if (newStageName) {
                          setStageChangeModal({ open: true, reportIdx, newStage: newStageName });
                          setEditingStageIdx(null);
                        }
                      }}
                    >
                      ✅ Confirm
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setEditingStageIdx(null);
                        setNewStageName('');
                      }}
                    >
                      ❌ Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div className="stage-tag">
                        {stageDisplayMap[report.currentStage] || report.currentStage || 'No Stage Selected'}
                      </div>
                    <button
                      className="btn-primary-change"
                      onClick={() => setEditingStageIdx(reportIdx)}
                    >
                      ✏️ Change Stage
                    </button>
                  </div>
                )}
              </div>

              {report.usedBy[0]?.stages.map((stage, stageIdx) => {
  const stageKey = `${report.reportId}-${stage.stageId}`;
  const isStageOpen = openStages[stageKey] || false;

  // Determine if the stage is completed or current
  const allStageNames = report.usedBy[0]?.stages.map(s => s.stageName);
  const currentStageIndex = allStageNames.indexOf(report.currentStage);
  const isCompleted = stageIdx <= currentStageIndex;

  const handleReportBuChange = (reportIdx, newBu) => {
    const updated = [...filteredReports];
    updated[reportIdx].usedBy[0].buName = newBu;
    setFilteredReports(updated);
  };

  const handleReportOwnerChange = (reportIdx, newOwner) => {
    const updated = [...filteredReports];
    updated[reportIdx].businessOwners = newOwner;
    setFilteredReports(updated);
  };

  const saveReport = async report => {
    /* unchanged */
  };
  

  return (
    <div
      key={stage.stageId}
      style={{ borderTop: '1px solid #ccc', paddingTop: '1rem', marginTop: '1rem' }}
      className={isCompleted ? 'stage-completed' : ''}
    >
      <h3
        className="section-title-3"
        onClick={() => toggleStage(stageKey)}
        style={{
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        {stageDisplayMap[stage.stageName] || stage.stageName}
        <span>{isStageOpen ? '▲' : '▼'}</span>
      </h3>

      {isStageOpen && (
  <>
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      
    <div style={{ flex: '1 1 100%' }}>
  <label className="label-editor" style={{ display: 'block', marginBottom: '0.5rem' }}>
    Person in Charge (PIC)
  </label>

{/* …inside the “edit‐mode off” case for PICs… */}
{/* …inside the “edit‐mode off” case for PICs… */}
{!stage.editingPIC ? (
  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
    {stage.PICs?.length > 0 ? (
      stage.PICs.map((p, i) => {
        // If p is an object with { name, org }, format it accordingly; otherwise assume it's a string
        const displayText =
          p && typeof p === 'object'
            ? (p.org?.trim() ? `${p.name} (${p.org})` : p.name)
            : p;

        return (
          <span
            key={`${typeof p === 'object' ? p.name + p.org : p}-${i}`}
            className="selected-report-tag"
          >
            {displayText}
          </span>
        );
      })
    ) : (
      <span>No PIC Assigned</span>
    )}
    <button
      className="btn-primary-change-pic"
      onClick={() => {
        const updated = [...filteredReports];
        updated[reportIdx].usedBy[0].stages[stageIdx].editingPIC = true;
        // Clear any leftover inputs when entering edit mode
        updated[reportIdx].usedBy[0].stages[stageIdx].selectedPIC = '';
        updated[reportIdx].usedBy[0].stages[stageIdx].selectedOrg = '';
        setFilteredReports(updated);
      }}
    >
      ✏️ Edit PIC
    </button>
  </div>
) : (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    {/* input + add button */}
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <input
        className="input"
        list={`pic-list-${stage.stageId}`}
        value={stage.selectedPIC || ''}
        placeholder="Type or select PIC"
        onChange={e => {
          const updated = [...filteredReports];
          updated[reportIdx].usedBy[0].stages[stageIdx].selectedPIC = e.target.value;
          setFilteredReports(updated);
        }}
        style={{ flex: 1 }}
      />
      <datalist id={`pic-list-${stage.stageId}`}>
        {(globalPicOptions[stage.stageId]?.entries || []).map((entry, idx) => (
          <option key={`${entry.name}-${entry.org}-${idx}`} value={entry.name} />
        ))}
      </datalist>

      <input
        className="input"
        list={`org-list-${stage.stageId}`}
        value={stage.selectedOrg || ''}
        placeholder="Type or select Org"
        onChange={e => {
          const updated = [...filteredReports];
          updated[reportIdx].usedBy[0].stages[stageIdx].selectedOrg = e.target.value;
          setFilteredReports(updated);
        }}
        style={{ flex: 1 }}
      />
      <datalist id={`org-list-${stage.stageId}`}>
        {(globalPicOptions[stage.stageId]?.entries || [])
          .filter(entry => entry.name === stage.selectedPIC)
          .map((entry, idx) => (
            <option key={`${entry.name}-${entry.org}-org-${idx}`} value={entry.org} />
          ))}
      </datalist>

      <button
        className="btn-primary"
        onClick={() => handleAddPIC(reportIdx, stageIdx)}
      >
        + Add PIC
      </button>
    </div>

    {/* current PIC tags with remove buttons */}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {(stage.PICs || []).map((p, i) => {
        const displayText =
          p && typeof p === 'object'
            ? (p.org?.trim() ? `${p.name} (${p.org})` : p.name)
            : p;
        return (
          <span
            key={`${typeof p === 'object' ? p.name + p.org : p}-${i}`}
            className="selected-report-tag"
          >
            {displayText}
            <button
              style={{
                background: 'transparent',
                border: 'none',
                marginLeft: '0.25rem',
                cursor: 'pointer',
                color: 'red',
              }}
              onClick={() => handleRemovePIC(reportIdx, stageIdx, p)}
            >
              ×
            </button>
          </span>
        );
      })}
    </div>

    {/* cancel editing */}
    <button
      className="btn-secondary"
      onClick={() => {
        const updated = [...filteredReports];
        delete updated[reportIdx].usedBy[0].stages[stageIdx].editingPIC;
        delete updated[reportIdx].usedBy[0].stages[stageIdx].selectedPIC;
        delete updated[reportIdx].usedBy[0].stages[stageIdx].selectedOrg;
        setFilteredReports(updated);
      }}
    >
      ❌ Cancel
    </button>
  </div>
)}
</div>
      
      <label className="label-editor" style={{ flex: '1 1 45%' }}>
        Actual Start
        <input
          type="date"
          className="input"
          value={stage.actualStart || ''}
          onChange={e => handleFieldChange(reportIdx, stageIdx, 'actualStart', e.target.value)}
        />
      </label>
      <label className="label-editor" style={{ flex: '1 1 45%' }}>
        Actual End
        <input
          type="date"
          className="input"
          value={stage.actualEnd || ''}
          onChange={e => handleFieldChange(reportIdx, stageIdx, 'actualEnd', e.target.value)}
        />
      </label>
     
      <label className="label-editor" style={{ flex: '1 1 45%' }}>
          Planned Start
          <input
            type="date"
            className="input"
            value={stage.plannedStart || ''}
            onChange={e => handleFieldChange(reportIdx, stageIdx, 'plannedStart', e.target.value)}
          />
        </label>

        <label className="label-editor" style={{ flex: '1 1 45%' }}>
          Planned End
          <input
            type="date"
            className="input"
            value={stage.plannedEnd || ''}
            onChange={e => handleFieldChange(reportIdx, stageIdx, 'plannedEnd', e.target.value)}
          />
        </label>


      <label className="label-editor" style={{ flex: '1 1 100%' }}>
        Remark/Issues
        <textarea
          className="input-remark"
          rows={4}
          placeholder="Describe the update or issues..."
          value={stage.issueDescription || ''}
          onChange={e => handleFieldChange(reportIdx, stageIdx, 'issueDescription', e.target.value)}
        />
      </label>
      
    </div>

{/* 
<div className="save-stage-btn-wrapper">
  <button className="btn-save-stage" onClick={() => saveReport(report)}>
    💾 Save This Stage
  </button>
</div>
*/}
  </>
)}
    </div>
  );
})}

{isReportOpen && (
  <>
<div className="save-report-sticky-bar">
                <button
                  className="btn-primary-save"
                  style={{ marginTop: '1rem' }}
                  onClick={() => saveReport(report)}
                >
                  💾 Save Changes
                </button>

                <button
          className="btn-danger-delete"
          style={{ marginLeft: '1rem' }}
          onClick={() => setReportToDelete(report)}
        >
          🗑 Delete Report
        </button>
</div>
</>
)}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
