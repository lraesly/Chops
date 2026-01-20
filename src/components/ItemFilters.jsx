import { Filter, X } from 'lucide-react';
import { CategorySelect } from './CategorySelect';
import { TagBadge } from './TagBadge';

export function ItemFilters({
  filterCategory,
  setFilterCategory,
  filterTags,
  setFilterTags,
  allTags = [],
  showFilters,
  setShowFilters
}) {
  const hasActiveFilters = filterCategory || filterTags.length > 0;

  const handleRemoveTag = (tag) => {
    setFilterTags(filterTags.filter(t => t !== tag));
  };

  const handleAddTag = (tag) => {
    if (!filterTags.includes(tag)) {
      setFilterTags([...filterTags, tag]);
    }
  };

  const clearFilters = () => {
    setFilterCategory(null);
    setFilterTags([]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
            hasActiveFilters
              ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <Filter size={16} />
          Filters
          {hasActiveFilters && (
            <span className="bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              {(filterCategory ? 1 : 0) + filterTags.length}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            Clear all
          </button>
        )}
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <CategorySelect
            value={filterCategory}
            onChange={setFilterCategory}
            includeAll
            className="w-auto"
          />

          {allTags.length > 0 && (
            <select
              value=""
              onChange={(e) => e.target.value && handleAddTag(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="">Add tag filter...</option>
              {allTags
                .filter(tag => !filterTags.includes(tag))
                .map(tag => (
                  <option key={tag} value={tag}>#{tag}</option>
                ))}
            </select>
          )}

          {filterTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {filterTags.map(tag => (
                <TagBadge key={tag} tag={tag} onRemove={handleRemoveTag} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
