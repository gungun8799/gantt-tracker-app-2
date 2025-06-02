import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config(); // ✅ Load env FIRST

const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS_JSON); // ✅ Now it's available
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const db = admin.firestore();
const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: "https://gantt-tracker-app-frontend-2.onrender.com",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  })
);
app.use(bodyParser.json());

const optionCollections = {
  'rawfile-option': 'rawfile-options',
  'bowner-option': 'bowner-options',
  'system-name': 'system-names',
  'system-owner': 'system-owners'
};

// GET endpoints: /api/<collection>
Object.values(optionCollections).forEach(collection => {
  app.get(`/api/${collection}`, async (req, res) => {
    try {
      const snap = await db.collection(collection).get();
      const items = snap.docs.map(doc => doc.id);
      res.json(items);
    } catch (err) {
      console.error(`❌ Failed to fetch ${collection}:`, err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// POST endpoints: /api/save-<key>
Object.entries(optionCollections).forEach(([key, collection]) => {
  app.post(`/api/save-${key}`, async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing name' });

    try {
      await db.collection(collection).doc(name).set({ createdAt: Date.now() });
      res.json({ success: true, saved: name });
    } catch (err) {
      console.error(`❌ Failed to save to ${collection}:`, err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});





app.post('/api/save-report', async (req, res) => {
  try {
    const data = req.body;
    if (!data.reportId) return res.status(400).json({ error: 'Missing reportId' });

    await db.collection('reports').doc(data.reportId).set(data);
    res.status(200).json({ message: '✅ Report saved successfully', reportId: data.reportId });
  } catch (err) {
    console.error('❌ Error saving report:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/get-reports', async (req, res) => {
    try {
      const snapshot = await db.collection('reports').get();
      const data = snapshot.docs.map(doc => doc.data());
      res.json(data);
    } catch (err) {
      console.error('🔥 Failed to fetch reports:', err);
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  });

  app.post('/api/update-report', async (req, res) => {
    try {
      const report = req.body;
      await db.collection('reports').doc(report.reportId).set(report);
      res.status(200).json({ message: 'Report updated successfully' });
    } catch (error) {
      console.error("❌ Firebase update error:", error);
      res.status(500).json({ error: 'Failed to update report' });
    }
  });

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Example Express route
let rawFileMasterList = []; // Load from DB or file initially

app.post('/api/add-raw-file', (req, res) => {
  const { fileName } = req.body;
  if (!fileName) return res.status(400).json({ error: 'Missing fileName' });

  if (!rawFileMasterList.includes(fileName)) {
    rawFileMasterList.push(fileName);
    // Optionally save to file or DB here
  }

  res.json({ success: true, updatedList: rawFileMasterList });
});

app.get('/api/get-raw-files', (req, res) => {
  res.json(rawFileMasterList);
});

app.post('/api/delete-report', async (req, res) => {
    const { reportId } = req.body;
    if (!reportId) return res.status(400).json({ error: 'Missing reportId' });
  
    try {
      await admin.firestore().collection('reports').doc(reportId).delete();
      res.json({ success: true, message: `Report ${reportId} deleted.` });
    } catch (err) {
      console.error(`❌ Error deleting report ${reportId}:`, err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // === 🔁 Dropdown Options Support ===

app.post('/api/dropdown/save-option', async (req, res) => {
  const { type, value } = req.body;
  if (!type || !value) {
    return res.status(400).json({ error: 'Missing type or value' });
  }

  try {
    const docRef = db.collection('dropdown_options').doc(type);
    const doc = await docRef.get();

    if (!doc.exists) {
      await docRef.set({ values: [value] });
    } else {
      const existing = doc.data().values || [];
      if (!existing.includes(value)) {
        await docRef.update({ values: [...existing, value] });
      }
    }

    res.json({ success: true, value });
  } catch (err) {
    console.error('❌ Failed to save dropdown option:', err);
    res.status(500).json({ error: 'Failed to save option' });
  }
});

app.get('/api/dropdown/get-options/:type', async (req, res) => {
  const { type } = req.params;
  try {
    const doc = await db.collection('dropdown_options').doc(type).get();
    if (!doc.exists) return res.json({ values: [] });

    res.json(doc.data());
  } catch (err) {
    console.error('❌ Failed to fetch dropdown options:', err);
    res.status(500).json({ error: 'Failed to fetch options' });
  }
});

// === 🔁 RAW FILE OPTIONS ===
app.get('/api/rawfile-options', async (req, res) => {
  try {
    const snap = await db.collection('rawfile-options').get();
    const items = snap.docs.map(doc => doc.id);
    res.json(items);
  } catch (err) {
    console.error('❌ Failed to fetch rawfile-options:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/save-rawfile-option', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });

  try {
    await db.collection('rawfile-options').doc(name).set({ createdAt: Date.now() });
    res.json({ success: true, saved: name });
  } catch (err) {
    console.error('❌ Failed to save rawfile-option:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// === 🔁 BOWNER OPTIONS ===
app.get('/api/bowner-options', async (req, res) => {
  try {
    const snap = await db.collection('bowner-options').get();
    const items = snap.docs.map(doc => doc.id);
    res.json(items);
  } catch (err) {
    console.error('❌ Failed to fetch bowner-options:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/save-bowner-option', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });

  try {
    await db.collection('bowner-options').doc(name).set({ createdAt: Date.now() });
    res.json({ success: true, saved: name });
  } catch (err) {
    console.error('❌ Failed to save bowner-option:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// === 🔁 SYSTEM NAMES ===
app.get('/api/system-names', async (req, res) => {
  try {
    const snap = await db.collection('system-names').get();
    const items = snap.docs.map(doc => doc.id);
    res.json(items);
  } catch (err) {
    console.error('❌ Failed to fetch system-names:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/save-system-name', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });

  try {
    await db.collection('system-names').doc(name).set({ createdAt: Date.now() });
    res.json({ success: true, saved: name });
  } catch (err) {
    console.error('❌ Failed to save system-name:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🔐 Login route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const snapshot = await db
      .collection('users_login')
      .where('email', '==', email)
      .where('password', '==', password)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userData = snapshot.docs[0].data();
    return res.json({ email: userData.email, role: userData.role });
  } catch (err) {
    console.error('❌ Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// === 🔁 SYSTEM OWNERS ===
app.get('/api/system-owners', async (req, res) => {
  try {
    const snap = await db.collection('system-owners').get();
    const items = snap.docs.map(doc => doc.id);
    res.json(items);
  } catch (err) {
    console.error('❌ Failed to fetch system-owners:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/save-system-owner', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });

  try {
    await db.collection('system-owners').doc(name).set({ createdAt: Date.now() });
    res.json({ success: true, saved: name });
  } catch (err) {
    console.error('❌ Failed to save system-owner:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ↓ replace your existing app.post('/api/mass-update-pic', …) with this:
// ↓ replace your existing app.post('/api/mass-update-pic', …) with this:
// ↓ Replace your existing mass-update-pic exactly with this:
// ↓ Replace your entire existing handler with this one:
// Replace your existing mass-update-pic with this entire block:

app.post('/api/mass-update-pic', async (req, res) => {
  const { reportIds, picUpdates } = req.body;
  if (!Array.isArray(reportIds) || typeof picUpdates !== 'object') {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  try {
    // 1) Build a batched write
    const batch = db.batch();

    // 2) For each reportId, normalize usedBy → always an array
    for (let reportId of reportIds) {
      const docRef = db.collection('reports').doc(reportId);
      const snap = await docRef.get();
      if (!snap.exists) continue;

      const report = snap.data();

      // If usedBy is not an array, convert it into a single‐element array
      const rawUsedBy = report.usedBy;
      const usedByArray = Array.isArray(rawUsedBy)
        ? rawUsedBy
        : rawUsedBy
        ? [rawUsedBy]
        : [];

      // 2a) Replace stage.PICs with newPicsForThisStage if provided
      const updatedUsedBy = usedByArray.map(u => {
        const updatedStages = (u.stages || []).map(stage => {
          const newPicsForThisStage = picUpdates[stage.stageId];
          if (Array.isArray(newPicsForThisStage)) {
            return { ...stage, PICs: newPicsForThisStage };
          }
          return stage;
        });
        return { ...u, stages: updatedStages };
      });

      // Overwrite “usedBy” w/ updatedUsedBy
      batch.set(docRef, { ...report, usedBy: updatedUsedBy });
    }

    // 3) Now update pic_options/<stageId> documents
    for (let [stageId, picArray] of Object.entries(picUpdates)) {
      const optionRef = db.collection('pic_options').doc(stageId);
      const optionSnap = await optionRef.get();
      const existingEntries = optionSnap.exists
        ? optionSnap.data().entries || []
        : [];

      // Build “name||org” set to dedupe
      const seen = new Set(existingEntries.map(e => `${e.name}||${e.org}`));
      const mergedEntries = [...existingEntries];

      picArray.forEach(entry => {
        const key = `${entry.name}||${entry.org}`;
        if (!seen.has(key)) {
          mergedEntries.push({ name: entry.name, org: entry.org });
          seen.add(key);
        }
      });

      // Also build array of just names (legacy)
      const mergedNames = mergedEntries.map(e => e.name);

      batch.set(optionRef, {
        entries: mergedEntries,
        names: mergedNames,
      });
    }

    // 4) Commit once, atomically
    await batch.commit();
    return res.json({ success: true });
  } catch (err) {
    console.error('❌ mass-update-pic error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/mass-update-timeline', async (req, res) => {
  const { reportIds, timelineUpdates } = req.body;

  if (
    !Array.isArray(reportIds) ||
    typeof timelineUpdates !== 'object'
  ) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  try {
    await Promise.all(
      reportIds.map(async (reportId) => {
        const docRef = db.collection('reports').doc(reportId);
        const snap = await docRef.get();
        if (!snap.exists) return;

        const data = snap.data();

        // Safely grab usedBy[0] and its stages array
        const usedByArray = Array.isArray(data.usedBy) ? data.usedBy : [];
        if (usedByArray.length === 0) return;

        const firstBucket = usedByArray[0];
        const stagesArray = Array.isArray(firstBucket.stages)
          ? firstBucket.stages
          : [];

        // Build newStages, defaulting to existing values if no update provided
        const newStages = stagesArray.map((stage) => {
          const updatesForThisStage = timelineUpdates[stage.stageId] || {};
          return {
            ...stage,
            plannedStart:
              updatesForThisStage.plannedStart ?? stage.plannedStart,
            plannedEnd: updatesForThisStage.plannedEnd ?? stage.plannedEnd,
            actualStart:
              updatesForThisStage.actualStart ?? stage.actualStart,
            actualEnd: updatesForThisStage.actualEnd ?? stage.actualEnd,
          };
        });

        // Only write back if there was at least one stage to update
        await docRef.update({
          'usedBy.0.stages': newStages,
        });
      })
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('❌ mass-update-timeline error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// 🔹 GET /api/pic-options
// 🔹 GET /api/pic-options
// 🔹 GET /api/pic-options
app.get('/api/pic-options', async (req, res) => {
  try {
    const snapshot = await db.collection('pic_options').get();
    const result = {};
    snapshot.forEach(doc => {
      // Each doc.data() should now have both a `names` array and an `entries` array
      const data = doc.data();
      result[doc.id] = {
        names:   Array.isArray(data.names)   ? data.names   : [],
        entries: Array.isArray(data.entries) ? data.entries : []
      };
    });
    res.json(result);
  } catch (err) {
    console.error('❌ Failed to fetch PIC options:', err);
    res.status(500).json({ error: 'Failed to fetch PIC options' });
  }
});

// 🔹 POST /api/mass-update-rawfile
app.post('/api/mass-update-rawfile', async (req, res) => {
  const { reportIds, rawFileEntries } = req.body;
  if (!Array.isArray(reportIds) || !Array.isArray(rawFileEntries)) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  try {
    await Promise.all(
      reportIds.map(async reportId => {
        const docRef = db.collection('reports').doc(reportId);
        const snap   = await docRef.get();
        if (!snap.exists) return;

        const data = snap.data();
        // Overwrite rawFiles with the richer objects
        data.rawFiles = rawFileEntries.map(({ fileName, systemName, systemOwner }) => ({
          fileName,
          systemName,
          systemOwner
        }));

        await docRef.set(data);
      })
    );
    res.json({ success: true });
  } catch (err) {
    console.error('❌ mass-update-rawfile error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// 🔹 POST /api/save-pic-option
// ← replace your old save-pic-option
app.post('/api/save-pic-option', async (req, res) => {
  const { stageId, name, org } = req.body;
  if (!stageId || !name || !org) {
    return res.status(400).json({ error: 'Missing stageId, name, or org' });
  }

  try {
    const optionRef = db.collection('pic_options').doc(stageId);
    const optionSnap = await optionRef.get();
    let existingEntries = [];
    if (optionSnap.exists) {
      existingEntries = optionSnap.data().entries || [];
    }

    // Build a Set of “name||org” keys to avoid duplicates
    const seen = new Set(existingEntries.map(e => `${e.name}||${e.org}`));
    const mergedEntries = [...existingEntries];

    const key = `${name}||${org}`;
    if (!seen.has(key)) {
      mergedEntries.push({ name, org });
      seen.add(key);
    }

    // Also maintain a simple `names: [string]` array for backward‐compatibility
    const mergedNames = mergedEntries.map(e => e.name);

    // Overwrite (or create) the document with both fields:
    await optionRef.set({
      entries: mergedEntries,
      names:   mergedNames
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('❌ Failed to save PIC option (with org):', err);
    return res.status(500).json({ error: 'Failed to save PIC option' });
  }
});

