#!/usr/bin/env python3
"""
Mock Solid PDS (Personal Data Store) for testing PIP VC Service
Provides Solid Pod storage and WebID profile endpoints
"""

from flask import Flask, request, Response, jsonify
import os
import json
import time
from urllib.parse import urlparse

app = Flask(__name__)

# In-memory storage for mock pod data
POD_STORAGE = {}
WEBID_PROFILES = {}

def init_mock_data():
    """Initialize mock WebID and pod data"""
    webid = "https://user.example.org/profile/card#me"
    
    # Mock WebID profile
    WEBID_PROFILES[webid] = """
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix solid: <http://www.w3.org/ns/solid/terms#> .
@prefix pim: <http://www.w3.org/ns/pim/space#> .

<https://user.example.org/profile/card#me>
    a foaf:Person ;
    foaf:name "Test User" ;
    solid:oidcIssuer <http://localhost:3100> ;
    pim:storage <http://localhost:3101/storage/> .
"""
    
    # Initialize storage structure
    POD_STORAGE["credentials"] = {}
    POD_STORAGE["credentials"]["index.ttl"] = """
@prefix ldp: <http://www.w3.org/ns/ldp#> .
@prefix dc: <http://purl.org/dc/terms/> .

<http://localhost:3101/storage/credentials/>
    a ldp:Container ;
    dc:title "Verifiable Credentials Container" .
"""

init_mock_data()

@app.route('/profile/card')
def webid_profile():
    """WebID profile endpoint"""
    # Return the mock WebID profile document
    return Response(
        WEBID_PROFILES["https://user.example.org/profile/card#me"],
        mimetype='text/turtle',
        headers={'Access-Control-Allow-Origin': '*'}
    )

@app.route('/storage/credentials/<path:resource>', methods=['GET', 'PUT', 'DELETE'])
def credentials_endpoint(resource):
    """Credentials storage endpoint"""
    if request.method == 'GET':
        return get_credential(resource)
    elif request.method == 'PUT':
        return put_credential(resource)
    elif request.method == 'DELETE':
        return delete_credential(resource)

def get_credential(resource):
    """GET credential from storage"""
    if resource in POD_STORAGE["credentials"]:
        content = POD_STORAGE["credentials"][resource]
        
        # Determine content type from file extension
        if resource.endswith('.jsonld'):
            content_type = 'application/ld+json'
        elif resource.endswith('.ttl'):
            content_type = 'text/turtle'
        else:
            content_type = 'text/plain'
        
        return Response(
            content,
            mimetype=content_type,
            headers={'Access-Control-Allow-Origin': '*'}
        )
    else:
        return jsonify({"error": "Not found"}), 404

def put_credential(resource):
    """PUT credential to storage"""
    content = request.get_data(as_text=True)
    POD_STORAGE["credentials"][resource] = content
    
    print(f"📝 Stored credential: {resource} ({len(content)} bytes)")
    
    return Response(
        status=201,
        headers={
            'Location': f"/storage/credentials/{resource}",
            'Access-Control-Allow-Origin': '*'
        }
    )

def delete_credential(resource):
    """DELETE credential from storage"""
    if resource in POD_STORAGE["credentials"]:
        del POD_STORAGE["credentials"][resource]
        print(f"🗑️  Deleted credential: {resource}")
        return Response(status=204, headers={'Access-Control-Allow-Origin': '*'})
    else:
        return jsonify({"error": "Not found"}), 404

@app.route('/storage/credentials/')
def credentials_container():
    """Credentials container listing"""
    # List all credentials in the container
    credentials = [key for key in POD_STORAGE["credentials"].keys() if key != "index.ttl"]
    
    # Generate container representation
    container_ttl = f"""
@prefix ldp: <http://www.w3.org/ns/ldp#> .
@prefix dc: <http://purl.org/dc/terms/> .

<http://localhost:3101/storage/credentials/>
    a ldp:Container ;
    dc:title "Verifiable Credentials Container" ;
"""
    
    for cred in credentials:
        container_ttl += f"    ldp:contains <{cred}> ;\n"
    
    container_ttl += "    ."
    
    return Response(
        container_ttl,
        mimetype='text/turtle',
        headers={'Access-Control-Allow-Origin': '*'}
    )

@app.route('/storage/credentials/index.ttl')
def credentials_index():
    """Credentials index endpoint"""
    return Response(
        POD_STORAGE["credentials"].get("index.ttl", ""),
        mimetype='text/turtle',
        headers={'Access-Control-Allow-Origin': '*'}
    )

@app.route('/storage/<path:resource>.acl', methods=['GET', 'PUT'])
def acl_endpoint(resource):
    """Access Control List endpoint"""
    acl_key = f"{resource}.acl"
    
    if request.method == 'GET':
        acl_content = POD_STORAGE.get(acl_key, "")
        return Response(
            acl_content,
            mimetype='text/turtle',
            headers={'Access-Control-Allow-Origin': '*'}
        )
    elif request.method == 'PUT':
        content = request.get_data(as_text=True)
        POD_STORAGE[acl_key] = content
        print(f"🔐 Updated ACL: {acl_key}")
        return Response(
            status=200,
            headers={'Access-Control-Allow-Origin': '*'}
        )

@app.route('/storage/')
def storage_root():
    """Storage root container"""
    root_ttl = """
@prefix ldp: <http://www.w3.org/ns/ldp#> .
@prefix dc: <http://purl.org/dc/terms/> .

<http://localhost:3101/storage/>
    a ldp:Container ;
    dc:title "Personal Data Storage" ;
    ldp:contains <credentials/> .
"""
    
    return Response(
        root_ttl,
        mimetype='text/turtle',
        headers={'Access-Control-Allow-Origin': '*'}
    )

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Mock Solid PDS",
        "timestamp": time.time(),
        "storage_items": len(POD_STORAGE.get("credentials", {}))
    })

@app.before_request
def handle_preflight():
    """Handle CORS preflight requests"""
    if request.method == "OPTIONS":
        response = Response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "*")
        response.headers.add('Access-Control-Allow-Methods', "*")
        return response

@app.after_request
def after_request(response):
    """Add CORS headers to all responses"""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

if __name__ == '__main__':
    print("🗄️  Starting Mock Solid PDS on http://localhost:3101")
    print("📋 Available endpoints:")
    print("  - /profile/card (WebID profile)")
    print("  - /storage/ (storage root)")
    print("  - /storage/credentials/ (credentials container)")
    print("  - /storage/credentials/<id> (credential CRUD)")
    print("  - /storage/<resource>.acl (access control)")
    print("  - /health (health check)")
    
    app.run(host='0.0.0.0', port=3101, debug=True)
