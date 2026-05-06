// src/routes/stats.routes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/stats.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/public', ctrl.publicStats);
router.get('/me',     authenticate,                     ctrl.myStats);
router.get('/admin',  authenticate, authorize('admin'), ctrl.adminStats);

module.exports = router;
