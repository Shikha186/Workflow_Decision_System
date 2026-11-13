// backend/services/ruleEngine.js

exports.evaluateStage = (payload, currentStageConfig) => {
    let nextStage = null;
    let ruleTriggered = 'None';
    let decision = 'Failed all rules';

    // Loop through the rules configured for this stage
    for (const rule of currentStageConfig.rules) {
        const payloadValue = payload[rule.field];
        let passed = false;

        // Conditional branching based on configured operator
        switch (rule.operator) {
            case '>': passed = payloadValue > rule.value; break;
            case '<': passed = payloadValue < rule.value; break;
            case '==': passed = payloadValue === rule.value; break;
            case '!=': passed = payloadValue !== rule.value; break;
            case 'exists': passed = payloadValue !== undefined && payloadValue !== null; break;
        }

        if (passed) {
            nextStage = rule.onSuccessStage;
            ruleTriggered = `${rule.field} ${rule.operator} ${rule.value}`;
            decision = 'Passed';
            break; // Stop evaluating once a rule passes (or adjust based on your logic)
        } else {
            // If it fails, we track the failure routing
            nextStage = rule.onFailStage;
            ruleTriggered = `${rule.field} failed ${rule.operator} ${rule.value}`;
            decision = 'Failed';
        }
    }

    return { nextStage, ruleTriggered, decision };
};