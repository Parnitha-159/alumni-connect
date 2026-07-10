const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { authenticateJWT, requireRole } = require('../middleware/auth');

// GET ALL EVENTS WITH RSVP STATS
router.get('/', authenticateJWT, async (req, res) => {
  const db = await getDb();
  try {
    const events = await db.all(`
      SELECT e.*, 
        (SELECT COUNT(*) FROM rsvps WHERE event_id = e.id) AS active_rsvp_count,
        (SELECT COUNT(*) FROM rsvps WHERE event_id = e.id AND user_id = ?) AS user_has_rsvped
      FROM events e
      ORDER BY e.date ASC
    `, [req.user.id]);

    res.json(events);
  } catch (error) {
    console.error('Fetch Events Error:', error);
    res.status(500).json({ error: 'Server error fetching events.' });
  }
});

// CREATE AN EVENT (Admin only)
router.post('/', authenticateJWT, requireRole(['admin']), async (req, res) => {
  const { title, date, location, description, base_rsvp_count } = req.body;

  if (!title || !date || !location || !description) {
    return res.status(400).json({ error: 'Missing required event fields.' });
  }

  const db = await getDb();
  try {
    const result = await db.run(
      `INSERT INTO events (title, date, location, description, base_rsvp_count)
       VALUES (?, ?, ?, ?, ?)`,
      [title, date, location, description, base_rsvp_count ? parseInt(base_rsvp_count) : 0]
    );

    res.status(201).json({ message: 'Event created successfully!', eventId: result.lastID });
  } catch (error) {
    console.error('Create Event Error:', error);
    res.status(500).json({ error: 'Server error creating event.' });
  }
});

// RSVP TOGGLE FOR AN EVENT
router.post('/:id/rsvp', authenticateJWT, async (req, res) => {
  const eventId = parseInt(req.params.id);
  const userId = req.user.id;
  const db = await getDb();

  try {
    // Check if event exists
    const event = await db.get('SELECT id FROM events WHERE id = ?', [eventId]);
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    // Check if RSVP already exists
    const existingRsvp = await db.get(
      'SELECT 1 FROM rsvps WHERE event_id = ? AND user_id = ?',
      [eventId, userId]
    );

    if (existingRsvp) {
      // Remove RSVP (Toggle off)
      await db.run(
        'DELETE FROM rsvps WHERE event_id = ? AND user_id = ?',
        [eventId, userId]
      );
      res.json({ message: 'RSVP removed successfully.', rsvped: false });
    } else {
      // Add RSVP (Toggle on)
      await db.run(
        'INSERT INTO rsvps (event_id, user_id) VALUES (?, ?)',
        [eventId, userId]
      );
      res.json({ message: 'RSVP registered successfully.', rsvped: true });
    }
  } catch (error) {
    console.error('RSVP Error:', error);
    res.status(500).json({ error: 'Server error setting RSVP.' });
  }
});

module.exports = router;
