const jwt = require('jsonwebtoken');

/**
 * Authentication middleware for validating Solid OIDC tokens
 */
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Missing or invalid authorization header'
            });
        }

        const token = authHeader.split(' ')[1];

        // For mock implementation, we'll decode without verification
        // In production, this would verify against OIDC provider's public keys
        const decoded = jwt.decode(token);

        if (!decoded) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid token format'
            });
        }

        // Validate required claims for Solid OIDC
        if (!decoded.webid) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Token missing required webid claim'
            });
        }

        // Check token expiration
        if (decoded.exp && decoded.exp < Date.now() / 1000) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Token has expired'
            });
        }

        // Attach user info to request
        req.user = {
            webid: decoded.webid,
            sub: decoded.sub,
            iss: decoded.iss,
            aud: decoded.aud
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Token validation failed'
        });
    }
};

/**
 * Optional auth middleware for UI routes
 */
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.decode(token);

            if (decoded && decoded.webid && (!decoded.exp || decoded.exp >= Date.now() / 1000)) {
                req.user = {
                    webid: decoded.webid,
                    sub: decoded.sub,
                    iss: decoded.iss,
                    aud: decoded.aud
                };
            }
        }

        next();
    } catch (error) {
        // Continue without user info if token parsing fails
        next();
    }
};

module.exports = {
    authMiddleware,
    optionalAuth
};
