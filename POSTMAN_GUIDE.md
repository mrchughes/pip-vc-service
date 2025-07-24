# Postman Integration Guide for PDS3.0 Suppliers

This document outlines the requirements and procedures for using Postman to share and collaborate on API specifications for the PDS3.0 project.

## Requirements

1. All suppliers **MUST** use Postman to:
   - Document their API endpoints
   - Create and maintain test collections
   - Share API specifications with the team
   - Validate their implementation against the specifications

2. The collections provided in each service repository **MUST** be kept in sync with the Postman workspace.

## Setup Instructions

### 1. Create a Postman Account

If you don't already have one, create a free Postman account at [postman.com](https://www.postman.com/).

### 2. Accept the Workspace Invitation

You will receive an invitation to join the PDS3.0 Postman workspace. Accept this invitation to gain access to the shared collections.

### 3. Install Postman Tools

#### Option A: Desktop App
- Download and install the [Postman Desktop App](https://www.postman.com/downloads/)

#### Option B: VS Code Extension (Recommended)
- Install the "Postman for VS Code" extension
- Sign in to your Postman account through the extension
- Access the PDS3.0 workspace

### 4. Working with Collections

Each service has its own collection:
- `solid_pds_collection.json` - Solid PDS service
- `solid_oidc_collection.json` - Solid OIDC Provider
- `pip_vc_collection.json` - PIP VC Service
- `eon_vc_collection.json` - EON VC Service

When making changes to the API:
1. Update the corresponding collection in Postman
2. Export the collection to the service repository
3. Commit and push the updated collection

## Environments

The following environments are available in the Postman workspace:

1. **Local Development**
   - Base URLs pointing to localhost with appropriate ports
   - Test credentials for local development

2. **Test Environment**
   - Shared test environment URLs
   - Test user credentials

Create your own personal environment variables as needed for local testing.

## Variables

Each collection uses the following variables:
- `base_url` - The base URL for the service
- `webid` - A test WebID
- `access_token` - A valid access token
- `vc_example_jsonld` - Example VC in JSON-LD format
- `vc_example_turtle` - Example VC in Turtle format

## Collaboration Workflow

1. Make changes to the collection in Postman
2. Export the updated collection
3. Replace the JSON file in your service repository
4. Commit and push to the repository
5. Notify team members of significant API changes

## Testing Requirements

All endpoints must have test scripts that validate:
- Correct HTTP response codes
- Response body structure
- Content types
- Proof signature blocks

## Support

For Postman-related questions or issues, contact the project administrator.
