const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '3004'; // Use different port for tests
process.env.SERVICE_DOMAIN = 'pip.gov.uk';
process.env.SERVICE_DID_WEB = 'did:web:pip.gov.uk';
process.env.JWT_SECRET = 'test-secret';

const app = require('../src/index');

describe('PIP VC Service API', () => {

    describe('Health Check', () => {
        test('GET /health should return service status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body).toHaveProperty('status', 'healthy');
            expect(response.body).toHaveProperty('service', 'PIP VC Service');
            expect(response.body).toHaveProperty('timestamp');
        });
    });

    describe('Authentication', () => {
        test('POST /auth/login should return auth URL', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    redirect_uri: 'http://localhost:3002/auth/callback'
                })
                .expect(200);

            expect(response.body).toHaveProperty('authUrl');
            expect(response.body.authUrl).toContain('response_type=code');
        });

        test('GET /auth/callback should handle auth code', async () => {
            const response = await request(app)
                .get('/auth/callback?code=test-code&state=test-state')
                .set('Accept', 'application/json')
                .expect(200);

            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('type', 'Bearer');
        });
    });

    describe('Service Registration', () => {
        test('POST /service/register should register the service', async () => {
            const response = await request(app)
                .post('/service/register')
                .send({
                    domain: 'pip.gov.uk',
                    did_web: 'did:web:pip.gov.uk'
                })
                .expect(201);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('registration');
        });

    test('GET /service/status should return service info', async () => {
      const response = await request(app)
        .get('/service/status')
        .expect(200);
      
      expect(response.body).toHaveProperty('service_name');
      expect(response.body).toHaveProperty('status', 'active');
      expect(response.body).toHaveProperty('capabilities');
    });

    test('GET /service/did.json should return DID document', async () => {
      const response = await request(app)
        .get('/service/did.json')
        .expect(200);

      expect(response.body).toHaveProperty('@context');
      expect(response.body).toHaveProperty('verificationMethod');
      expect(response.body).toHaveProperty('assertionMethod');
    });
        });
    });

  describe('Eligibility (requires auth)', () => {
    let authToken;

    beforeAll(() => {
      // Create a valid JWT token for testing
      const payload = {
        webid: 'https://user.example.org/profile/card#me',
        sub: 'test-user',
        iss: 'http://localhost:3100',
        aud: 'pip.gov.uk',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 1800 // 30 minutes
      };
      authToken = jwt.sign(payload, process.env.JWT_SECRET);
    });        test('GET /eligibility should return benefit data', async () => {
            const response = await request(app)
                .get('/eligibility')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('benefitType');
            expect(response.body).toHaveProperty('amount');
            expect(response.body).toHaveProperty('eligibility');
        });

        test('GET /eligibility/history should return benefit history', async () => {
            const response = await request(app)
                .get('/eligibility/history')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('history');
            expect(Array.isArray(response.body.history)).toBe(true);
        });
    });

  describe('Verifiable Credentials (requires auth)', () => {
    let authToken;

    beforeAll(() => {
      // Create a valid JWT token for testing
      const payload = {
        webid: 'https://user.example.org/profile/card#me',
        sub: 'test-user',
        iss: 'http://localhost:3100',
        aud: 'pip.gov.uk',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 1800 // 30 minutes
      };
      authToken = jwt.sign(payload, process.env.JWT_SECRET);
    });        test('GET /vc/preview should return VC preview', async () => {
            const response = await request(app)
                .get('/vc/preview')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('preview', true);
            expect(response.body).toHaveProperty('formats');
        });

        test('POST /vc/issue should issue a credential', async () => {
            const response = await request(app)
                .post('/vc/issue')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ confirm: true })
                .expect(201);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('vcId');
            expect(response.body).toHaveProperty('vc');
        });

        test('GET /vc/list should return list of VCs', async () => {
            const response = await request(app)
                .get('/vc/list')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('credentials');
            expect(Array.isArray(response.body.credentials)).toBe(true);
        });

        test('POST /vc/revoke should revoke a credential', async () => {
            const response = await request(app)
                .post('/vc/revoke')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    vcId: 'test-vc-id',
                    reason: 'Testing revocation'
                })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
        });
    });

    describe('Error Handling', () => {
        test('Protected routes should return 401 without auth', async () => {
            await request(app)
                .get('/eligibility')
                .expect(401);

            await request(app)
                .get('/vc/preview')
                .expect(401);
        });

        test('Invalid endpoints should return 404', async () => {
            await request(app)
                .get('/nonexistent')
                .expect(404);
        });
    });
});

describe('VC Service Unit Tests', () => {
    const vcService = require('../src/services/vcService');

    test('should generate valid JSON-LD VC', async () => {
        const vcData = {
            id: 'urn:uuid:test-vc',
            webid: 'https://user.example.org/profile/card#me',
            benefitData: {
                benefitType: 'PIP',
                amount: '£90.10/week',
                assessmentDate: '2025-01-15'
            }
        };

        const vc = await vcService.generateJsonLdVc(vcData);

        expect(vc).toHaveProperty('@context');
        expect(vc).toHaveProperty('id', vcData.id);
        expect(vc).toHaveProperty('type');
        expect(vc.type).toContain('VerifiableCredential');
        expect(vc.type).toContain('PIPBenefitCredential');
        expect(vc.credentialSubject).toHaveProperty('id', vcData.webid);
    });

    test('should generate valid Turtle VC', async () => {
        const vcData = {
            id: 'urn:uuid:test-vc',
            webid: 'https://user.example.org/profile/card#me',
            benefitData: {
                benefitType: 'PIP',
                amount: '£90.10/week',
                assessmentDate: '2025-01-15'
            }
        };

        const turtle = await vcService.generateTurtleVc(vcData);

        expect(typeof turtle).toBe('string');
        expect(turtle).toContain('@prefix cred:');
        expect(turtle).toContain(vcData.id);
        expect(turtle).toContain(vcData.webid);
        expect(turtle).toContain('PIP');
    });

    test('should validate VC structure', () => {
        const validVc = {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            'id': 'urn:uuid:test',
            'type': ['VerifiableCredential'],
            'issuer': 'did:web:test',
            'issuanceDate': '2025-01-15T10:00:00Z',
            'credentialSubject': {
                'id': 'https://user.example.org/profile/card#me'
            }
        };

        expect(() => vcService.validateVc(validVc)).not.toThrow();
    });
});

describe('Pod Service Unit Tests', () => {
    const podService = require('../src/services/podService');

    test('should discover pod URL from WebID', async () => {
        const webid = 'https://user.example.org/profile/card#me';
        const podUrl = await podService.discoverPodUrl(webid);

        expect(typeof podUrl).toBe('string');
        expect(podUrl).toMatch(/^https?:\/\//);
    });

    test('should generate storage URLs correctly', async () => {
        const podUrl = 'https://pod.example.org/';
        const vcId = 'urn:uuid:test-vc';

        const vcData = {
            jsonLd: { test: 'data' },
            turtle: '@prefix test: <test> .'
        };

        const user = { webid: 'https://user.example.org/profile/card#me' };

        // This would normally make HTTP requests, but our mock just logs
        const result = await podService.storeCredential(podUrl, vcId, vcData, user);

        expect(result).toHaveProperty('success', true);
        expect(result).toHaveProperty('locations');
    });
});
