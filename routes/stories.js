const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { authenticateJWT, requireRole } = require('../middleware/auth');

// GET APPROVED STORIES (Public / Homepage)
router.get('/', async (req, res) => {
  const { department } = req.query;
  const db = await getDb();

  try {
    let query = 'SELECT * FROM success_stories WHERE is_approved = 1';
    const params = [];

    if (department) {
      query += ' AND department = ?';
      params.push(department);
    }

    query += ' ORDER BY created_at DESC';

    const stories = await db.all(query, params);
    res.json(stories);
  } catch (error) {
    console.error('Fetch Approved Stories Error:', error);
    res.status(500).json({ error: 'Server error fetching success stories.' });
  }
});

// GET ALL STORIES (Admin Dashboard view)
router.get('/all', authenticateJWT, requireRole(['admin']), async (req, res) => {
  const db = await getDb();
  try {
    const stories = await db.all('SELECT * FROM success_stories ORDER BY created_at DESC');
    res.json(stories);
  } catch (error) {
    console.error('Fetch All Stories Error:', error);
    res.status(500).json({ error: 'Server error fetching all stories.' });
  }
});

// SUBMIT A SUCCESS STORY (Alumni only)
router.post('/', authenticateJWT, requireRole(['alumni', 'admin']), async (req, res) => {
  const { headline, writeup, photo } = req.body;

  if (!headline || !writeup) {
    return res.status(400).json({ error: 'Headline and writeup are required.' });
  }

  if (writeup.split(/\s+/).length > 250) {
    return res.status(400).json({ error: 'Writeup exceeds 200-250 words limit.' });
  }

  const db = await getDb();

  try {
    // Get author details
    let authorName = 'Anonymous';
    let department = 'ECE';

    const profile = await db.get('SELECT name, department FROM alumni_profiles WHERE user_id = ?', [req.user.id]);
    if (profile) {
      authorName = profile.name;
      department = profile.department;
    } else {
      // Fallback to user row details
      const user = await db.get('SELECT name, department FROM users WHERE id = ?', [req.user.id]);
      if (user) {
        authorName = user.name || 'Admin';
        department = user.department || 'ECE';
      }
    }

    // Default image if none provided
    const defaultPhoto = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=400';
    const finalPhoto = photo || defaultPhoto;

    // Insert story as pending (is_approved = 0)
    const result = await db.run(
      `INSERT INTO success_stories (headline, writeup, photo, author_id, author_name, department, is_approved)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [headline, writeup, finalPhoto, req.user.id, authorName, department, 0]
    );

    res.status(201).json({
      message: 'Story submitted successfully! It will go live once approved by the Admin.',
      storyId: result.lastID
    });
  } catch (error) {
    console.error('Submit Story Error:', error);
    res.status(500).json({ error: 'Server error submitting story.' });
  }
});

// APPROVE STORY (Admin only)
router.put('/:id/approve', authenticateJWT, requireRole(['admin']), async (req, res) => {
  const storyId = parseInt(req.params.id);
  const db = await getDb();

  try {
    const result = await db.run(
      'UPDATE success_stories SET is_approved = 1 WHERE id = ?',
      [storyId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Success story not found.' });
    }

    res.json({ message: 'Success story approved and is now live!' });
  } catch (error) {
    console.error('Approve Story Error:', error);
    res.status(500).json({ error: 'Server error approving story.' });
  }
});

// DELETE STORY (Owner or Admin only)
router.delete('/:id', authenticateJWT, async (req, res) => {
  const storyId = parseInt(req.params.id);
  const db = await getDb();

  try {
    const story = await db.get('SELECT author_id FROM success_stories WHERE id = ?', [storyId]);
    if (!story) {
      return res.status(404).json({ error: 'Success story not found.' });
    }

    if (story.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to delete this story.' });
    }

    await db.run('DELETE FROM success_stories WHERE id = ?', [storyId]);
    res.json({ message: 'Success story deleted.' });
  } catch (error) {
    console.error('Delete Story Error:', error);
    res.status(500).json({ error: 'Server error deleting story.' });
  }
});

module.exports = router;
