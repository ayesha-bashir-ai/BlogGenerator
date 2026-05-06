// src/routes/blog.routes.js
const express = require('express');
const { body } = require('express-validator');
const router  = express.Router();
const ctrl    = require('../controllers/blog.controller');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const blogRules = [
  body('title').trim().isLength({min:5,max:200}).withMessage('Title must be 5-200 chars'),
  body('content').isLength({min:50}).withMessage('Content must be at least 50 chars'),
  validate,
];

router.get ('/',             optionalAuth,                     ctrl.getBlogs);
router.get ('/mine',         authenticate,                     ctrl.getMyBlogs);
router.get ('/admin',        authenticate, authorize('admin'), ctrl.adminGetBlogs);
router.get ('/:id',          optionalAuth,                     ctrl.getBlog);
router.post('/',             authenticate, blogRules,          ctrl.createBlog);
router.put ('/:id',          authenticate, blogRules,          ctrl.updateBlog);
router.patch('/:id/publish', authenticate,                     ctrl.publishBlog);
router.delete('/:id',        authenticate,                     ctrl.deleteBlog);

module.exports = router;
