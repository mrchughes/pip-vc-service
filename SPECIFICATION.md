# PIP VC Service Specification

## Common Considerations:
- All services MUST support interoperability using Solid OIDC and WebID for user identification.
- Verifiable Credentials MUST be issued in both JSON-LD and Turtle.
- All APIs MUST use HTTPS and standard REST semantics.
- UI components MUST follow GOV.UK Design System (PIP, OIDC) or brand-aligned styles (EON).
- All services MUST support containerized deployment.

## Key Features:
- Log in via Solid OIDC
- Generate and sign benefit award VCs
- Push to Solid pod with EON access pre-granted

## OpenAPI YAML:
```yaml
openapi: 3.0.3
info:
  title: PIP VC Service
  version: 1.0.0
paths:
  /login:
    post:
      summary: Authenticate using Solid OIDC
  /eligibility:
    get:
      summary: Get PIP award mock data
  /vc/preview:
    get:
      summary: Preview VC before issuing
  /vc/issue:
    post:
      summary: Issue VC to user pod
  /vc/list:
    get:
      summary: List issued VCs
  /vc/revoke:
    post:
      summary: Revoke credential
```

## Token Format (example):
```json
{
  "webid": "https://user.example.org/profile/card#me",
  "iss": "https://oidc.gov.uk"
}
```

## Backlog:

### Authentication:
- OIDC login and session validation
- Extract WebID from token and store locally

### VC Generation:
- Construct VC for PIP benefit
- Include benefit type, weekly amount, issuing body
- Format in both Turtle + JSON-LD
- Sign using fixed DID:web and public key

### Pod Storage:
- Discover Pod URL via WebID
- PUT VC into /credentials/
- Assign readable label, tag, and grant EON access

### UI:
- Login with Solid
- View mock PIP benefit details
- Preview and issue credential
- List all issued credentials
- Revoke with reason dialog

### Testing & Deployment:
- Configurable mock data
- VC JSON schema validator
- GOV.UK design + container config

### Non-Functional:
- VC issuance within 500ms
- Complete VC lifecycle log

## Clarifications:
- Ensure /vc/publish and /vc/issue are either synonymous or clearly separated (e.g., issue signs, publish writes).
- VC schema (PIPBenefitCredential) must be included in /docs/schemas/ in both JSON Schema and RDF shapes.

## Credential Metadata:
- All issued VCs must include labels, tags, and metadata.
- VC must be signed with static DID:web, and public key reference must be published.
