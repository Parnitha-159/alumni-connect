const jwt = require('jsonwebtoken');

const JWT_SECRET = 'vsb_alumni_connect_super_secret_key';

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access denied. Invalid token format.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(430).json({ error: 'Access denied. Insufficient privileges.' });
    }
    
    // Check if approved for alumni and students
    if (req.user.role === 'alumni' && !req.user.approved) {
      return res.status(403).json({ error: 'Account pending admin approval.' });
    }
    
    next();
  };
}

module.exports = {
  authenticateJWT,
  requireRole,
  JWT_SECRET
};
