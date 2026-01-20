import { useState } from 'react';
import { Clock, Music, Calendar, TrendingUp, Trash2, AlertTriangle } from 'lucide-react';
import { formatTime } from '../hooks/useTimer';

export function Statistics({ sessions, onDeleteSessionsByDateRange, onClearAllSessions }) {
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetType, setResetType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const now = new Date();

  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const getMonthStart = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  const getYearStart = (date) => {
    return new Date(date.getFullYear(), 0, 1);
  };

  const weekStart = getWeekStart(now);
  const monthStart = getMonthStart(now);
  const yearStart = getYearStart(now);

  const thisWeekSessions = sessions.filter(
    (s) => new Date(s.date) >= weekStart
  );
  const thisMonthSessions = sessions.filter(
    (s) => new Date(s.date) >= monthStart
  );
  const thisYearSessions = sessions.filter(
    (s) => new Date(s.date) >= yearStart
  );

  const calculateStats = (sessionList) => {
    const totalTime = sessionList.reduce((sum, s) => sum + s.duration, 0);
    const totalItems = sessionList.reduce((sum, s) => sum + s.items.length, 0);
    const sessionCount = sessionList.length;
    return { totalTime, totalItems, sessionCount };
  };

  const weekStats = calculateStats(thisWeekSessions);
  const monthStats = calculateStats(thisMonthSessions);
  const yearStats = calculateStats(thisYearSessions);
  const allTimeStats = calculateStats(sessions);

  const statCards = [
    {
      title: 'This Week',
      stats: weekStats,
      color: 'from-blue-500 to-blue-600',
      icon: Calendar,
    },
    {
      title: 'This Month',
      stats: monthStats,
      color: 'from-primary-500 to-primary-600',
      icon: Calendar,
    },
    {
      title: 'This Year',
      stats: yearStats,
      color: 'from-purple-500 to-purple-600',
      icon: TrendingUp,
    },
    {
      title: 'All Time',
      stats: allTimeStats,
      color: 'from-pink-500 to-rose-600',
      icon: Clock,
    },
  ];

  const getTopPracticeItems = () => {
    const itemCounts = {};
    sessions.forEach((session) => {
      session.items.forEach((item) => {
        if (!itemCounts[item.name]) {
          itemCounts[item.name] = { count: 0, totalTime: 0 };
        }
        itemCounts[item.name].count += 1;
        itemCounts[item.name].totalTime += item.time || 0;
      });
    });

    return Object.entries(itemCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const topItems = getTopPracticeItems();

  const getStreakDays = () => {
    if (sessions.length === 0) return 0;

    const sortedDates = [...new Set(
      sessions.map((s) => new Date(s.date).toDateString())
    )].sort((a, b) => new Date(b) - new Date(a));

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const dateStr of sortedDates) {
      const sessionDate = new Date(dateStr);
      sessionDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (currentDate - sessionDate) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === streak) {
        streak++;
      } else if (diffDays > streak) {
        break;
      }
    }

    return streak;
  };

  const streakDays = getStreakDays();

  const parseLocalDate = (dateString) => {
    // Parse YYYY-MM-DD as local date (not UTC)
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const handleReset = () => {
    if (confirmText !== 'DELETE') return;

    if (resetType === 'all') {
      onClearAllSessions();
    } else if (resetType === 'range' && startDate && endDate) {
      const start = parseLocalDate(startDate);
      start.setHours(0, 0, 0, 0);
      const end = parseLocalDate(endDate);
      end.setHours(23, 59, 59, 999);
      onDeleteSessionsByDateRange(start, end);
    } else if (resetType === 'day' && startDate) {
      const start = parseLocalDate(startDate);
      start.setHours(0, 0, 0, 0);
      const end = parseLocalDate(startDate);
      end.setHours(23, 59, 59, 999);
      onDeleteSessionsByDateRange(start, end);
    }

    setShowResetModal(false);
    setConfirmText('');
    setStartDate('');
    setEndDate('');
  };

  const getSessionsToDelete = () => {
    if (resetType === 'all') return sessions.length;
    if (resetType === 'day' && startDate) {
      const targetDate = parseLocalDate(startDate);
      return sessions.filter(s => {
        const sessionDate = new Date(s.date);
        return sessionDate.toDateString() === targetDate.toDateString();
      }).length;
    }
    if (resetType === 'range' && startDate && endDate) {
      const start = parseLocalDate(startDate);
      start.setHours(0, 0, 0, 0);
      const end = parseLocalDate(endDate);
      end.setHours(23, 59, 59, 999);
      return sessions.filter(s => {
        const d = new Date(s.date);
        return d >= start && d <= end;
      }).length;
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`bg-gradient-to-br ${card.color} rounded-2xl p-4 text-white shadow-lg`}
            >
              <div className="flex items-center gap-2 mb-3 opacity-90">
                <Icon size={18} />
                <span className="text-sm font-medium">{card.title}</span>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">
                  {formatTime(card.stats.totalTime)}
                </p>
                <p className="text-sm opacity-80">
                  {card.stats.sessionCount} session
                  {card.stats.sessionCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary-600 dark:text-primary-400" />
            Current Streak
          </h3>
          <div className="text-center py-4">
            <p className="text-5xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              {streakDays}
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              day{streakDays !== 1 ? 's' : ''} in a row
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Music size={20} className="text-primary-600 dark:text-primary-400" />
            Most Practiced
          </h3>
          {topItems.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-center py-4">
              No data yet
            </p>
          ) : (
            <div className="space-y-3">
              {topItems.map((item, index) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0
                        ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400'
                        : index === 1
                        ? 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                        : index === 2
                        ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-gray-800 dark:text-white font-medium truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.count} time{item.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Practice Summary
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <p className="text-3xl font-bold text-gray-800 dark:text-white">
              {allTimeStats.sessionCount}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Sessions</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <p className="text-3xl font-bold text-gray-800 dark:text-white">
              {allTimeStats.totalItems}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Items Practiced</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <p className="text-3xl font-bold text-gray-800 dark:text-white">
              {Math.floor(allTimeStats.totalTime / 3600000)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Hours</p>
          </div>
        </div>
      </div>

      {/* Reset History Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Trash2 size={20} className="text-red-500" />
          Reset History
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
          Delete practice session history. This action cannot be undone.
        </p>
        <button
          onClick={() => setShowResetModal(true)}
          disabled={sessions.length === 0}
          className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Reset History...
        </button>
      </div>

      {/* Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Reset History</h3>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  What to delete?
                </label>
                <select
                  value={resetType}
                  onChange={(e) => setResetType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All history ({sessions.length} sessions)</option>
                  <option value="day">Specific day</option>
                  <option value="range">Date range</option>
                </select>
              </div>

              {(resetType === 'day' || resetType === 'range') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {resetType === 'day' ? 'Select date' : 'Start date'}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              )}

              {resetType === 'range' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              )}

              {getSessionsToDelete() > 0 && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  This will delete {getSessionsToDelete()} session{getSessionsToDelete() !== 1 ? 's' : ''}.
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type DELETE to confirm
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setConfirmText('');
                  setStartDate('');
                  setEndDate('');
                }}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={confirmText !== 'DELETE' || getSessionsToDelete() === 0}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
