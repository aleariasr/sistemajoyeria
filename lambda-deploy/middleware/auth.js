/**
 * Authentication Middleware
 * Verifies that user is authenticated via session
 */

/**
 * Require authentication - verifies user is logged in
 */
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  next();
};

/**
 * Require admin role - verifies user is administrator
 * Must be used after requireAuth
 */
const requireAdmin = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  
  if (req.session.role !== 'administrador' && req.session.role !== 'Administrador') {
    return res.status(403).json({ 
      error: 'Acceso denegado. Se requiere rol de administrador.',
      required_role: 'administrador'
    });
  }
  
  next();
};

/**
 * Require specific role(s)
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 */
const requireRole = (allowedRoles) => {
  // Normalize to array
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return (req, res, next) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    
    const userRole = req.session.role?.toLowerCase();
    const normalizedRoles = roles.map(r => r.toLowerCase());
    
    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Acceso denegado. No tienes permisos para esta acción.',
        required_roles: roles,
        your_role: req.session.role
      });
    }
    
    next();
  };
};

/**
 * Check session expiration (optional middleware)
 * Can be used to enforce session timeout beyond cookie maxAge
 */
const checkSessionExpiration = (maxInactivityMs = 24 * 60 * 60 * 1000) => {
  return (req, res, next) => {
    if (req.session && req.session.userId && req.session.lastActivity) {
      const now = Date.now();
      const timeSinceLastActivity = now - req.session.lastActivity;
      
      if (timeSinceLastActivity > maxInactivityMs) {
        // Session expired due to inactivity
        req.session = null;
        return res.status(401).json({ 
          error: 'Sesión expirada por inactividad',
          expired: true
        });
      }
      
      // Update last activity timestamp
      req.session.lastActivity = now;
    }
    
    next();
  };
};

module.exports = { 
  requireAuth,
  requireAdmin,
  requireRole,
  checkSessionExpiration
};
