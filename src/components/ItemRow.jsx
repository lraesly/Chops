import { Edit2, Check, X, GripVertical, Clock, Hash, Paperclip, Archive, CheckCircle } from 'lucide-react';
import { formatTime } from '../hooks/useTimer';
import { CategoryBadge } from './CategoryBadge';
import { TagBadge } from './TagBadge';
import { CategorySelect } from './CategorySelect';
import { TagInput } from './TagInput';
import { AttachmentList } from './AttachmentList';

/**
 * Shared component for rendering a practice item row
 * Used by both PracticeItems and ItemsManager
 */
export function ItemRow({
  item,
  itemStats,
  isEditing,
  editingName,
  setEditingName,
  editingCategory,
  setEditingCategory,
  editingTags,
  setEditingTags,
  onSaveEdit,
  onCancelEdit,
  onStartEditing,
  isExpanded,
  onToggleExpanded,
  onArchive,
  onAttachment,
  onDeleteAttachment,
  userTags,
  onAddTag,
  // Session-related props (optional, for PracticeItems)
  showSessionControls = false,
  isInSession = false,
  isRecentlyAdded = false,
  onAddToSession,
  onRemoveFromSession,
  onClearRecentlyAdded,
  // Display options
  showDragHandle = false,
}) {
  const stats = itemStats?.[item.id];

  const renderStats = () => {
    if (!stats || stats.useCount === 0) return null;

    return (
      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <Hash size={12} />
          {stats.useCount}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {formatTime(stats.totalTime)}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl group hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
      <div className="flex items-center gap-2 p-3">
        {showDragHandle && (
          <GripVertical size={16} className="text-gray-300 dark:text-gray-500" />
        )}

        {isEditing ? (
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') onCancelEdit();
                  if (e.key === 'Enter') onSaveEdit();
                }}
                className="flex-1 px-2 py-1 border border-primary-300 dark:border-primary-500 rounded-lg bg-white dark:bg-gray-600 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
              <button
                onClick={onSaveEdit}
                className="p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
              >
                <Check size={18} />
              </button>
              <button
                onClick={onCancelEdit}
                className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <CategorySelect
                value={editingCategory}
                onChange={setEditingCategory}
                className="w-auto"
              />
              <div className="flex-1 min-w-[200px]">
                <TagInput
                  selectedTags={editingTags}
                  allTags={userTags}
                  onChange={setEditingTags}
                  onCreateTag={onAddTag}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div
              className="flex-1 cursor-pointer"
              onClick={onToggleExpanded}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-700 dark:text-gray-200">{item.name}</span>
                {item.category && <CategoryBadge categoryId={item.category} />}
                {item.tags?.map(tag => (
                  <TagBadge key={tag} tag={tag} />
                ))}
                {item.attachments?.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Paperclip size={12} />
                    {item.attachments.length}
                  </span>
                )}
              </div>
              {renderStats()}
            </div>

            {/* Session controls */}
            {showSessionControls && (
              <>
                {isInSession || isRecentlyAdded ? (
                  <button
                    onClick={onRemoveFromSession}
                    onMouseLeave={onClearRecentlyAdded}
                    className={`group/btn px-3 py-1 text-sm bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-lg flex items-center gap-1 transition-colors w-[90px] justify-center ${
                      !isRecentlyAdded ? 'hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-700 dark:hover:text-red-300' : ''
                    }`}
                    title="Remove from session"
                  >
                    <span className={`flex items-center gap-1 ${!isRecentlyAdded ? 'group-hover/btn:hidden' : ''}`}>
                      <CheckCircle size={14} />
                      Added
                    </span>
                    {!isRecentlyAdded && (
                      <span className="hidden items-center gap-1 group-hover/btn:flex">
                        <X size={14} />
                        Remove
                      </span>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={onAddToSession}
                    className="px-3 py-1 text-sm bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/60 transition-colors"
                  >
                    Add to Session
                  </button>
                )}
              </>
            )}

            {/* Action buttons */}
            <button
              onClick={onAttachment}
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              title="Add attachment"
            >
              <Paperclip size={16} />
            </button>
            <button
              onClick={onStartEditing}
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              title="Edit item"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={onArchive}
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-orange-600 dark:hover:text-orange-400"
              title="Archive item"
            >
              <Archive size={16} />
            </button>
          </>
        )}
      </div>

      {/* Expanded section for attachments */}
      {isExpanded && !isEditing && item.attachments?.length > 0 && (
        <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-600 pt-2">
          <AttachmentList
            attachments={item.attachments}
            onDelete={(attachmentId) => onDeleteAttachment(item.id, attachmentId)}
          />
        </div>
      )}
    </div>
  );
}
