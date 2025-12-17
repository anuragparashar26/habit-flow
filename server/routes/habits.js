const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const habitController = require('../controllers/habitController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// @route   GET /api/habits
// @desc    Get all habits for current user
// @access  Private
router.get('/', habitController.getHabits);

// @route   GET /api/habits/:id
// @desc    Get a single habit
// @access  Private
router.get('/:id', param('id').isInt(), habitController.getHabit);

// @route   POST /api/habits
// @desc    Create a new habit
// @access  Private
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Habit name is required').isLength({ max: 100 }),
    body('description').optional().trim(),
    body('frequency').isIn(['daily', 'weekly']).withMessage('Frequency must be daily or weekly'),
    body('category').optional().trim().isLength({ max: 50 }),
  ],
  habitController.createHabit
);

// @route   PUT /api/habits/:id
// @desc    Update a habit
// @access  Private
router.put(
  '/:id',
  [
    param('id').isInt(),
    body('name').optional().trim().notEmpty().isLength({ max: 100 }),
    body('description').optional().trim(),
    body('frequency').optional().isIn(['daily', 'weekly']),
    body('category').optional().trim().isLength({ max: 50 }),
  ],
  habitController.updateHabit
);

// @route   DELETE /api/habits/:id
// @desc    Delete a habit
// @access  Private
router.delete('/:id', param('id').isInt(), habitController.deleteHabit);

// @route   POST /api/habits/:id/complete
// @desc    Mark habit as complete for today/this week
// @access  Private
router.post('/:id/complete', param('id').isInt(), habitController.completeHabit);

// @route   GET /api/habits/:id/stats
// @desc    Get habit statistics (streak, completion rate)
// @access  Private
router.get('/:id/stats', param('id').isInt(), habitController.getHabitStats);

module.exports = router;
