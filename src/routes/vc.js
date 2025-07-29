const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { asyncHandler } = require('../middleware/errorHandler');
const vcService = require('../services/vcService');
const podService = require('../services/podService');

const router = express.Router();

/**
 * Preview VC before issuing
 * GET /vc/preview
 */
router.get('/preview', asyncHandler(async (req, res) => {
    const webid = req.user.webid;

    // Get benefit data for VC preview
    const benefitData = {
        benefitType: 'PIP',
        amount: '£90.10/week',
        assessmentDate: '2025-01-15',
        components: ['Daily Living - Standard', 'Mobility - Enhanced']
    };

    // Generate preview VC in both formats
    const vcId = `urn:uuid:${uuidv4()}`;
    const vcData = {
        id: vcId,
        webid: webid,
        benefitData: benefitData,
        preview: true
    };

    const jsonLdVc = await vcService.generateJsonLdVc(vcData);
    const turtleVc = await vcService.generateTurtleVc(vcData);

    // Determine response format based on Accept header
    const acceptHeader = req.headers.accept || '';

    if (acceptHeader.includes('application/ld+json')) {
        res.setHeader('Content-Type', 'application/ld+json');
        return res.json(jsonLdVc);
    } else if (acceptHeader.includes('text/turtle')) {
        res.setHeader('Content-Type', 'text/turtle');
        return res.send(turtleVc);
    } else {
        // Default response with both formats
        res.json({
            id: vcId,
            preview: true,
            formats: {
                'application/ld+json': jsonLdVc,
                'text/turtle': turtleVc
            },
            metadata: {
                issuer: process.env.SERVICE_DID_WEB,
                subject: webid,
                issuanceDate: new Date().toISOString(),
                benefitType: benefitData.benefitType,
                amount: benefitData.amount
            }
        });
    }
}));

/**
 * Issue VC to user's pod
 * POST /vc/issue
 */
router.post('/issue', asyncHandler(async (req, res) => {
    const webid = req.user.webid;
    const { confirm, podUrl } = req.body;

    if (!confirm) {
        return res.status(400).json({
            error: 'Confirmation required',
            message: 'Must confirm VC issuance by setting confirm: true'
        });
    }

    try {
        // Generate VC ID
        const vcId = `urn:uuid:${uuidv4()}`;

        // Get benefit data
        const benefitData = {
            benefitType: 'PIP',
            amount: '£90.10/week',
            assessmentDate: '2025-01-15',
            totalWeeklyAmount: '£162.90',
            components: {
                dailyLiving: 'Standard - £68.10',
                mobility: 'Enhanced - £94.80'
            }
        };

        // Generate signed VC in both formats
        const vcData = {
            id: vcId,
            webid: webid,
            benefitData: benefitData,
            preview: false
        };

        const jsonLdVc = await vcService.generateJsonLdVc(vcData);
        const turtleVc = await vcService.generateTurtleVc(vcData);

        // Discover pod URL if not provided
        const targetPodUrl = podUrl || await podService.discoverPodUrl(webid);

        // Store VC in user's pod
        const storageResult = await podService.storeCredential(targetPodUrl, vcId, {
            jsonLd: jsonLdVc,
            turtle: turtleVc
        }, req.user);

        // Log issuance
        console.log(`VC issued: ${vcId} for ${webid}`);

        res.status(201).json({
            success: true,
            vcId: vcId,
            vc: jsonLdVc,
            storageLocation: `${targetPodUrl}/credentials/${vcId}`,
            issuanceDate: new Date().toISOString(),
            formats: ['application/ld+json', 'text/turtle'],
            metadata: {
                issuer: process.env.SERVICE_DID_WEB,
                subject: webid,
                benefitType: benefitData.benefitType,
                amount: benefitData.amount,
                signature: jsonLdVc.proof?.jws ? 'present' : 'mock'
            }
        });

    } catch (error) {
        console.error('VC issuance error:', error);
        res.status(500).json({
            error: 'VC issuance failed',
            message: error.message
        });
    }
}));

/**
 * List all VCs issued to the current user
 * GET /vc/list
 */
router.get('/list', asyncHandler(async (req, res) => {
    const webid = req.user.webid;

    try {
        // In a real implementation, this would query a database or the user's pod
        // For mock purposes, return example VCs
        const mockVcList = [
            {
                id: 'urn:uuid:pip-benefit-award-001',
                type: 'PIPBenefitCredential',
                issuanceDate: '2025-01-15T10:30:00Z',
                status: 'active',
                benefitType: 'PIP',
                amount: '£162.90/week',
                issuer: process.env.SERVICE_DID_WEB,
                location: '/credentials/urn:uuid:pip-benefit-award-001'
            },
            {
                id: 'urn:uuid:pip-benefit-award-002',
                type: 'PIPBenefitCredential',
                issuanceDate: '2024-08-20T14:15:00Z',
                status: 'superseded',
                benefitType: 'PIP',
                amount: '£142.50/week',
                issuer: process.env.SERVICE_DID_WEB,
                location: '/credentials/urn:uuid:pip-benefit-award-002'
            }
        ];

        res.json({
            webid: webid,
            credentials: mockVcList,
            totalCount: mockVcList.length,
            activeCount: mockVcList.filter(vc => vc.status === 'active').length
        });

    } catch (error) {
        console.error('VC list error:', error);
        res.status(500).json({
            error: 'Failed to retrieve VC list',
            message: error.message
        });
    }
}));

/**
 * Revoke a specific VC
 * POST /vc/revoke
 */
router.post('/revoke', asyncHandler(async (req, res) => {
    const { vcId, reason } = req.body;
    const webid = req.user.webid;

    if (!vcId) {
        return res.status(400).json({
            error: 'Missing VC ID'
        });
    }

    if (!reason) {
        return res.status(400).json({
            error: 'Revocation reason required'
        });
    }

    try {
        // In a real implementation, this would:
        // 1. Verify the VC belongs to the user
        // 2. Update the VC status in the pod
        // 3. Add revocation information
        // 4. Notify relevant parties

        console.log(`VC revoked: ${vcId} by ${webid}, reason: ${reason}`);

        res.json({
            success: true,
            vcId: vcId,
            revokedBy: webid,
            reason: reason,
            revokedAt: new Date().toISOString(),
            message: 'Credential successfully revoked'
        });

    } catch (error) {
        console.error('VC revocation error:', error);
        res.status(500).json({
            error: 'VC revocation failed',
            message: error.message
        });
    }
}));

/**
 * Get specific VC details
 * GET /vc/:vcId
 */
router.get('/:vcId', asyncHandler(async (req, res) => {
    const { vcId } = req.params;
    const webid = req.user.webid;

    try {
        // Mock VC retrieval
        const mockVc = {
            id: vcId,
            type: 'PIPBenefitCredential',
            issuer: process.env.SERVICE_DID_WEB,
            issuanceDate: '2025-01-15T10:30:00Z',
            credentialSubject: {
                id: webid,
                benefitType: 'PIP',
                amount: '£162.90/week',
                components: {
                    dailyLiving: 'Standard',
                    mobility: 'Enhanced'
                }
            },
            proof: {
                type: 'RsaSignature2018',
                created: '2025-01-15T10:30:00Z',
                proofPurpose: 'assertionMethod',
                verificationMethod: `${process.env.SERVICE_DID_WEB}#key-1`,
                jws: 'mock-signature-value'
            }
        };

        res.json(mockVc);

    } catch (error) {
        console.error('VC retrieval error:', error);
        res.status(404).json({
            error: 'VC not found',
            message: 'The requested credential could not be found'
        });
    }
}));

module.exports = router;
