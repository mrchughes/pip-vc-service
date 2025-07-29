#!/usr/bin/env python3
"""
Mock DID:web service for testing PIP VC Service
Provides DID document resolution and signature verification
"""

from flask import Flask, jsonify, request
import time
import json

app = Flask(__name__)

# Mock DID documents
DID_DOCUMENTS = {
    "pip.gov.uk": {
        "@context": [
            "https://www.w3.org/ns/did/v1",
            "https://w3id.org/security/suites/jws-2020/v1"
        ],
        "id": "did:web:pip.gov.uk",
        "verificationMethod": [
            {
                "id": "did:web:pip.gov.uk#key-1",
                "type": "RsaVerificationKey2018",
                "controller": "did:web:pip.gov.uk",
                "publicKeyJwk": {
                    "kty": "RSA",
                    "n": "mock-public-key-modulus-for-pip-service",
                    "e": "AQAB"
                }
            }
        ],
        "assertionMethod": ["did:web:pip.gov.uk#key-1"],
        "service": [
            {
                "id": "did:web:pip.gov.uk#vc-service",
                "type": "VerifiableCredentialService",
                "serviceEndpoint": "http://localhost:3002/vc"
            }
        ]
    },
    "eon.co.uk": {
        "@context": [
            "https://www.w3.org/ns/did/v1",
            "https://w3id.org/security/suites/jws-2020/v1"
        ],
        "id": "did:web:eon.co.uk",
        "verificationMethod": [
            {
                "id": "did:web:eon.co.uk#key-1",
                "type": "RsaVerificationKey2018",
                "controller": "did:web:eon.co.uk",
                "publicKeyJwk": {
                    "kty": "RSA",
                    "n": "mock-public-key-modulus-for-eon-service",
                    "e": "AQAB"
                }
            }
        ],
        "assertionMethod": ["did:web:eon.co.uk#key-1"]
    }
}

@app.route('/did/create', methods=['POST'])
def create_did():
    """Create a new DID (mock implementation)"""
    data = request.get_json()
    public_key = data.get('publicKey')
    
    if not public_key:
        return jsonify({"error": "Missing public key"}), 400
    
    # Generate mock DID
    did_id = f"did:web:mock-{int(time.time())}.example.org"
    
    did_doc = {
        "@context": ["https://www.w3.org/ns/did/v1"],
        "id": did_id,
        "verificationMethod": [
            {
                "id": f"{did_id}#key-1",
                "type": "RsaVerificationKey2018",
                "controller": did_id,
                "publicKeyJwk": {
                    "kty": "RSA",
                    "n": public_key,
                    "e": "AQAB"
                }
            }
        ],
        "assertionMethod": [f"{did_id}#key-1"]
    }
    
    return jsonify({
        "did": did_id,
        "document": did_doc,
        "created": time.time()
    }), 201

@app.route('/did/resolve/<path:did>')
def resolve_did(did):
    """Resolve a DID to its document"""
    # Extract domain from DID
    if did.startswith('did:web:'):
        domain = did.replace('did:web:', '')
        
        if domain in DID_DOCUMENTS:
            return jsonify(DID_DOCUMENTS[domain])
        else:
            # Return a generic DID document for unknown domains
            return jsonify({
                "@context": ["https://www.w3.org/ns/did/v1"],
                "id": did,
                "verificationMethod": [
                    {
                        "id": f"{did}#key-1",
                        "type": "RsaVerificationKey2018",
                        "controller": did,
                        "publicKeyJwk": {
                            "kty": "RSA",
                            "n": "mock-public-key-for-unknown-domain",
                            "e": "AQAB"
                        }
                    }
                ],
                "assertionMethod": [f"{did}#key-1"]
            })
    else:
        return jsonify({"error": "Unsupported DID method"}), 400

@app.route('/did/verify', methods=['POST'])
def verify_signature():
    """Verify a signature against a DID"""
    data = request.get_json()
    did = data.get('did')
    signature_data = data.get('data')
    signature = data.get('signature')
    
    if not all([did, signature_data, signature]):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Mock verification - in production, this would do actual cryptographic verification
    verification_result = {
        "verified": True,
        "did": did,
        "verificationMethod": f"{did}#key-1",
        "timestamp": time.time(),
        "mock": True
    }
    
    # Simulate some verification failures for testing
    if "invalid" in signature.lower():
        verification_result["verified"] = False
        verification_result["error"] = "Invalid signature"
    
    return jsonify(verification_result)

@app.route('/did/challenge', methods=['POST'])
def did_challenge():
    """Perform DID:web domain control challenge"""
    data = request.get_json()
    did = data.get('did')
    domain = data.get('domain')
    
    if not did or not domain:
        return jsonify({"error": "Missing DID or domain"}), 400
    
    # Mock challenge verification
    challenge_result = {
        "verified": True,
        "did": did,
        "domain": domain,
        "challenge_type": "well-known",
        "completed_at": time.time(),
        "mock": True
    }
    
    return jsonify(challenge_result)

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Mock DID:web Service",
        "timestamp": time.time(),
        "supported_dids": list(DID_DOCUMENTS.keys())
    })

@app.route('/.well-known/did.json')
def service_did():
    """Service's own DID document"""
    return jsonify(DID_DOCUMENTS.get("pip.gov.uk", {}))

@app.after_request
def after_request(response):
    """Add CORS headers to all responses"""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

if __name__ == '__main__':
    print("🆔 Starting Mock DID:web Service on http://localhost:3102")
    print("📋 Available endpoints:")
    print("  - /did/create (create new DID)")
    print("  - /did/resolve/<did> (resolve DID document)")
    print("  - /did/verify (verify signature)")
    print("  - /did/challenge (domain control challenge)")
    print("  - /.well-known/did.json (service DID document)")
    print("  - /health (health check)")
    
    app.run(host='0.0.0.0', port=3102, debug=True)
