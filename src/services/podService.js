const axios = require('axios');
const { URL } = require('url');

/**
 * Service for interacting with Solid Pods
 */
class PodService {

    /**
     * Discover the pod URL from a WebID
     */
    async discoverPodUrl(webid) {
        try {
            // In production, this would fetch the WebID document and parse the storage location
            // For mock purposes, derive pod URL from WebID

            const webidUrl = new URL(webid);
            const baseUrl = `${webidUrl.protocol}//${webidUrl.host}`;

            // Try common pod storage patterns
            const possiblePodUrls = [
                `${baseUrl}/storage/`,
                `${baseUrl}/pod/`,
                `${baseUrl}/`,
                process.env.DEFAULT_PDS_BASE || 'https://pds.solid.example.org'
            ];

            // For mock, return the first pattern
            return possiblePodUrls[0];
        } catch (error) {
            console.error('Pod discovery error:', error);
            return process.env.DEFAULT_PDS_BASE || 'https://pds.solid.example.org';
        }
    }

    /**
     * Store a credential in the user's pod
     */
    async storeCredential(podUrl, vcId, vcData, user) {
        try {
            const { jsonLd, turtle } = vcData;
            const credentialPath = `credentials/${vcId}`;
            const fullUrl = new URL(credentialPath, podUrl).toString();

            // Store JSON-LD version
            await this.putResource(`${fullUrl}.jsonld`, JSON.stringify(jsonLd, null, 2), 'application/ld+json', user);

            // Store Turtle version  
            await this.putResource(`${fullUrl}.ttl`, turtle, 'text/turtle', user);

            // Update credentials index
            await this.updateCredentialsIndex(podUrl, vcId, user);

            // Set permissions for EON access
            await this.setCredentialPermissions(podUrl, vcId, user);

            return {
                success: true,
                locations: {
                    jsonld: `${fullUrl}.jsonld`,
                    turtle: `${fullUrl}.ttl`
                }
            };
        } catch (error) {
            console.error('Pod storage error:', error);
            throw new Error(`Failed to store credential: ${error.message}`);
        }
    }

    /**
     * PUT a resource to the pod
     */
    async putResource(url, content, contentType, user) {
        try {
            // Mock HTTP PUT to pod
            // In production, this would make actual HTTP requests with proper authentication

            console.log(`Mock PUT to ${url} (${contentType})`);
            console.log(`Content length: ${content.length} bytes`);
            console.log(`User: ${user.webid}`);

            // Simulate successful storage
            return {
                status: 201,
                headers: {
                    location: url,
                    'content-type': contentType
                }
            };
        } catch (error) {
            throw new Error(`HTTP PUT failed: ${error.message}`);
        }
    }

    /**
     * GET a resource from the pod
     */
    async getResource(url, user, acceptType = 'application/ld+json') {
        try {
            // Mock HTTP GET from pod
            // In production, this would make actual HTTP requests with proper authentication

            console.log(`Mock GET from ${url} (Accept: ${acceptType})`);
            console.log(`User: ${user.webid}`);

            // Return mock credential data
            const mockCredential = {
                "@context": ["https://www.w3.org/2018/credentials/v1"],
                "id": url.split('/').pop(),
                "type": ["VerifiableCredential", "PIPBenefitCredential"],
                "issuer": process.env.SERVICE_DID_WEB,
                "credentialSubject": {
                    "id": user.webid,
                    "benefitType": "PIP",
                    "amount": "£90.10/week"
                }
            };

            return {
                status: 200,
                data: mockCredential,
                headers: {
                    'content-type': acceptType
                }
            };
        } catch (error) {
            throw new Error(`HTTP GET failed: ${error.message}`);
        }
    }

    /**
     * Update the credentials index in the pod
     */
    async updateCredentialsIndex(podUrl, vcId, user) {
        try {
            const indexUrl = new URL('credentials/index.ttl', podUrl).toString();

            // Generate index entry in Turtle
            const indexEntry = `
@prefix ldp: <http://www.w3.org/ns/ldp#> .
@prefix dc: <http://purl.org/dc/terms/> .
@prefix cred: <https://www.w3.org/2018/credentials#> .

<${new URL('credentials/', podUrl).toString()}>
    ldp:contains <${vcId}.jsonld> , <${vcId}.ttl> .

<${vcId}.jsonld>
    a cred:VerifiableCredential ;
    dc:title "PIP Benefit Award Credential (JSON-LD)" ;
    dc:created "${new Date().toISOString()}"^^<http://www.w3.org/2001/XMLSchema#dateTime> ;
    dc:format "application/ld+json" .

<${vcId}.ttl>
    a cred:VerifiableCredential ;
    dc:title "PIP Benefit Award Credential (Turtle)" ;
    dc:created "${new Date().toISOString()}"^^<http://www.w3.org/2001/XMLSchema#dateTime> ;
    dc:format "text/turtle" .
`;

            await this.putResource(indexUrl, indexEntry, 'text/turtle', user);

            console.log(`Updated credentials index at ${indexUrl}`);
        } catch (error) {
            console.error('Index update error:', error);
            // Don't fail the whole operation if index update fails
        }
    }

    /**
     * Set access permissions for credentials (WAC/ACP)
     */
    async setCredentialPermissions(podUrl, vcId, user) {
        try {
            const aclUrl = new URL(`credentials/${vcId}.jsonld.acl`, podUrl).toString();

            // Generate ACL granting EON read access
            const acl = `
@prefix acl: <http://www.w3.org/ns/auth/acl#> .
@prefix : <#> .

:owner
    a acl:Authorization ;
    acl:agent <${user.webid}> ;
    acl:accessTo <${vcId}.jsonld> , <${vcId}.ttl> ;
    acl:mode acl:Read , acl:Write , acl:Control .

:eonAccess
    a acl:Authorization ;
    acl:agent <https://eon.co.uk/did.json> ;
    acl:accessTo <${vcId}.jsonld> , <${vcId}.ttl> ;
    acl:mode acl:Read .

:publicRead
    a acl:Authorization ;
    acl:agentClass acl:AuthenticatedAgent ;
    acl:accessTo <${vcId}.jsonld> , <${vcId}.ttl> ;
    acl:mode acl:Read .
`;

            await this.putResource(aclUrl, acl, 'text/turtle', user);

            console.log(`Set permissions for ${vcId} - EON granted read access`);
        } catch (error) {
            console.error('Permission setting error:', error);
            // Don't fail the whole operation if permission setting fails
        }
    }

    /**
     * Delete a credential from the pod
     */
    async deleteCredential(podUrl, vcId, user) {
        try {
            const credentialPath = `credentials/${vcId}`;
            const baseUrl = new URL(credentialPath, podUrl).toString();

            // Delete both formats
            await this.deleteResource(`${baseUrl}.jsonld`, user);
            await this.deleteResource(`${baseUrl}.ttl`, user);

            // Delete ACL files
            await this.deleteResource(`${baseUrl}.jsonld.acl`, user);
            await this.deleteResource(`${baseUrl}.ttl.acl`, user);

            console.log(`Deleted credential ${vcId} from pod`);

            return { success: true };
        } catch (error) {
            throw new Error(`Failed to delete credential: ${error.message}`);
        }
    }

    /**
     * DELETE a resource from the pod
     */
    async deleteResource(url, user) {
        try {
            // Mock HTTP DELETE
            console.log(`Mock DELETE ${url} by ${user.webid}`);

            return { status: 204 };
        } catch (error) {
            throw new Error(`HTTP DELETE failed: ${error.message}`);
        }
    }

    /**
     * List all credentials in the pod
     */
    async listCredentials(podUrl, user) {
        try {
            const indexUrl = new URL('credentials/index.ttl', podUrl).toString();

            // Mock credential listing
            const mockCredentials = [
                {
                    id: 'urn:uuid:pip-benefit-001',
                    title: 'PIP Benefit Award Credential',
                    created: '2025-01-15T10:30:00Z',
                    formats: ['application/ld+json', 'text/turtle']
                }
            ];

            return mockCredentials;
        } catch (error) {
            throw new Error(`Failed to list credentials: ${error.message}`);
        }
    }
}

module.exports = new PodService();
