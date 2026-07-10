const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { authenticateJWT } = require('../middleware/auth');

// GET DIRECTORY LISTINGS (FILTERS)
router.get('/', authenticateJWT, async (req, res) => {
  const { batch_year, department, company, location, mentor_only } = req.query;
  const db = await getDb();

  try {
    let query = `
      SELECT ap.*, u.email 
      FROM alumni_profiles ap
      JOIN users u ON ap.user_id = u.id
      WHERE u.approved = 1
    `;
    const params = [];

    if (batch_year) {
      query += ' AND ap.batch_year = ?';
      params.push(parseInt(batch_year));
    }
    if (department) {
      query += ' AND ap.department = ?';
      params.push(department);
    }
    if (company) {
      query += ' AND ap.current_company LIKE ?';
      params.push(`%${company}%`);
    }
    if (location) {
      query += ' AND ap.location LIKE ?';
      params.push(`%${location}%`);
    }
    if (mentor_only === 'true') {
      query += ' AND ap.mentor_opt_in = 1';
    }

    query += ' ORDER BY ap.batch_year DESC, ap.name ASC';

    const alumni = await db.all(query, params);
    res.json(alumni);
  } catch (error) {
    console.error('Fetch Directory Error:', error);
    res.status(500).json({ error: 'Server error fetching directory.' });
  }
});

// GET PROFILE DETAILS
router.get('/:id', authenticateJWT, async (req, res) => {
  const db = await getDb();
  try {
    const profile = await db.get(
      `SELECT ap.*, u.email, u.role
       FROM alumni_profiles ap
       JOIN users u ON ap.user_id = u.id
       WHERE ap.user_id = ?`,
      [req.params.id]
    );

    if (!profile) {
      return res.status(404).json({ error: 'Alumni profile not found.' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Fetch Profile Error:', error);
    res.status(500).json({ error: 'Server error fetching profile.' });
  }
});

// UPDATE PROFILE DETAILS (OWNERSHIP CONTROL)
router.put('/:id', authenticateJWT, async (req, res) => {
  const targetUserId = parseInt(req.params.id);

  // Check if owner or admin
  if (req.user.id !== targetUserId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized to modify this profile.' });
  }

  const {
    name, batch_year, department, current_company, current_role,
    location, linkedin, phone, profile_photo, bio, mentor_opt_in, mentor_expertise
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required.' });
  }

  const db = await getDb();

  try {
    const existing = await db.get('SELECT user_id FROM alumni_profiles WHERE user_id = ?', [targetUserId]);
    if (!existing) {
      return res.status(404).json({ error: 'Alumni profile not found.' });
    }

    await db.run(
      `UPDATE alumni_profiles SET
        name = ?,
        batch_year = ?,
        department = ?,
        current_company = ?,
        current_role = ?,
        location = ?,
        linkedin = ?,
        phone = ?,
        profile_photo = ?,
        bio = ?,
        mentor_opt_in = ?,
        mentor_expertise = ?
      WHERE user_id = ?`,
      [
        name,
        batch_year ? parseInt(batch_year) : null,
        department,
        current_company || '',
        current_role || '',
        location || '',
        linkedin || '',
        phone || '',
        profile_photo || existing.profile_photo,
        bio || '',
        mentor_opt_in ? 1 : 0,
        mentor_expertise || '',
        targetUserId
      ]
    );

    // Also update users.name and users.department
    await db.run(
      'UPDATE users SET name = ?, department = ? WHERE id = ?',
      [name, department, targetUserId]
    );

    res.json({ message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ error: 'Server error updating profile.' });
  }
});

module.exports = router;
