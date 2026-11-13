// backend/models/request.js
const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
    stageEvaluated: { type: String, required: true },
    ruleTriggered: { type: String }, // e.g., "creditScore > 700"
    decision: { type: String, required: true }, // e.g., "Passed", "Failed", "Routed to Manual"
    timestamp: { type: Date, default: Date.now }
}, { _id: false });

const requestSchema = new mongoose.Schema({
    workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true }, // The incoming JSON data being evaluated
    currentStage: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['Processing', 'Success', 'Rejected', 'ManualReview', 'Retry'], 
        default: 'Processing' 
    },
    idempotencyKey: { type: String, unique: true, sparse: true },
    auditTrail: [auditSchema] // Fulfills the "full change history and audit logs" requirement
}, { timestamps: true });



module.exports = mongoose.model('Request', requestSchema);