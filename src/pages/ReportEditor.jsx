import React, { useEffect, useState } from 'react';
import '../styles/Pages.css';
const apiUrl = process.env.REACT_APP_BACKEND_URL;
const currentUserEmail = JSON.parse(localStorage.getItem('user'))?.email || 'unknown';


export default function DashboardPage() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [selectedPIC, setSelectedPIC] = useState('');
  const [reportNameQuery, setReportNameQuery] = useState('');
  const [selectedBUs, setSelectedBUs] = useState([]);
  const [selectedStage, setSelectedStage] = useState([]);  const [selectedFiles, setSelectedFiles] = useState([]);

  const [openStages, setOpenStages] = useState({});
  const [openReports, setOpenReports] = useState({});
  const [reportToDelete, setReportToDelete] = useState(null);
  const [stageChangeModal, setStageChangeModal] = useState({ open: false, reportIdx: null, newStage: null });
  const [editingStageIdx, setEditingStageIdx] = useState(null);
  const [newStageName, setNewStageName] = useState('');
  const [businessOwner, setBusinessOwner] = useState('');
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
      switch (keyPath) {
        case 'buName':
          report.usedBy?.forEach(b => values.add(b.buName));
          break;
  
        case 'stageName':
          report.usedBy?.forEach(b => {
            b.stages?.forEach(s => values.add(s.stageName));
          });
          break;
  
        case 'rawFile':
          report.rawFiles?.forEach(f => values.add(f.fileName));
          break;
  
        case 'PICs':
          report.usedBy?.forEach(b => {
            b.stages?.forEach(s => {
              s.PICs?.forEach(p => values.add(p));
            });
          });
          break;
  
        case 'businessOwners':
          report.businessOwners?.forEach(owner => values.add(owner));
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

    if (reportNameQuery.trim()) {
      filtered = filtered.filter(r =>
        r.reportName.toLowerCase().includes(reportNameQuery.toLowerCase())
      );
    }

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

    setFilteredReports(filtered);
  };

  const handleFieldChange = (reportIdx, stageIdx, field, value) => {
    const updated = [...filteredReports];
    const stage = updated[reportIdx].usedBy[0].stages[stageIdx];

    if (
      (field === 'actualStart' || field === 'actualEnd' || field === 'issueDescription') &&
      stage[field] !== value
    ) {
      updated[reportIdx].changeLog.push({
        changedBy: currentUserEmail,
        changeDate: new Date().toISOString(),
        changeType: "Update",
        notes: `Changed ${field} from "${stage[field] || 'empty'}" to "${value}"`
      });
    }

    stage[field] = value;
    setFilteredReports(updated);
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
        <div style={{ marginBottom: '1rem' }}>
          <label className="label-filter" htmlFor="reportNameInput">
            Search by Report Name
          </label>
          <input
            id="reportNameInput"
            className="input-report-name"
            type="text"
            placeholder="e.g. Report name"
            value={reportNameQuery}
            onChange={e => setReportNameQuery(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
  
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
 
        
        <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={handleQuery}>
          🔍 Query Reports
        </button>
        <button
          className="btn-secondary"
          style={{ marginTop: '1rem', marginLeft: '1rem' }}
          onClick={() => {
            setReportNameQuery('');
            setSelectedBUs([]);
            setSelectedStage([]);
            setSelectedFiles([]);
            setSelectedPIC('');
            setBusinessOwner('');
            setBusinessOwnerList([]);
            setFilteredReports(reports); // reset to all
          }}
        >
          🔄 Clear Filters
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
          {filteredReports[stageChangeModal.reportIdx]?.usedBy?.[0]?.stages.map(s => (
            <button
              key={s.stageId}
              className="btn-secondary"
              style={{ display: 'block', margin: '0.25rem auto' }}
              onClick={() => setStageChangeModal(prev => ({ ...prev, newStage: s.stageName }))}
            >
              {s.stageName}
            </button>
          ))}
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
                  <span className="current-stage-label"> {report.currentStage || 'No Stage'}</span>
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
                        <option key={s.stageId} value={s.stageName}>{s.stageName}</option>
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
                      {report.currentStage || 'No Stage Selected'}
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
        {stage.stageName}
        <span>{isStageOpen ? '▲' : '▼'}</span>
      </h3>

      {isStageOpen && (
  <>
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
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