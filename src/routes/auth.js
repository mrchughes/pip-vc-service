const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * Initiate Solid OIDC authentication
 * POST /auth/login
 */
router.post('/login', asyncHandler(async (req, res) => {
    const { redirect_uri } = req.body;

    // In a real implementation, this would redirect to Solid OIDC provider
    // For mock purposes, we'll simulate the OIDC flow

    const authUrl = `${process.env.SOLID_OIDC_ISSUER}/auth?` +
        `response_type=code&` +
        `client_id=${process.env.SOLID_OIDC_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(redirect_uri || process.env.SOLID_OIDC_REDIRECT_URI)}&` +
        `scope=openid profile webid&` +
        `state=${generateState()}`;

    res.json({
        authUrl,
        message: 'Redirect to this URL to complete authentication'
    });
}));

/**
 * Handle OIDC callback and exchange code for token
 * GET /auth/callback
 */
router.get('/callback', asyncHandler(async (req, res) => {
    const { code, state } = req.query;

    if (!code) {
        return res.status(400).json({
            error: 'Missing authorization code'
        });
    }

    try {
        // For mock implementation, generate a mock token
        // In production, this would exchange the code with the OIDC provider
        const mockToken = generateMockToken();

        // Set session cookie
        res.cookie('session_token', mockToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: parseInt(process.env.SESSION_TIMEOUT) || 1800000
        });

        // Redirect to dashboard or return token for API clients
        if (req.headers.accept?.includes('application/json')) {
            res.json({
                token: mockToken,
                type: 'Bearer',
                expires_in: 1800
            });
        } else {
            res.redirect('/?login=success');
        }
    } catch (error) {
        console.error('Token exchange error:', error);
        res.status(500).json({
            error: 'Authentication failed',
            message: 'Unable to complete authentication'
        });
    }
}));

/**
 * Logout and clear session
 * POST /auth/logout
 */
router.post('/logout', (req, res) => {
    res.clearCookie('session_token');
    res.json({
        message: 'Logged out successfully'
    });
});

/**
 * Get current user info
 * GET /auth/me
 */
router.get('/me', (req, res) => {
    const token = req.cookies?.session_token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            error: 'Not authenticated'
        });
    }

    try {
        const decoded = jwt.decode(token);

        if (!decoded || !decoded.webid) {
            return res.status(401).json({
                error: 'Invalid token'
            });
        }

        res.json({
            webid: decoded.webid,
            sub: decoded.sub,
            iss: decoded.iss
        });
    } catch (error) {
        res.status(401).json({
            error: 'Token validation failed'
        });
    }
});

/**
 * Generate a random state parameter for OIDC
 */
function generateState() {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
}

/**
 * Generate a mock JWT token for testing
 */
function generateMockToken() {
    const payload = {
        webid: 'https://user.example.org/profile/card#me',
        sub: 'user-' + Math.random().toString(36).substring(2, 10),
        iss: process.env.SOLID_OIDC_ISSUER,
        aud: process.env.SERVICE_DOMAIN,
        scope: 'openid profile webid',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 1800 // 30 minutes
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret');
}

module.exports = router;
