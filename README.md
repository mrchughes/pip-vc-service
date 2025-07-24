# PIP VC Service

This repository contains the implementation of the PIP VC Service for the PDS3.0 project.

## Description

The PIP VC Service is a GOV.UK-styled service that authenticates via Solid OIDC and issues mock benefit award verifiable credentials to a user's Solid pod.

## Key Features

- Log in via Solid OIDC
- Generate and sign benefit award VCs
- Push to Solid pod with EON access pre-granted

## Project Structure

```
.
├── docs/              # Documentation and OpenAPI specs
│   └── schemas/       # JSON Schema and RDF shapes for VCs
├── scripts/           # Utility scripts for setup and deployment
├── src/               # Source code
├── test/              # Tests
│   └── mocks/         # Mock services for testing
├── README.md          # This file
└── SPECIFICATION.md   # Service specification
```

## Getting Started

### Prerequisites

- Node.js (version TBD)
- Docker and Docker Compose

### Installation

1. Clone this repository
2. Run `npm install`
3. Configure the environment variables

### Running the Service

```bash
npm start
```

Or with Docker:

```bash
docker-compose up
```

## API Documentation

See `docs/openapi.yaml` for the full API specification.

## Testing

```bash
npm test
```

## License

TBD
