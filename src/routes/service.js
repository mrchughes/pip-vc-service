const express = require('express');
const axios = require('axios');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * Register service with Solid OIDC provider using DID:web
 * POST /service/register
 */
router.post('/register', asyncHandler(async (req, res) => {
    const serviceDid = process.env.SERVICE_DID_WEB;
    const serviceDomain = process.env.SERVICE_DOMAIN;

    try {
        // Mock service registration with OIDC provider
        // In production, this would make actual API calls to register the service

        const registrationData = {
            domain: serviceDomain,
            did_web: serviceDid,
            service_name: process.env.SERVICE_NAME || 'PIP VC Service',
            redirect_uris: [
                `http://localhost:${process.env.PORT}/auth/callback`,
                `https://${serviceDomain}/auth/callback`
            ],
            scopes: ['openid', 'profile', 'webid'],
            response_types: ['code'],
            grant_types: ['authorization_code']
        };

        // Simulate DID:web verification challenge
        const challengeResponse = await performDidWebChallenge(serviceDid);

        if (!challengeResponse.verified) {
            return res.status(400).json({
                error: 'DID:web verification failed',
                message: 'Could not verify service DID'
            });
        }

        // Mock successful registration
        const registrationResult = {
            client_id: process.env.SOLID_OIDC_CLIENT_ID,
            client_secret: 'generated-secret-' + Date.now(),
            registration_access_token: 'access-token-' + Date.now(),
            did_web: serviceDid,
            domain: serviceDomain,
            registered_at: new Date().toISOString(),
            status: 'active'
        };

        console.log(`Service registered: ${serviceDid} at ${serviceDomain}`);

        res.status(201).json({
            success: true,
            registration: registrationResult,
            message: 'Service successfully registered with OIDC provider'
        });

    } catch (error) {
        console.error('Service registration error:', error);
        res.status(500).json({
            error: 'Registration failed',
            message: error.message
        });
    }
}));

/**
 * Get service status and configuration
 * GET /service/status
 */
router.get('/status', (req, res) => {
    const status = {
        service_name: process.env.SERVICE_NAME || 'PIP VC Service',
        did_web: process.env.SERVICE_DID_WEB,
        domain: process.env.SERVICE_DOMAIN,
        version: '1.0.0',
        status: 'active',
        endpoints: {
            auth: '/auth',
            eligibility: '/eligibility',
            vc: '/vc',
            health: '/health'
        },
        supported_formats: ['application/ld+json', 'text/turtle'],
        capabilities: [
            'solid-oidc-auth',
            'vc-issuance',
            'pip-benefits',
            'pod-storage'
        ],
        last_updated: new Date().toISOString()
    };

    res.json(status);
});

/**
 * Get service DID document
 * GET /service/did.json
 */
router.get('/did.json', (req, res) => {
    const didDocument = {
        "@context": [
            "https://www.w3.org/ns/did/v1",
            "https://w3id.org/security/suites/jws-2020/v1"
        ],
        "id": process.env.SERVICE_DID_WEB,
        "verificationMethod": [
            {
                "id": `${process.env.SERVICE_DID_WEB}#key-1`,
                "type": "RsaVerificationKey2018",
                "controller": process.env.SERVICE_DID_WEB,
                "publicKeyJwk": {
                    "kty": "RSA",
                    "n": "mock-public-key-modulus",
                    "e": "AQAB"
                }
            }
        ],
        "assertionMethod": [`${process.env.SERVICE_DID_WEB}#key-1`],
        "service": [
            {
                "id": `${process.env.SERVICE_DID_WEB}#vc-service`,
                "type": "VerifiableCredentialService",
                "serviceEndpoint": `https://${process.env.SERVICE_DOMAIN}/vc`
            }
        ]
    };

    res.json(didDocument);
});

/**
 * Get public keys for signature verification
 * GET /service/keys
 */
router.get('/keys', (req, res) => {
    const keys = {
        keys: [
            {
                kid: 'key-1',
                kty: 'RSA',
                use: 'sig',
                alg: 'RS256',
                n: 'mock-public-key-modulus',
                e: 'AQAB'
            }
        ]
    };

    res.json(keys);
});

/**
 * Mock DID:web challenge-response verification
 */
async function performDidWebChallenge(didWeb) {
    try {
        // In production, this would:
        // 1. Fetch the DID document from the well-known location
        // 2. Verify the service controls the domain
        // 3. Validate cryptographic proofs

        // Mock successful verification
        return {
            verified: true,
            did: didWeb,
            challenge_completed_at: new Date().toISOString(),
            verification_method: `${didWeb}#key-1`
        };
    } catch (error) {
        return {
            verified: false,
            error: error.message
        };
    }
}

module.exports = router;
