import React, { useState, useEffect } from 'react';import '../styles/Pages.css';
const apiUrl = process.env.REACT_APP_BACKEND_URL;
const currentUserEmail = JSON.parse(localStorage.getItem('user'))?.email || 'unknown';

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

const BUs = ["AR MALL", "AR Tendor/Cash/O2O", "AR CI", "AR Debt", "AP Trade", "AP Non Trade"];
const Priorities = ["High", "Medium", "Low"];
const rawFileOptions = [
  "AR | POS Declearation Report",
  "AR | Daily Safe Transfer Report",
  "AR | Paid in/Paid out Report",
  "AR | Daily Cash Report",
  "AR | Cash in Store Report",
  "AR | Cash Discrepancy Report",
  "AR | Cash Movement Report",
  "AR | GL05a-General Ledger (Postsing Only)",
  "AR | AR12 - Collection from Customer Listing (By Collection)",
  "AR | Cash Collection Report",
  "AR | Report_reconcile_lotus’s",
  "AR | Compare Cash Card",
  "AR | XXCP Receipt Report",
  "AR | No Deposit Report",
  "AR | XXCP GL Account Analysis Report",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP GL Account Analysis Report",
  "AR | AR12 A - Collection from Customer Listing (By Collection)",
  "AR | AR12 B - Collection from Customer Listing (By Collection)",
  "AR | Statement",
  "AR | XXCP GL Account Analysis Report",
  "AR | AR12 A - Collection from Customer Listing (By Collection)",
  "AR | AR12 B - Collection from Customer Listing (By Collection)",
  "AR | Statement",
  "AR | XXCP GL Account Analysis Report",
  "AR | AR12 A - Collection from Customer Listing (By Collection)",
  "AR | AR12 B - Collection from Customer Listing (By Collection)",
  "AR | Statement",
  "AR | XXCP GL Account Analysis",
  "AR | AR12 A - Collection from Customer Listing (By Collection)",
  "AR | AR12 B - Collection from Customer Listing (By Collection)",
  "AR | Statement",
  "AR | XXCP GL Account Analysis Report",
  "AR | Bank statement",
  "AR | Report bill payment",
  "AR | Report cash deposit",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | EDDS (credit card transaction report)",
  "AR | Bank statement",
  "AR | CCID Report",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | EDDS (credit card transaction report)",
  "AR | Bank statement",
  "AR | CCID Report",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Receive Report",
  "AR | CCID Report",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Payment Report",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Transaction Details Report",
  "AR | Settlement Report",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | QR API Report",
  "AR | Vending Machine DI Report",
  "AR | Vending Machine Reconcile",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | AR12F - Withholding Tax Report",
  "AR | Thai Output Withholding Tax Summary Report",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Statement",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Payment Report",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Payment Report",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Payment Report",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Payment Report",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Payment Report",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Payment Report",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Payment Report",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Payment Report",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Payment Report",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Payment Report",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Payment Report",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | POS Report",
  "AR | CCID Report",
  "AR | Sales Report",
  "AR | GL Missing",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Bank statement",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Bank statement",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Bank statement",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Bank statement",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Bank statement",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Bank statement",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Bank statement",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Bank statement",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Bank statement",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Bank statement",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Bank statement",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Bank statement",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Bank statement",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Bank statement",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Aging Report",
  "AR | Movement report",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | EDDS (credit card transaction report)",
  "AR | Receive Report",
  "AR | Settlement Report (Lotus's app)",
  "AR | On us volume report",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Receipt",
  "AR | CCID Report",
  "AR | Credit Card Transaction Report",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Aging Report",
  "AR | Cross Store Report",
  "AR | Period Report 2",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Receipt Summary Report (Fin002S)",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Input VAT report",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | Output VAT Report",
  "AR | ReportSLR01000 (สมุดรายวันขายสินค้า)",
  "AR | ReportACR04000รายงานภาษีขาย",
  "AR | AR06c - AR06c Food Court Output VAT Detail Report",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | AR12E-VAT Payment Report",
  "AR | Xcust รายงานภาษีขาย",
  "AR | XXCP GL Account Analysis",
  "AR | XXCP TH Trial Balance Report",
  "AR | AR08c - [RPTF26c] Deferred VAT report (by Invoice Detailed Item)",
  "AR | Aging by Account",
  "AR | XXCP_Lotus_Trial_Balance_TH_RT",
  "AR | Spreadsheet",
  "AR | XXCP_Lotus_Trial_Balance_TH_RT",
  "AR | CIS report (Report 016)",
  "AR | CIS report (Report 08-1)",
  "AR | XXCP_Lotus_Trial_Balance_TH_RT",
  "AR | CIS report (Report 01)",
  "AR | CIS report (Report 03)",
  "AR | XXCP_GL_ACC_ANALYSIS_NEW_RT",
  "AR | XXCP_Lotus_Trial_Balance_TH_RT",
  "AR | AR05c - [RPTM19c] Customer Balance Aging Report (by Invoice Item)",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP Aging by Account Report v.2",
  "AR | XXCP GL Account Analysis(No LOV) NEW",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP Aging by Account Report v.2",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP Aging by Account Report v.2",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP Aging by Account Report v.2",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP Aging by Account Report v.2",
  "AR | XXCP TH Trial Balance Report",
  "AR | AR05c - [RPTM19c] Customer Balance Aging Report (by Invoice Item)",
  "AR | XXCP Aging by Account Report v.2",
  "AR | XXCP TH Trial Balance Report",
  "AR | AR05c - [RPTM19c] Customer Balance Aging Report (by Invoice Item)",
  "AR | XXCP Aging by Account Report v.2",
  "AR | XXCP TH Trial Balance Report",
  "AR | AR05c - [RPTM19c] Customer Balance Aging Report (by Invoice Item)",
  "AR | XXCP Aging by Account Report v.2",
  "AR | XXCP GL Account Analysis(No LOV) NEW",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP GL Account Analysis(No LOV) NEW",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP Aging by Account Report v.2",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP Aging by Account Report v.2",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP Aging by Account Report v.2",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP Aging by Account Report v.2",
  "AR | XXCP GL Account Analysis(No LOV) NEW",
  "AR | XXCP TH Trial Balance Report",
  "AR | AR08b - [RPTF20a] Invoice to Customer (Detailed Item)",
  "AR | AR10 - Credit Note to Customer Listing (With CN Items)",
  "AR | AR12a - [RPTF21a] [RPTF37] Collection from Customer Listing",
  "AR | XXCP AP Trial Balance Report",
  "AR | XXCP_GL_ACC_NO_LOV_NEW",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP Receipt Report",
  "AR | AR05c - [RPTM19c] Customer Balance Aging Report (by Invoice Item)",
  "AR | XXCP TH Trial Balance Report",
  "AR | AR05c - [RPTM19c] Customer Balance Aging Report (by Invoice Item)",
  "AR | XXCP TH Trial Balance Report",
  "AR | AR05c - [RPTM19c] Customer Balance Aging Report (by Invoice Item)",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP Aging by Account Report v.2",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP Aging by Account Report v.2",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP Aging by Account Report v.2",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP Aging by Account Report v.2",
  "AR | XXCP GL Account Analysis(No LOV) NEW",
  "AR | XXCP TH Trial Balance Report",
  "AR | Bill payment report",
  "AR | Bank statement",
  "AR | XXCP GL Account Analysis(No LOV) NEW",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP Aging by Account Report v.2",
  "AR | XXCP GL Account Analysis(No LOV) NEW",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP GL Account Analysis(No LOV) NEW",
  "AR | XXCP TH Trial Balance Report",
  "AR | AR13 - 2 - Advanced Revenue Billing Schedule (temp)",
  "AR | XXCP GL Account Analysis(No LOV) NEW",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP GL Account Analysis(No LOV) NEW",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP GL Account Analysis(No LOV) NEW",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP GL Account Analysis(No LOV) NEW",
  "AR | XXCP TH Trial Balance Report",
  "AR | AR08b - [RPTF20a] Invoice to Customer (Detailed Item)",
  "AR | AR09 - [RPTF16] Reversal of Invoice to Customer Listing",
  "AR | AR10 - Credit Note to Customer Listing (With CN Items)",
  "AR | AR11 - Reversal of Credit Note to Customer Listing (with CN Item)",
  "AR | XXCP GL Account Analysis(No LOV) NEW",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP GL Account Analysis(No LOV) NEW",
  "AR | XXCP TH Trial Balance Report",
  "AR | XXCP GL Account Analysis(No LOV) NEW",
  "AR | XXCP TH Trial Balance Report",
  "AR | Invoice - Report",
  "AR | XXCP_GL_ACC_ANALYSIS_NEW_RT",
  "AR | XXCP_Lotus_Trial_Balance_TH_RT",
  "AR | GHS Reconciliation Report",
  "AR | Report from Partner Web Portal (TMN POD, TMN POL, Credit Card, QR, AllNow, 2C2P)",
  "AR | Bank statement",
  "AR | XXCP_GL_ACC_ANALYSIS_NEW_RT",
  "AR | XXCP_Lotus_Trial_Balance_TH_RT",
  "AR | Bank statement",
  "AR | Partner Report (GRAB, Robinhood,Panda 7-Market)",
  "AR | XXCP_GL_ACC_ANALYSIS_NEW_RT",
  "AR | XXCP_Lotus_Trial_Balance_TH_RT",
  "AR | Azure Report (Price diff) Lazada, Shopee",
  "AR | Payment Detail from Web portal (Lazada, Shopee, Tiktok)",
  "AR | Bank statement",
  "AR | XXCP_GL_ACC_ANALYSIS_NEW_RT",
  "AR | XXCP_Lotus_Trial_Balance_TH_RT",
  "AR | Kbank Reconcile / GRAB Reconcile / TMN - Reconcile / Panda reconcile / Lazada reconcile",
  "AR | Bank statement",
  "AR | รายงานการขาย",
  "AR | XXCP_GL_ACC_ANALYSIS_NEW_RT",
  "AR | XXCP_Lotus_Trial_Balance_TH_RT",
  "AR | Bank statement",
  "AR | Report Lotus eats",
  "AR | XXCP_GL_ACC_ANALYSIS_NEW_RT",
  "AR | XXCP_Lotus_Trial_Balance_TH_RT",
  "AR | Partner Report (GRAB, Robinhood,Panda 7-Market)",
  "AP - IM030",
  "AP - IM030.1",
  "AP - IM903",
];



const PIC_OPTIONS_PER_STAGE = {
  STG01: ["Ball", "James"],
  STG02: ["Yoong", "James","Jack", "Josh"],
  STG03: ["Aom (Axon)", "Yoong"],
  STG04: ["Aom (Axon)", "Yoong"],
  STG05: ["Biz Owner"],
  STG06: ["Jack", "Kamrai"],
  STG07: ["Suchawadee", "Ketsara", "Nipawan","Sirirporn(Thak)"],
  STG08: ["Parama (Si)"],
  STG09: ["Hooray!"]
};

export default function DataEntryPage() {
  const [reportId, setReportId] = useState('');
  const [reportName, setReportName] = useState('');
  const [currentStage, setCurrentStage] = useState('');
  const [selectedBU, setSelectedBU] = useState('');
  const [buList, setBUList] = useState([]);
  const [priority, setPriority] = useState('');
  const [rawFiles, setRawFiles] = useState([]);
  const [rawFileOptions, setRawFileOptions] = useState([]);
  const [systemNames, setSystemNames] = useState([]);
  const [systemOwners, setSystemOwners] = useState([]);
  const [selectedRawFile, setSelectedRawFile] = useState('');
  const [systemName, setSystemName] = useState('');
  const [systemOwner, setSystemOwner] = useState('');
  const [selectedBOwner, setSelectedBOwner] = useState('');
  const [businessOwnerList, setBusinessOwnerList] = useState([]);
  const [BOwnerOptions, setBOwnerOptions] = useState([]);

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

  useEffect(() => {
    fetch(`http://localhost:4000/api/rawfile-options`).then(res => res.json()).then(setRawFileOptions);
    fetch(`http://localhost:4000/api/bowner-options`).then(res => res.json()).then(setBOwnerOptions);
    fetch(`http://localhost:4000/api/system-names`).then(res => res.json()).then(setSystemNames);
    fetch(`http://localhost:4000/api/system-owners`).then(res => res.json()).then(setSystemOwners);
  }, []);

  

  const addToList = (value, setter, list) => {
    if (value && !list.includes(value)) setter([...list, value]);
  };
  
  

  const removeFromList = (value, setter, list) => {
    setter(list.filter(item => item !== value));
  };

  const handleAddRawFile = () => {
    if (selectedRawFile && systemName && systemOwner) {
      setRawFiles([...rawFiles, { fileName: selectedRawFile, systemName, systemOwner }]);
      setSelectedRawFile('');
      setSystemName('');
      setSystemOwner('');
    }
    if (!rawFileOptions.includes(selectedRawFile)) {
      setRawFileOptions(prev => [...prev, selectedRawFile]);
      fetch(`http://localhost:4000/api/save-rawfile-option`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selectedRawFile })
      });
    }
    if (!systemNames.includes(systemName)) {
      setSystemNames(prev => [...prev, systemName]);
      fetch(`http://localhost:4000/api/save-system-name`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: systemName })
      });
    }
    if (!systemOwners.includes(systemOwner)) {
      setSystemOwners(prev => [...prev, systemOwner]);
      fetch(`http://localhost:4000/api/save-system-owner`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: systemOwner })
      });
    }
  };

  const handleAddBOwner = () => {
    if (selectedBOwner) {
      if (!BOwnerOptions.includes(selectedBOwner)) {
        setBOwnerOptions(prev => [...prev, selectedBOwner]);
        fetch(`http://localhost:4000/api/save-bowner-option`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: selectedBOwner })
        });
      }
      addToList(selectedBOwner, setBusinessOwnerList, businessOwnerList);
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
        changedBy: currentUserEmail,
        changeDate: new Date().toISOString(),
        changeType: "Created",
        notes: "Submitted from DataEntryPage"
      }],
      usedBy,
      rawFiles,
      businessOwners: businessOwnerList

    };

    try {
        
        const res = await fetch(`http://localhost:4000/api/save-report`, {        method: 'POST',
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
    <input
      className="input"
      list="bowner-list"
      value={selectedBOwner}
      onChange={e => setSelectedBOwner(e.target.value)}
      placeholder="Type or select business owner"
    />
    <datalist id="bowner-list">
      {BOwnerOptions.map(o => <option key={o} value={o} />)}
    </datalist>
    <button
      className="btn-primary"
      type="button"
      onClick={handleAddBOwner} // ✅ call extracted logic
    >
      + Add Owner
    </button>
  </div>
  <div style={{ marginBottom: '1rem' }}>
    {businessOwnerList.map(owner => (
      <span key={owner} style={{ marginRight: '0.5rem' }}>
        {owner}{' '}
        <button onClick={() => removeFromList(owner, setBusinessOwnerList, businessOwnerList)}>🗑</button>
      </span>
    ))}
  </div>
</div>

      {/* Raw Files */}
      <div className="section-block">
        <h2 className="section-title">📂 Raw Files</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <input
              className="input"
              list="raw-file-list"
              value={selectedRawFile}
              onChange={e => setSelectedRawFile(e.target.value)}
              placeholder="Type or select raw file"
              style={{ flex: '1 1 30%' }}
            />
            <datalist id="raw-file-list">
              {rawFileOptions.map((f, i) => (
                <option key={`${f}-${i}`} value={f} />
              ))}
            </datalist>
            <input
  className="input"
  list="system-name-list"
  value={systemName}
  onChange={e => setSystemName(e.target.value)}
  placeholder="Type or select system"
  style={{ flex: '1 1 30%' }}
/>
<datalist id="system-name-list">
  {systemNames.map(sys => <option key={sys} value={sys} />)}
</datalist>

<input
  className="input"
  list="system-owner-list"
  value={systemOwner}
  onChange={e => setSystemOwner(e.target.value)}
  placeholder="Type or select owner"
  style={{ flex: '1 1 30%' }}
/>
<datalist id="system-owner-list">
  {systemOwners.map(owner => <option key={owner} value={owner} />)}
</datalist>
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

      <button className="btn-primary-submit-entry" onClick={handleSubmit}>💾 Submit Report</button>
    </div>
  );
}