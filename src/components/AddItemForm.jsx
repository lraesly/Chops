import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { CategorySelect } from './CategorySelect';
import { TagInput } from './TagInput';

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
  onAddItem,
  userTags,
  onAddTag,
}) {
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
          title="Add category/tags"
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
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
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
        </div>
      )}
    </div>
  );
}
