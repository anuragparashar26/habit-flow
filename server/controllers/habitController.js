const { validationResult } = require('express-validator');
const db = require('../config/database');

// @desc    Get all habits for current user
exports.getHabits = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT h.*, 
        COALESCE(
          json_agg(
            json_build_object('id', hc.id, 'date', hc.date, 'completedAt', hc.completed_at)
            ORDER BY hc.date DESC
          ) FILTER (WHERE hc.id IS NOT NULL),
          '[]'
        ) as completions
       FROM habits h
       LEFT JOIN habit_completions hc ON h.id = hc.habit_id
       WHERE h.user_id = $1
       GROUP BY h.id
       ORDER BY h.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get habits error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get a single habit
exports.getHabit = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    const result = await db.query(
      `SELECT h.*, 
        COALESCE(
          json_agg(
            json_build_object('id', hc.id, 'date', hc.date, 'completedAt', hc.completed_at)
            ORDER BY hc.date DESC
          ) FILTER (WHERE hc.id IS NOT NULL),
          '[]'
        ) as completions
       FROM habits h
       LEFT JOIN habit_completions hc ON h.id = hc.habit_id
       WHERE h.id = $1 AND h.user_id = $2
       GROUP BY h.id`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get habit error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Create a new habit
exports.createHabit = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, frequency, category } = req.body;

    // Check for duplicate habit name for this user
    const duplicate = await db.query(
      'SELECT * FROM habits WHERE user_id = $1 AND LOWER(name) = LOWER($2)',
      [req.user.id, name]
    );

    if (duplicate.rows.length > 0) {
      return res.status(400).json({ error: 'You already have a habit with this name' });
    }

    const result = await db.query(
      'INSERT INTO habits (user_id, name, description, frequency, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, name, description || null, frequency, category || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create habit error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Update a habit
exports.updateHabit = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description, frequency, category } = req.body;

    // Check if habit exists and belongs to user
    const habitCheck = await db.query(
      'SELECT * FROM habits WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (habitCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Check for duplicate name if name is being updated
    if (name && name !== habitCheck.rows[0].name) {
      const duplicate = await db.query(
        'SELECT * FROM habits WHERE user_id = $1 AND LOWER(name) = LOWER($2) AND id != $3',
        [req.user.id, name, id]
      );

      if (duplicate.rows.length > 0) {
        return res.status(400).json({ error: 'You already have a habit with this name' });
      }
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (frequency !== undefined) {
      updates.push(`frequency = $${paramCount++}`);
      values.push(frequency);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(category);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id, req.user.id);

    const result = await db.query(
      `UPDATE habits SET ${updates.join(', ')} WHERE id = $${paramCount++} AND user_id = $${paramCount} RETURNING *`,
      values
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update habit error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Delete a habit
exports.deleteHabit = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM habits WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    res.json({ message: 'Habit deleted successfully' });
  } catch (error) {
    console.error('Delete habit error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Mark habit as complete
exports.completeHabit = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    // Check if habit exists and belongs to user
    const habitCheck = await db.query(
      'SELECT * FROM habits WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (habitCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    const habit = habitCheck.rows[0];
    const today = new Date().toISOString().split('T')[0];

    // For weekly habits, get the start of the current week (Monday)
    let checkDate = today;
    if (habit.frequency === 'weekly') {
      const date = new Date();
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      checkDate = new Date(date.setDate(diff)).toISOString().split('T')[0];
    }

    // Check if already completed for this period
    const existingCompletion = await db.query(
      'SELECT * FROM habit_completions WHERE habit_id = $1 AND date = $2',
      [id, checkDate]
    );

    if (existingCompletion.rows.length > 0) {
      return res.status(400).json({ 
        error: `This habit has already been completed for ${habit.frequency === 'daily' ? 'today' : 'this week'}` 
      });
    }

    // Insert completion
    const result = await db.query(
      'INSERT INTO habit_completions (habit_id, user_id, date) VALUES ($1, $2, $3) RETURNING *',
      [id, req.user.id, checkDate]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Complete habit error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get habit statistics
exports.getHabitStats = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    // Check if habit exists and belongs to user
    const habitCheck = await db.query(
      'SELECT * FROM habits WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (habitCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    const habit = habitCheck.rows[0];

    // Get all completions
    const completions = await db.query(
      'SELECT * FROM habit_completions WHERE habit_id = $1 ORDER BY date DESC',
      [id]
    );

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (completions.rows.length > 0) {
      const sortedDates = completions.rows.map(c => new Date(c.date)).sort((a, b) => b - a);
      
      // Check if there's a completion today or yesterday (to continue streak)
      const lastCompletion = sortedDates[0];
      const daysDiff = Math.floor((today - lastCompletion) / (1000 * 60 * 60 * 24));
      
      if (habit.frequency === 'daily') {
        if (daysDiff <= 1) {
          currentStreak = 1;
          for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = sortedDates[i - 1];
            const currDate = sortedDates[i];
            const diff = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));
            
            if (diff === 1) {
              currentStreak++;
            } else {
              break;
            }
          }
        }
      } else {
        // For weekly habits, calculate streak based on consecutive weeks
        if (daysDiff <= 7) {
          currentStreak = 1;
          for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = sortedDates[i - 1];
            const currDate = sortedDates[i];
            const diff = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));
            
            if (diff >= 6 && diff <= 8) {
              currentStreak++;
            } else {
              break;
            }
          }
        }
      }
    }

    // Calculate completion rate
    const habitAge = Math.floor((today - new Date(habit.created_at)) / (1000 * 60 * 60 * 24)) + 1;
    const expectedCompletions = habit.frequency === 'daily' ? habitAge : Math.ceil(habitAge / 7);
    const actualCompletions = completions.rows.length;
    const completionRate = expectedCompletions > 0 ? (actualCompletions / expectedCompletions) * 100 : 0;

    res.json({
      currentStreak,
      totalCompletions: actualCompletions,
      completionRate: Math.round(completionRate * 10) / 10,
      expectedCompletions,
    });
  } catch (error) {
    console.error('Get habit stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
