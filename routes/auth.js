const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');
const { JWT_SECRET, authenticateJWT } = require('../middleware/auth');

// REGISTER
router.post('/register', async (req, res) => {
  const { email, password, role, name, department, batchYear, company, currentRole, location, linkedin, phone, bio, mentorOptIn, mentorExpertise, profilePhoto } = req.body;

  if (!email || !password || !role || !name) {
    return res.status(400).json({ error: 'Please fill in all required fields (email, password, role, name).' });
  }

  if (role !== 'alumni' && role !== 'student') {
    return res.status(400).json({ error: 'Invalid role selected.' });
  }

  const db = await getDb();
  
  try {
    // Check if email already exists
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // Student is auto-approved, alumni starts as pending (approved = 0)
    const approved = role === 'student' ? 1 : 0;

    // Insert user
    const userResult = await db.run(
      'INSERT INTO users (email, password_hash, role, name, department, approved) VALUES (?, ?, ?, ?, ?, ?)',
      [email, passwordHash, role, name, department || null, approved]
    );

    const userId = userResult.lastID;

    // If Alumni, create profile entry
    if (role === 'alumni') {
      const defaultPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0F4C4C&color=fff&size=200`;
      const photo = profilePhoto || defaultPhoto;

      await db.run(
        `INSERT INTO alumni_profiles (
          user_id, name, batch_year, department, current_company, current_role, 
          location, linkedin, phone, profile_photo, bio, mentor_opt_in, mentor_expertise
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          name,
          batchYear ? parseInt(batchYear) : null,
          department || 'ECE',
          company || '',
          currentRole || '',
          location || '',
          linkedin || '',
          phone || '',
          photo,
          bio || '',
          mentorOptIn ? 1 : 0,
          mentorExpertise || ''
        ]
      );
    }

    res.status(201).json({
      message: role === 'alumni' 
        ? 'Registration successful. Your account is pending admin approval.' 
        : 'Registration successful. You can now log in.'
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Database error. Please try again.' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const db = await getDb();

  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Check if approved (Only block login if Alumni and not approved)
    if (user.role === 'alumni' && user.approved === 0) {
      return res.status(403).json({ error: 'Your account is pending admin approval.' });
    }

    // Retrieve name for display
    let userName = user.name || 'User';
    if (user.role === 'alumni') {
      const profile = await db.get('SELECT name FROM alumni_profiles WHERE user_id = ?', [user.id]);
      if (profile) userName = profile.name;
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, approved: user.approved },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: userName,
        department: user.department,
        approved: user.approved
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// GET ME
router.get('/me', authenticateJWT, async (req, res) => {
  const db = await getDb();
  try {
    const user = await db.get('SELECT id, email, role, name, department, approved FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    let profile = null;
    if (user.role === 'alumni') {
      profile = await db.get('SELECT * FROM alumni_profiles WHERE user_id = ?', [user.id]);
    }

    res.json({ user, profile });
  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
