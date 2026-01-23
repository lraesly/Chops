import { useState, useMemo } from 'react';
import {
  Clock, Music, Calendar, TrendingUp, Tag, Filter,
  BarChart3, Hash, ChevronDown, X
} from 'lucide-react';
import { formatTime } from '../hooks/useTimer';
import { CATEGORIES, getCategoryById, getCategoryColor } from '../constants/categories';

export function Stats({ sessions, practiceItems, userTags }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTag, setSelectedTag] = useState(null);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  // Get all unique tags from practice items and sessions
  const allTags = useMemo(() => {
    const tagSet = new Set(userTags);
    practiceItems.forEach(item => {
      item.tags?.forEach(tag => tagSet.add(tag));
    });
    sessions.forEach(session => {
      session.items.forEach(item => {
        // Items in sessions may have tags stored
        if (item.tags) {
          item.tags.forEach(tag => tagSet.add(tag));
        }
      });
    });
    return Array.from(tagSet).sort();
  }, [userTags, practiceItems, sessions]);

  // Filter sessions by selected tag
  const filteredSessions = useMemo(() => {
    if (!selectedTag) return sessions;

    return sessions.map(session => {
      // Filter items within each session that have the selected tag
      const matchingItems = session.items.filter(sessionItem => {
        // Find the practice item to check its tags
        const practiceItem = practiceItems.find(p => p.id === sessionItem.id);
        return practiceItem?.tags?.includes(selectedTag);
      });

      if (matchingItems.length === 0) return null;

      // Calculate filtered duration based on matching items
      const filteredDuration = matchingItems.reduce((sum, item) => sum + (item.time || 0), 0);

      return {
        ...session,
        items: matchingItems,
        duration: filteredDuration,
      };
    }).filter(Boolean);
  }, [sessions, selectedTag, practiceItems]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'items', label: 'Items', icon: Music },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Tag Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Statistics</h2>

          {/* Tag Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowTagDropdown(!showTagDropdown)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${
                selectedTag
                  ? 'bg-primary-100 dark:bg-primary-900/40 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200'
              }`}
            >
              <Filter size={16} />
              <span>{selectedTag || 'All Tags'}</span>
              <ChevronDown size={16} className={`transition-transform ${showTagDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showTagDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowTagDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-20 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => {
                      setSelectedTag(null);
                      setShowTagDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      !selectedTag ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    All Tags
                  </button>
                  {allTags.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      {allTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => {
                            setSelectedTag(tag);
                            setShowTagDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            selectedTag === tag ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-200'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                  {allTags.length === 0 && (
                    <p className="px-4 py-2 text-gray-400 dark:text-gray-500 text-sm">No tags yet</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Selected Tag Indicator */}
        {selectedTag && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Filtered by:</span>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full text-sm">
              <Tag size={12} />
              {selectedTag}
              <button
                onClick={() => setSelectedTag(null)}
                className="ml-1 hover:text-primary-900 dark:hover:text-primary-100"
              >
                <X size={14} />
              </button>
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab
          sessions={filteredSessions}
          allSessions={sessions}
          practiceItems={practiceItems}
          selectedTag={selectedTag}
          userTags={allTags}
          onSelectTag={setSelectedTag}
        />
      )}
      {activeTab === 'calendar' && (
        <CalendarTab sessions={filteredSessions} selectedTag={selectedTag} />
      )}
      {activeTab === 'categories' && (
        <CategoriesTab
          sessions={filteredSessions}
          practiceItems={practiceItems}
          selectedTag={selectedTag}
        />
      )}
      {activeTab === 'items' && (
        <ItemsTab
          sessions={filteredSessions}
          practiceItems={practiceItems}
          selectedTag={selectedTag}
        />
      )}
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ sessions, allSessions, practiceItems, selectedTag, userTags, onSelectTag }) {
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

  const thisWeekSessions = sessions.filter(s => new Date(s.date) >= weekStart);
  const thisMonthSessions = sessions.filter(s => new Date(s.date) >= monthStart);
  const thisYearSessions = sessions.filter(s => new Date(s.date) >= yearStart);

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
    { title: 'This Week', stats: weekStats, color: 'from-blue-500 to-blue-600', icon: Calendar },
    { title: 'This Month', stats: monthStats, color: 'from-primary-500 to-primary-600', icon: Calendar },
    { title: 'This Year', stats: yearStats, color: 'from-purple-500 to-purple-600', icon: TrendingUp },
    { title: 'All Time', stats: allTimeStats, color: 'from-pink-500 to-rose-600', icon: Clock },
  ];

  // Calculate streak (using all sessions, not filtered)
  const getStreakDays = () => {
    if (allSessions.length === 0) return 0;

    const sortedDates = [...new Set(
      allSessions.map((s) => new Date(s.date).toDateString())
    )].sort((a, b) => new Date(b) - new Date(a));

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const dateStr of sortedDates) {
      const sessionDate = new Date(dateStr);
      sessionDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((currentDate - sessionDate) / (1000 * 60 * 60 * 24));
      if (diffDays === streak) {
        streak++;
      } else if (diffDays > streak) {
        break;
      }
    }
    return streak;
  };

  const streakDays = getStreakDays();

  // Calculate top tags by time this month
  const topTagsThisMonth = useMemo(() => {
    const tagTime = {};
    thisMonthSessions.forEach(session => {
      session.items.forEach(sessionItem => {
        const practiceItem = practiceItems.find(p => p.id === sessionItem.id);
        if (practiceItem?.tags) {
          practiceItem.tags.forEach(tag => {
            if (!tagTime[tag]) tagTime[tag] = 0;
            tagTime[tag] += sessionItem.time || 0;
          });
        }
      });
    });
    return Object.entries(tagTime)
      .map(([tag, time]) => ({ tag, time }))
      .sort((a, b) => b.time - a.time)
      .slice(0, 5);
  }, [thisMonthSessions, practiceItems]);

  return (
    <div className="space-y-6">
      {/* Time Period Cards */}
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
                <p className="text-2xl font-bold">{formatTime(card.stats.totalTime)}</p>
                <p className="text-sm opacity-80">
                  {card.stats.sessionCount} session{card.stats.sessionCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Current Streak */}
        {!selectedTag && (
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
        )}

        {/* Top Tags This Month */}
        <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 ${selectedTag ? 'md:col-span-2' : ''}`}>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Tag size={20} className="text-primary-600 dark:text-primary-400" />
            Top Tags This Month
          </h3>
          {topTagsThisMonth.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-center py-4">
              No tagged practice this month
            </p>
          ) : (
            <div className="space-y-3">
              {topTagsThisMonth.map((item, index) => (
                <button
                  key={item.tag}
                  onClick={() => onSelectTag(item.tag)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400'
                    : index === 1 ? 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                    : index === 2 ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-gray-800 dark:text-white font-medium">{item.tag}</p>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatTime(item.time)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Practice Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Practice Summary {selectedTag && `- "${selectedTag}"`}
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
    </div>
  );
}

// Calendar Tab Component
function CalendarTab({ sessions, selectedTag }) {
  const last30Days = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  }, []);

  const practiceByDate = useMemo(() => {
    const map = {};
    sessions.forEach((session) => {
      const date = new Date(session.date);
      date.setHours(0, 0, 0, 0);
      const key = date.toISOString().split('T')[0];
      if (!map[key]) {
        map[key] = { count: 0, totalTime: 0 };
      }
      map[key].count += 1;
      map[key].totalTime += session.duration || 0;
    });
    return map;
  }, [sessions]);

  const stats = useMemo(() => {
    let daysWithPractice = 0;
    let totalTime = 0;
    let totalSessions = 0;

    last30Days.forEach((date) => {
      const key = date.toISOString().split('T')[0];
      if (practiceByDate[key]) {
        daysWithPractice++;
        totalTime += practiceByDate[key].totalTime;
        totalSessions += practiceByDate[key].count;
      }
    });

    return {
      daysWithPractice,
      totalTime,
      totalSessions,
      streakPercentage: Math.round((daysWithPractice / 30) * 100),
    };
  }, [last30Days, practiceByDate]);

  const getIntensityClass = (dateKey) => {
    const data = practiceByDate[dateKey];
    if (!data) return 'bg-gray-100 dark:bg-gray-700';
    const minutes = data.totalTime / 60000;
    if (minutes >= 60) return 'bg-primary-600 dark:bg-primary-500';
    if (minutes >= 30) return 'bg-primary-400 dark:bg-primary-400';
    if (minutes >= 15) return 'bg-primary-300 dark:bg-primary-300';
    return 'bg-primary-200 dark:bg-primary-200';
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
          <Calendar className="text-primary-600 dark:text-primary-400" size={24} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Practice Calendar {selectedTag && `- "${selectedTag}"`}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last 30 days of practice activity
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {stats.daysWithPractice}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Days Practiced</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {stats.totalSessions}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Sessions</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {formatTime(stats.totalTime)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Time</p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="mb-4 flex justify-center">
        <div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="w-8 h-5 flex items-center justify-center text-xs text-gray-400 dark:text-gray-500 font-medium">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: last30Days[0].getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="w-8 h-8" />
            ))}

            {last30Days.map((date) => {
              const dateKey = date.toISOString().split('T')[0];
              const data = practiceByDate[dateKey];
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={dateKey}
                  className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium transition-colors cursor-default ${getIntensityClass(dateKey)} ${
                    isToday ? 'ring-2 ring-primary-500 ring-offset-1 dark:ring-offset-gray-800' : ''
                  } ${data ? 'text-white dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}
                  title={`${formatDate(date)}${data ? ` - ${formatTime(data.totalTime)} (${data.count} session${data.count > 1 ? 's' : ''})` : ' - No practice'}`}
                >
                  {date.getDate()}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-700" />
        <div className="w-3 h-3 rounded-sm bg-primary-200 dark:bg-primary-200" />
        <div className="w-3 h-3 rounded-sm bg-primary-300 dark:bg-primary-300" />
        <div className="w-3 h-3 rounded-sm bg-primary-400 dark:bg-primary-400" />
        <div className="w-3 h-3 rounded-sm bg-primary-600 dark:bg-primary-500" />
        <span>More</span>
      </div>

      {/* Consistency message */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {stats.streakPercentage >= 80 ? (
            <span className="text-green-600 dark:text-green-400">Amazing! You practiced {stats.streakPercentage}% of the last 30 days!</span>
          ) : stats.streakPercentage >= 50 ? (
            <span className="text-primary-600 dark:text-primary-400">Good work! You practiced {stats.streakPercentage}% of the last 30 days.</span>
          ) : stats.streakPercentage > 0 ? (
            <span>You practiced {stats.streakPercentage}% of the last 30 days. Keep it up!</span>
          ) : (
            <span>No practice sessions in the last 30 days. Start today!</span>
          )}
        </p>
      </div>
    </div>
  );
}

// Categories Tab Component
function CategoriesTab({ sessions, practiceItems, selectedTag }) {
  const categoryStats = useMemo(() => {
    const stats = {};

    // Initialize all categories
    CATEGORIES.forEach(cat => {
      stats[cat.id] = { totalTime: 0, sessionCount: 0, itemCount: 0 };
    });
    stats['uncategorized'] = { totalTime: 0, sessionCount: 0, itemCount: 0 };

    sessions.forEach(session => {
      session.items.forEach(sessionItem => {
        const practiceItem = practiceItems.find(p => p.id === sessionItem.id);
        const category = practiceItem?.category || 'uncategorized';

        stats[category].totalTime += sessionItem.time || 0;
        stats[category].sessionCount += 1;
      });
    });

    // Count unique items per category
    const itemsByCategory = {};
    practiceItems.forEach(item => {
      const category = item.category || 'uncategorized';
      if (!itemsByCategory[category]) itemsByCategory[category] = new Set();
      itemsByCategory[category].add(item.id);
    });
    Object.entries(itemsByCategory).forEach(([cat, items]) => {
      if (stats[cat]) stats[cat].itemCount = items.size;
    });

    return stats;
  }, [sessions, practiceItems]);

  const totalTime = Object.values(categoryStats).reduce((sum, s) => sum + s.totalTime, 0);

  const sortedCategories = useMemo(() => {
    const categories = CATEGORIES.map(cat => ({
      ...cat,
      ...categoryStats[cat.id],
      percentage: totalTime > 0 ? Math.round((categoryStats[cat.id].totalTime / totalTime) * 100) : 0,
    })).filter(cat => cat.totalTime > 0);

    // Add uncategorized if it has time
    if (categoryStats['uncategorized'].totalTime > 0) {
      categories.push({
        id: 'uncategorized',
        label: 'Uncategorized',
        color: 'gray',
        ...categoryStats['uncategorized'],
        percentage: Math.round((categoryStats['uncategorized'].totalTime / totalTime) * 100),
      });
    }

    return categories.sort((a, b) => b.totalTime - a.totalTime);
  }, [categoryStats, totalTime]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
          <Tag className="text-primary-600 dark:text-primary-400" size={24} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Time by Category {selectedTag && `- "${selectedTag}"`}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Breakdown of practice time across categories
          </p>
        </div>
      </div>

      {sortedCategories.length === 0 ? (
        <p className="text-gray-400 dark:text-gray-500 text-center py-8">
          No categorized practice data yet
        </p>
      ) : (
        <div className="space-y-4">
          {/* Visual bar chart */}
          <div className="space-y-3">
            {sortedCategories.map(category => {
              const colors = getCategoryColor(category.id);
              return (
                <div key={category.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {category.label}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTime(category.totalTime)} ({category.percentage}%)
                    </span>
                  </div>
                  <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${colors.bg.replace('bg-', 'bg-').replace('/40', '')}`}
                      style={{
                        width: `${category.percentage}%`,
                        backgroundColor: category.id === 'uncategorized' ? undefined : undefined,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed stats */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">Details</h4>
            <div className="space-y-2">
              {sortedCategories.map(category => {
                const colors = getCategoryColor(category.id);
                return (
                  <div
                    key={category.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${colors.bg}`}
                  >
                    <span className={`font-medium ${colors.text}`}>{category.label}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={colors.text}>
                        <Hash size={12} className="inline mr-1" />
                        {category.sessionCount} times
                      </span>
                      <span className={colors.text}>
                        <Clock size={12} className="inline mr-1" />
                        {formatTime(category.totalTime)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Items Tab Component
function ItemsTab({ sessions, practiceItems, selectedTag }) {
  const [sortBy, setSortBy] = useState('time'); // 'time', 'count', 'recent'

  const itemStats = useMemo(() => {
    const stats = {};

    sessions.forEach(session => {
      session.items.forEach(sessionItem => {
        if (!stats[sessionItem.id]) {
          stats[sessionItem.id] = {
            id: sessionItem.id,
            name: sessionItem.name,
            totalTime: 0,
            count: 0,
            lastPracticed: null,
          };
        }
        stats[sessionItem.id].totalTime += sessionItem.time || 0;
        stats[sessionItem.id].count += 1;

        const sessionDate = new Date(session.date);
        if (!stats[sessionItem.id].lastPracticed || sessionDate > stats[sessionItem.id].lastPracticed) {
          stats[sessionItem.id].lastPracticed = sessionDate;
        }
      });
    });

    // Enrich with practice item data
    Object.values(stats).forEach(stat => {
      const practiceItem = practiceItems.find(p => p.id === stat.id);
      if (practiceItem) {
        stat.category = practiceItem.category;
        stat.tags = practiceItem.tags;
      }
    });

    return Object.values(stats);
  }, [sessions, practiceItems]);

  const sortedItems = useMemo(() => {
    const items = [...itemStats];
    switch (sortBy) {
      case 'time':
        return items.sort((a, b) => b.totalTime - a.totalTime);
      case 'count':
        return items.sort((a, b) => b.count - a.count);
      case 'recent':
        return items.sort((a, b) => (b.lastPracticed || 0) - (a.lastPracticed || 0));
      default:
        return items;
    }
  }, [itemStats, sortBy]);

  // Items not practiced in 30+ days
  const neglectedItems = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return practiceItems.filter(item => {
      if (selectedTag && !item.tags?.includes(selectedTag)) return false;
      const stat = itemStats.find(s => s.id === item.id);
      if (!stat) return true; // Never practiced
      return stat.lastPracticed < thirtyDaysAgo;
    });
  }, [practiceItems, itemStats, selectedTag]);

  const formatLastPracticed = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
              <Music className="text-primary-600 dark:text-primary-400" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Practice Items {selectedTag && `- "${selectedTag}"`}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {sortedItems.length} items practiced
              </p>
            </div>
          </div>

          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200"
          >
            <option value="time">Sort by Time</option>
            <option value="count">Sort by Count</option>
            <option value="recent">Sort by Recent</option>
          </select>
        </div>

        {sortedItems.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500 text-center py-8">
            No practice data yet
          </p>
        ) : (
          <div className="space-y-2">
            {sortedItems.slice(0, 20).map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400'
                  : index === 1 ? 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                  : index === 2 ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400'
                  : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                }`}>
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 dark:text-white truncate">{item.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Last: {formatLastPracticed(item.lastPracticed)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {formatTime(item.totalTime)}
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

      {/* Neglected Items */}
      {neglectedItems.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Clock size={20} className="text-orange-500" />
            Needs Attention
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Items not practiced in 30+ days
          </p>
          <div className="flex flex-wrap gap-2">
            {neglectedItems.slice(0, 10).map(item => (
              <span
                key={item.id}
                className="px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg text-sm"
              >
                {item.name}
              </span>
            ))}
            {neglectedItems.length > 10 && (
              <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm">
                +{neglectedItems.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
