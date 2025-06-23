import React, { useState, useEffect } from 'react';import '../styles/Pages.css';
const apiUrl = process.env.REACT_APP_BACKEND_URL;
const currentUserEmail = JSON.parse(localStorage.getItem('user'))?.email || 'unknown';

const stageTemplate = [
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

const BUs = ["General", "AP","AR","GL","AR MALL", "AR Cash","AR Tendor","AR O2O", "AR CI", "AR Debt", "AP Trade", "AP Non Trade", "GL"];
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
  STG01: ["Ball", "James", "Kade", "Phen"],
  STG02: ["Yoong", "James","Jack", "Josh", "Others"],
  STG03: ["Aom (Axon)", "Yoong", "Josh", "Jack"],
  STG04: ["Aom (Axon)", "Yoong"],
  STG05: ["Biz Owner", "James"],
  STG06: ["Biz Owner", "James", "Aom (Axon)"],
  STG07: ["Biz Owner"],
  STG08: ["Parama (Si)", "Aom (Axon)"],
  STG09: ["Done"]
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
    fetch(`${apiUrl}/api/rawfile-options`).then(res => res.json()).then(setRawFileOptions);
    fetch(`${apiUrl}/api/bowner-options`).then(res => res.json()).then(setBOwnerOptions);
    fetch(`${apiUrl}/api/system-names`).then(res => res.json()).then(setSystemNames);
    fetch(`${apiUrl}/api/system-owners`).then(res => res.json()).then(setSystemOwners);
  }, []);

  useEffect(() => {
    // Fetch global PIC options per stageId
    fetch(`${apiUrl}/api/pic-options`)
      .then(res => res.json())
      .then(data => {
        const updated = stages.map(stage => {
          const backendEntry = data[stage.stageId];
          // If backend sent an array (legacy), use it directly.
          // Otherwise extract `.names` (fall back to existing if missing).
          const namesArray = Array.isArray(backendEntry)
            ? backendEntry
            : (backendEntry?.names || stage.picOptions);
  
          return {
            ...stage,
            picOptions: namesArray
          };
        });
        setStages(updated);
      })
      .catch(console.error);
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
      fetch(`${apiUrl}/api/save-rawfile-option`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selectedRawFile })
      });
    }
    if (!systemNames.includes(systemName)) {
      setSystemNames(prev => [...prev, systemName]);
      fetch(`${apiUrl}/api/save-system-name`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: systemName })
      });
    }
    if (!systemOwners.includes(systemOwner)) {
      setSystemOwners(prev => [...prev, systemOwner]);
      fetch(`${apiUrl}/api/save-system-owner`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: systemOwner })
      });
    }
  };

  const handleAddBOwner = () => {
    if (selectedBOwner) {
      if (!BOwnerOptions.includes(selectedBOwner)) {
        setBOwnerOptions(prev => [...prev, selectedBOwner]);
        fetch(`${apiUrl}/api/save-bowner-option`, {
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

  const handleAddPIC = async i => {
    const updated = [...stages];
    const stage = updated[i];
    const name = stage.selectedPIC.trim();
    const org  = (stage.selectedPICOrg || '').trim();
    if (!name || !org) return; 
    // 1) add to displayed PIC list if not already present
    if (!stage.PICs.some(p => p.name === name && p.org === org)) {
      stage.PICs.push({ name, org });
    }
    // 2) if this PIC name is brand-new, also push it into picOptions
    if (!stage.picOptions.includes(name)) {
      stage.picOptions.push(name);
      // send to backend: only save “name” into pic_options names[]. Org is stored per‐report only
      await fetch(`${apiUrl}/api/save-pic-option`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId: stage.stageId, name, org })
      });
    }
    // 3) clear inputs
    stage.selectedPIC = '';
    stage.selectedPICOrg = '';
    setStages(updated);
  };

  
  const handleRemovePIC = (i, name, org) => {
    const updated = [...stages];
    updated[i].PICs = updated[i].PICs.filter(p => !(p.name === name && p.org === org));
    setStages(updated);
  };

  const getMissingFields = () => {
    const missing = [];
  
    if (!reportId.trim()) missing.push('Report ID');
    if (!reportName.trim()) missing.push('Report Name');
    if (!currentStage) missing.push('Current Stage');
    if (buList.length === 0) missing.push('Business Unit(s)');
    if (!priority) missing.push('Priority');
    if (rawFiles.length === 0) missing.push('Raw File(s)');
    if (businessOwnerList.length === 0) missing.push('Business Owner(s)');
  
    return missing;
  };

  const handleFinishStage = (i) => {
    const updated = [...stages];
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
  
    const formatDate = (d) => d.toISOString().split('T')[0];
  
    updated[i].plannedStart = formatDate(sevenDaysAgo);
    updated[i].plannedEnd = formatDate(today);
    updated[i].actualStart = formatDate(sevenDaysAgo);
    updated[i].actualEnd = formatDate(today);
    updated[i].issueDescription = "Done"; // 🆕 Auto-fill with "Doe"
  
    setStages(updated);
  
    // Set currentStage to the next one (if it exists)
    if (i + 1 < updated.length) {
      setCurrentStage(updated[i + 1].stageName);
    }
  };


  const handleSubmit = async () => {
    // ✅ Auto-commit any unadded PICs
    const updatedStages = stages.map(stage => {
      const newPIC = stage.selectedPIC?.trim();
      if (newPIC && !stage.picOptions.includes(newPIC)) {
        stage.picOptions.push(newPIC);
        console.log('📤 Saving PIC:', newPIC, 'for stage', stage.stageId); // ✅ ADD THIS
        fetch(`${apiUrl}/api/save-pic-option`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newPIC, stageId: stage.stageId })
        });
      }

      if (newPIC && !stage.PICs.includes(newPIC)) {
        stage.PICs.push(newPIC);
      }

      stage.selectedPIC = '';
      return stage;
    });
  
    setStages(updatedStages); // ⚠️ optional, for UI consistency
  
    const missingFields = getMissingFields();
  
    if (missingFields.length > 0) {
      alert(`❌ Please fill in the following required field(s):\n- ${missingFields.join('\n- ')}`);
      return;
    }
  
    const usedBy = buList.map(buName => ({
      buId: buName,
      buName,
      priority,
      stages: updatedStages.map(({ selectedPIC, picOptions, ...rest }) => rest)
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
      const res = await fetch(`${apiUrl}/api/save-report`, {
        method: 'POST',
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
  <div className="data-entry-wrapper">
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
            <option key={s.stageId} value={s.stageName}>
            {stageDisplayMap[s.stageName] || s.stageName}
            </option>
          ))}
        </select>
      </div>

      {/* Stages */}
      <div className="section-block">
        <h2 className="section-title">📌 Stages</h2>
        {stages.map((stage, i) => {
  // Each stage now has:
  //   stage.PICs: { name: string, org: string }[]
  //   stage.selectedPIC: string
  //   stage.selectedPICOrg: string
  //
  // (Later, handleAddPIC pushes { name, org } into stage.PICs.)

  return (
    <div
      key={stage.stageId}
      style={{
        border: '1px solid #ccc',
        padding: '1rem',
        marginBottom: '1rem',
        borderRadius: '6px'
      }}
    >
      <h3 className="section-title">
        {stageDisplayMap[stage.stageName] || stage.stageName}
      </h3>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Planned/Actual Date Inputs (unchanged) */}
        <label className="label" style={{ flex: '1 1 45%' }}>
          Planned Start
          <input
            type="date"
            className="input"
            value={stage.plannedStart}
            onChange={e => handleStageChange(i, 'plannedStart', e.target.value)}
          />
        </label>
        <label className="label" style={{ flex: '1 1 45%' }}>
          Planned End
          <input
            type="date"
            className="input"
            value={stage.plannedEnd}
            onChange={e => handleStageChange(i, 'plannedEnd', e.target.value)}
          />
        </label>
        <label className="label" style={{ flex: '1 1 45%' }}>
          Actual Start
          <input
            type="date"
            className="input"
            value={stage.actualStart}
            onChange={e => handleStageChange(i, 'actualStart', e.target.value)}
          />
        </label>
        <label className="label" style={{ flex: '1 1 45%' }}>
          Actual End
          <input
            type="date"
            className="input"
            value={stage.actualEnd}
            onChange={e => handleStageChange(i, 'actualEnd', e.target.value)}
          />
        </label>

        {/* ───── PIC name + Org ───── */}
        <label className="label" style={{ flex: '1 1 100%' }}>
          PICs
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {/* PIC Name Input with datalist */}
            <input
              className="input"
              list={`pic-list-${i}`}
              value={stage.selectedPIC}
              onChange={e => handleStageChange(i, 'selectedPIC', e.target.value)}
              placeholder="Type or select PIC name"
              style={{ flex: '1 1 45%' }}
            />
            <datalist id={`pic-list-${i}`}>
              {stage.picOptions.map((pName, idx) => (
                <option key={`${pName}-${idx}`} value={pName} />
              ))}
            </datalist>

            {/* Organization Input */}
            <input
              className="input"
              list={`org-list-${i}`}
              value={stage.selectedPICOrg || ''}
              onChange={e => handleStageChange(i, 'selectedPICOrg', e.target.value)}
              placeholder="Type or select Organization"
              style={{ flex: '1 1 45%' }}
            />
            <datalist id={`org-list-${i}`}>
              {/* show all orgs that exist for this stage’s picOptions.entries (if you fetched them) */}
              {(stage.picOptionsEntries || []).map((entry, idx) => (
                // entry has shape { name, org }
                <option key={`${entry.name}|${entry.org}|${idx}`} value={entry.org} />
              ))}
            </datalist>

            <button
              className="btn-primary"
              type="button"
              onClick={() => handleAddPIC(i)}
            >
              + Add PIC
            </button>
          </div>
        </label>

        {/* Display each PIC as “Name (Org)”, with a remove button */}
        <div style={{ width: '100%', marginBottom: '0.5rem' }}>
          {stage.PICs.map((picObj, idx) => (
            <span key={`${picObj.name}-${picObj.org}-${idx}`} style={{ marginRight: '0.5rem' }}>
              {picObj.name}
              {picObj.org ? ` (${picObj.org})` : ''}
              <button onClick={() => handleRemovePIC(i, picObj.name, picObj.org)}>
                🗑
              </button>
            </span>
          ))}
        </div>

        {/* Issue Description (unchanged) */}
        <label className="label" style={{ flex: '1 1 100%' }}>
          Issue Description
          <input
            className="input"
            value={stage.issueDescription}
            onChange={e => handleStageChange(i, 'issueDescription', e.target.value)}
          />
        </label>

        <button
          className="btn-secondary-finish"
          onClick={() => handleFinishStage(i)}
          style={{ marginTop: '1rem' }}
        >
          ✅ Finish This Stage
        </button>
      </div>
    </div>
  );
})}
      </div>

    
  <div className="page-container scrollable-form">
    {/* All your form sections like Report Info, BU, etc. */}
    ...
  </div>

  <div className="sticky-footer">
        <button className="btn-primary-submit-entry" onClick={handleSubmit}>
        💾 Submit Report
      </button>
    </div>
  </div>        
    </div>
  );
}