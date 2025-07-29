const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * Get PIP eligibility and benefit award data
 * GET /eligibility
 */
router.get('/', asyncHandler(async (req, res) => {
    const webid = req.user.webid;

    // Mock PIP benefit data based on spec requirements
    const mockBenefitData = {
        benefitType: process.env.MOCK_BENEFIT_TYPE || 'PIP',
        amount: process.env.MOCK_BENEFIT_AMOUNT || '£90.10/week',
        assessmentDate: process.env.MOCK_ASSESSMENT_DATE || '2025-01-15',
        nextReviewDate: '2027-01-15',
        components: {
            dailyLiving: {
                awarded: true,
                level: 'Standard',
                weeklyAmount: '£68.10'
            },
            mobility: {
                awarded: true,
                level: 'Enhanced',
                weeklyAmount: '£94.80'
            }
        },
        totalWeeklyAmount: '£162.90',
        paymentDetails: {
            frequency: 'Every 4 weeks',
            nextPaymentDate: '2025-02-15',
            paymentAmount: '£651.60'
        },
        eligibility: {
            eligible: true,
            reason: 'Meets PIP criteria for daily living and mobility components',
            assessmentScore: {
                dailyLiving: 12,
                mobility: 15
            }
        },
        userInfo: {
            webid: webid,
            nationalInsuranceNumber: 'AB123456C', // Mock NI number
            dateOfBirth: '1985-03-20'
        }
    };

    res.json(mockBenefitData);
}));

/**
 * Get benefit history for the user
 * GET /eligibility/history
 */
router.get('/history', asyncHandler(async (req, res) => {
    const webid = req.user.webid;

    const mockHistory = [
        {
            benefitType: 'PIP',
            startDate: '2023-01-15',
            endDate: null,
            status: 'Active',
            amount: '£162.90/week',
            reason: 'Initial award following assessment'
        },
        {
            benefitType: 'ESA',
            startDate: '2021-06-01',
            endDate: '2022-12-31',
            status: 'Ended',
            amount: '£84.80/week',
            reason: 'Transferred to PIP'
        }
    ];

    res.json({
        webid: webid,
        history: mockHistory,
        totalRecords: mockHistory.length
    });
}));

/**
 * Check eligibility for specific benefit
 * POST /eligibility/check
 */
router.post('/check', asyncHandler(async (req, res) => {
    const { benefitType } = req.body;
    const webid = req.user.webid;

    if (!benefitType) {
        return res.status(400).json({
            error: 'Missing benefit type'
        });
    }

    // Mock eligibility check
    const eligibilityResult = {
        webid: webid,
        benefitType: benefitType.toUpperCase(),
        eligible: benefitType.toUpperCase() === 'PIP',
        reason: benefitType.toUpperCase() === 'PIP'
            ? 'Meets eligibility criteria for Personal Independence Payment'
            : `${benefitType} eligibility check not supported in mock service`,
        checkedDate: new Date().toISOString(),
        nextReviewDate: benefitType.toUpperCase() === 'PIP' ? '2027-01-15' : null
    };

    res.json(eligibilityResult);
}));

module.exports = router;
