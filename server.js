const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support larger base64 payloads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Base64 file uploader endpoint
app.post('/api/upload', (req, res) => {
  const { base64Data } = req.body;
  if (!base64Data) {
    return res.status(400).json({ error: 'No image data provided.' });
  }
  
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return res.status(400).json({ error: 'Invalid image format.' });
  }

  const imageType = matches[1];
  const imageBuffer = Buffer.from(matches[2], 'base64');
  
  let extension = 'png';
  if (imageType.includes('jpeg') || imageType.includes('jpg')) extension = 'jpg';
  else if (imageType.includes('gif')) extension = 'gif';
  else if (imageType.includes('webp')) extension = 'webp';

  const filename = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${extension}`;
  const filePath = path.join(uploadDir, filename);

  try {
    fs.writeFileSync(filePath, imageBuffer);
    res.json({ url: `/uploads/${filename}` });
  } catch (error) {
    console.error('Image Write Error:', error);
    res.status(500).json({ error: 'Failed to save image upload.' });
  }
});

// Public stats endpoint for home page
app.get('/api/public/stats', async (req, res) => {
  const { getDb } = require('./db');
  try {
    const db = await getDb();
    const alumniCount = await db.get('SELECT COUNT(*) AS count FROM users WHERE role = "alumni" AND approved = 1');
    const studentCount = await db.get('SELECT COUNT(*) AS count FROM users WHERE role = "student"');
    const jobsCount = await db.get('SELECT COUNT(*) AS count FROM jobs');
    const eventsCount = await db.get('SELECT COUNT(*) AS count FROM events');
    const mentorsCount = await db.get('SELECT COUNT(*) AS count FROM alumni_profiles WHERE mentor_opt_in = 1');
    res.json({
      alumni: alumniCount.count,
      students: studentCount.count,
      jobs: jobsCount.count,
      events: eventsCount.count,
      mentors: mentorsCount.count
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch public stats.' });
  }
});

// Import and mount routes
const authRoutes = require('./routes/auth');
const alumniRoutes = require('./routes/alumni');
const jobsRoutes = require('./routes/jobs');
const eventsRoutes = require('./routes/events');
const discussionRoutes = require('./routes/discussion');
const storiesRoutes = require('./routes/stories');
const mentorshipRoutes = require('./routes/mentorship');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/discussion', discussionRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/admin', adminRoutes);

// Fallback to index.html for undefined routes (supporting routing SPA-like client structure if needed)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
async function startServer() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(`Alumni Connect Server is running on:`);
      console.log(`http://localhost:${PORT}`);
      console.log(`=================================================`);
    });
  } catch (error) {
    console.error('Database connection failed. Server not started:', error);
  }
}

startServer();
