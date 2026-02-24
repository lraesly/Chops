import { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, Paperclip, X, Link as LinkIcon, FileText } from 'lucide-react';
import { CategorySelect } from './CategorySelect';
import { TagInput } from './TagInput';
import { AttachmentModal } from './AttachmentModal';

/**
 * Shared component for adding new practice items
 * Used by both PracticeItems and ItemsManager
 */
export function AddItemForm({
  newItemName,
  setNewItemName,
  newItemCategory,
  setNewItemCategory,
  newItemTags,
  setNewItemTags,
  showNewItemOptions,
  setShowNewItemOptions,
  newItemAttachments,
  onAddAttachment,
  onRemoveAttachment,
  onAddItem,
  userTags,
  onAddTag,
}) {
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !showNewItemOptions) {
      onAddItem();
    }
  };

  return (
    <div className="space-y-2 mb-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add new practice item..."
          className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <button
          onClick={() => setShowNewItemOptions(!showNewItemOptions)}
          className={`px-3 py-2 rounded-xl transition-colors ${
            showNewItemOptions
              ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          title="Add category/tags/attachments"
        >
          {showNewItemOptions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        <button
          onClick={onAddItem}
          disabled={!newItemName.trim()}
          className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      {showNewItemOptions && (
        <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex flex-wrap gap-2">
            <CategorySelect
              value={newItemCategory}
              onChange={setNewItemCategory}
              className="w-auto"
            />
            <div className="flex-1 min-w-[200px]">
              <TagInput
                selectedTags={newItemTags}
                allTags={userTags}
                onChange={setNewItemTags}
                onCreateTag={onAddTag}
              />
            </div>
            <button
              onClick={() => setShowAttachmentModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors"
              title="Add link or PDF"
            >
              <Paperclip size={16} />
              Attach
            </button>
          </div>

          {newItemAttachments && newItemAttachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {newItemAttachments.map((a) => (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg"
                >
                  {a.type === 'link' ? <LinkIcon size={14} /> : <FileText size={14} />}
                  {a.name}
                  <button
                    onClick={() => onRemoveAttachment(a.id)}
                    className="ml-0.5 p-0.5 hover:text-red-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <AttachmentModal
        isOpen={showAttachmentModal}
        onClose={() => setShowAttachmentModal(false)}
        onSave={onAddAttachment}
      />
    </div>
  );
}
