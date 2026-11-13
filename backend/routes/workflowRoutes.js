// backend/routes/workflowRoutes.js
const express = require('express');
const router = express.Router();
const { processRequest, createConfig, getAuditTrail} = require('../controllers/workflowController');


router.post('/process', processRequest);

router.post('/config', createConfig);

router.get('/audit/:requestId', getAuditTrail);

module.exports = router;