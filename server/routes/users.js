const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// @route   GET /api/users/:id
// @desc    Get user profile
// @access  Private
router.get('/:id', param('id').isInt(), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT 
        u.id, 
        u.username, 
        u.full_name, 
        u.created_at,
        (SELECT COUNT(*) FROM habits WHERE user_id = u.id) as total_habits,
        (SELECT COUNT(*) FROM habit_completions WHERE user_id = u.id) as total_completions,
        EXISTS(
          SELECT 1 FROM follows 
          WHERE follower_id = $1 AND following_id = u.id
        ) as is_following
       FROM users u
       WHERE u.id = $2`,
      [req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
