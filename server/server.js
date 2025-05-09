const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const db = admin.firestore();
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

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