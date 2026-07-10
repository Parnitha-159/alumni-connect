const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { authenticateJWT } = require('../middleware/auth');

// GET ALL DISCUSSIONS
router.get('/', authenticateJWT, async (req, res) => {
  const db = await getDb();
  try {
    const discussions = await db.all(
      'SELECT * FROM discussions ORDER BY created_at DESC'
    );
    res.json(discussions);
  } catch (error) {
    console.error('Fetch Discussions Error:', error);
    res.status(500).json({ error: 'Server error fetching discussions.' });
  }
});

// POST A NEW DISCUSSION THREAD
router.post('/', authenticateJWT, async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' });
  }

  const db = await getDb();

  try {
    // Determine the name of the user posting
    let userName = 'Anonymous';
    const user = await db.get('SELECT name, role FROM users WHERE id = ?', [req.user.id]);
    
    if (user) {
      userName = user.name || 'User';
      if (user.role === 'alumni') {
        const ap = await db.get('SELECT name FROM alumni_profiles WHERE user_id = ?', [req.user.id]);
        if (ap) userName = ap.name;
      }
    }

    const userRole = req.user.role;

    const result = await db.run(
      `INSERT INTO discussions (user_id, user_name, user_role, title, content)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, userName, userRole, title, content]
    );

    res.status(201).json({
      message: 'Discussion thread posted successfully!',
      threadId: result.lastID
    });
  } catch (error) {
    console.error('Post Discussion Error:', error);
    res.status(500).json({ error: 'Server error posting thread.' });
  }
});

// DELETE A DISCUSSION THREAD (Owner or Admin)
router.delete('/:id', authenticateJWT, async (req, res) => {
  const threadId = parseInt(req.params.id);
  const db = await getDb();

  try {
    const thread = await db.get('SELECT user_id FROM discussions WHERE id = ?', [threadId]);
    if (!thread) {
      return res.status(404).json({ error: 'Discussion thread not found.' });
    }

    if (thread.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to delete this thread.' });
    }

    await db.run('DELETE FROM discussions WHERE id = ?', [threadId]);
    res.json({ message: 'Discussion thread deleted.' });
  } catch (error) {
    console.error('Delete Discussion Error:', error);
    res.status(500).json({ error: 'Server error deleting thread.' });
  }
});

module.exports = router;
