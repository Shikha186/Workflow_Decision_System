
const Workflow = require('../models/workflow');
const Request = require('../models/request');
const { evaluateStage } = require('../services/ruleEngine');
const { mockCreditCheck } = require('../services/externalService');

exports.processRequest = async (req, res) => {

    const idempotencyKey = req.headers['x-idempotency-key'];

    if (idempotencyKey) {
        const existingRequest = await Request.findOne({ idempotencyKey });
        if (existingRequest) {
            return res.status(200).json({
                message: 'Duplicate request detected. Returning existing result.',
                requestId: existingRequest._id,
                currentStage: existingRequest.currentStage,
                status: existingRequest.status
            });
        }
    }
    try {
        const { workflowName, payload } = req.body;

        const workflow = await Workflow.findOne({ name: workflowName, isActive: true });
        if (!workflow) return res.status(404).json({ error: 'Workflow configuration not found' });

        // Initialize state
        let currentRequest = new Request({
            workflowId: workflow._id,
            payload: payload,
            idempotencyKey: idempotencyKey,
            currentStage: workflow.initialStage,
            auditTrail: [{ stageEvaluated: 'System Intake', decision: 'Request received' }]
        });

        // Find the configuration for the current stage
        const stageConfig = workflow.stages.find(s => s.stageName === currentRequest.currentStage);
        
        // if (stageConfig && stageConfig.type === 'Automated') {
        //     // Run the rule engine
        //     const evaluation = evaluateStage(payload, stageConfig);
            
        //     // Update the state and audit log based on the engine's decision
        //     currentRequest.currentStage = evaluation.nextStage;
        //     if (evaluation.nextStage === 'Rejected') currentRequest.status = 'Rejected';
        //     if (evaluation.nextStage === 'Approved') currentRequest.status = 'Success';

        //     currentRequest.auditTrail.push({
        //         stageEvaluated: stageConfig.stageName,
        //         ruleTriggered: evaluation.ruleTriggered,
        //         decision: evaluation.decision
        //     });
        // }

        if (stageConfig && stageConfig.type === 'Automated') {
            
            // --- NEW: External Dependency Check ---
            // If the payload doesn't have a credit score, we must fetch it externally
            if (!payload.creditScore && stageConfig.stageName === "Initial Check") {
                try {
                    const externalData = await mockCreditCheck(payload);
                    payload.creditScore = externalData.creditScore; // Inject fetched data
                    
                    currentRequest.auditTrail.push({
                        stageEvaluated: 'External API Call',
                        decision: 'Successfully retrieved credit data'
                    });
                } catch (error) {
                    // --- NEW: Dependency Failure Handling ---
                    currentRequest.status = 'Retry';
                    currentRequest.auditTrail.push({
                        stageEvaluated: 'External API Call',
                        decision: `Failed: ${error.message} - Marked for retry`
                    });
                    
                    await currentRequest.save();
                    return res.status(503).json({ 
                        error: 'External dependency failed',
                        status: 'Retry',
                        requestId: currentRequest._id
                    });
                }
            }
            const evaluation = evaluateStage(payload, stageConfig);
            // Update the state and audit log based on the engine's decision
            currentRequest.currentStage = evaluation.nextStage;
            if (evaluation.nextStage === 'Rejected') currentRequest.status = 'Rejected';
            if (evaluation.nextStage === 'Approved') currentRequest.status = 'Success';

            currentRequest.auditTrail.push({
                stageEvaluated: stageConfig.stageName,
                ruleTriggered: evaluation.ruleTriggered,
                decision: evaluation.decision
            });
        }

        await currentRequest.save();

        res.status(202).json({ 
            message: 'Request processed', 
            requestId: currentRequest._id,
            currentStage: currentRequest.currentStage,
            status: currentRequest.status
        });

    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};


exports.createConfig = async (req, res) => {
    try {
        const newWorkflow = new Workflow({
            name: "Loan Approval",
            initialStage: "Initial Check",
            stages: [
                {
                    stageName: "Initial Check",
                    type: "Automated",
                    rules: [
                        { field: "creditScore", operator: ">", value: 700, onSuccessStage: "Approved", onFailStage: "Rejected" }
                    ]
                }
            ]
        });
        await newWorkflow.save();
        res.status(201).json(newWorkflow);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Auditability - explainable decisions
exports.getAuditTrail = async (req, res) => {
    try {
        const { requestId } = req.params;
        const requestDoc = await Request.findById(requestId);
        
        if (!requestDoc) {
            return res.status(404).json({ error: 'Request not found' });
        }

        res.status(200).json({
            requestId: requestDoc._id,
            inputPayload: requestDoc.payload,
            finalStatus: requestDoc.status,
            auditTrail: requestDoc.auditTrail // The exact rules triggered
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve audit log', details: error.message });
    }
};