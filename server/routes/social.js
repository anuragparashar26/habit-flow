const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const socialController = require('../controllers/socialController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// @route   GET /api/social/users/search
// @desc    Search for users
// @access  Private
router.get('/users/search', query('q').trim().notEmpty(), socialController.searchUsers);

// @route   POST /api/social/follow/:userId
// @desc    Follow a user
// @access  Private
router.post('/follow/:userId', param('userId').isInt(), socialController.followUser);

// @route   DELETE /api/social/follow/:userId
// @desc    Unfollow a user
// @access  Private
router.delete('/follow/:userId', param('userId').isInt(), socialController.unfollowUser);

// @route   GET /api/social/following
// @desc    Get list of users current user is following
// @access  Private
router.get('/following', socialController.getFollowing);

// @route   GET /api/social/followers
// @desc    Get list of current user's followers
// @access  Private
router.get('/followers', socialController.getFollowers);

// @route   GET /api/social/feed
// @desc    Get activity feed from followed users
// @access  Private
router.get('/feed', socialController.getActivityFeed);

module.exports = router;
