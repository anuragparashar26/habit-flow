import { useState, useEffect } from 'react';
import { socialService } from '../services';
import { Search, UserPlus, UserMinus, TrendingUp, Calendar, Users as UsersIcon } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

const FriendsFeed = () => {
  const [activeTab, setActiveTab] = useState('feed');
  const [feed, setFeed] = useState([]);
  const [following, setFollowing] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeTab === 'feed') {
      loadFeed();
    } else if (activeTab === 'following') {
      loadFollowing();
    }
  }, [activeTab]);

  const loadFeed = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await socialService.getActivityFeed();
      setFeed(data);
    } catch (err) {
      setError('Failed to load activity feed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFollowing = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await socialService.getFollowing();
      setFollowing(data);
    } catch (err) {
      setError('Failed to load following list');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    try {
      const data = await socialService.searchUsers(searchQuery);
      setSearchResults(data);
    } catch (err) {
      setError('Failed to search users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId) => {
    try {
      await socialService.followUser(userId);
      // Refresh search results
      if (searchQuery) {
        const data = await socialService.searchUsers(searchQuery);
        setSearchResults(data);
      }
      // Refresh following list if on that tab
      if (activeTab === 'following') {
        loadFollowing();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to follow user');
    }
  };

  const handleUnfollow = async (userId) => {
    if (!window.confirm('Are you sure you want to unfollow this user?')) return;

    try {
      await socialService.unfollowUser(userId);
      loadFollowing();
    } catch (err) {
      alert('Failed to unfollow user');
    }
  };

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
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Friends & Activity</h1>
      <p className="text-gray-600 mb-8">Stay motivated by following friends and seeing their progress</p>

      {/* Search Bar */}
      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for users..."
              className="input-field"
            />
          </div>
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="font-medium text-gray-900">Search Results</h3>
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{user.username}</p>
                  {user.full_name && <p className="text-sm text-gray-600">{user.full_name}</p>}
                </div>
                {user.is_following ? (
                  <button
                    onClick={() => handleUnfollow(user.id)}
                    className="btn-secondary text-sm flex items-center gap-1"
                  >
                    <UserMinus className="w-4 h-4" />
                    Unfollow
                  </button>
                ) : (
                  <button
                    onClick={() => handleFollow(user.id)}
                    className="btn-primary text-sm flex items-center gap-1"
                  >
                    <UserPlus className="w-4 h-4" />
                    Follow
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('feed')}
          className={`pb-3 px-4 font-medium transition-colors border-b-2 ${
            activeTab === 'feed'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Activity Feed
        </button>
        <button
          onClick={() => setActiveTab('following')}
          className={`pb-3 px-4 font-medium transition-colors border-b-2 ${
            activeTab === 'following'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Following ({following.length})
        </button>
      </div>

      {/* Content */}
      {loading && (
        <div className="text-center py-12 text-gray-600">Loading...</div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md mb-4">
          {error}
        </div>
      )}

      {!loading && activeTab === 'feed' && (
        <div className="space-y-4">
          {feed.length === 0 ? (
            <div className="text-center py-12 card">
              <UsersIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No activity yet</h3>
              <p className="text-gray-600">Follow some friends to see their habit completions here!</p>
            </div>
          ) : (
            feed.map((activity, index) => (
              <div key={index} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-primary-600 font-medium text-lg">
                      {activity.username[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{activity.username}</span>
                      {activity.full_name && (
                        <span className="text-sm text-gray-500">({activity.full_name})</span>
                      )}
                      <span className="text-sm text-gray-500">completed</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{activity.habit_name}</h3>
                      {activity.category && (
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getCategoryColor(activity.category)}`}>
                          {activity.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDistanceToNow(parseISO(activity.completed_at), { addSuffix: true })}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {activity.total_completions} total completions
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!loading && activeTab === 'following' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {following.length === 0 ? (
            <div className="col-span-full text-center py-12 card">
              <UsersIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Not following anyone yet</h3>
              <p className="text-gray-600">Search for users above to start following friends!</p>
            </div>
          ) : (
            following.map((user) => (
              <div key={user.id} className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-primary-600 font-medium text-xl">
                      {user.username[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{user.username}</p>
                    {user.full_name && (
                      <p className="text-sm text-gray-600 truncate">{user.full_name}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleUnfollow(user.id)}
                  className="btn-secondary w-full text-sm flex items-center justify-center gap-1"
                >
                  <UserMinus className="w-4 h-4" />
                  Unfollow
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default FriendsFeed;
