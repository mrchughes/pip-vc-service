const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * Service for generating Verifiable Credentials in JSON-LD and Turtle formats
 */
class VcService {

    /**
     * Generate a Verifiable Credential in JSON-LD format
     */
    async generateJsonLdVc(vcData) {
        const { id, webid, benefitData, preview = false } = vcData;

        const vc = {
            "@context": [
                "https://www.w3.org/2018/credentials/v1",
                "https://schema.org/",
                {
                    "PIPBenefitCredential": "https://gov.uk/schemas/PIPBenefitCredential",
                    "benefitType": "https://schema.org/name",
                    "amount": "https://schema.org/amount",
                    "assessmentDate": "https://schema.org/dateCreated",
                    "components": "https://gov.uk/schemas/benefitComponents"
                }
            ],
            "id": id,
            "type": ["VerifiableCredential", "PIPBenefitCredential"],
            "issuer": process.env.SERVICE_DID_WEB || "did:web:pip.gov.uk",
            "issuanceDate": new Date().toISOString(),
            "credentialSubject": {
                "id": webid,
                "benefitType": benefitData.benefitType,
                "amount": benefitData.amount,
                "assessmentDate": benefitData.assessmentDate
            }
        };

        // Add additional benefit details if available
        if (benefitData.components) {
            vc.credentialSubject.components = benefitData.components;
        }

        if (benefitData.totalWeeklyAmount) {
            vc.credentialSubject.totalWeeklyAmount = benefitData.totalWeeklyAmount;
        }

        // Add proof section unless it's a preview
        if (!preview) {
            vc.proof = await this.generateProof(vc);
        }

        return vc;
    }

    /**
     * Generate a Verifiable Credential in Turtle format
     */
    async generateTurtleVc(vcData) {
        const { id, webid, benefitData, preview = false } = vcData;

        const turtle = `@prefix cred: <https://www.w3.org/2018/credentials#> .
@prefix schema: <http://schema.org/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix dc: <http://purl.org/dc/terms/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

<${id}>
    a cred:VerifiableCredential ;
    rdf:type <https://gov.uk/schemas/PIPBenefitCredential> ;
    cred:issuer <${process.env.SERVICE_DID_WEB || 'did:web:pip.gov.uk'}> ;
    cred:credentialSubject <${webid}> ;
    cred:issuanceDate "${new Date().toISOString()}"^^xsd:dateTime ;
    dc:created "${new Date().toISOString()}"^^xsd:dateTime ;
    dc:title "PIP Benefit Award Credential" ;
    dc:creator <${process.env.SERVICE_DID_WEB || 'did:web:pip.gov.uk'}> ;
    schema:benefitType "${benefitData.benefitType}" ;
    schema:amount "${benefitData.amount}" ;
    schema:dateCreated "${benefitData.assessmentDate}"^^xsd:dateTime${benefitData.totalWeeklyAmount ? ` ;
    schema:totalAmount "${benefitData.totalWeeklyAmount}"` : ''}${!preview ? ` ;
    cred:proof [
        a cred:Proof ;
        cred:type "RsaSignature2018" ;
        cred:created "${new Date().toISOString()}"^^xsd:dateTime ;
        cred:proofPurpose "assertionMethod" ;
        cred:verificationMethod <${process.env.SERVICE_DID_WEB}#key-1> ;
        cred:jws "mock-signature-${crypto.randomBytes(16).toString('hex')}"
    ]` : ''} .`;

        return turtle;
    }

    /**
     * Generate a cryptographic proof for the VC
     */
    async generateProof(vc) {
        // In production, this would use actual cryptographic signing
        // For mock purposes, we generate a placeholder proof structure

        const proof = {
            type: "RsaSignature2018",
            created: new Date().toISOString(),
            proofPurpose: "assertionMethod",
            verificationMethod: `${process.env.SERVICE_DID_WEB}#key-1`,
            jws: this.generateMockSignature(vc)
        };

        return proof;
    }

    /**
     * Generate a mock signature for testing
     */
    generateMockSignature(vc) {
        // Create a deterministic mock signature based on VC content
        const vcString = JSON.stringify(vc, null, 0);
        const hash = crypto.createHash('sha256').update(vcString).digest('hex');
        return `mock-jws-signature-${hash.substring(0, 16)}`;
    }

    /**
     * Validate a VC structure
     */
    validateVc(vc) {
        const required = ['@context', 'id', 'type', 'issuer', 'issuanceDate', 'credentialSubject'];

        for (const field of required) {
            if (!vc[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        if (!vc.credentialSubject.id) {
            throw new Error('Missing credentialSubject.id');
        }

        if (!vc.type.includes('VerifiableCredential')) {
            throw new Error('VC must include VerifiableCredential type');
        }

        return true;
    }

    /**
     * Convert between VC formats
     */
    async convertFormat(vc, targetFormat) {
        if (targetFormat === 'application/ld+json') {
            return typeof vc === 'string' ? JSON.parse(vc) : vc;
        } else if (targetFormat === 'text/turtle') {
            if (typeof vc === 'string') {
                return vc; // Already turtle
            }
            // Convert JSON-LD to Turtle (simplified conversion)
            return await this.generateTurtleVc({
                id: vc.id,
                webid: vc.credentialSubject.id,
                benefitData: {
                    benefitType: vc.credentialSubject.benefitType,
                    amount: vc.credentialSubject.amount,
                    assessmentDate: vc.credentialSubject.assessmentDate
                }
            });
        }

        throw new Error(`Unsupported format: ${targetFormat}`);
    }
}

module.exports = new VcService();
