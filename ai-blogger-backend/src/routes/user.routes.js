// src/routes/user.routes.js
const express = require('express');
const { body } = require('express-validator');
const router  = express.Router();
const ctrl    = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

router.get ('/profile',  authenticate, ctrl.getProfile);
router.patch('/profile', authenticate, [
  body('name').optional().trim().isLength({min:2,max:60}),
  validate,
], ctrl.updateProfile);
router.post('/upgrade', authenticate, [
  body('plan').isIn(['basic','pro','enterprise']).withMessage('Invalid plan'),
  validate,
], ctrl.upgradePlan);

// Admin
router.get ('/',     authenticate, authorize('admin'), ctrl.adminGetUsers);
router.patch('/:id', authenticate, authorize('admin'), ctrl.adminUpdateUser);
router.delete('/:id',authenticate, authorize('admin'), ctrl.adminDeleteUser);

module.exports = router;
