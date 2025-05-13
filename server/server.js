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

app.use(cors());
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

