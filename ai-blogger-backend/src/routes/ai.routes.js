// src/routes/ai.routes.js
const express = require('express');
const { body } = require('express-validator');
const router  = express.Router();

const ctrl = require('../controllers/ai'); // ✅ FIXED

const { authenticate } = require('../middleware/auth.middleware');
const { validate }     = require('../middleware/validate.middleware');

router.post('/generate',      authenticate, [body('topic').trim().isLength({min:3,max:200}), validate], ctrl.generateBlog);
router.get ('/suggest-topics',authenticate, ctrl.suggestTopics);
router.get ('/trending',      authenticate, ctrl.getTrending);
router.post('/improve',       authenticate, [body('content').isLength({min:50}), validate], ctrl.improveBlog);
router.post('/seo',           authenticate, [body('title').notEmpty(), body('content').notEmpty(), validate], ctrl.generateSEO);
router.post('/chat',          authenticate, [body('message').notEmpty(), validate], ctrl.chat);

module.exports = router;
