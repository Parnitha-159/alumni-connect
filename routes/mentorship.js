const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { authenticateJWT, requireRole } = require('../middleware/auth');

// SEND MENTORSHIP REQUEST (Student only)
router.post('/request', authenticateJWT, requireRole(['student']), async (req, res) => {
  const { mentor_id, request_message } = req.body;

  if (!mentor_id || !request_message) {
    return res.status(400).json({ error: 'Mentor ID and request message are required.' });
  }

  const db = await getDb();

  try {
    // Check if mentor exists and is an alumnus
    const mentor = await db.get(
      'SELECT ap.user_id FROM alumni_profiles ap JOIN users u ON ap.user_id = u.id WHERE ap.user_id = ? AND u.role = "alumni" AND u.approved = 1',
      [mentor_id]
    );

    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found or not active.' });
    }

    // Check if request already exists
    const existing = await db.get(
      'SELECT id, status FROM mentorship_requests WHERE student_id = ? AND mentor_id = ?',
      [req.user.id, mentor_id]
    );

    if (existing) {
      return res.status(400).json({ error: `You have already sent a request to this mentor. Status: ${existing.status}` });
    }

    await db.run(
      `INSERT INTO mentorship_requests (student_id, mentor_id, request_message, status)
       VALUES (?, ?, ?, 'Pending')`,
      [req.user.id, mentor_id, request_message]
    );

    res.status(201).json({ message: 'Mentorship request sent successfully!' });
  } catch (error) {
    console.error('Send Mentorship Request Error:', error);
    res.status(500).json({ error: 'Server error processing request.' });
  }
});

// GET INCOMING REQUESTS (For Alumnus Mentor)
router.get('/requests/incoming', authenticateJWT, requireRole(['alumni']), async (req, res) => {
  const db = await getDb();
  try {
    const requests = await db.all(
      `SELECT mr.*, u.name AS student_name, u.email AS student_email, u.department AS student_department
       FROM mentorship_requests mr
       JOIN users u ON mr.student_id = u.id
       WHERE mr.mentor_id = ?
       ORDER BY mr.created_at DESC`,
      [req.user.id]
    );
    res.json(requests);
  } catch (error) {
    console.error('Fetch Incoming Requests Error:', error);
    res.status(500).json({ error: 'Server error fetching incoming requests.' });
  }
});

// GET OUTGOING REQUESTS (For Student)
router.get('/requests/outgoing', authenticateJWT, requireRole(['student']), async (req, res) => {
  const db = await getDb();
  try {
    const requests = await db.all(
      `SELECT mr.*, ap.name AS mentor_name, ap.mentor_expertise, u.email AS mentor_email, ap.profile_photo AS mentor_photo
       FROM mentorship_requests mr
       JOIN alumni_profiles ap ON mr.mentor_id = ap.user_id
       JOIN users u ON mr.mentor_id = u.id
       WHERE mr.student_id = ?
       ORDER BY mr.created_at DESC`,
      [req.user.id]
    );
    res.json(requests);
  } catch (error) {
    console.error('Fetch Outgoing Requests Error:', error);
    res.status(500).json({ error: 'Server error fetching outgoing requests.' });
  }
});

// ACCEPT OR DECLINE REQUEST (For Mentor Alumni)
router.put('/requests/:id', authenticateJWT, requireRole(['alumni']), async (req, res) => {
  const requestId = parseInt(req.params.id);
  const { status } = req.body; // 'Accepted' or 'Declined'

  if (status !== 'Accepted' && status !== 'Declined') {
    return res.status(400).json({ error: 'Invalid status update.' });
  }

  const db = await getDb();

  try {
    // Verify mentorship request exists and belongs to the logged-in mentor
    const request = await db.get(
      'SELECT id, mentor_id FROM mentorship_requests WHERE id = ?',
      [requestId]
    );

    if (!request) {
      return res.status(404).json({ error: 'Mentorship request not found.' });
    }

    if (request.mentor_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to respond to this request.' });
    }

    await db.run(
      'UPDATE mentorship_requests SET status = ? WHERE id = ?',
      [status, requestId]
    );

    res.json({ message: `Request successfully ${status.toLowerCase()}!` });
  } catch (error) {
    console.error('Respond Mentorship Request Error:', error);
    res.status(500).json({ error: 'Server error responding to request.' });
  }
});

module.exports = router;
