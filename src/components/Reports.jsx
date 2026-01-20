import { useMemo } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { formatTime } from '../hooks/useTimer';

export function Reports({ sessions }) {
  // Get the last 30 days
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

  // Map sessions to dates
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
      map[key].totalTime += session.totalTime || 0;
    });
    return map;
  }, [sessions]);

  // Calculate stats for the period
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

  // Get day name abbreviation
  const getDayName = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
  };

  // Get intensity class based on practice time
  const getIntensityClass = (dateKey) => {
    const data = practiceByDate[dateKey];
    if (!data) return 'bg-gray-100 dark:bg-gray-700';

    const minutes = data.totalTime / 60;
    if (minutes >= 60) return 'bg-primary-600 dark:bg-primary-500';
    if (minutes >= 30) return 'bg-primary-400 dark:bg-primary-400';
    if (minutes >= 15) return 'bg-primary-300 dark:bg-primary-300';
    return 'bg-primary-200 dark:bg-primary-200';
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
            <Calendar className="text-primary-600 dark:text-primary-400" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Practice Calendar</h2>
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
        <div className="mb-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-center text-xs text-gray-400 dark:text-gray-500 font-medium">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-1">
            {/* Add empty cells for alignment to start on correct day of week */}
            {Array.from({ length: last30Days[0].getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {last30Days.map((date) => {
              const dateKey = date.toISOString().split('T')[0];
              const data = practiceByDate[dateKey];
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={dateKey}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors cursor-default ${getIntensityClass(dateKey)} ${
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

        {/* Legend */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Less</span>
          <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-700" />
          <div className="w-4 h-4 rounded bg-primary-200 dark:bg-primary-200" />
          <div className="w-4 h-4 rounded bg-primary-300 dark:bg-primary-300" />
          <div className="w-4 h-4 rounded bg-primary-400 dark:bg-primary-400" />
          <div className="w-4 h-4 rounded bg-primary-600 dark:bg-primary-500" />
          <span>More</span>
        </div>

        {/* Consistency message */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {stats.streakPercentage >= 80 ? (
              <span className="text-green-600 dark:text-green-400">🎉 Amazing! You practiced {stats.streakPercentage}% of the last 30 days!</span>
            ) : stats.streakPercentage >= 50 ? (
              <span className="text-primary-600 dark:text-primary-400">👍 Good work! You practiced {stats.streakPercentage}% of the last 30 days.</span>
            ) : stats.streakPercentage > 0 ? (
              <span>You practiced {stats.streakPercentage}% of the last 30 days. Keep it up!</span>
            ) : (
              <span>No practice sessions in the last 30 days. Start today!</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
