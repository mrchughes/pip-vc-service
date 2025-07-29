Solid VC Microservices Prototype Specification

YOUU ARE PIP-VC SERVICE BUILD TEAM.  BUILD THIS SERVICE ONLY, TO SPEC

📄 Prototype Context Summary for Suppliers
This specification defines a prototype Verifiable Credential (VC) system implemented as a set of containerized microservices. It is not for production, and the goal is to demonstrate working interoperability between Solid Personal Data Stores (PDS), OIDC-based authentication, and linked data-based credential issuance and consumption.

✳️ Key Design Principles
Citizens are identified via WebID (RDF-based URIs).
Services are identified using DID:web, and issue credentials signed with these DIDs.
All services must support containerized deployment and expose RESTful APIs using OpenAPI specs.
Services must use existing open-source libraries and frameworks where possible.

🧱 Core Functional Components
A headless Solid-compliant PDS using RDF/Turtle for all storage, built on the Community Solid Server (CSS).
A Solid OIDC provider for user registration and authentication, following GOV.UK design patterns.
A Wallet Web App for users to manage their DID:ION identity, PDS interactions, and credential storage.
A mock DID:ION service for identity creation and verification.
A PIP-branded credential service that authenticates via Solid OIDC and issues mock benefit award VCs to the user's pod.
An EON-branded credential consumer and issuer that uses local JWT auth for its UI, but authenticates via Solid OIDC to interact with user pods. It consumes the PIP VC, determines eligibility, and issues an EON discount VC.

🔄 Interoperability and Format Expectations
All Verifiable Credentials must be available in both Turtle and JSON-LD.
The PDS backend must use Turtle natively, and services must negotiate preferred VC formats where applicable.
All APIs must use HTTPS and include properly scoped access tokens containing the WebID claim.

📋 Supplier Delivery Requirements
Each service has a fully scoped specification including:
✅ API definitions (OpenAPI YAML)
✅ Token format examples
✅ Complete backlog of user-visible and technical features
✅ Explicit UX expectations (e.g. login, reset password, issue/consume VCs, consent management)
✅ GOV.UK or brand-aligned styling
✅ Configurable test data, mock authentication, and test environment readiness
Monitoring, alerting, and hardened security are not in scope for this prototype.
Each service spec is self-contained and may be delivered independently under fixed-price contract terms.
This document must not be edited by supplier
Services must have fully complete code, not scaffolding, to-dos or placeholders.
Supplier must maintain a single backlog with items and status available at any time for inspection.
Repositories must be clean, tidy and organised, docs in a docs folder, scripts in a script folder etc.
Supplier must maintain a single readme in root repo with basic rules for teams including those above.
Supplier must not deviate from this specification.


1. Solid Personal Data Store (PDS) - Headless Version
Common Considerations:
All services MUST support interoperability using Solid OIDC and WebID for user identification.
Verifiable Credentials MUST be issued in both JSON-LD and Turtle.
All APIs MUST use HTTPS and standard REST semantics.
All services MUST support containerized deployment.

Key Features:
RDF-native storage (Turtle preferred)
Solid-compliant Pod and WebID per user
Credential storage under /credentials/
Access control via WAC/ACP
No direct UI (headless mode)

OpenAPI YAML:
openapi: 3.0.3
info:
 title: Solid PDS
 version: 1.0.0
paths:
 /profile/card:
   get:
     summary: Get WebID Profile
     responses:
       '200':
         description: WebID profile in Turtle
   put:
     summary: Update WebID Profile
     requestBody:
       content:
         text/turtle:
           schema:
             type: string
     responses:
       '200':
         description: Updated
 /credentials/{vcId}:
   get:
     summary: Read credential
     parameters:
       - name: vcId
         in: path
         required: true
         schema:
           type: string
     responses:
       '200':
         description: VC as Turtle or JSON-LD
   put:
     summary: Write credential
     parameters:
       - name: vcId
         in: path
         required: true
         schema:
           type: string
     requestBody:
       content:
         text/turtle:
           schema:
             type: string
         application/ld+json:
           schema:
             type: object
     responses:
       '201':
         description: Stored
   delete:
     summary: Delete credential
     parameters:
       - name: vcId
         in: path
         required: true
         schema:
           type: string
     responses:
       '204':
         description: Deleted
 /.acl:
   put:
     summary: Set access permissions
     requestBody:
       content:
         text/turtle:
           schema:
             type: string
     responses:
       '200':
         description: Access rules updated
 /credentials/index.ttl:
   get:
     summary: Get index of all credentials
     responses:
       '200':
         description: Index of all credentials in Turtle format

Token Format (example):
{
 "webid": "https://user.example.org/profile/card#me",
 "iss": "https://solid-oidc.gov.uk",
 "aud": "https://pds.example.org"
}

Backlog:
Authentication & Identity:
Implement Solid OIDC token validation for all user actions
Support user profile discovery via WebID document
Credential Operations:
Store credentials under /credentials/{vcId} path
Support GET/PUT/DELETE VC operations in both Turtle and JSON-LD
Generate metadata for discoverability (e.g. via ldp:contains, RDF type triples)
Maintain index document at /credentials/index.ttl listing all VC resources
Access Control & Consent:
Implement WAC and ACP-based access rules per VC
Allow programmatic grant/revoke access to third parties with expiration
Log all access events to support auditing
All VCs must include standard RDF metadata:
rdf:type, dc:created, dc:modified, dc:title, dc:creator
Testing & Deployment:
Docker container with volume-backed storage
Enable reset user data mode for testing
Environment config: domain, port, data root
Non-Functional:
Fast response < 500ms for GET profile/VC
Load test with 1000 concurrent VC reads
Support ldp:contains triples for credential discovery


2. Solid OIDC Provider (Addendum to Existing Service)
Additional Features Required:
Support for DID:web validation during service registration
Domain allow-listing for trusted VC service providers
Endpoint for domain allowlist management
Extended token claims support

OpenAPI YAML (additional endpoints):
openapi: 3.0.3
info:
 title: Solid OIDC Provider (Addendum)
 version: 1.0.0
paths:
 /allowlist:
   get:
     summary: Retrieve domain allowlist
     responses:
       '200':
         description: List of allowed domains
   post:
     summary: Add domain to allowlist
     requestBody:
       content:
         application/json:
           schema:
             type: object
             properties:
               domain:
                 type: string
     responses:
       '201':
         description: Domain added
   delete:
     summary: Remove domain from allowlist
     parameters:
       - name: domain
         in: query
         required: true
         schema:
           type: string
     responses:
       '204':
         description: Domain removed
 /service-register:
   post:
     summary: Register a VC service using DID:web
     requestBody:
       content:
         application/json:
           schema:
             type: object
             properties:
               domain:
                 type: string
               did_web:
                 type: string
     responses:
       '201':
         description: Service registered

Token Format (updated example):
{
 "webid": "https://user.example.org/profile/card#me",
 "iss": "https://oidc.gov.uk",
 "aud": "https://pip.gov.uk",
 "service_id": "service123"
}

Backlog (additions):
Service Registration:
Implement DID:web challenge-response verification for service registration
Validate domains against allowlist during registration
Maintain registry of approved services with DID:web identifiers
Token Enhancements:
Add service_id claim to tokens for service authentication
Support token introspection endpoint
Validate domain against allowlist for token issuance
Session Management:
Implement session timeout logic with default 30 minutes idle timeout
Provide UI modal to renew session
Support /jwks.json endpoint for token verification
Support key rotation with notification to dependent services


3. Wallet Web App (New Component)
Common Considerations:
Must integrate with Solid OIDC for authentication
Must handle all PDS interactions
Must support DID:ION creation and management

Key Features:
Create and manage DID:ION identities
Manage PDS permissions and access
Store and protect private keys in PDS
Handle signing requests using DID:ION
UI for credential management and display

OpenAPI YAML:
openapi: 3.0.3
info:
 title: Wallet Web App
 version: 1.0.0
paths:
 /login:
   post:
     summary: Authenticate using Solid OIDC
     requestBody:
       content:
         application/json:
           schema:
             type: object
             properties:
               username:
                 type: string
               password:
                 type: string
     responses:
       '200':
         description: Login successful
 /did/create:
   post:
     summary: Create new DID:ION identity
     requestBody:
       content:
         application/json:
           schema:
             type: object
             properties:
               passphrase:
                 type: string
     responses:
       '201':
         description: DID created
 /did/sign:
   post:
     summary: Sign data with DID:ION
     requestBody:
       content:
         application/json:
           schema:
             type: object
             properties:
               data:
                 type: string
               passphrase:
                 type: string
     responses:
       '200':
         description: Signed data
 /pds/credentials:
   get:
     summary: List all credentials from PDS
     responses:
       '200':
         description: List of credentials
 /pds/permissions:
   get:
     summary: Get current permissions
     responses:
       '200':
         description: List of current permissions
   post:
     summary: Set permissions for a credential
     requestBody:
       content:
         application/json:
           schema:
             type: object
             properties:
               credentialId:
                 type: string
               accessors:
                 type: array
                 items:
                   type: string
               actions:
                 type: array
                 items:
                   type: string
     responses:
       '200':
         description: Permissions updated

Backlog:
Authentication & Identity:
Integrate with Solid OIDC for login and token management
Create and manage DID:ION identities
Store private keys in PDS with passphrase protection
DID Management:
Generate key pairs for DID:ION
Register DID with mock DID:ION service
Store recovery information securely
PDS Interaction:
Discover and connect to user's PDS via WebID
Manage all credential storage and retrieval
Configure ACL/permissions for credentials
UI Features:
Dashboard of all credentials
Permission management interface
Credential detail view with verification status
Signing request approval interface
Key Management:
Secure storage of private keys in PDS
Passphrase-based encryption/decryption
Key rotation support
Testing & Deployment:
Configurable mock data
Docker container
GOV.UK design system compliance


4. Mock DID:ION Service (New Component)
Common Considerations:
Must simulate core DID:ION functionality
Must support verification of DIDs
Must integrate with Wallet Web App

Key Features:
DID:ION creation and registration
DID resolution
Verification of DID-signed credentials

OpenAPI YAML:
openapi: 3.0.3
info:
 title: Mock DID:ION Service
 version: 1.0.0
paths:
 /did/create:
   post:
     summary: Create new DID:ION
     requestBody:
       content:
         application/json:
           schema:
             type: object
             properties:
               publicKey:
                 type: string
     responses:
       '201':
         description: DID created
 /did/resolve/{did}:
   get:
     summary: Resolve DID document
     parameters:
       - name: did
         in: path
         required: true
         schema:
           type: string
     responses:
       '200':
         description: DID document
 /did/verify:
   post:
     summary: Verify signature
     requestBody:
       content:
         application/json:
           schema:
             type: object
             properties:
               did:
                 type: string
               data:
                 type: string
               signature:
                 type: string
     responses:
       '200':
         description: Verification result

Backlog:
DID Operations:
Create DID:ION with proper format
Store DID state for resolution
Support key retrieval for verification
Verification:
Verify signatures against public keys
Support different signature types
Simulate ION network consensus
API Integration:
Support wallet integration
Support VC issuer/verifier integration
Testing & Deployment:
Pre-configured test DIDs
Docker container
Sample verification flows


5. PIP VC Service (Updated)
Common Considerations:
All services MUST support interoperability using Solid OIDC and WebID for user identification.
Verifiable Credentials MUST be issued in both JSON-LD and Turtle.
All APIs MUST use HTTPS and standard REST semantics.
UI components MUST follow GOV.UK Design System.
All services MUST support containerized deployment.

Key Features:
Log in via Solid OIDC
Generate and sign benefit award VCs
Push to Solid pod via Wallet Web App
Verify user identity using WebID

OpenAPI YAML:
openapi: 3.0.3
info:
 title: PIP VC Service
 version: 1.0.0
paths:
 /login:
   post:
     summary: Authenticate using Solid OIDC
 /service-register:
   post:
     summary: Register service with DID:web
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

Token Format (example):
{
 "webid": "https://user.example.org/profile/card#me",
 "iss": "https://oidc.gov.uk"
}

Backlog:
Authentication:
OIDC login and session validation
Extract WebID from token and store locally
Service Registration:
Register with OIDC provider using DID:web challenge
Store registration confirmation
VC Generation:
Construct VC for PIP benefit
Include benefit type, weekly amount, issuing body
Format in both Turtle + JSON-LD
Sign using DID:web and public key
Pod Storage:
Discover Pod URL via WebID
PUT VC into /credentials/ via Wallet Web App
Assign readable label, tag, and grant EON access
UI:
Login with Solid
View mock PIP benefit details
Preview and issue credential
List all issued credentials
Revoke with reason dialog
Testing & Deployment:
Configurable mock data
VC JSON schema validator
GOV.UK design + container config
Non-Functional:
VC issuance within 500ms
Complete VC lifecycle log


6. EON VC Service (Updated)
Common Considerations:
All services MUST support interoperability using Solid OIDC and WebID for user identification.
Verifiable Credentials MUST be issued in both JSON-LD and Turtle.
All APIs MUST use HTTPS and standard REST semantics.
UI components MUST follow brand-aligned styles.
All services MUST support containerized deployment.

Key Features:
Local JWT login
Use Solid OIDC for pod access
Fetch PIP VC and generate discount decision
Verify user identity using WebID

OpenAPI YAML:
openapi: 3.0.3
info:
 title: EON VC Service
 version: 1.0.0
paths:
 /auth:
   post:
     summary: JWT login
 /service-register:
   post:
     summary: Register service with DID:web
 /pip-vc:
   get:
     summary: Load PIP VC from pod
 /discount-decision:
   get:
     summary: Run rules against PIP VC
 /vc/issue:
   post:
     summary: Issue discount VC
 /vc/view:
   get:
     summary: View EON-issued VCs

Token Format (example):
{
 "webid": "https://user.example.org/profile/card#me",
 "sub": "user123@eon.co.uk"
}

Backlog:
Auth:
JWT login for users
Fetch Solid access token for pod interaction
Validate token scopes
Service Registration:
Register with OIDC provider using DID:web challenge
Store registration confirmation
VC Consumption:
Discover and fetch PIP VC in Turtle or JSON-LD
Parse RDF, extract benefit value
Apply threshold logic and compute result
Discount VC Issuance:
Construct new VC with discount details
Sign using EON DID:web
Write to Pod with public read access
UI:
JWT login form
PIP VC view with parsed summary
Decision explanation + eligibility verdict
Confirmation of VC storage
Testing & Deployment:
Mock user store
Configurable rule threshold
Dockerized + logging for all flows
Non-Functional:
Load time < 1s for complete flow
WCAG 2.1 compliant UI


✅ E2E Test Scenario 1: Register, Create DID, & Issue PIP VC
Objective: Verify a citizen can register, create a DID:ION, authenticate, and receive a benefit credential written to their Solid pod.
Steps:
User registers via Solid OIDC Provider (GOV.UK-styled UI).
User logs into Wallet Web App and creates a new DID:ION identity.
User logs in to PIP VC Service using Solid OIDC.
PIP Service retrieves WebID and mocks PIP benefit data.
User previews the VC (in both JSON-LD and Turtle).
User confirms issuance, and the PIP Service:
Generates and signs the VC using did:web:pip.gov.uk
Wallet Web App stores the VC in the user's Pod under /credentials/
User accesses Wallet Web App:
Views the VC in raw RDF and formatted mode
Verifies the VC is accessible via their WebID
Expected Results:
DID:ION is correctly created and stored.
Credential is correctly linked to user WebID.
VC is stored in Turtle and can be retrieved via authenticated GET.
Solid Pod lists the VC in /credentials/.

✅ E2E Test Scenario 2: EON Consumes PIP VC and Issues Discount VC
Objective: Verify EON can authenticate, consume a benefit VC, and issue a discount credential to the user's pod.
Steps:
User logs into EON UI using EON local JWT auth.
EON backend uses Solid OIDC to:
Obtain WebID-based access token
Read VC from the user's /credentials/ in the Pod
EON parses the PIP benefit amount from Turtle or JSON-LD.
EON applies business logic:
If amount > £80/week, user qualifies for discount.
User consents to issue a VC.
EON issues a DiscountEligibilityCredential, signs with did:web:eon.co.uk, and writes it to the Pod.
Expected Results:
PIP VC is parsed correctly from Pod.
Eligibility decision is accurate based on amount.
EON VC is written to the Pod and marked for public read or limited access.

✅ E2E Test Scenario 3: Citizen Views and Manages All Credentials
Objective: Verify a citizen can inspect, manage, and revoke access to issued VCs from the Wallet Web App.
Steps:
User logs into the Wallet Web App via Solid OIDC.
UI lists:
PIP VC with details and signature info
EON VC with discount reason and value
User:
Views VC in both formats
Manages permissions for EON's access to their Pod
Revokes EON's access to their Pod
EON attempts to read the credential again.
Expected Results:
Both VCs are viewable and properly formatted.
Permission management works correctly.
Revoking EON access removes ability to fetch VC.
Access control changes are reflected in Pod metadata (e.g. WAC/ACP rules).

✅ Common Credential Envelope (JSON-LD and Turtle)
Each VC MUST conform to the W3C Verifiable Credentials Data Model and include the following properties:
JSON-LD Example:
{
 "@context": [
   "https://www.w3.org/2018/credentials/v1",
   "https://schema.org/"
 ],
 "id": "urn:uuid:{uuid}",
 "type": ["VerifiableCredential", "{CustomType}"],
 "issuer": "https://{issuer-domain}/did.json",
 "issuanceDate": "2025-07-24T12:00:00Z",
 "credentialSubject": {
   "id": "{WebID}",
   "benefitType": "PIP",
   "amount": "£90.10/week"
 },
 "proof": {
   "type": "RsaSignature2018",
   "created": "2025-07-24T12:00:00Z",
   "proofPurpose": "assertionMethod",
   "verificationMethod": "https://{issuer-domain}/keys/123#pub",
   "jws": "..."
 }
}
Turtle Example:
@prefix cred: <https://www.w3.org/2018/credentials#> .
@prefix schema: <http://schema.org/> .

<urn:uuid:benefit-award-vc-123>
 a cred:VerifiableCredential ;
 cred:issuer <https://pip.gov.uk/did.json> ;
 cred:credentialSubject <https://user.example.org/profile/card#me> ;
 cred:issuanceDate "2025-07-24T12:00:00Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> ;
 cred:proof [
   a cred:Proof ;
   cred:created "2025-07-24T12:00:00Z" ;
   cred:type "RsaSignature2018" ;
   cred:proofPurpose "assertionMethod" ;
   cred:verificationMethod <https://pip.gov.uk/keys/123#pub> ;
   cred:jws "..."
 ] ;
 schema:benefitType "PIP" ;
 schema:amount "£90.10/week" .

🔐 Access Token Claims (OIDC & Local Auth)
Solid OIDC Token (used by PIP, PDS, EON for Pod access):
{
 "webid": "https://user.example.org/profile/card#me",
 "iss": "https://oidc.solid.gov.uk",
 "sub": "user-abc",
 "aud": "https://pds.solid.example.org",
 "scope": "openid profile webid",
 "exp": 1722000000
}
Local JWT (EON UI Authentication only):
{
 "sub": "user123@eon.co.uk",
 "email": "user123@eon.co.uk",
 "role": "citizen",
 "exp": 1722000000
}
EON will use Solid OIDC to interact with user Pods, and its local JWT is only used for UI login.

📑 Credential Type Mapping Per Service
 
All services consuming VCs must:
Support Turtle parsing
Be able to interpret VC subject ID = WebID
Support issuer, proof, and credentialSubject standard fields

🔍 Must-Pass Postman Test Collection: Summary per Service
✅ Solid OIDC Provider
POST /register – register new user, assert 201 and ID returned
POST /login – assert token response includes valid webid
POST /reset-password – assert token flow triggers and validates
GET /userinfo – check returned user profile has correct fields
POST /service-register – assert successful registration with DID:web
✅ Solid PDS
GET /profile/card – return valid RDF WebID document
PUT /credentials/{id} – store credential in both Turtle and JSON-LD
GET /credentials/{id} – assert credential content and format
DELETE /credentials/{id} – confirm VC deletion
PUT /.acl – test access grant to another WebID
GET /credentials/index.ttl – test credential index listing
✅ Wallet Web App
POST /login – assert successful authentication
POST /did/create – assert DID:ION creation
POST /pds/permissions – test permission management
GET /pds/credentials – test credential listing
POST /did/sign – test signing functionality
✅ Mock DID:ION Service
POST /did/create – test DID creation
GET /did/resolve/{did} – test DID resolution
POST /did/verify – test signature verification
✅ PIP VC Service
GET /benefit-preview – mock benefit claim response
POST /vc/issue – assert VC returned contains correct WebID and proof
POST /service-register – assert successful registration
GET /vc/history – list of VCs previously issued to user
✅ EON VC Service
POST /login – local JWT returned
POST /service-register – assert successful registration
POST /token/solid – get Solid OIDC token using refresh
GET /vc/fetch – retrieve VC from Solid Pod, assert WebID and type
POST /vc/decision – check discount logic result
POST /vc/issue – issue EON VC and assert content

All tests must assert:
Correct HTTP response code
Response body includes required VC fields
Content type (e.g., application/ld+json, text/turtle)
Proof signature block exists (in stub or mock form)
Postman environments should include:
base_url
webid
access_token
vc_example_jsonld
vc_example_turtle

📦 Stub Dependencies and Test Mocks (Supplier Responsibility)
To support parallel development and ensure inter-service interoperability, each supplier must independently implement stubbed versions of any external service dependencies based on the provided OpenAPI specifications and VC interoperability appendix.
✅ Requirement
Each supplier MUST:
Build local mock implementations (stubs) for all upstream services their solution depends on
Use these mocks to support automated testing, development, and Postman collection execution
Validate that all interactions (requests/responses) match the documented API contracts
Include a script or container to run these mocks locally for internal and cross-team testing

🔄 Example Expectations
🧩 Shared Inputs
All teams MUST ensure their mocks and real services:
Accept the credential shapes as defined in the VC Interop Appendix
Accept the token formats defined in token claim examples
Are testable using the shared must-pass Postman collection

📁 Recommended Format
Each service's delivery should include a /test/mocks/ directory containing:
README.md with how to run the mocks
Lightweight HTTP stubs (Node/Express, Flask, etc.)
Static credential examples (Turtle and JSON-LD)
Pre-signed access tokens and example WebID documents

🔍 GENERAL CLARIFICATIONS
Terminology Consistency:
All endpoint and property names across OpenAPI specs must use consistent naming conventions.
For example, clarify use of /vc/publish vs /vc/issue to prevent supplier misalignment.
Pod Discovery:
Define pod discovery logic when storage triple is not found in a WebID profile.
Recommend fallback to: https://{webid-domain}/storage/ unless explicitly overridden.
OIDC Tokens:
Token expiration and refresh handling must be scoped.
Minimum token lifetime: 15 minutes.
Expired tokens must return HTTP 401.
Token Examples:
All services must include stub examples for access tokens, including signature blocks (even mock).
OIDC providers must expose /.well-known/jwks.json endpoint.

1. Solid Personal Data Store (PDS) - Headless
Enhancements:
Include ldp:contains triples in the pod to support credential discovery.
Maintain index document under /credentials/index.ttl listing all VC resources.
Clarify .acl inheritance: ACLs apply per-resource; use container ACLs to apply to all contents.
Added Requirement:
VC files must include standard RDF metadata including:
rdf:type, dc:created, dc:modified, dc:title, dc:creator

2. Wallet Web App
Enhancements:
Support multiple DID:ION identities per user
Provide visual cues for credential verification status
Include backup and recovery flow for DID and keys
Added Requirement:
Secure storage of keys with strong encryption
Support QR code display of credentials for offline use
Handle signing request notifications

3. Mock DID:ION Service
Clarifications:
Simulate the ION network's consensus mechanism
Support different key types (RSA, Ed25519, etc.)
Include documentation on DID structure and verification

4. PIP VC Service
Clarifications:
Ensure /vc/issue is clearly defined (issue signs, store sends to PDS)
VC schema (PIPBenefitCredential) must be included in /docs/schemas/ in both JSON Schema and RDF shapes.
Credential Metadata:
All issued VCs must include labels, tags, and metadata (see PDS additions above).
VC must be signed with DID:web, and public key reference must be published.

5. EON VC Service
Clarifications:
VC selection from Pod should support selection by type or issued date.
Rule thresholds (e.g. £80/week) must be externally configurable (e.g. ENV or JSON config).
Resulting DiscountEligibilityCredential must include:
VC subject ID = user WebID
Issuer = did:web:eon.co.uk
RDF metadata and digital proof

6. UI & Repo Structure
UI:
All UI screens must follow GOV.UK or brand-consistent design.
Accessibility: All pages must meet WCAG 2.1 AA.
Repository Layout:
/README.md                # high-level usage + team rules
/docs/                    # OpenAPI, schemas, architecture
/scripts/                 # install, test, run helpers
/test/mocks/              # mock dependencies, example tokens, VC examples
/src/                     # service code
Config Files:
.env.example must be included to show default runtime config.
Docker image names must follow: org/service-name[:tag].

7. Testing & Mocks
Updated Expectation:
Each service must:
Include working mocks for dependent services
Include at least 2 real test VCs (Turtle + JSON-LD)
Provide example requests/responses for each endpoint
Mock Examples:
/test/mocks/
├── README.md
├── tokens/
│   └── oidc_token.json
├── vcs/
│   ├── pip_vc.jsonld
│   └── pip_vc.ttl
└── services/
    ├── mock-pds.py
    └── mock-solid-idp.py

8. Delivery Rules
Each service must:
Deliver complete and runnable code (no placeholders or TODOs)
Use mock data and Docker configs that work in local environment only
Include internal test coverage (unit + integration)
Not in Scope:
Robust security
Monitoring or alerting
External cloud deployment
