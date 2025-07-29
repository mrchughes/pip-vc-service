#!/usr/bin/env python3
"""
Mock Solid OIDC Provider for testing PIP VC Service
Provides authentication endpoints and token issuance
"""

from flask import Flask, request, jsonify, redirect
import jwt
import time
import json
from urllib.parse import urlencode

app = Flask(__name__)

# Mock user database
USERS = {
    "user.example.org": {
        "webid": "https://user.example.org/profile/card#me",
        "username": "testuser",
        "password": "password123"
    }
}

# Mock JWT secret (in production, use proper key management)
JWT_SECRET = "mock-oidc-secret-key"

@app.route('/.well-known/openid-configuration')
def openid_configuration():
    """OpenID Connect discovery endpoint"""
    config = {
        "issuer": "http://localhost:3100",
        "authorization_endpoint": "http://localhost:3100/auth",
        "token_endpoint": "http://localhost:3100/token",
        "userinfo_endpoint": "http://localhost:3100/userinfo",
        "jwks_uri": "http://localhost:3100/.well-known/jwks.json",
        "response_types_supported": ["code"],
        "grant_types_supported": ["authorization_code"],
        "scopes_supported": ["openid", "profile", "webid"],
        "claims_supported": ["webid", "sub", "iss", "aud"]
    }
    return jsonify(config)

@app.route('/auth')
def authorize():
    """Authorization endpoint - simulates user login"""
    response_type = request.args.get('response_type')
    client_id = request.args.get('client_id')
    redirect_uri = request.args.get('redirect_uri')
    scope = request.args.get('scope')
    state = request.args.get('state')
    
    if response_type != 'code':
        return jsonify({"error": "unsupported_response_type"}), 400
    
    # Mock authorization - automatically approve
    auth_code = f"mock-auth-code-{int(time.time())}"
    
    # Redirect back with code
    params = {
        'code': auth_code,
        'state': state
    }
    
    return redirect(f"{redirect_uri}?{urlencode(params)}")

@app.route('/token', methods=['POST'])
def token():
    """Token endpoint - exchange code for access token"""
    grant_type = request.form.get('grant_type')
    code = request.form.get('code')
    client_id = request.form.get('client_id')
    
    if grant_type != 'authorization_code':
        return jsonify({"error": "unsupported_grant_type"}), 400
    
    # Generate mock access token
    payload = {
        "webid": "https://user.example.org/profile/card#me",
        "sub": "user-abc123",
        "iss": "http://localhost:3100",
        "aud": client_id,
        "scope": "openid profile webid",
        "iat": int(time.time()),
        "exp": int(time.time()) + 1800  # 30 minutes
    }
    
    access_token = jwt.encode(payload, JWT_SECRET, algorithm='HS256')
    
    return jsonify({
        "access_token": access_token,
        "token_type": "Bearer",
        "expires_in": 1800,
        "scope": "openid profile webid"
    })

@app.route('/userinfo')
def userinfo():
    """UserInfo endpoint"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "invalid_token"}), 401
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return jsonify({
            "sub": payload["sub"],
            "webid": payload["webid"],
            "iss": payload["iss"]
        })
    except jwt.InvalidTokenError:
        return jsonify({"error": "invalid_token"}), 401

@app.route('/.well-known/jwks.json')
def jwks():
    """JSON Web Key Set endpoint"""
    return jsonify({
        "keys": [
            {
                "kty": "oct",
                "kid": "mock-key-1",
                "use": "sig",
                "alg": "HS256",
                "k": "bW9jay1vaWRjLXNlY3JldC1rZXk"  # base64url encoded secret
            }
        ]
    })

@app.route('/service-register', methods=['POST'])
def service_register():
    """Service registration endpoint for DID:web services"""
    data = request.get_json()
    domain = data.get('domain')
    did_web = data.get('did_web')
    
    # Mock service registration
    registration = {
        "client_id": f"service-{int(time.time())}",
        "client_secret": f"secret-{int(time.time())}",
        "domain": domain,
        "did_web": did_web,
        "registered_at": time.time(),
        "status": "active"
    }
    
    return jsonify(registration), 201

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Mock Solid OIDC Provider",
        "timestamp": time.time()
    })

if __name__ == '__main__':
    print("🔐 Starting Mock Solid OIDC Provider on http://localhost:3100")
    print("📋 Available endpoints:")
    print("  - /.well-known/openid-configuration")
    print("  - /auth (authorization)")
    print("  - /token (token exchange)")
    print("  - /userinfo (user information)")
    print("  - /service-register (service registration)")
    print("  - /health (health check)")
    
    app.run(host='0.0.0.0', port=3100, debug=True)
