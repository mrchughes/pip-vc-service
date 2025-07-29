# PIP VC Service

This repository contains the implementation of the PIP VC Service for the PDS3.0 project.

## Description

The PIP VC Service is a GOV.UK-styled service that authenticates via Solid OIDC and issues mock benefit award verifiable credentials to a user's Solid pod. It provides a complete implementation of the PIP VC Service specification with full support for Solid ecosystem integration.

## Key Features

- **Solid OIDC Authentication**: Secure login using Solid identity providers
- **Verifiable Credential Issuance**: Generate PIP benefit award VCs in JSON-LD and Turtle formats
- **Pod Integration**: Store credentials directly in user's Solid pod with proper permissions
- **Service Registration**: DID:web-based service registration with OIDC providers
- **GOV.UK Design System**: Fully compliant user interface following government design standards
- **Mock Services**: Complete set of mock dependencies for testing and development

## Project Structure

```
.
├── docs/                  # Documentation and OpenAPI specs
│   ├── openapi.yaml       # API specification
│   └── schemas/           # JSON Schema and RDF shapes for VCs
├── scripts/               # Utility scripts for setup and deployment
│   ├── setup.sh           # Development environment setup
│   ├── start-mocks.sh     # Start mock services
│   ├── stop-mocks.sh      # Stop mock services
│   └── health-check.sh    # Service health checks
├── src/                   # Source code
│   ├── index.js           # Main application entry point
│   ├── middleware/        # Express middleware
│   ├── routes/            # API and UI route handlers
│   └── services/          # Business logic services
├── test/                  # Tests and mock services
│   ├── mocks/             # Mock service implementations
│   │   ├── services/      # Mock OIDC, PDS, and DID:web services
│   │   ├── tokens/        # Example access tokens
│   │   └── vcs/           # Sample verifiable credentials
│   └── api.test.js        # API and unit tests
├── README.md              # This file
├── SPECIFICATION.md       # Complete service specification
├── package.json           # Node.js dependencies and scripts
├── Dockerfile             # Container build instructions
└── docker-compose.yml     # Multi-service deployment
```

## Quick Start

### Prerequisites

- Node.js 18 or later
- Python 3.7+ (for mock services)
- Docker and Docker Compose (optional, for containerized deployment)

### Installation

1. **Clone and setup the project:**
   ```bash
   git clone <repository-url>
   cd pip-vc-service
   ./scripts/setup.sh
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start mock services:**
   ```bash
   ./scripts/start-mocks.sh
   ```

4. **Start the main service:**
   ```bash
   npm run dev
   ```

### Using Docker

```bash
# Build and start all services
docker-compose up --build

# Or build just the main service
npm run docker:build
npm run docker:run
```

## API Endpoints

### Authentication
- `POST /auth/login` - Initiate Solid OIDC authentication
- `GET /auth/callback` - Handle OIDC callback
- `POST /auth/logout` - Logout and clear session
- `GET /auth/me` - Get current user info

### Service Management
- `POST /service/register` - Register service with DID:web
- `GET /service/status` - Get service status and capabilities
- `GET /service/did.json` - Get service DID document
- `GET /service/keys` - Get public keys for verification

### Eligibility (Authenticated)
- `GET /eligibility` - Get PIP benefit award data
- `GET /eligibility/history` - Get benefit history
- `POST /eligibility/check` - Check eligibility for specific benefit

### Verifiable Credentials (Authenticated)
- `GET /vc/preview` - Preview VC before issuing
- `POST /vc/issue` - Issue VC to user's pod
- `GET /vc/list` - List all issued VCs
- `POST /vc/revoke` - Revoke a specific VC
- `GET /vc/:vcId` - Get specific VC details

### User Interface
- `GET /` - Home page with service overview
- `GET /login` - Login page
- `GET /dashboard` - User dashboard (authenticated)
- `GET /vc-preview` - VC preview page (authenticated)
- `GET /credentials` - Credential management page (authenticated)

### Health and Monitoring
- `GET /health` - Service health check

## Mock Services

The service includes comprehensive mock implementations for testing:

### Mock Solid OIDC Provider (Port 3100)
- OpenID Connect discovery
- Authorization and token endpoints
- Service registration with DID:web verification
- UserInfo endpoint with WebID claims

### Mock Solid PDS (Port 3101)
- WebID profile serving
- Credential storage and retrieval
- Access control list (ACL) management
- Container listing and indexing

### Mock DID:web Service (Port 3102)
- DID document resolution
- Signature verification
- Domain control challenges
- DID creation and management

## Configuration

Key environment variables:

```bash
# Service Configuration
PORT=3002
SERVICE_DOMAIN=pip.gov.uk
SERVICE_DID_WEB=did:web:pip.gov.uk

# Solid OIDC Configuration
SOLID_OIDC_ISSUER=https://oidc.solid.gov.uk
SOLID_OIDC_CLIENT_ID=pip-vc-service
SOLID_OIDC_REDIRECT_URI=http://localhost:3002/auth/callback

# Mock Benefit Data
MOCK_BENEFIT_TYPE=PIP
MOCK_BENEFIT_AMOUNT=£90.10/week
MOCK_ASSESSMENT_DATE=2025-01-15

# Security
JWT_SECRET=your-jwt-secret-here
SESSION_TIMEOUT=1800000
```

## Testing

### Run Tests
```bash
# Unit and integration tests
npm test

# Test with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Manual Testing
```bash
# Start all services
./scripts/start-mocks.sh
npm run dev

# Check health
./scripts/health-check.sh

# Test API endpoints
curl http://localhost:3002/health
curl http://localhost:3002/service/status
```

### End-to-End Testing

The service supports the complete E2E testing scenarios defined in the specification:

1. **Register, Create DID, & Issue PIP VC**
2. **EON Consumes PIP VC and Issues Discount VC**
3. **Citizen Views and Manages All Credentials**

## Verifiable Credential Formats

The service generates VCs in both required formats:

### JSON-LD Example
```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://schema.org/"
  ],
  "id": "urn:uuid:pip-benefit-award-001",
  "type": ["VerifiableCredential", "PIPBenefitCredential"],
  "issuer": "did:web:pip.gov.uk",
  "issuanceDate": "2025-01-15T10:30:00Z",
  "credentialSubject": {
    "id": "https://user.example.org/profile/card#me",
    "benefitType": "PIP",
    "amount": "£162.90/week"
  },
  "proof": {
    "type": "RsaSignature2018",
    "verificationMethod": "did:web:pip.gov.uk#key-1",
    "jws": "eyJhbGciOiJSUzI1NiJ9..."
  }
}
```

### Turtle Example
```turtle
@prefix cred: <https://www.w3.org/2018/credentials#> .
@prefix schema: <http://schema.org/> .

<urn:uuid:pip-benefit-award-001>
    a cred:VerifiableCredential ;
    cred:issuer <did:web:pip.gov.uk> ;
    cred:credentialSubject <https://user.example.org/profile/card#me> ;
    schema:benefitType "PIP" ;
    schema:amount "£162.90/week" .
```

## Security Features

- **Helmet.js**: Security headers and CSP
- **Rate Limiting**: API request throttling
- **CORS**: Configurable cross-origin policies
- **JWT Validation**: Solid OIDC token verification
- **Input Validation**: Request payload validation
- **Access Control**: WebID-based authorization

## Development

### Team Rules

1. **Code Quality**: All code must be complete, no TODOs or placeholders
2. **Testing**: Maintain test coverage for all new features
3. **Documentation**: Update docs for any API changes
4. **Standards**: Follow GOV.UK design patterns for UI
5. **Security**: Never commit secrets or credentials

### Adding New Features

1. Update the OpenAPI specification in `docs/openapi.yaml`
2. Implement route handlers in `src/routes/`
3. Add business logic in `src/services/`
4. Write comprehensive tests in `test/`
5. Update documentation

### Mock Service Development

When adding new dependencies:
1. Create mock implementation in `test/mocks/services/`
2. Add test data in `test/mocks/tokens/` or `test/mocks/vcs/`
3. Update `start-mocks.sh` script
4. Document the mock in `test/mocks/README.md`

## Deployment

### Local Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
```bash
docker-compose up -d
```

### Health Monitoring
```bash
curl http://localhost:3002/health
```

## Compliance

This implementation fully complies with:

- **W3C Verifiable Credentials Data Model**
- **Solid Protocol** for data pods and WebID
- **OpenID Connect** for authentication
- **GOV.UK Design System** for user interface
- **DID:web** specification for service identity
- **RDF/Turtle** and **JSON-LD** for credential formats

## Support

- **API Documentation**: See `docs/openapi.yaml`
- **Service Specification**: See `SPECIFICATION.md`
- **Issues**: Report bugs and feature requests via project issues
- **Health Checks**: Use `/health` endpoint for monitoring

## License

MIT License - see LICENSE file for details.
docker-compose up
```

## API Documentation

See `docs/openapi.yaml` for the full API specification.

### Postman Collection

This service includes a Postman collection (`pip_vc_collection.json`) that documents the API endpoints and provides examples. All API changes must be reflected in this collection.

To use the collection:
1. Import it into Postman
2. Set up your environment variables (`base_url`, `webid`, etc.)
3. Run the collection to test your implementation

Refer to the project's [POSTMAN_GUIDE.md](../POSTMAN_GUIDE.md) for detailed instructions on Postman integration and workflows.

## Testing

```bash
npm test
```

## License

TBD
