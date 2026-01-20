import { useMemo } from 'react';
import { Archive as ArchiveIcon, RotateCcw, Trash2, Clock, Hash } from 'lucide-react';
import { formatTime } from '../hooks/useTimer';

export function Archive({ archivedItems, sessions, onRestoreItem, onDeleteArchivedItem }) {
  // Calculate stats for each item from session history
  const itemStats = useMemo(() => {
    const stats = {};
    sessions.forEach((session) => {
      session.items.forEach((sessionItem) => {
        if (!stats[sessionItem.id]) {
          stats[sessionItem.id] = { totalTime: 0, useCount: 0 };
        }
        stats[sessionItem.id].totalTime += sessionItem.time || 0;
        stats[sessionItem.id].useCount += 1;
      });
    });
    return stats;
  }, [sessions]);

  const formatArchivedDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderItemStats = (itemId) => {
    const stats = itemStats[itemId] || { totalTime: 0, useCount: 0 };

    return (
      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
        <span className="flex items-center gap-1">
          <Hash size={12} />
          {stats.useCount} session{stats.useCount !== 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {formatTime(stats.totalTime)} total
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg">
            <ArchiveIcon className="text-orange-600 dark:text-orange-400" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Archived Items</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {archivedItems.length} item{archivedItems.length !== 1 ? 's' : ''} archived
            </p>
          </div>
        </div>

        {archivedItems.length === 0 ? (
          <div className="text-center py-12">
            <ArchiveIcon className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
            <p className="text-gray-400 dark:text-gray-500">No archived items</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              Archive practice items you no longer use regularly
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {archivedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-700 dark:text-gray-200">{item.name}</h3>
                  {renderItemStats(item.id)}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Archived {formatArchivedDate(item.archivedAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onRestoreItem(item)}
                    className="flex items-center gap-1 px-3 py-2 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors text-sm"
                  >
                    <RotateCcw size={16} />
                    Restore
                  </button>
                  <button
                    onClick={() => onDeleteArchivedItem(item.id)}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Delete permanently"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
