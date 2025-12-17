import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { habitService } from '../services';
import { CheckCircle, Edit, Trash2, TrendingUp, Calendar, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const HabitCard = ({ habit, onComplete, onDelete, onRefresh }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, [habit.id]);

  const loadStats = async () => {
    try {
      const data = await habitService.getHabitStats(habit.id);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await onComplete(habit.id);
      await loadStats();
    } catch (error) {
      console.error('Failed to complete habit:', error);
    } finally {
      setLoading(false);
    }
  };

  const isCompletedToday = () => {
    if (!habit.completions || habit.completions.length === 0) return false;
    const today = new Date().toISOString().split('T')[0];
    
    if (habit.frequency === 'daily') {
      return habit.completions.some(c => c.date.split('T')[0] === today);
    } else {
      // For weekly, check if completed this week
      const date = new Date();
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(date.setDate(diff)).toISOString().split('T')[0];
      return habit.completions.some(c => c.date.split('T')[0] === weekStart);
    }
  };

  const completed = isCompletedToday();

  const getCategoryColor = (category) => {
    const colors = {
      health: 'bg-green-100 text-green-800',
      productivity: 'bg-blue-100 text-blue-800',
      learning: 'bg-purple-100 text-purple-800',
      fitness: 'bg-red-100 text-red-800',
      mindfulness: 'bg-yellow-100 text-yellow-800',
    };
    return colors[category?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{habit.name}</h3>
            {habit.category && (
              <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(habit.category)}`}>
                {habit.category}
              </span>
            )}
          </div>
          {habit.description && (
            <p className="text-sm text-gray-600 mb-3">{habit.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {habit.frequency}
            </span>
            {stats && (
              <>
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {stats.currentStreak} day streak
                </span>
                <span>{stats.completionRate.toFixed(0)}% complete</span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/habits/${habit.id}/edit`}
            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded"
          >
            <Edit className="w-4 h-4" />
          </Link>
          <button
            onClick={() => onDelete(habit.id)}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <button
        onClick={handleComplete}
        disabled={loading || completed}
        className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
          completed
            ? 'bg-green-100 text-green-700 cursor-not-allowed'
            : 'bg-primary-600 text-white hover:bg-primary-700'
        }`}
      >
        <CheckCircle className="w-5 h-5" />
        {loading ? 'Marking...' : completed ? 'Completed Today!' : 'Mark as Complete'}
      </button>
    </div>
  );
};

const Dashboard = () => {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      const data = await habitService.getHabits();
      setHabits(data);
    } catch (err) {
      setError('Failed to load habits');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (habitId) => {
    try {
      await habitService.completeHabit(habitId);
      await loadHabits();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to complete habit');
    }
  };

  const handleDelete = async (habitId) => {
    if (!window.confirm('Are you sure you want to delete this habit?')) return;

    try {
      await habitService.deleteHabit(habitId);
      await loadHabits();
    } catch (err) {
      alert('Failed to delete habit');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-xl text-gray-600">Loading habits...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Habits</h1>
          <p className="text-gray-600 mt-1">Track your daily progress and build consistency</p>
        </div>
        <Link to="/habits/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Habit
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {habits.length === 0 ? (
        <div className="text-center py-12 card">
          <div className="text-gray-400 mb-4">
            <Calendar className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No habits yet</h3>
          <p className="text-gray-600 mb-6">Create your first habit to get started!</p>
          <Link to="/habits/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create First Habit
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onComplete={handleComplete}
              onDelete={handleDelete}
              onRefresh={loadHabits}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
