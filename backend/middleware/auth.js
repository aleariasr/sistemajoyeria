/**
 * Authentication Middleware
 * Verifies that user is authenticated via session
 */

const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  next();
};

module.exports = { requireAuth };
