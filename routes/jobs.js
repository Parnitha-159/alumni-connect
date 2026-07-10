const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { authenticateJWT, requireRole } = require('../middleware/auth');

// GET ALL JOBS
router.get('/', authenticateJWT, async (req, res) => {
  const db = await getDb();
  try {
    const jobs = await db.all(`
      SELECT j.*, ap.name AS poster_name, ap.profile_photo AS poster_photo, ap.current_company AS poster_company
      FROM jobs j
      JOIN alumni_profiles ap ON j.poster_id = ap.user_id
      ORDER BY j.created_at DESC
    `);
    res.json(jobs);
  } catch (error) {
    console.error('Fetch Jobs Error:', error);
    res.status(500).json({ error: 'Server error fetching jobs.' });
  }
});

// POST A JOB (Alumni or Admin only)
router.post('/', authenticateJWT, requireRole(['alumni', 'admin']), async (req, res) => {
  const { title, company, location, type, duration, description } = req.body;

  if (!title || !company || !location || !type || !description) {
    return res.status(400).json({ error: 'Missing required job fields.' });
  }

  const db = await getDb();

  try {
    const result = await db.run(
      `INSERT INTO jobs (poster_id, title, company, location, type, duration, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, title, company, location, type, duration || '', description]
    );

    res.status(201).json({ message: 'Job posted successfully!', jobId: result.lastID });
  } catch (error) {
    console.error('Post Job Error:', error);
    res.status(500).json({ error: 'Server error posting job.' });
  }
});

// DELETE A JOB (Owner or Admin only)
router.delete('/:id', authenticateJWT, async (req, res) => {
  const jobId = parseInt(req.params.id);
  const db = await getDb();

  try {
    const job = await db.get('SELECT poster_id FROM jobs WHERE id = ?', [jobId]);
    if (!job) {
      return res.status(404).json({ error: 'Job posting not found.' });
    }

    if (job.poster_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to delete this job.' });
    }

    await db.run('DELETE FROM jobs WHERE id = ?', [jobId]);
    res.json({ message: 'Job posting deleted.' });
  } catch (error) {
    console.error('Delete Job Error:', error);
    res.status(500).json({ error: 'Server error deleting job.' });
  }
});

module.exports = router;
