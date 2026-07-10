const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { authenticateJWT, requireRole } = require('../middleware/auth');

// GET PENDING ALUMNI REGISTRATIONS
router.get('/pending', authenticateJWT, requireRole(['admin']), async (req, res) => {
  const db = await getDb();
  try {
    const pending = await db.all(
      `SELECT ap.*, u.email, u.created_at
       FROM alumni_profiles ap
       JOIN users u ON ap.user_id = u.id
       WHERE u.role = 'alumni' AND u.approved = 0
       ORDER BY u.created_at DESC`
    );
    res.json(pending);
  } catch (error) {
    console.error('Fetch Pending Error:', error);
    res.status(500).json({ error: 'Server error fetching pending profiles.' });
  }
});

// APPROVE ALUMNI REGISTRATION
router.put('/approve/:id', authenticateJWT, requireRole(['admin']), async (req, res) => {
  const alumniId = parseInt(req.params.id);
  const db = await getDb();

  try {
    const result = await db.run(
      'UPDATE users SET approved = 1 WHERE id = ? AND role = "alumni"',
      [alumniId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Pending alumnus not found.' });
    }

    res.json({ message: 'Alumnus registration approved successfully!' });
  } catch (error) {
    console.error('Approve Alumni Error:', error);
    res.status(500).json({ error: 'Server error approving registration.' });
  }
});

// REJECT/DELETE ALUMNI REGISTRATION
router.delete('/reject/:id', authenticateJWT, requireRole(['admin']), async (req, res) => {
  const alumniId = parseInt(req.params.id);
  const db = await getDb();

  try {
    const result = await db.run(
      'DELETE FROM users WHERE id = ?',
      [alumniId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ message: 'Registration rejected and deleted.' });
  } catch (error) {
    console.error('Reject Alumni Error:', error);
    res.status(500).json({ error: 'Server error processing rejection.' });
  }
});

// GET ANALYTICS DATA
router.get('/analytics', authenticateJWT, requireRole(['admin']), async (req, res) => {
  const db = await getDb();

  try {
    // Total approved alumni
    const totalAlumni = await db.get(
      'SELECT COUNT(*) AS count FROM users WHERE role = "alumni" AND approved = 1'
    );

    // Total active students
    const totalStudents = await db.get(
      'SELECT COUNT(*) AS count FROM users WHERE role = "student"'
    );

    // Approved alumni by department
    const byDept = await db.all(
      `SELECT ap.department, COUNT(*) AS count 
       FROM alumni_profiles ap
       JOIN users u ON ap.user_id = u.id
       WHERE u.approved = 1
       GROUP BY ap.department`
    );

    // Approved alumni by batch year
    const byYear = await db.all(
      `SELECT ap.batch_year, COUNT(*) AS count 
       FROM alumni_profiles ap
       JOIN users u ON ap.user_id = u.id
       WHERE u.approved = 1
       GROUP BY ap.batch_year
       ORDER BY ap.batch_year ASC`
    );

    res.json({
      totalAlumni: totalAlumni.count,
      totalStudents: totalStudents.count,
      byDepartment: byDept,
      byYear: byYear
    });
  } catch (error) {
    console.error('Fetch Analytics Error:', error);
    res.status(500).json({ error: 'Server error loading analytics.' });
  }
});

// EXPORT ALUMNI DATA (CSV)
router.get('/export', authenticateJWT, requireRole(['admin']), async (req, res) => {
  const db = await getDb();

  try {
    const alumni = await db.all(
      `SELECT ap.name, ap.batch_year, ap.department, ap.current_company, ap.current_role, 
              ap.location, ap.linkedin, ap.phone, u.email
       FROM alumni_profiles ap
       JOIN users u ON ap.user_id = u.id
       WHERE u.approved = 1
       ORDER BY ap.batch_year DESC, ap.name ASC`
    );

    // Build CSV Content
    let csvContent = 'Name,Batch Year,Department,Current Company,Current Role,Location,LinkedIn,Phone,Email\n';
    
    alumni.forEach(a => {
      // Escape commas & quotes
      const cleanVal = (val) => {
        if (!val) return '';
        const stringVal = String(val).replace(/"/g, '""');
        return stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n') 
          ? `"${stringVal}"` 
          : stringVal;
      };

      csvContent += `${cleanVal(a.name)},${cleanVal(a.batch_year)},${cleanVal(a.department)},${cleanVal(a.current_company)},${cleanVal(a.current_role)},${cleanVal(a.location)},${cleanVal(a.linkedin)},${cleanVal(a.phone)},${cleanVal(a.email)}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=VSB_Alumni_Directory.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Export CSV Error:', error);
    res.status(500).json({ error: 'Server error generating CSV export.' });
  }
});

module.exports = router;
