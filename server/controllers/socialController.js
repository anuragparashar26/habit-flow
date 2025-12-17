const { validationResult } = require('express-validator');
const db = require('../config/database');

// @desc    Search for users
exports.searchUsers = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { q } = req.query;

    const result = await db.query(
      `SELECT id, username, full_name, created_at,
        EXISTS(
          SELECT 1 FROM follows 
          WHERE follower_id = $1 AND following_id = users.id
        ) as is_following
       FROM users 
       WHERE (username ILIKE $2 OR full_name ILIKE $2) 
       AND id != $1
       LIMIT 20`,
      [req.user.id, `%${q}%`]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Follow a user
exports.followUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;

    // Check if trying to follow self
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    // Check if user exists
    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [userId]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already following
    const existingFollow = await db.query(
      'SELECT * FROM follows WHERE follower_id = $1 AND following_id = $2',
      [req.user.id, userId]
    );

    if (existingFollow.rows.length > 0) {
      return res.status(400).json({ error: 'You are already following this user' });
    }

    // Create follow relationship
    const result = await db.query(
      'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) RETURNING *',
      [req.user.id, userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Unfollow a user
exports.unfollowUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;

    const result = await db.query(
      'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2 RETURNING *',
      [req.user.id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Follow relationship not found' });
    }

    res.json({ message: 'Unfollowed successfully' });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get list of users current user is following
exports.getFollowing = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.username, u.full_name, f.created_at as followed_at
       FROM follows f
       JOIN users u ON f.following_id = u.id
       WHERE f.follower_id = $1
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get list of current user's followers
exports.getFollowers = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.username, u.full_name, f.created_at as followed_at
       FROM follows f
       JOIN users u ON f.follower_id = u.id
       WHERE f.following_id = $1
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get activity feed from followed users
exports.getActivityFeed = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const result = await db.query(
      `SELECT 
        u.id as user_id,
        u.username,
        u.full_name,
        h.id as habit_id,
        h.name as habit_name,
        h.category,
        hc.completed_at,
        hc.date,
        (
          SELECT COUNT(*)
          FROM habit_completions hc2
          WHERE hc2.habit_id = h.id
        ) as total_completions,
        (
          SELECT COUNT(DISTINCT date)
          FROM habit_completions hc3
          WHERE hc3.habit_id = h.id
          AND hc3.date >= (
            SELECT MAX(date) - INTERVAL '30 days'
            FROM habit_completions
            WHERE habit_id = h.id
          )
        ) as recent_streak
       FROM habit_completions hc
       JOIN habits h ON hc.habit_id = h.id
       JOIN users u ON hc.user_id = u.id
       WHERE hc.user_id IN (
         SELECT following_id 
         FROM follows 
         WHERE follower_id = $1
       )
       ORDER BY hc.completed_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get activity feed error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
