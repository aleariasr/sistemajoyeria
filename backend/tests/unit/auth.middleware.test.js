/**
 * Unit Tests for Auth Middleware
 * Tests authentication and role-based access control
 */

const {
  requireAuth,
  requireAdmin,
  requireRole,
  checkSessionExpiration
} = require('../../middleware/auth');

describe('Auth Middleware Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      session: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('requireAuth - Basic Authentication Check', () => {
    
    it('should allow authenticated user to proceed', () => {
      req.session = {
        userId: 1,
        username: 'testuser',
        role: 'administrador'
      };

      requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should block request with no session', () => {
      req.session = null;

      requireAuth(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No autenticado' });
    });

    it('should block request with empty session', () => {
      req.session = {};

      requireAuth(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should block request with session but no userId', () => {
      req.session = {
        username: 'testuser'
        // Missing userId
      };

      requireAuth(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('requireAdmin - Administrator Access Control', () => {
    
    it('should allow admin user to proceed', () => {
      req.session = {
        userId: 1,
        username: 'admin',
        role: 'administrador'
      };

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow Admin (capitalized) role to proceed', () => {
      req.session = {
        userId: 1,
        username: 'admin',
        role: 'Administrador'
      };

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should block non-admin user', () => {
      req.session = {
        userId: 2,
        username: 'dependiente',
        role: 'dependiente'
      };

      requireAdmin(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('administrador'),
          required_role: 'administrador'
        })
      );
    });

    it('should block unauthenticated request', () => {
      req.session = null;

      requireAdmin(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should block request with no role', () => {
      req.session = {
        userId: 3,
        username: 'norole'
        // Missing role
      };

      requireAdmin(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('requireRole - Flexible Role-Based Access Control', () => {
    
    it('should allow user with matching role (string)', () => {
      req.session = {
        userId: 1,
        username: 'admin',
        role: 'administrador'
      };

      const middleware = requireRole('administrador');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow user with matching role (array)', () => {
      req.session = {
        userId: 2,
        username: 'dependiente',
        role: 'dependiente'
      };

      const middleware = requireRole(['administrador', 'dependiente']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should be case-insensitive', () => {
      req.session = {
        userId: 1,
        username: 'admin',
        role: 'Administrador'
      };

      const middleware = requireRole('administrador');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should block user with non-matching role', () => {
      req.session = {
        userId: 2,
        username: 'dependiente',
        role: 'dependiente'
      };

      const middleware = requireRole('administrador');
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
          required_roles: ['administrador'],
          your_role: 'dependiente'
        })
      );
    });

    it('should block unauthenticated request', () => {
      req.session = null;

      const middleware = requireRole('administrador');
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle multiple allowed roles', () => {
      req.session = {
        userId: 2,
        username: 'dependiente',
        role: 'dependiente'
      };

      const middleware = requireRole(['administrador', 'dependiente', 'supervisor']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject user not in multiple allowed roles', () => {
      req.session = {
        userId: 3,
        username: 'viewer',
        role: 'viewer'
      };

      const middleware = requireRole(['administrador', 'dependiente']);
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('checkSessionExpiration - Session Timeout', () => {
    
    it('should allow active session within timeout', () => {
      req.session = {
        userId: 1,
        username: 'testuser',
        lastActivity: Date.now() - 1000 // 1 second ago
      };

      const middleware = checkSessionExpiration(60000); // 1 minute timeout
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.session.lastActivity).toBeGreaterThan(Date.now() - 100); // Updated
    });

    it('should expire session after timeout', () => {
      req.session = {
        userId: 1,
        username: 'testuser',
        lastActivity: Date.now() - 120000 // 2 minutes ago
      };

      const middleware = checkSessionExpiration(60000); // 1 minute timeout
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('expirada'),
          expired: true
        })
      );
      expect(req.session).toBeNull();
    });

    it('should allow request without session', () => {
      req.session = null;

      const middleware = checkSessionExpiration(60000);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow session without lastActivity', () => {
      req.session = {
        userId: 1,
        username: 'testuser'
        // No lastActivity
      };

      const middleware = checkSessionExpiration(60000);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should use default timeout if not specified', () => {
      req.session = {
        userId: 1,
        username: 'testuser',
        lastActivity: Date.now() - 1000
      };

      const middleware = checkSessionExpiration(); // Default timeout
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should update lastActivity on each request', () => {
      const initialTime = Date.now() - 5000; // 5 seconds ago
      req.session = {
        userId: 1,
        username: 'testuser',
        lastActivity: initialTime
      };

      const middleware = checkSessionExpiration(60000);
      middleware(req, res, next);

      // Verify lastActivity was updated (should be greater than initial)
      expect(req.session.lastActivity).toBeGreaterThan(initialTime);
      // Verify it's recent (within last 1 second)
      expect(req.session.lastActivity).toBeGreaterThan(Date.now() - 1000);
    });

    it('should handle edge case at exact timeout boundary', () => {
      const timeout = 60000;
      req.session = {
        userId: 1,
        username: 'testuser',
        lastActivity: Date.now() - timeout - 1 // Just over timeout
      };

      const middleware = checkSessionExpiration(timeout);
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Middleware Chaining', () => {
    
    it('should work correctly when chained: requireAuth -> requireAdmin', () => {
      req.session = {
        userId: 1,
        username: 'admin',
        role: 'administrador'
      };

      // Simulate middleware chain
      requireAuth(req, res, () => {
        requireAdmin(req, res, next);
      });

      expect(next).toHaveBeenCalled();
    });

    it('should fail chain if first middleware rejects', () => {
      req.session = null;

      requireAuth(req, res, () => {
        requireAdmin(req, res, next);
      });

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should fail chain if second middleware rejects', () => {
      req.session = {
        userId: 2,
        username: 'dependiente',
        role: 'dependiente'
      };

      requireAuth(req, res, () => {
        requireAdmin(req, res, next);
      });

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
