
const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
    field: { type: String, required: true }, // like-"creditScore", "age", "documentType"
    operator: { type: String, required: true, enum: ['>', '<', '==', '!=', 'exists'] },
    value: { type: mongoose.Schema.Types.Mixed, required: true }, // Can be a number, string, or boolean
    onSuccessStage: { type: String, required: true }, // Where to route if rule passes
    onFailStage: { type: String, required: true } // Where to route if rule fails
}, { _id: false });

const stageSchema = new mongoose.Schema({
    stageName: { type: String, required: true }, // like-"Initial Review", "Final Approval", "Rejected"
    type: { type: String, required: true, enum: ['Automated', 'ManualReview', 'End'] },
    rules: [ruleSchema]
}, { _id: false });

const workflowSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // like- "Vendor Approval Workflow"
    description: { type: String },
    initialStage: { type: String, required: true }, // The entry point of the workflow
    stages: [stageSchema], // Array of all possible stages
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Workflow', workflowSchema);