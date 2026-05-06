// src/routes/auth.routes.js
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const emailRule = body('email').isEmail().normalizeEmail().withMessage('Valid email required');
const passRule  = body('password').isLength({min:8}).withMessage('Password min 8 chars')
  .matches(/[A-Z]/).withMessage('Password needs uppercase')
  .matches(/[0-9]/).withMessage('Password needs a number');

router.post('/register',        [body('name').trim().isLength({min:2,max:60}), emailRule, passRule, validate], ctrl.register);
router.post('/login',           [emailRule, body('password').notEmpty(), validate], ctrl.login);
router.post('/refresh',         [body('refreshToken').notEmpty(), validate], ctrl.refreshToken);
router.post('/logout',          ctrl.logout);
router.post('/logout-all',      authenticate, ctrl.logoutAll);
router.get ('/me',              authenticate, ctrl.me);
router.post('/forgot-password', [emailRule, validate], ctrl.forgotPassword);
router.post('/reset-password',  [body('token').notEmpty(), passRule, validate], ctrl.resetPassword);
router.post('/change-password', authenticate, [body('currentPassword').notEmpty(), passRule, validate], ctrl.changePassword);

module.exports = router;
