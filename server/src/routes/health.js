'use strict';

const express = require('express');
const router = express.Router();

/**
 * GET /api/health
 * Simple liveness check — returns server status and timestamp.
 */
router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'SkillBridge AI API',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
