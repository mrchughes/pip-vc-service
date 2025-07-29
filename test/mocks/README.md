# Test Mocks for PIP VC Service

This directory contains mock implementations and test data for the PIP VC Service.

## Contents

- `README.md` - This file
- `tokens/` - Example access tokens and JWT payloads
- `vcs/` - Sample Verifiable Credentials in different formats
- `services/` - Mock service implementations for testing

## Running Mocks

To run the mock services for testing:

```bash
# Start mock Solid OIDC provider
python3 services/mock-solid-oidc.py

# Start mock PDS
python3 services/mock-pds.py

# Start mock DID:web service
python3 services/mock-did-web.py
```

All mock services will run on different ports to avoid conflicts:
- Mock Solid OIDC: http://localhost:3100
- Mock PDS: http://localhost:3101  
- Mock DID:web: http://localhost:3102

## Test Data

The mocks include pre-configured test data including:
- Valid WebID documents
- Sample access tokens with correct claims
- Example VCs in both JSON-LD and Turtle formats
- Mock benefit award data

## Environment Setup

Set these environment variables to use the mocks:

```bash
SOLID_OIDC_ISSUER=http://localhost:3100
DEFAULT_PDS_BASE=http://localhost:3101
```

## Postman Collection

The included Postman collection (`pip-vc-service.postman_collection.json`) includes tests that verify:
- Authentication flow
- VC generation and issuance
- Pod storage operations
- Service registration
- All required API endpoints

Import the collection and run the tests to verify service functionality.
